const http = require('http');
const { execSync } = require('child_process');

// Find the actual Next.js server handler
let handler;
try {
  // Try loading the standalone server
  const serverModule = require('/home/z/my-project/.next/standalone/server.js');
  handler = serverModule;
} catch(e) {
  console.log('Failed to load standalone server:', e.message);
}

// If handler didn't work, try a simple HTTP server to test port binding
if (!handler) {
  const srv = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Server Alive</h1></body></html>');
  });
  srv.listen(3000, '0.0.0.0', () => {
    console.log('Minimal server listening on port 3000');
  });
}
