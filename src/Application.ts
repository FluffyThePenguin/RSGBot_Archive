import snoowrap, { Comment, Listing, PrivateMessage, Submission } from "snoowrap";
import { inject, injectable, injectAll, singleton } from "tsyringe";
import Configuration from "./shared/Configuration";
import ICommandParser from "./shared/ICommandParser";
import ICommentFeature from "./shared/ICommentFeature";
import IFeature from "./shared/IFeature";
import ILogger from "./shared/ILogger";
import IPrivateMessageFeature from "./shared/IPrivateMessageFeature";
import ISubmissionFeature from "./shared/ISubmissionFeature";

// TODO
// - Comments get skipped some times. Seems it's a Reddit issue - https://github.com/praw-dev/praw/issues/1043. Solution would be to forget about "before"s -
//   just retreive max number of comments each loop, discard those that've been processed (keep fullnames in memory). This is what Reddit.Net does and what
//   Praw is considering - https://github.com/praw-dev/praw/pull/1050.
// - improve poll method efficiency
//   - Promise.any so all requests in features run concurrently
// - avoid allocations where possible
@singleton()
@injectable()
export default class Application {
    private readonly _applicationInitializationTag = 'ApplicationInitialization';
    private readonly _applicationTag = 'Application';
    private readonly _resolvedNullPromise = Promise.resolve(null);

    constructor(@injectAll('ICommentFeature') private readonly _commentFeatures: ICommentFeature[],
        @injectAll('ISubmissionFeature') private readonly _submissionFeatures: ISubmissionFeature[],
        @injectAll('IPrivateMessageFeature') private readonly _privateMessageFeatures: IPrivateMessageFeature[],
        @injectAll('IFeature') private readonly _features: IFeature[],
        @inject('ICommandParser') private readonly _commandParser: ICommandParser,
        @inject('ILogger') private readonly _logger: ILogger,
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
        const applicationInitializationTag = this._applicationInitializationTag;
        const resolvedNullPromise = this._resolvedNullPromise;

        // TODO these arrays can't be empty right now https://github.com/microsoft/tsyringe/issues/63
        // Check if we need to poll stuff
        const pollComments = this.checkPollingThing(this._commentFeatures, 'comments');
        const pollSubmissions = this.checkPollingThing(this._submissionFeatures, 'submissions');
        const pollPrivateMessages = this.checkPollingThing(this._privateMessageFeatures, 'private messages');

        if (!pollComments && !pollSubmissions && !pollPrivateMessages) { // No features registered
            return;
        }

        // Start requests for bot account info, lastest comment on subreddit and lastest submission on subreddit
        const getMePromise = snoowrap.getMe();
        const latestCommentPromise = pollComments ? snoowrap.getNewComments(subredditName, { limit: 1 }) : resolvedNullPromise;
        const latestSubmissionPromise = pollSubmissions ? snoowrap.getNew(subredditName, { limit: 1 }) : resolvedNullPromise;
        // TODO snoowrap typings for getInbox are wrong
        // @ts-ignore
        const latestMessagePromise = pollPrivateMessages ? snoowrap.getInbox({ limit: 1 }) : resolvedNullPromise; // Note that inbox messages include both comments and private messages

        // Wait for requests
        const values = await Promise.all([getMePromise, latestCommentPromise, latestSubmissionPromise, latestMessagePromise]); // By supplying the same number of promises in the same order, we get static typing for resolved values

        // Set bot username
        const botUsername = values[0].name;
        logger.log(applicationInitializationTag, `Bot username: ${botUsername}`);

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
            feature.onInit();
        }

