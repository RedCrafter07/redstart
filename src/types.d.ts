/**
 * @license GPL3
 * @author FishingHacks (https://github.com/FishingHacks)
 */

export type Config = Record<string, string>;
export type Cwd = string;

export type InitiateFunction = (
    config: Config,
    addTimeSlice: (name: string)=>void,
    cwd: Cwd,
    redstartConfig: Record<string, string>
) => Promise<void> | void;
export type ValidateFunction = (
    config: Config,
    cwd: Cwd,
    redstartConfig: Record<string, string>
) => Promise<string|true> | string|true;
export interface Module {
    validate: ValidateFunction;
    initiate: InitiateFunction;
}
