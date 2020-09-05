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
     * Logs comment, replies if it contains "hello".
     */
    public async onComment(comment: Comment, _: Command): Promise<void> {
        this._logger.info(`onComment, author: ${comment.author.name}, comment body: ${comment.body}`);

        if (comment.body.toLowerCase().includes('hello')) {
            //@ts-ignore
            await comment.reply('Hi!');
        }
    }

    /**
     * Logs submission, replies if its title contains "hello".
     */
    public async onSubmission(submission: Submission): Promise<void> {
        this._logger.info(`onSubmission, author: ${submission.author.name}, submission title: ${submission.title}`);

        if (submission.title.toLowerCase().includes('hello')) {
            //@ts-ignore
            await submission.reply(`Hi!`);
        }
    }

    /**
     * Logs private message, replies with a copy of its body.
     */
    public async onPrivateMessage(privateMessage: PrivateMessage, _: Command): Promise<void> {
        this._logger.info(`onPrivateMessage, author: ${privateMessage.author.name}, private message body: ${privateMessage.body}`);

        //@ts-ignore
        await privateMessage.reply(`echo: ${privateMessage.body}`);
    }

    /**
     * Logs onInit event.
     */
    public async onInit(): Promise<void> {
        this._logger.info('onInit');
    }
}