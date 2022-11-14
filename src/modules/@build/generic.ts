import chalk from "chalk";
import { sync as spawnSync } from "cross-spawn";
import { is } from "../../lib/utils";
import { Module } from "../../types";

export default {
    validate(config, cwd) {
        return is.set(config.command) && is.str(config.command);
    },
    initiate(config, cwd) {
        const compile = spawnSync(config.command, parseArguments(config.arguments), { cwd });
        if (compile.error || compile.status !== 0) console.error(chalk.redBright('[!] Error during build'))
    },
} as Module;

function parseArguments(arr: string | undefined | null): string[] {
    if (!arr) return [];
    if (typeof arr !== "string") return []
    const translationMatrix = { n: "\n", r: "\r", t: "\t" };
    const result: string[] = [];
    let escaping = false;
    let i = 0;
    let in_quotes = false;
    const split = Object.values(arr);
    let tmp = "";
    while (i < split.length) {
        const v = split[i];

        if (escaping) {
            tmp += translationMatrix[v as keyof typeof translationMatrix] || v;
            escaping = false;
            i++;
        } else if (v === '"') {
            if (in_quotes) {
                result.push(tmp);
                in_quotes = false;
                tmp = "";
                i++;
                if (i < split.length) {
                    if (split[i] !== " ")
                        throw new Error(
                            "Expected ' ', found '" + split[i] + "'"
                        );
                }
            } else {
                in_quotes = true;
                i++;
            }
        } else if (v === "\\") {
            escaping = true;
            i++;
        } else if (!in_quotes && v === " ") {
            if (tmp !== "") {
                result.push(tmp);
                tmp = "";
            }
            i++;
        } else {
            tmp += v;
            i++;
        }
    }
    if (tmp !== "") result.push(tmp)

    return result;
}
