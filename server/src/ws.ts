import { WebSocketServer } from 'ws';
import { Server } from 'http';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const historyFile = path.join(__dirname, '../history.json');
const uploads = path.join(__dirname, '../uploads');

let history: any[] = fs.existsSync(historyFile) ? fs.readJsonSync(historyFile) : [];

export function setupWS(server: Server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', ws => {
        ws.send(JSON.stringify({ history }));

        ws.on('message', data => {
            const msg = JSON.parse(data.toString());
            if (msg.clear) {
                history = [];
                fs.writeJsonSync(historyFile, history);

                fs.rmSync(uploads, { recursive: true, force: true });
                fs.mkdirSync(uploads);
            }
            else if (msg.delete) {
                const removed = history.find(m => m.id === msg.delete);

                history = history.filter(m => m.id !== msg.delete);
                fs.writeJsonSync(historyFile, history);

                if (removed?.file) {
                    const file = path.join(uploads, removed.file);
                    fs.rmSync(file, { force: true });
                }
            }
            else {
                history.push(msg);
                fs.writeJsonSync(historyFile, history);
            }

            wss.clients.forEach(c => c.send(JSON.stringify(msg)));
        });
    });
}