import { Comment, PrivateMessage, Submission } from "snoowrap";
import Command from "../commands/Command";
import Logger from "../logging/Logger";

export default abstract class Feature {
    constructor(protected readonly _logger: Logger) {
        _logger.setTag(this.constructor.name);
    }

    protected abstract onInit(): Promise<void>;
    protected abstract onComment(comment: Comment, command: Command): Promise<void>;
    protected abstract onPrivateMessage(privateMessage: PrivateMessage, command: Command): Promise<void>;
    protected abstract onSubmission(submission: Submission): Promise<void>;

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