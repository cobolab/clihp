"use strict";

if ( !global.JSFix ) require('cb-jsfix');

/* Loading Required Modules */
var colr = require('cli-color'),
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

                    self.cfg[ arg[ 0 ] ] = arg[ 1 ];
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

            mstr = self._marg;
            mstr += marginate(info.name || '', self.max, 'yellow');
            mstr += '  ' + marginate(info.alias || '', self.max, 'magenta');
            mstr += '  ' + info.about;
            console.log(mstr);

            if ( info.usage ) {
                hstr = self._marg;
                hstr = hstr + marginate('', self.max);
                hstr = hstr + '  ' + marginate('', self.max);
                hstr = hstr + '  ' + info.usage;
                console.log(hstr);
            }

            console.log('');

            this.next();
        });

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
                this._regs.default.call(this, this.opt, this.val, this.cfg);
            }
            else {
                this.help('At least one argument is required.');
            }
        }
        else {
            // Show help if the command is -h or help.
            if ( this.cmd === '-h' || this.cmd === '--help' || this.cmd === 'help' ) {
                return this.help();
            }

            // Call the handler.
            if ( this._regs[ this.cmd ] ) {
                this._regs[ this.cmd ].call(this, this.opt, this.val, this.cfg);
            }
            else {
                this.help(colr.redBright('Invalid command: ') + colr.yellow(this.cmd));
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
