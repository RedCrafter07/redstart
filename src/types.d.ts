export type Config = Record<string, string>;
export type Cwd = string;
export type InitiateFunction = (config: Config, cwd: Cwd) => Promise<void>|void;
export type ValidateFunction = (config: Config, cwd: Cwd) => Promise<boolean>|boolean;
export interface Module {
    validate: ValidateFunction;
    initiate: InitiateFunction;
}