import type { ReactNode } from 'react';
import { characterImage } from '../domain/catalog';
import type { Hero } from '../domain/stats';

export function Panel({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel__head">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

export function StatTile({ emoji, label, value, detail }: { emoji: string; label: string; value: string; detail: string }) {
  return (
    <div className="stat">
      <span className="stat__emoji" aria-hidden="true">
        {emoji}
      </span>
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
      <div className="stat__detail">{detail}</div>
    </div>
  );
}

/** Barra horizontal fina con valor al final y descripción al pasar el cursor o enfocar. */
export function BarRow({
  label,
  value,
  fraction,
  tip,
  tone = 'cyan',
}: {
  label: ReactNode;
  value: string;
  fraction: number;
  tip: string;
  tone?: 'cyan' | 'violet' | 'magenta' | 'gold';
}) {
  return (
    <div className="bar-row" tabIndex={0} data-tip={tip} aria-label={tip}>
      <div className="bar-row__label">{label}</div>
      <div className="bar-row__track">
        <span
          className={`bar-row__fill bar-row__fill--${tone}`}
          style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%` }}
        />
      </div>
      <div className="bar-row__value">{value}</div>
    </div>
  );
}

export function Avatar({ hero, size = 56 }: { hero: Pick<Hero, 'costumeId' | 'gender'>; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <img src={characterImage(hero.costumeId, hero.gender)} alt="" loading="lazy" />
    </span>
  );
}

/** Cinco marcas de progreso, una por mundo, con figura además de color. */
export function WorldPips({ hero }: { hero: Hero }) {
  const label = `${hero.completed} de 5 mundos completados`;
  return (
    <span className="pips" role="img" aria-label={label} title={label}>
      {hero.worlds.map((world) => (
        <span key={world.id} className={`pip pip--${world.status.toLowerCase()}`}>
          {world.status === 'COMPLETED' ? '✓' : world.status === 'UNLOCKED' ? '•' : ''}
        </span>
      ))}
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={`${value.toLocaleString('es-CO', { maximumFractionDigits: 1 })} de 5 estrellas`}>
      {'★'.repeat(rounded)}
      <span className="stars__off">{'★'.repeat(5 - rounded)}</span>
    </span>
  );
}
