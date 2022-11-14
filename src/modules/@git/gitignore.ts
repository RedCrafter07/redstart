/**
 * @license GPL3
 * @author FishingHacks <https://github.com/FishingHacks>
 */

import chalk from 'chalk';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { is } from '../../lib/utils';
import { Module } from '../../types';

export default {
    validate(config, cwd) {
        return (
            is.set(config.language) &&
            ['javascript', 'js', 'ts', 'typescript', ''].includes(
                config.language
            )
        );
    },
    initiate(config, cwd) {
        if (existsSync(join(cwd, '.gitignore')))
            return console.warn(
                chalk.yellowBright('[/] .gitignore already found. aborting')
            );
        const gitignore = getGitIgnoreForLanguage(config.language);
        if (config.additional) {
            gitignore.push(
                ...config.additional
                    .split(',')
                    .map((el) => el.trim())
                    .filter((el) => el.length > 0)
                    .filter((el) => !gitignore.includes(el))
            );
        }
        writeFileSync(join(cwd, '.gitignore'), gitignore.join('\n'));
    },
} as Module;

function getGitIgnoreForLanguage(language: string) {
    if (language === 'js' || language === 'javascript')
        return [
            'node_modules/',
            'npm-debug.log*',
            'yarn-debug.log*',
            'yarn-error.log*',
            'lerna-debug.log*',
            '.pnpm-debug-lock*',
            'report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json',
            'pids',
            '*.pid',
            '*.seed',
            '*.pid.lock',
            'build/',
            'jspm_packages/',
            'web_modules/',
            '*.tsbuildinfo',
            '.npm',
            '.eslintcache',
            '.node_repl_history',
            '*.tgz',
            '.env',
            '.env.development.local',
            '.env.test.local',
            '.env.production.local',
            '.env.local',
            '.next',
            'out',
            '.nuxt',
            'dist',
            '.cache/',
            '.vuepress/dist',
            '.temp',
            '.cache',
            '.serverless/',
            '.fusebox/',
        ];
    else if (language === 'typescript' || language === 'ts')
        return [
            'node_modules/',
            'npm-debug.log*',
            'yarn-debug.log*',
            'yarn-error.log*',
            'lerna-debug.log*',
            '.pnpm-debug-lock*',
            'report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json',
            'pids',
            '*.pid',
            '*.seed',
            '*.pid.lock',
            'build/',
            'jspm_packages/',
            'web_modules/',
            '*.tsbuildinfo',
            '.npm',
            '.eslintcache',
            '.node_repl_history',
            '*.tgz',
            '.env',
            '.env.development.local',
            '.env.test.local',
            '.env.production.local',
            '.env.local',
            '.next',
            'out',
            '.nuxt',
            'dist',
            '.cache/',
            '.vuepress/dist',
            '.temp',
            '.cache',
            '.serverless/',
            '.fusebox/',
            '*.js',
        ];
    else return [];
}
