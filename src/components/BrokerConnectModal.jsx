/* ═══════════════════════════════════════════════════════════
   BrokerConnectModal — Add / manage real broker connections
   Supports: OANDA | Alpaca | Binance | MetaApi | Demo
═══════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from "react";
import { API } from "../utils/api.js";

const BROKERS = [
  {
    id: "oanda", name: "OANDA", logo: "🏦",
    desc: "Forex & CFD broker — REST v3 API",
    fields: [
      { key: "api_key",    label: "API Token",    type: "password", placeholder: "Your OANDA API token" },
      { key: "account_id", label: "Account ID",   type: "text",     placeholder: "e.g. 101-001-1234567-001", extra: true },
    ],
    types: ["live","practice"],
  },
  {
    id: "alpaca", name: "Alpaca", logo: "🦙",
    desc: "US stocks & crypto — commission-free",
    fields: [
      { key: "api_key",    label: "API Key ID",     type: "password", placeholder: "PKXXXXX…" },
      { key: "api_secret", label: "API Secret Key", type: "password", placeholder: "Secret key" },
    ],
    types: ["live","paper"],
  },
  {
    id: "binance", name: "Binance", logo: "🔶",
    desc: "Crypto spot trading — HMAC signed",
    fields: [
      { key: "api_key",    label: "API Key",    type: "password", placeholder: "Binance API key" },
      { key: "api_secret", label: "Secret Key", type: "password", placeholder: "Binance secret key" },
    ],
    types: ["live"],
  },
  {
    id: "metaapi", name: "MetaTrader (MT4/5)", logo: "📊",
    desc: "Connect any MT4 or MT5 broker via MetaApi cloud",
    fields: [
      { key: "api_key",          label: "MetaApi Token",  type: "password", placeholder: "MetaApi cloud token" },
      { key: "metaapi_account_id", label: "MetaApi Account ID", type: "text", placeholder: "uuid from MetaApi", extra: true },
    ],
    types: ["live","practice"],
  },
  {
    id: "demo", name: "Demo Account", logo: "🎮",
    desc: "Virtual $10,000 — practice without real money",
    fields: [],
    types: ["demo"],
  },
];

export default function BrokerConnectModal({ isAr, theme, onClose, onBrokerAdded }) {
  const [accounts,    setAccounts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState("list");   // list | add
  const [selected,    setSelected]    = useState(null);     // broker config
  const [form,        setForm]        = useState({});
  const [accountType, setAccountType] = useState("live");
  const [label,       setLabel]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const [testing,     setTesting]     = useState(null);
  const [testResult,  setTestResult]  = useState({});
  const [err,         setErr]         = useState("");

  const gold = theme === "gold" ? "#f5a623" : "#7c6fcd";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await API.getBrokers();
    if (res.ok) setAccounts(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startAdd(broker) {
    setSelected(broker);
    setForm({});
    setAccountType(broker.types[0]);
    setLabel(`My ${broker.name}`);
    setErr("");
    setView("add");
  }

  async function handleAdd() {
    if (!label.trim()) { setErr(isAr ? "أدخل اسماً للحساب" : "Enter an account label"); return; }

    // Collect extra fields
    const extra = {};
    const body  = { broker: selected.id, label: label.trim(), account_type: accountType, extra };

    for (const f of selected.fields) {
      const val = form[f.key] || "";
      if (!val && selected.id !== "demo") {
        setErr(isAr ? `الحقل مطلوب: ${f.label}` : `Required: ${f.label}`); return;
      }
      if (f.extra) { extra[f.key] = val; }
      else         { body[f.key]  = val; }
    }

    setSaving(true); setErr("");
    const res = await API.addBroker(body);
    setSaving(false);
    if (!res.ok) { setErr(res.error || "Failed"); return; }
    setView("list");
    await load();
    onBrokerAdded?.(res.data);
  }

  async function testConnection(accId) {
    setTesting(accId);
    const res = await API.testBroker(accId);
    setTestResult(prev => ({ ...prev, [accId]: res.ok ? res.data : { status: "error", message: res.error } }));
    setTesting(null);
    if (res.ok && res.data?.status === "ok") await load();
  }

  async function deleteAccount(accId) {
    if (!window.confirm(isAr ? "حذف هذا الوسيط؟" : "Remove this broker account?")) return;
    await API.deleteBroker(accId);
    setAccounts(prev => prev.filter(a => a.id !== accId));
    setTestResult(prev => { const n = { ...prev }; delete n[accId]; return n; });
  }

  const s = {
    overlay: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    modal: {
      background: "#1a1a2e", border: `1px solid ${gold}40`, borderRadius: 16,
      width: "min(640px, 96vw)", maxHeight: "88vh", display: "flex", flexDirection: "column",
      overflow: "hidden", color: "#e8e8e8",
    },
    header: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 22px", borderBottom: `1px solid #ffffff12`,
    },
    title: { fontSize: 18, fontWeight: 700, color: gold },
    body:  { overflowY: "auto", padding: "18px 22px", flex: 1 },
    btn: (variant = "primary") => ({
      padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600,
      fontSize: 13, transition: "opacity .15s",
      background: variant === "primary" ? gold : variant === "danger" ? "#e53935" : "#ffffff18",
      color: variant === "primary" ? "#0d0d1a" : "#e8e8e8",
    }),
    input: {
      background: "#0d0d1a", border: "1px solid #ffffff25", borderRadius: 8, color: "#e8e8e8",
      padding: "9px 13px", fontSize: 13, width: "100%", boxSizing: "border-box",
    },
    brokerCard: {
      background: "#0d0d1a", border: "1px solid #ffffff18", borderRadius: 12,
      padding: "14px 16px", cursor: "pointer", transition: "border-color .15s",
    },
    accountRow: {
      background: "#0d0d1a", border: "1px solid #ffffff18", borderRadius: 12,
      padding: "14px 16px", marginBottom: 10,
    },
  };

  // ── List view ──────────────────────────────────────────────
  if (view === "list") {
    return (
      <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={s.modal}>
          <div style={s.header}>
            <span style={s.title}>{isAr ? "الوسطاء المتصلون" : "Connected Brokers"}</span>
            <button onClick={onClose} style={{ ...s.btn("ghost"), fontSize: 18, padding: "4px 10px" }}>✕</button>
          </div>
          <div style={s.body}>
            {/* Existing accounts */}
            {loading ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: 20 }}>
                {isAr ? "جاري التحميل…" : "Loading…"}
              </p>
            ) : accounts.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: "20px 0" }}>
                {isAr ? "لا يوجد وسطاء متصلون بعد." : "No broker accounts yet."}
              </p>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: "#aaa", fontSize: 12, marginBottom: 10 }}>
                  {isAr ? "حساباتك" : "Your accounts"}
                </p>
                {accounts.map(acc => {
                  const tr = testResult[acc.id];
                  return (
                    <div key={acc.id} style={s.accountRow}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>
                            {BROKERS.find(b => b.id === acc.broker)?.logo} {acc.label}
                          </div>
                          <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                            {acc.broker.toUpperCase()} · {acc.account_type}
                            {acc.broker_balance != null && (
                              <span style={{ color: gold, marginLeft: 8 }}>
                                {acc.broker_currency} {Number(acc.broker_balance).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {acc.last_synced_at && (
                            <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>
                              {isAr ? "آخر مزامنة:" : "Last sync:"} {new Date(acc.last_synced_at).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: acc.is_active ? "#4caf50" : "#888",
                          }} />
                          <button
                            onClick={() => testConnection(acc.id)}
                            disabled={testing === acc.id}
                            style={{ ...s.btn("ghost"), fontSize: 12, padding: "5px 12px" }}
                          >
                            {testing === acc.id ? "…" : (isAr ? "اختبار" : "Test")}
                          </button>
                          <button onClick={() => deleteAccount(acc.id)} style={{ ...s.btn("danger"), padding: "5px 10px", fontSize: 12 }}>✕</button>
                        </div>
                      </div>
                      {tr && (
                        <div style={{
                          marginTop: 8, padding: "7px 10px", borderRadius: 6, fontSize: 12,
                          background: tr.status === "ok" ? "#1b5e2020" : "#b7000020",
                          border: `1px solid ${tr.status === "ok" ? "#4caf5040" : "#e5393540"}`,
                          color: tr.status === "ok" ? "#66bb6a" : "#ef9a9a",
                        }}>
                          {tr.status === "ok"
                            ? `✓ ${tr.message} — Balance: ${tr.currency} ${Number(tr.balance || 0).toLocaleString()}`
                            : `✗ ${tr.message}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add broker grid */}
            <p style={{ color: "#aaa", fontSize: 12, marginBottom: 12 }}>
              {isAr ? "ربط وسيط جديد" : "Connect a new broker"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {BROKERS.map(b => (
                <div
                  key={b.id}
                  style={s.brokerCard}
                  onClick={() => startAdd(b)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = gold}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#ffffff18"}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{b.logo}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                  <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Add view ───────────────────────────────────────────────
  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setView("list")} style={{ ...s.btn("ghost"), padding: "5px 10px" }}>←</button>
            <span style={s.title}>{selected.logo} {selected.name}</span>
          </div>
          <button onClick={onClose} style={{ ...s.btn("ghost"), fontSize: 18, padding: "4px 10px" }}>✕</button>
        </div>
        <div style={s.body}>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 18 }}>{selected.desc}</p>

          {/* Account type */}
          {selected.types.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 6 }}>
                {isAr ? "نوع الحساب" : "Account Type"}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {selected.types.map(t => (
                  <button
                    key={t}
                    onClick={() => setAccountType(t)}
                    style={{
                      ...s.btn(accountType === t ? "primary" : "ghost"),
                      textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Label */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 6 }}>
              {isAr ? "اسم الحساب" : "Account Label"}
            </label>
            <input
              style={s.input}
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={isAr ? "مثال: OANDA Live" : "e.g. My OANDA Live"}
            />
          </div>

          {/* Dynamic fields */}
          {selected.fields.map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ color: "#aaa", fontSize: 12, display: "block", marginBottom: 6 }}>{f.label}</label>
              <input
                style={s.input}
                type={f.type}
                value={form[f.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                autoComplete="new-password"
              />
            </div>
          ))}

          {selected.id === "demo" && (
            <div style={{ background: "#1b5e2015", border: "1px solid #4caf5030", borderRadius: 8, padding: 12, fontSize: 13, color: "#81c784" }}>
              {isAr
                ? "حساب تجريبي برصيد افتراضي $10,000 — لا يحتاج بيانات اعتماد."
                : "Virtual $10,000 demo account — no credentials needed."}
            </div>
          )}

          {err && (
            <div style={{ color: "#ef9a9a", fontSize: 13, marginTop: 8, padding: "8px 12px", background: "#b7000015", borderRadius: 6 }}>
              {err}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={handleAdd} disabled={saving} style={{ ...s.btn("primary"), flex: 1, padding: "11px 0" }}>
              {saving ? (isAr ? "جاري الحفظ…" : "Saving…") : (isAr ? "ربط الحساب" : "Connect Account")}
            </button>
            <button onClick={() => setView("list")} style={s.btn("ghost")}>
              {isAr ? "إلغاء" : "Cancel"}
            </button>
          </div>

          <p style={{ color: "#555", fontSize: 11, marginTop: 14, lineHeight: 1.6 }}>
            {isAr
              ? "بيانات الاعتماد مشفرة بـ AES-256 قبل الحفظ في قاعدة البيانات. لن يتم عرضها مرة أخرى."
              : "Credentials are AES-256 encrypted before storage. They will never be displayed again."}
          </p>
        </div>
      </div>
    </div>
  );
}
