import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVITIES, badgeImage, COSTUMES, QUESTIONS, WORLDS } from '../domain/catalog';
import { activityMetrics, formatDecimal, formatDuration, type Hero } from '../domain/stats';
import { Avatar, Panel, Stars, WorldPips } from '../ui/components';

type Filter = 'all' | 'active' | 'finished' | 'rated';

const FILTERS: Record<Filter, { label: string; match: (hero: Hero) => boolean }> = {
  all: { label: 'Todos', match: () => true },
  active: { label: 'Con avance', match: (hero) => hero.score > 0 || hero.completed > 0 },
  finished: { label: 'Aventura completa', match: (hero) => hero.completed === WORLDS.length },
  rated: { label: 'Respondieron la encuesta', match: (hero) => hero.survey !== null },
};

export function Heroes({ heroes }: { heroes: Hero[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es');
    return heroes.filter(
      (hero) => FILTERS[filter].match(hero) && hero.nickname.toLocaleLowerCase('es').includes(needle),
    );
  }, [heroes, query, filter]);

  // Se busca por id para que el perfil abierto siga los datos en vivo.
  const selected = heroes.find((hero) => hero.id === selectedId) ?? null;

  return (
    <div className="stack">
      <Panel title="Registro de héroes" subtitle="Ordenados por puntaje. Elige un héroe para ver su expediente.">
        <div className="filters">
          <label className="field field--inline">
            <span>Buscar alias</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label className="field field--inline">
            <span>Mostrar</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
              {Object.entries(FILTERS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <span className="filters__count">
            {visible.length} de {heroes.length}
          </span>
        </div>

        {visible.length === 0 ? (
          <p className="empty">Ningún héroe coincide con esa búsqueda.</p>
        ) : (
          <ul className="hero-list">
            {visible.map((hero) => (
              <li key={hero.id}>
                <button type="button" className="hero-row" onClick={() => setSelectedId(hero.id)}>
                  <Avatar hero={hero} size={52} />
                  <span className="hero-row__who">
                    <strong>{hero.nickname}</strong>
                    <small>
                      {hero.rank.emoji} {hero.rank.name}
                      {hero.age !== null && ` · ${hero.age} años`}
                    </small>
                  </span>
                  <span className="hero-row__stage">{hero.stage}</span>
                  <WorldPips hero={hero} />
                  <span className="hero-row__score">
                    <strong>{hero.score.toLocaleString('es-CO')}</strong> pts
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {selected && <HeroDialog hero={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function HeroDialog({ hero, onClose }: { hero: Hero; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const played = WORLDS.map((world) => ({
    world,
    records: ACTIVITIES.map((activity) => ({ activity, ...activityMetrics(hero, world.id, activity) })).filter(
      (record) => record.time !== null,
    ),
  })).filter((entry) => entry.records.length > 0);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="hero-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
    >
      <div className="dialog__inner">
        <header className="dialog__head">
          <Avatar hero={hero} size={88} />
          <div>
            <p className="eyebrow">
              {hero.rank.emoji} {hero.rank.name}
            </p>
            <h2 id="hero-dialog-title">{hero.nickname}</h2>
            <p className="dialog__meta">
              {[
                hero.age !== null ? `${hero.age} años` : null,
                hero.gender === 'MUJER' ? 'Mujer' : hero.gender === 'HOMBRE' ? 'Hombre' : null,
                `Traje ${COSTUMES[hero.costumeId]?.name ?? hero.costumeId}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <button type="button" className="ghost-button dialog__close" onClick={() => ref.current?.close()}>
            Cerrar
          </button>
        </header>

        <div className="dialog__stats">
          <div>
            <strong>{hero.score.toLocaleString('es-CO')}</strong>
            <span>puntos</span>
          </div>
          <div>
            <strong>{hero.completed} / 5</strong>
            <span>mundos</span>
          </div>
          <div>
            <strong>{hero.gamesPlayed}</strong>
            <span>{hero.gamesPlayed === 1 ? 'partida' : 'partidas'}</span>
          </div>
        </div>
        <p className="dialog__stage">📍 {hero.stage}</p>

        <h3>Insignias</h3>
        <ul className="mini-badges">
          {WORLDS.map((world, index) => {
            const status = hero.worlds[index];
            const earned = status.status === 'COMPLETED';
            return (
              <li key={world.id} data-locked={!earned || undefined}>
                <img src={badgeImage(world.id)} alt="" width={56} height={56} />
                <span>{world.badge}</span>
                {earned && status.completedAt && (
                  <small>{new Date(status.completedAt).toLocaleDateString('es-CO')}</small>
                )}
                {!earned && <small>🔒</small>}
              </li>
            );
          })}
        </ul>

        <h3>Desempeño registrado</h3>
        {played.length === 0 ? (
          <p className="empty">La app aún no registra actividades de este héroe.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Actividad</th>
                  <th scope="col" className="num">
                    Tiempo
                  </th>
                  <th scope="col" className="num">
                    Errores / mov.
                  </th>
                  <th scope="col" className="num">
                    Intentos
                  </th>
                </tr>
              </thead>
              <tbody>
                {played.flatMap(({ world, records }) => [
                  <tr key={world.id} className="table__group">
                    <th colSpan={4} scope="colgroup">
                      Mundo {world.id}: {world.risk}
                    </th>
                  </tr>,
                  ...records.map(({ activity, time, mistakes, attempts }) => (
                    <tr key={`${world.id}${activity.code}`}>
                      <th scope="row">
                        <span aria-hidden="true">{activity.emoji}</span> {activity.name}
                      </th>
                      <td className="num">{formatDuration(time)}</td>
                      <td className="num">{mistakes}</td>
                      <td className="num">{attempts ?? '—'}</td>
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
        )}

        <h3>Encuesta</h3>
        {hero.survey ? (
          <>
            <p className="dialog__survey">
              {hero.survey.average !== null && <Stars value={hero.survey.average} />}
              <strong>{formatDecimal(hero.survey.average)} / 5</strong>
            </p>
            {hero.survey.comment && <blockquote className="quote">{hero.survey.comment}</blockquote>}
            <details className="answers">
              <summary>Ver las 10 respuestas</summary>
              <ol>
                {QUESTIONS.map((question, index) => (
                  <li key={question}>
                    <span>{question}</span>
                    <strong>{hero.survey!.answers[index] ?? '—'}</strong>
                  </li>
                ))}
              </ol>
            </details>
          </>
        ) : (
          <p className="empty">Aún no responde la encuesta.</p>
        )}

        <p className="dialog__id">ID anónimo: {hero.id}</p>
      </div>
    </dialog>
  );
}
