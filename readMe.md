# RSGBot
r/Singapore's community building bot.

This ReadMe is very rough, will be adding quite a bit to it. Important sections like testing need to be added. It's got enough for you to start tinkering though.
I've renamed the first issue in the repo to "Getting Started". Post technical questions there for future contributors reference.  
Don't hesitate to be provide frank feedback. Better we spot problems and resolve them now than down the line.

## Contributing
### Getting Started

1. Install [visual studio code (vsc)](https://code.visualstudio.com/download).
2. Install [yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable).
3. [Fork this repository](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo).
3. [Clone your fork](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository).
4. Open the root folder of the clone in vsc.
5. Open vsc's [integrated terminal](https://code.visualstudio.com/docs/editor/integrated-terminal).
6. Install dependencies: `yarn install`.
7. [With your everyday reddit account, create a reddit "app". Retrieve an oauth refresh token.](https://github.com/reddit-archive/reddit/wiki/OAuth2).  
   Add your app's id and secret along with your refresh token to a `variables.env` file at the root of your project:
   ```
   CLIENT_ID=<app id>
   CLIENT_SECRET=<app secret>
   REFRESH_TOKEN=<refresh token>
   ```
   Note that `.gitignore` is configured to ignore exactly `variables.env`, be careful not to push your secrets to Github.
7. Start the bot: `yarn run dev`. If it works you'll see output like this:
    ```
    yarn run v1.12.3
    $ set RSGBOT_ENV=development && nodemon ./src/index.ts
    [nodemon] 2.0.4
    [nodemon] to restart at any time, enter `rs`
    [nodemon] watching path(s): *.*
    [nodemon] watching extensions: ts,json
    [nodemon] starting `ts-node ./src/index.ts`
    [Application]: Poll comments: true
    [Application]: Poll submissions: true
    [ExampleFeature]: onInit
    [Application]: Bot username: RSGBot
    [Application]: Latest comment fullname: t1_fyfqmt2
    [Application]: Latest submission fullname: t3_htb1ai
    [Application]: Retrieving comments before: t1_fyfqmt2 and submissions before: t3_htb1ai
    [Application]: No new comments
    [Application]: No new submissions
    [Application]: Retrieving comments before: t1_fyfqmt2 and submissions before: t3_htb1ai
    [Application]: No new comments
    [Application]: No new submissions
    ```
    `nodemon` restarts the application when you save changes.
8. Navigate to [r/RSGBot](https://www.reddit.com/r/RSGBot). This is our test subreddit and what the bot is configured to poll in development mode. Post a comment or submission, the bot will detect what you've posted:
    ```
    [Application]: Retrieving comments before: t1_fyfqmt2 and submissions before: t3_htb1ai
    [Application]: No new comments
    [Application]: 1 new submissions found
    [ExampleFeature]: onSubmission, submission body: hello there
    [Application]: Retrieving comments before: t1_fyfqmt2 and submissions before: t3_htex19
    [Application]: 1 new comments found
    ```
9. At present, the only feature is ExampleFeature:
    ```typescript
    import ICommentFeature from "../../shared/ICommentFeature";
    import snoowrap from "snoowrap";
    import {injectable} from "tsyringe";
    import ISubmissionFeature from "../../shared/ISubmissionFeature";
    import Command from "../../shared/Command";
    import Logger from "../../shared/Logger";

    @injectable()
    export default class ExampleFeature implements ICommentFeature, ISubmissionFeature {
        constructor(private readonly _logger: Logger, private readonly _snoowrap: snoowrap) { }

        public async onComment(comment: snoowrap.Comment, command: Command): Promise<void> {
            this._logger.log('ExampleFeature', `onComment, comment body: ${comment.body}`);

            //@ts-ignore
            await comment.reply(`echo: ${comment.body}`);
        }

        public async onSubmission(submission: snoowrap.Submission): Promise<void> {
            this._logger.log('ExampleFeature', `onSubmission, submission body: ${submission.title}`);

            //@ts-ignore
            await submission.reply(`echo: ${submission.title}`);
        }

        public async onInit(): Promise<void> {
            this._logger.log('ExampleFeature', `onInit`);
        }
    }
    ```
    - `onComment` and `onSubmission` fire when a comment or a submission is posted respectively. 
    - `_snoowrap` is the Reddit API wrapper.

### Tips
#### Debugging
Set a breakpoint. In vsc's main menu, click run > start debugging or press f5. 

TODO for some reason even though I've set

```json
"skipFiles": [
    // "node_modules/**/*.js", // Uncomment to prevent stepping into dependencies
    "<node_internals>/**/*.js" // TODO not working
],
```

in `.vscode/launch.json`, it still steps into node internals. Set a breakpoint for after the internals and continue to skip over
all that for now.

#### VSC Codebase Navigation
`f1` to go to definition. Good way to figure out what arguments snoowrap methods take. Snoowrap has some rough edges.

#### Typescript/Snoowrap await Issue
Awaiting some snoowrap methods causes typescript error 1062.

Known issue:
- https://github.com/not-an-aardvark/snoowrap/issues/221
- https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33139

I've verified that the underlying code is safe. If you encounter 1062, add `//@ts-ignore` above the line.

### Contributing a Feature
1. Add a new folder under src/features or copy the exampleFeature folder.
2. Once you're done implementing onComment and/or onSubmission, register your feature in `index.ts`
   ```typescript
   // Register a feature
   // - Register your feature for interfaces it implements. Note that ICommentFeature and ISubmissionFeature both implement IFeature.
   container.register('IFeature', ExampleFeature);
   container.register('ICommentFeature', ExampleFeature);
   container.register('ISubmissionFeature', ExampleFeature);
   ```
3. [Create a pull request](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

### Things To Do
#### Infrastructure
##### TODO Access Token Retrieval App
The C# library I used for the existing bot, [Reddit.Net](https://github.com/sirkris/Reddit.NET#solution-projects) came with a [utility for retrieving access tokens](https://www.youtube.com/watch?v=xlWhLyVgN2s).
Unfortunately it requires Visual Studio and some familiarity with .Net to run. Would be useful to reproduce such a utility in this repository, for our own use.

#### Shared
##### TODO `IMessageFeature`
TODO

##### TODO `CommandParser`
See src/shared/CommandParser for details. Most features will expose commands to users, a shared command parser will save us all time and ensure consistency. 
Could try a library if anyone has suggestions.

##### TODO `Logger`
See src/shared/Logger for details. Need some way to store and expose logs so devs can monitor their features.

##### TODO Add MongoDB
So we hit the Reddit API less. Things like when a users account was created can be stored in MongoDB.

#### Features
##### TODO Flair System
Replicate [existing system](https://www.reddit.com/r/singapore/comments/hpikf7/level_system_trial_2/). Try determining user's first activity on
r/Singapore using Pushshift.

##### TODO Event Threads
Once a week, create thread in competition mode, pin it. After 24 hours, identify winners (authors of comments with top 3 most upvotes).
Ask them for a short blurb. Add blurbs to sidebar for a week. Assign special winner emojis to winners.

##### TODO Translation
Requested by r/Singapore mods. Suggested commands: `!translate <text>` to translate a block of text, `!translate` to translate an entire comment or post. 
Suggested API - [Google translate](https://github.com/googleapis/nodejs-translate). Up to you to design the feature though. 

##### TODO Auto-Remove Duplicate Links with Different Query Parameters
Requested by r/Singapore mods. Right now "google.com?user=1" and "google.com?user=2" aren't considered duplicates by reddit's built in bot.
Mods want such duplicates removed, but they want youtube timestamped links excluded.

##### TODO Limit Posts to 5 a day
Requested by r/Singapore mods.

## Related Concepts
### Dependency Injection
TODO
- What
- Why
### Asynchrony
TODO
- What
- What