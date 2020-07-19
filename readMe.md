# RSGBot

r/Singapore's community building bot.

## Table of Contents
[Overview](#overview)  
[Contributing](#contributing)  
&nbsp;&nbsp;&nbsp;&nbsp;[Getting Started](#getting-started)  
&nbsp;&nbsp;&nbsp;&nbsp;[Contributing a Feature](#contributing-a-feature)  
&nbsp;&nbsp;&nbsp;&nbsp;[Tips](#tips)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Debugging](#debugging)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[VSC Codebase Navigation](#vsc-codebase-navigation)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Typescript/Snoowrap await Issue](#typescriptsnoowrap-await-issue)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Snoowrap typings issue](#snoowrap-typings-issue)  
&nbsp;&nbsp;&nbsp;&nbsp;[Things To Do](#things-to-do)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Infrastructure](#infrastructure)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Access Token Retrieval App](#todo-access-token-retrieval-app)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Shared](#shared)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[CommandParser](#todo-commandparser)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Logger](#todo-logger)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[IMessageFeature](#todo-imessagefeature)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Features](#features)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Flair System](#todo-flair-system)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Event Threads](#todo-event-threads)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Translation](#todo-translation)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Auto-Remove Duplicate Links with Different Query Parameters](#todo-auto-remove-duplicate-links-with-different-query-parameters)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Limit Submissions to 5 a day](#todo-limit-submissions-to-5-a-day)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Auto-Flairing](#todo-auto-flairing)  
[Related Concepts](#related-concepts)  
&nbsp;&nbsp;&nbsp;&nbsp;[Unit Testing](#unit-testing)  
&nbsp;&nbsp;&nbsp;&nbsp;[Dependency Injection](#dependency-injection)  
&nbsp;&nbsp;&nbsp;&nbsp;[Asynchrony](#asynchrony)  

## Overview

This readme is an early draft, we'll clean it up and flesh it out over the next few weekends.

The codebase is also an early draft. Let us know if you face issues getting started with the bot or if you know better ways to do things.
For now, it's public for early experimenters to tinker with.  

Post suggestions/questions over in our [getting started](https://github.com/RSGTechSupport/RSGBot/issues/1) thread.

> At this stage, we'd greatly appreciate help with the ["access token retrieval app"](https://github.com/RSGTechSupport/RSGBot/#todo-access-token-retrieval-app).
> Other things we need help with are listed in ["things to do"](https://github.com/RSGTechSupport/RSGBot/#things-to-do).

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
   Note that `.gitignore` is configured to ignore exactly `variables.env`. Be careful not to push your secrets to Github.
7. Start the bot: `yarn run dev`. You'll should see output like this:
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
    - `nodemon` restarts the application when you save changes.
    - The Reddit API has a concept called [listings](https://www.reddit.com/dev/api/#listings). Listings are chronologically ordered lists of "things" (comments/posts etc). When we retrieve from a listing, we specify 
      that we want only things posted after the last thing we processed, e.g. comments posted after the last comment we processed. Things are specified using ["fullnames"](https://www.reddit.com/dev/api/#fullnames), e.g. `t1_fyfqmt2`.
      Above you'll notice our use of fullnames to retrieve things we haven't processed. Note that the Reddit API refers to "chronologically after" as before, i.e. if thing *a* was posted after (chronologically) thing *b*,
      thing *a* is before thing *b* in the listing. 
8. Navigate to [r/RSGBot](https://www.reddit.com/r/RSGBot). This is our test subreddit. The bot is configured to poll it in development mode. Post a comment or submission to verify that your bot is polling it properly:
    ```
    [Application]: Retrieving comments before: t1_fyfqmt2 and submissions before: t3_htb1ai
    [Application]: No new comments
    [Application]: 1 new submissions found
    [ExampleFeature]: onSubmission, submission body: hello there
    [Application]: Retrieving comments before: t1_fyfqmt2 and submissions before: t3_htex19
    [Application]: 1 new comments found
    ```
    - `ExampleFeature` echos detected comments/submissions, as we'll see in the next step.

### Contributing a Feature
Features are things like auto-flairing of posts, removal of duplicate posts,
commands in comments like `!translate` etc.

TODO document interfaces, shared types
TODO document testing, add example tests

1. First take a quick look at `ExampleFeature`. In vsc, open `src/features/exampleFeature/ExampleFeature.ts`:
    ```typescript
    import ICommentFeature from "../../shared/ICommentFeature";
    import ISubmissionFeature from "../../shared/ISubmissionFeature";
    import snoowrap from "snoowrap";
    import Command from "../../shared/Command";
    import Logger from "../../shared/ILogger";
    import {injectable} from "tsyringe";

    @injectable()
    export default class ExampleFeature implements ICommentFeature, ISubmissionFeature {
        constructor(private readonly _logger: Logger, private readonly _snoowrap: snoowrap) { }

        public async onComment(comment: snoowrap.Comment, command: Command): Promise<void> {
            ...
        }

        public async onSubmission(submission: snoowrap.Submission): Promise<void> {
            ...
        }

        public async onInit(): Promise<void> {
            ...
        }
    }
    ```
    - A feature taps into the stream of comments and submissions retrieve by polling and reacts to each appropriately.
      `onComment` and `onSubmission` fire when a comment or a submission is posted respectively. 
    - Certain features may be proactive rather than reactive, e.g. a feature that creates a meme competition thread once a week. Such features can implement just `IFeature` and set timeouts in the member it exposes, `onInit`.
    - `_snoowrap` is the Reddit API wrapper. [snoowrap repository](https://github.com/not-an-aardvark/snoowrap).
2. Create a new git branch: `git checkout -b add_<feature_name>`.
3. Add a new folder under src/features or copy the `src/features/exampleFeature` folder.
4. Implement onComment/onSubmission/onInit in your feature.
5. Register your feature in `index.ts`, this is how `ExampleFeature` is registered:
   ```typescript
   // Register a feature
   // - Register your feature for interfaces it implements. Note that ICommentFeature and ISubmissionFeature both implement IFeature.
   container.register('IFeature', ExampleFeature);
   container.register('ICommentFeature', ExampleFeature);
   container.register('ISubmissionFeature', ExampleFeature);
   ```
6. [Create a pull request](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

### Tips
#### Debugging
Set a breakpoint, then, in vsc's main menu, click run > start debugging or press f5. 

TODO vsc steps into node internals despite

```
"skipFiles": [
    // "node_modules/**/*.js", // Uncomment to prevent stepping into dependencies
    "<node_internals>/**/*.js" // TODO not working
],
```

in `.vscode/launch.json`. You'll notice yourself stepping through files in the `<node_internals>` directory (hover over tab of open file to see it's path).
For now, set a breakpoint in your code after the internals and click continue to skip all that.

#### VSC Codebase Navigation
Press `f1` to go to definition. This is a good way to figure out what arguments a snoowrap method takes.

#### Typescript/Snoowrap await Issue
Awaiting some snoowrap methods causes typescript error 1062.

This is a known issue:
- https://github.com/not-an-aardvark/snoowrap/issues/221
- https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33139

We've verified that the underlying code is safe. If you encounter 1062, add `//@ts-ignore` above the line.

#### Snoowrap typings issue
TODO open issue on snoowrap
TODO add primer on typescript and typings

Some snoowrap typings are wrong. 

### Things To Do
These are things we need help with right now. Note that we aren't limiting contributions to this list - if you have an idea for RSGBot, open an issue and tell us more. 

#### Infrastructure
##### TODO Access Token Retrieval App
The C# library we used for the existing bot, [Reddit.Net](https://github.com/sirkris/Reddit.NET#solution-projects), came with a [utility for retrieving access tokens](https://www.youtube.com/watch?v=xlWhLyVgN2s).
Unfortunately it requires Visual Studio and some familiarity with .Net to run. Would be useful to reproduce such a utility in this repository.

#### Shared
##### TODO `IMessageFeature`
Polls private messages.

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

##### TODO Limit Submissions to 5 a day
Requested by r/Singapore mods.

##### TODO Auto-Flairing
Use ML to detect post category, flair accordingly.

## Related Concepts
### Unit Testing
TODO
- What
- Why
### Dependency Injection
TODO
- What
- Why
### Asynchrony
TODO
- What
- What