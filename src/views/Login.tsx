import { useState, type FormEvent } from 'react';
import { isAuthConfigured, login } from '../auth/auth';

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (await login(user, password)) {
        onSuccess();
        return;
      }
      setError('Usuario o contraseña incorrectos.');
      setPassword('');
    } catch {
      setError('Este navegador no permite validar el acceso. Abre el panel por HTTPS o en localhost.');
    }
    setBusy(false);
  }

  return (
    <main className="login">
      <div className="login__card">
        <div className="login__art">
          <span className="login__glow" aria-hidden="true" />
          <img src="/img/portal-cat.webp" alt="El gato guía de CyberTura frente al portal" width={415} height={540} />
        </div>
        <form className="login__form" onSubmit={submit}>
          <img className="login__logo" src="/img/logo.webp" alt="CyberTura" width={640} height={177} />
          <h1>Centro de mando</h1>
          <p className="login__lead">Identifícate, guardián. El portal solo se abre para el equipo administrador.</p>

          {isAuthConfigured ? (
            <>
              <label className="field">
                <span>Usuario</span>
                <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" autoFocus required />
              </label>
              <label className="field">
                <span>Contraseña</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              {error && (
                <p className="login__error" role="alert">
                  ⚠️ {error}
                </p>
              )}
              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? 'ABRIENDO…' : '🌀 ABRIR EL PORTAL'}
              </button>
            </>
          ) : (
            <p className="login__error" role="alert">
              ⚠️ Falta configurar el acceso. Ejecuta <code>npm run setup</code> y reinicia el servidor.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
