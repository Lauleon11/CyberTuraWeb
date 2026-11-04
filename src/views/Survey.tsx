import { formatDecimal, summarize, summarizeSurvey, type Hero } from '../domain/stats';
import { Avatar, BarRow, Panel, Stars } from '../ui/components';

const SMALL_SAMPLE = 5;

export function Survey({ heroes }: { heroes: Hero[] }) {
  const survey = summarizeSurvey(heroes);
  const { satisfaction } = summarize(heroes);

  if (survey.responses === 0) {
    return (
      <Panel title="Encuesta final">
        <p className="empty">Aún no hay encuestas. Se responden al terminar la aventura.</p>
      </Panel>
    );
  }

  return (
    <div className="stack">
      <section className="hero-banner hero-banner--survey">
        <div className="hero-banner__body">
          <p className="eyebrow">Encuesta final</p>
          <h1>¿Qué opinan los héroes?</h1>
          <div className="hero-banner__figure">
            {formatDecimal(satisfaction)}
            <small> / 5</small>
          </div>
          {satisfaction !== null && <Stars value={satisfaction} />}
          <p className="hero-banner__caption">
            Promedio de las 10 preguntas · {survey.responses}{' '}
            {survey.responses === 1 ? 'respuesta' : 'respuestas'}
          </p>
        </div>
        <img className="hero-banner__cat" src="/img/cat.webp" alt="" width={240} height={240} />
      </section>

      <p className="sample-note">
        ℹ️ {survey.responses < SMALL_SAMPLE &&
          `Muestra pequeña: con ${survey.responses} ${survey.responses === 1 ? 'respuesta' : 'respuestas'} estos promedios son solo una referencia. `}
        En la app cada pregunta inicia con 5 estrellas marcadas, así que una pregunta sin cambiar cuenta como 5.
      </p>

      <Panel title="Pregunta por pregunta" subtitle="Promedio en la escala de 1 a 5 estrellas.">
        <div className="questions">
          {survey.questions.map((question) => (
            <BarRow
              key={question.index}
              label={
                <>
                  <span className="questions__index">{question.index + 1}.</span> {question.question}
                </>
              }
              value={formatDecimal(question.average)}
              fraction={question.average === null ? 0 : question.average / 5}
              tone="gold"
              tip={`${formatDecimal(question.average)} de 5 con ${question.responses} ${question.responses === 1 ? 'respuesta' : 'respuestas'}`}
            />
          ))}
        </div>
      </Panel>

      <Panel title="Mensajes de los héroes" subtitle="¿Qué fue lo que más te gustó o qué sugerencia nos darías?">
        {survey.comments.length === 0 ? (
          <p className="empty">Nadie ha dejado comentarios todavía.</p>
        ) : (
          <ul className="comments">
            {survey.comments.map(({ hero, comment, timestamp }) => (
              <li key={hero.id} className="comment">
                <Avatar hero={hero} size={48} />
                <div>
                  <blockquote className="quote">{comment}</blockquote>
                  <p className="comment__by">
                    {hero.nickname}
                    {timestamp && ` · ${new Date(timestamp).toLocaleDateString('es-CO')}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
