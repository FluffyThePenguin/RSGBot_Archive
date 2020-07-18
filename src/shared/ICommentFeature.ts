import IFeature from "./IFeature";
import snoowrap from "snoowrap";
import Command from "./Command";

export default interface ICommentFeature extends IFeature {
    onComment(comment: snoowrap.Comment, command: Command): Promise<void>;
}