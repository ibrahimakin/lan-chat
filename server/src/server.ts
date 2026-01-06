import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import os from 'os';
import { fileURLToPath } from 'url';
import { setupWS } from './ws.js';
import { setupFileRoutes } from './files.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../../public')));

setupFileRoutes(app);

const server = http.createServer(app);
setupWS(server);

const port = 3001;
server.listen(port, '0.0.0.0', () => {
    const nets = os.networkInterfaces();
    let ip = 'localhost';
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                ip = net.address;
            }
        }
    }
    console.log(`LAN Chat running at: http://${ip}:${port}`);
});