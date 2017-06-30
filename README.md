# About

A very simple way to interact with a serial device via text commands.

# Commands

~~~
Options:
  -c, --crlf  Send a CRLF with the line               [boolean] [default: false]
  -b, --baud  Connection Baud rate                   [number] [default: 3686400]
  -p, --pid   Connect to the first product ID found that matches        [string]
  -l, --list  List all callup devices and exit                         [boolean]
  -h, --help  Show help                                                [boolean]
~~~

To list all devices, use `--list`, like so:

~~~
% ./main.js --list
?                                       ?          ? /dev/cu.Bluetooth-Incoming-Port
STMicroelectronics                 0x0483     0x374b /dev/cu.usbmodem1423
~~~

The second column is the PID.

Connect to the PID like dis:

~~~
% ./main.js -b 9600 -p 0x374b
9600
[/dev/cu.usbmodem1423]: open

~~~

Word.

If your device expects a CRLF, use -c, because only the text up to the newline is sent to the port.

