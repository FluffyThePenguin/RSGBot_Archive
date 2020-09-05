import snoowrap, { Comment, Listing, PrivateMessage, Submission } from "snoowrap";
import { injectAll, singleton } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";
import CommandParser from "./shared/commands/CommandParser";
import Configuration from "./shared/configuration/Configuration";
import Feature from "./shared/features/Feature";
import Logger from "./shared/logging/Logger";

// TODO
// - Comments get skipped some times. Seems it's a Reddit issue - https://github.com/praw-dev/praw/issues/1043. Solution would be to forget about "before"s -
//   just retreive max number of comments each loop, discard those that've been processed (keep fullnames in memory). This is what Reddit.Net does and what
//   Praw is considering - https://github.com/praw-dev/praw/pull/1050.
// - avoid allocations where possible
@singleton()
export default class Application {
    constructor(@injectAll(Feature as constructor<Feature>) private readonly _features: Feature[],
        private readonly _commandParser: CommandParser,
        private readonly _logger: Logger,
        private readonly _snoowrap: snoowrap,
        private readonly _configuration: Configuration) { }

    /**
     * Starts polling.
     */
    public async start(): Promise<void> {
        // Convenience
        const subredditName = this._configuration.subreddit;
        const snoowrap = this._snoowrap;
        const logger = this._logger;

        // Prepend log calls
        logger.setTag(Application.name);

        // Start requests for initialization info
        const getMePromise = snoowrap.getMe();
        const latestCommentPromise = snoowrap.getNewComments(subredditName, { limit: 1 });
        const latestSubmissionPromise = snoowrap.getNew(subredditName, { limit: 1 });
        // TODO snoowrap typings for getInbox are wrong
        // @ts-ignore
        const latestMessagePromise = snoowrap.getInbox({ limit: 1 }); // Note that inbox messages include both comments and private messages

        // Wait for initialization requests
        const values = await Promise.all([getMePromise, latestCommentPromise, latestSubmissionPromise, latestMessagePromise]);

        // Set bot username
        const botUsername = values[0].name;
        logger.info(`Initializing - bot username = ${botUsername}`);

        // Before values
        // - When we request a listing (https://www.reddit.com/dev/api/#listings) of "things" (comments/posts/etc) we can specify a
        //  "before" string representing a thing. Only things created after it are returned.
        // - When the app starts, we set our before string to the latest thing's fullname (https://www.reddit.com/dev/api/#fullnames).
        //   Otherwise we could end up retrieving things we've already processed. Consider a cleaner solution > e.g. after successfully processing a thing,
        //   store its fullname in persistent memory.
        // - API ignores the before string if it's an empty string.
        const commentsBefore = this.getInitialBefore(values[1], 'comment');
        const submissionsBefore = this.getInitialBefore(values[2], 'submission');
        const messagesBefore = this.getInitialBefore(values[3], 'message');

        // Call init
        for (const feature of this._features) {
            await feature.onInitCore();
        }

        // Start polling
        await this.poll(commentsBefore, submissionsBefore, messagesBefore, botUsername, subredditName);
    }

    private async poll(commentsBefore: string, submissionsBefore: string, messagesBefore: string, botUsername: string, subredditName: string): Promise<void> {
        const snoowrap = this._snoowrap;
        const logger = this._logger;

        while (true) { // TODO add flag for graceful shutdown
            try {
                logger.info(`Retrieving comments before: ${commentsBefore}, submissions before: ${submissionsBefore} and messages before: ${messagesBefore}`);

                // Request new comments and submissions
                const newCommentsPromise = snoowrap.getNewComments(subredditName, { before: commentsBefore, limit: 100 });
                const newSubmissionsPromise = snoowrap.getNew(subredditName, { before: submissionsBefore, limit: 100 });
                // TODO snoowrap typings for getInbox are wrong
                // @ts-ignore
                const newMessagesPromise = snoowrap.getInbox({ before: messagesBefore, limit: 100 });

                // Wait for new comments, submissions and messages
                const newThings = await Promise.all([newCommentsPromise, newSubmissionsPromise, newMessagesPromise]);

                // Process new things            
                const befores = await Promise.all([this.processNewComments(newThings[0], botUsername),
                this.processNewSubmissions(newThings[1], botUsername),
                this.processNewPrivateMessages(newThings[2], botUsername)]);

                commentsBefore = befores[0] ?? commentsBefore;
                submissionsBefore = befores[1] ?? submissionsBefore;
                messagesBefore = befores[2] ?? messagesBefore;

                await this.sleep(6000);
            } catch (error) {
                logger.error(error.toString());
            }
        }
    }

