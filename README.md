# @alarife/commander - Tool for command management in Alarife.

<div align="center">

[![NPM Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](https://www.npmjs.com/package/@alarife/commander)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**This tool is a command-line implementation of commander.**

</div>

## 📋 Table of Contents

- [Installation](#-installation)
- [Basic Usage](#-basic-usage)
- [Detailed API](#-detailed-api)
- [License](#-license)

## 🚀 Installation

```bash
npm install @alarife/commander --save-dev
```

## 📦 Basic Usage

### Defining a command

```typescript
import { ProgramLineInterface, Command } from '@alarife/commander';

const greet: Command = {
  name: 'greet',
  description: 'Greet a user by name',
  action: (event) => {
    const [name] = event.args;
    console.log(`Hello, ${name}!`);
  },
  arguments: [
    {
      descriptiveType: 'name',
      description: 'Name of the user to greet',
      required: true,
    },
  ],
};

const program = new ProgramLineInterface([greet]);
program.parse(process.argv, 'node');
```

```bash
node app.js greet World
# Hello, World!
```

### Adding options

```typescript
const build: Command = {
  name: 'build',
  description: 'Build the project',
  action: (event) => {
    console.log(event.options);       // { outDir: 'dist', minify: true }
    console.log(event.configOptions); // { 'out-dir': 'dist', minify: true }
  },
  options: [
    {
      name: 'out-dir',
      shortName: 'o',
      descriptiveType: 'path',
      description: 'Output directory',
      defaultValue: 'dist',
    },
    {
      name: 'minify',
      shortName: 'm',
      description: 'Minify the output',
    },
  ],
};
```

```bash
node app.js build --out-dir lib --minify
```

### Negatable flags (`--no-*`)

When an option name starts with `no-`, commander exposes the value in `options` using camelCase **without** the `no-` prefix and inverts the boolean. `configOptions` preserves the literal name and inverts the value back, so the key always represents *"the `--no-xxx` flag was activated"*.

```typescript
const build: Command = {
  name: 'build',
  options: [
    { name: 'no-banner' },
  ],
  action: (event) => {
    // Running: node app.js build --no-banner
    console.log(event.options.banner);              // false
    console.log(event.configOptions['no-banner']);  // true

    // Running: node app.js build
    console.log(event.options.banner);              // true
    console.log(event.configOptions['no-banner']);  // false
  },
};
```

### Using environment variables

You can bind an option to an environment variable using the `env` property. If the option is not provided via the command line, the value is read from the specified environment variable. If the variable is not defined either, `defaultValue` is used as a fallback.

```typescript
const deploy: Command = {
  name: 'deploy',
  description: 'Deploy the application',
  action: (event) => {
    console.log(event.options); // { token: '<value from CLI, env, or default>' }
  },
  options: [
    {
      name: 'token',
      shortName: 't',
      descriptiveType: 'string',
      description: 'Authentication token',
      env: 'DEPLOY_TOKEN',
      defaultValue: 'default-token',
    },
  ],
};
```

```bash
# Value from CLI
node app.js deploy --token my-secret

# Value from environment variable
DEPLOY_TOKEN=my-secret node app.js deploy

# Falls back to defaultValue when neither is provided
node app.js deploy
```

### Adding arguments and options dynamically

`addArgument` and `addOption` accept one or more items at once, so you can register multiple arguments or options in a single call.

```typescript
const program = new ProgramLineInterface([{ name: 'copy' }]);

program.addArgument('copy',
  { descriptiveType: 'source', required: true },
  { descriptiveType: 'target', required: true },
);

program.addOption('copy',
  { name: 'recursive', shortName: 'r', description: 'Copy recursively' },
  { name: 'force', shortName: 'f', description: 'Overwrite existing files' },
);
```

### Using an external handler

```typescript
const copy: Command = {
  name: 'copy',
  description: 'Copy files from source to target',
  path: './handlers/copy.js',
  arguments: [
    { descriptiveType: 'source', required: true },
    { descriptiveType: 'target', required: true },
  ],
};
```

```typescript
// handlers/copy.ts
import { CommandEvent, Command } from '@alarife/commander';

export default (event: CommandEvent) => {
  const [source, target] = event.args;
  // copy logic...
};
```

## 📖 Detailed API

### `ProgramLineInterface`

Main entry point. Creates a CLI program and registers commands.

```typescript
const program = new ProgramLineInterface(commands?: Command[], version?: Version);
```

| Method | Description |
|---|---|
| `addCommand(command: Command)` | Register a new command. |
| `addArgument(commandName: string, ...arguments: Argument[])` | Add one or more positional arguments to an existing command. |
| `addOption(commandName: string, ...options: Option[])` | Add one or more options to an existing command. |
| `parse(args: string[], from?: ParserFrom)` | Parse arguments and execute the matched command. Returns `CommandEvent`. |

`ParserFrom` can be `'node'`, `'electron'`, or `'user'` (default).

---

### `Command`

Declarative configuration object for a CLI command.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✅ | Command name used in the terminal. |
| `description` | `string` | | Help text for the command. |
| `version` | `Version` | | Command-specific version. |
| `path` | `string` | | Path to a `.js` handler file. |
| `action` | `(event, command, config) => void` | | Inline handler function. See signature below. |
| `arguments` | `Argument[]` | | Positional arguments. |
| `options` | `Option[]` | | Named options / flags. |

**`action` signature:**

```typescript
(event: CommandEvent, command: CommanderCommand, commandConfig: Command) => void
```

> Both `action` and `path` can coexist — both will execute.

---

### `Argument`

Positional argument for a command.

| Property | Type | Required | Description |
|---|---|---|---|
| `descriptiveType` | `string` | ✅ | Display name shown in help (e.g. `path`, `source`). |
| `description` | `string` | | Help text. |
| `required` | `boolean` | | Wraps in `<name>` when true, `[name]` when false. |
| `variadic` | `boolean` | | Accept multiple values (`<name...>`). |
| `choices` | `string[]` | | Restrict to a set of allowed values. |
| `defaultValue` | `any` | | Default value when not provided. |

---

### `Option`

Named flag for a command.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | | Long flag name (e.g. `extensions` → `--extensions`). Prefix with `no-` to declare a negatable boolean flag. |
| `shortName` | `string` | | Short flag alias (e.g. `ex` → `-ex`). |
| `descriptiveType` | `string` | | Type label shown in help. |
| `description` | `string` | | Help text. |
| `required` | `boolean` | | Mark the option as mandatory. |
| `variadic` | `boolean` | | Accept multiple values. |
| `choices` | `string[]` | | Restrict to allowed values. |
| `defaultValue` | `any` | | Default value. |
| `hideHelp` | `boolean` | | Hide from auto-generated help. |
| `conflicts` | `string[]` | | Mutually exclusive options. |
| `implies` | `Record<string, any>` | | Set other options when this one is used. |
| `hook` | `(value, previous) => any` | | Transform the parsed value. |
| `env` | `string` | | Environment variable name. If set and the option is not provided, the value is read from this variable. Falls back to `defaultValue` if the variable is not defined. |

> Option names are converted to **camelCase** in `event.options` (e.g. `--project-name` → `options.projectName`) and kept as-is in `event.configOptions` (e.g. `configOptions['project-name']`).

---

### `CommanderCommand`

Type alias for the underlying `commander.Command` instance. Passed as the second parameter to `action` and external handlers.

```typescript
type CommanderCommand = commander.Command;
```

---

### `CommandEvent`

Returned by `parse()` and passed to handlers.

```typescript
interface CommandEvent {
  args: any[];                         // Positional arguments in order
  options: Record<string, any>;        // Parsed options (camelCase keys, as resolved by commander)
  configOptions: Record<string, any>;  // Parsed options keyed by the literal `name` declared in the config
}
```

| Field | Key format | Notes |
|---|---|---|
| `options` | `camelCase` | Value as produced by commander. For `--no-xxx` flags the key is `xxx` and the boolean is **not** inverted (commander stores `false` when the flag is passed). |
| `configOptions` | Literal `name` from the config (e.g. `'out-dir'`, `'no-banner'`) | Value copied as-is for all types. For `--no-xxx` boolean flags the value is inverted so the key represents *"the flag was activated"*. Options without a `name` are omitted. |

---

### `ParserFrom`

Specifies how the argument array should be parsed depending on the runtime.

```typescript
type ParserFrom = 'node' | 'electron' | 'user';
```

| Value | Description |
|---|---|
| `'node'` | Strips the first two elements (`node` and script path). |
| `'electron'` | Strips Electron-specific prefix arguments. |
| `'user'` | Uses the arguments as-is (default). |

---

### `Version`

Can be a plain string or a configuration object.

```typescript
// Simple
const program = new ProgramLineInterface([], '1.0.0');

// Detailed
const program = new ProgramLineInterface([], {
  version: '1.0.0',
  name: 'version',
  shortName: 'v',
  description: 'Show the current version',
});
```

## 📄 License

This project is licensed under Apache-2.0. See the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Jose Eduardo Soria Garcia](mailto:alarifeproyect@gmail.com)**

<sub>🌍 Product developed in Andalucia, España 🇪🇸</sub>

*Part of the Alarife ecosystem*

</div>

