import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/Resume.css"
const fonts = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const style = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0e0e0e; color: #f0ede6; }

  
`;

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
      <style>{fonts}</style>
      <style>{style}</style>
      <div className="app">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-header">
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

          <button className="btn-download" onClick={handlePrint}>⬇ พิมพ์ / บันทึก PDF</button>
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
