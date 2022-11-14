#!/usr/bin/env node
/**
 * @license GPL3
 * @author RedCrafter07 (https://github.com/RedCrafter07)
 * @author FishingHacks (https://github.com/FishingHacks)
 */

import chalk from 'chalk';
import { existsSync, lstatSync } from 'fs';
import { readdir } from 'fs/promises';
import inquirer from 'inquirer';
import path, { join } from 'path';
import { argv } from 'process';
import { parseFile } from '../lib/fileParser';
import { version } from '../../package.json';
import { createTimeTracker, TextboxBuilder } from '../lib/utils';

const oldConsoleLog = console.log;
const oldConsoleError = console.error;
const oldConsoleWarn = console.warn;

function inspectPrefixed(prefix: string, args: (string | number | boolean)[]) {
    return args
        .map((el) => el.toString())
        .join(' ')
        .split('\n')
        .map((el) => prefix + ' ' + el)
        .join('\n');
}

function configureLogForModule(module: string) {
    console.log = (...args) =>
        oldConsoleLog(inspectPrefixed('[' + module + ']', args));
    console.info = (...args) =>
        oldConsoleLog(inspectPrefixed('[' + module + ']', args));
    console.warn = (...args) =>
        oldConsoleWarn(
            chalk.yellowBright(inspectPrefixed('[' + module + ']', args))
        );
    console.error = (...args) =>
        oldConsoleError(
            chalk.redBright(inspectPrefixed('[' + module + ']', args))
        );
}

function resetLog() {
    console.log = oldConsoleLog;
    console.info = oldConsoleLog;
    console.warn = oldConsoleWarn;
    console.error = oldConsoleError;
}

const args = argv.slice(2);

const { prompt } = inquirer;

(async () => {
    let configPath: string;
    if (['--h', '-h', '-help', '--help'].includes(args[0])) {
        return console.log(
            new TextboxBuilder()
                .setTitle(chalk.blue('Usage'))
                .addLine(
                    `${chalk.redBright('redstart')} ${chalk.cyan(
                        '<file/folder>'
                    )} ${chalk.greenBright('- Execute a .rsproj file')}`
                )
                .addLine(
                    `${chalk.redBright('redstart')} ${chalk.yellow(
                        '--help --h -h -help'
                    )} ${chalk.greenBright('- Obtain usage informations')}`
                )
                .addLine(
                    `${chalk.redBright('redstart')} ${chalk.yellow(
                        '-v -version --version --v'
                    )} ${chalk.greenBright(
                        '- Get the ' + chalk.redBright('redstart') + ' version'
                    )}`
                )
                .addLine('')
                .setFooter(
                    `${chalk.redBright('Redstart')} v${chalk.blueBright(
                        version
                    )}`
                )
                .build()
        );
    }
    if (['-v', '-version', '--v', '--version'].includes(args[0])) {
        return console.log(`${chalk.redBright('Redstart')} v${version}`);
    }
    if (args[0]) configPath = path.resolve(process.cwd(), args[0]);
    else {
        const configFiles = (
            await readdir(process.cwd(), {
                withFileTypes: true,
            })
        ).filter((f) => f.isFile() && f.name.endsWith('.rsproj'));

        const { config: newConf } = await prompt([
            {
                type: 'list',
                name: 'config',
                choices: configFiles.map((f) => ({
                    name: f.name,
                    value: f.name,
                })),
            },
        ]);

        configPath = path.resolve(process.cwd(), newConf);
    }
    if (lstatSync(configPath).isDirectory()) {
        const configFiles = (
            await readdir(configPath, {
                withFileTypes: true,
            })
        ).filter((f) => f.isFile() && f.name.endsWith('.rsproj'));

        if (configFiles.length === 0) {
            oldConsoleLog(chalk.redBright('[!] No config file found!'));
            process.exit(1);
        }
        if (configFiles.length === 1) {
            configPath = join(configPath, configFiles[0].name);
        } else {
            const { config: newConf } = await prompt([
                {
                    type: 'list',
                    name: 'config',
                    choices: configFiles.map((f) => ({
                        name: f.name,
                        value: f.name,
                    })),
                },
            ]);

            configPath = join(configPath, newConf);
        }
    }
    const timeTracker = createTimeTracker('Parsing config file');
    const { config, modules, redstartConfig } = await parseFile(configPath);

    if (redstartConfig.dbgprint === 'true')
        oldConsoleLog(
            chalk.yellowBright('[/] Config file parsed successfully!')
        );
    oldConsoleLog(chalk.green('[+] Using ' + modules.join(', ')));
    const cwd = join(configPath, '..', redstartConfig.cwd || '');
    if (redstartConfig.dbgprint === 'true')
        oldConsoleLog(chalk.yellowBright('[/] CWD: ' + cwd));

    timeTracker.addTimeSlice('Indexing modules');
    const moduleObjects = modules
        .map((el) => [require.resolve('../modules/' + el), el])
        .map((el) => {
            if (!existsSync(el[0])) {
                oldConsoleLog(
                    chalk.redBright('[!] Module ' + el[1] + " doesn' exist!")
                );
                process.exit(1);
            }
            return el[0];
        })
        .map((el) => require(el).default);

    for (const i in moduleObjects) {
        timeTracker.addTimeSlice('validating ' + modules[i]);
        const obj = moduleObjects[i];
        if (!obj.validate) {
            oldConsoleLog(chalk.redBright('[!] Internal Error Code: 1'));
            process.exit(1);
        }
        configureLogForModule(modules[i]);
        try {
            if (
                !(await obj.validate(config[modules[i]] || {}, cwd),
                redstartConfig)
            ) {
                oldConsoleLog(
                    chalk.redBright(
                        '[!] Validation Failed: ' +
                            modules[i] +
                            ' not correctly configured'
                    )
                );
                process.exit(1);
            }
        } catch (e) {
            oldConsoleLog(
                chalk.redBright(
                    '[!] Validation Failed: ' +
                        modules[i] +
                        ' not correctly configured'
                )
            );
            oldConsoleError(e);
            process.exit(1);
        }
        resetLog();
    }
    for (const i in moduleObjects) {
        timeTracker.addTimeSlice('initiating ' + modules[i]);
        const obj = moduleObjects[i];
        if (!obj.initiate) {
            oldConsoleLog(chalk.redBright('[!] Internal Error Code: 2'));
            process.exit(1);
        }
        configureLogForModule(modules[i]);
        try {
            await obj.initiate(config[modules[i]] || {}, cwd, redstartConfig);
            oldConsoleLog(
                chalk.greenBright('[+] Module ' + modules[i] + ' finished')
            );
        } catch (e: any) {
            oldConsoleLog(
                chalk.redBright(
                    '[!] Executing of module ' + modules[i] + ' failed.'
                )
            );
            oldConsoleLog(e);
            process.exit(1);
        }
        resetLog();
    }
    if (redstartConfig.dbgprint) timeTracker.printOutput(true);
})();
