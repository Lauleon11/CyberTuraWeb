// Genera .env.local: toma la conexión a Firebase de la app Android y crea el acceso del administrador.
//   npm run setup               pide usuario y contraseña
//   npm run setup -- --generate usuario "admin" y contraseña aleatoria, anotada en .env.local
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const servicesPath = resolve(root, '../CyberTuraApp/app/google-services.json');
const envPath = resolve(root, '.env.local');
const ITERATIONS = 210_000; // Debe coincidir con src/auth/auth.ts

if (!existsSync(servicesPath)) {
  console.error(`No se encontró ${servicesPath}`);
  process.exit(1);
}

const services = JSON.parse(readFileSync(servicesPath, 'utf8'));
const client = services.client[0];

let user = 'admin';
let password = '';
const generate = process.argv.includes('--generate') || !process.stdin.isTTY;

if (!generate) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  user = (await rl.question('Usuario administrador [admin]: ')).trim() || 'admin';
  password = await rl.question('Contraseña (vacía = generar una aleatoria): ');
  rl.close();
}

const generated = !password;
if (generated) password = randomBytes(12).toString('base64url');

const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256').toString('hex');

const lines = [
  '# Archivo generado por "npm run setup". No se sube a git.',
  ...(generated ? [`# Contraseña generada para "${user}": ${password}`, ''] : ['']),
  `VITE_FIREBASE_API_KEY=${client.api_key[0].current_key}`,
  `VITE_FIREBASE_PROJECT_ID=${services.project_info.project_id}`,
  `VITE_FIREBASE_APP_ID=${client.client_info.mobilesdk_app_id}`,
  `VITE_FIREBASE_SENDER_ID=${services.project_info.project_number}`,
  `VITE_FIREBASE_STORAGE_BUCKET=${services.project_info.storage_bucket}`,
  '',
  `VITE_ADMIN_USER=${user}`,
  `VITE_ADMIN_SALT=${salt}`,
  `VITE_ADMIN_HASH=${hash}`,
  '',
];
writeFileSync(envPath, lines.join('\n'));

console.log(
  generated
    ? `.env.local listo. Usuario: ${user}. La contraseña generada está en la primera línea comentada de .env.local.`
    : `.env.local listo. Usuario: ${user}.`,
);
