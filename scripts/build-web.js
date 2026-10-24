// Salin aset web ke www/ (tanpa bundler; modul ES dipakai langsung oleh WebView)
import { cpSync, rmSync, mkdirSync } from 'node:fs';
rmSync('www', { recursive: true, force: true }); mkdirSync('www', { recursive: true });
cpSync('index.html', 'www/index.html'); cpSync('src', 'www/src', { recursive: true });
console.log('www/ siap');
