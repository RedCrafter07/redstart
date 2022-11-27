import { createSpinner as _createSpinner } from "nanospinner";

/**
 * @license GPL3
 * @author FishingHacks <https://github.com/FishingHacks>
 */

export const is = {
    exists: (v: any) => v !== undefined,
    set: (v: any) => is.exists(v) && v !== null,
    object: (v: any) => v !== null && typeof v === 'object',
    arr: (v: any) => is.object(v) && v instanceof Array,
    str: (v: any) => typeof v === 'string',
    json: (v: any) => {
        if (!is.str(v)) return false;
        try {
            JSON.parse(v);
            return true;
        } catch {
            return false;
        }
    },
    processError: (v: { error?: Error; status: number | null }) =>
        v.error || v.status !== 0,
};

export function deepEqual(obj1: any, obj2: any) {
    if (!is.set(obj1) || !is.set(obj2)) return false;

    const obj1keys = Object.keys(obj1);
    const obj2keys = Object.keys(obj2).filter((el) => !obj1keys.includes(el));

    for (const k of obj1keys) {
        if (typeof obj1[k] !== typeof obj2[k]) return false;
        if (typeof obj1 === 'object') {
            if (obj1 === null) return obj2 === null;
            if (!deepEqual(obj1[k], obj2[k])) return false;
        } else return obj1 === obj2;
    }

    for (const k of obj2keys) {
        if (typeof obj1[k] !== typeof obj2[k]) return false;
        if (typeof obj1 === 'object') {
            if (obj1 === null) return obj2 === null;
            if (!deepEqual(obj1[k], obj2[k])) return false;
        } else return obj1 === obj2;
    }

    return true;
}

export function arrEq(
    arr1: Array<string | number | bigint | boolean>,
    arr2: Array<string | number | bigint | boolean>
): boolean {
    for (const v of arr1) {
        if (!arr2.includes(v)) return false;
    }

    for (const v of arr2) {
        if (!arr1.includes(v)) return false;
    }

    return true;
}

export function uniqueEntries(arr: Array<any>) {
    let _arr: any[] = [];
    return arr.filter((el) => {
        if (_arr.includes(el)) return false;
        else {
            _arr.push(el);
            return true;
        }
    });
}

export function escapeString(
    string: string,
    quotes: Array<string> = ['"']
): string {
    string = string
        .replaceAll('"', '\\"')
        .replaceAll('\r', '\\r')
        .replaceAll('\n', '\\n');
    quotes.forEach((el) => (string = string.replaceAll(el, '\\' + el)));
    return string;
}

export function createTimeTracker(text: string) {
    const $internalObj = {
        slices: [{ time: Date.now(), text }],
        start: Date.now(),
    };
    function addTimeSlice(text: string) {
        $internalObj.slices.push({ text, time: Date.now() });
    }
    function getOutput(
        asTable: boolean | undefined = false,
        printFunction?: (text: string, timeInSeconds: string) => string
    ) {
        if (!printFunction)
            printFunction = (text, time) => `${text} (${time}s)`;

        if (asTable) {
            const maxArg = {
                Name: 'Time Taken',
                Time: ((Date.now() - $internalObj.start)/1000).toFixed(3) + 's',
                Start: new Date($internalObj.start).toLocaleTimeString(),
            };
            const args = $internalObj.slices.map(({ text, time }, i) => {
                return {
                    Name: text,
                    Time:
                        (
                            (($internalObj.slices[i + 1]?.time || Date.now()) -
                                time) /
                            1000
                        ).toFixed(3) + 's',
                    Start: new Date(time).toLocaleTimeString(),
                };
            });

            const maxLengths = {
                Name: maxArg.Name.length,
                Time: maxArg.Time.length,
                Start: maxArg.Start.length,
            };
            for (const { Name, Start, Time } of args) {
                maxLengths.Name = Math.max(Name.length, maxLengths.Name);
                maxLengths.Start = Math.max(Start.length, maxLengths.Start);
                maxLengths.Time = Math.max(Time.length, maxLengths.Time);
            }

            args.push({
                Name: strMul('─', maxLengths.Name),
                Start: strMul('─', maxLengths.Start),
                Time: strMul('─', maxLengths.Time),
            });
            args.push(maxArg);

            return createTable('Timings', ['Name', 'Time', 'Start'], args);
        }

        return (
            'Timing:\n' +
            $internalObj.slices
                .map(({ text, time }, i) => {
                    const next =
                        i === $internalObj.slices.length - 1
                            ? Date.now()
                            : $internalObj.slices[i + 1].time;
                    return !printFunction
                        ? ''
                        : printFunction(
                              text,
                              ((next - time) / 1000).toFixed(3)
                          );
                })
                .filter((el) => el.length > 0)
                .join('\n')
        );
    }
    function printOutput(
        asTable?: boolean,
        printFunction?: (text: string, timeInSeconds: string) => string
    ) {
        console.log(getOutput(asTable, printFunction));
    }

    return { printOutput, getOutput, addTimeSlice };
}

