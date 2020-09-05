import Path from "path";
import "reflect-metadata";
import snoowrap from "snoowrap";
import { container } from "tsyringe";
import Application from "./Application";
import authorizer from "./shared/authorization/Authorizer";
import Configuration from "./shared/configuration/Configuration";
import { Mode } from "./shared/configuration/Mode";
import Feature from "./shared/features/Feature";
import ExampleFeature from "./features/exampleFeature/ExampleFeature";
import { constructor } from "tsyringe/dist/typings/types";

require('dotenv').config({ path: Path.join(__dirname, "../variables.env") });

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
} else {
    onAuthorized();
}

function onAuthorized() {
    // Get configuration values
    const mode = process.env.RSGBOT_ENV === 'production' ? Mode.production : Mode.development;
    const subreddit = process.env.SUBREDDIT ?? 'RSGBot';

    // Register shared objects
    container.registerInstance(Configuration, new Configuration(mode, subreddit));
    container.registerInstance(snoowrap, new snoowrap({
        userAgent: 'RSGBot v0.1',
        clientId: clientID,
        clientSecret: clientSecret,
        refreshToken: refreshToken
    }));

    // Register your feature in the development block while developing. Register in the production block when you're ready to merge into master.
    if (mode === Mode.development) {
        container.register(Feature as constructor<Feature>, ExampleFeature); // Cast abstract class constructor to concrete constructor - https://github.com/microsoft/tsyringe/issues/108
    } else {
        // Production features
    }

    // Start application
    const application = container.resolve(Application);
    application.start();
}