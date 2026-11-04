/** Contenido del juego, copiado de la app Android (World.kt, RatingScreen.kt, CyberturaNavGraph.kt). */
export interface World {
  id: number;
  name: string;
  shortName: string;
  risk: string;
  riskEmoji: string;
  enemy: string;
  enemyEmoji: string;
  badge: string;
}

export const WORLDS: World[] = [
  { id: 1, name: 'El Mar de las Cadenas', shortName: 'Phishing', risk: 'Phishing', riskEmoji: '🌊', enemy: 'Capitán Phish', enemyEmoji: '🏴‍☠️', badge: 'Detective Anti-Phishing' },
  { id: 2, name: 'La Fortaleza de las Cerraduras', shortName: 'Contraseñas', risk: 'Cuentas y contraseñas', riskEmoji: '🔐', enemy: 'El Rompeclaves', enemyEmoji: '🔨', badge: 'Guardián de las Claves' },
  { id: 3, name: 'El Valle de las Sombras', shortName: 'Ciberacoso', risk: 'Ciberacoso', riskEmoji: '🌑', enemy: 'El Troll', enemyEmoji: '👹', badge: 'Defensor Digital' },
  { id: 4, name: 'El Archivo de los Secretos', shortName: 'Privacidad', risk: 'Privacidad y datos personales', riskEmoji: '📁', enemy: 'El Espía', enemyEmoji: '🕵️', badge: 'Guardián de los Datos' },
  { id: 5, name: 'El Reino de las Máscaras', shortName: 'Identidad', risk: 'Identidad y huella digital', riskEmoji: '🎭', enemy: 'El Suplantador', enemyEmoji: '👤', badge: 'Guardián de la Identidad' },
];

export interface Activity {
  code: 'A' | 'B' | 'C' | 'E' | 'F' | 'G';
  name: string;
  emoji: string;
  /** Segunda métrica: el rompecabezas cuenta movimientos en lugar de errores. */
  kind: 'errors' | 'moves';
}

export const ACTIVITIES: Activity[] = [
  { code: 'A', name: 'Sopa de letras', emoji: '🔍', kind: 'errors' },
  { code: 'B', name: 'Ahorcado', emoji: '🪓', kind: 'errors' },
  { code: 'C', name: 'Rompecabezas', emoji: '🧩', kind: 'moves' },
  { code: 'E', name: 'Reto 1', emoji: '⚔️', kind: 'errors' },
  { code: 'F', name: 'Reto 2', emoji: '⚔️', kind: 'errors' },
  { code: 'G', name: 'Reto 3', emoji: '⚔️', kind: 'errors' },
];

/** Valores de currentScreen que escribe el grafo de navegación de la app. */
export const STAGES: Record<string, string> = {
  A: 'Video 1',
  AActivity: 'Sopa de letras',
  B: 'Video 2',
  BActivity: 'Ahorcado',
  C: 'Video 3',
  CActivity: 'Rompecabezas',
  D: 'Video 4',
  E: 'Reto 1',
  F: 'Reto 2',
  G: 'Reto 3',
  H: 'Victoria',
};

export const QUESTIONS = [
  '¿Qué tanto te gustó la aplicación Cybertura?',
  '¿Fue fácil navegar por la aplicación y pasar de una pantalla a otra?',
  '¿Te resultó fácil entender cómo jugar las actividades?',
  '¿Los botones y las instrucciones funcionaron correctamente?',
  '¿Te gustaron los personajes, los mundos y los escenarios del juego?',
  '¿Te parecieron divertidos los juegos de ahorcado, sopa de letras y rompecabezas?',
  '¿Te gustó desbloquear mundos y ganar insignias?',
  '¿Los videos fueron claros y fáciles de entender?',
  '¿Las actividades te ayudaron a comprender mejor los temas de ciberseguridad?',
  '¿Te gustaría volver a jugar Cybertura?',
];

/** Rango del panel según los mundos completados. No existe en la app: es propio de este panel. */
export const RANKS = [
  { name: 'Recluta', emoji: '🐾' },
  { name: 'Aprendiz', emoji: '🌱' },
  { name: 'Explorador', emoji: '🧭' },
  { name: 'Guardián', emoji: '🛡️' },
  { name: 'Campeón', emoji: '⚡' },
  { name: 'Leyenda', emoji: '👑' },
];

export const COSTUMES: Record<string, { name: string; male: string; female: string }> = {
  spider: { name: 'Spider', male: 'spidergato', female: 'spidergata' },
  bat: { name: 'Bati', male: 'batigato', female: 'batigata' },
  super: { name: 'Super', male: 'supergato', female: 'supergata' },
};

export const worldImage = (id: number) => `/img/worlds/mundo${id}.webp`;
export const badgeImage = (id: number) => `/img/badges/insignia${id}.webp`;

export function characterImage(costumeId: string, gender: string): string {
  const costume = COSTUMES[costumeId] ?? COSTUMES.spider;
  return `/img/characters/${gender === 'MUJER' ? costume.female : costume.male}.webp`;
}