export function strMul(s: string, i: number) {
    let str = '';
    for (let j = 0; j < i; j++) str += s;
    return str;
}

export function createTextbox(title: string, contents: string) {
    const lines = contents.split('\n');
    const innerSize = Math.max(
        title.length + 2,
        lines.reduce(
            (acc, el) =>
                Math.max(
                    acc,
                    el.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, '').length
                ),
            lines[0].length || 0
        )
    );

    let textbox = `┌──${title}${strMul('─', innerSize - title.length)}┐\n`;
    textbox += lines
        .map(
            (el) =>
                `${el.startsWith('─') ? '├─' : '│ '}${el}${strMul(
                    ' ',
                    innerSize -
                        el.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, '').length
                )}${el.endsWith('─') ? '─┤' : ' │'}\n`
        )
        .join('');
    textbox += '└' + strMul('─', innerSize + 2) + '┘';

    return textbox;
}

export class TextboxBuilder {
    private title: string = '';
    private lines: ({ type: 'divider' } | string)[] = [];
    private minLength = 0;
    private footer: string = '';

    setTitle(title: string) {
        this.title = title;
        return this;
    }
    setFooter(footer: string) {
        this.footer = footer;
        return this;
    }
    getFooter() {
        return this.footer;
    }
    addLine(line: string) {
        if (line.includes('\n')) return this;
        this.lines.push(line);
        return this;
    }
    addLines(lines: string | string[]) {
        if (typeof lines === 'object') this.lines.push(...lines);
        else this.lines.push(...lines.split('\n'));
        return this;
    }
    setMinLength(length: number) {
        this.minLength = length;
        return this;
    }
    getMinLength() {
        return this.minLength;
    }
    addDivider() {
        this.lines.push({ type: 'divider' });
        return this;
    }
    getLines() {
        return this.lines;
    }
    getTitle() {
        return this.title;
    }
    removeLine(last: boolean | undefined = true) {
        if (last) this.lines.pop();
        else this.lines.shift();
        return this;
    }
    build() {
        const stringLines = this.lines.filter(
            (el) => typeof el === 'string'
        ) as string[];
        const innerSize = Math.max(
            this.minLength,
            this.footer.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, '').length,
            this.title.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, '').length + 2,
            stringLines.reduce(
                (acc, el) =>
                    Math.max(
                        acc,
                        el.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, '').length
                    ),
                stringLines[0].length || 0
            )
        );

        const buildLines = this.lines
            .map((el) => {
                if (typeof el === 'string')
                    return (
                        el +
                        strMul(
                            ' ',
                            innerSize -
                                el.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, '')
                                    .length
                        )
                    );
                else if (el.type === 'divider') return strMul('─', innerSize);
                else return strMul(' ', innerSize);
            })

            .map(
                (el) =>
                    (el.startsWith('─') ? '├─' : '│ ') +
                    el +
                    (el.endsWith('─') ? '─┤\n' : ' │\n')
            )
            .join('');
        const footerSize = this.footer.replaceAll(
            /\x1B\[[0-9]+(;[0-9]+)*m/g,
            ''
        ).length;
        const titleSize = this.title.replaceAll(
            /\x1B\[[0-9]+(;[0-9]+)*m/g,
            ''
        ).length;

        return `┌──${titleSize > 0 ? '« ' : '─'}${this.title}${
            titleSize > 0 ? ' »' : '─'
        }${strMul(
            '─',
            innerSize - titleSize - (titleSize > 0 ? 4 : 0)
        )}┐\n${buildLines}└──${footerSize > 0 ? '« ' : '─'}${this.footer}${
            footerSize > 0 ? ' »' : '─'
        }${strMul('─', innerSize - footerSize - (footerSize > 0 ? 4 : 2))}┘`;
    }
    log() {
        return console.log(this.build());
    }
}

