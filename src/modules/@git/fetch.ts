import { createSpinner } from "nanospinner";
import { sync as spawnSync } from "cross-spawn";
import { Module } from "../../types";
import chalk from "chalk";
import { is } from "../../lib/utils";

export default {
    validate: (config, cwd) => is.set(config.repository),
    async initiate(config, cwd) {
        const gitSpinner = createSpinner("Checking git...");
        gitSpinner.start();
        if (await spawnSync("git", ["-v"], { cwd }).error) {
            gitSpinner.error({ text: "Git is not installed" });
        } else {
            let remote = spawnSync("git", ["remote", "get-url", "origin"], {
                cwd,
            });
            if (remote.status !== 0) {
                gitSpinner.update({ text: "Initializing repository" });
                await spawnSync("git", ["init"], { cwd });
            }
            remote = spawnSync("git", ["remote"], {
                cwd,
            });
            if (remote.status !== 0)
                return gitSpinner.error({
                    text: "[!] Error: Couldn't initialize git Repository",
                });
            gitSpinner.update({ text: "Fetching repository" });
            if (remote.stdout.toString() !== config.repository) {
                if (remote.stdout.toString() === "") {
                    if (
                        spawnSync(
                            "git",
                            [
                                "remote",
                                "add",
                                "origin",
                                config.repository,
                            ],
                            { cwd }
                        ).status !== 0
                    )
                        return gitSpinner.error({
                            text: "Couldn't add remote-url",
                        });
                } else
                    return gitSpinner.error({
                        text:
                            "A git repository with another url (" +
                            remote.stdout.toString() +
                            ") already exists",
                    });
            }
            if (spawnSync("git", ["pull"], { cwd }).status !== 0)
                return gitSpinner.error({
                    text: "Couldn't fetch remote repository",
                });
            return gitSpinner.success({ text: "Successfully fetched remote repository" });
        }
        gitSpinner.update({text: "[/] Warn: Something unexpected happened.", color: 'orange'})
        gitSpinner.stop();
    },
} as Module;
