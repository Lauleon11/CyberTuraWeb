import { describe, expect, it } from 'vitest';
import { ACTIVITIES, characterImage } from './catalog';
import { activityMetrics, buildHeroes, parseSurvey, summarize, summarizeWorlds, type RawDoc } from './stats';

const player = (id: string, data: Record<string, unknown> = {}): RawDoc => ({
  id,
  path: `players/${id}`,
  data: { nickname: id, age: 10, costumeId: 'bat', gender: 'MUJER', score: 0, ...data },
});
const world = (playerId: string, worldId: number, status: string, currentScreen = 'A'): RawDoc => ({
  id: String(worldId),
  path: `players/${playerId}/worlds/${worldId}`,
  data: { worldId, status, currentScreen, completedAt: null },
});

describe('buildHeroes', () => {
  it('aplica la regla de la app cuando faltan documentos de mundos', () => {
    const [hero] = buildHeroes([player('a')], [], []);
    expect(hero.worlds.map((w) => w.status)).toEqual(['UNLOCKED', 'LOCKED', 'LOCKED', 'LOCKED', 'LOCKED']);
    expect(hero.completed).toBe(0);
    expect(hero.rank.name).toBe('Recluta');
  });

  it('une mundos y encuesta por id de jugador y ordena por puntos', () => {
    const heroes = buildHeroes(
      [player('bajo', { score: 5 }), player('alto', { score: 50 })],
      [world('alto', 1, 'COMPLETED', 'H'), world('alto', 2, 'UNLOCKED', 'BActivity'), world('bajo', 1, 'UNLOCKED')],
      [{ id: 'alto', path: 'surveys/alto', data: { questionAnswers: { question_1: 4 } } }],
    );
    expect(heroes.map((h) => h.id)).toEqual(['alto', 'bajo']);
    expect(heroes[0].completed).toBe(1);
    expect(heroes[0].stage).toBe('Mundo 2 · Ahorcado');
    expect(heroes[0].survey?.average).toBe(4);
    expect(heroes[1].survey).toBeNull();
  });

  it('ignora documentos worlds que no cuelgan de players', () => {
    const [hero] = buildHeroes(
      [player('a')],
      [{ id: '1', path: 'otros/a/worlds/1', data: { status: 'COMPLETED' } }],
      [],
    );
    expect(hero.completed).toBe(0);
  });
});

describe('métricas', () => {
  const [hero] = buildHeroes(
    [player('a', { timeW1A: 30, errorsW1A: 2, attemptsW1A: 5, timeW1C: 20, movesW1C: 7, timeW1B: 0, errorsW1B: 0 })],
    [],
    [],
  );
  const [sopa, ahorcado, puzzle] = ACTIVITIES;

  it('tiempo 0 significa sin registrar y no cuenta en promedios', () => {
    expect(activityMetrics(hero, 1, ahorcado)).toEqual({ time: null, mistakes: null, attempts: null });
    const summary = summarizeWorlds([hero])[0].activities[1];
    expect(summary.plays).toBe(0);
    expect(summary.avgTime).toBeNull();
  });

  it('el rompecabezas usa movimientos y no intentos', () => {
    expect(activityMetrics(hero, 1, puzzle)).toEqual({ time: 20, mistakes: 7, attempts: null });
    expect(activityMetrics(hero, 1, sopa)).toEqual({ time: 30, mistakes: 2, attempts: 5 });
  });
});

describe('resúmenes', () => {
  it('calcula salud del enemigo y liberación', () => {
    const heroes = buildHeroes(
      [player('a'), player('b'), player('c'), player('d')],
      [world('a', 1, 'COMPLETED')],
      [],
    );
    expect(summarizeWorlds(heroes)[0].enemyHp).toBe(75);
    expect(summarize(heroes).liberation).toBeCloseTo(1 / 20);
  });

  it('no se rompe sin héroes', () => {
    expect(summarizeWorlds([])[0].enemyHp).toBe(100);
    expect(summarize([])).toMatchObject({ heroes: 0, liberation: 0, satisfaction: null, avgScore: null });
  });

  it('promedia las respuestas reales en vez de averageStars truncado', () => {
    const survey = parseSurvey({ averageStars: 4, questionAnswers: { question_1: 5, question_2: 4 } });
    expect(survey.average).toBe(4.5);
    expect(survey.answers[2]).toBeNull();
  });
});

describe('characterImage', () => {
  it('elige la versión según traje y género, con respaldo', () => {
    expect(characterImage('bat', 'MUJER')).toContain('batigata');
    expect(characterImage('super', 'HOMBRE')).toContain('supergato');
    expect(characterImage('desconocido', 'HOMBRE')).toContain('spidergato');
  });
});
