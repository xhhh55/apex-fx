/* ════════════════════════════════════════════════════════
   KYC TAB — 4-step identity verification wizard
   Steps: Personal Info → Document Upload → Address → Review
════════════════════════════════════════════════════════ */
import React, { useState, useEffect } from "react";

const T = {
  title:        { ar: "🪪 التحقق من الهوية", en: "🪪 Identity Verification" },
  sub:          { ar: "مطلوب للتداول الحقيقي وسحب الأموال", en: "Required for real trading and withdrawals" },
  step1:        { ar: "المعلومات الشخصية", en: "Personal Info" },
  step2:        { ar: "وثائق الهوية", en: "ID Documents" },
  step3:        { ar: "العنوان", en: "Address" },
  step4:        { ar: "المراجعة", en: "Review" },
  first_name:   { ar: "الاسم الأول", en: "First Name" },
  last_name:    { ar: "الاسم الأخير", en: "Last Name" },
  dob:          { ar: "تاريخ الميلاد", en: "Date of Birth" },
  nationality:  { ar: "الجنسية", en: "Nationality" },
  phone:        { ar: "رقم الهاتف", en: "Phone Number" },
  id_type:      { ar: "نوع الوثيقة", en: "Document Type" },
  id_number:    { ar: "رقم الوثيقة", en: "Document Number" },
  id_expiry:    { ar: "تاريخ الانتهاء", en: "Expiry Date" },
  upload_front: { ar: "صورة الوجه الأمامي", en: "Front Side Photo" },
  upload_back:  { ar: "صورة الوجه الخلفي", en: "Back Side Photo" },
  upload_self:  { ar: "صورة السيلفي", en: "Selfie Photo" },
  street:       { ar: "الشارع", en: "Street Address" },
  city:         { ar: "المدينة", en: "City" },
  country:      { ar: "الدولة", en: "Country" },
  postal:       { ar: "الرمز البريدي", en: "Postal Code" },
  proof:        { ar: "إثبات العنوان (فاتورة)", en: "Address Proof (Bill)" },
  next:         { ar: "التالي", en: "Next" },
  back:         { ar: "السابق", en: "Back" },
  submit:       { ar: "تقديم للمراجعة", en: "Submit for Review" },
  status_pend:  { ar: "قيد المراجعة", en: "Under Review" },
  status_appr:  { ar: "موافق عليه", en: "Approved" },
  status_rej:   { ar: "مرفوض", en: "Rejected" },
  status_none:  { ar: "لم يُقدَّم", en: "Not Submitted" },
  est_time:     { ar: "وقت المراجعة المتوقع: 24-48 ساعة", en: "Estimated review time: 24-48 hours" },
  ai_risk:      { ar: "تقييم المخاطر بالذكاء الاصطناعي", en: "AI Risk Assessment" },
  running_ai:   { ar: "جارٍ التحليل...", en: "Analyzing..." },
  doc_passport: { ar: "جواز سفر", en: "Passport" },
  doc_national: { ar: "بطاقة هوية وطنية", en: "National ID" },
  doc_license:  { ar: "رخصة القيادة", en: "Driver's License" },
  saved:        { ar: "تم الحفظ التلقائي", en: "Auto-saved" },
  required:     { ar: "هذا الحقل مطلوب", en: "This field is required" },
  tip_selfie:   { ar: "تأكد أن وجهك واضح وغير محجوب", en: "Make sure your face is clear and unobstructed" },
  tip_doc:      { ar: "يجب أن تكون الوثيقة سارية ومقروءة", en: "Document must be valid and clearly readable" },
};

const t = (k, isAr) => T[k]?.[isAr ? "ar" : "en"] ?? k;

const NATIONALITIES = ["Saudi Arabia","UAE","Kuwait","Qatar","Bahrain","Oman","Egypt","Jordan","Iraq","Lebanon","USA","UK","Germany","France","Other"];
const COUNTRIES = [...NATIONALITIES];
const DOC_TYPES = ["doc_passport","doc_national","doc_license"];

