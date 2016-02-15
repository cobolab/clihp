# Clihp

A lightweight Command Line Interface (CLI) helper.

## Usage

Install the module using **`npm install --save cb-clihp`**, and load the module. After loaded, the **`Clihp`** object will be available on the global object.

``` js
require('cb-clihp');

// Creating parser instance.
var clp = new Clihp.Parser();

// Creating helper instance.
var clh = new Clihp.Helper();
```

***

### Parser Properties

* **`.cmd`** - A string represent the command name, taken from the first env. E.g: `build`
* **`.opt`** - An array contains options list. Options are string that started with single or double dash. E.g: `--version`, `-v`
* **`.val`** - An array contains values list. Values are string that not started with single or double dash. E.g: `script`, `style`
* **`.cfg`** - An object contains configs. Configs are string that paired with `=`. E.g: `host=localhost`, `port=8023`

**Example**

``` bash
node app.js build script host=localhost port=3000 --verbose
```

**`app.js`**

``` js
require('cb-clihp');

var clp = new Clihp.Parser();

console.log(clp.cmd); // build
console.log(clp.opt); // ['--verbose']
console.log(clp.val); // ['script']
console.log(clp.cfg); // { 'host': 'localhost', 'port': 3000 }
```

### Parser Methods

All parser methods are accept multiple arguments. The examples below is related to the sample above.

**`.hasopt()`**

Check does the cli has options.

**Example**

``` js
clp.hasopt('--verbose', '-vb'); // True
clp.hasopt('--debug');          // False
```

**`.hasval()`**

Check does the cli has values.

**Example**

``` js
clp.hasval('script'); // True
clp.hasval('styles'); // False
```

**`.hascfg()`**

Check does the cli has configs.

**Example**

``` js
clp.hascfg('host', 'port');   // True
clp.hascfg('envi');           // False
```

***

## Helper

With helper, you easily create a CLI app with simple steps, including showing the helps on the console. When creating helper, the class will create default commands to show the help (`-h`, `--help`, `help`) and show the version (`-v`, `--version`, `version`).

**Example (app.js)**

``` js
// Creating helper instance.
new Clihp.Helper()

// Setting up the CLI helper.
    .setup({
        name    : 'Clihp',
        info    : 'A Lightweight Command Line Interface (CLI) Helper',
        version : require('./package.json').version,
        usage   : `node app.js command [options...]`,
        prefix  : [
            `-->`,
            `-------- CLI HELPER ----------------------------------->`,
            `-->`,
        ]
    })

    // Adding commands
    .add('cmd', {
        name  : 'start',
        alias : '-s',
        about : 'Start the server',
        usage : 'node app.js start host=hostname\r\n',
        exec( opt, val, cfg ) {
            if ( this.hasopt('--verbose') ) {
                console.log('Starting server');
            }

            if ( !this.hascfg('host') ) {
                this.help('The host config is required!');
            }
            else {
                console.log(`Server running at "${this.cfg.host}"`);
            }
        }
    })
    .add('cmd', {
        name  : 'stop',
        alias : '-q',
        about : 'Stop the server',
        usage : 'node app.js stop\r\n',

        exec ( opt, val, cfg ) {
            console.log('Stopping server');
        }
    })

    // Adding configs
    .add('cfg', {
        name  : 'host',
        type  : 'String',
        about : 'Server hostname'
    })
    .add('cfg', {
        name  : 'port',
        type  : 'Number',
        about : 'Server port'
    })

    // Adding options
    .add('opt', {
        name  : '--verbose',
        alias : '-b',
        about : 'Display the logs on the screen'
    })
    .add('opt', {
        name  : '--debug',
        alias : '-d, -g',
        about : 'Debug the process'
    })

    // Initialize the helper. Helper will never working without running this method.
    .init();
```

``` bash
node app.js --help
```

Running the command above will resulting:

![CBLoggy](https://raw.githubusercontent.com/cobolab/clihp/master/sample.png)

``` bash
node app.js start --verbose
```

Running the command above will resulting:

``` bash
Starting server
```

### Methods

**`.setup()`**

Setting up the CLI helper to show the help header.

**`.add()`**

Add commands, configs, and options to the helper.

**Usage**

``` js
cli.add(type, options);
```

* **`type`**      - String `cmd` or `opt`. Cmd is to add command, and opt is to add option.
* **`options`**   - Object contains the command or option options.
* **`options.name`**  - **`Required`** String the primary command/option name.
* **`options.alias`** - **`Optional`** String the command/option alias, separated by `,`.
* **`options.about`** - **`Optional`** String about the command/option. Leave blank to hide the command on the helper.
* **`options.usage`** - **`Optional`** String about the how to use the command. Leave blank to hide the command on the helper.
* **`options.type`** - **`Optional`** String about the config value type.
* **`options.exec`**  - **`Required`** Function that will be executed when the command name is match with the command from cli. Optional for option.

**`.help()`**

Show the cli helps, with or without message.

**Example**

``` js
clp.help('The command is not registered!');
```

**`.init()`**

Run the Clihp Helper to get the executed command to run the registered command.