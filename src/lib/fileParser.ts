import { readFile } from 'fs/promises';
import axios from 'axios';

const cwd = process.cwd();

async function read(path: string) {
	const file = await readFile(`${cwd}/${path}`, 'utf-8');
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
	let lines: string[] = file.split('\n').map((l) => l.trim().replace('\r', ''));

	if (lines[0].startsWith('pullFrom: ')) {
		const file = lines[0].slice('pullFrom:'.length).trim();

		const fileContent: string = await (await axios.get(file)).data.toString();

		lines = fileContent.split('\n').map((l) => l.trim().replace('\r', ''));
	}

	const packages = lines[0].split(', ');
	const sliceAmount = lines[1].length > 1 ? 1 : 2;
	const config = lines.slice(sliceAmount).reduce((acc, line) => {
		const [key, value] = line.split(': ');
		acc[key] = value;
		return acc;
	}, {} as Record<string, string>);

	console.log(packages, config);
}

parseFile('test.rsconf');
