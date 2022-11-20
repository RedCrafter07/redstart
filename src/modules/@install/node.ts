/**
 * @license GPL3
 * @author FishingHacks <https://github.com/FishingHacks>
 */

import { Module } from '../../types';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path, { join } from 'path';
import { is, createSpinner } from '../../lib/utils';
import chalk from 'chalk';
import checkPackageManager from '../../lib/checkPackageManager';

import { sync as spawnSync } from 'cross-spawn';

export default {
    validate(config) {
        return (
            is.set(config.packages) &&
            is.set(config.language) &&
            is.set(config.packageManager) &&
            ['yarn', 'pnpm', 'npm'].includes(config.packageManager) &&
            is.set(config.mainFile)
        );
    },
    async initiate(config, addTimeSlice, cwd, redstartConfig) {
        addTimeSlice('Checking package manger');

        console.log(chalk.green(`[/] Using ${config.packageManager}`));
        const pmSpinner = createSpinner('Checking package manager...');
        pmSpinner.start();
        const isInstalled = await checkPackageManager(
            config.packageManager as 'npm' | 'yarn' | 'pnpm'
        );
        if (!isInstalled) {
            pmSpinner.error({ text: 'Package manager not installed!' });
            return;
        }
        pmSpinner.success({ text: 'Package manager checked!' });

        console.log(chalk.green(`[+] Using ${config.language}`));
        console.log(chalk.green(`[+] Main file: ${config.mainFile}`));
        const filePath = path.resolve(cwd, config.mainFile);

        addTimeSlice('Creating main file');
        if (!existsSync(filePath)) {
            mkdirSync(join(filePath, '..'), { recursive: true });
            writeFileSync(
                filePath,
                'function main() {\n    console.log("Hello, World!");\n\n    return 0;\n}\n\ntry {\n    const exitCode = main();\n    process.exit(exitCode || 0);\n} catch (e) {\n    console.error("[!] Error:");\n    console.error(e);\n    process.exit(1);\n}'
            );
        }

        const packages = config.packages
            .split(',')
            .map((el) => el.trim())
            .filter((el) => el.length > 0);
        console.warn(
            chalk.yellow(`[/] Installing packages ${packages.join(', ')}`)
        );

        const packageSpinner = createSpinner('Installing packages...');
        packageSpinner.start();
        const packageManager = config.packageManager;
        const initArgs = `init${packageManager != 'pnpm' ? ' -y' : ''}`.split(
            ' '
        );

        addTimeSlice('Initializing package.json');
        packageSpinner.update({ text: 'Initializing package.json' });
        spawnSync(packageManager, initArgs, {
            cwd,
        });

        addTimeSlice('Installing packages');
        packageSpinner.update({ text: 'Installing packages' });
        const packageManagerArgs = ['add', ...packages];
        const packageManagerProcess = await spawnSync(
            `${packageManager}`,
            packageManagerArgs,
            {
                cwd,
            }
        );

        if (packageManagerProcess.status !== 0) {
            packageSpinner.error({ text: 'Failed to install packages!' });

            return;
        }

        packageSpinner.success({ text: 'Packages installed!' });

        console.log(chalk.green('[+] Initialized project successfully!'));
    },
} as Module;
