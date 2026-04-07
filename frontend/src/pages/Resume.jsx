import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResumes } from "./ResumeContext";
import axios from "axios";
import "../styles/Resume.css";

const defaultData = {
  name: "",
  title: "",
  template: "classic",
  image: null,
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  summary: "",
  experience: [],
  education: [],
  skillDisplayMode: "simple",
  skills: [],
  themeColor: "#1e3a8a",
};

/* ─── Theme colors (matching UserProfile blue palette + extras) ─── */
const THEME_COLORS = [
  { name: "Navy",    code: "#1e3a8a" },
  { name: "Blue",    code: "#1d4ed8" },
  { name: "Slate",   code: "#334155" },
  { name: "Emerald", code: "#059669" },
  { name: "Rose",    code: "#be123c" },
  { name: "Violet",  code: "#6d28d9" },
];

function EntryBlock({ type, entries, onChange, onAdd, onRemove }) {
  const isEdu = type === "education";
  return (
    <div>
      {entries.map((e, i) => (
        <div key={e.id} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-title">
              {isEdu ? (e.degree || `การศึกษาที่ ${i + 1}`) : (e.role || `ประสบการณ์ที่ ${i + 1}`)}
            </span>
            <button className="btn-remove" onClick={() => onRemove(e.id)}>×</button>
          </div>
          <div className="field">
            <label>{isEdu ? "วุฒิการศึกษา / สาขา" : "ตำแหน่ง / ชื่อ"}</label>
            <input
              value={isEdu ? e.degree : e.role}
              onChange={ev => onChange(e.id, isEdu ? "degree" : "role", ev.target.value)}
              placeholder={isEdu ? "เช่น ปริญญาตรี วิทยาการคอมพิวเตอร์" : "ชื่อตำแหน่งงาน"}
            />
          </div>
          <div className="row">
            <div className="field">
              <label>{isEdu ? "สถานศึกษา" : "องค์กร / บริษัท"}</label>
              <input
                value={isEdu ? e.school : e.org}
                onChange={ev => onChange(e.id, isEdu ? "school" : "org", ev.target.value)}
                placeholder={isEdu ? "ชื่อมหาวิทยาลัย / โรงเรียน" : "ชื่อบริษัท"}
              />
            </div>
            <div className="field">
              <label>ช่วงเวลา</label>
              <input value={e.period} onChange={ev => onChange(e.id, "period", ev.target.value)} placeholder="2020 – 2023" />
            </div>
          </div>
          <div className="field">
            <label>{isEdu ? "รายละเอียดเพิ่มเติม" : "รายละเอียดงาน"}</label>
            <textarea
              rows={3}
              value={e.desc}
              onChange={ev => onChange(e.id, "desc", ev.target.value)}
              placeholder={isEdu ? "เช่น เกรดเฉลี่ย หรือรางวัล" : "อธิบายหน้าที่ความรับผิดชอบ"}
            />
          </div>
        </div>
      ))}
      <button className="btn-add" onClick={onAdd}>
        {isEdu ? "+ เพิ่มประวัติการศึกษา" : "+ เพิ่มประสบการณ์"}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   A4 RESUME CONTENT
───────────────────────────────────────────── */
function ResumeContent({ data, highlightField }) {
  const themeColor = data.themeColor || "#1e3a8a";
  const tc = themeColor;

  const highlight = (field) =>
    highlightField === field
      ? { outline: `2px solid ${tc}`, outlineOffset: "2px", borderRadius: "3px", transition: "outline 0.2s" }
      : {};

  // ── CLASSIC TEMPLATE ─────────────────────────────────────────
  if (!data.template || data.template === "classic") {
    const hexToRgb = (h) => {
      const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
      return {r,g,b};
    };
    const rgb = hexToRgb(tc.length === 7 ? tc : "#1e3a8a");
    const sidebarDark = `rgb(${Math.round(rgb.r*0.22)},${Math.round(rgb.g*0.22)},${Math.round(rgb.b*0.22)})`;

    return (
      <div
        className="resume-a4-sheet resume classic"
        style={{
          "--theme-color": tc,
          width: "210mm",
          minHeight: "297mm",
          backgroundColor: "#fff",
          color: "#1a1a1a",
          fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* HEADER */}
        <div style={{
          backgroundColor: tc,
          padding: "30px 36px 26px 36px",
          display: "flex",
          alignItems: "center",
          gap: "22px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", right: 0, top: 0,
            width: "140px", height: "100%",
            backgroundColor: "rgba(0,0,0,0.12)",
            clipPath: "polygon(40% 0, 100% 0, 100% 100%)",
          }} />
          <div style={{
            position: "absolute", right: "50px", top: 0,
            width: "80px", height: "100%",
            backgroundColor: "rgba(255,255,255,0.05)",
            clipPath: "polygon(60% 0, 100% 0, 100% 100%, 40% 100%)",
          }} />

          {data.image ? (
            <div style={{
              width: "90px", height: "90px", borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.9)",
              overflow: "hidden", flexShrink: 0, zIndex: 1,
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}>
              <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div style={{
              width: "90px", height: "90px", borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.35)",
              backgroundColor: "rgba(0,0,0,0.12)",
              flexShrink: 0, zIndex: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="40" height="40" viewBox="0 0 42 42" fill="none">
                <circle cx="21" cy="16" r="9" fill="rgba(255,255,255,0.4)" />
                <path d="M4 38c0-9.39 7.61-17 17-17s17 7.61 17 17" fill="rgba(255,255,255,0.4)" />
              </svg>
            </div>
          )}

          <div style={{ flex: 1, zIndex: 1 }}>
            <h1 style={{
              margin: "0 0 3px", fontSize: "28px", fontWeight: "800",
              color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.1,
              ...highlight("name"),
            }}>
              {data.name || "ชื่อ-นามสกุล"}
            </h1>
            <p style={{
              margin: "0 0 14px", fontSize: "12px", fontWeight: "600",
              color: "rgba(255,255,255,0.75)", letterSpacing: "1.8px",
              textTransform: "uppercase",
              ...highlight("title"),
            }}>
              {data.title || "ตำแหน่งงาน"}
            </p>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "8px 20px",
              paddingTop: "11px",
              borderTop: "1px solid rgba(255,255,255,0.22)",
            }}>
              {data.email    && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.82)", ...highlight("email") }}>✉ {data.email}</span>}
              {data.phone    && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.82)", ...highlight("phone") }}>📞 {data.phone}</span>}
              {data.location && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.82)", ...highlight("location") }}>📍 {data.location}</span>}
              {data.linkedin && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.82)" }}>in {data.linkedin}</span>}
              {data.website  && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.82)" }}>🌐 {data.website}</span>}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div style={{ display: "flex", flex: 1 }}>

          {/* LEFT SIDEBAR — dark */}
          <div style={{
            width: "195px", flexShrink: 0,
            backgroundColor: sidebarDark,
            padding: "26px 18px 32px 22px",
          }}>
            {data.summary && (
              <ClassicDarkSection title="เกี่ยวกับฉัน" tc={tc}>
                <p style={{ margin: 0, fontSize: "10.5px", lineHeight: "1.8", color: "rgba(255,255,255,0.65)", ...highlight("summary") }}>
                  {data.summary}
                </p>
              </ClassicDarkSection>
            )}
            {data.skills.length > 0 && (
              <ClassicDarkSection title="ความสามารถ" tc={tc}>
                <SkillsDisplayDark data={data} tc={tc} />
              </ClassicDarkSection>
            )}
            {data.education.length > 0 && (
              <ClassicDarkSection title="การศึกษา" tc={tc}>
                {data.education.map((edu, i) => (
                  <div key={edu.id} style={{ marginBottom: i === data.education.length - 1 ? 0 : "12px" }}>
                    {edu.degree && <p style={{ margin: "0 0 1px", fontWeight: "700", fontSize: "10.5px", color: "rgba(255,255,255,0.9)" }}>{edu.degree}</p>}
                    {edu.school && <p style={{ margin: "0 0 1px", fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>{edu.school}</p>}
                    {edu.period && <p style={{ margin: "0 0 1px", fontSize: "9.5px", color: tc, fontWeight: "700" }}>{edu.period}</p>}
                    {edu.desc   && <p style={{ margin: 0, fontSize: "9.5px", color: "rgba(255,255,255,0.45)", lineHeight: "1.6" }}>{edu.desc}</p>}
                  </div>
                ))}
              </ClassicDarkSection>
            )}
          </div>

          {/* RIGHT MAIN */}
          <div style={{ flex: 1, padding: "24px 28px 32px 24px", backgroundColor: "#fff", minWidth: 0 }}>
            {data.experience.length > 0 && (
              <ClassicLightSection title="ประสบการณ์การทำงาน" tc={tc}>
                {data.experience.map((exp, i) => (
                  <ClassicTimelineItem
                    key={exp.id}
                    title={exp.role} subtitle={exp.org}
                    period={exp.period} desc={exp.desc}
                    tc={tc} isLast={i === data.experience.length - 1}
                  />
                ))}
              </ClassicLightSection>
            )}
            {data.education.length > 0 && (
              <ClassicLightSection title="ประวัติการศึกษา" tc={tc}>
                {data.education.map((edu, i) => (
                  <ClassicTimelineItem
                    key={edu.id}
                    title={edu.degree} subtitle={edu.school}
                    period={edu.period} desc={edu.desc}
                    tc={tc} isLast={i === data.education.length - 1}
                  />
                ))}
              </ClassicLightSection>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── MODERN / PROFESSIONAL ────────────────────────────────────
  return (
    <div
      className={`resume-a4-sheet resume ${data.template}`}
      style={{
        "--theme-color": tc,
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "#fff",
        color: "#1a1a1a",
        fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* HEADER */}
      <div style={{
        backgroundColor: tc,
        padding: "32px 40px 26px",
        display: "flex",
        alignItems: "center",
        gap: "26px",
        transition: "background-color 0.3s",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: "200px",
          background: "linear-gradient(to left, rgba(0,0,0,0.15), transparent)",
        }} />
        {data.image && (
          <div style={{
            width: "100px", height: "100px", borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.9)",
            overflow: "hidden", flexShrink: 0,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            zIndex: 1,
          }}>
            <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ flex: 1, zIndex: 1 }}>
          <h1 style={{
            margin: "0 0 5px", fontSize: "26px", fontWeight: "800",
            color: "#fff", letterSpacing: "-0.3px",
            ...highlight("name"),
          }}>
            {data.name || "ชื่อ-นามสกุล"}
          </h1>
          <p style={{
            margin: "0 0 14px", fontSize: "13px",
            color: "rgba(255,255,255,0.8)", fontWeight: "500",
            letterSpacing: "1px", textTransform: "uppercase",
            ...highlight("title"),
          }}>
            {data.title || "ตำแหน่งงาน"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "12px" }}>
            {data.email    && <ContactChip icon="✉"  text={data.email}    hl={highlight("email")} />}
            {data.phone    && <ContactChip icon="📞" text={data.phone}    hl={highlight("phone")} />}
            {data.location && <ContactChip icon="📍" text={data.location} hl={highlight("location")} />}
            {data.linkedin && <ContactChip icon="in" text={data.linkedin} />}
            {data.website  && <ContactChip icon="🌐" text={data.website}  />}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", minHeight: "calc(297mm - 175px)" }}>
        <div style={{ flex: "1 1 60%", padding: "28px 32px 32px 36px", borderRight: "1px solid #eee" }}>
          {data.summary && (
            <Section title="เกี่ยวกับฉัน" color={tc}>
              <p style={{ margin: 0, fontSize: "12.5px", lineHeight: "1.8", color: "#444", ...highlight("summary") }}>{data.summary}</p>
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
        <div style={{ flex: "0 0 38%", padding: "28px 24px 32px 24px", backgroundColor: "#f8f9fc" }}>
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

/* ── Helpers ────────────────────────────────────────────────── */

function ClassicDarkSection({ title, tc, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <div style={{ width: "16px", height: "2px", backgroundColor: tc, borderRadius: "1px", flexShrink: 0 }} />
        <span style={{ fontSize: "8.5px", fontWeight: "700", letterSpacing: "1.6px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
          {title}
        </span>
      </div>
      {children}
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", marginTop: "18px" }} />
    </div>
  );
}

function ClassicLightSection({ title, tc, children }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{
          backgroundColor: tc, color: "#fff",
          fontSize: "8.5px", fontWeight: "700", letterSpacing: "1.5px",
          textTransform: "uppercase", padding: "4px 12px",
          borderRadius: "2px", whiteSpace: "nowrap",
        }}>
          {title}
        </div>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e8e8e8" }} />
      </div>
      {children}
    </div>
  );
}

function ClassicTimelineItem({ title, subtitle, period, desc, tc, isLast }) {
  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: isLast ? 0 : "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "4px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: tc, flexShrink: 0 }} />
        {!isLast && <div style={{ width: "1px", flex: 1, backgroundColor: "#e0e0e0", marginTop: "4px" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "2px" }}>
          <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#111", lineHeight: 1.3 }}>{title || "—"}</span>
          {period && <span style={{ fontSize: "10px", color: "#999", whiteSpace: "nowrap", flexShrink: 0 }}>{period}</span>}
        </div>
        {subtitle && <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#555", fontWeight: "500" }}>{subtitle}</p>}
        {desc     && <p style={{ margin: 0, fontSize: "11px", color: "#666", lineHeight: "1.7" }}>{desc}</p>}
      </div>
    </div>
  );
}

function SkillsDisplayDark({ data, tc }) {
  const { skillDisplayMode, skills } = data;
  if (skillDisplayMode === "simple") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {skills.map(s => (
          <span key={s.id} style={{
            fontSize: "10px", padding: "2px 9px", borderRadius: "3px",
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.75)", fontWeight: "500",
          }}>{s.name}</span>
        ))}
      </div>
    );
  }
  if (skillDisplayMode === "level-bar") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
        {skills.filter(s => s.type === "Hard Skill").map(s => (
          <div key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.75)", fontWeight: "500" }}>{s.name}</span>
              <span style={{ fontSize: "9px", color: tc, fontWeight: "700" }}>{s.level}%</span>
            </div>
            <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.level}%`, backgroundColor: tc, borderRadius: "2px" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (skillDisplayMode === "level-text") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {skills.filter(s => s.type === "Hard Skill").map(s => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.7)" }}>· {s.name}</span>
            <span style={{ fontSize: "9.5px", color: tc, fontWeight: "700" }}>{s.label}</span>
          </div>
        ))}
      </div>
    );
  }
  if (skillDisplayMode === "category") {
    const hard = skills.filter(s => s.type === "Hard Skill");
    const soft = skills.filter(s => s.type === "Soft Skill");
    return (
      <div>
        {hard.length > 0 && <><p style={{ margin:"0 0 3px", fontSize:"8.5px", fontWeight:"700", color: tc, textTransform:"uppercase", letterSpacing:"0.8px" }}>Hard Skills</p><p style={{ margin:"0 0 10px", fontSize:"10.5px", color:"rgba(255,255,255,0.6)", lineHeight:"1.6" }}>{hard.map(s=>s.name).join(" · ")}</p></>}
        {soft.length > 0 && <><p style={{ margin:"0 0 3px", fontSize:"8.5px", fontWeight:"700", color: tc, textTransform:"uppercase", letterSpacing:"0.8px" }}>Soft Skills</p><p style={{ margin:0, fontSize:"10.5px", color:"rgba(255,255,255,0.6)", lineHeight:"1.6" }}>{soft.map(s=>s.name).join(" · ")}</p></>}
      </div>
    );
  }
  return null;
}

function ContactChip({ icon, text, hl = {} }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(255,255,255,0.85)", ...hl }}>
      <span style={{ fontSize: "10px" }}>{icon}</span> {text}
    </span>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: "4px", height: "18px", backgroundColor: color, borderRadius: "2px" }} />
        <h2 style={{ margin: 0, fontSize: "11px", fontWeight: "800", color: "#1a1a1a", letterSpacing: "1.4px", textTransform: "uppercase" }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e8e8e8" }} />
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
          <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#1a1a1a" }}>{title || "—"}</span>
          {period && <span style={{ fontSize: "10.5px", color: color, fontWeight: "700", whiteSpace: "nowrap", marginLeft: "8px" }}>{period}</span>}
        </div>
        {subtitle && <p style={{ margin: "0 0 4px", fontSize: "11.5px", color: "#666" }}>{subtitle}</p>}
        {desc && <p style={{ margin: 0, fontSize: "11.5px", color: "#555", lineHeight: "1.65" }}>{desc}</p>}
      </div>
    </div>
  );
}

function SkillsDisplay({ data, themeColor }) {
  const { skillDisplayMode, skills } = data;
  if (skillDisplayMode === "simple") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
        {skills.map(s => (
          <span key={s.id} style={{
            fontSize: "11.5px", padding: "4px 12px", borderRadius: "99px",
            backgroundColor: `${themeColor}14`,
            border: `1.5px solid ${themeColor}35`,
            color: themeColor, fontWeight: "600",
          }}>{s.name}</span>
        ))}
      </div>
    );
  }
  if (skillDisplayMode === "category") {
    const hard = skills.filter(s => s.type === "Hard Skill");
    const soft = skills.filter(s => s.type === "Soft Skill");
    return (
      <div style={{ fontSize: "12.5px" }}>
        {hard.length > 0 && (<><p style={{ margin:"0 0 5px", fontWeight:"700", color: themeColor, fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.8px" }}>Hard Skills</p><p style={{ margin:"0 0 14px", color:"#444", lineHeight:"1.65" }}>{hard.map(s=>s.name).join(" · ")}</p></>)}
        {soft.length > 0 && (<><p style={{ margin:"0 0 5px", fontWeight:"700", color: themeColor, fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.8px" }}>Soft Skills</p><p style={{ margin:0, color:"#444", lineHeight:"1.65" }}>{soft.map(s=>s.name).join(" · ")}</p></>)}
      </div>
    );
  }
  if (skillDisplayMode === "level-text") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {skills.filter(s => s.type === "Hard Skill").map(s => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#333" }}>• {s.name}</span>
            <span style={{ fontSize: "10.5px", color: themeColor, fontWeight: "700", padding: "2px 10px", borderRadius: "99px", backgroundColor: `${themeColor}12` }}>{s.label}</span>
          </div>
        ))}
      </div>
    );
  }
  if (skillDisplayMode === "level-bar") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {skills.filter(s => s.type === "Hard Skill").map(s => (
          <div key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "12px", color: "#333", fontWeight: "500" }}>{s.name}</span>
              <span style={{ fontSize: "10px", color: themeColor, fontWeight: "700" }}>{s.level}%</span>
            </div>
            <div style={{ height: "5px", backgroundColor: "#e8e8e8", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.level}%`, backgroundColor: themeColor, borderRadius: "3px" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/* ─────────────────────────────────────────────
   A4 PREVIEW MODAL — Light theme
───────────────────────────────────────────── */
function A4PreviewModal({ data, onClose }) {
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    const updateScale = () => {
      const availW = window.innerWidth - 80;
      const a4w = 794;
      setScale(Math.min(0.9, availW / a4w));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handlePrint = () => {
  const printContent = document.getElementById("a4-print-target").innerHTML;
  // ดึง CSS ทั้งหมดในหน้าปัจจุบันเพื่อไปใส่ในหน้าพิมพ์
  const currentStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(style => style.outerHTML)
    .join('\n');

  const win = window.open("", "_blank", "width=900,height=1100");
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${data.name || "Resume"}</title>
        ${currentStyles} 
        <style>
          body { background: white !important; margin: 0; padding: 0; }
          .resume-a4-sheet { 
            box-shadow: none !important; 
            margin: 0 !important; 
            width: 210mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: A4 portrait; margin: 0; }
        </style>
      </head>
      <body onload="setTimeout(() => { window.print(); window.close(); }, 800);">
        ${printContent}
      </body>
    </html>
  `);
  win.document.close();
};

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tc = data.themeColor || "#1e3a8a";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column", alignItems: "center",
        backgroundColor: "rgba(15,23,42,0.75)",
        overflowY: "auto",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      {/* TOP BAR */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 24px",
        background: "rgba(255,255,255,0.97)",
        borderBottom: "1px solid #e4e4e7",
        backdropFilter: "blur(8px)",
        boxShadow: "0 1px 12px rgba(30,58,138,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: tc, boxShadow: `0 0 8px ${tc}88`,
          }} />
          <div>
            <p style={{ color: "#18181b", fontSize: "14px", fontWeight: "700", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              {data.name || "Resume Preview"}
            </p>
            <p style={{ color: "#a1a1aa", fontSize: "11px", margin: "2px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
              ตัวอย่าง A4 · กด ESC หรือคลิกพื้นหลังเพื่อปิด
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#a1a1aa", marginRight: "4px", fontFamily: "'DM Sans', sans-serif" }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handlePrint}
            style={{
              padding: "9px 20px", borderRadius: "9px", border: "none",
              background: `linear-gradient(135deg, ${tc}, ${tc}cc)`,
              color: "#fff", fontWeight: "700", fontSize: "13px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
              boxShadow: `0 4px 14px ${tc}44`,
              fontFamily: "'DM Sans', sans-serif",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
          >
            🖨️ Print / Save PDF
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px", borderRadius: "9px",
              border: "1.5px solid #e4e4e7",
              background: "#f4f4f5", color: "#52525b",
              fontWeight: "600", fontSize: "13px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#e4e4e7"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f4f4f5"; }}
          >
            ✕ ปิด
          </button>
        </div>
      </div>

      {/* A4 SHEET */}
      <div style={{ padding: "36px 24px 56px", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          marginBottom: `calc((297mm * ${scale}) - 297mm + 32px)`,
          animation: "slideUp 0.25s ease",
        }}>
          <div id="a4-print-target" style={{
            width: "210mm", minHeight: "297mm",
            backgroundColor: "#fff",
            boxShadow: "0 20px 80px rgba(15,23,42,0.35), 0 4px 20px rgba(0,0,0,0.15)",
            borderRadius: "3px",
            overflow: "hidden",
          }}>
            <ResumeContent data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LIVE PREVIEW PANEL — Light theme
───────────────────────────────────────────── */
function LivePreviewPanel({ data, onOpenA4 }) {
  const [previewScale, setPreviewScale] = useState(0.55);
  const [manualScale, setManualScale] = useState(null);
  const containerRef = useRef();

  useEffect(() => {
    if (manualScale !== null) return;
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const a4w = 794;
      const autoScale = Math.max(0.3, Math.min(0.75, (w - 48) / a4w));
      setPreviewScale(autoScale);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [manualScale]);

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setManualScale(val);
    setPreviewScale(val);
  };

  const a4HeightPx = 1123;

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "linear-gradient(160deg, #edf2fb 0%, #e8edf8 100%)",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {/* Preview toolbar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 5, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 18px",
        background: "rgba(255,255,255,0.92)",
        borderBottom: "1px solid #e4e4e7",
        backdropFilter: "blur(8px)",
        boxShadow: "0 1px 8px rgba(30,58,138,0.06)",
        gap: "12px",
      }}>
        {/* Live dot */}
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0 }}>
          <div style={{
            width: "7px", height: "7px", borderRadius: "50%",
            backgroundColor: "#22c55e", boxShadow: "0 0 6px #22c55e88",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: "10.5px", color: "#a1a1aa", letterSpacing: "0.5px", fontWeight: "600", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif" }}>
            LIVE PREVIEW
          </span>
        </div>

        {/* Zoom */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <button
            onClick={() => handleSliderChange({ target: { value: Math.max(0.25, previewScale - 0.05) } })}
            style={{ background: "#f4f4f5", border: "1.5px solid #e4e4e7", borderRadius: "6px", color: "#71717a", cursor: "pointer", fontSize: "14px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
          >−</button>
          <input
            type="range" min="0.25" max="0.90" step="0.05"
            value={previewScale} onChange={handleSliderChange}
            style={{ flex: 1, height: "3px", accentColor: "#1d4ed8", cursor: "pointer", minWidth: 0 }}
          />
          <button
            onClick={() => handleSliderChange({ target: { value: Math.min(0.90, previewScale + 0.05) } })}
            style={{ background: "#f4f4f5", border: "1.5px solid #e4e4e7", borderRadius: "6px", color: "#71717a", cursor: "pointer", fontSize: "14px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
          >+</button>
          <span style={{ fontSize: "12px", color: "#1e3a8a", fontWeight: "700", minWidth: "38px", textAlign: "right", flexShrink: 0, fontFamily: "'DM Sans',sans-serif" }}>
            {Math.round(previewScale * 100)}%
          </span>
          {manualScale !== null && (
            <button onClick={() => setManualScale(null)} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: "10.5px", flexShrink: 0, fontFamily: "'DM Sans',sans-serif" }}>auto</button>
          )}
        </div>

        {/* A4 button */}
        <button
          onClick={onOpenA4}
          style={{
            fontSize: "12px", padding: "7px 14px",
            borderRadius: "8px",
            border: "1.5px solid #bfdbfe",
            background: "#eff6ff", color: "#1e3a8a",
            cursor: "pointer", fontWeight: "700", whiteSpace: "nowrap", flexShrink: 0,
            fontFamily: "'DM Sans',sans-serif",
            display: "flex", alignItems: "center", gap: "5px",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; }}
        >
          📄 A4 เต็มหน้า
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.35} }
        input[type=range]::-webkit-slider-thumb { width:14px;height:14px; }
      `}</style>

      {/* Scaled A4 */}
      <div style={{ padding: "24px 16px 48px", width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{
          transform: `scale(${previewScale})`,
          transformOrigin: "top center",
          height: `${a4HeightPx * previewScale}px`,
          position: "relative",
          width: "794px",
        }}>
          <div style={{
            width: "210mm", minHeight: "297mm",
            position: "absolute", top: 0, left: "50%",
            transform: "translateX(-50%)",
            boxShadow: "0 12px 60px rgba(30,58,138,0.18), 0 2px 12px rgba(0,0,0,0.08)",
            borderRadius: "3px", overflow: "hidden",
          }}>
            <ResumeContent data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ResumeBuilder() {
  const [data, setData] = useState(defaultData);
  const [tab, setTab] = useState("info");
  const [newSkill, setNewSkill] = useState("");
  const [savedToast, setSavedToast] = useState(false);
  const [showA4Preview, setShowA4Preview] = useState(false);
  const navigate = useNavigate();
  const { publish } = useResumes();

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  const updateEntry = (section, id, field, val) =>
    set(section, data[section].map(e => e.id === id ? { ...e, [field]: val } : e));

  const addEntry = (section) =>
    set(section, [...data[section], { id: Date.now(), role: "", org: "", period: "", desc: "", degree: "", school: "" }]);

  const removeEntry = (section, id) =>
    set(section, data[section].filter(e => e.id !== id));

  const filteredSkills = data.skills.filter(skill => {
    switch (data.skillDisplayMode) {
      case "category": return skill.type === "Hard Skill" || skill.type === "Soft Skill";
      case "level-text":
      case "level-bar": return skill.type === "Hard Skill";
      default: return true;
    }
  });

  const handleAddSkillDetailed = () => {
    const type = document.getElementById("skillType")?.value || "Hard Skill";
    const levelSelect = document.getElementById("skillLevel")?.value || "80|ดีมาก";
    const [lv, lb] = levelSelect.split("|");
    if (newSkill.trim()) {
      set("skills", [...data.skills, { id: Date.now(), name: newSkill.trim(), type, level: parseInt(lv), label: lb }]);
      setNewSkill("");
    }
  };

  const removeSkill = (id) => set("skills", data.skills.filter(x => x.id !== id));

  const handleSavePrivate = async () => {
    try {
      setSavedToast(true);
      const payload = {
        title: data.name + " - Resume",
        template: data.template,
        image: data.image,
        visibility: "private",
        sections: [
          { type: "summary", content: { text: data.summary }, order: 1 },
          ...data.experience.map((exp, index) => ({
            type: "experience",
            content: { role: exp.role, company: exp.org, period: exp.period, desc: exp.desc },
            order: index + 2,
          })),
          ...data.education.map((edu, index) => ({
            type: "education",
            content: { degree: edu.degree, school: edu.school, period: edu.period, desc: edu.desc },
            order: data.experience.length + index + 2,
          })),
          { type: "skills", content: { displayMode: data.skillDisplayMode, list: data.skills }, order: 99 },
        ],
      };
      const response = await axios.post("http://localhost:3000/resumes", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.status === 201) {
        setTimeout(() => { setSavedToast(false); navigate("/profile"); }, 1200);
      }
    } catch (error) {
      console.error("Save Error:", error);
      setSavedToast(false);
      alert("บันทึกไม่สำเร็จ");
    }
  };

  const handlePublishPublic = async () => {
    try {
      setSavedToast(true);
      const payload = {
        title: data.name + " - Resume",
        template: data.template,
        visibility: "public", // กำหนดเป็นสาธารณะ
        summary: data.summary,
        experience: data.experience,
        education: data.education,
        skills: data.skills,
      };

      const response = await axios.post("http://localhost:3000/resumes", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.status === 201) {
        setTimeout(() => { 
          setSavedToast(false); 
          navigate("/feed"); // เมื่อบันทึกสำเร็จให้ไปหน้า Feed
        }, 1200);
      }
    } catch (error) {
      console.error("Publish Error:", error);
      setSavedToast(false);
      alert("ไม่สามารถโพสต์สาธารณะได้");
    }
  };

  const tabs = [
    { id: "template", label: "เทมเพลต" },
    { id: "info",     label: "ข้อมูล" },
    { id: "exp",      label: "ประสบการณ์" },
    { id: "edu",      label: "การศึกษา" },
    { id: "skills",   label: "ทักษะ" },
  ];

  const tc = data.themeColor || "#1e3a8a";

  return (
    <>
      {savedToast && (
        <div className="toast-notification">✓ บันทึก Resume แล้ว! กำลังไปหน้า Profile...</div>
      )}

      {showA4Preview && <A4PreviewModal data={data} onClose={() => setShowA4Preview(false)} />}

      <div className="app" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div className="sidebar">

          {/* Header */}
          <div className="sidebar-header">
            <button className="back-link" onClick={() => navigate("/feed")}>← กลับไปหน้า Feed</button>
            <div className="logo">résumé<span>craft</span></div>
          </div>

          {/* Tabs */}
          <div className="sidebar-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="sidebar-body">

            {/* ── TEMPLATE TAB ── */}
            {tab === "template" && (
              <>
                <div className="section-label">รูปแบบ Resume</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
                  {[
                    { id: "classic",      icon: "📜", label: "Classic" },
                    { id: "modern",       icon: "📱", label: "Modern" },
                    { id: "professional", icon: "💼", label: "Professional" },
                  ].map(t => (
                    <div key={t.id} className={`template-card ${data.template === t.id ? "active" : ""}`} onClick={() => set("template", t.id)}>
                      <div className="tm-icon">{t.icon}</div>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>

                <div className="section-label">โทนสี</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "12px", background: "#f8f9fc", borderRadius: "10px", border: "1.5px solid #e4e4e7" }}>
                  {THEME_COLORS.map(color => (
                    <button
                      key={color.code}
                      onClick={() => set("themeColor", color.code)}
                      title={color.name}
                      style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        backgroundColor: color.code,
                        border: data.themeColor === color.code ? `3px solid #fff` : "3px solid transparent",
                        cursor: "pointer",
                        boxShadow: data.themeColor === color.code
                          ? `0 0 0 2px ${color.code}, 0 3px 10px ${color.code}55`
                          : "0 2px 6px rgba(0,0,0,0.15)",
                        transition: "all 0.2s",
                        outline: "none",
                      }}
                    />
                  ))}
                </div>

                {/* Color preview chip */}
                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: `${tc}10`, borderRadius: "8px", border: `1.5px solid ${tc}25` }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: tc, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: "600", color: tc, fontFamily: "'DM Sans',sans-serif" }}>
                    สีที่เลือก: {THEME_COLORS.find(c => c.code === tc)?.name || "Custom"}
                  </span>
                </div>
              </>
            )}

            {/* ── INFO TAB ── */}
            {tab === "info" && (
              <>
                <div className="section-label">รูปถ่ายโปรไฟล์</div>
                <div className="image-upload-wrapper" style={{ marginBottom: "20px" }}>
                  <div style={{
                    width: "90px", height: "90px", borderRadius: "50%",
                    background: data.image ? "transparent" : "linear-gradient(135deg, #eff6ff, #dbeafe)",
                    margin: "0 auto 12px",
                    overflow: "hidden",
                    border: `3px solid ${tc}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 16px ${tc}20`,
                  }}>
                    {data.image ? (
                      <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "28px" }}>👤</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <input type="file" accept="image/*" id="profile-upload" style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => set("image", reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label htmlFor="profile-upload" style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "8px 16px", cursor: "pointer", borderRadius: "8px",
                      background: "#eff6ff", color: "#1e3a8a", fontWeight: "600",
                      fontSize: "12.5px", border: "1.5px solid #bfdbfe",
                      fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
                    }}>
                      📸 เลือกรูปถ่าย
                    </label>
                    {data.image && (
                      <button onClick={() => set("image", null)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        ลบรูป
                      </button>
                    )}
                  </div>
                </div>

                <div className="section-label">ข้อมูลส่วนตัว</div>
                <div className="field"><label>ชื่อ-นามสกุล</label><input value={data.name} onChange={e => set("name", e.target.value)} placeholder="ชื่อเต็มของคุณ" /></div>
                <div className="field"><label>ตำแหน่ง / สาขาอาชีพ</label><input value={data.title} onChange={e => set("title", e.target.value)} placeholder="เช่น Software Engineer" /></div>

                <div className="section-label">ช่องทางติดต่อ</div>
                <div className="row">
                  <div className="field"><label>อีเมล</label><input value={data.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" /></div>
                  <div className="field"><label>เบอร์โทรศัพท์</label><input value={data.phone} onChange={e => set("phone", e.target.value)} placeholder="08X-XXX-XXXX" /></div>
                </div>
                <div className="row">
                  <div className="field"><label>ที่อยู่</label><input value={data.location} onChange={e => set("location", e.target.value)} placeholder="กรุงเทพฯ, ไทย" /></div>
                  <div className="field"><label>LinkedIn</label><input value={data.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="linkedin.com/in/..." /></div>
                </div>
                <div className="field"><label>เว็บไซต์ / Portfolio</label><input value={data.website} onChange={e => set("website", e.target.value)} placeholder="portfolio.dev" /></div>
                <div className="field"><label>สรุปประวัติ</label><textarea rows={5} value={data.summary} onChange={e => set("summary", e.target.value)} placeholder="แนะนำตัวเองสั้นๆ ประมาณ 2-3 ประโยค..." /></div>
              </>
            )}

            {/* ── EXP TAB ── */}
            {tab === "exp" && (
              <>
                <div className="section-label">ประสบการณ์ทำงาน</div>
                <EntryBlock type="experience" entries={data.experience}
                  onChange={(id, f, v) => updateEntry("experience", id, f, v)}
                  onAdd={() => addEntry("experience")}
                  onRemove={id => removeEntry("experience", id)}
                />
              </>
            )}

            {/* ── EDU TAB ── */}
            {tab === "edu" && (
              <>
                <div className="section-label">การศึกษา</div>
                <EntryBlock type="education" entries={data.education}
                  onChange={(id, f, v) => updateEntry("education", id, f, v)}
                  onAdd={() => addEntry("education")}
                  onRemove={id => removeEntry("education", id)}
                />
              </>
            )}

            {/* ── SKILLS TAB ── */}
            {tab === "skills" && (
              <>
                <div className="section-label">รูปแบบการแสดงผล</div>
                <select value={data.skillDisplayMode} onChange={e => set("skillDisplayMode", e.target.value)} style={{ marginBottom: "16px" }}>
                  <option value="simple">รายการทั่วไป (Chips)</option>
                  <option value="category">แยก Hard Skills & Soft Skills</option>
                  <option value="level-text">บอกระดับ (ดีมาก, ปานกลาง, พอใช้)</option>
                  <option value="level-bar">บอกเป็นเปอร์เซ็นต์ (Progress Bar)</option>
                </select>

                <div className="section-label">รายการทักษะ</div>
                <div className="skill-tags">
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map(s => (
                      <div key={s.id} className="skill-tag">
                        {s.name}
                        <button onClick={() => removeSkill(s.id)}>×</button>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: "12px", color: "#a1a1aa", fontFamily: "'DM Sans',sans-serif" }}>ยังไม่มีทักษะสำหรับรูปแบบนี้</p>
                  )}
                </div>

                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                    placeholder="ชื่อทักษะ เช่น React, Python..."
                    onKeyDown={e => { if (e.key === "Enter") handleAddSkillDetailed(); }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    {data.skillDisplayMode === "category" && (
                      <select id="skillType">
                        <option value="Hard Skill">Hard Skill</option>
                        <option value="Soft Skill">Soft Skill</option>
                      </select>
                    )}
                    {(data.skillDisplayMode === "level-text" || data.skillDisplayMode === "level-bar") && (
                      <select id="skillLevel">
                        <option value="100|เชี่ยวชาญ">เชี่ยวชาญ (100%)</option>
                        <option value="80|ดีมาก">ดีมาก (80%)</option>
                        <option value="60|ปานกลาง">ปานกลาง (60%)</option>
                        <option value="40|พอใช้">พอใช้ (40%)</option>
                      </select>
                    )}
                  </div>
                  <button className="btn-add" onClick={handleAddSkillDetailed}>+ เพิ่มทักษะ</button>
                </div>
              </>
            )}
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div style={{
            flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px",
            padding: "14px 18px 18px",
            borderTop: "1px solid #e4e4e7",
            background: "#fff",
          }}>
            <button
              onClick={() => setShowA4Preview(true)}
              style={{
                padding: "10px 14px", borderRadius: "9px",
                border: "1.5px solid #bfdbfe",
                background: "#eff6ff", color: "#1e3a8a",
                fontWeight: "700", fontSize: "12.5px",
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.borderColor = "#93c5fd"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
            >
              📄 ดูตัวอย่าง A4 / Print
            </button>
            <button className="btn-download" onClick={handleSavePrivate}>
              💾 บันทึก Resume
            </button>
            <button
              className="btn-download"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
              onClick={handlePublishPublic}
            >
              🌐 โพสต์สาธารณะ → Feed
            </button>
          </div>
        </div>

        {/* ── LIVE PREVIEW ── */}
        <LivePreviewPanel data={data} onOpenA4={() => setShowA4Preview(true)} />
      </div>
    </>
  );
}