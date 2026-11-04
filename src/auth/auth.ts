/**
 * Acceso sencillo del administrador: oculta el panel, pero NO protege los datos en Firestore.
 * Se valida en el navegador porque el proyecto de Firebase no tiene Authentication habilitado.
 * La protección real se logra con Firebase Auth y reglas de lectura (ver README).
 */
const ITERATIONS = 210_000; // Debe coincidir con scripts/setup-env.mjs
const SESSION_KEY = 'cybertura.admin.session';

const expectedUser = import.meta.env.VITE_ADMIN_USER as string | undefined;
const salt = import.meta.env.VITE_ADMIN_SALT as string | undefined;
const expectedHash = import.meta.env.VITE_ADMIN_HASH as string | undefined;

export const isAuthConfigured = Boolean(expectedUser && salt && expectedHash);

async function derive(password: string, saltValue: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(saltValue), iterations: ITERATIONS },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function login(user: string, password: string): Promise<boolean> {
  if (!isAuthConfigured) return false;
  const hash = await derive(password, salt!);
  const ok = user.trim() === expectedUser && hash === expectedHash;
  if (ok) writeSession(true);
  return ok;
}

export function logout(): void {
  writeSession(false);
}

/** La sesión dura lo que la pestaña. */
export function hasSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSession(active: boolean): void {
  try {
    if (active) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Sin almacenamiento la sesión simplemente no sobrevive a recargar.
  }
}
