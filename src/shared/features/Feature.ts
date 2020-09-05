import { Comment, PrivateMessage, Submission } from "snoowrap";
import Command from "../commands/Command";
import Logger from "../logging/Logger";

export default abstract class Feature {
    constructor(protected readonly _logger: Logger) {
        _logger.setTag(this.constructor.name);
    }

    // These should be protected, but we leave them as public for simpliciy
    public abstract onInit(): Promise<void>;
    public abstract onComment(comment: Comment, command: Command): Promise<void>;
    public abstract onPrivateMessage(privateMessage: PrivateMessage, command: Command): Promise<void>;
    public abstract onSubmission(submission: Submission): Promise<void>;

    public async onInitCore(): Promise<void> {
        try {
            await this.onInit();
        } catch (error) {
            this._logger.error(error.toString());
        }
    }

    public async onCommentCore(comment: Comment, command: Command): Promise<void> {
        try {
            await this.onComment(comment, command);
        } catch (error) {
            this._logger.error(error.toString());
        }
    }

    public async onPrivateMessageCore(privateMessage: PrivateMessage, command: Command): Promise<void> {
        try {
            await this.onPrivateMessage(privateMessage, command);
        } catch (error) {
            this._logger.error(error.toString());
        }
    }

    public async onSubmissionCore(submission: Submission): Promise<void> {
        try {
            await this.onSubmissionCore(submission);
        } catch (error) {
            this._logger.error(error.toString());
        }
    }
}