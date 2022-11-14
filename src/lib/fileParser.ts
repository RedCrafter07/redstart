/**
 * @license GPL3
 * @author RedCrafter07 (https://github.com/RedCrafter07)
 * @author FishingHacks (https://github.com/FishingHacks)
 */

import chalk from "chalk";
import { readFile } from "fs/promises";
import { arrEq, escapeString } from "../lib/utils";

const cwd = process.cwd();

export async function read(path: string) {
    const file = await readFile(path, "utf-8");
    return file;
}

export async function parseFile(path: string) {
    const file = await read(path);
    const redstartConfig: Record<string, string> = {};

    let lines: string[] = file
        .split("\n")
        .map((l) => l.trim().replace("\r", "").split("#")[0] || "")
        .map(l => {
            if (l.startsWith("--")) {
                const parsed = parseLine(l.substring(2));
                if (parsed !== null) redstartConfig[parsed.key] = parsed.value;
                return "";
            }
            return l;
        })
        .filter((l) => !l.startsWith("# ") && l.length > 0);

    const modules = lines
        .shift()
        ?.split(",")
        .map((l) => l.trim());
    if (modules === undefined || modules.length < 1) {
        console.error(chalk.redBright("[!] No modules defined"));
        process.exit(1);
    }

    lines = lines.filter((el) => el.length > 0);
    const moduleRedefinitions: { module: string; index: number }[] = [];
    lines.forEach((el, index) =>
        el.startsWith("[") && el.endsWith("]")
            ? moduleRedefinitions.push({
                  module: el.substring(1, el.length - 1),
                  index,
              })
            : null
    );
    if (
        !arrEq(
            moduleRedefinitions.map((el) => el.module),
            modules
        )
    ) {
        console.error(
            chalk.redBright(
                "[!] A Config-definition for a non-used module found! (" +
                    moduleRedefinitions
                        .map((el) => el.module)
                        .filter((el) => !modules.includes(el))
                        .map((el) => '"' + escapeString(el) + '"')
                        .join(", ") +
                    ")"
            )
        );
        return { modules: [], config: {}, redstartConfig };
    }
    const config = moduleRedefinitions.map((el, i) => {
        if (el.index >= lines.length) return { module: el.module, lines: [] };
        const from = el.index + 1;
        const to = moduleRedefinitions[i + 1]?.index - 1 || lines.length;
        return {
            module: el.module,
            config: lines
                .slice(from, to + 1)
                .filter((el) => el.length > 0)
                .map(parseLine),
        };
    });
    const configObj: Record<string, Record<string, string>> = {};
    config.forEach((el) => {
        if (configObj[el.module]) {
            console.error(
                chalk.redBright(
                    "[!] Multiple config-definitions for " + el.module
                )
            );
            process.exit(1);
        }
        const moduleConfObj: Record<string, string> = {};
        el.config?.forEach((el) =>
            !el ? null : (moduleConfObj[el.key] = el?.value)
        );
        configObj[el.module] = moduleConfObj;
    });

    return {
        redstartConfig,
        modules,
        config: configObj,
    };
}

function parseLine(line: string): null | { key: string; value: string } {
    if (line.includes("\n")) throw new Error("line is not a line");
    if (line.match(/^([^:]+): *([^\n\r]+)?$/)) {
        const split = line.split(":");
        const key = split.shift()?.trim();
        if (!key) return null;
        if (split.length < 1) return { key, value: "" };
        return { key, value: split.join(":").trim() };
    } else return null;
}
