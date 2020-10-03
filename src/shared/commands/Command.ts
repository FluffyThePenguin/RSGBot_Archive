
// Immutable since multiple features will receive the same command
// Options may be null (a command may have no options)
export default class Command {
    constructor(public readonly name: string, public readonly options: ReadonlyMap<string, string>) {}
}