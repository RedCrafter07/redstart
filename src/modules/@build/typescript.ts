import chalk from 'chalk';
import { sync as spawnSync } from 'cross-spawn';
import { existsSync } from 'fs';
import { lstat, mkdir, readdir, readlink } from 'fs/promises';
import { join } from 'path';
import { is } from '../../lib/utils';
import { Module } from '../../types';

export default {
    validate(config, cwd) {
        return true;
    },
    async initiate(config, addTimeSlice, cwd, redstartConfig) {
        const buildDirectory = join(cwd, config.buildDirectory || '');
        if (config.sourceDirectory)
            cwd = join(cwd, config.sourceDirectory || '');
        const tsFilePath = config.tsFile || undefined;
        const allowJSFiles =
            config.allowJSFiles === 'true' ? '--allowJS' : undefined;

        if (!existsSync(cwd))
            return console.error(
                chalk.redBright("[!] SourceDirectory doesn't exist")
            );
        if (!existsSync(buildDirectory)) await mkdir(buildDirectory);

        addTimeSlice('Checking Typescript compiler');
        if (is.processError(spawnSync('tsc', ['-v']))) {
            console.error(chalk.redBright('[!] TSC is not installed'));
            return;
        }

        const args = [
            tsFilePath ? '-p' : undefined,
            tsFilePath,
            '--outDir',
            buildDirectory,
            allowJSFiles,
            '--pretty',
            ...(await (await tree(cwd)).filter((el) => el.endsWith('.ts') && !el.endsWith('.d.ts'))),
        ].filter((el) => el !== undefined) as string[];
        addTimeSlice('Running tsc ');
        if (redstartConfig.dbgprint === 'true')
            console.log('Running tsc ' + args.join(' ') + ' in ' + cwd);
        const compilerProcess = spawnSync('tsc', args, { cwd });
        if (is.processError(compilerProcess)) {
            console.error(chalk.redBright('[!] Error running the compiler'));
            console.error(
                compilerProcess.output
                    .map((el) => (el === null ? '\n' : el.toString()))
                    .join('')
            );
            return;
        } else {
            console.log(chalk.greenBright('[+] Compilation successful'));
        }
    },
    required: [],
    optional: ['tsFilePath', 'sourceDirectory', 'buildDirectory', 'allowJSFiles'],
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
