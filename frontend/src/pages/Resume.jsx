import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResumes } from "./ResumeContext";
import axios from "axios";
import "../styles/Resume.css";

const defaultData = {
  name: "",
  title: "",
  template: "",
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
};

function EntryBlock({ type, entries, onChange, onAdd, onRemove }) {
  const isEdu = type === "education";
  return (
    <div>
      {entries.map((e, i) => (
        <div key={e.id} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-title">
              {isEdu ? (e.degree || `ประวัติการศึกษาที่ ${i + 1}`) : (e.role || `ประสบการณ์ที่ ${i + 1}`)}
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
   A4 RESUME CONTENT (shared between preview & print)
───────────────────────────────────────────── */
function ResumeContent({ data, highlightField }) {
  const themeColor = data.themeColor || "#d4af37";

  const highlight = (field) =>
    highlightField === field
      ? { outline: `2px solid ${themeColor}`, outlineOffset: "2px", borderRadius: "3px", transition: "outline 0.2s" }
      : {};

  return (
    <div
      className={`resume-a4-sheet resume ${data.template}`}
      style={{
        "--theme-color": themeColor,
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "#fff",
        color: "#1a1a1a",
        fontFamily: "'Georgia', serif",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          backgroundColor: themeColor,
          padding: "36px 40px 28px",
          display: "flex",
          alignItems: "center",
          gap: "28px",
          transition: "background-color 0.3s",
        }}
      >
        {data.image && (
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              border: "4px solid rgba(255,255,255,0.9)",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            }}
          >
            <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: "28px",
              fontWeight: "700",
              color: "#fff",
              letterSpacing: "0.5px",
              textShadow: "0 1px 3px rgba(0,0,0,0.2)",
              ...highlight("name"),
            }}
          >
            {data.name || "ชื่อ-นามสกุล"}
          </h1>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: "15px",
              color: "rgba(255,255,255,0.88)",
              fontStyle: "italic",
              ...highlight("title"),
            }}
          >
            {data.title || "ตำแหน่งงาน"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
            {data.email && <ContactChip icon="✉" text={data.email} hl={highlight("email")} />}
            {data.phone && <ContactChip icon="📞" text={data.phone} hl={highlight("phone")} />}
            {data.location && <ContactChip icon="📍" text={data.location} hl={highlight("location")} />}
            {data.linkedin && <ContactChip icon="in" text={data.linkedin} />}
            {data.website && <ContactChip icon="🌐" text={data.website} />}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", minHeight: "calc(297mm - 175px)" }}>
        {/* MAIN COLUMN */}
        <div style={{ flex: "1 1 60%", padding: "32px 36px 36px 40px", borderRight: "1px solid #eee" }}>
          {data.summary && (
            <Section title="เกี่ยวกับฉัน" color={themeColor}>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.75", color: "#444", ...highlight("summary") }}>{data.summary}</p>
            </Section>
          )}

          {data.experience.length > 0 && (
            <Section title="ประสบการณ์ทำงาน" color={themeColor}>
              {data.experience.map((exp, i) => (
                <TimelineItem
                  key={exp.id}
                  title={exp.role}
                  subtitle={exp.org}
                  period={exp.period}
                  desc={exp.desc}
                  color={themeColor}
                  isLast={i === data.experience.length - 1}
                />
              ))}
            </Section>
          )}

          {data.education.length > 0 && (
            <Section title="การศึกษา" color={themeColor}>
              {data.education.map((edu, i) => (
                <TimelineItem
                  key={edu.id}
                  title={edu.degree}
                  subtitle={edu.school}
                  period={edu.period}
                  desc={edu.desc}
                  color={themeColor}
                  isLast={i === data.education.length - 1}
                />
              ))}
            </Section>
          )}
        </div>

        {/* SIDE COLUMN */}
        <div style={{ flex: "0 0 38%", padding: "32px 28px 36px 28px", backgroundColor: "#fafafa" }}>
          {data.skills.length > 0 && (
            <Section title="ทักษะความชำนาญ" color={themeColor}>
              <SkillsDisplay data={data} themeColor={themeColor} />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactChip({ icon, text, hl = {} }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.9)", ...hl }}>
      <span style={{ fontSize: "11px" }}>{icon}</span> {text}
    </span>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: "26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: "4px", height: "18px", backgroundColor: color, borderRadius: "2px", transition: "background-color 0.3s" }} />
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
        <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: color, marginTop: "4px", flexShrink: 0, transition: "background-color 0.3s" }} />
        {!isLast && <div style={{ width: "1px", flex: 1, backgroundColor: "#e0e0e0", marginTop: "4px" }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a1a" }}>{title || "—"}</span>
          {period && (
            <span style={{ fontSize: "11px", color: color, fontWeight: "600", whiteSpace: "nowrap", marginLeft: "8px", transition: "color 0.3s" }}>{period}</span>
          )}
        </div>
        {subtitle && <p style={{ margin: "0 0 5px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>{subtitle}</p>}
        {desc && <p style={{ margin: 0, fontSize: "12px", color: "#555", lineHeight: "1.6" }}>{desc}</p>}
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
          <span
            key={s.id}
            style={{
              fontSize: "11.5px",
              padding: "4px 10px",
              borderRadius: "20px",
              backgroundColor: `${themeColor}18`,
              border: `1px solid ${themeColor}55`,
              color: "#2a2a2a",
              fontWeight: "500",
              transition: "background-color 0.3s, border-color 0.3s",
            }}
          >
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
      <div style={{ fontSize: "12.5px" }}>
        {hard.length > 0 && (
          <>
            <p style={{ margin: "0 0 5px", fontWeight: "700", color: themeColor, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Hard Skills</p>
            <p style={{ margin: "0 0 14px", color: "#444", lineHeight: "1.6" }}>{hard.map(s => s.name).join(" · ")}</p>
          </>
        )}
        {soft.length > 0 && (
          <>
            <p style={{ margin: "0 0 5px", fontWeight: "700", color: themeColor, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Soft Skills</p>
            <p style={{ margin: 0, color: "#444", lineHeight: "1.6" }}>{soft.map(s => s.name).join(" · ")}</p>
          </>
        )}
      </div>
    );
  }

  if (skillDisplayMode === "level-text") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {skills.filter(s => s.type === "Hard Skill").map(s => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12.5px", color: "#333" }}>• {s.name}</span>
            <span style={{ fontSize: "11px", color: themeColor, fontWeight: "700", padding: "2px 8px", borderRadius: "10px", backgroundColor: `${themeColor}18` }}>
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
        {skills.filter(s => s.type === "Hard Skill").map(s => (
          <div key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", color: "#333", fontWeight: "500" }}>{s.name}</span>
              <span style={{ fontSize: "10px", color: themeColor, fontWeight: "700" }}>{s.level}%</span>
            </div>
            <div style={{ height: "5px", backgroundColor: "#e8e8e8", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.level}%`, backgroundColor: themeColor, borderRadius: "3px", transition: "background-color 0.3s" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────
   A4 PREVIEW MODAL — IMPROVED
───────────────────────────────────────────── */
function A4PreviewModal({ data, onClose }) {
  const [scale, setScale] = useState(0.8);

  // ปรับ scale อัตโนมัติตามขนาดหน้าจอ
  useEffect(() => {
    const updateScale = () => {
      const availW = window.innerWidth - 80;
      const a4w = 794; // 210mm ≈ 794px
      setScale(Math.min(0.9, availW / a4w));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handlePrint = () => {
    const printContent = document.getElementById("a4-print-target").innerHTML;
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${data.name || "Resume"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Georgia&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; }
            @page { size: A4; margin: 0; }
            @media print {
              html, body { width: 210mm; height: 297mm; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    win.document.close();
  };

  // ปิดด้วย Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "rgba(10,10,10,0.88)",
        overflowY: "auto",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

      {/* TOP BAR */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          backgroundColor: "rgba(15,15,15,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: data.themeColor || "#d4af37",
            boxShadow: `0 0 8px ${data.themeColor || "#d4af37"}`,
          }} />
          <div>
            <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600", margin: 0 }}>
              {data.name || "Resume Preview"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "2px 0 0" }}>
              ตัวอย่าง A4 · กด ESC หรือคลิกพื้นหลังเพื่อปิด
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Scale indicator */}
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginRight: "4px" }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handlePrint}
            style={{
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              background: `linear-gradient(135deg, ${data.themeColor || "#d4af37"}, ${data.themeColor || "#d4af37"}cc)`,
              color: "#1a1a1a",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: `0 4px 16px ${data.themeColor || "#d4af37"}44`,
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
              padding: "9px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.75)",
              fontWeight: "500",
              fontSize: "13px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >
            ✕ ปิด
          </button>
        </div>
      </div>

      {/* A4 SHEET — scaled */}
      <div
        style={{
          padding: "32px 24px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            marginBottom: `calc((297mm * ${scale}) - 297mm + 32px)`,
            animation: "slideUp 0.25s ease",
          }}
        >
          <div
            id="a4-print-target"
            style={{
              width: "210mm",
              minHeight: "297mm",
              backgroundColor: "#fff",
              boxShadow: "0 12px 60px rgba(0,0,0,0.6), 0 2px 12px rgba(0,0,0,0.4)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <ResumeContent data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SPLIT-SCREEN LIVE PREVIEW PANEL
───────────────────────────────────────────── */
function LivePreviewPanel({ data, onOpenA4 }) {
  const [previewScale, setPreviewScale] = useState(0.45);
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const a4w = 794;
      setPreviewScale(Math.max(0.3, Math.min(0.55, (w - 32) / a4w)));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const a4HeightPx = 1123; // 297mm ≈ 1123px

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#1a1a1e",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {/* Preview label */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        backgroundColor: "rgba(20,20,26,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(4px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            backgroundColor: "#22c55e",
            boxShadow: "0 0 6px #22c55e",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.5px" }}>
            LIVE PREVIEW · {Math.round(previewScale * 100)}%
          </span>
        </div>
        <button
          onClick={onOpenA4}
          style={{
            fontSize: "11px",
            padding: "5px 12px",
            borderRadius: "6px",
            border: "1px solid rgba(212,175,55,0.3)",
            background: "rgba(212,175,55,0.08)",
            color: "#d4af37",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          📄 A4 เต็มหน้า
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.4 }
        }
      `}</style>

      {/* Scaled A4 */}
      <div style={{ padding: "20px 16px 32px", width: "100%" }}>
        <div
          style={{
            transform: `scale(${previewScale})`,
            transformOrigin: "top center",
            height: `${a4HeightPx * previewScale}px`,
            position: "relative",
          }}
        >
          <div style={{
            width: "210mm",
            minHeight: "297mm",
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            borderRadius: "2px",
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
    set(section, [...data[section], { id: Date.now(), role: "", org: "", period: "", desc: "" }]);

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

  const tabs = [
    { id: "template", label: "เทมเพลต" },
    { id: "info", label: "ข้อมูล" },
    { id: "exp", label: "ประสบการณ์" },
    { id: "edu", label: "การศึกษา" },
    { id: "skills", label: "ทักษะ" },
  ];

  return (
    <>
      {savedToast && <div className="toast-notification">✓ บันทึก Resume แล้ว! กำลังไปหน้า Profile...</div>}

      {/* A4 PREVIEW MODAL */}
      {showA4Preview && <A4PreviewModal data={data} onClose={() => setShowA4Preview(false)} />}

      <div className="app" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="back-link" onClick={() => navigate("/feed")}>← กลับไปหน้า Feed</button>
            <div className="logo">résumé<span>craft</span></div>
          </div>

          <div className="sidebar-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="sidebar-body">
            {tab === "template" && (
              <>
                <div className="section-label">1. เลือกรูปแบบ Resume</div>
                <div className="template-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "25px" }}>
                  {[
                    { id: "classic", icon: "📜", label: "Classic" },
                    { id: "modern", icon: "📱", label: "Modern" },
                    { id: "professional", icon: "💼", label: "Professional" },
                  ].map(t => (
                    <div key={t.id} className={`template-card ${data.template === t.id ? "active" : ""}`} onClick={() => set("template", t.id)}>
                      <div className="tm-icon">{t.icon}</div>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>

                <div className="section-label">2. เลือกโทนสีที่ต้องการ</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {[
                    { name: "Gold", code: "#d4af37" },
                    { name: "Blue", code: "#0044cc" },
                    { name: "Green", code: "#10b981" },
                    { name: "Dark", code: "#1f2937" },
                  ].map(color => (
                    <button
                      key={color.code}
                      onClick={() => set("themeColor", color.code)}
                      style={{
                        width: "35px", height: "35px", borderRadius: "50%",
                        backgroundColor: color.code,
                        border: data.themeColor === color.code ? "3px solid #fff" : "none",
                        cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                        transition: "transform 0.15s",
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </>
            )}

            {tab === "info" && (
              <>
                <div className="section-label">รูปถ่ายโปรไฟล์</div>
                <div className="image-upload-wrapper" style={{ marginBottom: "20px", textAlign: "center" }}>
                  <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "#222", margin: "0 auto 10px", overflow: "hidden", border: "2px dashed #444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {data.image ? (
                      <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ color: "#666", fontSize: "12px" }}>ไม่มีรูป</span>
                    )}
                  </div>
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
                  <label htmlFor="profile-upload" className="btn-add" style={{ display: "inline-block", width: "auto", padding: "8px 16px", cursor: "pointer" }}>
                    📸 เลือกรูปถ่าย
                  </label>
                  {data.image && (
                    <button onClick={() => set("image", null)} style={{ background: "none", border: "none", color: "#e05555", fontSize: "12px", marginLeft: "10px", cursor: "pointer" }}>
                      ลบรูป
                    </button>
                  )}
                </div>

                <div className="section-label">ข้อมูลส่วนตัว</div>
                <div className="field"><label>ชื่อ-นามสกุล</label><input value={data.name} onChange={e => set("name", e.target.value)} placeholder="ชื่อเต็มของคุณ" /></div>
                <div className="field"><label>ตำแหน่ง / สาขาอาชีพ</label><input value={data.title} onChange={e => set("title", e.target.value)} placeholder="เช่น Software Engineer" /></div>
                <div className="section-label">ช่องทางติดต่อ</div>
                <div className="row">
                  <div className="field"><label>อีเมล</label><input value={data.email} onChange={e => set("email", e.target.value)} /></div>
                  <div className="field"><label>เบอร์โทรศัพท์</label><input value={data.phone} onChange={e => set("phone", e.target.value)} /></div>
                </div>
                <div className="row">
                  <div className="field"><label>ที่อยู่</label><input value={data.location} onChange={e => set("location", e.target.value)} placeholder="กรุงเทพฯ, ประเทศไทย" /></div>
                  <div className="field"><label>LinkedIn</label><input value={data.linkedin} onChange={e => set("linkedin", e.target.value)} /></div>
                </div>
                <div className="field"><label>เว็บไซต์</label><input value={data.website} onChange={e => set("website", e.target.value)} /></div>
                <div className="field"><label>สรุปประวัติ</label><textarea rows={5} value={data.summary} onChange={e => set("summary", e.target.value)} /></div>
              </>
            )}

            {tab === "exp" && (
              <>
                <div className="section-label">ประสบการณ์ทำงาน</div>
                <EntryBlock type="experience" entries={data.experience} onChange={(id, f, v) => updateEntry("experience", id, f, v)} onAdd={() => addEntry("experience")} onRemove={id => removeEntry("experience", id)} />
              </>
            )}

            {tab === "edu" && (
              <>
                <div className="section-label">การศึกษา</div>
                <EntryBlock type="education" entries={data.education} onChange={(id, f, v) => updateEntry("education", id, f, v)} onAdd={() => addEntry("education")} onRemove={id => removeEntry("education", id)} />
              </>
            )}

            {tab === "skills" && (
              <>
                <div className="section-label">รูปแบบการแสดงผล</div>
                <select
                  value={data.skillDisplayMode}
                  onChange={e => set("skillDisplayMode", e.target.value)}
                  style={{ width: "100%", marginBottom: "15px", padding: "9px 12px", borderRadius: "6px", border: "2px solid #636363", backgroundColor: "#24262a", color: "#fff" }}
                >
                  <option value="simple">รายการทั่วไป (Bullet Points)</option>
                  <option value="category">แยก Hard Skills & Soft Skills</option>
                  <option value="level-text">บอกระดับ (ดีมาก, ปานกลาง, พอใช้)</option>
                  <option value="level-bar">บอกเป็นเปอร์เซ็นต์ (Progress Bar)</option>
                </select>

                <div className="section-label">รายการทักษะที่เกี่ยวข้อง</div>
                <div className="skill-tags">
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map(s => (
                      <div key={s.id} className="skill-tag">
                        {s.name}
                        <button onClick={() => removeSkill(s.id)}>×</button>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: "12px", color: "#666" }}>ยังไม่มีข้อมูลสำหรับรูปแบบนี้</p>
                  )}
                </div>

                <div className="skill-add-form" style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="ชื่อทักษะ..." />
                  <div style={{ display: "flex", gap: "8px" }}>
                    {data.skillDisplayMode === "category" && (
                      <select id="skillType" style={{ flex: 1, padding: "9px 12px", borderRadius: "6px", border: "2px solid #636363", backgroundColor: "#24262a", color: "#fff" }}>
                        <option value="Hard Skill">Hard Skill</option>
                        <option value="Soft Skill">Soft Skill</option>
                      </select>
                    )}
                    {(data.skillDisplayMode === "level-text" || data.skillDisplayMode === "level-bar") && (
                      <select id="skillLevel" style={{ flex: 1, padding: "9px 12px", borderRadius: "6px", border: "2px solid #636363", backgroundColor: "#24262a", color: "#fff" }}>
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

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px 16px" }}>
            <button
              onClick={() => setShowA4Preview(true)}
              style={{
                padding: "11px",
                borderRadius: "8px",
                border: "1.5px solid rgba(212,175,55,0.5)",
                background: "rgba(212,175,55,0.08)",
                color: "#d4af37",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.08)"; }}
            >
              📄 ดูตัวอย่าง A4 / Print
            </button>
            <button className="btn-download" onClick={handleSavePrivate}>💾 บันทึก Resume</button>
            <button
              className="btn-download"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
              onClick={() => { publish(data); navigate("/feed"); }}
            >
              🌐 โพสต์สาธารณะ → Feed
            </button>
          </div>
        </div>

        {/* ── LIVE PREVIEW (split-screen แทน preview เดิม) ── */}
        <LivePreviewPanel data={data} onOpenA4={() => setShowA4Preview(true)} />
      </div>
    </>
  );
}