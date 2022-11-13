/**
 * @license GPL3
 * @author RedCrafter07 (https://github.com/RedCrafter07)
 * @contributor FishingHacks (https://github.com/FishingHacks)
 */

import { readFile } from 'fs/promises';
import axios from 'axios';
import chalk from 'chalk';
import { join } from 'path';

const cwd = process.cwd();

export async function read(path: string) {
	const file = await readFile(path, 'utf-8');
	return file;
}

/* 
- File structure -
// packages separated by comma
axios, chalk@4.1.2, dotenv, express, nodemon, typescript

// some config
language: typescript/javascript
packageManager: npm/yarn/pnpm
mainFile: src/index.ts
*/

export async function parseFile(path: string) {
	const file = await read(path);

	let lines: string[] = parseLines(file);

	if (lines[0].startsWith('pullFrom: ')) {
		const file = lines[0].slice('pullFrom:'.length).trim();

		const fileContent: string = await (await axios.get(file)).data.toString();

		lines = parseLines(fileContent);
	}

	const packages = lines[0].split(',').map((l) => l.trim());
	const sliceAmount = lines[1].length > 1 ? 1 : 2;
	const config = lines.slice(sliceAmount).reduce((acc, line) => {
		const [key, value] = line.split(':').map((l) => l.trim());
		acc[key] = value;
		return acc;
	}, {} as Record<string, string>);

	const {
		language,
		packageManager,
		mainFile,
		workDir: setWorkDir,
		gitClone,
		...additionalConfig
	} = config;

	if (!language || !packageManager || !mainFile) {
		if (!language) console.log(chalk.red('[!] Language not specified'));
		if (!packageManager)
			console.log(chalk.red('[!] Package manager not specified'));
		if (!mainFile) console.log(chalk.red('[!] Main file not specified'));

		console.log(chalk.red("[!] Can't continue without these values"));
		console.log(
			chalk.yellow('[/] You may configure these values in the config file.'),
		);

		process.exit(1);
	}

	let workDir = setWorkDir || cwd;

	return {
		packages,
		config: {
			language,
			packageManager,
			mainFile,
			workDir,
			gitClone: (gitClone || false) as false | string,
			additionalConfig,
		},
	};
}

function parseLines(file: string) {
	return file
		.split('\n')
		.map((l) => l.trim().replace('\r', '').split('#')[0] || '')
		.filter((l) => !l.startsWith('# ') && l.length > 0);
}