function setStrAtPos(str: string, pos: number, char: string) {
    if (char.length < 1) return str;
    char = char[0];
    return str.substring(0, pos) + char + str.substring(pos + 1);
}

export function createTable<T extends string>(
    header: string,
    keys: T[],
    data: { [Key in T]: string | number | boolean }[],
    differentiateLines: boolean | undefined = false
) {
    const rowKeys = Object.keys(data);
    if (rowKeys.length < 1 || keys.length < 1) return '┌──┐\n└──┘';
    const rows = Object.values(data);
    const columns: { [P in T]?: string[] } = {};
    for (const c of keys) columns[c] = rows.map((el) => el[c].toString());
    const columnLengths: { [P in T]?: number } = {};
    for (const c of keys)
        columnLengths[c] =
            columns[c]?.reduce(
                (a, b) => (a > b.length ? a : b.length),
                Math.max(columns[c]?.[0].length || 0, c.length)
            ) || 0;
    let str = '┌──« ' + header + ' »──';
    for (const c of keys)
        str += strMul(
            '─',
            (columnLengths[c] || 0) + 3 - (c === keys[0] ? str.length : 0)
        );
    str += '┐\n';
    let i = 0;
    for (const c of keys) {
        const length = columnLengths[c];
        if (str[i] === '─') str = setStrAtPos(str, i, '┬');
        i += 3 + (length || 0);
    }

    str += '│ ';
    for (const c of keys) {
        str += c;
        str += strMul(' ', (columnLengths[c] || 1) - c.length);
        str += ' │ ';
    }
    str += '\n';

    if (!differentiateLines) {
        str += '├';
        for (const c of keys) {
            str += strMul('─', (columnLengths[c] || 1) + 2) + '┼';
        }
        str = str.substring(0, str.length - 1);
        str += '┤\n';
    }

    for (const i in rowKeys) {
        if (differentiateLines) {
            str += '├';
            for (const c of keys) {
                str += strMul('─', (columnLengths[c] || 1) + 2) + '┼';
            }
            str = str.substring(0, str.length - 1);
            str += '┤\n';
        }
        str += columns[keys[0]]?.[i].startsWith('─') ? '├─' : '│ ';
        for (const j in keys) {
            const c = keys[j];
            str +=
                (columns[c]?.[i] || '') +
                strMul(
                    ' ',
                    (columnLengths[c] || 0) - (columns[c]?.[i] || '').length
                ) +
                `${resolveDelimiter(
                    columns[c]?.[i],
                    columns[keys[Number(j) + 1]]?.[
                        j === (keys.length - 1).toString()
                            ? Number(i) + 1
                            : Number(i)
                    ]
                )}`;
        }
        str += '\n';
    }
    str += '└';
    for (const c of keys)
        str += '─' + strMul('─', columnLengths[c] || 0) + '─┴';
    str = str.substring(0, str.length - 2);
    str += '─┘';

    return str;
}

function resolveDelimiter(a: string | undefined, b: string | undefined) {
    let str = '';
    if (a?.endsWith('─')) str = '─┤';
    else str += ' │';

    if (b?.startsWith('─')) return str[0] + (str[1] === '│' ? '├─' : '┼─');
    else return str + ' ';
}

// ┌ ┬ ┐
// ├ ─ ┤
// └ ┴ ┘
// │


export function createSpinner(message: string) {
    const sp = _createSpinner(message);
    sp.error = (opts?: {
        text?: string | undefined;
        mark?: string | undefined;
    } | undefined) => {throw new Error(opts?.text || "Error")};
    return sp;
}