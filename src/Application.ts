import snoowrap from "snoowrap";
import { inject, injectable, injectAll, singleton } from "tsyringe";
import Configuration from "./shared/Configuration";
import ICommandParser from "./shared/ICommandParser";
import ICommentFeature from "./shared/ICommentFeature";
import IFeature from "./shared/IFeature";
import ILogger from "./shared/ILogger";
import ISubmissionFeature from "./shared/ISubmissionFeature";

// TODO
// - poll messages
// - improve poll method efficiency
//   - Promise.any so all requests in features run concurrently
@singleton()
@injectable()
export default class Application {
    constructor(@injectAll('ICommentFeature') private readonly _commentFeatures: ICommentFeature[],
        @injectAll('ISubmissionFeature') private readonly _submissionFeatures: ISubmissionFeature[],
        @injectAll('IFeature') private readonly _features: IFeature[],
        @inject('ICommandParser') private readonly _commandParser: ICommandParser,
        @inject('ILogger') private readonly _logger: ILogger,
        private readonly _snoowrap: snoowrap,
        private readonly _configuration: Configuration) { }

    // Prepare for polling
    public async start(): Promise<void> {
        // Convenience
        const subredditName = this._configuration.subreddit;
        const snoowrap = this._snoowrap;
        const logger = this._logger;

        // Check if we need to poll stuff
        const pollComments = this._commentFeatures.length > 0;
        const pollSubmissions = this._submissionFeatures.length > 0;

        logger.log('Application', `Poll comments: ${pollComments}`);
        logger.log('Application', `Poll submissions: ${pollSubmissions}`);

        if (!pollComments && !pollSubmissions) { // No features registered
            return;
        }

        // Call init methods
        for (const feature of this._features) {
            feature.onInit();
        }

        // Start requests for bot account info, lastest comment on subreddit and lastest submission on subreddit
        const getMePromise = snoowrap.getMe();
        const latestCommentPromise = pollComments ? snoowrap.getNewComments(subredditName, { limit: 1 }) : Promise.resolve(null);
        const latestSubmissionPromise = pollSubmissions ? snoowrap.getNew(subredditName, { limit: 1 }) : Promise.resolve(null);

        // Wait for requests
        const values = await Promise.all([getMePromise, latestCommentPromise, latestSubmissionPromise]); // By supplying the same number of promises in the same order, we get static typing for resolved values

        // Set bot username
        const botUsername = values[0].name;
        logger.log('Application', `Bot username: ${botUsername}`);

        // Set before values
        // - For the Reddit API, when we request a listing (https://www.reddit.com/dev/api/#listings) of "things" (comments/posts/etc) we can specify a
        //  "before" string representing a thing. Only things created *after* it are returned.
        // - When the app starts, we need to set our before string to the latest thing's fullname (https://www.reddit.com/dev/api/#fullnames). 
        //   Otherwise we could end up retrieving things we've already processed.
        // - values[1] is a list containing just the latest comment. Set before to its name. If there is no latest comment (unlikely), set
        //   before to ''. API ignores before if it's an empty string.

        const commentsBefore = values[1] == null ? '' : values[1][0]?.name ?? '';
        logger.log('Application', `Latest comment fullname: ${commentsBefore}`);

        const submissionsBefore = values[2] == null ? '' : values[2][0]?.name ?? '';
        logger.log('Application', `Latest submission fullname: ${submissionsBefore}`);

        // Start polling
        this.poll(commentsBefore, submissionsBefore, botUsername, subredditName, pollComments, pollSubmissions);
    }

    // Poll
    private async poll(commentsBefore: string, submissionsBefore: string,
        botUsername: string, subredditName: string, pollComments: boolean, pollSubmissions: boolean): Promise<void> {
        const snoowrap = this._snoowrap;
        const logger = this._logger;

        while (true) {
            logger.log('Application', `Retrieving comments before: ${commentsBefore} and submissions before: ${submissionsBefore}`);

            // Request new comments and submissions
            const newCommentsPromise = pollComments ? snoowrap.getNewComments(subredditName, { before: commentsBefore, limit: 100 }) : Promise.resolve(null);
            const newSubmissionsPromise = pollSubmissions ? snoowrap.getNew(subredditName, { before: submissionsBefore, limit: 100 }) : Promise.resolve(null);

            // Wait for new comments and submissions
            const values = await Promise.all([newCommentsPromise, newSubmissionsPromise]); // By supplying the same number of promises in the same order, we get static typing for resolved values

            const newComments = values[0];
            if (newComments != null) { // TS is smart enough to know that values[0] is a snoowrap.Listing<snoowrap.Comment>
                const numNewComments = newComments.length;
                const foundNewComments = numNewComments > 0;

                if (foundNewComments) {
                    logger.log('Application', `${numNewComments} new comments found`);

                    commentsBefore = await this.processNewComments(newComments, botUsername);
                } else {
                    logger.log('Application', `No new comments`);
                }
            }

            const newSubmissions = values[1];
            if (newSubmissions != null) { // TS is smart enough to know that values[0] is a snoowrap.Listing<snoowrap.Submission>
                const numNewSubmissions = newSubmissions.length;
                const foundNewSubmissions = numNewSubmissions > 0;

                if (foundNewSubmissions) {
                    logger.log('Application', `${numNewSubmissions} new submissions found`);

                    submissionsBefore = await this.processNewSubmissions(newSubmissions, botUsername);
                } else {
                    logger.log('Application', `No new submissions`);
                }
            }

            await this.sleep(4000);
        }
    }

    private async processNewSubmissions(newSubmissions: snoowrap.Listing<snoowrap.Submission>,
        botUsername: string): Promise<string> {
        const submissionFeatures = this._submissionFeatures;
        const logger = this._logger;

        for (const submission of newSubmissions) {
            // Ignore comments by bot account
            if (submission.author.name === botUsername) {
                logger.log('Application', `Ignoring bot submission`);
                
                continue;
            }

            for (const submissionFeature of submissionFeatures) {
                await submissionFeature.onSubmission(submission);
            }
        }

        return newSubmissions[newSubmissions.length - 1].name;

    }

    private async processNewComments(newComments: snoowrap.Listing<snoowrap.Comment>,
        botUsername: string): Promise<string> {
        const commentsFeatures = this._commentFeatures;
        const commandParser = this._commandParser;
        const logger = this._logger;

        for (const comment of newComments) {
            // Ignore comments by bot account
            if (comment.author.name === botUsername) {
                logger.log('Application', `Ignoring bot comment`);
                
                continue;
            }

            const command = commandParser.tryParse(comment.body);

            for (const commentsFeature of commentsFeatures) {
                await commentsFeature.onComment(comment, command);
            }
        }

        return newComments[newComments.length - 1].name;
    }

    private sleep(timeMilliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(() => resolve(), timeMilliseconds));
    }
}