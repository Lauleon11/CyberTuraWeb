/** Cálculos puros sobre los documentos de Firestore. */
import { ACTIVITIES, COSTUMES, QUESTIONS, RANKS, STAGES, WORLDS, type Activity } from './catalog';

export interface RawDoc {
  id: string;
  path: string;
  data: Record<string, unknown>;
}

export type WorldStatus = 'LOCKED' | 'UNLOCKED' | 'COMPLETED';

export interface HeroWorld {
  id: number;
  status: WorldStatus;
  screen: string | null;
  completedAt: number | null;
}

export interface SurveyResponse {
  timestamp: number | null;
  average: number | null;
  /** Índice 0 = pregunta 1. null si no se respondió. */
  answers: (number | null)[];
  comment: string;
}

export interface Hero {
  id: string;
  nickname: string;
  age: number | null;
  costumeId: string;
  gender: string;
  score: number;
  gamesPlayed: number;
  worlds: HeroWorld[];
  completed: number;
  rank: (typeof RANKS)[number];
  /** Punto actual del recorrido, p. ej. "Mundo 2 · Ahorcado". */
  stage: string;
  survey: SurveyResponse | null;
  raw: Record<string, unknown>;
}

const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const optionalNum = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
const text = (value: unknown): string => (typeof value === 'string' ? value : '');

export function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

/** Promedio real de las respuestas: averageStars en Firestore está truncado a entero. */
export function parseSurvey(data: Record<string, unknown>): SurveyResponse {
  const map = (data.questionAnswers ?? {}) as Record<string, unknown>;
  const answers = QUESTIONS.map((_, index) => optionalNum(map[`question_${index + 1}`]));
  const given = answers.filter((answer): answer is number => answer !== null);
  return {
    timestamp: optionalNum(data.timestamp),
    average: average(given),
    answers,
    comment: text(data.openComment).trim(),
  };
}

function parseWorlds(docs: RawDoc[]): HeroWorld[] {
  return WORLDS.map((world) => {
    const doc = docs.find((candidate) => candidate.id === String(world.id));
    const stored = text(doc?.data.status);
    // Misma regla de WorldRepositoryImpl: sin documento, el mundo 1 está abierto y el resto bloqueado.
    const status: WorldStatus =
      stored === 'COMPLETED' || stored === 'UNLOCKED' ? stored : world.id === 1 ? 'UNLOCKED' : 'LOCKED';
    return {
      id: world.id,
      status,
      screen: text(doc?.data.currentScreen) || null,
      completedAt: optionalNum(doc?.data.completedAt),
    };
  });
}

function describeStage(worlds: HeroWorld[]): string {
  const current = worlds.find((world) => world.status === 'UNLOCKED');
  if (!current) return worlds.every((world) => world.status === 'COMPLETED') ? 'Aventura completa' : 'Sin iniciar';
  const stage = current.screen ? STAGES[current.screen] ?? current.screen : 'Sin iniciar';
  return `Mundo ${current.id} · ${stage}`;
}

export function buildHeroes(players: RawDoc[], worldDocs: RawDoc[], surveyDocs: RawDoc[]): Hero[] {
  const worldsByPlayer = new Map<string, RawDoc[]>();
  for (const doc of worldDocs) {
    const segments = doc.path.split('/'); // players/{id}/worlds/{n}
    if (segments[0] !== 'players' || segments.length !== 4) continue;
    worldsByPlayer.set(segments[1], [...(worldsByPlayer.get(segments[1]) ?? []), doc]);
  }
  const surveys = new Map(surveyDocs.map((doc) => [doc.id, parseSurvey(doc.data)]));

  return players
    .map((player): Hero => {
      const data = player.data;
      const worlds = parseWorlds(worldsByPlayer.get(player.id) ?? []);
      const completed = worlds.filter((world) => world.status === 'COMPLETED').length;
      return {
        id: player.id,
        nickname: text(data.nickname).trim() || 'Sin alias',
        age: optionalNum(data.age),
        costumeId: text(data.costumeId) || 'spider',
        gender: text(data.gender),
        score: num(data.score),
        gamesPlayed: num(data.gamesPlayedCount),
        worlds,
        completed,
        rank: RANKS[completed],
        stage: describeStage(worlds),
        survey: surveys.get(player.id) ?? null,
        raw: data,
      };
    })
    .sort((a, b) => b.score - a.score || b.completed - a.completed || a.nickname.localeCompare(b.nickname, 'es'));
}

export interface ActivityMetrics {
  /** null = la app no registró la actividad. */
  time: number | null;
  mistakes: number | null;
  attempts: number | null;
}

