import { badgeImage, characterImage, COSTUMES, WORLDS, worldImage } from '../domain/catalog';
import { formatDecimal, squad, summarize, summarizeWorlds, type Hero } from '../domain/stats';
import { Avatar, BarRow, Panel, StatTile } from '../ui/components';

const MEDALS = ['🥇', '🥈', '🥉'];

export function Overview({ heroes }: { heroes: Hero[] }) {
  const overview = summarize(heroes);
  const worlds = summarizeWorlds(heroes);
  const team = squad(heroes);
  const percent = Math.round(overview.liberation * 100);
  const battles = heroes.length * WORLDS.length;
  const podium = heroes.filter((hero) => hero.score > 0).slice(0, 3);

  return (
    <div className="stack">
      <section className="hero-banner">
        <div className="hero-banner__body">
          <p className="eyebrow">Misión global</p>
          <h1>Liberación del multiverso</h1>
          <div className="hero-banner__figure">{percent}%</div>
          <div className="xp" role="img" aria-label={`${overview.badges} de ${battles} batallas ganadas`}>
            <span className="xp__fill" style={{ width: `${percent}%` }} />
          </div>
          <p className="hero-banner__caption">
            {overview.badges} de {battles} batallas ganadas entre {overview.heroes} {overview.heroes === 1 ? 'héroe' : 'héroes'}
          </p>
        </div>
        <img className="hero-banner__cat" src="/img/cat.webp" alt="" width={240} height={240} />
      </section>

      <div className="stats-grid">
        <StatTile
          emoji="🐾"
          label="Héroes creados"
          value={String(overview.heroes)}
          detail={`${overview.active} con avance en el juego`}
        />
        <StatTile
          emoji="⭐"
          label="Puntos acumulados"
          value={overview.totalScore.toLocaleString('es-CO')}
          detail={`${formatDecimal(overview.avgScore, 0)} por héroe en promedio`}
        />
        <StatTile
          emoji="🏅"
          label="Insignias ganadas"
          value={String(overview.badges)}
          detail={`${overview.legends} ${overview.legends === 1 ? 'héroe completó' : 'héroes completaron'} los 5 mundos`}
        />
        <StatTile
          emoji="💜"
          label="Satisfacción"
          value={overview.satisfaction === null ? '—' : `${formatDecimal(overview.satisfaction)} / 5`}
          detail={`${overview.surveys} ${overview.surveys === 1 ? 'encuesta respondida' : 'encuestas respondidas'}`}
        />
      </div>

      <Panel title="Batalla contra los enemigos" subtitle="La salud baja con cada héroe que vence al enemigo del mundo.">
        <div className="boss-grid">
          {WORLDS.map((world, index) => {
            const summary = worlds[index];
            const untouched = summary.defeated === 0;
            return (
              <article key={world.id} className="boss" data-defeated={summary.enemyHp === 0 || undefined}>
                <div className="boss__image">
                  <img src={worldImage(world.id)} alt="" width={360} height={360} loading="lazy" />
                  <span className="boss__number">{world.id}</span>
                </div>
                <h3>
                  <span aria-hidden="true">{world.enemyEmoji}</span> {world.enemy}
                </h3>
                <p className="boss__risk">{world.risk}</p>
                <div
                  className="hp"
                  role="img"
                  aria-label={`Salud del enemigo: ${summary.enemyHp}%`}
                  data-tip={`${summary.reached} héroes llegaron y ${summary.defeated} lo vencieron`}
                  tabIndex={0}
                >
                  <span className="hp__fill" style={{ width: `${summary.enemyHp}%` }} />
                </div>
                <p className="boss__hp">
                  <strong>{summary.enemyHp}%</strong> de salud
                </p>
                <p className="boss__detail">
                  {untouched ? 'Nadie lo ha vencido' : `Vencido por ${summary.defeated} de ${heroes.length}`}
                </p>
              </article>
            );
          })}
        </div>
      </Panel>

      <div className="two-columns">
        <Panel title="Podio de héroes" subtitle="Los puntajes más altos de la aventura.">
          {podium.length === 0 ? (
            <p className="empty">Todavía nadie ha sumado puntos.</p>
          ) : (
            <ol className="podium">
              {podium.map((hero, index) => (
                <li key={hero.id} className={`podium__place podium__place--${index + 1}`}>
                  <span className="podium__medal" aria-hidden="true">
                    {MEDALS[index]}
                  </span>
                  <Avatar hero={hero} size={index === 0 ? 96 : 76} />
                  <strong className="podium__name">{hero.nickname}</strong>
                  <span className="podium__score">{hero.score.toLocaleString('es-CO')} pts</span>
                  <span className="podium__rank">
                    {hero.rank.emoji} {hero.rank.name}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Salón de las Insignias" subtitle="Cuántos héroes ganaron cada insignia.">
          <ul className="badge-grid">
            {WORLDS.map((world, index) => {
              const earned = worlds[index].defeated;
              return (
                <li key={world.id} className="badge" data-locked={earned === 0 || undefined}>
                  <img src={badgeImage(world.id)} alt="" width={72} height={72} loading="lazy" />
                  <span className="badge__name">{world.badge}</span>
                  <span className="badge__count">{earned === 0 ? '🔒 Sin ganar' : `× ${earned}`}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="El escuadrón" subtitle="Quiénes están jugando, según su perfil en la app.">
        <div className="squad">
          <div>
            <h3>Edades</h3>
            {team.ages.map((age) => (
              <BarRow
                key={age.key}
                label={age.label}
                value={String(age.count)}
                fraction={age.count / Math.max(...team.ages.map((item) => item.count))}
                tip={`${age.label}: ${age.count} ${age.count === 1 ? 'héroe' : 'héroes'}`}
              />
            ))}
            <p className="squad__note">Promedio: {formatDecimal(team.avgAge)} años</p>
          </div>

          <div>
            <h3>Género</h3>
            <GenderBar genders={team.genders} />
          </div>

          <div>
            <h3>Traje elegido</h3>
            <ul className="costumes">
              {team.costumes.map((costume) => (
                <li key={costume.key}>
                  <img src={characterImage(costume.key, 'HOMBRE')} alt="" loading="lazy" />
                  <strong>{costume.count}</strong>
                  <span>{COSTUMES[costume.key].name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function GenderBar({ genders }: { genders: ReturnType<typeof squad>['genders'] }) {
  const total = genders.reduce((sum, gender) => sum + gender.count, 0);
  const share = (count: number) => (total ? Math.round((count / total) * 100) : 0);
  return (
    <>
      <div className="segmented" role="img" aria-label={genders.map((g) => `${g.label}: ${g.count}`).join(', ')}>
        {genders
          .filter((gender) => gender.count > 0)
          .map((gender) => (
            <span
              key={gender.key}
              className={`segmented__part segmented__part--${gender.key.toLowerCase()}`}
              style={{ flexGrow: gender.count }}
              data-tip={`${gender.label}: ${gender.count} (${share(gender.count)}%)`}
              tabIndex={0}
            >
              {share(gender.count)}%
            </span>
          ))}
      </div>
      <ul className="legend">
        {genders.map((gender) => (
          <li key={gender.key}>
            <span className={`legend__key segmented__part--${gender.key.toLowerCase()}`} aria-hidden="true" />
            {gender.label}: {gender.count}
          </li>
        ))}
      </ul>
    </>
  );
}
