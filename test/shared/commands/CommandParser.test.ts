import "reflect-metadata";
import CommandParser from "../../../src/shared/commands/CommandParser";

describe('tryParse', () => {
    test.each([
        '    ', // All spaces
        '  x', // First non space character isn't !
        '  !  ', // Only spaces after !
        ' !  *', // Invalid name char after !
        ' ! te@st', // Invalid char in command name
        ' ! test b', // Invalid char after command name
        ' ! test  - ', // - without an option name after
        ' ! test  - !', // Invalid first char of option name
        ' ! test  -opt+ion', // Invalid character in option name
        ' ! test  -option "value', // Option value missing closing " or ”
    ])('Returns null if candidateCommand is invalid', (dummyCandidateCommand: string) => {
        // Arrange
        const commandParser = new CommandParser();

        // Act
        const result = commandParser.tryParse(dummyCandidateCommand);

        // Assert
        expect(result).toBeNull();
    });

    test.each([
        ['!commandName', 'commandName', null], // No options
        ['!commandName -optionName', 'commandName', new Map<string, string>([['optionName', null]])], // Option with no value
        ['!commandName -optionName value', 'commandName', new Map<string, string>([['optionName', 'value']])], // Option with standard value
        ['!commandName -optionName "value"', 'commandName', new Map<string, string>([['optionName', 'value']])], // Option with " quoted value
        ['!commandName -optionName “value”', 'commandName', new Map<string, string>([['optionName', 'value']])], // Option with “ quoted value
        ['!commandName -optionName "value \\\" value"', 'commandName', new Map<string, string>([['optionName', 'value \\\" value']])], // Quoted option value with escaped quotes
        ['!commandName -optionName "value * # \n \r \t value"', 'commandName', new Map<string, string>([['optionName', 'value * # \n \r \t value']])], // Quoted option value with misc chars
        ['!commandName -option1Name “value1” -option2Name "value2" -option3Name value3 -option4Name', 'commandName', 
            new Map<string, string>([['option1Name', 'value1'], ['option2Name', 'value2'], ['option3Name', 'value3'], ['option4Name', null]])], // Multiple options
        [' ! commandName - option1Name “value1”  -  option2Name "value2"   -   option3Name value3 -option4Name ', 'commandName', 
            new Map<string, string>([['option1Name', 'value1'], ['option2Name', 'value2'], ['option3Name', 'value3'], ['option4Name', null]])] // Redundant whitespace
    ])('Returns command with expected options if candidateCommand is valid', (dummyCandidateCommand: string, expectedCommandName: string, expectedOptions: Map<string, string>) => {
        // Arrange
        const commandParser = new CommandParser();

        // Act
        const result = commandParser.tryParse(dummyCandidateCommand);

        // Assert
        expect(result).not.toBeNull();
        expect(result.name).toBe(expectedCommandName);
        expect(result.options).toEqual(expectedOptions);
    });
});