/** La app guarda 0 hasta que la actividad se termina: tiempo 0 significa "sin registrar". */
export function activityMetrics(hero: Hero, worldId: number, activity: Activity): ActivityMetrics {
  const key = `W${worldId}${activity.code}`;
  const time = num(hero.raw[`time${key}`]);
  if (time <= 0) return { time: null, mistakes: null, attempts: null };
  const isMoves = activity.kind === 'moves';
  return {
    time,
    mistakes: num(hero.raw[`${isMoves ? 'moves' : 'errors'}${key}`]),
    attempts: isMoves ? null : num(hero.raw[`attempts${key}`]),
  };
}

export interface ActivitySummary {
  activity: Activity;
  plays: number;
  avgTime: number | null;
  avgMistakes: number | null;
}

export interface WorldSummary {
  id: number;
  reached: number;
  defeated: number;
  /** Salud del enemigo: % de héroes que aún no lo vencen. */
  enemyHp: number;
  activities: ActivitySummary[];
}

export function summarizeWorlds(heroes: Hero[]): WorldSummary[] {
  return WORLDS.map((world) => {
    const statuses = heroes.map((hero) => hero.worlds[world.id - 1].status);
    const defeated = statuses.filter((status) => status === 'COMPLETED').length;
    const activities = ACTIVITIES.map((activity): ActivitySummary => {
      const records = heroes
        .map((hero) => activityMetrics(hero, world.id, activity))
        .filter((metrics) => metrics.time !== null);
      return {
        activity,
        plays: records.length,
        avgTime: average(records.map((record) => record.time!)),
        avgMistakes: average(records.map((record) => record.mistakes!)),
      };
    });
    return {
      id: world.id,
      reached: statuses.filter((status) => status !== 'LOCKED').length,
      defeated,
      enemyHp: heroes.length ? Math.round((1 - defeated / heroes.length) * 100) : 100,
      activities,
    };
  });
}

export interface Overview {
  heroes: number;
  active: number;
  totalScore: number;
  avgScore: number | null;
  badges: number;
  legends: number;
  liberation: number;
  surveys: number;
  satisfaction: number | null;
}

export function summarize(heroes: Hero[]): Overview {
  const badges = heroes.reduce((sum, hero) => sum + hero.completed, 0);
  const totalScore = heroes.reduce((sum, hero) => sum + hero.score, 0);
  const surveys = heroes.flatMap((hero) => (hero.survey ? [hero.survey] : []));
  return {
    heroes: heroes.length,
    active: heroes.filter((hero) => hero.score > 0 || hero.completed > 0).length,
    totalScore,
    avgScore: average(heroes.map((hero) => hero.score)),
    badges,
    legends: heroes.filter((hero) => hero.completed === WORLDS.length).length,
    liberation: heroes.length ? badges / (heroes.length * WORLDS.length) : 0,
    surveys: surveys.length,
    satisfaction: average(surveys.flatMap((survey) => survey.answers.filter((a): a is number => a !== null))),
  };
}

export interface Count {
  label: string;
  key: string;
  count: number;
}

export function squad(heroes: Hero[]) {
  const ages = new Map<number, number>();
  heroes.forEach((hero) => {
    if (hero.age !== null) ages.set(hero.age, (ages.get(hero.age) ?? 0) + 1);
  });
  const toCount = (key: string, label: string, match: (hero: Hero) => boolean): Count => ({
    key,
    label,
    count: heroes.filter(match).length,
  });
  return {
    ages: [...ages.entries()]
      .sort(([a], [b]) => a - b)
      .map(([age, count]): Count => ({ key: String(age), label: `${age} años`, count })),
    genders: [
      toCount('MUJER', 'Mujer', (hero) => hero.gender === 'MUJER'),
      toCount('HOMBRE', 'Hombre', (hero) => hero.gender === 'HOMBRE'),
    ],
    costumes: Object.entries(COSTUMES).map(([key, costume]) =>
      toCount(key, costume.name, (hero) => hero.costumeId === key),
    ),
    avgAge: average(heroes.flatMap((hero) => (hero.age !== null ? [hero.age] : []))),
  };
}

export interface QuestionSummary {
  index: number;
  question: string;
  average: number | null;
  responses: number;
}

export function summarizeSurvey(heroes: Hero[]) {
  const answered = heroes.filter((hero) => hero.survey);
  const questions: QuestionSummary[] = QUESTIONS.map((question, index) => {
    const values = answered.flatMap((hero) => {
      const answer = hero.survey!.answers[index];
      return answer === null ? [] : [answer];
    });
    return { index, question, average: average(values), responses: values.length };
  });
  const comments = answered
    .filter((hero) => hero.survey!.comment)
    .map((hero) => ({ hero, comment: hero.survey!.comment, timestamp: hero.survey!.timestamp }))
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  return { responses: answered.length, questions, comments };
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  return minutes ? `${minutes} min ${total % 60} s` : `${total} s`;
}

export function formatDecimal(value: number | null, digits = 1): string {
  return value === null ? '—' : value.toLocaleString('es-CO', { maximumFractionDigits: digits });
}
