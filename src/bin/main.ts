#!/usr/bin / env node
/**
 * @license GPL3
 * @author RedCrafter07 (https://github.com/RedCrafter07)
 */

import chalk from 'chalk';
import { mkdir, readdir, writeFile } from 'fs/promises';
import inquirer from 'inquirer';
import moment from 'moment';
import { createSpinner } from 'nanospinner';
import path from 'path';
import { argv } from 'process';
import checkPackageManager from '../lib/checkPackageManager';
import { parseFile } from '../lib/fileParser';
import { sync as spawnSync } from 'cross-spawn';

let cwd = process.cwd();

const args = argv.slice(2);

const { prompt } = inquirer;

(async () => {
	const startUnix = moment().unix();

	let configPath: string;

	if (args[0]) configPath = path.resolve(cwd, args[0]);
	else {
		const configFiles = (
			await readdir(cwd, {
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

		configPath = path.resolve(cwd, newConf);
	}

	const { config, packages } = await parseFile(configPath);

	console.log(chalk.yellowBright('[/] Config file parsed successfully!'));

	if (config.gitClone) {
		const gitSpinner = createSpinner('Checking git...');
		gitSpinner.start();
		if (await spawnSync('git', ['-v']).error) {
			gitSpinner.error({ text: ('Git is not installed') });
		} else {
			gitSpinner.update({ text: 'Cloning repository' });
			const gitProc = await spawnSync('git', ['clone', config.gitClone]);
			if (gitProc.status !== 0 || gitProc.error) gitSpinner.error({ text: 'Couldn\'t clone git Repository' });
			else gitSpinner.success({ text: 'Updated repository' });
		}
		gitSpinner.stop();
	}

	console.log(chalk.green(`[/] Using ${config.packageManager}`));

	const pmSpinner = createSpinner('Checking package manager...');

	pmSpinner.start();

	const isInstalled = await checkPackageManager(
		config.packageManager as 'npm' | 'yarn' | 'pnpm',
	);

	if (!isInstalled) {
		pmSpinner.error({ text: 'Package manager not installed!' });
		return;
	}

	pmSpinner.success({ text: 'Package manager checked!' });

	console.log(chalk.green(`[+] Using ${config.language}`));
	console.log(chalk.green(`[+] Main file: ${config.mainFile}`));

	cwd = config.workDir;
	console.log(chalk.green(`[+] Working directory: ${cwd}`));

	const parsingTs = moment().unix();

	const fileInitSpinner = createSpinner('Initializing main file...');

	fileInitSpinner.start();

	fileInitSpinner.update({ text: 'Creating directories for main file...' });

	const filePath = path.resolve(cwd, config.mainFile);

	await mkdir(path.dirname(filePath), { recursive: true });

	fileInitSpinner.update({ text: 'Creating main file...' });

	await writeFile(filePath, "console.log('Hello World!');");

	fileInitSpinner.success({ text: 'Main file initialized!' });

	const fileInitializationTs = moment().unix();

	console.log(chalk.yellow(`[/] Installing packages ${packages.join(', ')}`));

	const packageSpinner = createSpinner('Installing packages...');

	packageSpinner.start();

	const packageManager = config.packageManager;

	const initArgs = `init${packageManager != 'pnpm' ? ' -y' : ''}`.split(' ');

	packageSpinner.update({ text: 'Initializing package.json' });

	const initProcess = spawnSync(packageManager, initArgs, {
		cwd,
	});

	packageSpinner.update({ text: 'Installing packages' });

	const packageManagerArgs = ['add', ...packages];

	const packageManagerProcess = await spawnSync(
		`${packageManager}`,
		packageManagerArgs,
		{
			cwd,
		},
	);

	if (packageManagerProcess.status !== 0) {
		packageSpinner.error({ text: 'Failed to install packages!' });

		return;
	}

	packageSpinner.success({ text: 'Packages installed!' });

	const packageInstallationTs = moment().unix();

	console.log(chalk.green('[+] Initialized project successfully!'));

	console.log(
		chalk.yellowBright(
			`[/] Time taken: ${packageInstallationTs - startUnix} seconds`,
		),
	);

	console.log('	- Parsing config file:', parsingTs - startUnix, 'seconds');
	console.log(
		'	- Initializing main file:',
		fileInitializationTs - parsingTs,
		'seconds',
	);
	console.log(
		'	- Installing packages:',
		packageInstallationTs - fileInitializationTs,
		'seconds',
	);
})();
