import { useEffect, useMemo, useState } from 'react';
import { buildHeroes, type Hero, type RawDoc } from '../domain/stats';
import { listenPlayers, listenSurveys, listenWorlds, type Feed } from './firestore';

type Source = 'players' | 'worlds' | 'surveys';

export interface GameData {
  heroes: Hero[];
  loading: boolean;
  error: Error | null;
  live: boolean;
  updatedAt: Date | null;
}

export function useGameData(): GameData {
  const [feeds, setFeeds] = useState<Partial<Record<Source, Feed>>>({});
  const [error, setError] = useState<Error | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const receive = (source: Source) => (feed: Feed) => {
      setFeeds((current) => ({ ...current, [source]: feed }));
      setUpdatedAt(new Date());
      setError(null);
    };
    const stops = [
      listenPlayers(receive('players'), setError),
      listenWorlds(receive('worlds'), setError),
      listenSurveys(receive('surveys'), setError),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  const heroes = useMemo(() => {
    const docs = (source: Source): RawDoc[] => feeds[source]?.docs ?? [];
    return buildHeroes(docs('players'), docs('worlds'), docs('surveys'));
  }, [feeds]);

  const all = [feeds.players, feeds.worlds, feeds.surveys];
  return {
    heroes,
    loading: all.some((feed) => !feed) && !error,
    error,
    live: all.every((feed) => feed && !feed.fromCache),
    updatedAt,
  };
}
