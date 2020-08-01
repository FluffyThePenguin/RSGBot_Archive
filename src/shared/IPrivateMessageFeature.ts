import IFeature from "./IFeature";
import snoowrap from "snoowrap";
import Command from "./Command";

export default interface IPrivateMessageFeature extends IFeature {
    onPrivateMessage(privateMessage: snoowrap.PrivateMessage, command: Command): Promise<void>;
}