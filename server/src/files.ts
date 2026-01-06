import { Express } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploads = path.join(__dirname, '../uploads');

fs.mkdirSync(uploads, { recursive: true });

const upload = multer({ dest: uploads });

export function setupFileRoutes(app: Express) {
    app.post('/upload', upload.single('file'), (req, res) => {
        const file = req.file!;
        const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
        res.json({ file: file.filename, name });
    });

    app.get('/download/:file/:name', (req, res) => {
        const file = path.join(uploads, req.params.file);
        const name = Buffer.from(req.params.name, 'latin1').toString('utf8');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
        res.sendFile(file);
    });
}