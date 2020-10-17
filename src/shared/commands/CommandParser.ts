import Command from "./Command";
import { singleton } from "tsyringe";

@singleton()
export default class CommandParser {
    // Returns a Command if candidateCommand is a valid, null otherwise.
    //
    // Basic command regex: / *! *[a-zA-Z0-9]+ +- *[a-zA-Z0-9]+ +[^ ]*+/
    //   - See test/shared/commands/CommandParser.test.ts for examples of valid and invalid commands.
    //   - Some autocorrect systems add spaces after ! and -, so we're flexible about spaces.
    //   - If an option value begins with " or “ (curly or straight quotes), value extends to next unescaped " or ”. This way users can enter spaced, multiline strings as values.
    //   - We accept curly quotes since some mobile devices default to them.
    //   - Multiple options are allowed
    //
    // We want to give users feedback when they enter invalid commands (i.e. no failing silently). For now our feedback isn't granular - 
    // if we encounter invalid syntax in candidateCommand, tryParse returns null and the Application instance just sends the user a message
    // stating that the command is invalid along with a list of valid commands. This parsing method does allow for granular feedback,
    // consider adding in future.
    public tryParse(candidateCommand: string): Command {
        const numCharacters = candidateCommand.length;
        const maxIndex = numCharacters - 1;
        let index = 0;
        
        // Spaces before !
        index = this.getIndexOfNextNonSpaceCharacter(candidateCommand, numCharacters, index);
        if (index > maxIndex || candidateCommand[index] !== '!') {
            return null;
        }

        // Spaces after !
        index = this.getIndexOfNextNonSpaceCharacter(candidateCommand, numCharacters, index + 1);
        if (index > maxIndex || !this.isValidNameChar(candidateCommand[index])) {
            return null;
        }
        const commandNameStartIndex = index;

        // Command name
        index = this.getIndexOfNextInvalidNameCharacter(candidateCommand, numCharacters, index + 1);
        if (index > maxIndex) {
            return new Command(candidateCommand.slice(commandNameStartIndex), null);
        }
        if (candidateCommand[index] !== ' ') { // Invalid character in command name
            return null;
        }
        const commandName = candidateCommand.slice(commandNameStartIndex, index);

        // Options
        let options: Map<string, string> = null;
        let optionNameStartIndex: number, valueStartIndex: number;

        while (true) {
            // Next -
            index = this.getIndexOfNextNonSpaceCharacter(candidateCommand, numCharacters, index + 1);
            if (index > maxIndex) {
                return new Command(commandName, options);
            }
            if (candidateCommand[index] !== '-') { // Unexpected character after command name or option value
                return null;
            }
            if (options === null) {
                options = new Map<string, string>();
            }

            // Spaces before option name
            index = this.getIndexOfNextNonSpaceCharacter(candidateCommand, numCharacters, index + 1);
            if (index > maxIndex || !this.isValidNameChar(candidateCommand[index])) { // - without an option name after or option name has invalid first char
                return null;
            }
            optionNameStartIndex = index;

            // Option name
            index = this.getIndexOfNextInvalidNameCharacter(candidateCommand, numCharacters, index + 1);
            if (index > maxIndex) {
                const optionName = candidateCommand.slice(optionNameStartIndex);
                options.set(optionName, null); // Option might not have a value
                return new Command(commandName, options);
            }
            if (candidateCommand[index] !== ' ') { // Invalid character in option name
                return null;
            }
            const optionName = candidateCommand.slice(optionNameStartIndex, index);
            options.set(optionName, null); // Option might not have a value

            // Spaces before option value
            index = this.getIndexOfNextNonSpaceCharacter(candidateCommand, numCharacters, index + 1);
            if (index > maxIndex) {
                return new Command(commandName, options);
            }
            
            // Option value
            const valueFirstChar = candidateCommand[index];
            if (valueFirstChar === '"' || valueFirstChar === '“') { // Parse till " or ”
                valueStartIndex = index + 1; // Skip quote
                do {
                    index = this.getIndexOfNextSpecifiedCharacters(candidateCommand, numCharacters, index + 1, '"', '”');
                } while (candidateCommand[index - 1] === '\\' && index <= maxIndex);

                if(index > maxIndex){ // No closing '"' or '”'
                    return null;
                }
            } else { // Parse till space or end of string
                valueStartIndex = index;
                index = this.getIndexOfNextSpecifiedCharacter(candidateCommand, numCharacters, index + 1, ' ');
            }

            // Reached end
            if (index > maxIndex) {
                options.set(optionName, candidateCommand.slice(valueStartIndex));

                return new Command(commandName, options);
            }

            options.set(optionName, candidateCommand.slice(valueStartIndex, index));
        }
    }

    // Two separate methods so we can avoid allocations
    private getIndexOfNextSpecifiedCharacters(text: string, textLength: number, index: number, char1: string, char2: string): number {
        let i: number;

        for (i = index; i < textLength; i++) {
            const char = text[i];
            if (char === char1 || char === char2) {
                return i;
            }
        }

        return i;
    }

    private getIndexOfNextSpecifiedCharacter(text: string, textLength: number, index: number, char: string): number {
        let i: number;

        for (i = index; i < textLength; i++) {
            if (text[i] === char) {
                return i;
            }
        }

        return i;
    }

    private getIndexOfNextNonSpaceCharacter(text: string, textLength: number, index: number): number {
        let i: number;

        for (i = index; i < textLength; i++) {
            if (text[i] !== ' ') {
                return i;
            }
        }

        return i;
    }

    private getIndexOfNextInvalidNameCharacter(text: string, textLength: number, index: number): number {
        let i: number;

        for (i = index; i < textLength; i++) {
            if (!this.isValidNameChar(text[i])) {
                return i;
            }
        }

        return i;
    }

    private isValidNameChar(char: string): boolean {
        return char >= "a" && char <= "z" || char >= "A" && char <= "Z" || char >= '0' && char <= '9';
    }
}