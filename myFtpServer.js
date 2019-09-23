var net = require('net');
var HOST = '127.0.0.1';
var PORT = 21000;
var messages; 
var fs = require('fs');
var path = require('path');

dir = path.join(process.cwd());

net.createServer(function (sock) {
    sock.passive = false;
    sock.reply = function (status, message, callback) {
        if (!message) message = messages[status.toString()] || 'No information'
        if (this.writable) {
            this.write(status.toString() + ' ' + message.toString() + '\r\n', callback)
        }
    }

    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    sock.on('connect', function () {
        sock.reply(220);
    });

    sock.on('data', function (chunk) {
        var parts = trim(chunk.toString()).split(" "),
            command = trim(parts[0]).toUpperCase(),
            args = parts.slice(1, parts.length),
            callable = commands[command]
            console.log(command);
        if (!callable) {
            sock.reply(502,command)
        } else {
            callable.apply(sock, args)
        }
    });

    sock.dataTransfer = function (handle) {
        function finish(dataSocket) {
            return function (err) {
                if (err) {
                    dataSocket.emit('error', err)
                } else {
                    dataSocket.end()
                }
            }
        }

        function execute() {
            sock.reply(150)
            handle.call(sock, this, finish(this))
        }
        // Will be unqueued in PASV command
        if (sock.passive) {
            sock.dataTransfer.queue.push(execute)
        }
        // Or we initialize directly the connection to the client
        else {
            dataSocket = net.createConnection(sock.dataInfo.port, sock.dataInfo.address)
            dataSocket.on('connect', execute)
        }
    }
    sock.dataTransfer.prepare = false
    sock.dataTransfer.queue = []
    sock.dataTransfer.squeue = []
}).listen(PORT, HOST);

console.log('cnx\'s FTP Server listening on ' + HOST + ':' + PORT);
console.log('FTP dir is ' + dir);