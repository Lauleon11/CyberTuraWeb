import { badgeImage, WORLDS, worldImage } from '../domain/catalog';
import { formatDecimal, formatDuration, summarizeWorlds, type Hero } from '../domain/stats';
import { BarRow, Panel } from '../ui/components';

export function Worlds({ heroes }: { heroes: Hero[] }) {
  const worlds = summarizeWorlds(heroes);
  const total = heroes.length;

  return (
    <div className="stack">
      <Panel title="El camino de los portales" subtitle={`Cuántos de los ${total} héroes abrieron y conquistaron cada mundo.`}>
        <div className="journey">
          <div>
            <h3>🌀 Portal abierto</h3>
            {WORLDS.map((world, index) => (
              <BarRow
                key={world.id}
                label={`${world.id}. ${world.shortName}`}
                value={String(worlds[index].reached)}
                fraction={total ? worlds[index].reached / total : 0}
                tone="violet"
                tip={`${world.name}: ${worlds[index].reached} de ${total} héroes abrieron el portal`}
              />
            ))}
          </div>
          <div>
            <h3>🏆 Mundo completado</h3>
            {WORLDS.map((world, index) => (
              <BarRow
                key={world.id}
                label={`${world.id}. ${world.shortName}`}
                value={String(worlds[index].defeated)}
                fraction={total ? worlds[index].defeated / total : 0}
                tip={`${world.name}: ${worlds[index].defeated} de ${total} héroes lo completaron`}
              />
            ))}
          </div>
        </div>
      </Panel>

      {WORLDS.map((world, index) => {
        const summary = worlds[index];
        const hasPlays = summary.activities.some((activity) => activity.plays > 0);
        return (
          <section key={world.id} className="panel world" data-locked={summary.reached === 0 || undefined}>
            <div className="world__art">
              <img src={worldImage(world.id)} alt="" width={360} height={360} loading="lazy" />
            </div>
            <div className="world__body">
              <p className="eyebrow">
                Mundo {world.id} · {world.riskEmoji} {world.risk}
              </p>
              <h2>{world.name}</h2>
              <ul className="world__facts">
                <li>
                  <span aria-hidden="true">{world.enemyEmoji}</span> {world.enemy}
                </li>
                <li>
                  <img src={badgeImage(world.id)} alt="" width={24} height={24} /> {world.badge}
                </li>
                <li>
                  🏆 {summary.defeated} de {total} héroes
                </li>
              </ul>

              {hasPlays ? (
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Actividad</th>
                        <th scope="col" className="num">
                          Registros
                        </th>
                        <th scope="col" className="num">
                          Tiempo promedio
                        </th>
                        <th scope="col" className="num">
                          Errores / movimientos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.activities.map(({ activity, plays, avgTime, avgMistakes }) => (
                        <tr key={activity.code} data-empty={plays === 0 || undefined}>
                          <th scope="row">
                            <span aria-hidden="true">{activity.emoji}</span> {activity.name}
                          </th>
                          <td className="num">{plays}</td>
                          <td className="num">{formatDuration(avgTime)}</td>
                          <td className="num">
                            {avgMistakes === null
                              ? '—'
                              : `${formatDecimal(avgMistakes)} ${activity.kind === 'moves' ? 'mov.' : 'err.'}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty">Todavía no hay actividades registradas en este mundo.</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
