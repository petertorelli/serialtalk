#!/usr/bin/env node

const serialport = require('serialport');
const sprintf = require('sprintf');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '',
});

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

if (argv.list) {
	getPortsP().then(ports => {
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
	}).catch(err => {
		console.error('Error: ' + err);
		process.exit(0);
	});
} else if (argv.pid) {
	getPortsP()
	.then(ports => connectPortP(ports, argv.pid, argv.baud))
	.then(port => {
		rl.on('line', (line) => {
			if (line === 'exit' || line === 'q') {
				port.close();
				process.exit(0);
			} else {
				port.write(line)
				if (argv.crlf) { 
					port.write('\r\n');
				}
			}
		});
	})
	.catch(err => { console.error('Error: ' + err) });
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

let port;

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
			port = new serialport(found, {
				baudRate: baud,
			    parser: serialport.parsers.readline('\r\n'),
			}).on('open', () => {
				console.log(`[${found}]: open`);
			}).on('data', data => {
				console.log(`[${found}]: data: ${data}`);
			}).on('error', err => {
				console.log(`[${found}]: error: ${err}`);
			}).on('disconnect', () => {
				console.log(`[${found}]: disconnect`);
			});
			resolve(port);
		} else {
			reject('Unable to locate PID ' + pid);
		}
	});
}



