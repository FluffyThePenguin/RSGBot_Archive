import { injectable } from "tsyringe";
import R7InsightLogger from "r7insight_node";
import moment from 'moment-timezone';

@injectable()
export default class Logger {
    private _tag: string;

    constructor(private readonly _r7InsightLogger: R7InsightLogger) { }

    public setTag(tag: string): void {
        this._tag = tag;
    }

    public async info(message: string): Promise<void> {
        this.logCore('Info', message);
    }

    public async error(message: string): Promise<void> {
        this.logCore('Error', message);
    }

    private logCore(level: string, message: string): void {
        const logEntry = `[${moment().utc().tz('Asia/Singapore').format('MMM Do YYYY HH:mm:ss')}][${level}][${this._tag}]: ${message}`

        console.info(logEntry);

        if (this._r7InsightLogger != null) {
            this._r7InsightLogger.log(logEntry);
        }
    }
}