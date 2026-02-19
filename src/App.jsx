import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, RotateCcw, ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

// ─── CATEGORY CONFIG ────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: "finance",    label: "Business/Finance",    emoji: "💼", color: "#ff3b30", neon: "255,59,48",   orbitals: ["Track", "Invest", "Scale"] },
  { id: "tinkering",  label: "Tinkering/Invention", emoji: "⚙️",  color: "#ff9500", neon: "255,149,0",   orbitals: ["Design", "Build", "Prototype"] },
  { id: "health",     label: "Health/Vanity",       emoji: "⚡", color: "#ffd60a", neon: "255,214,10",  orbitals: ["Workout", "Grooming", "Reading"] },
  { id: "homestead",  label: "Cooking/Homestead",   emoji: "🌿", color: "#30d158", neon: "48,209,88",   orbitals: ["Cook", "Preserve", "Garden"] },
  { id: "art",        label: "Growth/Art",          emoji: "✦",  color: "#0a84ff", neon: "10,132,255",  orbitals: ["Paint", "Music", "Write"] },
  { id: "family",     label: "Family/Wife",         emoji: "♾️", color: "#bf5af2", neon: "191,90,242",  orbitals: ["Communication", "Walk", "Pup"] },
  { id: "fellowship", label: "Fellowship",          emoji: "◈",  color: "#98989d", neon: "152,152,157", orbitals: ["Maker Class", "Outdoors", "Fantasy"] },
  { id: "mental",     label: "Mental Well-being",   emoji: "◉",  color: "#e8e8ed", neon: "232,232,237", orbitals: ["Meditation", "Reflection", "Stillness"] },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── HELPERS ────────────────────────────────────────────────────────────────
const toDateStr = (d = new Date()) => d.toISOString().split("T")[0];

const toCartesian = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const donutSlicePath = (cx, cy, r, ir, a1, a2) => {
  const s  = toCartesian(cx, cy, r,  a1);
  const e  = toCartesian(cx, cy, r,  a2);
  const si = toCartesian(cx, cy, ir, a1);
  const ei = toCartesian(cx, cy, ir, a2);
  const lg = a2 - a1 > 180 ? 1 : 0;
  return [
    `M ${si.x.toFixed(3)} ${si.y.toFixed(3)}`,
    `L ${s.x.toFixed(3)} ${s.y.toFixed(3)}`,
    `A ${r} ${r} 0 ${lg} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`,
    `L ${ei.x.toFixed(3)} ${ei.y.toFixed(3)}`,
    `A ${ir} ${ir} 0 ${lg} 0 ${si.x.toFixed(3)} ${si.y.toFixed(3)}`,
    "Z",
  ].join(" ");
};

const getWeekDates = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(now.getFullYear(), now.getMonth(), diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toDateStr(d);
  });
};

const getMonthDays = (year, month) => {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => {
    const d = i + 1;
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  });
};

// ─── MINI RING (heatmap cell) ────────────────────────────────────────────────
function MiniRing({ loggedSet, categories, size = 26 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.42, ir = size * 0.22;
  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      {categories.map((cat, i) => {
        const a1 = i * 45, a2 = a1 + 43.5;
        return (
          <path
            key={cat.id}
            d={donutSlicePath(cx, cy, r, ir, a1, a2)}
            fill={cat.color}
            opacity={loggedSet.has(cat.id) ? 1 : 0.08}
          />
        );
      })}
    </svg>
  );
}

