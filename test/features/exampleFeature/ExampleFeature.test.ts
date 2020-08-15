import "reflect-metadata";
import { mocked } from "ts-jest/utils";
import ExampleFeature from "../../../src/features/exampleFeature/ExampleFeature";
import Logger from "../../../src/shared/Logger";
import Comment from "snoowrap/dist/objects/Comment";
import RedditUser from "snoowrap/dist/objects/RedditUser";
import Submission from "snoowrap/dist/objects/Submission";
import PrivateMessage from "snoowrap/dist/objects/PrivateMessage";

jest.mock("../../../src/shared/Logger");
jest.mock("snoowrap/dist/objects/Comment");
jest.mock("snoowrap/dist/objects/RedditUser");
jest.mock("snoowrap/dist/objects/Submission");
jest.mock("snoowrap/dist/objects/PrivateMessage");

describe('onComment', () => {
    test('logs comment details and replies', async () => {
        // Arrange
        const dummyAuthorName = 'dummyAuthorName';
        const dummyBody = 'dummyBody';

        const mockRedditUser = new RedditUser(null, null, null);
        mockRedditUser.name = dummyAuthorName;
        
        const mockComment = new Comment(null, null, null);
        mockComment.author = mockRedditUser;
        mockComment.body = dummyBody;

        const mockLogger = new Logger();

        const testSubject = new ExampleFeature(mockLogger);

        // Act
        await testSubject.onComment(mockComment, null);

        // Assert
        const mockLoggerTyped = mocked(mockLogger);
        expect(mockLoggerTyped.log.mock.calls).toHaveLength(1);
        expect(mockLoggerTyped.log.mock.calls[0][0]).toEqual('ExampleFeature');
        expect(mockLoggerTyped.log.mock.calls[0][1]).toEqual(`onComment, author: ${dummyAuthorName}, comment body: ${dummyBody}`);

        const mockCommentTyped = mocked(mockComment);
        expect(mockCommentTyped.reply.mock.calls).toHaveLength(1);
        expect(mockCommentTyped.reply.mock.calls[0][0]).toEqual(`echo: ${dummyBody}`);
    });
});

describe('onSubmission', () => {
    test('logs submission details and replies', async () => {
        // Arrange
        const dummyAuthorName = 'dummyAuthorName';
        const dummyTitle = 'dummyTitle';
        
        const mockRedditUser = new RedditUser(null, null, null);
        mockRedditUser.name = dummyAuthorName;
        
        const mockSubmission = new Submission(null, null, null);
        mockSubmission.author = mockRedditUser;
        mockSubmission.title = dummyTitle;

        const mockLogger = new Logger();
        
        const testSubject = new ExampleFeature(mockLogger);

        // Act
        await testSubject.onSubmission(mockSubmission);

        // Assert
        const mockLoggerTyped = mocked(mockLogger);
        expect(mockLoggerTyped.log.mock.calls).toHaveLength(1);
        expect(mockLoggerTyped.log.mock.calls[0][0]).toEqual('ExampleFeature');
        expect(mockLoggerTyped.log.mock.calls[0][1]).toEqual(`onSubmission, author: ${dummyAuthorName}, submission title: ${dummyTitle}`);

        const mockCommentTyped = mocked(mockSubmission);
        expect(mockCommentTyped.reply.mock.calls).toHaveLength(1);
        expect(mockCommentTyped.reply.mock.calls[0][0]).toEqual(`echo: ${dummyTitle}`);
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

        const mockLogger = new Logger();
        
        const testSubject = new ExampleFeature(mockLogger);

        // Act
        await testSubject.onPrivateMessage(mockPrivateMessage, null);

        // Assert
        const mockLoggerTyped = mocked(mockLogger);
        expect(mockLoggerTyped.log.mock.calls).toHaveLength(1);
        expect(mockLoggerTyped.log.mock.calls[0][0]).toEqual('ExampleFeature');
        expect(mockLoggerTyped.log.mock.calls[0][1]).toEqual(`onPrivateMessage, author: ${dummyAuthorName}, private message body: ${dummyBody}`);

        const mockCommentTyped = mocked(mockPrivateMessage);
        expect(mockCommentTyped.reply.mock.calls).toHaveLength(1);
        expect(mockCommentTyped.reply.mock.calls[0][0]).toEqual(`echo: ${dummyBody}`);
    });
});

describe('onInit', () => {
    test('logs', async () => {
        // Arrange
        const mockLogger = new Logger();
        const testSubject = new ExampleFeature(mockLogger);

        // Act
        await testSubject.onInit();

        // Assert
        const mockLoggerTyped = mocked(mockLogger);
        expect(mockLoggerTyped.log.mock.calls).toHaveLength(1);
        expect(mockLoggerTyped.log.mock.calls[0][0]).toEqual('ExampleFeature');
        expect(mockLoggerTyped.log.mock.calls[0][1]).toEqual('onInit');
    });
});