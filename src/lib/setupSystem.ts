/**
 * @license GPL3
 * @author FishingHacks <https://github.com/FishingHacks>
 */
import chalk from 'chalk';
import inquirer from 'inquirer';

const prompt = inquirer.prompt;

export default async function runSetupSystem(
    modules: Record<string, { optional: string[]; required: string[] }>
): Promise<string> {
    const { cwd, exitOnError, dbgprint } = await prompt([
        { name: 'cwd', type: 'input' },
        { name: 'exitOnError', type: 'confirm', default: false },
        { name: 'dbgprint', type: 'confirm', default: false },
    ]);
    const selectedModules: { name: string; values: Record<string, string> }[] =
        [];
    const selectedModuleNames: Set<string> = new Set();
    const moduleNames = Object.keys(modules);
    moduleNames.push('exit');

    while (true) {
        const { moduleName } = await prompt([
            { name: 'moduleName', type: 'search-list', message: 'Select a module or exit', choices: moduleNames },
        ]);
        if (moduleName === 'exit') break;
        if (modules[moduleName] === undefined)
            console.error(
                chalk.redBright("[!] Error: couldn't find module " + moduleName)
            );
        else {
            const opts = modules[moduleName].required.map((el) => ({
                name: el,
                validate: validateRequired,
                type: 'input',
            }));
            opts.push(
                ...modules[moduleName].optional.map((el) => ({
                    name: el,
                    validate: () => true,
                    type: 'input',
                }))
            );
            const values = await prompt(opts);

            selectedModules.push({ name: moduleName, values });
            selectedModuleNames.add(moduleName);
        }
    }

    return `--dbgprint: ${dbgprint ? 'true' : 'false'}${
        cwd ? '\n--cwd: ' + cwd : ''
    }\n--stoponerr: ${exitOnError ? 'true' : 'false'}\n${[
        ...selectedModuleNames,
    ].join(', ')}\n${selectedModules.map(
        (el) => `[${el.name}]\n${makeYaml(el.values)}`
    ).join("\n")}`;
}

function validateRequired(input: any) {
    if (typeof input !== 'string') return 'Input is not a string';
    return input.length > 0 ? true : 'Input is required';
}

function makeYaml(obj: Record<string, string>): string {
    let str = '';
    for (const k in obj) {
        if (obj[k] !== "") {
            if (k.includes(':'))
                throw new Error(
                    "key included ':'. This should never happen. key: " + k
                );
            if (k.includes('\n'))
                throw new Error(
                    'key included a new line. This should never happen. key: ' + k
                );
            str += k + ': ';
            if (obj[k].includes('\n'))
                throw new Error(
                    'value included a new line. This should never happen. value: ' +
                        obj[k]
                );
            str += obj[k] + '\n';
        }
    }

    return str;
}
