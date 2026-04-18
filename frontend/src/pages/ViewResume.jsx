import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0e0e0e; }

  .view-container { display: flex; flex-direction: column; height: 100vh; }

  .view-header {
    background: #111;
    border-bottom: 1px solid #2a2a2a;
    padding: 16px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .view-header-info h1 { color: #fff; font-size: 18px; margin-bottom: 4px; }
  .view-header-info p { color: #c9a84c; font-size: 12px; }

  .view-header-actions { display: flex; gap: 12px; }

  .btn-action {
    padding: 10px 16px;
    background: #c9a84c;
    border: none;
    border-radius: 6px;
    color: #000;
    font-weight: 600;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;
  }
  .btn-action:hover { background: #e8c97a; }

  .preview-area {
    flex: 1;
    overflow-y: auto;
    background: #1a1a1a;
    display: flex;
    justify-content: center;
    padding: 40px 20px;
  }

  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: #c9a84c;
    font-size: 16px;
    background: #0e0e0e;
  }

  .not-found-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #0e0e0e;
    color: #fff;
    gap: 20px;
  }

  @media print {
    @page { size: A4 portrait; margin: 0; }
    body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .view-header { display: none !important; }
    .preview-area { padding: 0 !important; background: #fff !important; overflow: visible !important; display: block !important; }
    .resume-a4-sheet { width: 210mm !important; min-height: 297mm !important; box-shadow: none !important; margin: 0 auto !important; }
  }
`;

/* ─────────────────────────────────────────────
   แปลงข้อมูลจาก Backend → flat data object
   Backend เก็บในรูป sections[] แต่บาง Backend
   อาจส่งกลับมาเป็น experience[], education[] ตรงๆ
   ฟังก์ชันนี้รองรับทั้งสองรูปแบบ
───────────────────────────────────────────── */
function normalizeResumeData(resume) {
  // ถ้า Backend ส่ง sections[] มา (รูปแบบใหม่)
  if (resume.sections && Array.isArray(resume.sections)) {
    const sections = resume.sections;

    const summarySection = sections.find(s => s.type === "summary");
    const experienceSections = sections.filter(s => s.type === "experience").sort((a, b) => (a.order || 0) - (b.order || 0));
    const educationSections = sections.filter(s => s.type === "education").sort((a, b) => (a.order || 0) - (b.order || 0));
    const skillsSection = sections.find(s => s.type === "skills");

    return {
      name: resume.name || resume.ownerName || extractNameFromTitle(resume.title) || "",
      title: resume.jobTitle || resume.subtitle || "",
      template: resume.template || "classic",
      themeColor: resume.themeColor || "#d4af37",
      image: resume.image || null,
      email: resume.email || "",
      phone: resume.phone || "",
      location: resume.location || "",
      linkedin: resume.linkedin || "",
      website: resume.website || "",
      summary: summarySection?.content?.text || resume.summary || "",
      experience: experienceSections.map((s, i) => ({
        id: s.id || i,
        role: s.content?.role || s.content?.position || "",
        org: s.content?.org || s.content?.company || "",
        period: s.content?.period || "",
        desc: s.content?.desc || s.content?.description || "",
      })),
      education: educationSections.map((s, i) => ({
        id: s.id || i,
        degree: s.content?.degree || "",
        school: s.content?.school || "",
        period: s.content?.period || "",
        desc: s.content?.desc || s.content?.description || "",
      })),
      skillDisplayMode: skillsSection?.content?.displayMode || "simple",
      skills: (skillsSection?.content?.list || []).map((s, i) => ({
        id: s.id || i,
        name: s.name || s,
        type: s.type || "Hard Skill",
        level: s.level || 80,
        label: s.label || "ดีมาก",
      })),
    };
  }

  // ถ้า Backend ส่งข้อมูลในรูปแบบเก่า (experience[], education[] ที่มี content wrapper)
  const experience = (resume.experience || []).map((exp, i) => {
    const c = exp.content || exp;
    return {
      id: exp.id || i,
      role: c.role || c.position || "",
      org: c.org || c.company || "",
      period: c.period || "",
      desc: c.desc || c.description || "",
    };
  });

  const education = (resume.education || []).map((edu, i) => {
    const c = edu.content || edu;
    return {
      id: edu.id || i,
      degree: c.degree || "",
      school: c.school || "",
      period: c.period || "",
      desc: c.desc || c.description || "",
    };
  });

  let skills = [];
  let skillDisplayMode = "simple";
  if (resume.skills) {
    if (Array.isArray(resume.skills)) {
      skills = resume.skills.map((s, i) => ({
        id: s.id || i,
        name: typeof s === "string" ? s : (s.name || s.label || ""),
        type: s.type || "Hard Skill",
        level: s.level || 80,
        label: s.label || "ดีมาก",
      }));
    } else if (resume.skills.list) {
      skills = resume.skills.list.map((s, i) => ({ id: s.id || i, name: s.name || "", type: s.type || "Hard Skill", level: s.level || 80, label: s.label || "ดีมาก" }));
      skillDisplayMode = resume.skills.displayMode || "simple";
    }
  }

  return {
    name: resume.name || resume.ownerName || extractNameFromTitle(resume.title) || "",
    title: resume.jobTitle || resume.subtitle || "",
    template: resume.template || "classic",
    themeColor: resume.themeColor || "#d4af37",
    image: resume.image || null,
    email: resume.email || "",
    phone: resume.phone || "",
    location: resume.location || "",
    linkedin: resume.linkedin || "",
    website: resume.website || "",
    summary: resume.summary || "",
    experience,
    education,
    skillDisplayMode,
    skills,
  };
}

// ดึงชื่อออกจาก title เช่น "ณิชา สุวรรณโชติ - Resume" → "ณิชา สุวรรณโชติ"
function extractNameFromTitle(title) {
  if (!title) return "";
  return title.replace(/\s*[-–]\s*resume$/i, "").trim();
}

/* ─────────────────────────────────────────────
   SVG ICONS & HELPERS
───────────────────────────────────────────── */
const ICON_MAIL  = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M0 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V4zm2-1a1 1 0 00-1 1v.217l7 4.2 7-4.2V4a1 1 0 00-1-1H2zm13 2.383l-4.758 2.855L15 11.114V5.383zm-.034 6.876l-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 002 13h12a1 1 0 00.966-.741zM1 11.114l4.758-2.876L1 5.383v5.731z"/></svg>;
const ICON_PHONE = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M3.654 1.328a.678.678 0 00-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 004.168 6.608 17.6 17.6 0 006.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 00-.063-1.015l-2.307-1.794a.678.678 0 00-.58-.122l-2.19.547a1.745 1.745 0 01-1.657-.459L5.482 9.5a1.745 1.745 0 01-.46-1.657l.548-2.19a.678.678 0 00-.122-.58L3.654 1.328z"/></svg>;
const ICON_PIN   = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M8 16s6-5.686 6-10A6 6 0 002 6c0 4.314 6 10 6 10zm0-7a3 3 0 110-6 3 3 0 010 6z"/></svg>;
const ICON_LI    = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>;
const ICON_WEB   = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 005.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 01.64-1.539 6.7 6.7 0 01.597-.933A7.025 7.025 0 001.97 4h2.12zm-.24 1.5a12.97 12.97 0 00-.087 1.5c0 .527.033 1.023.087 1.5h2.763a14.37 14.37 0 01-.085-1.5c0-.528.033-1.025.085-1.5H3.85zm1.166 4H3.054a7.025 7.025 0 003.86 2.472 6.676 6.676 0 01-.597-.933A9.267 9.267 0 015.016 10zm.133 1.539c.552 1.035 1.218 1.65 1.887 1.855V11.5H5.145a7.97 7.97 0 01-.996-1.461zM8.5 1.077V4h2.354a7.97 7.97 0 00-.367-1.068C9.835 1.897 9.17 1.28 8.5 1.077zM10.91 4a9.267 9.267 0 00-.64-1.539 6.676 6.676 0 00-.597-.933A7.025 7.025 0 0114.03 4h-3.12zm.24 1.5h-2.763a14.37 14.37 0 01.085 1.5c0 .528-.033 1.025-.085 1.5H14.15a12.97 12.97 0 00.087-1.5c0-.527-.033-1.023-.087-1.5zm-1.166 4H12a7.025 7.025 0 01-3.86 2.472 6.7 6.7 0 00.597-.933A9.267 9.267 0 0110.984 10zm-.133 1.539A7.97 7.97 0 0110.855 11H8.5v2.923c.67-.204 1.335-.82 1.887-1.855a7.97 7.97 0 00.464-.529z"/></svg>;

function ChipRow({ icon, text }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(255,255,255,0.85)" }}>
      {icon}{text}
    </span>
  );
}

function ContactChip({ icon, text }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.9)" }}>
      <span style={{ fontSize: "11px" }}>{icon}</span> {text}
    </span>
  );
}

/* ─────────────────────────────────────────────
   SKILLS DISPLAY
───────────────────────────────────────────── */
function SkillsDisplay({ data, themeColor }) {
  const { skillDisplayMode, skills } = data;
  const tc = themeColor;

  if (!skills || skills.length === 0) return null;

  if (skillDisplayMode === "simple") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {skills.map((s, i) => (
          <span key={s.id || i} style={{
            fontSize: "10.5px", padding: "3px 9px", borderRadius: "12px",
            backgroundColor: `${tc}14`,
            border: `1px solid ${tc}40`,
            color: "#2a2a2a", fontWeight: "500",
          }}>
            {s.name}
          </span>
        ))}
      </div>
    );
  }

  if (skillDisplayMode === "category") {
    const hard = skills.filter(s => s.type === "Hard Skill");
    const soft = skills.filter(s => s.type === "Soft Skill");
    return (
      <div style={{ fontSize: "12px" }}>
        {hard.length > 0 && (
          <>
            <p style={{ margin: "0 0 4px", fontWeight: "700", color: tc, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Hard Skills</p>
            <p style={{ margin: "0 0 12px", color: "#333", lineHeight: "1.6" }}>{hard.map(s => s.name).join(" · ")}</p>
          </>
        )}
        {soft.length > 0 && (
          <>
            <p style={{ margin: "0 0 4px", fontWeight: "700", color: tc, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Soft Skills</p>
            <p style={{ margin: 0, color: "#333", lineHeight: "1.6" }}>{soft.map(s => s.name).join(" · ")}</p>
          </>
        )}
      </div>
    );
  }

  if (skillDisplayMode === "level-text") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {skills.filter(s => s.type === "Hard Skill").map((s, i) => (
          <div key={s.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#333" }}>• {s.name}</span>
            <span style={{ fontSize: "10px", color: tc, fontWeight: "700", padding: "2px 7px", borderRadius: "10px", backgroundColor: `${tc}18` }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (skillDisplayMode === "level-bar") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {skills.filter(s => s.type === "Hard Skill").map((s, i) => (
          <div key={s.id || i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11.5px", color: "#333", fontWeight: "500" }}>{s.name}</span>
              <span style={{ fontSize: "10px", color: tc, fontWeight: "700" }}>{s.level}%</span>
            </div>
            <div style={{ height: "4px", backgroundColor: "#e8e8e8", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.level}%`, backgroundColor: tc, borderRadius: "3px" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────
   CLASSIC TEMPLATE HELPERS
───────────────────────────────────────────── */
function ClassicSection({ title, tc, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "13px" }}>
        <div style={{ width: "3px", height: "15px", backgroundColor: tc, borderRadius: "2px", flexShrink: 0 }} />
        <h2 style={{ margin: 0, fontSize: "10.5px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "1.4px", textTransform: "uppercase" }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e4e4e4" }} />
      </div>
      {children}
    </div>
  );
}

function ClassicItem({ title, subtitle, period, desc, tc, isLast }) {
  return (
    <div style={{ display: "flex", gap: "13px", marginBottom: isLast ? 0 : "17px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "4px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: tc, flexShrink: 0 }} />
        {!isLast && <div style={{ width: "1px", flex: 1, backgroundColor: "#e0e0e0", marginTop: "4px" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#111", lineHeight: 1.3 }}>{title || "—"}</span>
          {period && <span style={{ fontSize: "11px", color: "#888", whiteSpace: "nowrap", flexShrink: 0 }}>{period}</span>}
        </div>
        {subtitle && <p style={{ margin: "0 0 5px", fontSize: "12px", color: "#555", fontWeight: "500" }}>{subtitle}</p>}
        {desc && <p style={{ margin: 0, fontSize: "11.5px", color: "#666", lineHeight: "1.7" }}>{desc}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODERN TEMPLATE HELPERS
───────────────────────────────────────────── */
function ModernSection({ title, tc, children }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{ display: "inline-block", border: `1.5px solid ${tc}`, borderRadius: "20px", padding: "4px 16px", marginBottom: "12px" }}>
        <span style={{ fontSize: "11px", fontWeight: "700", color: tc, whiteSpace: "nowrap" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ModernBadge({ label }) {
  return (
    <div style={{ border: "1.5px solid rgba(255,255,255,0.7)", borderRadius: "20px", padding: "3px 14px", display: "inline-block" }}>
      <span style={{ fontSize: "11px", fontWeight: "700", color: "#fff" }}>{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROFESSIONAL TEMPLATE HELPERS
───────────────────────────────────────────── */
function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: "26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: "4px", height: "18px", backgroundColor: color, borderRadius: "2px" }} />
        <h2 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "1.2px", textTransform: "uppercase" }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }} />
      </div>
      {children}
    </div>
  );
}

function TimelineItem({ title, subtitle, period, desc, color, isLast }) {
  return (
    <div style={{ display: "flex", gap: "14px", marginBottom: isLast ? 0 : "18px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: color, marginTop: "4px", flexShrink: 0 }} />
        {!isLast && <div style={{ width: "1px", flex: 1, backgroundColor: "#e0e0e0", marginTop: "4px" }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a1a" }}>{title || "—"}</span>
          {period && <span style={{ fontSize: "11px", color, fontWeight: "600", whiteSpace: "nowrap", marginLeft: "8px" }}>{period}</span>}
        </div>
        {subtitle && <p style={{ margin: "0 0 5px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>{subtitle}</p>}
        {desc && <p style={{ margin: 0, fontSize: "12px", color: "#555", lineHeight: "1.6" }}>{desc}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROFILE AVATAR
───────────────────────────────────────────── */
function Avatar({ src, size = 96, border }) {
  const style = {
    width: `${size}px`, height: `${size}px`, borderRadius: "50%",
    border, overflow: "hidden", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  };
  return (
    <div style={style}>
      {src
        ? <img src={src} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            <circle cx="21" cy="16" r="9" fill="rgba(255,255,255,0.45)" />
            <path d="M4 38c0-9.39 7.61-17 17-17s17 7.61 17 17" fill="rgba(255,255,255,0.45)" />
          </svg>
      }
    </div>
  );
}

/* ─────────────────────────────────────────────
   RESUME CONTENT (ใช้ template เหมือน Resume.jsx)
───────────────────────────────────────────── */
function ResumeContent({ data }) {
  const tc = data.themeColor || "#d4af37";

  /* ── CLASSIC ── */
  if (!data.template || data.template === "classic") {
    return (
      <div className="resume-a4-sheet" style={{
        width: "210mm", minHeight: "297mm", backgroundColor: "#fff",
        color: "#1a1a1a", fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
        boxSizing: "border-box", display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
        boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
      }}>
        {/* HEADER */}
        <div style={{ backgroundColor: tc, padding: "36px 44px 30px", display: "flex", alignItems: "center", gap: "26px", position: "relative" }}>
          <Avatar src={data.image} size={96} border="3px solid rgba(255,255,255,0.85)" />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 5px", fontSize: "30px", fontWeight: "800", color: "#fff", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
              {data.name || "ชื่อ-นามสกุล"}
            </h1>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "rgba(255,255,255,0.82)", fontWeight: "500", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              {data.title || ""}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 22px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.22)" }}>
              {data.email    && <ChipRow icon={ICON_MAIL}  text={data.email} />}
              {data.phone    && <ChipRow icon={ICON_PHONE} text={data.phone} />}
              {data.location && <ChipRow icon={ICON_PIN}   text={data.location} />}
              {data.linkedin && <ChipRow icon={ICON_LI}    text={data.linkedin} />}
              {data.website  && <ChipRow icon={ICON_WEB}   text={data.website} />}
            </div>
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, width: "90px", height: "100%", background: "rgba(0,0,0,0.08)", clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
        </div>

        {/* BODY */}
        <div style={{ display: "flex", flex: 1 }}>
          {/* LEFT MAIN */}
          <div style={{ flex: "1 1 0", padding: "30px 32px 36px 44px", borderRight: "1px solid #eee", minWidth: 0 }}>
            {data.summary && (
              <ClassicSection title="เกี่ยวกับฉัน" tc={tc}>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.85", color: "#444" }}>{data.summary}</p>
              </ClassicSection>
            )}
            {data.experience.length > 0 && (
              <ClassicSection title="ประสบการณ์ทำงาน" tc={tc}>
                {data.experience.map((exp, i) => (
                  <ClassicItem key={exp.id} title={exp.role} subtitle={exp.org} period={exp.period} desc={exp.desc} tc={tc} isLast={i === data.experience.length - 1} />
                ))}
              </ClassicSection>
            )}
            {data.education.length > 0 && (
              <ClassicSection title="ประวัติการศึกษา" tc={tc}>
                {data.education.map((edu, i) => (
                  <ClassicItem key={edu.id} title={edu.degree} subtitle={edu.school} period={edu.period} desc={edu.desc} tc={tc} isLast={i === data.education.length - 1} />
                ))}
              </ClassicSection>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ width: "210px", flexShrink: 0, padding: "30px 28px 36px 28px", backgroundColor: "#f7f7f7" }}>
            {data.skills.length > 0 && (
              <ClassicSection title="ทักษะ" tc={tc}>
                <SkillsDisplay data={data} themeColor={tc} />
              </ClassicSection>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── MODERN ── */
  if (data.template === "modern") {
    return (
      <div className="resume-a4-sheet" style={{
        width: "210mm", minHeight: "297mm", backgroundColor: "#fff",
        color: "#222", fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
        boxSizing: "border-box", display: "flex", flexDirection: "column",
        position: "relative", fontSize: "12px",
        boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
      }}>
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px", padding: "36px 44px 28px", borderBottom: `3px solid ${tc}` }}>
          <div style={{ width: "110px", height: "110px", borderRadius: "50%", border: `3px solid ${tc}`, overflow: "hidden", flexShrink: 0, backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {data.image
              ? <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <svg width="46" height="46" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="16" r="9" fill="#ccc" /><path d="M4 38c0-9.39 7.61-17 17-17s17 7.61 17 17" fill="#ccc" /></svg>
            }
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 5px", fontSize: "32px", fontWeight: "800", color: "#111", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
              {data.name || "ชื่อ-นามสกุล"}
            </h1>
            <p style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "600", color: tc }}>{data.title || ""}</p>
            {data.location && <p style={{ margin: 0, fontSize: "12px", color: "#777" }}>{data.location}</p>}
          </div>
        </div>

        {/* BODY */}
        <div style={{ display: "flex", flex: 1 }}>
          {/* LEFT SIDEBAR */}
          <div style={{ width: "205px", flexShrink: 0, padding: "28px 22px 28px 44px", borderRight: "1px solid #e8e8e8" }}>
            {data.education.length > 0 && (
              <ModernSection title="การศึกษา" tc={tc}>
                {data.education.map((edu, i) => (
                  <div key={edu.id} style={{ marginBottom: i === data.education.length - 1 ? 0 : "13px" }}>
                    {edu.degree && <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "11.5px", color: "#111" }}>{edu.degree}</p>}
                    {edu.school && <p style={{ margin: "0 0 2px", fontSize: "11px", color: "#555" }}>{edu.school}</p>}
                    {edu.period && <p style={{ margin: "0 0 2px", fontSize: "10.5px", color: tc, fontWeight: "600" }}>{edu.period}</p>}
                    {edu.desc   && <p style={{ margin: 0, fontSize: "10.5px", color: "#777", lineHeight: "1.6" }}>{edu.desc}</p>}
                  </div>
                ))}
              </ModernSection>
            )}
            {data.skills.length > 0 && (
              <ModernSection title="ทักษะ" tc={tc}>
                <SkillsDisplay data={data} themeColor={tc} />
              </ModernSection>
            )}
            {(data.email || data.phone || data.linkedin || data.website) && (
              <ModernSection title="ช่องทางติดต่อ" tc={tc}>
                {data.phone    && <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#444" }}>{data.phone}</p>}
                {data.email    && <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#444" }}>{data.email}</p>}
                {data.linkedin && <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#444" }}>{data.linkedin}</p>}
                {data.website  && <p style={{ margin: 0, fontSize: "11px", color: "#444" }}>{data.website}</p>}
              </ModernSection>
            )}
          </div>

          {/* RIGHT MAIN */}
          <div style={{ flex: 1, padding: "28px 44px 28px 28px", minWidth: 0 }}>
            {data.summary && (
              <ModernSection title="ข้อมูลโดยย่อ" tc={tc}>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.85", color: "#444" }}>{data.summary}</p>
              </ModernSection>
            )}
            {data.experience.length > 0 && (
              <ModernSection title="ประสบการณ์การทำงาน" tc={tc}>
                {data.experience.map((exp, i) => (
                  <div key={exp.id} style={{ marginBottom: i === data.experience.length - 1 ? 0 : "18px" }}>
                    <p style={{ margin: "0 0 1px", fontWeight: "700", fontSize: "12.5px", color: "#111" }}>{exp.role || "—"}</p>
                    {exp.period && <p style={{ margin: "0 0 1px", fontWeight: "700", fontSize: "11.5px", color: tc }}>{exp.period}</p>}
                    {exp.org    && <p style={{ margin: "0 0 5px", fontWeight: "700", fontSize: "11.5px", color: "#333" }}>{exp.org}</p>}
                    {exp.desc   && <p style={{ margin: 0, fontSize: "11.5px", color: "#555", lineHeight: "1.75" }}>{exp.desc}</p>}
                  </div>
                ))}
              </ModernSection>
            )}
          </div>
        </div>

        {/* FOOTER BAR */}
        <div style={{ backgroundColor: tc, padding: "14px 44px", display: "flex", flexWrap: "wrap", gap: "8px 28px", alignItems: "center" }}>
          <ModernBadge label="ข้อมูลการติดต่อ" />
          {data.phone    && <span style={{ fontSize: "11px", color: "#fff" }}>{data.phone}</span>}
          {data.email    && <span style={{ fontSize: "11px", color: "#fff" }}>{data.email}</span>}
          {data.location && <span style={{ fontSize: "11px", color: "#fff" }}>{data.location}</span>}
        </div>
      </div>
    );
  }

  /* ── PROFESSIONAL / FALLBACK ── */
  return (
    <div className="resume-a4-sheet" style={{
      width: "210mm", minHeight: "297mm", backgroundColor: "#fff",
      color: "#1a1a1a", fontFamily: "'Georgia', serif",
      boxSizing: "border-box", position: "relative", overflow: "hidden",
      boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
    }}>
      {/* HEADER */}
      <div style={{ backgroundColor: tc, padding: "36px 40px 28px", display: "flex", alignItems: "center", gap: "28px" }}>
        {data.image && (
          <div style={{ width: "110px", height: "110px", borderRadius: "50%", border: "4px solid rgba(255,255,255,0.9)", overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
            <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "28px", fontWeight: "700", color: "#fff", letterSpacing: "0.5px", textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
            {data.name || "ชื่อ-นามสกุล"}
          </h1>
          <p style={{ margin: "0 0 14px", fontSize: "15px", color: "rgba(255,255,255,0.88)", fontStyle: "italic" }}>
            {data.title || ""}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
            {data.email    && <ContactChip icon="✉"  text={data.email} />}
            {data.phone    && <ContactChip icon="📞" text={data.phone} />}
            {data.location && <ContactChip icon="📍" text={data.location} />}
            {data.linkedin && <ContactChip icon="in" text={data.linkedin} />}
            {data.website  && <ContactChip icon="🌐" text={data.website} />}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", minHeight: "calc(297mm - 175px)" }}>
        <div style={{ flex: "1 1 60%", padding: "32px 36px 36px 40px", borderRight: "1px solid #eee" }}>
          {data.summary && (
            <Section title="เกี่ยวกับฉัน" color={tc}>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.75", color: "#444" }}>{data.summary}</p>
            </Section>
          )}
          {data.experience.length > 0 && (
            <Section title="ประสบการณ์ทำงาน" color={tc}>
              {data.experience.map((exp, i) => (
                <TimelineItem key={exp.id} title={exp.role} subtitle={exp.org} period={exp.period} desc={exp.desc} color={tc} isLast={i === data.experience.length - 1} />
              ))}
            </Section>
          )}
          {data.education.length > 0 && (
            <Section title="การศึกษา" color={tc}>
              {data.education.map((edu, i) => (
                <TimelineItem key={edu.id} title={edu.degree} subtitle={edu.school} period={edu.period} desc={edu.desc} color={tc} isLast={i === data.education.length - 1} />
              ))}
            </Section>
          )}
        </div>
        <div style={{ flex: "0 0 38%", padding: "32px 28px 36px 28px", backgroundColor: "#fafafa" }}>
          {data.skills.length > 0 && (
            <Section title="ทักษะความชำนาญ" color={tc}>
              <SkillsDisplay data={data} themeColor={tc} />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ViewResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resumeData, setResumeData] = useState(null);
  const [rawTitle, setRawTitle] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/resumes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const raw = data.resume;
          setRawTitle(raw.title || "");
          setOwnerName(raw.ownerName || "");
          // แปลงข้อมูลให้ตรงกับ format ที่ ResumeContent ต้องการ
          setResumeData(normalizeResumeData(raw));
        } else {
          setResumeData(null);
        }
      } catch (err) {
        console.error("Fetch Resume Error:", err);
        setResumeData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResumeData();
  }, [id]);

  if (loading) {
    return (
      <>
        <style>{fonts}</style>
        <style>{globalStyles}</style>
        <div className="loading-screen">⏳ กำลังโหลด Resume...</div>
      </>
    );
  }

  if (!resumeData) {
    return (
      <>
        <style>{fonts}</style>
        <style>{globalStyles}</style>
        <div className="not-found-screen">
          <h2 style={{ fontSize: "24px" }}>ไม่พบ Resume นี้</h2>
          <button className="btn-action" onClick={() => navigate("/feed")}>← กลับไปหน้า Feed</button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{fonts}</style>
      <style>{globalStyles}</style>
      <div className="view-container">
        {/* HEADER BAR */}
        <header className="view-header">
          <div className="view-header-info">
            <h1>{rawTitle || (resumeData.name ? resumeData.name + " - Resume" : "Resume")}</h1>
            <p>{ownerName || resumeData.name || "—"}</p>
          </div>
          <div className="view-header-actions">
            <button className="btn-action" onClick={() => window.print()}>🖨️ พิมพ์</button>
            <button className="btn-action" onClick={() => navigate("/feed")}>← กลับ</button>
          </div>
        </header>

        {/* RESUME PREVIEW */}
        <div className="preview-area">
          <ResumeContent data={resumeData} />
        </div>
      </div>
    </>
  );
}
