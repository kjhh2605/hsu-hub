import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, itemsOf } from './api';

const Context = createContext(null);
const normalizeUser = (session) => !session || session.authenticated === false ? null : session.user ?? session;

export function OperatorProvider({ children }) {
  const [user, setUser] = useState(null); const [clubs, setClubs] = useState([]); const [clubId, setClubId] = useState(null); const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      const session = await api.get('/auth/session'); const nextUser = normalizeUser(session);
      if (!nextUser) { setUser(null); setClubs([]); setClubId(null); return; }
      setUser(nextUser); const mappings = itemsOf(await api.get('/operator/clubs'), 'clubs'); setClubs(mappings); setClubId((current) => mappings.some((club) => club.id === current) ? current : mappings[0]?.id ?? null);
    } catch { setUser(null); setClubs([]); setClubId(null); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const value = useMemo(() => ({ user, clubs, clubId, selectedClub: clubs.find((club) => club.id === clubId), setClubId, loading, refresh: load,
    async logout() { await api.post('/auth/logout'); setUser(null); setClubs([]); setClubId(null); },
  }), [user, clubs, clubId, loading]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useOperator() { const value = useContext(Context); if (!value) throw new Error('OperatorProvider가 필요합니다.'); return value; }
