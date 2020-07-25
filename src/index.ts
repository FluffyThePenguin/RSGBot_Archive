import Path from "path";
require('dotenv').config({ path: Path.join(__dirname, "../variables.env") });
import "reflect-metadata";
import snoowrap from "snoowrap";
import { container } from "tsyringe";
import Application from "./Application";
import ExampleFeature from "./features/exampleFeature/ExampleFeature";
import Configuration from "./shared/Configuration";
import { Mode } from "./shared/Mode";
import CommandParser from "./shared/CommandParser";
import Logger from "./shared/Logger";
import authorizer from "./tools/Authorizer";

let clientID = process.env.CLIENT_ID;
let clientSecret = process.env.CLIENT_SECRET;
let refreshToken = process.env.REFRESH_TOKEN;

if (clientID == null || clientSecret == null || refreshToken == null) {
    authorizer.
        start().
        then(authorizationResult => {
            clientID = authorizationResult.clientID;
            clientSecret = authorizationResult.clientSecret;
            refreshToken = authorizationResult.refreshToken;

            onAuthorized();
        });
}else{
    onAuthorized();
}

function onAuthorized() {
    // Get configuration
    const mode = process.env.RSGBOT_ENV === 'production' ? Mode.production : Mode.development;
    const subreddit = process.env.SUBREDDIT ?? 'RSGBot';

    // Register services
    container.registerInstance(Configuration, new Configuration(mode, subreddit));
    container.registerInstance(snoowrap, new snoowrap({
        userAgent: 'RSGBot v0.1',
        clientId: clientID,
        clientSecret: clientSecret,
        refreshToken: refreshToken
    }));
    container.register('ICommandParser', CommandParser);
    container.register('ILogger', Logger);

    // Register a feature
    // - Register your feature for interfaces it implements. Note that ICommentFeature and ISubmissionFeature both implement IFeature.
    container.register('IFeature', ExampleFeature);
    container.register('ICommentFeature', ExampleFeature);
    container.register('ISubmissionFeature', ExampleFeature);

    // Start application
    const application = container.resolve(Application);
    application.start();
}