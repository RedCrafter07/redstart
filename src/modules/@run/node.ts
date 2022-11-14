/**
 * @license GPL3
 * @author FishingHacks (https://github.com/FishingHacks)
 */

import chalk from "chalk";
import { sync as spawnSync } from "cross-spawn";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { is } from "../../lib/utils";
import { Module } from "../../types";

export default {
    validate(config, cwd) {
        return is.set(config.mainFile) && is.str(config.mainFile);
    },
    async initiate(config, cwd) {
        let additionalEnv: Record<string, string> = {};
        if (is.set(config.envFile) && is.str(config.envFile)) {
            if (existsSync(join(cwd, config.envFile))) {
                const contents = (
                    await readFile(join(cwd, config.envFile))
                ).toString();
                contents
                    .split("\n")
                    .filter((el) => el.length > 0)
                    .forEach((el) => {
                        additionalEnv[el.split("=")[0].trim()] = el
                            .split("=")
                            .slice(1)
                            .join("=")
                            .trim();
                    });
            }
        }
        const runProcess = spawnSync(
            "node",
            [
                config.mainFile,
                ...(config.arguments?.split(",").map((el) => el.trim()) || []),
            ],
            { cwd, env: { ...process.env, ...additionalEnv } }
        );
        if (runProcess.error || runProcess.status !== 0) {
            console.error(chalk.redBright("[!] Error: Exection failed!"));
            return console.error(
                chalk.redBright(
                    runProcess.output
                        .map((el) => is.set(el))
                        .map((el) => el?.toString())
                        .join("\n")
                )
            );
        }
        return console.log(
            runProcess.output
                .filter((el) => is.set(el))
                .map((el) => el?.toString())
                .join("\n")
        );
    },
} as Module;
