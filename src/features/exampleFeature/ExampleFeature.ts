import { Comment, PrivateMessage, Submission } from "snoowrap";
import { inject, injectable } from "tsyringe";
import Command from "../../shared/Command";
import ICommentFeature from "../../shared/ICommentFeature";
import ILogger from "../../shared/ILogger";
import IPrivateMessageFeature from "../../shared/IPrivateMessageFeature";
import ISubmissionFeature from "../../shared/ISubmissionFeature";

@injectable()
export default class ExampleFeature implements ICommentFeature, ISubmissionFeature, IPrivateMessageFeature {
    constructor(@inject('ILogger') private readonly _logger: ILogger) { }

    public async onComment(comment: Comment, command: Command): Promise<void> {
        this._logger.log('ExampleFeature', `onComment, author: ${comment.author.name}, comment body: ${comment.body}`);

        //@ts-ignore
        await comment.reply(`echo: ${comment.body}`);
    }

    public async onSubmission(submission: Submission): Promise<void> {
        this._logger.log('ExampleFeature', `onSubmission, author: ${submission.author.name}, submission title: ${submission.title}`);

        //@ts-ignore
        await submission.reply(`echo: ${submission.title}`);
    }

    public async onPrivateMessage(privateMessage: PrivateMessage, command: Command): Promise<void> {
        this._logger.log('ExampleFeature', `onPrivateMessage, author: ${privateMessage.author.name}, private message body: ${privateMessage.body}`);

        //@ts-ignore
        await privateMessage.reply(`echo: ${privateMessage.body}`);
    }

    public async onInit(): Promise<void> {
        this._logger.log('ExampleFeature', 'onInit');
    }
}