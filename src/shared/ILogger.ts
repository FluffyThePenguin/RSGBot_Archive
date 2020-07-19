export default interface ILogger{
    log(featureName: string, message: string): Promise<void>;
}