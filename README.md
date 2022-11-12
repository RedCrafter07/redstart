# RedStart

RedStart is a simple file format for starting a NodeJS Project.

## Installation

```bash
<npm/yarn/pnpm> add -g redstart
```

## Usage

RedStart comes with its own file format. It is a custom format for simple configuration.

To get started, just create a file ending with `.rsproj`.

In the first line, you define all the packages you want to install seperated by a comma. For example:

```rsproj
express, @types/express, typescript, tsx
```

In the next lines (after an optional empty line) you can define some config.

### Required Values

```rsproj
language: <typescript | javascript>
# The package manager to install the packages in the first line with.
packageManager: <pnpm | yarn | npm>
# This is a comment.
# Path of the entry file. e.g. src/index.ts
mainFile: <path>
```

### Optional Values

```rsproj
workDir: <path>
```

### Important!

The capitalization of the keys and the values is important.

## Example

```rsproj
axios, chalk@4.1.2, typescript, @types/node

language: typescript
packageManager: pnpm
mainFile: src/main.ts
```

Feel free to check out the [example file](examples/example.rsproj)!

## License

RedStart is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for more information.
