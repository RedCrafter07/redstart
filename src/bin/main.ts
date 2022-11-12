import chalk from 'chalk';
import { mkdir, readdir, writeFile } from 'fs/promises';
import inquirer from 'inquirer';
import moment from 'moment';
import ora, { Options as OraOptions } from 'ora';
import path from 'path';
import { argv } from 'process';
import checkPackageManager from '../lib/checkPackageManager';
import { parseFile } from '../lib/fileParser';
import { sync as spawnSync } from 'cross-spawn';

let cwd = process.cwd();

const args = argv.slice(2);

const { prompt } = inquirer;

const spinnerOptions: OraOptions = {
	interval: 100,
	spinner: {
		frames: ['[-]', '[\\]', '[|]', '[/]'],
	},
	color: 'blue',
};

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

	console.log(chalk.green(`[/] Using ${config.packageManager}`));

	const pmSpinner = ora({
		...spinnerOptions,
		text: 'Checking package manager...',
	});

	pmSpinner.start();

	const isInstalled = await checkPackageManager(
		config.packageManager as 'npm' | 'yarn' | 'pnpm',
	);

	if (!isInstalled) {
		pmSpinner.fail('Package manager not installed!');
		return;
	}

	pmSpinner.succeed('Package manager checked!');

	console.log(chalk.green(`[+] Using ${config.language}`));
	console.log(chalk.green(`[+] Main file: ${config.mainFile}`));

	cwd = config.workDir;
	console.log(chalk.green(`[+] Working directory: ${cwd}`));

	const parsingTs = moment().unix();

	const fileInitSpinner = ora({
		...spinnerOptions,
		text: 'Initializing main file...',
	});

	fileInitSpinner.start();

	fileInitSpinner.info('Creating directories for main file...');

	const filePath = path.resolve(cwd, config.mainFile);

	await mkdir(path.dirname(filePath), { recursive: true });

	fileInitSpinner.info('Creating main file...');

	await writeFile(filePath, "console.log('Hello World!');");

	fileInitSpinner.succeed('Main file initialized!');

	const fileInitializationTs = moment().unix();

	console.log(chalk.yellow(`[/] Installing packages ${packages.join(', ')}`));

	const packageSpinner = ora({
		...spinnerOptions,
		text: 'Installing packages...',
	});

	packageSpinner.start();

	const packageManager = config.packageManager;

	const initArgs = `init${packageManager != 'pnpm' ? ' -y' : ''}`.split(' ');

	packageSpinner.info('Initializing package.json');

	const initProcess = spawnSync(packageManager, initArgs, {
		cwd,
	});

	packageSpinner.info('Installing packages');

	const packageManagerArgs = ['add', ...packages];

	const packageManagerProcess = await spawnSync(
		`${packageManager}`,
		packageManagerArgs,
		{
			cwd,
		},
	);

	if (packageManagerProcess.status !== 0) {
		packageSpinner.fail('Failed to install packages!');

		return;
	}

	packageSpinner.succeed('Packages installed!');

	const packageInstallationTs = moment().unix();

	console.log(chalk.green('[+] Initialized project successfully!'));

	console.log(
		chalk.yellowBright(
			`[/] Time taken: ${packageInstallationTs - startUnix} seconds`,
		),
	);
})();
