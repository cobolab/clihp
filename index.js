"use strict";

if ( !global.JSFix ) require('cb-jsfix');

/* Loading Required Modules */
var colr = require('cli-color'),
    line = require('inquirer'),
    oses = require('os'),
    path = require('path');

// Create cwd.
var cwd = process.cwd();

/* Get Platform */
var osp = oses.type();

if ( osp.search('Linux') > -1 ) {
    osp = 'linux';
}
else if ( osp.search('Darwin') > -1 ) {
    osp = 'darwin';
}
else if ( osp.search('Windows') > -1 ) {
    osp = 'windows';
}

/**
 * CLI Parser.
 * Use this parser to parse CLI Arguments.
 * Parser will split given arguments and automatically group them.
 */
class Parser {
    constructor () {
        var self = this;

        // OS Platform.
        this.osp = osp;

        // Create original arguments.
        this.org = process.argv;

        // Create initial arguments.
        this.def = this.org.slice(2);

        // Create command name. Usually, command name is the first process argument.
        this.cmd = null;

        // Create options list. Option is argument that started with single or double dash. E.g: --version, -v
        this.opt = [];

        // Create values list. Value is argument that not started with single or double dash. E.g: output, dirname
        this.val = [];

        // Create configs list. Config is a pair between option and value using "=".
        this.cfg = {};

        // Load package.json if exist.
        this.pkg = null;

        try {
            this.pkg = require(path.resolve(cwd, 'package.json'));
        }
        catch ( e ) {
        }

        // Assign command name.
        this.cmd = this.def[ 0 ];

        // Parsing Arguments
        forwait(this.def, function ( arg, idx ) {
            // Skip command name.
            if ( arg !== self.cmd ) {
                // Getting as Config.
                if ( arg.search('=') > -1 ) {
                    arg = arg.split('=');

                    // Pick the last item as value.
                    let val = arg[ arg.length - 1 ];

                    // Iterate the items to set the key and value.
                    arg.forEach(( key, i ) => {
                        // Skip the last item since its not a key, but value.
                        if ( i < (arg.length - 1) ) {
                            self.cfg[ key ] = val;
                        }
                    });
                }

                // Get as options and values.
                else {
                    // Dashed argument is option.
                    if ( arg[ 0 ] === '-' ) {
                        self.opt.push(arg);
                    }

                    // Non-dhased argument is value.
                    else {
                        self.val.push(arg);
                    }
                }
            }

            // Continue iterator.
            this.next();
        });

        return this;
    }

    /**
     * CLI Prompt
     * A wrapper of Inquirer to help the Clihp to prompt questions.
     *
     * @param questions - Array questions list.
     * @param callback - Function to handler the answers.
     * @returns {*}
     */
    ask ( questions, callback ) {
        return line.prompt(questions, callback);
    }

    // Option Checker.
    hasopt () {
        let has = false;

        for ( let key in arguments ) {
            let arg = arguments[ key ];

            if ( this.opt.indexOf(arg) > -1 ) has = true;
        }

        return has;
    }

    /**
     * Check does CLI has described value name.
     * @returns {boolean}
     */
    hasval () {
        let has = false;

        for ( let key in arguments ) {
            let arg = arguments[ key ];

            if ( this.val.indexOf(arg) > -1 ) has = true;
        }

        return has;
    }

    /**
     * Check does CLI has described config name.
     * @returns {boolean}
     */

    hascfg () {
        let has = false;

        for ( let key in arguments ) {
            let arg = arguments[ key ];

            if ( Object.keys(this.cfg).indexOf(arg) > -1 ) has = true;
        }

        return has;
    }
}

/**
 * CLI Helper
 * Help to handle and show the available commands and options.
 */
class Helper extends Parser {
    // Create constructor.
    setup ( option ) {
        // Ensure the option is an object.
        option = isObject(option) ? option : {};

        // Main Information.
        this._pref = isArray(option.prefix) ? option.prefix : [];
        this._name = option.name || 'Clihp';
        this._info = option.info || 'A Lightweight Command Line Interface (CLI) Helper';
        this._vers = option.version || '1.0.0';
        this._help = option.usage || 'Usage informations goes here';
        this._marg = option.space || '';

        // Create docs list.
        this._docs = {
            cmd : [],
            opt : [],
            cfg : []
        };

        // Create listener.
        this._regs = {}

        // Create longer name.
        this.max = 0;

        return this;
    }

    // Docs adder.
    add ( type, infos ) {
        var self = this;

        // Ensure type and info is defined.
        if ( !isString(type) || !isObject(infos) ) return this.help('Invalid doc type or infos.');

        // Get the name length to set the longest name.
        if ( infos.name && infos.name.length > this.max ) this.max = infos.name.length;

        // Add doc type to the list.
        this._docs[ type ].push(infos);

        // Add to listener.
        if ( infos.exec ) this._regs[ infos.name ] = infos.exec;

        // Add aliases to listener.
        if ( infos.alias ) {
            forwait(infos.alias.split(','), function ( nm ) {
                self._regs[ nm.replace(/\s+/g, '') ] = infos.exec;

                this.next();
            });
        }

        return this;
    }

    // Hidden handler.
    use ( name, handler ) {
        if ( isString(name) && isFunction(handler) ) {
            this._regs[ name ] = handler;
        }

        return this;
    }

