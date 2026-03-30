import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useResumes } from "./ResumeContext";

 
import "../styles/Resume.css";


const fonts = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const style = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0e0e0e; color: #f0ede6; }

  :root {
    --gold: #c9a84c;
    --gold-light: #e8c97a;
    --cream: #f0ede6;
    --dark: #0e0e0e;
    --card: #181818;
    --border: #2a2a2a;
    --input-bg: #121212;
    --muted: #6b6b6b;
  }

  .back-link {
    display: block;
    margin-bottom: 10px;
    color: var(--gold);
    text-decoration: none;
    font-size: 14px;
  }

  .back-link:hover { color: var(--gold-light); }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* SIDEBAR */
  .sidebar {
    width: 380px;
    min-width: 380px;
    background: var(--card);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    padding: 28px 28px 20px;
    border-bottom: 1px solid var(--border);
    background: #111;
  }

  .logo {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    color: var(--gold);
    letter-spacing: 0.02em;
  }

  .logo span { color: var(--cream); font-style: italic; }

  .sidebar-tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: #111;
  }

  .tab {
    flex: 1;
    padding: 12px 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    cursor: pointer;
    border: none;
    background: transparent;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
  }

  .tab:hover { color: var(--cream); }
  .tab.active { color: var(--gold); border-bottom-color: var(--gold); }

  .sidebar-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px 28px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 14px;
    margin-top: 24px;
  }

  .section-label:first-child { margin-top: 0; }

  .field { margin-bottom: 14px; }

  label {
    display: block;
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 5px;
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  input, textarea {
    width: 100%;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    padding: 9px 12px;
    outline: none;
    transition: border-color 0.2s;
    resize: none;
  }

  input:focus, textarea:focus { border-color: var(--gold); }
  input::placeholder, textarea::placeholder { color: #3a3a3a; }

  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .entry-card {
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px;
    margin-bottom: 10px;
    position: relative;
  }

  .entry-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .entry-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--cream);
  }

  .btn-remove {
    background: none;
    border: none;
    color: #444;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 4px;
    transition: color 0.2s, background 0.2s;
  }

  .btn-remove:hover { color: #e05555; background: #2a1a1a; }

  .btn-add {
    width: 100%;
    padding: 10px;
    background: transparent;
    border: 1px dashed var(--border);
    border-radius: 6px;
    color: var(--muted);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.04em;
  }

  .btn-add:hover { border-color: var(--gold); color: var(--gold); }

  .skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }

  .skill-tag {
    background: #1e1e1e;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 11px;
    color: var(--cream);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .skill-tag button {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 12px;
    padding: 0;
    line-height: 1;
  }

  .skill-tag button:hover { color: #e05555; }

  .skill-input-row { display: flex; gap: 8px; }
  .skill-input-row input { flex: 1; }

  .btn-add-skill {
    padding: 9px 14px;
    background: var(--gold);
    border: none;
    border-radius: 6px;
    color: #000;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .btn-add-skill:hover { background: var(--gold-light); }

  .btn-download {
    margin: 20px 28px 28px;
    padding: 14px;
    background: var(--gold);
    border: none;
    border-radius: 8px;
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  }

  .btn-download:hover { background: var(--gold-light); }
  .btn-download:active { transform: scale(0.98); }

  /* PREVIEW */
  .preview-area {
    flex: 1;
    overflow-y: auto;
    background: #1a1a1a;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 40px 32px;
    scrollbar-width: thin;
    scrollbar-color: #2a2a2a transparent;
  }

  /* RESUME PAPER */
  .resume {
    width: 794px;
    min-height: 1123px;
    background: #181818;
    color: #f0f0f0;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 25px 80px rgba(0,0,0,0.8);
    position: relative;
    overflow: hidden;
  }

  .resume-header {
    background: #111;
    padding: 48px 52px 40px;
    position: relative;
  }

  .resume-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 52px; right: 52px;
    height: 1px;
    background: linear-gradient(90deg, var(--gold), transparent);
  }

  .resume-name {
    font-family: 'DM Serif Display', serif;
    font-size: 46px;
    color: #fff;
    line-height: 1;
    letter-spacing: -0.01em;
    margin-bottom: 6px;
  }

  .resume-title {
    font-size: 14px;
    color: var(--gold);
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 22px;
  }

  .resume-contacts {
    color: #ccc;
  }
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #aaa;
  }

  .contact-icon {
    color: var(--gold);
    font-size: 11px;
  }

  .resume-body {
    display: grid;
    grid-template-columns: 1fr 260px;
    gap: 0;
  }

  .resume-main {
    padding: 36px 52px;
    border-right: 1px solid #f0f0f0;
  }

  .resume-side {
    padding: 36px 30px;
    background: #fafafa;
  }

  .r-section { margin-bottom: 32px; }

  .r-section-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e8e8e8;
  }

  .r-summary {
    font-size: 13px;
    line-height: 1.7;
    color: #444;
  }

  .r-entry { margin-bottom: 20px; }

  .r-entry-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2px;
  }

  .r-entry-role {
    font-size: 14px;
    font-weight: 600;
    color: #111;
  }

  .r-entry-date {
    font-size: 11px;
    color: #999;
    white-space: nowrap;
  }

  .r-entry-org {
    font-size: 12px;
    color: #c9a84c;
    font-weight: 500;
    margin-bottom: 6px;
  }

  .r-entry-desc {
    font-size: 12px;
    color: #555;
    line-height: 1.6;
  }

  .r-skill-group { margin-bottom: 18px; }

  .r-skill-name {
    font-size: 11px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }

  .r-skill-bar {
    height: 3px;
    background: #e8e8e8;
    border-radius: 2px;
    overflow: hidden;
  }

  .r-skill-fill {
    height: 100%;
    background: linear-gradient(90deg, #c9a84c, #e8c97a);
    border-radius: 2px;
  }

  .r-tag {
    display: inline-block;
    background: #f0f0f0;
    border-radius: 3px;
    padding: 3px 8px;
    font-size: 11px;
    color: #444;
    margin: 2px;
  }

  @media print {
    .app { height: auto; }
    .sidebar { display: none; }
    .preview-area { padding: 0; background: #fff; }
    .resume { box-shadow: none; }
  }
`;
 
import "../styles/Resume.css";

const defaultData = {
  name: "ณิชา สุวรรณโชติ",
  title: "UX Designer & Product Strategist",
  email: "nicha@email.com",
  phone: "081-234-5678",
  location: "กรุงเทพมหานคร",
  linkedin: "linkedin.com/in/nicha",
  website: "nicha.design",
  summary: "นักออกแบบ UX ที่มีประสบการณ์มากกว่า 5 ปี ในการสร้างประสบการณ์ผู้ใช้ที่มีความหมายและวัดผลได้ เชี่ยวชาญในการวิจัยผู้ใช้ การสร้าง Prototype และการทำงานร่วมกับทีม Product",
  experience: [
    { id: 1, role: "Senior UX Designer", org: "LINE Thailand", period: "2022 – ปัจจุบัน", desc: "ออกแบบ UX/UI สำหรับ LINE Shopping ที่มีผู้ใช้งาน 5 ล้านคน นำทีมออกแบบ 3 คน และทำการวิจัยผู้ใช้เพื่อเพิ่ม Conversion Rate ขึ้น 32%" },
    { id: 2, role: "UX Designer", org: "Agoda", period: "2019 – 2022", desc: "ออกแบบ Mobile App สำหรับการจองโรงแรม ปรับปรุง Onboarding Flow ลด Drop-off ได้ 18% และสร้าง Design System ที่ใช้งานทั่วทั้งองค์กร" },
  ],
  education: [
    { id: 1, role: "ปริญญาตรี วิทยาการคอมพิวเตอร์", org: "จุฬาลงกรณ์มหาวิทยาลัย", period: "2015 – 2019", desc: "เกียรตินิยมอันดับสอง GPA 3.72" },
  ],
  skills: ["Figma", "User Research", "Prototyping", "Design Systems", "Usability Testing", "SQL", "Adobe XD"],
  languages: [
    { id: 1, role: "ภาษาไทย", org: "เจ้าของภาษา", period: "", desc: "" },
    { id: 2, role: "ภาษาอังกฤษ", org: "ระดับ Business (TOEIC 870)", period: "", desc: "" },
  ],
};

function EntryBlock({ entries, onChange, onAdd, onRemove, withDesc = true }) {
  return (
    <div>
      {entries.map((e, i) => (
        <div key={e.id} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-title">{e.role || `รายการที่ ${i + 1}`}</span>
            <button className="btn-remove" onClick={() => onRemove(e.id)}>×</button>
          </div>
          <div className="field">
            <label>ตำแหน่ง / ชื่อ</label>
            <input value={e.role} onChange={ev => onChange(e.id, "role", ev.target.value)} placeholder="ชื่อตำแหน่ง" />
          </div>
          <div className="row">
            <div className="field">
              <label>องค์กร / สถาบัน</label>
              <input value={e.org} onChange={ev => onChange(e.id, "org", ev.target.value)} placeholder="ชื่อองค์กร" />
            </div>
            <div className="field">
              <label>ช่วงเวลา</label>
              <input value={e.period} onChange={ev => onChange(e.id, "period", ev.target.value)} placeholder="2020 – 2023" />
            </div>
          </div>
          {withDesc && (
            <div className="field">
              <label>รายละเอียด</label>
              <textarea rows={3} value={e.desc} onChange={ev => onChange(e.id, "desc", ev.target.value)} placeholder="อธิบายผลงานหรือความรับผิดชอบ" />
            </div>
          )}
        </div>
      ))}
      <button className="btn-add" onClick={onAdd}>+ เพิ่มรายการ</button>
    </div>
  );
}

export default function ResumeBuilder() {
  const [data, setData] = useState(defaultData);
  const [tab, setTab] = useState("info");
  const [newSkill, setNewSkill] = useState("");
  const resumeRef = useRef();
  const navigate = useNavigate();
  const { publish } = useResumes();

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  const updateEntry = (section, id, field, val) =>
    set(section, data[section].map(e => e.id === id ? { ...e, [field]: val } : e));

  const addEntry = (section) =>
    set(section, [...data[section], { id: Date.now(), role: "", org: "", period: "", desc: "" }]);

  const removeEntry = (section, id) =>
    set(section, data[section].filter(e => e.id !== id));

  const addSkill = () => {
    if (newSkill.trim()) {
      set("skills", [...data.skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (s) => set("skills", data.skills.filter(x => x !== s));

  const handlePrint = () => window.print();

  const tabs = [
    { id: "info", label: "ข้อมูล" },
    { id: "exp", label: "ประสบการณ์" },
    { id: "edu", label: "การศึกษา" },
    { id: "skills", label: "ทักษะ" },
  ];

  return (
    <>
      <div className="app">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="back-link" onClick={() => { publish(data); navigate('/feed'); }}>← กลับไปหน้า Feed</button>
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
            {tab === "info" && (
              <>
                <div className="section-label">ข้อมูลส่วนตัว</div>
                <div className="field">
                  <label>ชื่อ-นามสกุล</label>
                  <input value={data.name} onChange={e => set("name", e.target.value)} placeholder="ชื่อเต็มของคุณ" />
                </div>
                <div className="field">
                  <label>ตำแหน่ง / สาขาอาชีพ</label>
                  <input value={data.title} onChange={e => set("title", e.target.value)} placeholder="เช่น Software Engineer" />
                </div>
                <div className="section-label">ช่องทางติดต่อ</div>
                <div className="row">
                  <div className="field">
                    <label>อีเมล</label>
                    <input value={data.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="field">
                    <label>เบอร์โทรศัพท์</label>
                    <input value={data.phone} onChange={e => set("phone", e.target.value)} placeholder="08x-xxx-xxxx" />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label>ที่อยู่</label>
                    <input value={data.location} onChange={e => set("location", e.target.value)} placeholder="กรุงเทพฯ" />
                  </div>
                  <div className="field">
                    <label>LinkedIn</label>
                    <input value={data.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="linkedin.com/in/..." />
                  </div>
                </div>
                <div className="field">
                  <label>Website / Portfolio</label>
                  <input value={data.website} onChange={e => set("website", e.target.value)} placeholder="yourwebsite.com" />
                </div>
                <div className="section-label">สรุปประวัติ</div>
                <div className="field">
                  <textarea rows={5} value={data.summary} onChange={e => set("summary", e.target.value)} placeholder="แนะนำตัวเองและจุดเด่นของคุณ..." />
                </div>
              </>
            )}

            {tab === "exp" && (
              <>
                <div className="section-label">ประสบการณ์ทำงาน</div>
                <EntryBlock
                  entries={data.experience}
                  onChange={(id, f, v) => updateEntry("experience", id, f, v)}
                  onAdd={() => addEntry("experience")}
                  onRemove={id => removeEntry("experience", id)}
                />
              </>
            )}

            {tab === "edu" && (
              <>
                <div className="section-label">การศึกษา</div>
                <EntryBlock
                  entries={data.education}
                  onChange={(id, f, v) => updateEntry("education", id, f, v)}
                  onAdd={() => addEntry("education")}
                  onRemove={id => removeEntry("education", id)}
                />
                <div className="section-label" style={{ marginTop: 28 }}>ภาษา</div>
                <EntryBlock
                  entries={data.languages}
                  onChange={(id, f, v) => updateEntry("languages", id, f, v)}
                  onAdd={() => addEntry("languages")}
                  onRemove={id => removeEntry("languages", id)}
                  withDesc={false}
                />
              </>
            )}

            {tab === "skills" && (
              <>
                <div className="section-label">ทักษะ</div>
                <div className="skill-tags">
                  {data.skills.map(s => (
                    <div key={s} className="skill-tag">
                      {s}
                      <button onClick={() => removeSkill(s)}>×</button>
                    </div>
                  ))}
                </div>
                <div className="skill-input-row">
                  <input
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addSkill()}
                    placeholder="พิมพ์ทักษะแล้วกด Enter"
                  />
                  <button className="btn-add-skill" onClick={addSkill}>+</button>
                </div>
              </>
            )}
          </div>

          <button className="btn-download" onClick={() => { publish(data); navigate('/feed'); }}>⬇ บันทึก &ไปติดตามในหน้า Feed</button>
        </div>

        {/* PREVIEW */}
        <div className="preview-area">
          <div className="resume" ref={resumeRef}>
            {/* Header */}
            <div className="resume-header">
              <div className="resume-name">{data.name || "ชื่อของคุณ"}</div>
              <div className="resume-title">{data.title || "ตำแหน่งงาน"}</div>
              <div className="resume-contacts">
                {data.email && <div className="contact-item"><span className="contact-icon">✉</span>{data.email}</div>}
                {data.phone && <div className="contact-item"><span className="contact-icon">✆</span>{data.phone}</div>}
                {data.location && <div className="contact-item"><span className="contact-icon">◎</span>{data.location}</div>}
                {data.linkedin && <div className="contact-item"><span className="contact-icon">in</span>{data.linkedin}</div>}
                {data.website && <div className="contact-item"><span className="contact-icon">⊕</span>{data.website}</div>}
              </div>
            </div>

            {/* Body */}
            <div className="resume-body">
              {/* Main Column */}
              <div className="resume-main">
                {data.summary && (
                  <div className="r-section">
                    <div className="r-section-title">เกี่ยวกับฉัน</div>
                    <div className="r-summary">{data.summary}</div>
                  </div>
                )}

                {data.experience.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">ประสบการณ์ทำงาน</div>
                    {data.experience.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-head">
                          <div className="r-entry-role">{e.role || "ตำแหน่ง"}</div>
                          <div className="r-entry-date">{e.period}</div>
                        </div>
                        <div className="r-entry-org">{e.org}</div>
                        {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {data.education.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">การศึกษา</div>
                    {data.education.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-head">
                          <div className="r-entry-role">{e.role || "สาขา"}</div>
                          <div className="r-entry-date">{e.period}</div>
                        </div>
                        <div className="r-entry-org">{e.org}</div>
                        {e.desc && <div className="r-entry-desc">{e.desc}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Column */}
              <div className="resume-side">
                {data.skills.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">ทักษะ</div>
                    {data.skills.map((s, i) => (
                      <div key={s} className="r-skill-group">
                        <div className="r-skill-name">{s}</div>
                        <div className="r-skill-bar">
                          <div className="r-skill-fill" style={{ width: `${85 - (i % 3) * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {data.languages.length > 0 && (
                  <div className="r-section">
                    <div className="r-section-title">ภาษา</div>
                    {data.languages.map(e => (
                      <div key={e.id} className="r-entry">
                        <div className="r-entry-role" style={{ fontSize: 13 }}>{e.role}</div>
                        <div className="r-entry-org">{e.org}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </>
  );
}
