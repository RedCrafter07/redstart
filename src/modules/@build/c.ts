/**
 * @license GPL3
 * @author FishingHacks <https://github.com/FishingHacks>
 */

import { Module } from '../../types';
import { is, createSpinner } from '../../lib/utils';
import { sync as spawnSync } from 'cross-spawn';
import chalk from 'chalk';
import { lstat, mkdir, readdir, readlink } from 'fs/promises';
import { join } from 'path';

export default {
    validate(config, cwd) {
        return (
            is.set(config.fileName) &&
            is.str(config.fileName) &&
            is.set(config.sourceDirectory) &&
            is.str(config.sourceDirectory)
        );
    },
    async initiate(config, addTimeSlice, cwd) {
        addTimeSlice("Checking for gcc");
        const getV = spawnSync('gcc', ['-v']);
        if (getV.error || getV.status !== 0)
            return console.error(
                chalk.redBright('[!] Compiler (' + 'gcc' + ') not found')
            );
        addTimeSlice("Finding files");
        const buildSpinner = createSpinner('Finding files...');
        const files = (await tree(join(cwd, config.sourceDirectory))).filter(
            (el) => el.endsWith('.h') || el.endsWith('.c')
        );
        if (files.length < 1)
            return buildSpinner.error({ text: 'No files found' });
        addTimeSlice("Compiling")
        buildSpinner.update({ text: 'Compiling...' });
        const args = ['-o', config.fileName, ...files];
        if (!config.optimizations) args.unshift('-O1');
        else if (
            !['0', '1', '2', '3', 'fast', 'g', 's'].includes(
                config.optimizations.toLowerCase()
            )
        )
            args.unshift('-O1');
        else args.unshift('-O' + config.optimizations.toLowerCase());
        if (is.set(config.buildDirectory) && is.str(config.buildDirectory))
            await mkdir(join(cwd, config.buildDirectory), { recursive: true });
        const builddir =
            is.set(config.buildDirectory) && is.str(config.buildDirectory)
                ? join(cwd, config.buildDirectory)
                : cwd;

        const compile = spawnSync('gcc', args, { cwd: builddir });

        if (compile.error || compile.status !== 0) {
            buildSpinner.error({ text: 'Compilation failed!' });
            return console.log(
                compile.output
                    .filter((el) => (el === null ? '' : el))
                    .map((el) => el?.toString())
                    .join('\n')
            );
        }
    },
    required: ['fileName', 'sourceDirectory'],
    optional: ['optimizations', 'buildDirectory'],
} as Module;

async function tree(directory: string): Promise<string[]> {
    const to_scan = [directory];
    const discovered_files: string[] = [];
    while (to_scan.length > 0) {
        const dir = to_scan.pop();
        if (!dir) break;
        for (let f of await readdir(dir, { withFileTypes: true })) {
            try {
                if (f.isSymbolicLink()) {
                    const filepath = await resolveSymlink(join(dir, f.name));
                    if (filepath !== null) {
                        const stat = await await lstat(filepath);
                        if (stat.isDirectory()) to_scan.push(filepath);
                        if (stat.isFile()) discovered_files.push(filepath);
                    }
                } else if (f.isFile()) discovered_files.push(join(dir, f.name));
                else if (f.isDirectory()) to_scan.push(join(dir, f.name));
            } catch {}
        }
    }

    return discovered_files;
}

async function resolveSymlink(file: string): Promise<string | null> {
    let symlink: string | null = file;
    while (symlink !== null) {
        if (!(await lstat(symlink)).isSymbolicLink()) return symlink;
        else symlink = await readlink(symlink);
    }
    return null;
}