        // Start polling
        this.poll(commentsBefore, submissionsBefore, messagesBefore,
            botUsername, subredditName,
            pollComments, pollSubmissions, pollPrivateMessages);
    }

    // Poll
    private async poll(commentsBefore: string, submissionsBefore: string, messagesBefore: string,
        botUsername: string, subredditName: string,
        pollComments: boolean, pollSubmissions: boolean, pollPrivateMessages: boolean): Promise<void> {
        const snoowrap = this._snoowrap;
        const logger = this._logger;
        const applicationTag = this._applicationTag;
        const resolvedNullPromise = this._resolvedNullPromise;

        while (true) {
            // TODO doesn't makes sense if polling comments/submissions/private messages is disabled
            logger.log(applicationTag, `Retrieving comments before: ${commentsBefore}, submissions before: ${submissionsBefore} and messages before: ${messagesBefore}`);

            // Request new comments and submissions
            const newCommentsPromise = pollComments ? snoowrap.getNewComments(subredditName, { before: commentsBefore, limit: 100 }) : resolvedNullPromise;
            const newSubmissionsPromise = pollSubmissions ? snoowrap.getNew(subredditName, { before: submissionsBefore, limit: 100 }) : resolvedNullPromise;
            // TODO snoowrap typings for getInbox are wrong
            // @ts-ignore
            const newMessagesPromise = pollPrivateMessages ? snoowrap.getInbox({ before: messagesBefore, limit: 100 }) : resolvedNullPromise;

            // Wait for new comments and submissions
            const values = await Promise.all([newCommentsPromise, newSubmissionsPromise, newMessagesPromise]); // By supplying the same number of promises in the same order, we get static typing for resolved values

            const newComments = values[0];
            if (newComments != null && this.containsNew(newComments, 'comments')) {
                commentsBefore = await this.processNewComments(newComments, botUsername);
            }

            const newSubmissions = values[1];
            if (newSubmissions != null && this.containsNew(newSubmissions, 'submissions')) {
                submissionsBefore = await this.processNewSubmissions(newSubmissions, botUsername);
            }

            const newMessages = values[2];
            if (newMessages != null && this.containsNew(newMessages, 'messages')) {
                messagesBefore = await this.processNewPrivateMessages(newMessages, botUsername);
            }

            await this.sleep(6000);
        }
    }

    private async processNewPrivateMessages(newMessages: Listing<PrivateMessage | Comment>, botUsername: string): Promise<string> {
        const privateMessageFeatures = this._privateMessageFeatures;
        const commandParser = this._commandParser;
        const logger = this._logger;
        const applicationTag = this._applicationTag;

        for (const message of newMessages) {
            // Depending on account settings, messages may include comments
            // TODO snoowrap adds a was_comment property to each object in the listing
            // @ts-ignore
            if (message.was_comment) {
                logger.log(applicationTag, `Ignoring comment message - we recommend disabling reddit.com/settings/notifications > "Conversations in inbox"`);
                continue;
            }

            // Ignore private messages by bot account
            if (message.author.name === botUsername) {
                logger.log(applicationTag, `Ignoring bot private message`);
                continue;
            }

            // Ignore messages distinguished as admin. Attempting to respond to such messages causes 403s.
            if (message.distinguished === 'admin') {
                logger.log(applicationTag, `Ignoring admin message`);
                continue;
            }

            const command = commandParser.tryParse(message.body);

            for (const privateMessageFeature of privateMessageFeatures) {
                await privateMessageFeature.onPrivateMessage(message as PrivateMessage, command); // was_comment false so it's a private message
            }
        }

        return newMessages[newMessages.length - 1].name;
    }

    private async processNewSubmissions(newSubmissions: Listing<snoowrap.Submission>, botUsername: string): Promise<string> {
        const submissionFeatures = this._submissionFeatures;
        const logger = this._logger;
        const applicationTag = this._applicationTag;

        for (const submission of newSubmissions) {
            // Ignore comments by bot account
            if (submission.author.name === botUsername) {
                logger.log(applicationTag, `Ignoring bot submission`);

                continue;
            }

            for (const submissionFeature of submissionFeatures) {
                await submissionFeature.onSubmission(submission);
            }
        }

        return newSubmissions[newSubmissions.length - 1].name;
    }

    private async processNewComments(newComments: Listing<Comment>, botUsername: string): Promise<string> {
        const commentsFeatures = this._commentFeatures;
        const commandParser = this._commandParser;
        const logger = this._logger;
        const applicationTag = this._applicationTag;

        for (const comment of newComments) {
            // Ignore comments by bot account
            if (comment.author.name === botUsername) {
                logger.log(applicationTag, `Ignoring bot comment`);

                continue;
            }

            const command = commandParser.tryParse(comment.body);

            for (const commentsFeature of commentsFeatures) {
                await commentsFeature.onComment(comment, command);
            }
        }

        return newComments[newComments.length - 1].name;
    }

    private checkPollingThing<T>(thingFeatures: T[], thingName: string): boolean {
        if (thingFeatures.length > 0) {
            this._logger.log(this._applicationInitializationTag, `Polling ${thingName}`);
            return true;
        } else {
            this._logger.log(this._applicationInitializationTag, `Not polling ${thingName}`);
            return false;
        }
    }

    private containsNew<T>(listing: Listing<T>, thingName: string): boolean {
        const numNew = listing.length;
        const foundNew = numNew > 0;

        if (foundNew) {
            this._logger.log(this._applicationTag, `${numNew} new ${thingName} found`);

            return true;
        }

        this._logger.log(this._applicationTag, `No new ${thingName}`);

        return false;
    }

    private getInitialBefore(listing: Listing<Comment> | Listing<Submission> | Listing<PrivateMessage | Comment> | null, thingName: string): string{
        if(listing == null){
            return '';
        }
        
        const result = listing[0]?.name ?? '';
        this._logger.log(this._applicationInitializationTag, `Latest ${thingName} fullname: ${result}`);

        return result;
    }

    private sleep(timeMilliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(() => resolve(), timeMilliseconds));
    }
}