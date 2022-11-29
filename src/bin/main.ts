#!/usr/bin/env node
/**
 * @license GPL3
 * @author RedCrafter07 <https://github.com/RedCrafter07>
 * @author FishingHacks <https://github.com/FishingHacks>
 */

import chalk from 'chalk';
import { existsSync } from 'fs';
import { readdir, readFile, writeFile } from 'fs/promises';
import inquirer from 'inquirer';
import path, { join } from 'path';
import { argv } from 'process';
import { parseFile } from '../lib/fileParser';
import { version } from '../../package.json';
import { createTimeTracker, TextboxBuilder } from '../lib/utils';
import markdownToTxt from 'markdown-to-txt';
import parseTemplate from '../lib/templateParser';
import { format } from 'util';
import runSetupSystem from '../lib/setupSystem';
inquirer.registerPrompt('search-list', require('inquirer-search-list'));

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
    console.error = (...args) => {
        throw new Error(format(...args));
    };
}

function resetLog() {
    console.log = oldConsoleLog;
    console.info = oldConsoleLog;
    console.warn = oldConsoleWarn;
    console.error = oldConsoleError;
}

const sourcePath = join(argv[1], '../../');
const args = argv.slice(2);

const { prompt } = inquirer;

(async () => {
    let configPath: string = process.cwd();
    if (['--h', '-h', '-help', '--help'].includes(args[0])) {
        return new TextboxBuilder()
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
            .addLine(
                `${chalk.redBright('redstart')} ${chalk.yellow(
                    '-m --modules'
                )} ${chalk.greenBright(
                    '- Get the avilable modules for redstart'
                )}`
            )
            .addLine(
                `${chalk.redBright('redstart')} ${chalk.yellow(
                    '-u --usage'
                )} ${chalk.cyan('<modulename>')} ${chalk.greenBright(
                    '- Get the module usage information'
                )}`
            )
            .addLine(
                `${chalk.redBright('redstart')} ${chalk.yellow(
                    '-i --init'
                )} ${chalk.greenBright(
                    ' - Initialize redstart with a template'
                )}`
            )
            .addLine(
                `${chalk.redBright('redstart')} ${chalk.yellow(
                    '-t --template'
                )} ${chalk.greenBright(
                    ' - Initialize redstart with a template'
                )}`
            )
            .addLine(
                `${chalk.redBright('redstart')} ${chalk.yellow(
                    'setup'
                )} ${chalk.greenBright(
                    ' - Run the redstart file setup wizard'
                )}`
            )
            .addLine('')
            .setFooter(
                `${chalk.redBright('Redstart')} v${chalk.blueBright(version)}`
            )
            .log();
    }
    if (['-m', '--modules'].includes(args[0])) {
        const modules = join(sourcePath, 'modules');
        new TextboxBuilder()
            .setTitle(chalk.blue('Modules'))
            .addLines(
                trimFileEndings(
                    (await tree(modules)).filter((el) => el.endsWith('.js'))
                )
            )
            .setFooter(
                `${chalk.redBright('Redstart')} v${chalk.blueBright(version)}`
            )
            .setMinLength(50)
            .log();
        return;
    }
    if (['-u', '--usage'].includes(args[0])) {
        let file = join(sourcePath, '../usage/' + args[1] + '.md');
        if (!existsSync(file))
            return console.log(
                chalk.redBright(
                    '[!] Error: ' + args[1] + ' is not a valid module'
                )
            );

        const lines = markdownToTxt(
            (await readFile(file))
                .toString()
                .replaceAll('[<- Back](../index.md)', '')
                .replaceAll('# ' + args[1], '')
                .trimStart()
                .replaceAll(/^ *> *([^\n]+)/gm, '\x1B[90m   $1')
                .replaceAll(/^ *- *([^\n]+)/gm, '\n\x1B[36m $1')
        )
            .replaceAll('\n\n', '\n')
            .replace('Usage', '')
            .replace(
                'Required Fields:',
                chalk.bold(chalk.greenBright('\nRequired Fields:'))
            )
            .replace(
                'Optional Fields:',
                chalk.bold(chalk.greenBright('\nOptional Fields:'))
            )
            .split('\n')
            .map((el) => el + (el.includes('\x1B') ? '\x1B[39m' : ''));
        return new TextboxBuilder()
            .addLines(lines)
            .setTitle(chalk.yellow(args[1]))
            .setFooter(
                `${chalk.redBright('Redstart')} v${chalk.blueBright(version)}`
            )
            .setMinLength(50)
            .log();
    }
    if (['-i', '--init', '-t', '--template'].includes(args[0])) {
        const templateFolder = join(sourcePath, 'templates');
        const files = (await readdir(templateFolder, { withFileTypes: true }))
            .filter((el) => el.isFile())
            .map((el) => el.name)
            .filter((el) => el.endsWith('.rsproj'));
        const { file, fileName } = await prompt([
            {
                type: 'list',
                name: 'file',
                choices: files.map((el) => ({
                    name: el.substring(0, el.length - 7),
                    value: el,
                })),
            },
            {
                type: 'input',
                name: 'fileName',
            },
        ]);
        console.log(file);
        const preset = await parseTemplate(
            await readFile(join(templateFolder, file)).toString()
        );
        if (!preset)
            console.error(
                chalk.redBright('[!] Error while inserting the preset')
            );
        if (existsSync(join(process.cwd(), fileName + '.rsproj')))
            console.error(
                chalk.redBright(
                    '[!] Error: File with the name ' +
                        fileName +
                        '.rsproj already exists'
                )
            );
        await writeFile(
            join(process.cwd(), fileName + '.rsproj'),
            preset || ''
        );
        console.log(chalk.greenBright('[+] Wrote ' + fileName + '.rsproj'));
        return;
    } else if (args[0] === 'setup') {
        console.log(chalk.redBright('RedStart Setup Manager.'));
        console.log(chalk.yellow('Collecting modules...'));
        const moduleNames = (await tree(join(sourcePath, 'modules'))).filter(
            (el) => el.endsWith('.js')
        );
        const modules: Record<
            string,
            { optional: string[]; required: string[] }
        > = {};
        for (const n of moduleNames) {
            const values = require(join('../modules', n));
            if (
                values.default &&
                values.default.required &&
                values.default.optional &&
                values.default.required instanceof Array &&
                values.default.optional instanceof Array
            ) {
                modules[n.substring(0, n.length-3)] = {
                    optional: values.default.optional,
                    required: values.default.required,
                };
            }
        }

        const file = await runSetupSystem(modules);
        let filename;
        while (true) {
            filename = (await prompt([
                { type: 'input', name: 'filename' },
            ])).filename;
            if (existsSync(join(process.cwd(), filename + '.rsproj'))) console.error(chalk.redBright('[!] File wit the filename ' + filename + ' already exists!'));
            else break;
        }
        await writeFile(join(process.cwd(), filename + '.rsproj'), file);
        console.log(
            chalk.greenBright('[+] Wrote file ' + filename + '.rsproj')
        );
        return;
    } else {
        configPath = join(configPath, args[0]);
        const configFiles = (
            await readdir(configPath, {
                withFileTypes: true,
            })
        ).filter((f) => f.isFile() && f.name.endsWith('.rsproj'));

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
        for (const c of config[modules[i]] || []) {
            try {
                if (!(await obj.validate(c, cwd), redstartConfig)) {
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
        }
        resetLog();
    }

    function addTimeSlice(str: string) {
        return timeTracker.addTimeSlice('╰─« ' + str);
    }

    for (const i in moduleObjects) {
        timeTracker.addTimeSlice('initiating ' + modules[i]);
        const obj = moduleObjects[i];
        if (!obj.initiate) {
            oldConsoleLog(chalk.redBright('[!] Internal Error Code: 2'));
            process.exit(1);
        }
        configureLogForModule(modules[i]);
        for (const c of config[modules[i]] || []) {
            try {
                await obj.initiate(c, addTimeSlice, cwd, redstartConfig);
                if (redstartConfig.dbgprint === 'true')
                    oldConsoleLog(
                        chalk.greenBright(
                            '[+] Module ' + modules[i] + ' finished'
                        )
                    );
            } catch (e: any) {
                oldConsoleLog(
                    chalk.redBright(
                        '[!] Executing of module ' + modules[i] + ' failed.'
                    )
                );
                oldConsoleLog(
                    e.stack && typeof e.stack === 'string'
                        ? chalk.red(e.stack)
                        : e
                );
                if (redstartConfig.exitOnError) process.exit(1);
            }
        }
        resetLog();
    }
    if (redstartConfig.dbgprint === 'true') timeTracker.printOutput(true);
})();

async function tree(dir: string) {
    const entries: string[] = [];
    const toScan: string[] = [dir];

    while (toScan.length > 0) {
        const directory = toScan.pop();
        if (!directory) break;

        for (const f of await readdir(directory, { withFileTypes: true })) {
            if (f.isFile()) entries.push(join(directory, f.name));
            else if (f.isDirectory()) toScan.push(join(directory, f.name));
        }
    }

    if (toScan.length > 0)
        throw new Error(
            "Entries left, this should never happen. It's likely a bug in the runtime, path module or fs module"
        );
    return entries
        .map((el) =>
            el.replace(dir.replaceAll('/', path.sep), '').replaceAll('\\', '/')
        )
        .map((el) => (el[0] === '/' ? el.substring(1) : el));
}

function trimFileEndings(files: string[]): string[] {
    return files.map((el) => el.split('.').slice(0, -1).join('.'));
}
