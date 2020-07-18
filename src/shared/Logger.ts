import { singleton } from "tsyringe";

@singleton()
export default class Logger {
    public async log(featureName: string, message: string): Promise<void> {
        // TODO 
        // - Multiple features will run concurrently.
        // - In development/debug mode, we write logs to the console. In production, we need some way for devs to monitor 
        //   logs fromtheir features.
        // - Heroku allows multiple devs to view logs at the same time, but doesn't seem to offer filtering. Also log history is quite limited.
        // - We should try and pass logs on to some log aggregating service like google cloud logging https://cloud.google.com/logging/docs.

        console.log(`[${featureName}]: ${message}`);
    }

}