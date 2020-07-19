import Command from "./Command";

export default interface ICommandParser{
    tryParse(commentBody: string): Command;
}