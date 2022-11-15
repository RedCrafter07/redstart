import chalk from 'chalk';
import { sync } from 'cross-spawn';
import { is } from '../../lib/utils';
import { Module } from '../../types';

export default {
    validate: () => true,
    initiate: () => {
        if (is.processError(sync('tsc', ['--init'])))
            console.error(chalk.redBright('[!] TSC is not installed'));
        else console.log(chalk.greenBright('[+] Installed chalk'));
    },
} as Module;
