const http = require('node:http');
const { parse } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

const rootDir = __dirname;
const defaultFile = 'index.html';
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

function sendResponse(res, status, headers, body) {
    res.writeHead(status, headers);
    if (typeof body === 'undefined') {
        res.end();
        return;
    }
    res.end(body);
}

function sanitizePath(requestPath) {
    const normalized = path.normalize(requestPath).replace(/^\/+/, '');
    return path.join(rootDir, normalized);
}

function ensureInsideRoot(targetPath) {
    const normalizedRoot = path.normalize(rootDir);
    const normalizedTarget = path.normalize(targetPath);
    return normalizedTarget.startsWith(normalizedRoot);
}

function handleStatic(req, res, pathname) {
    let requestedPath = pathname;
    if (requestedPath === '/' || requestedPath === '') {
        requestedPath = '/' + defaultFile;
    }
    const absolutePath = sanitizePath(requestedPath);
    if (!ensureInsideRoot(absolutePath)) {
        const body = req.method === 'HEAD' ? undefined : 'Forbidden';
        sendResponse(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, body);
        return;
    }

    fs.stat(absolutePath, (err, stats) => {
        if (err) {
            const body = req.method === 'HEAD' ? undefined : 'Not found';
            sendResponse(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, body);
            return;
        }

        if (stats.isDirectory()) {
            handleStatic(req, res, path.join(pathname, defaultFile));
            return;
        }

        const ext = path.extname(absolutePath).toLowerCase();
        const type = mimeTypes[ext] || 'application/octet-stream';
        const headers = {
            'Content-Type': type,
            'Content-Length': stats.size
        };

        res.writeHead(200, headers);
        if (req.method === 'HEAD') {
            res.end();
            return;
        }

        const stream = fs.createReadStream(absolutePath);
        stream.pipe(res);
        stream.on('error', () => {
            if (!res.headersSent) {
                const body = req.method === 'HEAD' ? undefined : 'Internal error';
                sendResponse(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, body);
            } else {
                res.destroy();
            }
        });
    });
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.setEncoding('utf8');
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 10 * 1024 * 1024) {
                reject(new Error('Payload demasiado grande'));
                req.destroy();
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

function ensureDirectory(targetDir) {
    return fs.promises.mkdir(targetDir, { recursive: true });
}

async function handlePixelArt(req, res) {
    try {
        const payload = await parseBody(req);
        const { directory, filename, imageBase64 } = payload || {};
        if (!directory || !filename || !imageBase64) {
            sendResponse(res, 400, { 'Content-Type': 'application/json' }, JSON.stringify({ error: 'Datos incompletos' }));
            return;
        }

        const relativeDirectory = directory.replace(/\\/g, '/');
        const targetDirectory = sanitizePath(relativeDirectory);
        const targetFile = path.join(targetDirectory, filename);

        if (!ensureInsideRoot(targetFile)) {
            sendResponse(res, 400, { 'Content-Type': 'application/json' }, JSON.stringify({ error: 'Ruta inválida' }));
            return;
        }

        const cleanedBase64 = imageBase64.replace(/^data:[^,]+,/, '');
        const buffer = Buffer.from(cleanedBase64, 'base64');
        await ensureDirectory(targetDirectory);
        await fs.promises.writeFile(targetFile, buffer);

        sendResponse(res, 200, { 'Content-Type': 'application/json' }, JSON.stringify({ ok: true }));
    } catch (error) {
        console.error('Error guardando pixel art:', error);
        sendResponse(res, 500, { 'Content-Type': 'application/json' }, JSON.stringify({ error: 'Error interno' }));
    }
}

const server = http.createServer((req, res) => {
    const parsed = parse(req.url || '/');
    const pathname = parsed.pathname || '/';

    if (req.method === 'POST' && pathname === '/api/pixel-art') {
        handlePixelArt(req, res);
        return;
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
        handleStatic(req, res, pathname);
        return;
    }

    sendResponse(res, 405, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Method not allowed');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor disponible en http://localhost:${PORT}`);
});

