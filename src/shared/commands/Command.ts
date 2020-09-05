import { Key } from "readline";

// Immutable since multiple features will receive the same command
export default class Command {
    constructor(public readonly name: string, public readonly options: ReadonlyMap<string, string>) {}
}