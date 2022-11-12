import { readdir } from 'fs/promises';
import inquirer from 'inquirer';
import path from 'path';
import { argv } from 'process';
import { parseFile } from '../lib/fileParser';

let cwd = process.cwd();

const args = argv.slice(2);

const { prompt } = inquirer;

(async () => {
	let configPath: string;

	if (args[0]) configPath = path.resolve(cwd, args[0]);
	else {
		const configFiles = (
			await readdir(cwd, {
				withFileTypes: true,
			})
		).filter((f) => f.isFile() && f.name.endsWith('.rsconf'));

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

	const config = await parseFile(configPath);

	console.log(config);
})();
