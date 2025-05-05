const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const os = require('os');
const { log } = require('electron-builder');

let serverInstance = null;
let ioInstance = null;

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const ifaceConfigs of Object.values(interfaces)) {
        for (const config of ifaceConfigs) {
            if (config.family === 'IPv4' && !config.internal) {
                return "http://" + config.address + ":3000";
            }
        }
    }
    return "http://localhost:3000/";
}

function startServer() {
    if (serverInstance) {
        console.log("serveur start");
        return;
    }

    const app = express();
    const server = http.createServer(app);
    const io = socketio(server);

    // Sert les fichiers de l'interface
    app.use(express.static(__dirname + '/'));

    app.get('/mobile', (req, res) => {
        res.sendFile(__dirname + '/renderer/page-mobile.html');
    });

    const port = 3000;
    server.listen(port, '0.0.0.0', () => {
        console.log("Serveur web en ecoute sur " + getLocalIpAddress() + "/mobile");
    });

    serverInstance = server;
    ioInstance = io;
}

function stopServer() {
    if (serverInstance) {
        serverInstance.close(() => {
            console.log("Serveur stop");
        });
        serverInstance = null;
        ioInstance = null;
    }
}

module.exports = {
    startServer,
    stopServer,
    getLocalIpAddress,
    get io() {
        return ioInstance;
    }
};
