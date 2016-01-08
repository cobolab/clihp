"use strict";

var CLI  = require('./index'),
    colr = require('cli-color');

new CLI.Helper().setup({
        name    : 'CLI App',
        info    : 'CLI Test',
        version : require('./package.json').version,
        usage   : `Usage: ${colr.greenBright('./server.js')} ${colr.yellow('commands')} [options...]`,
        prefix  : [ 'ººººººººººººººººººººººººººººººººººººººººººººººººººººººººººººººººººººº' ]
    })
    .add('cmd', {
        name  : 'start',
        alias : '-s',
        about : 'Start Server',
        exec() {
            console.log('Executed');
        }
    })
    .init();