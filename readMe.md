# RSGBot

[![Build Status](https://dev.azure.com/JeremyTCD/RSGBot/_apis/build/status/RSGTechSupport.RSGBot?branchName=master)](https://dev.azure.com/JeremyTCD/RSGBot/_build/latest?definitionId=13&branchName=master) 
[![codecov](https://codecov.io/gh/RSGTechSupport/RSGBot/branch/master/graph/badge.svg)](https://codecov.io/gh/RSGTechSupport/RSGBot)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/RSGTechSupport/RSGBot/blob/master/license.md)

r/Singapore's community building bot.

## Table of Contents
- [Overview](#overview)  
- [Contributing](#contributing)
  - [Getting Started](#getting-started)
  - [Contributing a Feature](#contributing-a-feature)
  - [Contributing Infrastructural/Shared Logic](#contributing-infrastructuralshared-logic)
  - [Tips on Contributing](#tips-on-contributing)
    - [Typescript Version](#typescript-version)
    - [Debugging](#debugging)
    - [Reddit API Authorization](#reddit-api-authorization)
    - [VSC Codebase Navigation](#vsc-codebase-navigation)
    - [Typescript/Snoowrap await Issue](#typescriptsnoowrap-await-issue)
    - [Snoowrap typings issues](#snoowrap-typings-issues)
  - [Things To Do](#things-to-do)
    - [Shared](#shared)
      - [CommandParser](#commandparser)
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
  - [Logging](#logging)
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
    [Sep 5th 2020 18:11:58][Info][Application]: Initializing - bot username = RSGBot
    [Sep 5th 2020 18:11:58][Info][Application]: Initializaing - latest comment fullname = t1_g38hs0c
    [Sep 5th 2020 18:11:58][Info][Application]: Initializaing - latest submission fullname = t3_iirq5z
    [Sep 5th 2020 18:11:58][Info][Application]: Initializaing - latest message fullname = t4_r8b4ut
    [Sep 5th 2020 18:11:58][Info][ExampleFeature]: onInit
    [Sep 5th 2020 18:11:58][Info][Application]: Retrieving comments before: t1_g38hs0c, submissions before: t3_iirq5z and messages before: t4_r8b4ut
    [Sep 5th 2020 18:11:59][Info][Application]: No new comments
    [Sep 5th 2020 18:11:59][Info][Application]: No new submissions
    [Sep 5th 2020 18:11:59][Info][Application]: No new messages
    [Sep 5th 2020 18:12:05][Info][Application]: Retrieving comments before: t1_g38hs0c, submissions before: t3_iirq5z and messages before: t4_r8b4ut
    [Sep 5th 2020 18:12:06][Info][Application]: No new comments
    [Sep 5th 2020 18:12:06][Info][Application]: No new submissions
    [Sep 5th 2020 18:12:06][Info][Application]: No new messages
    ```
      - `nodemon` restarts the application when you save changes.
      - The Reddit API terms chronologically ordered lists of "things" (comments/posts etc) ["listings"](https://www.reddit.com/dev/api/#listings). When we retrieve from a listing, we specify 
      that we only want things posted after the last thing we processed, e.g. comments posted after the last comment we processed. Things are specified using ["fullnames"](https://www.reddit.com/dev/api/#fullnames), e.g. `t1_g38hs0c`.
      Above you will notice our use of fullnames to specify what we want to retrieve. Note that the Reddit API refers to "chronologically after" as before, i.e. if thing *a* was posted after (chronologically) thing *b*,
      thing *a* is before thing *b* in the listing. 
9. Navigate to [r/RSGBot](https://www.reddit.com/r/RSGBot). This is our test subreddit. In development mode, the bot polls it for new comments and submissions. Post a submission there with "hello" in its title. Your bot should detect the submission and post a reply:
    ```
    [Sep 5th 2020 18:12:06][Info][Application]: Retrieving comments before: t1_g38hs0c, submissions before: t3_iirq5z and messages before: t4_r8b4ut
    [Sep 5th 2020 18:12:06][Info][Application]: No new comments
    [Sep 5th 2020 18:12:06][Info][Application]: 1 new submissions found
    [Sep 5th 2020 18:12:06][Info][ExampleFeature]: onSubmission, author: jtcd, submission title: test
    [Sep 5th 2020 18:12:06][Info][Application]: No new messages
    ```
      - `ExampleFeature` replies comments containing "hello" and submissions with "hello" in their titles.

### Contributing a Feature
Features are user facing functionality like auto-flairing of posts, removal of duplicate posts,
translating comments etc.

1. First take a look at [ExampleFeature.ts](./src/features/exampleFeature/ExampleFeature.ts). In vsc, open `<project root>/src/features/exampleFeature/ExampleFeature.ts`:
    ```typescript
    import { Comment, PrivateMessage, Submission } from "snoowrap";
    import Command from "../../shared/commands/Command";
    import Feature from "../../shared/features/Feature";
    import Logger from "../../shared/logging/Logger";
    import { injectable } from "tsyringe";

    /**
    * An example feature that reacts to comments, submissions and private messages.
    */
    @injectable()
    export default class ExampleFeature extends Feature {
        constructor(logger: Logger) {
            super(logger);
        }

        /**
        * Logs comment, replies if it contains "hello".
        */
        public async onComment(comment: Comment, _: Command): Promise<void> {
            this._logger.info(`onComment, author: ${comment.author.name}, comment body: ${comment.body}`);

            if (comment.body.toLowerCase().includes('hello')) {
                //@ts-ignore
                await comment.reply('Hi!');
            }
        }

        /**
        * Logs submission, replies if its title contains "hello".
        */
        public async onSubmission(submission: Submission): Promise<void> {
            this._logger.info(`onSubmission, author: ${submission.author.name}, submission title: ${submission.title}`);

            if (submission.title.toLowerCase().includes('hello')) {
                //@ts-ignore
                await submission.reply(`Hi!`);
            }
        }

        /**
        * Logs private message, replies with a copy of its body.
        */
        public async onPrivateMessage(privateMessage: PrivateMessage, _: Command): Promise<void> {
            this._logger.info(`onPrivateMessage, author: ${privateMessage.author.name}, private message body: ${privateMessage.body}`);

            //@ts-ignore
            await privateMessage.reply(`echo: ${privateMessage.body}`);
        }

        /**
        * Logs onInit event.
        */
        public async onInit(): Promise<void> {
            this._logger.info('onInit');
        }
    }
    ```
      - It extends `Feature`, implementing `Feature.onComment`, `Feature.onSubmission`, `Feature.onPrivateMessage` and `Feature.onInit`. 
2. Create a new git branch: `git checkout -b add_<feature_name>`.
3. Add a new folder under src/features or copy the `src/features/exampleFeature` folder.
4. Extend `Feature`.
5. Write [unit tests](#unit-testing).
6. [Document](#documenting) your feature.
7. Register your feature in [index.ts](./src/index.ts). This is how `ExampleFeature` is registered:
    ```typescript
    container.register(Feature as constructor<Feature>, ExampleFeature);
    ```
8. [Create a pull request](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).
9. After we merge your pull request, [monitor your feature's logs](#logging).

TODO document interfaces, shared types  

### Contributing Shared Logic

TODO

### Tips on Contributing
#### Typescript Version
This project includes TypeScript 3.9.7 as a dependency. If you have already installed TypeScript on your machine, vsc uses your installed version for type checking.
You might get compiler errors if your installed version is old.

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

#### Shared
##### `CommandParser`
See src/shared/CommandParser for details. Most features will expose commands to users, a shared command parser will save us all time and ensure consistency. 
Could try a library if anyone has suggestions.

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
This project's unit tests are function scoped and "pure"/"mockist". This means we mock all of a function's dependencies and verify that they receive expected arguments.
For example, if we are testing function `doSomething()` which calls `Logger.log(message)`, we mock `Logger.log` and verify that it receives the expected message.

Why pure unit tests?

- This project depends heavily on remote APIs. By mocking dependencies that call remote APIs we avoid onerous setup (maintaining API keys etc) and intermittent network issues.  
- Dependencies that don't call remote APIs may do so down the line.
- It may not always be clear to contributors whether a dependency calls remote APIs.
- Mocking all dependencies means unit tests do not touch logic in other classes. This clear delineation of unit test boundaries is helpful for open source projects like ours - when a failure occurs, contributors
know for certain the issue is with logic in the function under test, not a dependency that they may not be familiar with.

In short, mocking all dependencies keeps things simple and consistent.

#### Writing Unit Tests
We use [Jest](https://jestjs.io/en/) for mocking, asserting and running tests. Refer to Jest's [documentation](https://jestjs.io/docs/en/getting-started.html) for details on the framework.  

Test files are located in the `<project root>/test` directory. File structure in the directory is the same as in `<project root>/src`.  

We provide an example unit test below to give an idea of how we structure unit tests. We have included some basic Jest tips, we recommend going through their
documentation for the full picture though.

##### Example
The following code is extracted from [ExampleFeature.ts](./src/features/exampleFeature/ExampleFeature.ts) and [ExampleFeature.test.ts](./test/features/exampleFeature/ExampleFeature.test.ts).  

we are going to look at tests for `ExampleFeature.onComment`:  

```ts
...

export default class ExampleFeature implements ICommentFeature, ISubmissionFeature, IPrivateMessageFeature {
    ...

    /**
     * Logs comment, replies if it contains "hello".
     */
    public async onComment(comment: Comment, _: Command): Promise<void> {
        this._logger.info(`onComment, author: ${comment.author.name}, comment body: ${comment.body}`);

        if (comment.body.toLowerCase().includes('hello')) {
            //@ts-ignore
            await comment.reply('Hi!');
        }
    }

    ...
}
```

The tests. Take note of comments beginning with "Note:":

```ts
...
import { mocked } from "ts-jest/utils";
import ExampleFeature from "../../../src/features/exampleFeature/ExampleFeature";
import Logger from "../../../src/shared/Logger";
import Comment from "snoowrap/dist/objects/Comment";
import RedditUser from "snoowrap/dist/objects/RedditUser";
...

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
    const dummyAuthorName = 'dummyAuthorName';
    const dummyBody = 'dummyBody';
    const dummyBodyWithHello = 'dummyBody hello';

    test('logs comment details', async () => {
        // Arrange
        const mockRedditUser = new RedditUser(null, null, null);
        mockRedditUser.name = dummyAuthorName;

        const mockComment = new Comment(null, null, null);
        mockComment.author = mockRedditUser;
        mockComment.body = dummyBody;

        const mockLogger = new Logger(null);
        const testSubject = new ExampleFeature(mockLogger);

        // Act
        await testSubject.onComment(mockComment, null);

        // Assert
        const mockLoggerTyped = mocked(mockLogger);
        expect(mockLoggerTyped.info.mock.calls[0][0]).toEqual(`onComment, author: ${dummyAuthorName}, comment body: ${dummyBody}`);
    });

    test('replies comment if it contains "hello"', async () => {
        // Arrange
        const mockComment = new Comment(null, null, null);
        mockComment.author = new RedditUser(null, null, null);
        mockComment.body = dummyBodyWithHello;

        const testSubject = new ExampleFeature(new Logger(null));

        // Act
        await testSubject.onComment(mockComment, null);

        // Assert
        const mockCommentTyped = mocked(mockComment);
        expect(mockCommentTyped.reply.mock.calls[0][0]).toEqual('Hi!');
    });

    test('ignores comment if it does not contain "hello"', async () => {
        // Arrange
        const mockComment = new Comment(null, null, null);
        mockComment.author = new RedditUser(null, null, null);
        mockComment.body = dummyBody;

        const testSubject = new ExampleFeature(new Logger(null));

        // Act
        await testSubject.onComment(mockComment, null);

        // Assert
        const mockCommentTyped = mocked(mockComment);
        expect(mockCommentTyped.reply.mock.calls.length).toEqual(0);
    });
});

...
```

##### Running Tests
###### VSC
Navigate to the "Run" view (bug and play icon on the leftmost bar). Select "Debug Jest Tests" in the drop-down. Press ctrl + f5 or from 
the top horizontal menu, Run > Run Without Debugging. You will need to have your terminal open to see test output:

```
 PASS  test/features/exampleFeature/ExampleFeature.test.ts
  onComment
    √ logs comment details (8 ms)
    √ replies comment if it contains "hello" (1 ms)
    √ ignores comment if it does not contain "hello" (2 ms)
  onSubmission
    √ logs submission details (2 ms)
    √ replies submission if its title contains "hello" (1 ms)
    √ ignores submission if its titles does not contain "hello" (2 ms)
  onPrivateMessage
    √ logs private message details and replies (1 ms)
  onInit
    √ logs (1 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        2.48 s, estimated 3 s
Ran all test suites.
Done in 3.32s.
```

###### Command Line
`yarn run test`.

##### Debugging Tests
###### VSC
Navigate to the "Run" view (bug and play icon on the leftmost bar). Select "Debug Jest Tests" in the drop-down. Press f5 or from 
the top horizontal menu, Run > Start Debugging. Or  

###### Command Line
`yarn run debug-tests`, navigate to "chrome://inspect" in Chrome, click "Open dedicated DevTools for Node". Note, break points don't work if you use Chrome, so you will
have to use `debugger`.

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

### Logging
#### How to Log
[Inject](#dependency-injection) `Logger` into your class.  

If your class extends `Feature`, pass the logger to `Feature`'s constructor. Thereafter, you can access your logger using `this._logger`:

```typescript
constructor(logger: Logger) {
    super(logger);
}

public async onComment(comment: Comment, _: Command): Promise<void> {
    this._logger.info(`Comment received: ${comment.body}`);
}
```

Otherwise, if your class does not extend `Feature`, manually call `Logger.setTag(tag: string)`:

```typescript
constructor(private readonly _logger: Logger) {
    logger.setTag('tag');
}

public doSomething(): void {
    this._logger.info('hi');
}
```

Use `Logger.error` to log errors - whether a log entry is info or error level only affects its metadata, as we shall see in the next section.

#### Viewing Logs
By default, in development mode, logs are written to the console. Logs look like this:

```
[Sep 5th 2020 18:11:58][Info][Application]: Retrieving comments before: t1_g38hs0c, submissions before: t3_iirq5z and messages before: t4_r8b4ut
[Sep 5th 2020 18:11:59][Info][Application]: No new comments
[Sep 5th 2020 18:11:59][Info][Application]: No new submissions
[Sep 5th 2020 18:11:59][Info][Application]: No new messages
```

Log entry format: `[<gmt+8 date>][<level>][<tag>]: <message>`.  

In production mode, logs are written to a remote service. After your logic goes live, we'll give you access to the remote service. It has a log viewer which you can use to filter log entries with your
tag.  

Error level log entries (entries with `[Error]` metadata) trigger email notifications to some of this project's maintainers, so use `Logger.error` only where appropriate.

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

### Dependency Injection
TODO Basics
TODO tsyringe
### Asynchrony
TODO callbacks
TODO async await