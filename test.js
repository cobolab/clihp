"use strict";

var CLI  = require('./index'),
    colr = require('cli-color');

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