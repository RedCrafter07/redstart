# RedStart

RedStart is a simple file format for starting a NodeJS Project.

## Installation

```bash
<npm/yarn/pnpm> add -g redstart
```

## Usage

RedStart comes with its own file format. It is a custom format for simple configuration.

To get started, just create a file ending with `.rsproj`.

> # Info
>
> Comments are prefixed with '#' and go to the end of the line. The line numbering ignores comments and empty lines. Iex:
>
> ```
> # aaa
> # abbbb
> 1. line
> #cccc
> 2. line
>
> 3. line
> ```

In the first line, you define the modules, that you want to use. You can find the modules and their proper usage below and in the [usage documentation](./usage/index.md)

In the next lines (after an optional empty line) you define the config for the modules.
You start the config by putting the module name in Square Brackets. After that, you define the config using key: name. Neither key nor name is allowed to have a linebreak. The key can't have whitespaces or ':'s

Syntax:

```
--redstartConfigVariable: value
--dbgprint: true
# ...modules
echo, @install/node

[echo]
message: This is a message
color: aqua

[@install/node]
packages: @types/node
mainFile: main.ts
language: ts,
packageManager: pnpm
```

**Note**: To configure redstart, put -- at the start of the key. Refer to the [Redstart Global Configuration Reference](./usage/redstartGlobalConfig.md) for the usage.

### Important!

The capitalization of the keys and the values is important.

## Datatypes

-   Boolean: true/false
-   Array: Values, without quotes, seperated by ','. After and before the ',', all whitespaces (' ') will be trimmed

## Example

```rsproj
@install/node, echo, @git/gitignore
# ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Modules

[@install/node]
# Required
packages: axios, chalk@4.1.2, typescript, @types/node
language: typescript
packageManager: pnpm
mainFile: src/main.ts

[echo]
message: Hello, World! This should be followed by nothing# When you see this, there's a problem going on :<
color: aqua

[@git/gitignore]
language: ts
additional: test/
```

Feel free to check out the [example file](examples/build.rsproj)!

## Getting help

Run `redstart -h`

## Other cli commands

**Getting the available modules**

Run `redstart <-m|--modules>`

**Getting the module usage information**

Run `redstart <-u|--usage> modulename`

**Using a template**

Run `redstart <-i|--init|-t|--template>`

**Running the redstart file setup wizard**

Run `redstart setup`

This will help you easily create .rsproj files

---

## License

RedStart is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for more information.

## Contributing

> Read [CONTRIBUTE.md](./CONTRIBUTE.md)
