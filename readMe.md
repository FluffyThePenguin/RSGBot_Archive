# RSGBot

r/Singapore's community building bot.

## Table of Contents
- [Overview](#overview)  
- [Contributing](#contributing)
  - [Getting Started](#getting-started)
  - [Contributing a Feature](#contributing-a-feature)
  - [Contributing Infrastructural/Shared Logic](#contributing-infrastructuralshared-logic)
  - [Tips](#tips)
    - [Typescript Version](#typescript-version)
    - [Debugging](#debugging)
    - [Reddit API Authorization](#reddit-api-authorization)
    - [VSC Codebase Navigation](#vsc-codebase-navigation)
    - [Typescript/Snoowrap await Issue](#typescriptsnoowrap-await-issue)
    - [Snoowrap typings issues](#snoowrap-typings-issues)
  - [Things To Do](#things-to-do)
    - [Infrastructure](#infrastructure)
      - [Error Handling](#error-handling)
      - [CI](#ci)
    - [Shared](#shared)
      - [CommandParser](#commandparser)
      - [Logger](#logger)
      - [MongoDB Client](#mongodb-client)
    - [Features](#features)
      - [Scheduled Posts](#scheduled-posts)
      - [Flair System](#flair-system)
      - [Event Threads](#event-threads)
      - [Translation](#translation)
      - [Auto-Remove Duplicate Links with Different Query Parameters](#auto-remove-duplicate-links-with-different-query-parameters)
      - [Limit Submissions to 5 a day](#limit-submissions-to-5-a-day)
      - [Auto-Flairing](#auto-flairing)
- [Concepts](#concepts)
  - [Unit Testing](#unit-testing)
  - [Documenting](#documenting)
  - [Source Control](#source-control)
  - [Static Typing](#static-typing)
  - [Package Management](#package-management)
  - [Authorization and OAuth 2.0](#authorization-and-oauth-20)
  - [NoSQL Databases](#nosql-databases)
  - [Dependency Injection](#dependency-injection)
  - [Asynchrony](#asynchrony)

## Overview

This readme is an early draft, we will clean it up and flesh it out over the next few weekends.

The codebase is also an early draft. Let us know if you face issues getting started with the bot or if you know better ways to do things.
For now, it is public for early experimenters to tinker with.  

Post suggestions/questions over in our [getting started](https://github.com/RSGTechSupport/RSGBot/issues/1) thread.

Things we need help with are listed in [here](#things-to-do).  

Contributors get access to an exclusive flair on r/Singapore. They also get their names listed here alongside a description of what they have contributed.

## Contributing
### Getting Started

1. Install [visual studio code (vsc)](https://code.visualstudio.com/download).
2. Install [yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable).
3. [Fork this repository](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo).
4. [Clone your fork](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository).
5. Open the root folder of your clone in vsc.
6. Open vsc's [integrated terminal](https://code.visualstudio.com/docs/editor/integrated-terminal).
7. Install dependencies: `yarn install`.
8. Start the bot: `yarn run dev` (refer to [Typescript Version](#typescript-version) if you get compilation errors, [create an issue](https://github.com/RSGTechSupport/RSGBot/issues/new/choose) if errors persist).  
   If it is your first time starting the bot, you will be guided through authorizing a Reddit acount for the bot to use during development.
   After authorizing, you will see output like this:
    ```
    yarn run v1.12.3
    $ set RSGBOT_ENV=development && nodemon ./src/index.ts
    [nodemon] 2.0.4
    [nodemon] to restart at any time, enter `rs`
    [nodemon] watching path(s): *.*
    [nodemon] watching extensions: ts,json
    [nodemon] starting `ts-node ./src/index.ts`
    [ApplicationInitialization]: Polling comments
    [ApplicationInitialization]: Polling submissions     
    [ApplicationInitialization]: Polling private messages
    [ApplicationInitialization]: Bot username: RSGBot
    [ApplicationInitialization]: Latest comment fullname: t1_g0ryajf
    [ApplicationInitialization]: Latest submission fullname: t3_i5vyt3
    [ApplicationInitialization]: Latest message fullname: t4_qheaga
    [ExampleFeature]: onInit
    [Application]: Retrieving comments before: t1_g0ryajf, submissions before: t3_i5vyt3 and messages before: t4_qheaga
    [Application]: No new comments
    [Application]: No new submissions
    [Application]: No new messages   
    [Application]: Retrieving comments before: t1_g0ryajf, submissions before: t3_i5vyt3 and messages before: t4_qheaga
    [Application]: No new comments
    [Application]: No new submissions
    [Application]: No new messages   
    ```
      - `nodemon` restarts the application when you save changes.
      - The Reddit API terms chronologically ordered lists of "things" (comments/posts etc) ["listings"](https://www.reddit.com/dev/api/#listings). When we retrieve from a listing, we specify 
      that we only want things posted after the last thing we processed, e.g. comments posted after the last comment we processed. Things are specified using ["fullnames"](https://www.reddit.com/dev/api/#fullnames), e.g. `t1_g0ryajf`.
      Above you will notice our use of fullnames to specify what we want to retrieve. Note that the Reddit API refers to "chronologically after" as before, i.e. if thing *a* was posted after (chronologically) thing *b*,
      thing *a* is before thing *b* in the listing. 
9. Navigate to [r/RSGBot](https://www.reddit.com/r/RSGBot). This is our test subreddit. In development mode, the bot is configured to poll it. Post a comment or submission there to verify that your bot polls properly:
    ```
    [Application]: Retrieving comments before: t1_g0ryajf, submissions before: t3_i5vyt3 and messages before: t4_qheaga
    [Application]: No new comments
    [Application]: 1 new submissions found
    [ExampleFeature]: onSubmission, author: jtcd, submission title: test
    [Application]: No new messages
    ```
      - `ExampleFeature` echos comments/submissions. You should see replies from your bot on Reddit.

### Contributing a Feature
"Features" are user facing functionality like auto-flairing of posts, removal of duplicate posts,
translating comments etc.

1. First take a look at [ExampleFeature.ts](./src/features/exampleFeature/ExampleFeature.ts). In vsc, open `<project root>/src/features/exampleFeature/ExampleFeature.ts`:
    ```typescript
    import { Comment, PrivateMessage, Submission } from "snoowrap";
    import { inject, injectable } from "tsyringe";
    import Command from "../../shared/Command";
    import ICommentFeature from "../../shared/ICommentFeature";
    import ILogger from "../../shared/ILogger";
    import IPrivateMessageFeature from "../../shared/IPrivateMessageFeature";
    import ISubmissionFeature from "../../shared/ISubmissionFeature";

    /**
    * An example feature that reacts to comments, submissions and private messages.
    */
    @injectable()
    export default class ExampleFeature implements ICommentFeature, ISubmissionFeature, IPrivateMessageFeature {
        constructor(@inject('ILogger') private readonly _logger: ILogger) { }

        /**
         * Logs comment and replies it with a copy of its body.
        */
        public async onComment(comment: Comment, command: Command): Promise<void> {
            this._logger.log('ExampleFeature', `onComment, author: ${comment.author.name}, comment body: ${comment.body}`);

            //@ts-ignore
            await comment.reply(`echo: ${comment.body}`);
        }

        /**
         * Logs submission and replies it with its title.
        */
        public async onSubmission(submission: Submission): Promise<void> {
            this._logger.log('ExampleFeature', `onSubmission, author: ${submission.author.name}, submission title: ${submission.title}`);

            //@ts-ignore
            await submission.reply(`echo: ${submission.title}`);
        }

        /**
         * Logs private message and replies it with a copy of its body.
        */
        public async onPrivateMessage(privateMessage: PrivateMessage, command: Command): Promise<void> {
            this._logger.log('ExampleFeature', `onPrivateMessage, author: ${privateMessage.author.name}, private message body: ${privateMessage.body}`);

            //@ts-ignore
            await privateMessage.reply(`echo: ${privateMessage.body}`);
        }

        /**
         * Logs onInit event.
        */
        public async onInit(): Promise<void> {
            this._logger.log('ExampleFeature', 'onInit');
        }
    }
    ```
      - It implements `ICommentFeature.onComment`, `ISubmissionFeature.onSubmission` and `IPrivateMessageFeature.onPrivateMessage` to react to comments, submissions and private messages. 
      - It does nothing in `IFeature.onInit`. Other features might use this method to register proactive events, e.g. logic to create a meme competition thread at the same time every week.
2. Create a new git branch: `git checkout -b add_<feature_name>`.
3. Add a new folder under src/features or copy the `src/features/exampleFeature` folder.
4. Implement onComment/onSubmission/onPrivateMessage/onInit in your feature.
5. Write [unit tests](#unit-testing).
6. [Document](#documenting) your feature.
7. Register your feature in [index.ts](./src/index.ts). This is how `ExampleFeature` is registered:
    ```typescript
    // Register a feature
    // - Register your feature for interfaces it implements. Note that ICommentFeature, ISubmissionFeature and IPrivateMessage feature
    //   all implement IFeature.
    container.register('IFeature', ExampleFeature);
    container.register('ICommentFeature', ExampleFeature);
    container.register('ISubmissionFeature', ExampleFeature);
    container.register('IPrivateMessageFeature', ExampleFeature);
    ```
8. [Create a pull request](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

TODO document interfaces, shared types  

### Contributing Infrastructural/Shared Logic

TODO

### Tips
#### Typescript Version
This project includes TypeScript 3.9.7 as a dependency. If you have already installed TypeScript on your machine, vsc uses your installed version for type checking.
This might be an issue if your installed version is old.

To use the included TypesScript version: 
  - Open a `.ts` file. At the bottom right hand corner of vsc, you should see "TypeScript x.x.x". 
  - Click the version number > Select TypeScript Version > Use Workspace Version.

#### Debugging
Set a breakpoint, then, in vsc's main menu, click run > start debugging or press f5. 

TODO vsc steps into node internals despite

```
"skipFiles": [
    // "node_modules/**/*.js", // Uncomment to prevent stepping into dependencies
    "<node_internals>/**/*.js" // TODO not working
],
```

in `.vscode/launch.json`. You will notice yourself stepping through files in the `<node_internals>` directory (hover over tab of open file to see it is path).
For now, set a breakpoint in your code after the internals and click continue to skip all that.

#### Reddit API Authorization
The first time you start the bot, you go through an authorization process. If you would like to understand what the bot is doing, check out [Reddit is documentation](https://github.com/reddit-archive/reddit/wiki/oauth2) on authorization.

#### VSC Codebase Navigation
Press `f1` to go to definition. This is a good way to figure out what arguments a snoowrap method takes.

#### Typescript/Snoowrap await Issue
Awaiting some snoowrap methods causes typescript error TS1062.

This is a known issue:
  - https://github.com/not-an-aardvark/snoowrap/issues/221
  - https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33139

We have verified that the underlying code is safe. If you encounter TS1062, add `//@ts-ignore` above the line.

#### Snoowrap typings issues
TODO open issues on snoowrap  
TODO add primer on typescript and typings

Some snoowrap typings are wrong. 

### Things To Do
These are things we need help with right now. We aren't limiting contributions to this list - if you have an idea for RSGBot, open an issue and tell us more. 

#### Infrastructure

##### Error Handling
TODO

##### CI
TODO

#### Shared
##### `CommandParser`
See src/shared/CommandParser for details. Most features will expose commands to users, a shared command parser will save us all time and ensure consistency. 
Could try a library if anyone has suggestions.

##### `Logger`
See src/shared/Logger for details. Need some way to store and expose logs so devs can monitor their features.

##### MongoDB Client
So we hit the Reddit API less. Things like when a users account was created can be stored in MongoDB.

#### Features
##### Scheduled Posts
Private message command to shedule posts.

##### Flair System
Replicate [existing system](https://www.reddit.com/r/singapore/comments/hpikf7/level_system_trial_2/). Try determining user's first activity on
r/Singapore using Pushshift.

##### Event Threads
Once a week, create thread in competition mode, pin it. After 24 hours, identify winners (authors of comments with top 3 most upvotes).
Ask them for a short blurb. Add blurbs to sidebar for a week. Assign special winner emojis to winners.

##### Translation
Requested by r/Singapore mods. Suggested commands: `!translate <text>` to translate a block of text, `!translate` to translate an entire comment or post. 
Suggested API - [Google translate](https://github.com/googleapis/nodejs-translate). Up to you to design the feature though. 

##### Auto-Remove Duplicate Links with Different Query Parameters
Requested by r/Singapore mods. Right now "google.com?user=1" and "google.com?user=2" aren't considered duplicates by reddit is built in bot.
Mods want such duplicates removed, but they want youtube timestamped links excluded.

##### Limit Submissions to 5 a day
Requested by r/Singapore mods.

##### Auto-Flairing
Use ML to detect post category, flair accordingly.

## Concepts
We'd like this project to be accessible. In this section we expand on concepts and tools
we have used and provide links to in-depth information.

### Unit Testing
#### Overview
This project's unit tests are function scoped and "pure"/"mockist". This means we mock all of a function's dependencies and verify that expected arguments are passed to them.
For example, if we are testing function `doSomething()` and it calls `Logger.log(message)`, we mock `Logger.log` and verify that it receives the expected message.

Why pure unit tests?

- This project depends heavily on remote APIs. By mocking dependencies that call remote APIs we avoid onerous setup (maintaining API keys etc) and susceptibility to intermittent network issues.  
- Dependencies that don't call remote APIs may do so down the line. E.g. `Logger.log` only writes to console for now, eventually it might push info to a remote logging service.
- It may not always be clear to contributors whether a dependency calls remote APIs.
- Mocking all dependencies means unit tests do not touch logic in other classes. This clear delineation of unit test boundaries is helpful for open source projects like ours - when a failure occurs, contributors
know for certain the issue is with logic in the function under test, not a dependency that they may not be familiar with.
- Having everyone mock all dependencies keeps things simple and consistent.

#### Writing Unit Tests
We use [Jest](https://jestjs.io/en/) for mocking, asserting and running tests. Refer to Jest's [documentation](https://jestjs.io/docs/en/getting-started.html) for details on the framework.  

Test files are located in the `<project root>/test` directory. File structure in the directory is the same as in `<project root>/src`.  

We provide an example unit test below to give an idea of how we structure unit tests. We have included some basic Jest tips, we recommend going through their
documentation for the full picture though.

##### Example
The following code is extracted from [ExampleFeature.ts](./src/features/exampleFeature/ExampleFeature.ts) and [ExampleFeature.test.ts](./test/features/exampleFeature/ExampleFeature.test.ts).  

we are going to look at the example test for `ExampleFeature.onComment`:  

```ts
...

export default class ExampleFeature implements ICommentFeature, ISubmissionFeature, IPrivateMessageFeature {
    ...

    /**
     * Logs comment and replies it with a copy of its body.
     */
    public async onComment(comment: Comment, command: Command): Promise<void> {
        this._logger.log('ExampleFeature', `onComment, author: ${comment.author.name}, comment body: ${comment.body}`);

        //@ts-ignore
        await comment.reply(`echo: ${comment.body}`);
    }

    ...
}
```

The test. Take note of comments beginning with "Note:":

```ts
...

import { mocked } from "ts-jest/utils";
import ExampleFeature from "../../../src/features/exampleFeature/ExampleFeature";
import Logger from "../../../src/shared/Logger";
import Comment from "snoowrap/dist/objects/Comment";
import RedditUser from "snoowrap/dist/objects/RedditUser";

// Note: jest.mock(modulePath) calls are hoisted above import statements. They replace module exports with "automatic mocks".
// Automatic mocks have the same surface areas as original exports, but all their functions are Jest "mock functions".
// Jest "mock functions" always return undefined and have an extra property, "mock", which stores their call history.
// With the following lines, when we import Logger, Comment and RedditUser, we get automatic mocks instead. Note
// that all three are classes - their construtor functions also get replaced by Jest.
jest.mock("../../../src/shared/Logger");
jest.mock("snoowrap/dist/objects/Comment");
jest.mock("snoowrap/dist/objects/RedditUser");
...

// Note: describe is used to group tests. For simplicity and consistency, use one describe per function. The describe's name should be the function's name.
// This helps with test result formatting and shared setup/teardown.
describe('onComment', () => {
    // Note: Test names should be verbs.
    test('logs comment details and replies', async () => {
        // Arrange
        const dummyAuthorName = 'dummyAuthorName';
        const dummyBody = 'dummyBody';

        const mockRedditUser = new RedditUser(null, null, null); // Note: As mentioned before, RedditUser's constructor function gets replaced. If we didn't mock RedditUser, 
                                                                 // we'd get errors because the original implementation doesn't accept null arguments. Same for Comment.
        mockRedditUser.name = dummyAuthorName;
        
        const mockComment = new Comment(null, null, null);
        mockComment.author = mockRedditUser;
        mockComment.body = dummyBody;

        const mockLogger = new Logger();

        const testSubject = new ExampleFeature(mockLogger);

        // Act
        await testSubject.onComment(mockComment, null);

        // Assert
        const mockLoggerTyped = mocked(mockLogger); // Note: Typescript has no way to know that mockLogger is an automatic mock. This helper method adds automatic mock typings
                                                    // to fix that.
        expect(mockLoggerTyped.log.mock.calls).toEqual([['ExampleFeature', `onComment, author: ${dummyAuthorName}, comment body: ${dummyBody}`]]);

        const mockCommentTyped = mocked(mockComment);
        expect(mockCommentTyped.reply.mock.calls).toEqual([[`echo: ${dummyBody}`]]);
    });
});

...
```

### Documenting
#### Overview
We use [TypeDoc](https://typedoc.org/guides/doccomments/) to generate our docs. You can generate our documentation locally
with `yarn run gen-docs`. Generated documentation can be found in `<project root>/docs`. Open `<project root>/docs/index.html` in your browser
to peruse it.  

Documentation is regenerated automatically when a pull request is merged. Docs are hosted [here](https://RSGTechSupport.github.io/RSGBot/) using Github pages.  

All public and protected members should be documented. This will help with the maintainability of the project.

#### Writing Documentation
Basic TypeDoc syntax is similar to [JSDoc](https://jsdoc.app/) syntax. For example:

```typescript
/** 
 * This is a TypeDoc-valid description of the foo function. 
 */
public foo(): void {
    ...
}
```

TypeDoc parses markdown by default. For example:

```typescript
/** 
 * [Markdown works here](www.example.com).
 * 
 * ```typescript
 * const example = 'code blocks work';
 * ```
 */
public foo(): void {
    ...
}
```

Note that TypeDoc only parses a subset of JSDoc's tags. For example, it parses the `@param` tag:

```typescript
/** 
 * @param someArg This is a TypeDoc-valid description of someArg
 */
public foo(someArg: string): void {
    ...
}
```

Many JSDoc tags aren't necessary since the information they provide can be extracted from typescript.  

You can find more information on TypeDoc syntax, including accepted tags, [here](https://typedoc.org/guides/doccomments/).

### Source Control
TODO Basics
TODO git/github
### Static Typing
TODO Basics
TODO Typescript
### Package Management
TODO Basics
TODO Yarn
### Authorization and OAuth 2.0
TODO Basics
TODO OAuth 2.0
### NoSQL Databases
TODO Basics
TODO MongoDB

##### Running Tests
###### VSC
Navigate to the "Run" view (bug and play icon on the leftmost bar). Select "Debug Jest Tests" in the drop-down. Press ctrl + f5 or from 
the top horizontal menu, Run > Run Without Debugging. You will need to have your terminal open to see test output.

###### Command Line
`yarn run test`.

##### Debugging Tests
###### VSC
Navigate to the "Run" view (bug and play icon on the leftmost bar). Select "Debug Jest Tests" in the drop-down. Press f5 or from 
the top horizontal menu, Run > Start Debugging. Or  

###### Command Line
`yarn run debug-tests`, navigate to "chrome://inspect" in Chrome, click "Open dedicated DevTools for Node". Note, break points don't work if you use Chrome, so you will
have to use `debugger`.

### Dependency Injection
TODO Basics
TODO tsyringe
### Asynchrony
TODO callbacks
TODO async await