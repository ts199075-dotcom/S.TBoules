import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApiApp } from './app';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');
const port = Number(process.env.PORT || 4000);

const app = createApiApp();
const dist = path.join(root, 'dist');

if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Saint Paul school API listening on http://localhost:${port}`);
});
