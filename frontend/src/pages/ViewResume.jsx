import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700&display=swap');`;

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', 'Sarabun', sans-serif; background: #0e0e0e; }
  .view-container { display: flex; flex-direction: column; height: 100vh; }
  .view-header { background: #111; border-bottom: 1px solid #2a2a2a; padding: 14px 28px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
  .view-header-info h1 { color: #fff; font-size: 16px; font-weight: 600; }
  .view-header-info p { color: #c9a84c; font-size: 11px; margin-top: 2px; }
  .view-header-actions { display: flex; gap: 10px; }
  .btn-action { padding: 8px 18px; background: #c9a84c; border: none; border-radius: 6px; color: #000; font-weight: 700; cursor: pointer; font-size: 12px; }
  .btn-back { background: #333 !important; color: #fff !important; }
  .preview-area { flex: 1; overflow-y: auto; background: #1a1a1a; display: flex; justify-content: center; padding: 36px 20px; }
  .resume-sheet { width: 794px; min-height: 1123px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); font-family: 'DM Sans', 'Sarabun', sans-serif; }
  @media print {
    @page { size: A4 portrait; margin: 0; }
    body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .view-header { display: none !important; }
    .preview-area { padding: 0 !important; background: #fff !important; overflow: visible !important; display: block !important; }
    .resume-sheet { box-shadow: none !important; margin: 0 auto !important; width: 210mm !important; }
  }
`;

function parseJson(val) {
  try { return typeof val === "string" ? JSON.parse(val) : (val ?? []); }
  catch { return []; }
}

function extractName(title) {
  if (!title) return "";
  return title.replace(/\s*[-]\s*resume$/i, "").trim();
}

function normalizeResumeData(r) {
  const expRaw = parseJson(r.experience);
  const eduRaw = parseJson(r.education);
  const skillsRaw = parseJson(r.skills);

  const experience = (Array.isArray(expRaw) ? expRaw : []).map((e, i) => ({
    id: i, role: e.role || e.position || "", org: e.org || e.company || "",
    period: e.period || "", desc: e.desc || e.description || "",
  }));

  const education = (Array.isArray(eduRaw) ? eduRaw : []).map((e, i) => ({
    id: i, degree: e.degree || "", school: e.school || "",
    period: e.period || "", desc: e.desc || e.description || "",
  }));

  let skills = [], skillDisplayMode = "simple";
  if (skillsRaw?.list) { skills = skillsRaw.list; skillDisplayMode = skillsRaw.displayMode || "simple"; }
  else if (Array.isArray(skillsRaw)) { skills = skillsRaw; }

  const template = (r.template || "classic").toLowerCase();

  return {
    name: r.name || r.ownerName || extractName(r.title) || "ชื่อ-นามสกุล",
    title: r.jobTitle || r.job_title || "",
    template: ["classic","modern","professional"].includes(template) ? template : "classic",
    themeColor: r.themeColor || r.theme_color || "#c9a84c",
    image: r.image_url || r.image || null,
    email: r.email || "", phone: r.phone || "",
    location: r.location || "", linkedin: r.linkedin || "", website: r.website || "",
    summary: r.summary || "",
    experience, education, skills, skillDisplayMode,
  };
}

function ContactChip({ icon, text }) {
  return <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.9)" }}><span>{icon}</span>{text}</span>;
}

function SkillsDisplay({ skills, skillDisplayMode, tc, dark = false }) {
  if (!skills || skills.length === 0) return null;
  const textColor = dark ? "#ddd" : "#333";
  const tagBg = dark ? "rgba(255,255,255,0.1)" : `${tc}15`;
  const tagBorder = dark ? "rgba(255,255,255,0.2)" : `${tc}40`;

  if (skillDisplayMode === "level-bar") return (
    <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
      {skills.filter(s => s.type === "Hard Skill").map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ fontSize: "11px", color: textColor, fontWeight: 500 }}>{s.name}</span>
            <span style={{ fontSize: "10px", color: tc, fontWeight: 700 }}>{s.level}%</span>
          </div>
          <div style={{ height: "3px", backgroundColor: dark ? "rgba(255,255,255,0.15)" : "#e8e8e8", borderRadius: "2px" }}>
            <div style={{ height: "100%", width: `${s.level}%`, backgroundColor: tc, borderRadius: "2px" }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (skillDisplayMode === "level-text") return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      {skills.filter(s => s.type === "Hard Skill").map((s, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: textColor }}>• {s.name}</span>
          <span style={{ fontSize: "10px", color: tc, fontWeight: 700, padding: "1px 7px", borderRadius: "10px", border: `1px solid ${tc}50` }}>{s.label}</span>
        </div>
      ))}
    </div>
  );

  if (skillDisplayMode === "category") {
    const hard = skills.filter(s => s.type === "Hard Skill");
    const soft = skills.filter(s => s.type === "Soft Skill");
    return (
      <div>
        {hard.length > 0 && <><p style={{ fontSize: "9px", fontWeight: 700, color: tc, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px" }}>Hard Skills</p><div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>{hard.map((s, i) => <span key={i} style={{ fontSize: "10px", color: textColor, background: tagBg, border: `1px solid ${tagBorder}`, padding: "3px 8px", borderRadius: "4px" }}>{s.name}</span>)}</div></>}
        {soft.length > 0 && <><p style={{ fontSize: "9px", fontWeight: 700, color: tc, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px" }}>Soft Skills</p><div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>{soft.map((s, i) => <span key={i} style={{ fontSize: "10px", color: textColor, background: tagBg, border: `1px solid ${tagBorder}`, padding: "3px 8px", borderRadius: "4px" }}>{s.name}</span>)}</div></>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {skills.map((s, i) => <span key={i} style={{ fontSize: "10.5px", padding: "3px 9px", borderRadius: "12px", backgroundColor: tagBg, border: `1px solid ${tagBorder}`, color: textColor, fontWeight: 500 }}>{s.name}</span>)}
    </div>
  );
}

/* ── CLASSIC ── */
function ClassicTemplate({ data }) {
  const tc = data.themeColor;
  return (
    <div className="resume-sheet" style={{ backgroundColor: "#fff", display: "flex", flexDirection: "row" }}>
      {/* LEFT SIDEBAR */}
      <div style={{ width: "220px", flexShrink: 0, backgroundColor: tc, display: "flex", flexDirection: "column", minHeight: "1123px" }}>
        {/* Profile */}
        <div style={{ padding: "36px 20px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: "90px", height: "90px", borderRadius: "50%", border: "3px solid rgba(255,255,255,0.85)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.15)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
            {data.image ? <img src={data.image} alt="p" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <svg width="40" height="40" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="16" r="9" fill="rgba(255,255,255,0.45)" /><path d="M4 38c0-9.39 7.61-17 17-17s17 7.61 17 17" fill="rgba(255,255,255,0.45)" /></svg>}
          </div>
          <h1 style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginBottom: "5px", lineHeight: 1.2 }}>{data.name}</h1>
          {data.title && <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.82)", fontWeight: 500, letterSpacing: "1.2px", textTransform: "uppercase" }}>{data.title}</p>}
        </div>
        <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />
        {/* Contact */}
        <div style={{ padding: "18px 20px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.55)", letterSpacing: "1.5px", textTransform: "uppercase" }}>ช่องทางติดต่อ</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {data.phone    && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.9)" }}>📞 {data.phone}</span>}
            {data.email    && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.9)", wordBreak: "break-all" }}>✉ {data.email}</span>}
            {data.location && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.9)" }}>📍 {data.location}</span>}
            {data.linkedin && <span style={{ fontSize: "10px",   color: "rgba(255,255,255,0.75)", wordBreak: "break-all" }}>in {data.linkedin}</span>}
            {data.website  && <span style={{ fontSize: "10px",   color: "rgba(255,255,255,0.75)", wordBreak: "break-all" }}>🌐 {data.website}</span>}
          </div>
        </div>
        {/* Skills */}
        {data.skills.length > 0 && <>
          <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />
          <div style={{ padding: "18px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.55)", letterSpacing: "1.5px", textTransform: "uppercase" }}>ทักษะ</p>
            <SkillsDisplay skills={data.skills} skillDisplayMode={data.skillDisplayMode} tc={tc} dark={true} />
          </div>
        </>}
        {/* Education */}
        {data.education.length > 0 && <>
          <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />
          <div style={{ padding: "18px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.55)", letterSpacing: "1.5px", textTransform: "uppercase" }}>การศึกษา</p>
            {data.education.map((e, i) => (
              <div key={i} style={{ marginBottom: i < data.education.length - 1 ? "14px" : 0 }}>
                {e.degree && <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#fff", marginBottom: "2px", lineHeight: 1.3 }}>{e.degree}</p>}
                {e.school && <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", marginBottom: "2px" }}>{e.school}</p>}
                {e.period && <p style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.55)", fontWeight: 600, marginBottom: "2px" }}>{e.period}</p>}
                {e.desc   && <p style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>{e.desc}</p>}
              </div>
            ))}
          </div>
        </>}
      </div>
      {/* RIGHT MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "6px", backgroundColor: tc, opacity: 0.15 }} />
        <div style={{ padding: "32px 36px 36px 30px", flex: 1 }}>
          {data.summary && <CSection title="เกี่ยวกับฉัน" tc={tc}><p style={{ fontSize: "12px", color: "#444", lineHeight: "1.85" }}>{data.summary}</p></CSection>}
          {data.experience.length > 0 && <CSection title="ประสบการณ์ทำงาน" tc={tc}>{data.experience.map((e, i) => <CItem key={i} title={e.role} sub={e.org} period={e.period} desc={e.desc} tc={tc} isLast={i === data.experience.length - 1} />)}</CSection>}
        </div>
      </div>
    </div>
  );
}
function CSection({ title, tc, children }) {
  return <div style={{ marginBottom: "24px" }}><div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "13px" }}><div style={{ width: "3px", height: "15px", backgroundColor: tc, borderRadius: "2px", flexShrink: 0 }} /><h2 style={{ fontSize: "10.5px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "1.4px", textTransform: "uppercase" }}>{title}</h2><div style={{ flex: 1, height: "1px", backgroundColor: "#e4e4e4" }} /></div>{children}</div>;
}
function CItem({ title, sub, period, desc, tc, isLast }) {
  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: isLast ? 0 : "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "4px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: tc }} />
        {!isLast && <div style={{ width: "1px", flex: 1, backgroundColor: "#e0e0e0", marginTop: "4px" }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#111" }}>{title || "—"}</span>
          {period && <span style={{ fontSize: "11px", color: "#888", flexShrink: 0, marginLeft: "8px" }}>{period}</span>}
        </div>
        {sub && <p style={{ fontSize: "12px", color: "#555", marginBottom: "4px" }}>{sub}</p>}
        {desc && <p style={{ fontSize: "11.5px", color: "#666", lineHeight: "1.7" }}>{desc}</p>}
      </div>
    </div>
  );
}

/* ── MODERN ── */
function ModernTemplate({ data }) {
  const tc = data.themeColor;
  return (
    <div className="resume-sheet" style={{ backgroundColor: "#fff", display: "flex", flexDirection: "row" }}>
      {/* LEFT SIDEBAR */}
      <div style={{ width: "210px", flexShrink: 0, backgroundColor: "#1a1a2e", display: "flex", flexDirection: "column", minHeight: "1123px" }}>
        {/* Profile */}
        <div style={{ padding: "36px 20px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: "90px", height: "90px", borderRadius: "50%", border: `3px solid ${tc}`, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
            {data.image ? <img src={data.image} alt="p" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <svg width="40" height="40" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="16" r="9" fill="rgba(255,255,255,0.3)" /><path d="M4 38c0-9.39 7.61-17 17-17s17 7.61 17 17" fill="rgba(255,255,255,0.3)" /></svg>}
          </div>
          <h1 style={{ fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "5px", lineHeight: 1.25 }}>{data.name}</h1>
          {data.title && <p style={{ fontSize: "9.5px", color: tc, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>{data.title}</p>}
        </div>
        <div style={{ margin: "0 20px", height: "2px", backgroundColor: tc, borderRadius: "1px", opacity: 0.6 }} />
        {/* Contact */}
        <div style={{ padding: "18px 20px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "8.5px", fontWeight: 800, color: tc, letterSpacing: "1.5px", textTransform: "uppercase" }}>ติดต่อ</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {data.phone    && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)" }}>📞 {data.phone}</span>}
            {data.email    && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", wordBreak: "break-all" }}>✉ {data.email}</span>}
            {data.location && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)" }}>📍 {data.location}</span>}
            {data.linkedin && <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", wordBreak: "break-all" }}>in {data.linkedin}</span>}
            {data.website  && <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", wordBreak: "break-all" }}>🌐 {data.website}</span>}
          </div>
        </div>
        {/* Skills */}
        {data.skills.length > 0 && <>
          <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
          <div style={{ padding: "18px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "8.5px", fontWeight: 800, color: tc, letterSpacing: "1.5px", textTransform: "uppercase" }}>ทักษะ</p>
            <SkillsDisplay skills={data.skills} skillDisplayMode={data.skillDisplayMode} tc={tc} dark={true} />
          </div>
        </>}
        {/* Education */}
        {data.education.length > 0 && <>
          <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
          <div style={{ padding: "18px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "8.5px", fontWeight: 800, color: tc, letterSpacing: "1.5px", textTransform: "uppercase" }}>การศึกษา</p>
            {data.education.map((e, i) => (
              <div key={i} style={{ marginBottom: i < data.education.length - 1 ? "14px" : 0 }}>
                {e.degree && <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#fff", marginBottom: "2px", lineHeight: 1.3 }}>{e.degree}</p>}
                {e.school && <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.65)", marginBottom: "2px" }}>{e.school}</p>}
                {e.period && <p style={{ fontSize: "9.5px", color: tc, fontWeight: 600, marginBottom: "2px" }}>{e.period}</p>}
                {e.desc   && <p style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>{e.desc}</p>}
              </div>
            ))}
          </div>
        </>}
      </div>
      {/* RIGHT MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "5px", backgroundColor: tc }} />
        <div style={{ padding: "28px 36px 36px 28px", flex: 1 }}>
          {data.summary && <MSection title="ข้อมูลโดยย่อ" tc={tc}><p style={{ fontSize: "11.5px", color: "#444", lineHeight: "1.85" }}>{data.summary}</p></MSection>}
          {data.experience.length > 0 && <MSection title="ประสบการณ์การทำงาน" tc={tc}>
            {data.experience.map((e, i) => (
              <div key={i} style={{ marginBottom: i < data.experience.length - 1 ? "18px" : 0, paddingBottom: i < data.experience.length - 1 ? "18px" : 0, borderBottom: i < data.experience.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3px" }}>
                  <p style={{ fontWeight: 700, fontSize: "12.5px", color: "#111", margin: 0 }}>{e.role || "—"}</p>
                  {e.period && <span style={{ fontSize: "10px", color: tc, fontWeight: 700, backgroundColor: `${tc}15`, padding: "2px 8px", borderRadius: "10px", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>{e.period}</span>}
                </div>
                {e.org  && <p style={{ fontSize: "11px", color: "#666", fontStyle: "italic", marginBottom: "5px" }}>{e.org}</p>}
                {e.desc && <p style={{ fontSize: "11px", color: "#555", lineHeight: "1.75" }}>{e.desc}</p>}
              </div>
            ))}
          </MSection>}
        </div>
      </div>
    </div>
  );
}
function MSection({ title, tc, children }) {
  return <div style={{ marginBottom: "22px" }}><div style={{ display: "inline-block", border: `1.5px solid ${tc}`, borderRadius: "20px", padding: "4px 16px", marginBottom: "12px" }}><span style={{ fontSize: "11px", fontWeight: 700, color: tc }}>{title}</span></div>{children}</div>;
}

/* ── PROFESSIONAL ── */
function ProfessionalTemplate({ data }) {
  const tc = data.themeColor;
  return (
    <div className="resume-sheet" style={{ backgroundColor: "#fff", display: "flex", flexDirection: "row" }}>
      {/* LEFT SIDEBAR */}
      <div style={{ width: "215px", flexShrink: 0, backgroundColor: "#2c2c3e", display: "flex", flexDirection: "column", minHeight: "1123px" }}>
        {/* Profile header with theme color */}
        <div style={{ backgroundColor: tc, padding: "36px 20px 28px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          {data.image && <div style={{ width: "90px", height: "90px", borderRadius: "50%", border: "4px solid rgba(255,255,255,0.9)", overflow: "hidden", marginBottom: "14px", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}><img src={data.image} alt="p" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
          <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "6px", letterSpacing: "0.3px" }}>{data.name}</h1>
          {data.title && <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.88)", fontStyle: "italic" }}>{data.title}</p>}
        </div>
        {/* Contact */}
        <div style={{ padding: "20px 20px 16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "8.5px", fontWeight: 700, color: tc, letterSpacing: "1.5px", textTransform: "uppercase" }}>ข้อมูลติดต่อ</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {data.email    && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", wordBreak: "break-all" }}>✉ {data.email}</span>}
            {data.phone    && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)" }}>📞 {data.phone}</span>}
            {data.location && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)" }}>📍 {data.location}</span>}
            {data.linkedin && <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", wordBreak: "break-all" }}>in {data.linkedin}</span>}
            {data.website  && <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", wordBreak: "break-all" }}>🌐 {data.website}</span>}
          </div>
        </div>
        {/* Skills */}
        {data.skills.length > 0 && <>
          <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
          <div style={{ padding: "16px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "8.5px", fontWeight: 700, color: tc, letterSpacing: "1.5px", textTransform: "uppercase" }}>ทักษะความชำนาญ</p>
            <SkillsDisplay skills={data.skills} skillDisplayMode={data.skillDisplayMode} tc={tc} dark={true} />
          </div>
        </>}
        {/* Education */}
        {data.education.length > 0 && <>
          <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
          <div style={{ padding: "16px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "8.5px", fontWeight: 700, color: tc, letterSpacing: "1.5px", textTransform: "uppercase" }}>การศึกษา</p>
            {data.education.map((e, i) => (
              <div key={i} style={{ marginBottom: i < data.education.length - 1 ? "14px" : 0 }}>
                {e.degree && <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#fff", marginBottom: "2px", lineHeight: 1.3 }}>{e.degree}</p>}
                {e.school && <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.65)", fontStyle: "italic", marginBottom: "2px" }}>{e.school}</p>}
                {e.period && <p style={{ fontSize: "9.5px", color: tc, fontWeight: 600, marginBottom: "2px" }}>{e.period}</p>}
                {e.desc   && <p style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>{e.desc}</p>}
              </div>
            ))}
          </div>
        </>}
      </div>
      {/* RIGHT MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "5px", backgroundColor: tc }} />
        <div style={{ padding: "30px 36px 36px 30px", flex: 1 }}>
          {data.summary && <PSection title="เกี่ยวกับฉัน" color={tc}><p style={{ fontSize: "12px", color: "#444", lineHeight: "1.75" }}>{data.summary}</p></PSection>}
          {data.experience.length > 0 && <PSection title="ประสบการณ์ทำงาน" color={tc}>{data.experience.map((e, i) => <PItem key={i} title={e.role} sub={e.org} period={e.period} desc={e.desc} tc={tc} isLast={i === data.experience.length - 1} />)}</PSection>}
        </div>
      </div>
    </div>
  );
}
function PSection({ title, color, children }) {
  return <div style={{ marginBottom: "26px" }}><div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}><div style={{ width: "4px", height: "18px", backgroundColor: color, borderRadius: "2px" }} /><h2 style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "1.2px", textTransform: "uppercase" }}>{title}</h2><div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }} /></div>{children}</div>;
}
function PItem({ title, sub, period, desc, tc, isLast }) {
  return (
    <div style={{ display: "flex", gap: "14px", marginBottom: isLast ? 0 : "18px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: tc, marginTop: "4px" }} />
        {!isLast && <div style={{ width: "1px", flex: 1, backgroundColor: "#e0e0e0", marginTop: "4px" }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{title || "—"}</span>
          {period && <span style={{ fontSize: "11px", color: tc, fontWeight: 600 }}>{period}</span>}
        </div>
        {sub && <p style={{ fontSize: "12px", color: "#666", fontStyle: "italic", marginBottom: "5px" }}>{sub}</p>}
        {desc && <p style={{ fontSize: "12px", color: "#555", lineHeight: "1.6" }}>{desc}</p>}
      </div>
    </div>
  );
}

/* ── ROUTER ── */
function ResumeContent({ data }) {
  if (data.template === "modern") return <ModernTemplate data={data} />;
  if (data.template === "professional") return <ProfessionalTemplate data={data} />;
  return <ClassicTemplate data={data} />;
}

/* ── MAIN ── */
export default function ViewResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // ถ้ามาจาก hr-feed ให้กลับไป hr-feed, ไม่งั้นกลับ /feed
  const backPath = location.state?.from || "/feed";

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/resumes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          const normalized = normalizeResumeData(result.resume || result);
          setResumeData(normalized);

          // เช็คว่าเป็นเจ้าของหรือไม่
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const userId = payload.id || payload.userId || payload.sub;
            setIsOwner(String(userId) === String((result.resume || result).user_id));
          } catch { setIsOwner(false); }
        } else { setResumeData(null); }
      } catch (err) { console.error(err); setResumeData(null); }
      finally { setLoading(false); }
    };
    fetchResume();
  }, [id]);

  if (loading) return <><style>{fonts}</style><style>{globalStyles}</style><div style={{ color: "#c9a84c", textAlign: "center", padding: "80px", fontSize: "16px", background: "#0e0e0e", height: "100vh" }}>⏳ กำลังโหลด...</div></>;
  if (!resumeData) return <><style>{fonts}</style><style>{globalStyles}</style><div style={{ color: "#fff", textAlign: "center", padding: "80px", background: "#0e0e0e", height: "100vh" }}><p style={{ fontSize: "20px", marginBottom: "20px" }}>ไม่พบข้อมูล</p><button onClick={() => navigate(backPath)} style={{ padding: "10px 24px", background: "#c9a84c", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}>← กลับ</button></div></>;

  return (
    <>
      <style>{fonts}</style>
      <style>{globalStyles}</style>
      <div className="view-container">
        <header className="view-header">
          <div className="view-header-info">
            <h1>{resumeData.name} - Resume</h1>
            <p>Template: {resumeData.template} · Color: {resumeData.themeColor}</p>
          </div>
          <div className="view-header-actions">
            {isOwner && (
              <button
                className="btn-action"
                style={{ background: "#2563eb" }}
                onClick={() => navigate(`/resume?edit=${id}`)}
              >
                ✏️ แก้ไข Resume
              </button>
            )}
            <button className="btn-action" onClick={() => window.print()}>🖨️ พิมพ์ / PDF</button>
            <button className="btn-action btn-back" onClick={() => navigate(backPath)}>← กลับ</button>
          </div>
        </header>
        <div className="preview-area">
          <ResumeContent data={resumeData} />
        </div>
      </div>
    </>
  );
}