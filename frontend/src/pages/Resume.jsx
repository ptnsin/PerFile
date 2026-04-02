import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  skillDisplayMode: "simple", // ตั้งค่าเริ่มต้นเป็นรายการทั่วไป
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

export default function ResumeBuilder() {
  const [data, setData] = useState(defaultData);
  const [tab, setTab] = useState("info");
  const [newSkill, setNewSkill] = useState("");
  const [savedToast, setSavedToast] = useState(false);
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

  // --- ระบบกรองทักษะตามรูปแบบการแสดงผลที่เลือก ---
  const filteredSkills = data.skills.filter(skill => {
    switch (data.skillDisplayMode) {
      case "category":
        return skill.type === "Hard Skill" || skill.type === "Soft Skill";
      case "level-text":
      case "level-bar":
        // โหมดที่ต้องโชว์ระดับ จะเน้นไปที่ Hard Skill
        return skill.type === "Hard Skill";
      case "simple":
      default:
        return true;
    }
  });

  const handleAddSkillDetailed = () => {
  // ถ้าไม่มีปุ่มเลือก ให้ใช้ค่า Default
  const type = document.getElementById('skillType')?.value || "Hard Skill";
  const levelSelect = document.getElementById('skillLevel')?.value || "80|ดีมาก";
  const [lv, lb] = levelSelect.split('|');

  if (newSkill.trim()) {
    set("skills", [...data.skills, { 
      id: Date.now(), 
      name: newSkill.trim(), 
      type: type, 
      level: parseInt(lv), 
      label: lb 
    }]);
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
            order: index + 2
          })),
          ...data.education.map((edu, index) => ({
            type: "education",
            content: { degree: edu.degree, school: edu.school, period: edu.period, desc: edu.desc },
            order: data.experience.length + index + 2
          })),
          { 
            type: "skills", 
            content: { displayMode: data.skillDisplayMode, list: data.skills }, 
            order: 99 
          }
        ]
      };

      const response = await axios.post("http://localhost:3000/resumes", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.status === 201) {
        setTimeout(() => {
          setSavedToast(false);
          navigate("/profile");
        }, 1200);
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
      {savedToast && (
        <div className="toast-notification">✓ บันทึก Resume แล้ว! กำลังไปหน้า Profile...</div>
      )}

      <div className="app">
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="back-link" onClick={() => navigate('/feed')}>← กลับไปหน้า Feed</button>
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
                <div className="template-grid" style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr", 
                  gap: "12px", 
                  marginBottom: "25px" 
                }}>
                  {/* รูปแบบ Classic */}
                  <div 
                    className={`template-card ${data.template === 'classic' ? 'active' : ''}`}
                    onClick={() => set("template", "classic")}
                  >
                    <div className="tm-icon">📜</div>
                    <span>Classic</span>
                  </div>

                  {/* รูปแบบ Modern */}
                  <div 
                    className={`template-card ${data.template === 'modern' ? 'active' : ''}`}
                    onClick={() => set("template", "modern")}
                  >
                    <div className="tm-icon">📱</div>
                    <span>Modern</span>
                  </div>

                  {/* รูปแบบ Professional */}
                  <div 
                    className={`template-card ${data.template === 'professional' ? 'active' : ''}`}
                    onClick={() => set("template", "professional")}
                  >
                    <div className="tm-icon">💼</div>
                    <span>Professional</span>
                  </div>
                </div>

                <div className="section-label">2. เลือกโทนสีที่ต้องการ</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {[
                    { name: "Gold", code: "#d4af37" },
                    { name: "Blue", code: "#0044cc" },
                    { name: "Green", code: "#10b981" },
                    { name: "Dark", code: "#1f2937" }
                  ].map(color => (
                    <button
                      key={color.code}
                      onClick={() => set("themeColor", color.code)}
                      style={{
                        width: "35px", height: "35px", borderRadius: "50%",
                        backgroundColor: color.code, border: data.themeColor === color.code ? "3px solid #fff" : "none",
                        cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
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
                <div className="image-upload-wrapper" style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div className="image-preview-circle" style={{ 
                    width: '100px', height: '100px', borderRadius: '50%', 
                    backgroundColor: '#222', margin: '0 auto 10px', 
                    overflow: 'hidden', border: '2px dashed #444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {data.image ? (
                      <img src={data.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#666', fontSize: '12px' }}>ไม่มีรูป</span>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="profile-upload" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => set("image", reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="profile-upload" className="btn-add" style={{ display: 'inline-block', width: 'auto', padding: '8px 16px', cursor: 'pointer' }}>
                    📸 เลือกรูปถ่าย
                  </label>
                  {data.image && (
                    <button onClick={() => set("image", null)} style={{ background: 'none', border: 'none', color: '#e05555', fontSize: '12px', marginLeft: '10px', cursor: 'pointer' }}>
                      ลบรูป
                    </button>
                  )}
                </div>
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
                  <div className="field"><label>อีเมล</label><input value={data.email} onChange={e => set("email", e.target.value)} /></div>
                  <div className="field"><label>เบอร์โทรศัพท์</label><input value={data.phone} onChange={e => set("phone", e.target.value)} /></div>
                </div>
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
                  onChange={(e) => set("skillDisplayMode", e.target.value)}
                  className="template-select"
                  style={{ width: '100%', marginBottom: '15px', padding: '9px 12px', borderRadius: '6px', border: '2px solid #636363', backgroundColor: '#24262a', color: '#fff' }}
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
                    <p style={{ fontSize: '12px', color: '#666' }}>ยังไม่มีข้อมูลสำหรับรูปแบบนี้</p>
                  )}
                </div>

                <div className="skill-add-form" style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    value={newSkill} 
                    onChange={e => setNewSkill(e.target.value)} 
                    placeholder="ชื่อทักษะ..." 
                  />
                  
                  {/* 🟢 ส่วนที่ปรับปรุง: เช็คเงื่อนไขการแสดงปุ่มเลือก */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    
                    {/* แสดง "ประเภททักษะ" เฉพาะเมื่อเลือกแบบแยกประเภท (category) */}
                    {data.skillDisplayMode === "category" && (
                      <select id="skillType" style={{ flex: 1, padding: '9px 12px', borderRadius: '6px', border: '2px solid #636363', backgroundColor: '#24262a', color: '#fff' }}>
                        <option value="Hard Skill">Hard Skill</option>
                        <option value="Soft Skill">Soft Skill</option>
                      </select>
                    )}

                    {/* แสดง "ระดับทักษะ" เฉพาะเมื่อเลือกแบบบอกระดับ (level-text) หรือเปอร์เซ็นต์ (level-bar) */}
                    {(data.skillDisplayMode === "level-text" || data.skillDisplayMode === "level-bar") && (
                      <select id="skillLevel" style={{ flex: 1, padding: '9px 12px', borderRadius: '6px', border: '2px solid #636363', backgroundColor: '#24262a', color: '#fff' }}>
                        <option value="100|เชี่ยวชาญ">เชี่ยวชาญ (100%)</option>
                        <option value="80|ดีมาก">ดีมาก (80%)</option>
                        <option value="60|ปานกลาง">ปานกลาง (60%)</option>
                        <option value="40|พอใช้">พอใช้ (40%)</option>
                      </select>
                    )}

                    {/* ถ้าเป็น "รายการทั่วไป (simple)" จะไม่โชว์ปุ่มเลือกอะไรเลยตามโจทย์ครับ */}
                  </div>

                  <button className="btn-add" onClick={handleAddSkillDetailed}>+ เพิ่มทักษะ</button>
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px 16px" }}>
            <button className="btn-download" onClick={handleSavePrivate}>💾 บันทึก Resume</button>
            <button className="btn-download" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }} onClick={() => { publish(data); navigate('/feed'); }}>🌐 โพสต์สาธารณะ → Feed</button>
          </div>
        </div>

        {/* PREVIEW AREA (ตรงตามโหมดการแสดงผลที่เลือก) */}
        <div className="preview-area">
          <div 
            className={`resume ${data.template}`} 
            style={{ "--theme-color": data.themeColor || "#d4af37" }} 
            ref={resumeRef}
          >
            <div className="resume-header" style={{ backgroundColor: "var(--theme-color)", display: 'flex', alignItems: 'center', gap: '30px' }}>
              {data.image && (
                <div className="resume-photo" style={{ 
                  width: '120px', height: '120px', borderRadius: '50%', 
                  border: '4px solid #fff', overflow: 'hidden', flexShrink: 0 
                }}>
                  <img src={data.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div className="resume-name">{data.name || "ชื่อของคุณ"}</div>
              <div className="resume-title">{data.title || "ตำแหน่งงาน"}</div>
            </div>
            <div className="resume-body">
              <div className="resume-main">
                {data.summary && (
                  <div className="r-section">
                    <div className="r-section-title">เกี่ยวกับฉัน</div>
                    <div className="r-summary">{data.summary}</div>
                  </div>
                )}
              </div>

              <div className="resume-side">
                <div className="r-section">
                  <div className="r-section-title">ทักษะความชำนาญ</div>
                  
                  {data.skillDisplayMode === "simple" && (
                    <ul style={{ paddingLeft: '15px', fontSize: '13px' }}>
                      {data.skills.map(s => <li key={s.id}>{s.name}</li>)}
                    </ul>
                  )}

                  {data.skillDisplayMode === "category" && (
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--gold)' }}>Hard Skills</div>
                      <p style={{ marginBottom: '8px' }}>{data.skills.filter(s => s.type === "Hard Skill").map(s => s.name).join(", ") || "-"}</p>
                      <div style={{ fontWeight: 'bold', color: 'var(--gold)' }}>Soft Skills</div>
                      <p>{data.skills.filter(s => s.type === "Soft Skill").map(s => s.name).join(", ") || "-"}</p>
                    </div>
                  )}

                  {data.skillDisplayMode === "level-text" && (
                    data.skills.filter(s => s.type === "Hard Skill").map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span>• {s.name}</span>
                        <span style={{ color: 'var(--gold)' }}>{s.label}</span>
                      </div>
                    ))
                  )}

                  {data.skillDisplayMode === "level-bar" && (
                    data.skills.filter(s => s.type === "Hard Skill").map(s => (
                      <div key={s.id} className="r-skill-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span className="r-skill-name">{s.name}</span>
                          <span style={{ fontSize: '10px' }}>{s.level}%</span>
                        </div>
                        <div className="r-skill-bar">
                          <div className="r-skill-fill" style={{ width: `${s.level}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}