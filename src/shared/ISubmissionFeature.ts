import IFeature from "./IFeature";
import snoowrap from "snoowrap";

export default interface ISubmissionFeature extends IFeature {
    onSubmission(submission: snoowrap.Submission): Promise<void>;
}