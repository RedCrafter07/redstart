export type Config = Record<string, string>;
export type Cwd = string;

export type InitiateFunction = (
    config: Config,
    cwd: Cwd,
    redstartConfig: Record<string, string>
) => Promise<void> | void;
export type ValidateFunction = (
    config: Config,
    cwd: Cwd,
    redstartConfig: Record<string, string>
) => Promise<boolean> | boolean;
export interface Module {
    validate: ValidateFunction;
    initiate: InitiateFunction;
}
