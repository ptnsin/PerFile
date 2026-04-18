import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');`;

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #0e0e0e; }
  .view-container { display: flex; flex-direction: column; height: 100vh; }
  .view-header {
    background: #111; border-bottom: 1px solid #2a2a2a;
    padding: 14px 28px; display: flex;
    justify-content: space-between; align-items: center; flex-shrink: 0;
  }
  .view-header-info h1 { color: #fff; font-size: 16px; font-weight: 600; margin-bottom: 2px; }
  .view-header-info p { color: #c9a84c; font-size: 11px; }
  .view-header-actions { display: flex; gap: 10px; }
  .btn-action {
    padding: 8px 18px; background: #c9a84c; border: none;
    border-radius: 6px; color: #000; font-weight: 700;
    cursor: pointer; font-size: 12px; transition: background 0.2s;
  }
  .btn-action:hover { background: #e8c97a; }
  .preview-area {
    flex: 1; overflow-y: auto; background: #1a1a1a;
    display: flex; justify-content: center; padding: 36px 20px;
  }
  .loading-screen {
    display: flex; align-items: center; justify-content: center;
    height: 100vh; color: #c9a84c; font-size: 16px; background: #0e0e0e;
  }
  .not-found-screen {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; height: 100vh; background: #0e0e0e;
    color: #fff; gap: 20px;
  }
  @media print {
    @page { size: A4 portrait; margin: 0; }
    body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .view-header { display: none !important; }
    .preview-area { padding: 0 !important; background: #fff !important; overflow: visible !important; display: block !important; }
    .resume-sheet { box-shadow: none !important; margin: 0 auto !important; }
  }
`;

function normalizeResumeData(resume) {
  let experience = [];
  if (resume.experience) {
    const raw = typeof resume.experience === "string" ? JSON.parse(resume.experience) : resume.experience;
    experience = (Array.isArray(raw) ? raw : []).map((exp, i) => ({
      id: exp.id || i,
      role: exp.role || exp.position || "",
      org: exp.org || exp.company || "",
      period: exp.period || "",
      desc: exp.desc || exp.description || "",
    }));
  }

  let education = [];
  if (resume.education) {
    const raw = typeof resume.education === "string" ? JSON.parse(resume.education) : resume.education;
    education = (Array.isArray(raw) ? raw : []).map((edu, i) => ({
      id: edu.id || i,
      degree: edu.degree || "",
      school: edu.school || "",
      period: edu.period || "",
      desc: edu.desc || edu.description || "",
    }));
  }

  let skills = [];
  let skillDisplayMode = "simple";
  if (resume.skills) {
    const raw = typeof resume.skills === "string" ? JSON.parse(resume.skills) : resume.skills;
    if (raw?.list) {
      skillDisplayMode = raw.displayMode || "simple";
      skills = raw.list.map((s, i) => ({
        id: s.id || i, name: s.name || "",
        type: s.type || "Hard Skill", level: s.level || 80, label: s.label || "ดีมาก",
      }));
    } else if (Array.isArray(raw)) {
      skills = raw.map((s, i) => ({
        id: s.id || i, name: typeof s === "string" ? s : (s.name || ""),
        type: s.type || "Hard Skill", level: s.level || 80, label: s.label || "ดีมาก",
      }));
    }
  }

  return {
    name: resume.name || resume.ownerName || extractNameFromTitle(resume.title) || "",
    title: resume.jobTitle || resume.subtitle || "",
    template: resume.template || "classic",
    themeColor: resume.themeColor || "#c9a84c",
    image: resume.image || null,
    email: resume.email || "",
    phone: resume.phone || "",
    location: resume.location || "",
    linkedin: resume.linkedin || "",
    website: resume.website || "",
    summary: resume.summary || "",
    experience, education, skillDisplayMode, skills,
  };
}

function extractNameFromTitle(title) {
  if (!title) return "";
  return title.replace(/\s*[-–]\s*resume$/i, "").trim();
}

/* ── SKILLS DISPLAY ── */
function SkillsDisplay({ skills, skillDisplayMode, tc }) {
  if (!skills || skills.length === 0) return null;

  if (skillDisplayMode === "level-bar") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {skills.filter(s => s.type === "Hard Skill").map((s, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "#ddd", fontWeight: 500 }}>{s.name}</span>
              <span style={{ fontSize: "10px", color: tc, fontWeight: 700 }}>{s.level}%</span>
            </div>
            <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "2px" }}>
              <div style={{ height: "100%", width: `${s.level}%`, backgroundColor: tc, borderRadius: "2px" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (skillDisplayMode === "level-text") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {skills.filter(s => s.type === "Hard Skill").map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#ddd" }}>{s.name}</span>
            <span style={{ fontSize: "10px", color: tc, fontWeight: 700, padding: "1px 8px", borderRadius: "10px", border: `1px solid ${tc}50` }}>{s.label}</span>
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
        {hard.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "9px", fontWeight: 700, color: tc, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Hard Skills</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {hard.map((s, i) => <span key={i} style={{ fontSize: "10px", color: "#ddd", background: "rgba(255,255,255,0.08)", padding: "3px 8px", borderRadius: "4px" }}>{s.name}</span>)}
            </div>
          </div>
        )}
        {soft.length > 0 && (
          <div>
            <p style={{ fontSize: "9px", fontWeight: 700, color: tc, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Soft Skills</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {soft.map((s, i) => <span key={i} style={{ fontSize: "10px", color: "#ddd", background: "rgba(255,255,255,0.08)", padding: "3px 8px", borderRadius: "4px" }}>{s.name}</span>)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // simple (default)
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {skills.map((s, i) => (
        <span key={i} style={{
          fontSize: "10px", color: "#e8e8e8",
          background: "rgba(255,255,255,0.1)",
          border: `1px solid rgba(255,255,255,0.15)`,
          padding: "4px 10px", borderRadius: "20px", fontWeight: 500,
        }}>{s.name}</span>
      ))}
    </div>
  );
}

/* ── RESUME LAYOUT ── */
function ResumeSheet({ data }) {
  const tc = data.themeColor || "#c9a84c";

  return (
    <div className="resume-sheet" style={{
      width: "794px",
      minHeight: "1123px",
      backgroundColor: "#fff",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
      fontFamily: "'Inter', sans-serif",
      overflow: "hidden",
    }}>

      {/* ══ HEADER ══ */}
      <div style={{
        background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, ${tc}22 100%)`,
        padding: "44px 52px 36px",
        display: "flex",
        alignItems: "center",
        gap: "32px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* accent bar */}
        <div style={{ position: "absolute", left: 0, top: 0, width: "5px", height: "100%", background: tc }} />
        {/* accent circle deco */}
        <div style={{ position: "absolute", right: -60, top: -60, width: "220px", height: "220px", borderRadius: "50%", background: `${tc}10`, border: `1px solid ${tc}20` }} />

        {/* Avatar */}
        <div style={{
          width: "100px", height: "100px", borderRadius: "50%",
          border: `3px solid ${tc}`,
          overflow: "hidden", flexShrink: 0,
          backgroundColor: "#2a2a3e",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 0 4px ${tc}30`,
        }}>
          {data.image
            ? <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <svg width="44" height="44" viewBox="0 0 42 42" fill="none">
                <circle cx="21" cy="16" r="9" fill="rgba(255,255,255,0.3)" />
                <path d="M4 38c0-9.39 7.61-17 17-17s17 7.61 17 17" fill="rgba(255,255,255,0.3)" />
              </svg>
          }
        </div>

        {/* Name & Info */}
        <div style={{ flex: 1, zIndex: 1 }}>
          <h1 style={{
            fontSize: "34px", fontWeight: 800, color: "#fff",
            letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: "6px",
            fontFamily: "'Playfair Display', serif",
          }}>
            {data.name || "ชื่อ-นามสกุล"}
          </h1>
          {data.title && (
            <p style={{ fontSize: "13px", color: tc, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "16px" }}>
              {data.title}
            </p>
          )}

          {/* Contact chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {data.email    && <ContactItem icon="✉" text={data.email} />}
            {data.phone    && <ContactItem icon="📞" text={data.phone} />}
            {data.location && <ContactItem icon="📍" text={data.location} />}
            {data.linkedin && <ContactItem icon="in" text={data.linkedin} />}
            {data.website  && <ContactItem icon="🌐" text={data.website} />}
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* LEFT SIDEBAR */}
        <div style={{
          width: "260px", flexShrink: 0,
          backgroundColor: "#1e1e2e",
          padding: "32px 28px",
          display: "flex", flexDirection: "column", gap: "28px",
        }}>

          {/* Summary */}
          {data.summary && (
            <SideSection title="เกี่ยวกับฉัน" tc={tc}>
              <p style={{ fontSize: "11px", color: "#bbb", lineHeight: "1.8" }}>{data.summary}</p>
            </SideSection>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <SideSection title="การศึกษา" tc={tc}>
              {data.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: i < data.education.length - 1 ? "14px" : 0 }}>
                  {edu.degree && <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#eee", marginBottom: "2px" }}>{edu.degree}</p>}
                  {edu.school && <p style={{ fontSize: "10.5px", color: "#aaa", marginBottom: "2px" }}>{edu.school}</p>}
                  {edu.period && <p style={{ fontSize: "10px", color: tc, fontWeight: 600 }}>{edu.period}</p>}
                  {edu.desc   && <p style={{ fontSize: "10px", color: "#999", marginTop: "4px", lineHeight: "1.6" }}>{edu.desc}</p>}
                </div>
              ))}
            </SideSection>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <SideSection title="ทักษะ" tc={tc}>
              <SkillsDisplay skills={data.skills} skillDisplayMode={data.skillDisplayMode} tc={tc} />
            </SideSection>
          )}

          {/* Contacts (ซ้ำอีกครั้งในแนวตั้ง ถ้ามี) */}
          {(data.email || data.phone || data.location) && (
            <SideSection title="ติดต่อ" tc={tc}>
              {data.email    && <p style={{ fontSize: "10.5px", color: "#bbb", marginBottom: "5px" }}>✉ {data.email}</p>}
              {data.phone    && <p style={{ fontSize: "10.5px", color: "#bbb", marginBottom: "5px" }}>📞 {data.phone}</p>}
              {data.location && <p style={{ fontSize: "10.5px", color: "#bbb", marginBottom: "5px" }}>📍 {data.location}</p>}
              {data.linkedin && <p style={{ fontSize: "10.5px", color: "#bbb", marginBottom: "5px" }}>in {data.linkedin}</p>}
              {data.website  && <p style={{ fontSize: "10.5px", color: "#bbb" }}>🌐 {data.website}</p>}
            </SideSection>
          )}
        </div>

        {/* RIGHT MAIN */}
        <div style={{ flex: 1, padding: "32px 44px", backgroundColor: "#fff" }}>

          {/* Experience */}
          {data.experience.length > 0 && (
            <MainSection title="ประสบการณ์ทำงาน" tc={tc}>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: i < data.experience.length - 1 ? "22px" : 0, paddingBottom: i < data.experience.length - 1 ? "22px" : 0, borderBottom: i < data.experience.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 700, color: "#111" }}>{exp.role || "—"}</p>
                    {exp.period && (
                      <span style={{ fontSize: "11px", color: "#fff", fontWeight: 600, background: tc, padding: "2px 10px", borderRadius: "20px", flexShrink: 0, marginLeft: "12px" }}>
                        {exp.period}
                      </span>
                    )}
                  </div>
                  {exp.org  && <p style={{ fontSize: "12px", color: "#666", fontWeight: 500, marginBottom: "6px" }}>🏢 {exp.org}</p>}
                  {exp.desc && <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.75" }}>{exp.desc}</p>}
                </div>
              ))}
            </MainSection>
          )}

          {/* ถ้าไม่มีข้อมูลอะไรเลย */}
          {data.experience.length === 0 && !data.summary && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
              <p style={{ color: "#ccc", fontSize: "13px" }}>ยังไม่มีข้อมูลประสบการณ์</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactItem({ icon, text }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(255,255,255,0.75)" }}>
      <span style={{ fontSize: "10px" }}>{icon}</span>{text}
    </span>
  );
}

function SideSection({ title, tc, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <div style={{ width: "3px", height: "14px", backgroundColor: tc, borderRadius: "2px", flexShrink: 0 }} />
        <h3 style={{ fontSize: "10px", fontWeight: 700, color: tc, textTransform: "uppercase", letterSpacing: "1.5px" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MainSection({ title, tc, children }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
        <h2 style={{ fontSize: "12px", fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "1.5px", whiteSpace: "nowrap" }}>{title}</h2>
        <div style={{ flex: 1, height: "2px", background: `linear-gradient(to right, ${tc}, transparent)` }} />
      </div>
      {children}
    </div>
  );
}

/* ── MAIN EXPORT ── */
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
          <h2>ไม่พบ Resume นี้</h2>
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
        <div className="preview-area">
          <ResumeSheet data={resumeData} />
        </div>
      </div>
    </>
  );
}
