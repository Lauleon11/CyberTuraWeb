import { useEffect, useState } from 'react';
import { hasSession, logout } from './auth/auth';
import { isFirebaseConfigured } from './data/firestore';
import { useGameData } from './data/useGameData';
import { Login } from './views/Login';
import { Heroes } from './views/Heroes';
import { Overview } from './views/Overview';
import { Survey } from './views/Survey';
import { Worlds } from './views/Worlds';

const TABS = [
  { id: 'mando', label: 'Centro de mando', emoji: '🛰️' },
  { id: 'mundos', label: 'Mundos', emoji: '🪐' },
  { id: 'heroes', label: 'Héroes', emoji: '🐾' },
  { id: 'encuesta', label: 'Encuesta', emoji: '⭐' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const tabFromHash = (): TabId => {
  const hash = window.location.hash.slice(1);
  return TABS.some((tab) => tab.id === hash) ? (hash as TabId) : 'mando';
};

export function App() {
  const [authenticated, setAuthenticated] = useState(hasSession);

  if (!authenticated) return <Login onSuccess={() => setAuthenticated(true)} />;
  return (
    <Dashboard
      onLogout={() => {
        logout();
        setAuthenticated(false);
      }}
    />
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<TabId>(tabFromHash);

  useEffect(() => {
    const onHashChange = () => {
      setTab(tabFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <img className="topbar__logo" src="/img/logo.webp" alt="CyberTura" width={640} height={177} />
        <nav className="tabs" aria-label="Secciones">
          {TABS.map(({ id, label, emoji }) => (
            <a key={id} className="tab" href={`#${id}`} aria-current={tab === id ? 'page' : undefined}>
              <span aria-hidden="true">{emoji}</span> {label}
            </a>
          ))}
        </nav>
        <button type="button" className="ghost-button" onClick={onLogout}>
          Salir
        </button>
      </header>
      <main className="content">
        {isFirebaseConfigured ? (
          <Content tab={tab} />
        ) : (
          <Notice title="Falta la conexión a Firebase" emoji="🔌">
            Ejecuta <code>npm run setup</code> en esta carpeta y reinicia el servidor.
          </Notice>
        )}
      </main>
    </div>
  );
}

function Content({ tab }: { tab: TabId }) {
  const { heroes, loading, error, live, updatedAt } = useGameData();

  return (
    <>
      <div className="statusbar">
        <span className="pill" data-state={live ? 'live' : 'waiting'}>
          <span className="pill__dot" aria-hidden="true" />
          {live ? 'En vivo' : 'Conectando…'}
        </span>
        <span className="pill">👁️ Solo lectura</span>
        {updatedAt && (
          <span className="statusbar__time">
            Actualizado a las {updatedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {error && (
        <Notice title="No pudimos leer los datos" emoji="⚠️">
          {error.message.toLowerCase().includes('permission')
            ? 'Firestore rechazó la lectura. Revisa las reglas de seguridad del proyecto.'
            : `Firestore respondió: ${error.message}`}
        </Notice>
      )}

      {loading ? (
        <div className="loader" role="status">
          <span className="loader__ring" aria-hidden="true" />
          Abriendo el portal…
        </div>
      ) : !error && heroes.length === 0 ? (
        <Notice title="Aún no hay héroes" emoji="🌀">
          Los datos aparecerán aquí en cuanto alguien cree su personaje en la app.
        </Notice>
      ) : (
        <>
          {tab === 'mando' && <Overview heroes={heroes} />}
          {tab === 'mundos' && <Worlds heroes={heroes} />}
          {tab === 'heroes' && <Heroes heroes={heroes} />}
          {tab === 'encuesta' && <Survey heroes={heroes} />}
        </>
      )}
    </>
  );
}

function Notice({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="panel notice">
      <span className="notice__emoji" aria-hidden="true">
        {emoji}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </section>
  );
}
