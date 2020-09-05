import Command from "./Command";
import { singleton } from "tsyringe";

@singleton()
export default class CommandParser {
    // Returns a Command if commentBody is a command, null otherwise
    tryParse(commentBody: string): Command {
        // TODO
        // - Several features expose commands to users. For consistency, we use a shared parser.
        // - Basic syntax: !\s*name\s+-\s*option\s+value
        //   - Exclamation mark followed by 0 or more whitespaces, followed by the command name followed by 1 or more whitespaces, followed by
        //     dash followed by 0 or more whitespaces, followed by an option name, followed by 1 or more whitespaces, followed by a value.
        //   - If value begins with " or “ (curly or straight quotes), value extends to next unescaped " or “. This is so users can enter long, multiline strings as values.
        //   - Syntax based on feedback for the level system trial https://www.reddit.com/r/singapore/comments/hpikf7/level_system_trial_2/.
        //     According to users, some autocorrect systems add spaces after ! and - and some keyboards default to curly quotes.
        // - C# implementation used regex, probably better to implement a finite-state machine.

        return new Command('name', new Map<string, string>())
    }
}