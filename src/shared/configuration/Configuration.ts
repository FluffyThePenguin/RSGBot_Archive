import { Mode } from "./Mode";

export default class Configuration {
    constructor(public readonly mode: Mode, public readonly subreddit: string){}
}