const STORAGE_KEY = "apex_kyc";

const STEPS = ["step1","step2","step3","step4"];

function ProgressBar({ step, theme, isAr, labels }) {
  const primary = theme?.primary || "#D4A843";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 40 }}>
      {[0,1,2,3].map(i => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 15, transition: "all .3s",
              background: i < step ? primary : i === step ? primary : "rgba(255,255,255,0.08)",
              color: i <= step ? "#000" : "#666",
              border: i === step ? `3px solid ${primary}` : "3px solid transparent",
              boxShadow: i === step ? `0 0 16px ${primary}66` : "none",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: 11, color: i <= step ? primary : "#555", whiteSpace: "nowrap", maxWidth: 80, textAlign: "center" }}>
              {labels[i]}
            </div>
          </div>
          {i < 3 && <div style={{ width: 60, height: 2, background: i < step ? primary : "rgba(255,255,255,0.1)", transition: "all .3s", flexShrink: 0 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function Field({ label, children, error, required }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
      {error && <div style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function UploadBox({ label, tip, value, onChange, primary }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 }}>{label}</label>
      <div style={{
        border: `2px dashed ${value ? primary : "rgba(255,255,255,0.15)"}`,
        borderRadius: 12, padding: "20px", textAlign: "center", cursor: "pointer",
        background: value ? `${primary}10` : "rgba(255,255,255,0.03)", transition: "all .2s",
        position: "relative",
      }}
      onClick={() => document.getElementById(`kyc_${label}`).click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onChange(f.name); }}
      >
        <input id={`kyc_${label}`} type="file" accept="image/*,.pdf" style={{ display: "none" }}
          onChange={e => { if (e.target.files[0]) onChange(e.target.files[0].name); }} />
        {value
          ? <><div style={{ fontSize: 24, marginBottom: 4 }}>✅</div><div style={{ color: primary, fontSize: 13 }}>{value}</div></>
          : <><div style={{ fontSize: 28, marginBottom: 4 }}>📄</div><div style={{ color: "#666", fontSize: 13 }}>{tip || "Click or drag to upload"}</div></>
        }
      </div>
    </div>
  );
}

export default function KYCTab({ theme, lang, user }) {
  const isAr = lang === "ar";
  const primary = theme?.primary || "#D4A843";
  const dir = isAr ? "rtl" : "ltr";

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [aiRisk, setAiRisk] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const [data, setData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        firstName: "", lastName: "", dob: "", nationality: "Saudi Arabia", phone: "",
        docType: "doc_passport", docNumber: "", docExpiry: "",
        uploadFront: "", uploadBack: "", uploadSelfie: "",
        street: "", city: "", country: "Saudi Arabia", postal: "", uploadProof: "",
        status: "none",
        ...saved,
      };
    } catch { return { firstName:"",lastName:"",dob:"",nationality:"Saudi Arabia",phone:"",docType:"doc_passport",docNumber:"",docExpiry:"",uploadFront:"",uploadBack:"",uploadSelfie:"",street:"",city:"",country:"Saudi Arabia",postal:"",uploadProof:"",status:"none" }; }
  });

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  // Autosave
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSavedMsg(true);
    const t = setTimeout(() => setSavedMsg(false), 1500);
    return () => clearTimeout(t);
  }, [data]);

  // Check if already submitted
  useEffect(() => {
    if (data.status === "pending" || data.status === "approved") setSubmitted(true);
  }, []);

  const inp = (k, type = "text", placeholder = "") => (
    <input
      type={type}
      value={data[k]}
      placeholder={placeholder}
      onChange={e => set(k, e.target.value)}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
        background: "rgba(255,255,255,0.07)", border: `1px solid ${errors[k] ? "#EF4444" : "rgba(255,255,255,0.15)"}`,
        color: "#fff", outline: "none", boxSizing: "border-box",
      }}
    />
  );

  const sel = (k, opts) => (
    <select value={data[k]} onChange={e => set(k, e.target.value)} style={{
      width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
      background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none",
    }}>
      {opts.map(o => <option key={o.val || o} value={o.val || o}>{o.label || (typeof o === "string" ? o : o.val)}</option>)}
    </select>
  );

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!data.firstName.trim()) e.firstName = t("required", isAr);
      if (!data.lastName.trim())  e.lastName  = t("required", isAr);
      if (!data.dob)              e.dob       = t("required", isAr);
      if (!data.phone.trim())     e.phone     = t("required", isAr);
    }
    if (s === 1) {
      if (!data.docNumber.trim())  e.docNumber  = t("required", isAr);
      if (!data.docExpiry)         e.docExpiry  = t("required", isAr);
      if (!data.uploadFront)       e.uploadFront = t("required", isAr);
    }
    if (s === 2) {
      if (!data.street.trim()) e.street = t("required", isAr);
      if (!data.city.trim())   e.city   = t("required", isAr);
      if (!data.postal.trim()) e.postal = t("required", isAr);
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep(s => s + 1); };
  const back = () => { setStep(s => s - 1); setErrors({}); };

  const runAI = async () => {
    setAiLoading(true);
    try {
      const { proxyAI } = await import("../utils/ai");
      const prompt = `KYC risk assessment for: Name: ${data.firstName} ${data.lastName}, Nationality: ${data.nationality}, Country: ${data.country}, Doc: ${t(data.docType, false)}. Give a brief risk level (Low/Medium/High) with 2-sentence explanation. Be concise.`;
      const res = await proxyAI(prompt);
      setAiRisk(res);
    } catch {
      setAiRisk(isAr ? "خطأ في التحليل. يرجى المحاولة مرة أخرى." : "Analysis error. Please try again.");
    }
    setAiLoading(false);
  };

  const submit = () => {
    set("status", "pending");
    setSubmitted(true);
  };

  const statusColor = { none:"#666", pending:"#F59E0B", approved:"#10B981", rejected:"#EF4444" };
  const statusIcon  = { none:"○", pending:"⏳", approved:"✅", rejected:"❌" };

  const card = { background:"rgba(255,255,255,0.04)", border:`1px solid ${primary}22`, borderRadius:16, padding:"28px 32px" };

  // ── ALREADY SUBMITTED ──
  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px", direction: dir }}>
        <h2 style={{ color: primary, marginBottom: 8 }}>{t("title", isAr)}</h2>
        <div style={{ ...card, textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {statusIcon[data.status] || "○"}
          </div>
          <h3 style={{ fontSize: 22, color: statusColor[data.status], marginBottom: 12 }}>
            {t(`status_${data.status}`, isAr)}
          </h3>
          <p style={{ color: "#888", marginBottom: 24 }}>{t("est_time", isAr)}</p>

          {data.status === "pending" && (
            <div style={{ ...card, textAlign: isAr ? "right" : "left", padding: "20px 24px" }}>
              <div style={{ marginBottom: 8, fontWeight: 700, color: "#aaa", fontSize: 14 }}>
                {t("ai_risk", isAr)}
              </div>
              {aiRisk
                ? <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.7 }}>{aiRisk}</p>
                : <button onClick={runAI} disabled={aiLoading} style={{
                    padding: "8px 20px", borderRadius: 8, background: aiLoading ? "#333" : primary,
                    color: aiLoading ? "#888" : "#000", border: "none", cursor: aiLoading ? "default" : "pointer", fontWeight: 700,
                  }}>
                    {aiLoading ? t("running_ai", isAr) : (isAr ? "🤖 تحليل المخاطر" : "🤖 Assess Risk")}
                  </button>
              }
            </div>
          )}

          {data.status === "rejected" && (
            <button onClick={() => { set("status","none"); setSubmitted(false); setStep(0); }} style={{
              marginTop: 20, padding: "12px 28px", borderRadius: 10, background: primary,
              color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15,
            }}>
              {isAr ? "إعادة التقديم" : "Resubmit"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px", direction: dir }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: primary, fontSize: 22, marginBottom: 4 }}>{t("title", isAr)}</h2>
        <p style={{ color: "#888", fontSize: 14 }}>{t("sub", isAr)}</p>
        {savedMsg && <span style={{ fontSize: 12, color: "#10B981", marginTop: 4, display: "block" }}>✓ {t("saved", isAr)}</span>}
      </div>

      {/* Progress */}
      <ProgressBar step={step} theme={theme} isAr={isAr} labels={STEPS.map(s => t(s, isAr))} />

      {/* Step content */}
      <div style={card}>
        {/* ── STEP 0: Personal Info ── */}
        {step === 0 && (
          <div>
            <h3 style={{ color: primary, marginBottom: 24 }}>{t("step1", isAr)}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Field label={t("first_name", isAr)} error={errors.firstName} required>
                {inp("firstName", "text", isAr ? "محمد" : "John")}
              </Field>
              <Field label={t("last_name", isAr)} error={errors.lastName} required>
                {inp("lastName", "text", isAr ? "أحمد" : "Smith")}
              </Field>
            </div>
            <Field label={t("dob", isAr)} error={errors.dob} required>
              {inp("dob", "date")}
            </Field>
            <Field label={t("nationality", isAr)}>
              {sel("nationality", NATIONALITIES)}
            </Field>
            <Field label={t("phone", isAr)} error={errors.phone} required>
              {inp("phone", "tel", "+966 5XX XXX XXX")}
            </Field>
          </div>
        )}

        {/* ── STEP 1: Documents ── */}
        {step === 1 && (
          <div>
            <h3 style={{ color: primary, marginBottom: 24 }}>{t("step2", isAr)}</h3>
            <Field label={t("id_type", isAr)}>
              {sel("docType", DOC_TYPES.map(k => ({ val: k, label: t(k, isAr) })))}
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Field label={t("id_number", isAr)} error={errors.docNumber} required>
                {inp("docNumber", "text", "A12345678")}
              </Field>
              <Field label={t("id_expiry", isAr)} error={errors.docExpiry} required>
                {inp("docExpiry", "date")}
              </Field>
            </div>
            <div style={{ background: `${primary}11`, border:`1px solid ${primary}33`, borderRadius:8, padding:"10px 14px", marginBottom:20, fontSize:13, color:primary }}>
              💡 {t("tip_doc", isAr)}
            </div>
            <UploadBox label={t("upload_front", isAr)} value={data.uploadFront} onChange={v => set("uploadFront",v)} primary={primary} />
            {errors.uploadFront && <div style={{ color:"#EF4444", fontSize:12, marginTop:-14, marginBottom:14 }}>{errors.uploadFront}</div>}
            <UploadBox label={t("upload_back", isAr)} value={data.uploadBack} onChange={v => set("uploadBack",v)} primary={primary} />
            <div style={{ background:`rgba(255,255,255,0.04)`, border:`1px solid rgba(255,255,255,0.1)`, borderRadius:8, padding:"10px 14px", marginBottom:4, fontSize:13, color:"#aaa" }}>
              📸 {t("tip_selfie", isAr)}
            </div>
            <UploadBox label={t("upload_self", isAr)} value={data.uploadSelfie} onChange={v => set("uploadSelfie",v)} primary={primary} />
          </div>
        )}

        {/* ── STEP 2: Address ── */}
        {step === 2 && (
          <div>
            <h3 style={{ color: primary, marginBottom: 24 }}>{t("step3", isAr)}</h3>
            <Field label={t("street", isAr)} error={errors.street} required>
              {inp("street", "text", isAr ? "شارع الأمير محمد، رقم 45" : "123 Main Street")}
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Field label={t("city", isAr)} error={errors.city} required>
                {inp("city", "text", isAr ? "الرياض" : "Riyadh")}
              </Field>
              <Field label={t("postal", isAr)} error={errors.postal} required>
                {inp("postal", "text", "11234")}
              </Field>
            </div>
            <Field label={t("country", isAr)}>
              {sel("country", COUNTRIES)}
            </Field>
            <UploadBox label={t("proof", isAr)} value={data.uploadProof} onChange={v => set("uploadProof",v)} primary={primary}
              tip={isAr ? "فاتورة كهرباء أو ماء أو بنك (< 3 أشهر)" : "Utility or bank statement (< 3 months)"} />
          </div>
        )}

        {/* ── STEP 3: Review ── */}
        {step === 3 && (
          <div>
            <h3 style={{ color: primary, marginBottom: 24 }}>{t("step4", isAr)}</h3>
            {[
              { section: t("step1", isAr), items: [
                [t("first_name",isAr), `${data.firstName} ${data.lastName}`],
                [t("dob",isAr), data.dob],
                [t("nationality",isAr), data.nationality],
                [t("phone",isAr), data.phone],
              ]},
              { section: t("step2", isAr), items: [
                [t("id_type",isAr), t(data.docType, isAr)],
                [t("id_number",isAr), data.docNumber],
                [t("id_expiry",isAr), data.docExpiry],
                [t("upload_front",isAr), data.uploadFront || "—"],
                [t("upload_self",isAr), data.uploadSelfie || "—"],
              ]},
              { section: t("step3", isAr), items: [
                [t("street",isAr), data.street],
                [t("city",isAr), data.city],
                [t("country",isAr), data.country],
                [t("postal",isAr), data.postal],
              ]},
            ].map(sec => (
              <div key={sec.section} style={{ marginBottom: 24 }}>
                <div style={{ color: primary, fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom:`1px solid ${primary}33`, paddingBottom:6 }}>
                  {sec.section}
                </div>
                {sec.items.map(([k, v]) => v ? (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", fontSize:13, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color:"#888" }}>{k}</span>
                    <span style={{ color:"#ddd", maxWidth:"60%", textAlign: isAr ? "left" : "right", wordBreak:"break-all" }}>{v}</span>
                  </div>
                ) : null)}
              </div>
            ))}

            {/* AI Risk */}
            <div style={{ marginTop:24, padding:"16px 20px", background:`${primary}0d`, border:`1px solid ${primary}33`, borderRadius:12 }}>
              <div style={{ fontWeight:700, color:primary, fontSize:14, marginBottom:10 }}>{t("ai_risk",isAr)}</div>
              {aiRisk
                ? <p style={{ color:"#ccc", fontSize:14, lineHeight:1.7 }}>{aiRisk}</p>
                : <button onClick={runAI} disabled={aiLoading} style={{
                    padding:"8px 20px", borderRadius:8, background: aiLoading?"#333":primary,
                    color: aiLoading?"#888":"#000", border:"none", cursor: aiLoading?"default":"pointer", fontWeight:700, fontSize:13,
                  }}>
                    {aiLoading ? `⏳ ${t("running_ai",isAr)}` : `🤖 ${isAr?"تحليل المخاطر":"Run Risk Analysis"}`}
                  </button>
              }
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:24 }}>
        <button onClick={back} disabled={step===0} style={{
          padding:"12px 24px", borderRadius:10, background:"rgba(255,255,255,0.07)",
          color: step===0?"#444":"#ccc", border:"1px solid rgba(255,255,255,0.12)",
          cursor: step===0?"default":"pointer", fontWeight:600, fontSize:14,
        }}>
          ← {t("back", isAr)}
        </button>

        {step < 3
          ? <button onClick={next} style={{
              padding:"12px 28px", borderRadius:10, background:primary,
              color:"#000", border:"none", cursor:"pointer", fontWeight:700, fontSize:14,
            }}>
              {t("next", isAr)} →
            </button>
          : <button onClick={submit} style={{
              padding:"12px 28px", borderRadius:10, background:primary,
              color:"#000", border:"none", cursor:"pointer", fontWeight:700, fontSize:14,
            }}>
              ✅ {t("submit", isAr)}
            </button>
        }
      </div>
    </div>
  );
}
