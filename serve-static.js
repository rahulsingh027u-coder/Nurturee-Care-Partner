const http = require('http');
const fs = require('fs');
const path = require('path');

const STATIC_DIR = path.join(__dirname, 'static-site');
const PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(STATIC_DIR, urlPath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html for any unknown route
      fs.readFile(path.join(STATIC_DIR, 'index.html'), (err2, html) => {
        if (err2) {
          res.writeHead(500);
          res.end('Error');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Static server: http://127.0.0.1:${PORT}`);
});
