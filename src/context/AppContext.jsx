/* ════════════════════════════════════════════════════════
   APP CONTEXT — Global state shared across all tabs
   Replaces prop-drilling for: user, portfolio, prices,
   alerts, theme, lang, apiStatus
════════════════════════════════════════════════════════ */
import React, { createContext, useContext, useState, useCallback } from "react";

const AppContext = createContext(null);

/* Themes (same as App.js THEMES — single source of truth here) */
export const THEMES = {
  gold:   { primary:"#D4A843", primaryD:"#A07820", primaryL:"#F0C060", bg:"#070A0F", card:"rgba(255,255,255,0.028)" },
  blue:   { primary:"#3B82F6", primaryD:"#1D4ED8", primaryL:"#60A5FA", bg:"#060B14", card:"rgba(59,130,246,0.04)"  },
  green:  { primary:"#10B981", primaryD:"#059669", primaryL:"#34D399", bg:"#061210", card:"rgba(16,185,129,0.04)"  },
  purple: { primary:"#8B5CF6", primaryD:"#6D28D9", primaryL:"#A78BFA", bg:"#0A0610", card:"rgba(139,92,246,0.04)" },
  red:    { primary:"#EF4444", primaryD:"#B91C1C", primaryL:"#F87171", bg:"#100606", card:"rgba(239,68,68,0.04)"   },
};

export function AppProvider({ children }) {
  // ── User ──
  const [user,        setUser]        = useState(null);
  const [userPlan,    setUserPlan]    = useState("free");

  // ── Market ──
  const [prices,      setPrices]      = useState([]);
  const [apiStatus,   setApiStatus]   = useState("connecting");
  const [lastApi,     setLastApi]     = useState(null);

  // ── Portfolio ──
  const [portfolio, setPortfolio] = useState({ balance: 100000, trades: [], history: [] });

  // ── Alerts ──
  const [alerts,    setAlerts]    = useState([]);

  // ── Appearance ──
  const [currentTheme, setCurrentTheme] = useState("gold");
  const [lang,          setLang]         = useState("ar");
  const theme = THEMES[currentTheme] || THEMES.gold;

  // ── Helpers ──
  const updatePortfolio = useCallback((updater) => setPortfolio(updater), []);
  const updatePrices    = useCallback((updater) => setPrices(updater),    []);

  return (
    <AppContext.Provider value={{
      // user
      user, setUser, userPlan, setUserPlan,
      // market
      prices, setPrices, updatePrices, apiStatus, setApiStatus, lastApi, setLastApi,
      // portfolio
      portfolio, setPortfolio, updatePortfolio,
      // alerts
      alerts, setAlerts,
      // appearance
      currentTheme, setCurrentTheme, theme, lang, setLang,
    }}>
      {children}
    </AppContext.Provider>
  );
}

/* Hook — use anywhere without prop drilling */
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};

export default AppContext;
