#!/usr/bin/env node

'use strict';

const serialport = require('serialport');
const parser = new serialport.parsers.Readline;
const sprintf = require('sprintf');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '',
});

let port; // forgot how to pass data through promise chains

const argv = require('yargs')
	.option('c', {
		alias: 'crlf',
		default: false,
		type: 'boolean',
		describe: 'Send a CRLF with the line',
	})
	.option('b', {
		alias: 'baud',
		default: 3686400,
		type: 'number',
		describe: 'Connection Baud rate',
		nargs: 1,
	})
	.option('p', {
		alias: 'pid',
		type: 'string',
		describe: 'Connect to the first product ID found that matches',
		nargs: 1,
	})
	.option('n', {
		alias: 'name',
		type: 'string',
		describe: 'Connect to actual port name',
		nargs: 1,
	})
	.option('l', {
		alias: 'list',
		type: 'boolean',
		describe: 'List all callup devices and exit',
	})
	.strict(true)
	.fail((msg, err, yargs) => { 
		if (err) {
			throw err;
		}
		console.error('Error: ' + msg);
		process.exit(1);
	})
	.exitProcess(true)
	.help('h')
	.alias('h', 'help')
	.argv;


function processLine(port) {
	rl.on('line', (line) => {
		if (line === 'exit' || line === 'q') {
			port.close();
			process.exit(0);
		} else {
			// this is a workaround for the weird-ass macOS+L476+8B bug.
			line = '' + line;
			for (let i = 0; i < line.length; ++i) {
				port.write(line[i]);
			}
			if (argv.crlf) { 
				port.write('\r\n');
			}
		}
	});
}

if (argv.list) {
	getPortsP().then(ports => {
		console.log(sprintf('%-30s %10s %10s %s', 
			'manufacturer',
			'vendorId',
			'productId',
			'comName'
		));
		ports.forEach(portObj => {
			if (portObj.manufacturer) {
				console.log(sprintf('%-30s %10s %10s %s', 
					portObj.manufacturer,
					portObj.vendorId,
					portObj.productId,
					portObj.comName
				));
			} else {
				console.log(sprintf('%-30s %10s %10s %s', 
					'?', '?', '?', portObj.comName
				));
			}
		});
		process.exit(0);
	}).catch(err => {
		console.error('Error: ' + err);
	});
} else if (argv.pid && argv.name) {
	console.error('--pid and --name are mutually exclusive');
	process.exit(1);
} else if (argv.pid) {
	getPortsP()
	.then(ports => connectPortP(ports, argv.pid, argv.baud))
	.then(port => { processLine(port); })
	.catch(err => { 
		console.error('Error: ' + err);
		process.exit(1);
	});
} else if (argv.name) {
	getPortsP()
	.then(ports => connectNameP(ports, argv.name, argv.baud))
	.then(port => { processLine(port); })
	.catch(err => { 
		console.error('Error: ' + err);
		process.exit(1);
	});
}

function getPortsP() {
	return new Promise((resolve, reject) => {
		serialport.list((err, ports) => {
			if (err) {
				reject(err);
			} else {
				resolve(ports);
			}
		});
	});
}

function connectNameP(ports, name, baud) {
	console.log(baud)
	return new Promise((resolve, reject) => {
		let found = undefined;
		ports.forEach(port => {
			if (port.comName == name) {
				found = port.comName;
			}
		});
		if (found) {
			port = new serialport(found, { baudRate: baud, });
			port.pipe(parser);
			parser.on('open', () => {
				console.log(`[${found}]: open`);
			});
			resolve(port);
		} else {
			reject('Unable to locate name ' + name);
		}
	});
}

function connectPortP(ports, pid, baud) {
	console.log(baud)
	return new Promise((resolve, reject) => {
		let found = undefined;
		ports.forEach(port => {
			if (port.productId == pid) {
				found = port.comName;
			}
		});
		if (found) {
			port = new serialport(found, { baudRate: baud, });
			port.pipe(parser);
			parser.on('data', data => {
				console.log(`[${found}]: data: ${data}`);
			});
			resolve(port);
		} else {
			reject('Unable to locate PID ' + pid);
		}
	});
}




