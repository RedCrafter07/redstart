/**
 * @license GPL3
 * @author FishingHacks <https://github.com/FishingHacks>
 */

import { Module } from '../../types';
import { is, createSpinner } from '../../lib/utils';
import chalk from 'chalk';
import checkPackageManager from '../../lib/checkPackageManager';

import { sync as spawnSync } from 'cross-spawn';

export default {
    validate(config) {
        return (
            is.set(config.packages) &&
            is.set(config.packageManager) &&
            ['yarn', 'pnpm', 'npm'].includes(config.packageManager)
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
