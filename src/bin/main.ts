#!/usr/bin/env node
/**
 * @license GPL3
 * @author RedCrafter07 (https://github.com/RedCrafter07)
 */

import chalk from "chalk";
import { existsSync } from "fs";
import { readdir } from "fs/promises";
import inquirer from "inquirer";
import path, { join } from "path";
import { argv } from "process";
import { parseFile } from "../lib/fileParser";

const args = argv.slice(2);

const { prompt } = inquirer;

(async () => {
    let configPath: string;
    if (args[0]) configPath = path.resolve(process.cwd(), args[0]);
    else {
        const configFiles = (
            await readdir(process.cwd(), {
                withFileTypes: true,
            })
        ).filter((f) => f.isFile() && f.name.endsWith(".rsproj"));

        const { config: newConf } = await prompt([
            {
                type: "list",
                name: "config",
                choices: configFiles.map((f) => ({
                    name: f.name,
                    value: f.name,
                })),
            },
        ]);

        configPath = path.resolve(process.cwd(), newConf);
    }
    const { config, modules } = await parseFile(configPath);
    console.log(chalk.yellowBright("[/] Config file parsed successfully!"));
    console.log(chalk.green("[+] Using " + modules.join(", ")));
    const cwd = join(configPath, "..");
    console.log(chalk.yellowBright("[/] CWD: " + cwd));

    const moduleObjects = modules
        .map((el) => [require.resolve("../modules/" + el), el])
        .map((el) => {
            if (!existsSync(el[0])) {
                console.log(
                    chalk.redBright("[!] Module " + el[1] + " doesn' exist!")
                );
                process.exit(1);
            }
            return el[0];
        })
        .map((el) => require(el).default);

    for (const i in moduleObjects) {
        const obj = moduleObjects[i];
        if (!obj.validate) {
            console.log(chalk.redBright("[!] Internal Error Code: 1"));
            process.exit(1);
        }
        if (!(await obj.validate(config[modules[i]] || {}, cwd))) {
            console.log(
                chalk.redBright(
                    "[!] Validation Failed: " +
                        modules[i] +
                        " not correctly configured"
                )
            );
            process.exit(1);
        }
    }
    for (const i in moduleObjects) {
        const obj = moduleObjects[i];
        if (!obj.initiate) {
            console.log(chalk.redBright("[!] Internal Error Code: 2"));
            process.exit(1);
        }
        try {
            await obj.initiate(config[modules[i]] || {}, cwd);
            console.log(
                chalk.greenBright("[+] Module " + modules[i] + " finished")
            );
        } catch (e: any) {
            console.log(
                chalk.redBright(
                    "[!] Executing of module " + modules[i] + " failed."
                )
            );
            console.log(chalk.redBright(e.toString()));
            process.exit(1);
        }
    }
})();
