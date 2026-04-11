import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static assets from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Specific routes for multi-page support
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'admin.html'));
});

// Fallback for SPA-like behavior: serve index.html for all other routes.
// In Express 5, the wildcard '*' requires a name or specific regex syntax.
app.get('/*path', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access index at http://localhost:${PORT}`);
    console.log(`Access admin at http://localhost:${PORT}/admin`);
});