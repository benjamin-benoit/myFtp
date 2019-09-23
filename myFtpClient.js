let net = require('net');
let fs = require('fs');

let HOST = '127.0.0.1';
let PORT = 21;

let client = new net.Socket();
let dataLink = new net.Socket();

let readLine = require('readLine');

let rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Please enter an IP adress for FTP server -->', (ip) => {
    HOST = ip;
rl.question('Please enter a PORT to enter for FTP server -->', (porto) => {
    if (porto.length > 0) PORT = porto;

client.connect(PORT, HOST, () => {
    console.log(`Connecting into : ${HOST}:${PORT}`);
});
});
});

lastCommand = "";

let selection = (next) => {
    rl.question('-->', (command) => {
        if (command.length == 0 || command.toLowerCase() == 'help') {
            console.log('\
            USER <username>: check if the user exist\n\
            PASS <password>: authenticate the user with a password\n\
            LIST: list the current directory of the server\n\
            CWD <directory>: change the current directory of the server\n\
            RETR <filename>: transfer a copy of the file FILE from the server to the client\n\
            STOR <filename>: transfer a copy of the file FILE from the client to the server\n\
            PWD: display the name of the current directory of the server\n\
            HELP: send helpful information to the client\n\
            QUIT: close the connection and stop the program\n\
            ');
            next(next);
        }
        else if (command.substr(0, 4) == 'STOR') {
            client.write(command + '\n');
            fs.readFile(command.substr(5), (err, data) => {
                if (err) console.log('Error while reading the file');
                else dataLink.end(data);
                next(next);
            });
        }
        else client.write(command + '\n');
        lastCommand = command;
    });
}

dataLink.on('data', (data) => {
    if (lastCommand.substr(0, 4) == 'LIST') console.log(data.toString());
    if (lastCommand.substr(0, 4) == 'RETR')
        fs.writeFile(lastCommand.substr(5), data, (err) => {
            if (err) console.log('Error while writing the file');
            else selection(selection);
        });
});

client.on('data', (data) => {
    data = data.toString();
    errRef = data.split(' ');

    console.log(data);

    if (errRef[0].substr(0, 3) == '220')
        rl.question('Please enter a username', (name) => {
            client.write(`USER ${name}\n`);
        });
    else if (errRef[0] == '331')
        rl.question('Please enter a password', (pass) => {
            client.write(`PASS ${pass}\n`);
        });
    else if (errRef[0] == '221')
        process.exit(0);
    else selection(selection)
});

client.on('close', () => {
    console.log('Closing connection');
    
})