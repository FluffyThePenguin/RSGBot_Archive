import "reflect-metadata";
import { mocked } from "ts-jest/utils";
import ExampleFeature from "../../../src/features/exampleFeature/ExampleFeature";
import Logger from "../../../src/shared/logging/Logger";
import Comment from "snoowrap/dist/objects/Comment";
import RedditUser from "snoowrap/dist/objects/RedditUser";
import Submission from "snoowrap/dist/objects/Submission";
import PrivateMessage from "snoowrap/dist/objects/PrivateMessage";

jest.mock("../../../src/shared/logging/Logger");
jest.mock("snoowrap/dist/objects/Comment");
jest.mock("snoowrap/dist/objects/RedditUser");
jest.mock("snoowrap/dist/objects/Submission");
jest.mock("snoowrap/dist/objects/PrivateMessage");

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

describe('onSubmission', () => {
    const dummyAuthorName = 'dummyAuthorName';
    const dummyTitle = 'dummyTitle';
    const dummyTitleWithHello = 'dummyTitle hello';

    test('logs submission details', async () => {
        // Arrange
        const mockRedditUser = new RedditUser(null, null, null);
        mockRedditUser.name = dummyAuthorName;

        const mockSubmission = new Submission(null, null, null);
        mockSubmission.author = mockRedditUser;
        mockSubmission.title = dummyTitle;

        const mockLogger = new Logger(null);
        const testSubject = new ExampleFeature(mockLogger);

        // Act
        await testSubject.onSubmission(mockSubmission);

        // Assert
        const mockLoggerTyped = mocked(mockLogger);
        expect(mockLoggerTyped.info.mock.calls[0][0]).toEqual(`onSubmission, author: ${dummyAuthorName}, submission title: ${dummyTitle}`);
    });

    test('replies submission if its title contains "hello"', async () => {
        // Arrange
        const mockSubmission = new Submission(null, null, null);
        mockSubmission.author = new RedditUser(null, null, null);
        mockSubmission.title = dummyTitleWithHello;

        const testSubject = new ExampleFeature(new Logger(null));

        // Act
        await testSubject.onSubmission(mockSubmission);

        // Assert
        const mockSubmissionTyped = mocked(mockSubmission);
        expect(mockSubmissionTyped.reply.mock.calls[0][0]).toEqual('Hi!');
    });

    test('ignores submission if its titles does not contain "hello"', async () => {
        // Arrange
        const mockSubmission = new Submission(null, null, null);
        mockSubmission.author = new RedditUser(null, null, null);
        mockSubmission.title = dummyTitle;

        const testSubject = new ExampleFeature(new Logger(null));

        // Act
        await testSubject.onSubmission(mockSubmission);

        // Assert
        const mockSubmissionTyped = mocked(mockSubmission);
        expect(mockSubmissionTyped.reply.mock.calls.length).toEqual(0);
    });
});

describe('onPrivateMessage', () => {
    test('logs private message details and replies', async () => {
        // Arrange
        const dummyAuthorName = 'dummyAuthorName';
        const dummyBody = 'dummyBody';

        const mockRedditUser = new RedditUser(null, null, null);
        mockRedditUser.name = dummyAuthorName;

        const mockPrivateMessage = new PrivateMessage(null, null, null);
        mockPrivateMessage.author = mockRedditUser;
        mockPrivateMessage.body = dummyBody;

        const mockLogger = new Logger(null);
        const testSubject = new ExampleFeature(mockLogger);

        // Act
        await testSubject.onPrivateMessage(mockPrivateMessage, null);

        // Assert
        const mockLoggerTyped = mocked(mockLogger);
        expect(mockLoggerTyped.info.mock.calls[0][0]).toEqual(`onPrivateMessage, author: ${dummyAuthorName}, private message body: ${dummyBody}`);

        const mockPrivateMessageTyped = mocked(mockPrivateMessage);
        expect(mockPrivateMessageTyped.reply.mock.calls[0][0]).toEqual(`echo: ${dummyBody}`);
    });
});

describe('onInit', () => {
    test('logs', async () => {
        // Arrange
        const mockLogger = new Logger(null);
        const testSubject = new ExampleFeature(mockLogger);

        // Act
        await testSubject.onInit();

        // Assert
        const mockLoggerTyped = mocked(mockLogger);
        expect(mockLoggerTyped.info.mock.calls[0][0]).toEqual('onInit');
    });
});