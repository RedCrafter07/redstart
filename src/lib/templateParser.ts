import inquirer from 'inquirer';
const { prompt } = inquirer;

export default async function parseTemplate(
    template: string
): Promise<string | false> {
    const preset = template.split('\n');
    const variablesNames = preset.shift()?.split('|');
    if (!variablesNames) return false;
    if (variablesNames[variablesNames.length - 1].endsWith('\r'))
        variablesNames[variablesNames.length - 1] = variablesNames[
            variablesNames.length - 1
        ].substring(0, variablesNames[variablesNames.length - 1].length - 1);

    let variables = await prompt(
        [...new Set(variablesNames)].map((el) => ({
            type: 'input',
            name: el.replaceAll('_', ' '),
        }))
    );

    let joinedPreset = preset.join('\n');

    for (const name of variablesNames)
        joinedPreset = joinedPreset.replaceAll(
            '{' + name + '}',
            variables[name]
        );
    return joinedPreset;
}