    private async processNewPrivateMessages(newMessages: Listing<PrivateMessage | Comment>, botUsername: string): Promise<string> {
        if (!this.containsNew(newMessages, 'messages')) {
            return null;
        }

        const features = this._features;
        const commandParser = this._commandParser;
        const logger = this._logger;
        const onPrivateMessageCorePromises: Promise<void>[] = [];

        for (const message of newMessages) {
            // Depending on account settings, messages may include comments
            // TODO snoowrap adds a was_comment property to each object in the listing but this isn't reflected in its .d.ts
            // @ts-ignore
            if (message.was_comment) {
                logger.info(`Ignoring comment message - we recommend disabling reddit.com/settings/notifications > "Conversations in inbox"`);
                continue;
            }

            // Ignore own private messages
            if (message.author.name === botUsername) {
                logger.info(`Ignoring own private message`);
                continue;
            }

            // Ignore messages distinguished as admin. Attempting to respond to such messages causes 403s.
            if (message.distinguished === 'admin') {
                logger.info(`Ignoring admin message`);
                continue;
            }

            const command = commandParser.tryParse(message.body);
            let numOnPrivateMessageCorePromises = 0;

            for (const feature of features) {
                onPrivateMessageCorePromises[numOnPrivateMessageCorePromises++] = feature.onPrivateMessageCore(message as PrivateMessage, command); // was_comment false so it's a private message
            }

            await Promise.all(onPrivateMessageCorePromises); // await here (instead of after this for loop) so private message are handled sequentially
        }

        return newMessages[newMessages.length - 1].name;
    }

    private async processNewSubmissions(newSubmissions: Listing<snoowrap.Submission>, botUsername: string): Promise<string> {
        if (!this.containsNew(newSubmissions, 'submissions')) {
            return null;
        }

        const features = this._features;
        const logger = this._logger;
        const onSubmissionCorePromises: Promise<void>[] = [];

        for (const submission of newSubmissions) {
            // Ignore own submissions
            if (submission.author.name === botUsername) {
                logger.info(`Ignoring own submission`);

                continue;
            }

            let numOnSubmissionCorePromises = 0;

            for (const feature of features) {
                onSubmissionCorePromises[numOnSubmissionCorePromises++] = feature.onSubmissionCore(submission);
            }

            await Promise.all(onSubmissionCorePromises);
        }

        return newSubmissions[newSubmissions.length - 1].name;
    }

    private async processNewComments(newComments: Listing<Comment>, botUsername: string): Promise<string> {
        if (!this.containsNew(newComments, 'comments')) {
            return null;
        }

        const features = this._features;
        const commandParser = this._commandParser;
        const logger = this._logger;
        const onCommentCorePromises: Promise<void>[] = [];

        for (const comment of newComments) {
            // Ignore own comments
            if (comment.author.name === botUsername) {
                logger.info(`Ignoring own comment`);

                continue;
            }

            const command = commandParser.tryParse(comment.body);
            let numOnCommentCorePromises = 0;

            for (const feature of features) {
                onCommentCorePromises[numOnCommentCorePromises++] = feature.onCommentCore(comment, command);
            }

            await Promise.all(onCommentCorePromises);
        }

        return newComments[newComments.length - 1].name;
    }

    private containsNew<T>(listing: Listing<T>, thingName: string): boolean {
        const numNew = listing.length;
        const foundNew = numNew > 0;

        if (foundNew) {
            this._logger.info(`${numNew} new ${thingName} found`);

            return true;
        }

        this._logger.info(`No new ${thingName}`);

        return false;
    }

    private getInitialBefore(listing: Listing<Comment> | Listing<Submission> | Listing<PrivateMessage | Comment> | null, thingName: string): string {
        if (listing == null) {
            return '';
        }

        const result = listing[0]?.name ?? '';
        this._logger.info(`Initializaing - latest ${thingName} fullname = ${result}`);

        return result;
    }

    private sleep(timeMilliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(() => resolve(), timeMilliseconds));
    }
}