    // Create usage lister
    help ( msg ) {
        var self = this;

        if ( msg ) console.log(`${this._marg}${colr.redBright(msg)}`);

        // Print the prefix.
        if ( this._pref.length > 0 ) {
            console.log('');
            this._pref.forEach(function ( msg ) {
                console.log(self._marg + msg);
            });
            console.log('');
        }

        // Log the main info.
        console.log(this._marg + colr.greenBright(this._name));
        console.log(this._marg + colr.yellow(this._info));
        console.log(this._marg + colr.blueBright(`v${this._vers}`));
        console.log('');
        console.log(this._marg + this._help);

        // Log the main usage.
        if ( this._docs.cmd.length > 0 ) {
            console.log('');
            console.log(
                this._marg +
                marginate('COMMANDS', self.max, 'blackBright') + '  ' +
                marginate('ALIAS', self.max, 'blackBright') + '  ' +
                marginate('DESCRIPTION', self.max, 'blackBright')
            );

            // Showing available commands.
            forwait(this._docs.cmd, function ( info ) {
                if ( info.name === 'default' ) {
                    this.next();

                    return;
                }

                var mstr, hstr;

                if ( 'string' === typeof info.about ) {
                    mstr = self._marg;
                    mstr += marginate(info.name || '', self.max, 'yellow');
                    mstr += '  ' + marginate(info.alias || '', self.max, 'magenta');
                    mstr += '  ' + info.about;
                    console.log(mstr);
                }
                else if ( Array.isArray(info.about) && info.about.length > 0 ) {
                    mstr = self._marg;
                    mstr += marginate(info.name || '', self.max, 'yellow');
                    mstr += '  ' + marginate(info.alias || '', self.max, 'magenta');
                    mstr += '  ' + info.about[ 0 ];

                    info.about.splice(0, 1);

                    info.about.forEach(amsg => {
                        mstr += '\r\n' + self._marg;
                        mstr += marginate('', self.max);
                        mstr += '  ' + marginate('', self.max);
                        mstr += '  ' + amsg;
                    });

                    console.log(mstr);
                }

                if ( 'string' === typeof info.usage ) {
                    hstr = self._marg;
                    hstr = hstr + marginate('', self.max);
                    hstr = hstr + '  ' + marginate('', self.max);
                    hstr = hstr + '  [?] ' + info.usage;
                    console.log(hstr);
                }
                else if ( Array.isArray(info.usage) ) {
                    info.usage.forEach(imsg => {
                        hstr = self._marg;
                        hstr = hstr + marginate('', self.max);
                        hstr = hstr + '  ' + marginate('', self.max);
                        hstr = hstr + '  [?] ' + imsg;
                        console.log(hstr);
                    });
                }

                this.next();
            });
        }

        if ( this._docs.cfg.length > 0 ) {
            console.log('');
            console.log(
                this._marg +
                marginate('CONFIGS', self.max, 'blackBright') + '  ' +
                marginate('VALUE TYPE', self.max, 'blackBright') + '  ' +
                marginate('DESCRIPTION', self.max, 'blackBright')
            );

            // Showing available options.
            forwait(this._docs.cfg, function ( info ) {
                var mstr, hstr;

                mstr = self._marg;
                mstr += marginate(info.name || '', self.max, 'yellow');
                mstr += '  ' + marginate(info.type || '', self.max, 'magenta');
                mstr += '  ' + info.about;
                console.log(mstr);

                this.next();
            });
        }

        if ( this._docs.opt.length > 0 ) {
            console.log('');
            console.log(
                this._marg +
                marginate('OPTIONS', self.max, 'blackBright') + '  ' +
                marginate('ALIAS', self.max, 'blackBright') + '  ' +
                marginate('DESCRIPTION', self.max, 'blackBright')
            );

            // Showing available options.
            forwait(this._docs.opt, function ( info ) {
                var mstr, hstr;

                mstr = self._marg;
                mstr += marginate(info.name || '', self.max, 'yellow');
                mstr += '  ' + marginate(info.alias || '', self.max, 'magenta');
                mstr += '  ' + info.about;
                console.log(mstr);

                this.next();
            });
        }

        console.log('');

        return this;
    }

    // Initializer
    init () {
        var self = this;

        // Default helper.
        this.add('cmd', {
            name  : 'help',
            alias : '-h, --help',
            about : 'Display this help.',

            exec : this.help
        }).add('cmd', {
            name  : 'version',
            alias : '-v, --version',
            about : 'Display version number.',

            exec : function () {
                console.log(`${colr.greenBright(this._name)} version ${colr.yellow(this._vers)}`);
            }
        });

        // Ensure argument is given, at least one argument.
        if ( this.def.length < 1 ) {
            if ( this._regs.default ) {
                this._regs.default.call(this, this.val, this.cfg, this.opt);
            }
            else {
                console.log(colr.redBright('At least one argument is required.'));
                console.log(`Run ${colr.greenBright(this._name)} ${colr.xterm(6)('--help')} for mor informations.`);
            }
        }
        else {
            // Show help if the command is -h or help.
            if ( this.cmd === '-h' || this.cmd === '--help' || this.cmd === 'help' ) {
                return this.help();
            }

            // Call the handler.
            if ( this._regs[ this.cmd ] ) {
                this._regs[ this.cmd ].call(this, this.val, this.cfg, this.opt);
            }
            else {
                if ( this._regs.default ) {
                    this.val.push(this.cmd);
                    this._regs.default.call(this, this.val, this.cfg, this.opt);
                }
                else {
                    console.log(colr.redBright('Unknown command: ') + colr.yellow(this.cmd));
                    console.log(`Run ${colr.greenBright(this._name)} ${colr.xterm(6)('--help')} for mor informations.`);
                }
            }
        }

        return this;
    }
}

/* Space maker */
function marginate ( input, length, color ) {
    if ( !color ) color = 'green';

    var str = input;

    for ( var i = 0; i < ((length + 4) - input.length); ++i ) {
        str = str + ' ';
    }

    str = colr[ color ](str);

    return str;
}

// Adding to global object.
global.Clihp = {
    Parser,
    Helper
}

// Exporting class.
module.exports = {
    Parser : Parser,
    Helper : Helper
};