// ─── WEEKLY CHART ────────────────────────────────────────────────────────────
function WeeklyChart({ logs, categories }) {
  const weekDates = getWeekDates();
  const data = weekDates.map((date, i) => {
    const dayLogs = logs[date] || {};
    const row = { day: DAY_LABELS[i] };
    categories.forEach(cat => {
      row[cat.id] = Object.keys(dayLogs).filter(k => k.startsWith(cat.id + ":")).length;
    });
    return row;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const cats = payload.filter(p => p.value > 0);
    return (
      <div style={{ background: "#0c0c18", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 6, letterSpacing: "0.1em" }}>{label}</p>
        {cats.map(p => (
          <p key={p.dataKey} style={{ color: categories.find(c => c.id === p.dataKey)?.color, fontSize: 11, margin: "2px 0" }}>
            {categories.find(c => c.id === p.dataKey)?.label}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "'Space Mono',monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          {categories.map((cat, i) => (
            <Bar key={cat.id} dataKey={cat.id} stackId="stack" fill={cat.color} name={cat.label}
              radius={i === categories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── HEATMAP CALENDAR ────────────────────────────────────────────────────────
function HeatmapCalendar({ logs, categories }) {
  const now = new Date();
  const monthsToShow = [];
  for (let m = 2; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    monthsToShow.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  const getLoggedSet = (dateStr) => {
    const dayLogs = logs[dateStr] || {};
    const set = new Set();
    Object.keys(dayLogs).forEach(k => {
      const catId = k.split(":")[0];
      if (catId) set.add(catId);
    });
    return set;
  };

  return (
    <div className="space-y-8 pb-8">
      {monthsToShow.map(({ year, month }) => {
        const days = getMonthDays(year, month);
        const firstDay = new Date(year, month, 1).getDay();
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        const label = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        return (
          <div key={`${year}-${month}`}>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, letterSpacing: "0.15em", marginBottom: 10 }}>{label.toUpperCase()}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: 9, paddingBottom: 4 }}>{d}</div>
              ))}
              {Array.from({ length: offset }, (_, i) => <div key={`e${i}`} />)}
              {days.map((dateStr, di) => {
                const loggedSet = getLoggedSet(dateStr);
                const isToday = dateStr === toDateStr();
                return (
                  <div key={dateStr} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ position: "relative" }}>
                      <MiniRing loggedSet={loggedSet} categories={categories} size={26} />
                      {isToday && (
                        <div style={{
                          position: "absolute", inset: 0,
                          border: "1.5px solid rgba(255,255,255,0.4)",
                          borderRadius: "50%",
                        }} />
                      )}
                    </div>
                    <span style={{ fontSize: 8, color: isToday ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)" }}>
                      {di + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SETTINGS PANEL ──────────────────────────────────────────────────────────
function SettingsPanel({ orbitals, setOrbitals, onClearData, onClose }) {
  const [expandedCat, setExpandedCat] = useState(null);
  const [editValues, setEditValues] = useState(orbitals);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setOrbitals(editValues);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0c0c18",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px 24px 0 0",
          width: "100%",
          maxHeight: "82vh",
          overflowY: "auto",
          padding: "24px 20px 40px",
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 20px" }} />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 13, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)", fontFamily: "'Space Mono',monospace" }}>SETTINGS</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginBottom: 14 }}>CUSTOMIZE ORBITALS</p>

        {DEFAULT_CATEGORIES.map(cat => (
          <div key={cat.id} style={{ marginBottom: 6 }}>
            <button
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", textAlign: "left", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 14px",
                cursor: "pointer", color: "white",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{cat.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                {expandedCat === cat.id ? "▲" : "▼"}
              </span>
            </button>
            <AnimatePresence>
              {expandedCat === cat.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden" }}>
                  <div style={{ padding: "8px 0 4px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {(editValues[cat.id] || cat.orbitals).map((orb, i) => (
                      <input
                        key={i}
                        value={orb}
                        onChange={e => setEditValues(prev => ({
                          ...prev,
                          [cat.id]: prev[cat.id].map((o, j) => j === i ? e.target.value : o)
                        }))}
                        style={{
                          background: "rgba(255,255,255,0.04)", border: `1px solid ${cat.color}30`,
                          borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "rgba(255,255,255,0.7)",
                          outline: "none", fontFamily: "'Space Mono',monospace",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        <button
          onClick={handleSave}
          style={{
            marginTop: 16, width: "100%", padding: "13px", borderRadius: 12,
            background: saved ? "rgba(48,209,88,0.15)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${saved ? "rgba(48,209,88,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: saved ? "#30d158" : "rgba(255,255,255,0.5)",
            fontSize: 12, letterSpacing: "0.15em", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.3s",
          }}
        >
          {saved ? <><Check size={14} /> SAVED</> : "SAVE CHANGES"}
        </button>

        <button
          onClick={() => { if (window.confirm("Clear all ritual logs? This cannot be undone.")) { onClearData(); onClose(); } }}
          style={{
            marginTop: 8, width: "100%", padding: "13px", borderRadius: 12,
            background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.2)",
            color: "rgba(255,80,70,0.7)", fontSize: 12, letterSpacing: "0.15em", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <RotateCcw size={14} /> CLEAR ALL DATA
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ritual_logs") || "{}"); } catch { return {}; }
  });
  const [orbitals, setOrbitals] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ritual_orbitals") || "null");
      return saved || DEFAULT_CATEGORIES.reduce((a, c) => ({ ...a, [c.id]: [...c.orbitals] }), {});
    } catch { return DEFAULT_CATEGORIES.reduce((a, c) => ({ ...a, [c.id]: [...c.orbitals] }), {}); }
  });

  const [currentView, setCurrentView] = useState(0);
  const [activeSlice, setActiveSlice] = useState(null);
  const [orbitalPositions, setOrbitalPositions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [justLogged, setJustLogged] = useState(null); // { catId, orbital }

  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);
  const pointerDownSlice = useRef(null);

  // Persist
  useEffect(() => { localStorage.setItem("ritual_logs", JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem("ritual_orbitals", JSON.stringify(orbitals)); }, [orbitals]);

  const todayStr = toDateStr();

  const getLoggedCatsToday = () => {
    const dayLogs = logs[todayStr] || {};
    const set = new Set();
    Object.keys(dayLogs).forEach(k => set.add(k.split(":")[0]));
    return set;
  };

  const logActivity = (catId, orbital) => {
    const key = `${catId}:${orbital}`;
    setLogs(prev => ({
      ...prev,
      [todayStr]: { ...(prev[todayStr] || {}), [key]: Date.now() }
    }));
    setJustLogged({ catId, orbital });
    setTimeout(() => setJustLogged(null), 2000);
    try { navigator.vibrate?.(50); } catch {}
    setActiveSlice(null);
  };

  const handlePointerDown = (idx, e) => {
    e.preventDefault();
    e.stopPropagation();
    isLongPress.current = false;
    pointerDownSlice.current = idx;

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      try { navigator.vibrate?.(30); } catch {}

      // Compute orbital positions
      const cat = DEFAULT_CATEGORIES[idx];
      const midAngle = idx * 45 + 22.5;
      const orbs = orbitals[cat.id] || cat.orbitals;
      const spread = orbs.length === 3 ? [-38, 0, 38] : orbs.length === 4 ? [-55, -18, 18, 55] : [-50, -25, 0, 25, 50];
      const positions = orbs.map((_, i) => {
        const angleDeg = midAngle + spread[i] - 90;
        const rad = (angleDeg * Math.PI) / 180;
        const dist = 115;
        return { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist };
      });

      setOrbitalPositions(positions);
      setActiveSlice(idx);
    }, 380);
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
    if (!isLongPress.current) {
      // Short tap — do nothing, just cancel
    }
    isLongPress.current = false;
    pointerDownSlice.current = null;
  };

  const handlePointerLeave = () => {
    clearTimeout(longPressTimer.current);
    isLongPress.current = false;
  };

  const dismissOrbitals = () => setActiveSlice(null);

  // Swipe logic
  const dragStartX = useRef(null);
  const handleTouchStart = (e) => { dragStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (dragStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - dragStartX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0 && currentView < 2) setCurrentView(v => v + 1);
      if (dx > 0 && currentView > 0) setCurrentView(v => v - 1);
    }
    dragStartX.current = null;
  };

  // Pie dimensions
  const PIE_SIZE = 310;
  const cx = PIE_SIZE / 2, cy = PIE_SIZE / 2;
  const R = 133, IR = 52;
  const loggedToday = getLoggedCatsToday();
  const completedCount = loggedToday.size;

  const views = ["RITUAL", "WEEKLY", "HISTORY"];

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#080812",
        color: "white",
        fontFamily: "'Space Mono', 'Courier New', monospace",
        overflowX: "hidden",
        position: "relative",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onTouchStart={activeSlice !== null ? undefined : handleTouchStart}
      onTouchEnd={activeSlice !== null ? undefined : handleTouchEnd}
    >
      {/* Ambient background glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 40%, rgba(10,8,30,0.98) 0%, #050508 100%)",
        zIndex: 0,
      }} />
      {/* Subtle grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 22px 0" }}>
        <div>
          <div style={{ fontSize: 20, letterSpacing: "0.4em", color: "rgba(255,255,255,0.85)", fontWeight: "bold" }}>RITUAL</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", marginTop: 2 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "8px 9px", cursor: "pointer", color: "rgba(255,255,255,0.35)",
            display: "flex", alignItems: "center",
          }}
        >
          <Settings size={16} />
        </button>
      </div>

      {/* View navigation tabs */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "center", gap: 6, padding: "14px 0 0" }}>
        {views.map((v, i) => (
          <button
            key={v}
            onClick={() => setCurrentView(i)}
            style={{
              fontSize: 9, letterSpacing: "0.18em", padding: "5px 12px",
              borderRadius: 20, cursor: "pointer",
              background: currentView === i ? "rgba(255,255,255,0.1)" : "transparent",
              border: currentView === i ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.04)",
              color: currentView === i ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
              transition: "all 0.2s",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Views container */}
      <div style={{ position: "relative", zIndex: 5, overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          {/* ── VIEW 0: PIE ─────────────────────────────────── */}
          {currentView === 0 && (
            <motion.div
              key="pie-view"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12 }}
            >
              {/* PIE SVG */}
              <div style={{ position: "relative", width: PIE_SIZE, height: PIE_SIZE }}>
                <svg
                  width={PIE_SIZE}
                  height={PIE_SIZE}
                  style={{ position: "absolute", inset: 0, overflow: "visible" }}
                >
                  <defs>
                    {DEFAULT_CATEGORIES.map(cat => (
                      <filter key={cat.id} id={`neon-${cat.id}`} x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="6" result="blur1" />
                        <feGaussianBlur stdDeviation="14" result="blur2" />
                        <feMerge>
                          <feMergeNode in="blur2" />
                          <feMergeNode in="blur1" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    ))}
                  </defs>

                  {DEFAULT_CATEGORIES.map((cat, i) => {
                    const a1 = i * 45 + 1;
                    const a2 = (i + 1) * 45 - 1;
                    const isLogged = loggedToday.has(cat.id);
                    const isActive = activeSlice === i;
                    const outerR = isActive ? R + 14 : R;
                    return (
                      <motion.path
                        key={cat.id}
                        d={donutSlicePath(cx, cy, outerR, IR, a1, a2)}
                        fill={cat.color}
                        opacity={isLogged ? 1 : 0.18}
                        filter={isLogged ? `url(#neon-${cat.id})` : undefined}
                        animate={{
                          scale: isActive ? 1.04 : 1,
                          opacity: isLogged ? 1 : isActive ? 0.65 : 0.18,
                        }}
                        style={{ transformOrigin: `${cx}px ${cy}px`, cursor: "pointer", touchAction: "none" }}
                        onPointerDown={e => handlePointerDown(i, e)}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerLeave}
                        onPointerCancel={handlePointerUp}
                      />
                    );
                  })}

                  {/* Inner circle */}
                  <circle cx={cx} cy={cy} r={IR - 3} fill="#080812" />
                  <circle cx={cx} cy={cy} r={IR - 3} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1.5} />

                  {/* Center text */}
                  <text x={cx} y={cy - 7} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={18} fontFamily="'Space Mono',monospace" fontWeight="bold">
                    {completedCount}
                  </text>
                  <text x={cx} y={cy + 9} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={9} fontFamily="'Space Mono',monospace" letterSpacing="2">
                    OF 8
                  </text>

                  {/* Slice emojis */}
                  {DEFAULT_CATEGORIES.map((cat, i) => {
                    const midAngle = (i * 45 + 22.5 - 90) * (Math.PI / 180);
                    const labelR = 100;
                    const lx = cx + labelR * Math.cos(midAngle);
                    const ly = cy + labelR * Math.sin(midAngle);
                    return (
                      <text
                        key={cat.id}
                        x={lx} y={ly}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={17}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                        opacity={loggedToday.has(cat.id) ? 1 : 0.45}
                      >
                        {cat.emoji}
                      </text>
                    );
                  })}
                </svg>

                {/* Orbital Circles */}
                <AnimatePresence>
                  {activeSlice !== null && (() => {
                    const cat = DEFAULT_CATEGORIES[activeSlice];
                    const orbs = orbitals[cat.id] || cat.orbitals;
                    return orbs.map((orb, i) => {
                      const pos = orbitalPositions[i] || { x: 0, y: 0 };
                      return (
                        <motion.button
                          key={`orb-${activeSlice}-${i}`}
                          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                          animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
                          exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                          transition={{ delay: i * 0.065, type: "spring", stiffness: 350, damping: 22 }}
                          onClick={() => logActivity(cat.id, orb)}
                          style={{
                            position: "absolute",
                            left: "50%", top: "50%",
                            marginLeft: -34, marginTop: -34,
                            width: 68, height: 68,
                            borderRadius: "50%",
                            background: `radial-gradient(circle at 35% 35%, ${cat.color}ee, ${cat.color}88)`,
                            boxShadow: `0 0 16px rgba(${cat.neon},0.6), 0 0 32px rgba(${cat.neon},0.3), inset 0 1px 0 rgba(255,255,255,0.25)`,
                            border: `1.5px solid rgba(${cat.neon},0.5)`,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", zIndex: 50,
                            color: "rgba(0,0,0,0.8)",
                            fontSize: 9, fontWeight: "bold", letterSpacing: "0.06em",
                            textAlign: "center", lineHeight: 1.2, padding: 6,
                            fontFamily: "'Space Mono',monospace",
                          }}
                        >
                          {orb}
                        </motion.button>
                      );
                    });
                  })()}
                </AnimatePresence>

                {/* Backdrop to dismiss */}
                {activeSlice !== null && (
                  <div
                    onClick={dismissOrbitals}
                    style={{
                      position: "fixed", inset: 0, zIndex: 30,
                      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(1px)",
                    }}
                  />
                )}
              </div>

              {/* Legend grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: "6px 12px", padding: "6px 24px 0", width: "100%", maxWidth: 360,
              }}>
                {DEFAULT_CATEGORIES.map(cat => (
                  <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                      background: cat.color,
                      opacity: loggedToday.has(cat.id) ? 1 : 0.25,
                      boxShadow: loggedToday.has(cat.id) ? `0 0 6px rgba(${cat.neon},0.8)` : "none",
                    }} />
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cat.label.split("/")[0].toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>

              <p style={{ marginTop: 10, fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: "0.2em" }}>
                HOLD A SLICE TO ACTIVATE
              </p>

              {/* Just logged toast */}
              <AnimatePresence>
                {justLogged && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    style={{
                      marginTop: 10,
                      background: `rgba(${DEFAULT_CATEGORIES.find(c => c.id === justLogged.catId)?.neon},0.12)`,
                      border: `1px solid rgba(${DEFAULT_CATEGORIES.find(c => c.id === justLogged.catId)?.neon},0.3)`,
                      borderRadius: 10, padding: "7px 16px",
                      fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em",
                      display: "flex", alignItems: "center", gap: 7,
                    }}
                  >
                    <Check size={12} color={DEFAULT_CATEGORIES.find(c => c.id === justLogged.catId)?.color} />
                    {justLogged.orbital} logged
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── VIEW 1: WEEKLY ──────────────────────────────── */}
          {currentView === 1 && (
            <motion.div
              key="weekly-view"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ padding: "16px 18px 32px" }}
            >
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", textAlign: "center", marginBottom: 18 }}>
                THIS WEEK'S RITUAL LOG
              </p>
              <WeeklyChart logs={logs} categories={DEFAULT_CATEGORIES} />

              {/* Category key */}
              <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center" }}>
                {DEFAULT_CATEGORIES.map(cat => (
                  <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: cat.color }} />
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{cat.label.split("/")[0]}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── VIEW 2: HISTORY ─────────────────────────────── */}
          {currentView === 2 && (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ padding: "16px 18px 40px" }}
            >
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", textAlign: "center", marginBottom: 18 }}>
                RITUAL HISTORY
              </p>
              <HeatmapCalendar logs={logs} categories={DEFAULT_CATEGORIES} />

              {/* Ring legend */}
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em", marginBottom: 10 }}>RING SEGMENTS</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                  {DEFAULT_CATEGORIES.map(cat => (
                    <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: cat.color }} />
                      <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.25)" }}>{cat.label.split("/")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            orbitals={orbitals}
            setOrbitals={orbs => { setOrbitals(orbs); localStorage.setItem("ritual_orbitals", JSON.stringify(orbs)); }}
            onClearData={() => { setLogs({}); localStorage.removeItem("ritual_logs"); }}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        button { font-family: 'Space Mono', monospace; }
        input { font-family: 'Space Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>
    </div>
  );
}
