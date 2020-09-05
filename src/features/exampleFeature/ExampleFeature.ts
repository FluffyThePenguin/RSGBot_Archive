import { Comment, PrivateMessage, Submission } from "snoowrap";
import Command from "../../shared/commands/Command";
import Feature from "../../shared/features/Feature";
import Logger from "../../shared/logging/Logger";
import { injectable } from "tsyringe";

/**
 * An example feature that reacts to comments, submissions and private messages.
 */
@injectable()
export default class ExampleFeature extends Feature {
    constructor(logger: Logger) {
        super(logger);
    }

    /**
     * Logs comment and replies if it contains the substring "hello".
     */
    protected async onComment(comment: Comment, _: Command): Promise<void> {
        this._logger.info(`onComment, author: ${comment.author.name}, comment body: ${comment.body}`);

        if (comment.body.toLowerCase().includes('hello')) {
            //@ts-ignore
            await comment.reply('Hi!');
        }
    }

    /**
     * Logs submission and replies if its title contains the substring "hello".
     */
    protected async onSubmission(submission: Submission): Promise<void> {
        this._logger.info(`onSubmission, author: ${submission.author.name}, submission title: ${submission.title}`);

        if (submission.title.toLowerCase().includes('hello')) {
            //@ts-ignore
            await submission.reply(`echo: ${submission.title}`);
        }
    }

    /**
     * Logs private message and replies it with a copy of its body.
     */
    protected async onPrivateMessage(privateMessage: PrivateMessage, _: Command): Promise<void> {
        this._logger.info(`onPrivateMessage, author: ${privateMessage.author.name}, private message body: ${privateMessage.body}`);

        //@ts-ignore
        await privateMessage.reply(`echo: ${privateMessage.body}`);
    }

    /**
     * Logs onInit event.
     */
    protected async onInit(): Promise<void> {
        this._logger.info('onInit');
    }
}