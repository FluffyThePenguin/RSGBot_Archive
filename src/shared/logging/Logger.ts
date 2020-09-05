import { injectable } from "tsyringe";

@injectable()
export default class Logger {
    private _tag: string;
    
    public setTag(tag: string): void{
        this._tag = tag;
    }
    
    public async info(message: string): Promise<void> {
        console.info(`[${this._tag}][Info] ${message}`);
    }

    public async error(message: string): Promise<void> {
        console.log(`[${this._tag}][Error] ${message}`);
    }
}