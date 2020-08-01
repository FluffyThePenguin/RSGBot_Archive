import snoowrap, { PrivateMessage, Comment, Submission } from "snoowrap";
import { inject, injectable } from "tsyringe";
import Command from "../../shared/Command";
import ICommentFeature from "../../shared/ICommentFeature";
import ILogger from "../../shared/ILogger";
import ISubmissionFeature from "../../shared/ISubmissionFeature";
import IPrivateMessageFeature from "../../shared/IPrivateMessageFeature";

@injectable()
export default class ExampleFeature implements ICommentFeature, ISubmissionFeature, IPrivateMessageFeature {
    constructor(@inject('ILogger') private readonly _logger: ILogger,
        private readonly _snoowrap: snoowrap) { }

    public async onComment(comment: Comment, command: Command): Promise<void> {
        this._logger.log('ExampleFeature', `onComment, author: ${comment.author.name}, comment body: ${comment.body}`);

        //@ts-ignore
        await comment.reply(`echo: ${comment.body}`);
    }

    public async onSubmission(submission: Submission): Promise<void> {
        this._logger.log('ExampleFeature', `onSubmission, author: ${submission.author.name}, submission body: ${submission.title}`);

        //@ts-ignore
        await submission.reply(`echo: ${submission.title}`);
    }

    public async onPrivateMessage(privateMessage: PrivateMessage, command: Command): Promise<void> {
        this._logger.log('ExampleFeature', `onPrivateMessage, author: ${privateMessage.author.name}, private message body: ${privateMessage.body}`);

        //@ts-ignore
        await privateMessage.reply(`echo: ${privateMessage.body}`);
    }

    public async onInit(): Promise<void> {
        this._logger.log('ExampleFeature', `onInit`);
    }
}