#!/usr/bin/env node

'use strict';

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const sprintf = require('sprintf')
const readline = require('readline')

let PORT
let PARSER

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
		alias: 'path',
		type: 'string',
		describe: 'Connect to actual port device path',
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
	.argv


if (argv.list) {
	SerialPort.list()
	.then(ports => {
		console.log(sprintf('%-30s %10s %10s %s', 
			'manufacturer',
			'vendorId',
			'productId',
			'path'
		))
		ports.forEach(portObj => {
			if (portObj.manufacturer) {
				console.log(sprintf('%-30s %10s %10s %s', 
					portObj.manufacturer,
					portObj.vendorId,
					portObj.productId,
					portObj.path
				))
			} else {
				console.log(sprintf('%-30s %10s %10s %s', 
					'?', '?', '?', portObj.path
				))
			}
		})
	})
	.catch(err => {
		console.error(err)
	})
} else if (argv.path) {
	console.log('Opening port.')
	PORT = new SerialPort(argv.path, {
		baudRate: argv.baud,
	}, err => {
		if (err) {
			console.error('SerialPort Open Error:', err)
		} else {
			console.log('Port is open.')
		}
	})
	PORT.on('error', err => {
		console.error('SerialPort Error:', err)
	})
	PARSER = PORT.pipe(new Readline({ delimiter: '\r\n' }))
	PARSER.on('data', data => {
		console.log(data)
	})
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '',
})
.on('line', (line) => {
	if (line === 'exit' || line === 'q') {
		PORT.close();
		process.exit(0);
	} else {
		// TODO: Need a Tx delay per char for some devices (e.g., STLink)
		line = '' + line;
		for (let i = 0; i < line.length; ++i) {
			PORT.write(line[i], err => {
				if (err) {
					console.error(err)
				}
			});
		}
		if (argv.crlf) { 
			PORT.write('\r\n');
		}
	}
})
.on('SIGINT', () => {
	console.log('CTRL-C')
	if (PORT.isOpen) {
		console.log('Closing port.')
		PORT.close()
		process.exit()
	}
})

