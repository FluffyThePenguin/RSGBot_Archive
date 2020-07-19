import snoowrap from "snoowrap";
import { inject, injectable } from "tsyringe";
import Command from "../../shared/Command";
import ICommentFeature from "../../shared/ICommentFeature";
import ILogger from "../../shared/ILogger";
import ISubmissionFeature from "../../shared/ISubmissionFeature";

@injectable()
export default class ExampleFeature implements ICommentFeature, ISubmissionFeature {
    constructor(@inject('ILogger') private readonly _logger: ILogger,
        private readonly _snoowrap: snoowrap) { }

    public async onComment(comment: snoowrap.Comment, command: Command): Promise<void> {
        this._logger.log('ExampleFeature', `onComment, comment body: ${comment.body}`);

        //@ts-ignore
        await comment.reply(`echo: ${comment.body}`);
    }

    public async onSubmission(submission: snoowrap.Submission): Promise<void> {
        this._logger.log('ExampleFeature', `onSubmission, submission body: ${submission.title}`);

        //@ts-ignore
        await submission.reply(`echo: ${submission.title}`);
    }

    public async onInit(): Promise<void> {
        this._logger.log('ExampleFeature', `onInit`);
    }
}