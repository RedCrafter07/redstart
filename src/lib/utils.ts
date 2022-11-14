export const is = {
    exists: (v: any) => v !== undefined,
    set: (v: any) => is.exists(v) && v !== null,
    object: (v: any) => v !== null && typeof v === "object",
    arr: (v: any) => is.object(v) && v instanceof Array,
    str: (v: any) => typeof v === "string",
    json: (v: any) => {
        if (!is.str(v)) return false;
        try {
            JSON.parse(v);
            return true;
        } catch {
            return false;
        }
    },
};

export function deepEqual(obj1: any, obj2: any) {
    if (!is.set(obj1) || !is.set(obj2)) return false;

    const obj1keys = Object.keys(obj1);
    const obj2keys = Object.keys(obj2).filter((el) => !obj1keys.includes(el));

    for (const k of obj1keys) {
        if (typeof obj1[k] !== typeof obj2[k]) return false;
        if (typeof obj1 === "object") {
            if (obj1 === null) return obj2 === null;
            if (!deepEqual(obj1[k], obj2[k])) return false;
        } else return obj1 === obj2;
    }

    for (const k of obj2keys) {
        if (typeof obj1[k] !== typeof obj2[k]) return false;
        if (typeof obj1 === "object") {
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
    for (const i in arr1) {
        if (arr2[i] !== arr1[i]) return false;
    }

    for (const i in arr2) {
        if (arr2[i] !== arr1[i]) return false;
    }

    return true;
}

export function escapeString(
    string: string,
    quotes: Array<string> = ['"']
): string {
    string = string
        .replaceAll('"', '\\"')
        .replaceAll("\r", "\\r")
        .replaceAll("\n", "\\n");
    quotes.forEach((el) => (string = string.replaceAll(el, "\\" + el)));
    return string;
}

export function createTimeTracker(text: string) {
    const $internalObj = { slices: [{ time: Date.now(), text }] };
    function addTimeSlice(text: string) {
        $internalObj.slices.push({ text, time: Date.now() });
    }
    function getOutput(
        asTextbox: boolean | undefined = false,
        withdivider?: boolean,
        printFunction?: (text: string, timeInSeconds: string) => string
    ) {
        if (!printFunction)
            printFunction = (text, time) => `${text} (${time}s)`;

        if (asTextbox) {
            const textbox = new TextboxBuilder().setTitle("Timings");
            $internalObj.slices
                .map(({ text, time }, i) => {
                    const next =
                        i === $internalObj.slices.length - 1
                            ? Date.now()
                            : $internalObj.slices[i + 1].time;
                    return !printFunction
                        ? ""
                        : printFunction(
                              text,
                              ((next - time) / 1000).toFixed(3)
                          );
                })
                .filter((el) => el.length > 0)
                .forEach((el) =>
                    withdivider
                        ? textbox.addLine(el).addDivider()
                        : textbox.addLine(el)
                );
            if (withdivider) textbox.removeLine();
            return textbox.build();
        }

        return (
            "Timing:\n" +
            $internalObj.slices
                .map(({ text, time }, i) => {
                    const next =
                        i === $internalObj.slices.length - 1
                            ? Date.now()
                            : $internalObj.slices[i + 1].time;
                    return !printFunction
                        ? ""
                        : printFunction(
                              text,
                              ((next - time) / 1000).toFixed(3)
                          );
                })
                .filter((el) => el.length > 0)
                .join("\n")
        );
    }
    function printOutput(
        asTextbox?: boolean,
        withdivider?: boolean,
        printFunction?: (text: string, timeInSeconds: string) => string
    ) {
        console.log(getOutput(asTextbox, withdivider, printFunction));
    }

    return { printOutput, getOutput, addTimeSlice };
}

export function strMul(s: string, i: number) {
    let str = "";
    for (let j = 0; j < i; j++) str += s;
    return str;
}

export function createTextbox(title: string, contents: string) {
    const lines = contents.split("\n");
    const innerSize = Math.max(
        title.length + 2,
        lines.reduce(
            (acc, el) =>
                Math.max(
                    acc,
                    el.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, "").length
                ),
            lines[0].length || 0
        )
    );

    let textbox = `┌──${title}${strMul("─", innerSize - title.length)}┐\n`;
    textbox += lines
        .map(
            (el) =>
                `${el.startsWith("─") ? "├─" : "│ "}${el}${strMul(
                    " ",
                    innerSize -
                        el.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, "").length
                )}${el.endsWith("─") ? "─┤" : " │"}\n`
        )
        .join("");
    textbox += "└" + strMul("─", innerSize + 2) + "┘";

    return textbox;
}

export class TextboxBuilder {
    private title: string = "";
    private lines: ({ type: "divider" } | string)[] = [];
    private minLength = 0;
    private footer: string = "";

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
        if (line.includes("\n")) return this;
        this.lines.push(line);
        return this;
    }
    addLines(lines: string | string[]) {
        if (typeof lines === "object") this.lines.push(...lines);
        else this.lines.push(...lines.split("\n"));
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
        this.lines.push({ type: "divider" });
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
            (el) => typeof el === "string"
        ) as string[];
        const innerSize = Math.max(
            this.minLength,
            this.footer.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, "").length,
            this.title.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, "").length + 2,
            stringLines.reduce(
                (acc, el) =>
                    Math.max(
                        acc,
                        el.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, "").length
                    ),
                stringLines[0].length || 0
            )
        );

        const buildLines = this.lines
            .map((el) => {
                if (typeof el === "string")
                    return (
                        el +
                        strMul(
                            " ",
                            innerSize -
                                el.replaceAll(/\x1B\[[0-9]+(;[0-9]+)*m/g, "")
                                    .length
                        )
                    );
                else if (el.type === "divider") return strMul("─", innerSize);
                else return strMul(" ", innerSize);
            })

            .map(
                (el) =>
                    (el.startsWith("─") ? "├─" : "│ ") +
                    el +
                    (el.endsWith("─") ? "─┤\n" : " │\n")
            )
            .join("");
        const footerSize = this.footer.replaceAll(
            /\x1B\[[0-9]+(;[0-9]+)*m/g,
            ""
        ).length;
        const titleSize = this.title.replaceAll(
            /\x1B\[[0-9]+(;[0-9]+)*m/g,
            ""
        ).length;

        return `┌──${titleSize > 0 ? "« " : "─"}${this.title}${
            titleSize > 0 ? " »" : "─"
        }${strMul(
            "─",
            innerSize - titleSize - (titleSize > 0 ? 4 : 0)
        )}┐\n${buildLines}└──${footerSize > 0 ? "« " : "─"}${this.footer}${
            footerSize > 0 ? " »" : "─"
        }${strMul("─", innerSize - footerSize - (footerSize > 0 ? 4 : 2))}┘`;
    }
}
