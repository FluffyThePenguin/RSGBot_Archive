import { Comment, PrivateMessage, Submission } from "snoowrap";
import { inject, injectable } from "tsyringe";
import Command from "../../shared/Command";
import ICommentFeature from "../../shared/ICommentFeature";
import ILogger from "../../shared/ILogger";
import IPrivateMessageFeature from "../../shared/IPrivateMessageFeature";
import ISubmissionFeature from "../../shared/ISubmissionFeature";

/**
 * An example feature that reacts to comments, submissions and private messages.
 */
@injectable()
export default class ExampleFeature implements ICommentFeature, ISubmissionFeature, IPrivateMessageFeature {
    constructor(@inject('ILogger') private readonly _logger: ILogger) { }

    /**
     * Logs comment and replies it with a copy of its body.
     */
    public async onComment(comment: Comment, _: Command): Promise<void> {
        this._logger.log('ExampleFeature', `onComment, author: ${comment.author.name}, comment body: ${comment.body}`);

        //@ts-ignore
        await comment.reply(`echo: ${comment.body}`);
    }

    /**
     * Logs submission and replies it with its title.
     */
    public async onSubmission(submission: Submission): Promise<void> {
        this._logger.log('ExampleFeature', `onSubmission, author: ${submission.author.name}, submission title: ${submission.title}`);

        //@ts-ignore
        await submission.reply(`echo: ${submission.title}`);
    }

    /**
     * Logs private message and replies it with a copy of its body.
     */
    public async onPrivateMessage(privateMessage: PrivateMessage, _: Command): Promise<void> {
        this._logger.log('ExampleFeature', `onPrivateMessage, author: ${privateMessage.author.name}, private message body: ${privateMessage.body}`);

        //@ts-ignore
        await privateMessage.reply(`echo: ${privateMessage.body}`);
    }

    /**
     * Logs onInit event.
     */
    public async onInit(): Promise<void> {
        this._logger.log('ExampleFeature', 'onInit');
    }
}