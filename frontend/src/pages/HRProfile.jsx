import React, { useState, useEffect, useRef } from "react"
import "../styles/HRProfile.css";
import { useNavigate, useLocation } from "react-router-dom";

// ═══════════════════════════════════════════════════════════════
//  TODO: เชื่อม Backend — แก้ฟังก์ชันด้านล่างให้ fetch จาก API จริง
//  ตัวอย่าง: const res = await fetch("/api/hr/profile"); return res.json();
// ═══════════════════════════════════════════════════════════════

async function getHrProfile() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/hr/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    
    const profile = data.profile;
    // ดึงค่าจากทั้งตาราง User และตาราง hr_profile มาเชื่อมกัน
    return {
      ...profile,
      // Map ข้อมูลพื้นฐานจาก User
      name: profile.fullName || profile.username || "ยังไม่ระบุชื่อ", 
      avatar: profile.avatar || null,
      
      // Map ข้อมูลบริษัทจากตาราง hr_profile (ระวังชื่อต้องตรงกับ Backend)
      bio: profile.hr_profile?.bio || "ยังไม่ระบุรายละเอียด",
      website: profile.hr_profile?.website || "ยังไม่ระบุ",
      location: profile.hr_profile?.location || "ยังไม่ระบุ",
      
      // ตรวจสอบชื่อ Key ด้านล่างนี้ให้ตรงกับ Backend
      company: profile.hr_profile?.company || profile.company || "ยังไม่ระบุบริษัท",
      industry: profile.hr_profile?.industry || "ยังไม่ระบุ",
      companyDesc: profile.hr_profile?.company_desc || "ยังไม่ระบุข้อมูลบริษัท", // แก้จาก company_desc ใน DB เป็น companyDesc ให้ UI
      companySize: profile.hr_profile?.company_size || "ยังไม่ระบุ",
      founded: profile.hr_profile?.founded || "ยังไม่ระบุ",
      
      role: profile.role || "HR Recruiter",
      handle: profile.username ? `@${profile.username}` : "@username"
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getOpenJobs() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/hr/jobs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const allJobs = data.jobs || [];
    // กรองเฉพาะงานที่สถานะเป็น "เปิดรับสมัคร"
    return allJobs.filter(job => job.status === "เปิดรับสมัคร");
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function getClosedJobs() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/hr/jobs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const allJobs = data.jobs || [];
    // กรองเฉพาะงานที่สถานะเป็น "ปิดแล้ว"
    return allJobs.filter(job => job.status === "ปิดแล้ว");
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function getStats() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/hr/jobs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const allJobs = data.jobs || [];
    
    return [
      { num: allJobs.filter(j => j.status === "เปิดรับสมัคร").length, label: "ตำแหน่งเปิดรับ" },
      { num: "340", label: "ผู้สมัครทั้งหมด" }, // ส่วนนี้ถ้ายังไม่มี API ให้ใส่เลขหลอกไว้ก่อน
      { num: "28", label: "สัมภาษณ์เดือนนี้" },
      { num: "94%", label: "อัตราตอบรับ" },
    ];
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function getAboutItems() {
  return [
    { icon: "🎓", title: "การศึกษา", detail: "ปริญญาตรี สาขาบริหารทรัพยากรมนุษย์" },
    { icon: "💼", title: "ประสบการณ์", detail: "HR Recruiter มากกว่า 5 ปี" },
    { icon: "🌟", title: "ความเชี่ยวชาญ", detail: "IT Recruitment, Headhunting" },
  ];
}

async function getQuickActions() {
  return [
    { icon: "👥", label: "ดูผู้สมัครทั้งหมด", sub: "ตรวจสอบใบสมัครใหม่" },
    { icon: "📅", label: "ตารางสัมภาษณ์", sub: "ดูนัดหมายวันนี้" },
    { icon: "📊", label: "รายงานการสรรหา", sub: "สรุปผลรายเดือน" },
  ];
}

async function getApplicants()   { /* TODO */ return []; }
async function getInterviews()   { /* TODO */ return []; }
async function getReportData()   { /* TODO */ return null; }
async function getActivities()   { /* TODO */ return []; }


// TODO: เชื่อม update กลับ backend
async function saveHrProfile(payload) {
  try {
    const token = localStorage.getItem("token");
    await fetch("http://localhost:3000/hr/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(err);
  }
}

async function saveAboutItems(/*items*/)   { /* TODO */ }

// ── Dept color map ────────────────────────────────────────────
const DEPT_COLORS = {
  Engineering:    { bg: "#eff6ff", text: "#1d4ed8" },
  Design:         { bg: "#fdf4ff", text: "#7e22ce" },
  Infrastructure: { bg: "#f0fdf4", text: "#15803d" },
  Analytics:      { bg: "#fff7ed", text: "#c2410c" },
  Marketing:      { bg: "#fff1f2", text: "#be123c" },
};

// ── Skeleton block ────────────────────────────────────────────
function Skeleton({ w = "100%", h = 14, radius = 6, style = {} }) {
  return (
    <span style={{
      display: "inline-block", width: w, height: h,
      borderRadius: radius,
      background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "hr-shimmer 1.4s infinite",
      verticalAlign: "middle", ...style,
    }} />
  );
}

// ── Inline Edit Field ─────────────────────────────────────────
function EditableField({ value, onChange, multiline = false, className = "", style = {} }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  const commit = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (!value && value !== 0) return <Skeleton w={120} />;

  if (editing) {
    return (
      <span className="hr-edit-inline-wrap">
        {multiline ? (
          <textarea className={`hr-edit-textarea ${className}`} style={style}
            value={draft} autoFocus
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") cancel(); }}
          />
        ) : (
          <input className={`hr-edit-input ${className}`} style={style}
            value={draft} autoFocus
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
          />
        )}
        <span className="hr-edit-actions">
          <button className="hr-edit-confirm" onClick={commit} title="บันทึก">✓</button>
          <button className="hr-edit-cancel"  onClick={cancel} title="ยกเลิก">✕</button>
        </span>
      </span>
    );
  }

  return (
    <span className={`hr-editable ${className}`} style={style}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="คลิกเพื่อแก้ไข"
    >
      {value}<span className="hr-edit-pencil">✏️</span>
    </span>
  );
}

// ── Empty placeholder ─────────────────────────────────────────
function EmptySlot({ icon, text }) {
  return (
    <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#9ca3af" }}>
      <div style={{ fontSize: "2rem", marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: "0.85rem" }}>{text}</div>
    </div>
  );
}

// ── Reusable Job Cards ────────────────────────────────────────
function JobCard({ job, savedJobs, toggleSave, setActivePage }) {
  const dept    = DEPT_COLORS[job.dept] || { bg: "#f4f4f5", text: "#52525b" };
  const isSaved = savedJobs.includes(job.id);
  return (
    <div className="hr-job-card">
      <div className="hr-job-top">
        <div className="hr-job-title-wrap">
          <div className="hr-job-title">{job.title}</div>
          <span className="hr-job-dept" style={{ background: dept.bg, color: dept.text }}>{job.dept}</span>
        </div>
        <div className="hr-job-actions">
          {job.urgent && <span className="hr-urgent-badge">⚡ ด่วน</span>}
          <button className={`hr-save-btn${isSaved ? " saved" : ""}`} onClick={() => toggleSave(job.id)} title={isSaved ? "ยกเลิก save" : "บันทึกงาน"}>
            {isSaved ? "🔖" : "🏷️"}
          </button>
        </div>
      </div>
      <div className="hr-job-meta">
        <span className="hr-job-meta-item">📍 {job.location}</span>
        <span className="hr-job-meta-item">⏱ {job.type}</span>
        <span className="hr-job-meta-item">💰 {job.salary}</span>
      </div>
      <div className="hr-job-footer">
        <div>
          <div className="hr-job-posted">โพสต์เมื่อ {job.posted}</div>
          <div className="hr-job-applicants">👥 {job.applicants} ผู้สมัคร</div>
        </div>
        <button className="hr-apply-btn" onClick={() => setActivePage("applicants")}>ดูผู้สมัคร →</button>
      </div>
    </div>
  );
}

function ClosedJobCard({ job }) {
  const dept = DEPT_COLORS[job.dept] || { bg: "#f4f4f5", text: "#52525b" };
  return (
    <div className="hr-closed-card">
      <div className="hr-closed-left">
        <div className="hr-closed-icon" style={{ background: dept.bg, color: dept.text }}>
          {job.dept === "Engineering" ? "⚙️" : job.dept === "Marketing" ? "📣" : "🎨"}
        </div>
        <div className="hr-closed-info">
          <div className="hr-closed-title">{job.title}</div>
          <div className="hr-closed-meta">
            <span className="hr-job-dept" style={{ background: dept.bg, color: dept.text }}>{job.dept}</span>
            <span className="hr-closed-date">ปิดเมื่อ {job.closedDate}</span>
          </div>
          <div className="hr-closed-stats">
            <span>👥 {job.applicants} ผู้สมัคร</span>
            <span className="hr-hired-chip">✓ รับ: {job.hired}</span>
          </div>
        </div>
      </div>
      <div className="hr-closed-actions">
        <button className="hr-reopen-btn">↩ เปิดใหม่</button>
      </div>
    </div>
  );
}

// ── Profile View ──────────────────────────────────────────────
function ProfileView({ hr, setHr, aboutItems, setAboutItems, stats, openJobs, closedJobs, newPerk, setNewPerk, savedJobs, setSavedJobs, setActivePage, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab === "saved" ? "saved" : "jobs");
  const savedSectionRef = useRef(null);
  const hasScrolled     = useRef(false);

  // scroll ครั้งเดียวตอน mount เท่านั้น — ใช้ [] dependency
  useEffect(() => {
    if (initialTab === "saved" && !hasScrolled.current) {
      hasScrolled.current = true;
      window.history.replaceState({}, document.title); // ลบ state ออกทันที
      setTimeout(() => {
        savedSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []); // eslint-disable-line

  const updateHr = (key) => (val) => {
    const updated = { ...(hr || {}), [key]: val };
    setHr(updated);
    saveHrProfile({ [key]: val });
  };
  const updateAbout = (idx, key) => (val) => {
    const updated = aboutItems.map((item, i) => i === idx ? { ...item, [key]: val } : item);
    setAboutItems(updated);
    saveAboutItems(updated);
  };
  const toggleSave = (id) => setSavedJobs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const removePerk = (p) => { const u = { ...(hr||{}), perks: (hr?.perks||[]).filter(x => x !== p) }; setHr(u); saveHrProfile({ perks: u.perks }); };
  const addPerk    = () => { if (newPerk.trim()) { const u = { ...(hr||{}), perks: [...(hr?.perks||[]), newPerk.trim()] }; setHr(u); saveHrProfile({ perks: u.perks }); setNewPerk(""); } };

  const savedJobsList = openJobs.filter(j => savedJobs.includes(j.id));
  const TABS = [
    { key: "jobs",   label: "ตำแหน่งงาน", count: openJobs.length },
    { key: "closed", label: "ปิดแล้ว",     count: closedJobs.length },
    { key: "saved",  label: "Saved",        count: savedJobsList.length },
  ];

  return (
    <>
      {/* Profile Card */}
      <div className="hr-card">
        <div className="hr-cover">
          <div className="hr-cover-pattern" />
          <button className="hr-cover-edit">✏️ แก้ไขปก</button>
        </div>
        <div className="hr-profile-body">
          <div className="hr-avatar-row">
            <div className="hr-avatar">{hr?.name?.[0] ?? "?"}</div>
          </div>
          <div className="hr-profile-name"><EditableField value={hr?.name}   onChange={updateHr("name")} /></div>
          <div className="hr-profile-role">
            <EditableField value={hr?.role}    onChange={updateHr("role")} /> ·{" "}
            <EditableField value={hr?.company} onChange={updateHr("company")} />
          </div>
          <div className="hr-profile-handle">
            <EditableField value={hr?.handle}  onChange={updateHr("handle")} /> · PerFile HR
          </div>
          <div className="hr-profile-bio">
            <EditableField value={hr?.bio}     onChange={updateHr("bio")} multiline />
          </div>
          <div className="hr-meta-row">
            <span className="hr-meta-item">📍 <EditableField value={hr?.location} onChange={updateHr("location")} /></span>
            <span className="hr-meta-item">🔗 <EditableField value={hr?.website}  onChange={updateHr("website")} /></span>
            <span className="hr-meta-item">✉️ <EditableField value={hr?.email}    onChange={updateHr("email")} /></span>
          </div>
          <div className="hr-social-row">
            <button className="hr-social-btn">💼 LinkedIn</button>
            <button className="hr-social-btn">🌐 Company Page</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="hr-stats-row">
        {stats.length > 0 ? stats.map(s => (
          <div key={s.label} className="hr-stat-card">
            <div className="hr-stat-num">{s.num}</div>
            <div className="hr-stat-label">{s.label}</div>
          </div>
        )) : [1,2,3,4].map(i => (
          <div key={i} className="hr-stat-card">
            <Skeleton w={40} h={28} style={{ marginBottom: 8 }} />
            <Skeleton w={80} h={12} />
          </div>
        ))}
      </div>

      {/* Company Info */}
      <div className="hr-card">
        <div className="hr-card-header">
          <div className="hr-card-title">🏢 ข้อมูลบริษัท</div>
          <span className="hr-edit-hint-badge">คลิกข้อความเพื่อแก้ไข</span>
        </div>
        <div className="hr-company-body">
          <div className="hr-company-top">
            <div className="hr-company-logo">{hr?.companyLogo ?? "?"}</div>
            <div>
              <div className="hr-company-name"><EditableField value={hr?.company}  onChange={updateHr("company")} /></div>
              <div className="hr-company-industry"><EditableField value={hr?.industry} onChange={updateHr("industry")} /></div>
            </div>
          </div>
          <div className="hr-company-desc"><EditableField value={hr?.companyDesc} onChange={updateHr("company_desc")} multiline /></div>
          <div className="hr-company-meta">
            <div className="hr-company-meta-item">👥 <strong><EditableField value={hr?.companySize} onChange={updateHr("company_size")} /></strong></div>
            <div className="hr-company-meta-item">📅 ก่อตั้ง <strong><EditableField value={hr?.founded}     onChange={updateHr("founded")} /></strong></div>
            <div className="hr-company-meta-item">🌏 <strong><EditableField value={hr?.location}    onChange={updateHr("location")} /></strong></div>
          </div>
          <div className="hr-perks-row">
            {(hr?.perks ?? []).map(p => (
              <span key={p} className="hr-perk-chip">
                {p}
                <button className="hr-perk-remove" onClick={() => removePerk(p)} title="ลบ">×</button>
              </span>
            ))}
            <span className="hr-perk-add-wrap">
              <input className="hr-perk-input" value={newPerk}
                onChange={e => setNewPerk(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPerk()}
                placeholder="+ เพิ่ม perk"
              />
              {newPerk && <button className="hr-edit-confirm" onClick={addPerk}>✓</button>}
            </span>
          </div>
        </div>
      </div>

      {/* About HR */}
      <div className="hr-card">
        <div className="hr-card-header">
          <div className="hr-card-title">👤 เกี่ยวกับฉัน</div>
          <span className="hr-edit-hint-badge">คลิกข้อความเพื่อแก้ไข</span>
        </div>
        <div className="hr-about-body">
          {aboutItems.length > 0 ? aboutItems.map((a, idx) => (
            <div key={idx} className="hr-about-item">
              <div className="hr-about-icon">{a.icon}</div>
              <div>
                <div className="hr-about-title"><EditableField value={a.title}  onChange={updateAbout(idx, "title")} /></div>
                <div className="hr-about-detail"><EditableField value={a.detail} onChange={updateAbout(idx, "detail")} /></div>
              </div>
            </div>
          )) : [1,2,3].map(i => (
            <div key={i} className="hr-about-item">
              <Skeleton w={36} h={36} radius={50} />
              <div style={{ flex: 1, marginLeft: 12 }}>
                <Skeleton w={100} h={12} style={{ marginBottom: 6 }} />
                <Skeleton w={200} h={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Postings */}
      <div className="hr-card" ref={savedSectionRef}>
        <div className="hr-card-header">
          <div className="hr-tab-bar">
            {TABS.map(t => (
              <button key={t.key} className={`hr-tab${activeTab === t.key ? " active" : ""}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
                <span className={`hr-tab-count${activeTab === t.key ? " active" : ""}`}>{t.count}</span>
              </button>
            ))}
          </div>
          <button className="hr-card-action">+ โพสต์งานใหม่</button>
        </div>
        <div className="hr-jobs-list">
          {activeTab === "jobs" && (
            openJobs.length === 0
              ? <EmptySlot icon="💼" text="รอข้อมูลตำแหน่งงานจาก Backend" />
              : openJobs.map(job => <JobCard key={job.id} job={job} savedJobs={savedJobs} toggleSave={toggleSave} setActivePage={setActivePage} />)
          )}
          {activeTab === "closed" && (
            <div className="hr-closed-list">
              {closedJobs.length === 0
                ? <EmptySlot icon="📁" text="รอข้อมูลตำแหน่งที่ปิดแล้วจาก Backend" />
                : closedJobs.map(job => <ClosedJobCard key={job.id} job={job} />)
              }
            </div>
          )}
          {activeTab === "saved" && (
            savedJobsList.length === 0 ? (
              <div className="hr-empty-tab">
                <div className="hr-empty-icon">🏷️</div>
                <div className="hr-empty-title">ยังไม่มีงานที่ save</div>
                <div className="hr-empty-desc">กด 🏷️ ที่ตำแหน่งงานไหนก็ได้เพื่อบันทึก</div>
              </div>
            ) : savedJobsList.map(job => {
              const dept = DEPT_COLORS[job.dept] || { bg: "#f4f4f5", text: "#52525b" };
              return (
                <div key={job.id} className="hr-saved-card">
                  <div className="hr-saved-ribbon">🔖 Saved</div>
                  <div className="hr-job-top">
                    <div className="hr-job-title-wrap">
                      <div className="hr-job-title">{job.title}</div>
                      <span className="hr-job-dept" style={{ background: dept.bg, color: dept.text }}>{job.dept}</span>
                    </div>
                    <button className="hr-save-btn saved" onClick={() => toggleSave(job.id)} title="ยกเลิก save">🔖</button>
                  </div>
                  <div className="hr-job-meta">
                    <span className="hr-job-meta-item">📍 {job.location}</span>
                    <span className="hr-job-meta-item">⏱ {job.type}</span>
                    <span className="hr-job-meta-item">💰 {job.salary}</span>
                  </div>
                  <div className="hr-job-footer">
                    <div className="hr-job-applicants">👥 {job.applicants} ผู้สมัคร</div>
                    <button className="hr-apply-btn">ดูผู้สมัคร →</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// ── Applicants View ───────────────────────────────────────────
function ApplicantsView({ applicants }) {
  const statusColor = {
    "รอการตรวจสอบ":  { bg: "#fff7ed", text: "#c2410c" },
    "ผ่านคัดกรอง":   { bg: "#eff6ff", text: "#1d4ed8" },
    "สัมภาษณ์รอบ 2": { bg: "#fdf4ff", text: "#7e22ce" },
    "เสนอ offer":    { bg: "#f0fdf4", text: "#15803d" },
  };
  return (
    <div className="hr-card">
      <div className="hr-card-header">
        <div className="hr-card-title">📋 ผู้สมัครทั้งหมด</div>
        <span className="hr-edit-hint-badge">{applicants.length} คน</span>
      </div>
      <div className="hr-jobs-list">
        {applicants.length === 0
          ? <EmptySlot icon="👥" text="รอข้อมูลผู้สมัครจาก Backend" />
          : applicants.map(a => {
            const sc = statusColor[a.status] || { bg: "#f4f4f5", text: "#52525b" };
            return (
              <div key={a.id} className="hr-job-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div className="hr-avatar" style={{ width: 44, height: 44, fontSize: "1rem", flexShrink: 0 }}>{a.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div className="hr-job-title">{a.name}</div>
                  <div className="hr-job-meta" style={{ marginTop: 4 }}>
                    <span className="hr-job-meta-item">💼 {a.role}</span>
                    <span className="hr-job-meta-item">🕐 {a.applied}</span>
                  </div>
                </div>
                <span className="hr-job-dept" style={{ background: sc.bg, color: sc.text }}>{a.status}</span>
                <button className="hr-apply-btn">ดูโปรไฟล์ →</button>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ── Interview View ────────────────────────────────────────────
function InterviewView({ interviews }) {
  return (
    <div className="hr-card">
      <div className="hr-card-header">
        <div className="hr-card-title">📅 ตารางสัมภาษณ์</div>
        <button className="hr-card-action">+ นัดสัมภาษณ์</button>
      </div>
      <div className="hr-jobs-list">
        {interviews.length === 0
          ? <EmptySlot icon="📅" text="รอข้อมูลตารางสัมภาษณ์จาก Backend" />
          : interviews.map(iv => (
            <div key={iv.id} className="hr-job-card">
              <div className="hr-job-top">
                <div className="hr-job-title-wrap">
                  <div className="hr-job-title">{iv.candidate}</div>
                  <span className="hr-job-dept" style={{ background: "#eff6ff", color: "#1d4ed8" }}>{iv.type}</span>
                </div>
                <span className="hr-urgent-badge" style={{ background: "#f0fdf4", color: "#15803d" }}>📅 {iv.date} · {iv.time}</span>
              </div>
              <div className="hr-job-meta">
                <span className="hr-job-meta-item">💼 {iv.role}</span>
                <span className="hr-job-meta-item">👤 {iv.interviewer}</span>
              </div>
              <div className="hr-job-footer">
                <div />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="hr-reopen-btn">✏️ แก้ไข</button>
                  <button className="hr-apply-btn">เข้าร่วม →</button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Report View ───────────────────────────────────────────────
function ReportView({ reportData }) {
  if (!reportData) return (
    <div className="hr-card" style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
      <div style={{ fontSize: "2rem", marginBottom: 8 }}>📊</div>
      <div style={{ fontSize: "0.85rem" }}>รอข้อมูลรายงานจาก Backend</div>
    </div>
  );
  const { thisMonth, lastMonth, topSources } = reportData;
  const metrics = [
    { label: "ผู้สมัคร",      cur: thisMonth.applications, prev: lastMonth.applications, icon: "📋" },
    { label: "สัมภาษณ์",      cur: thisMonth.interviews,   prev: lastMonth.interviews,   icon: "📅" },
    { label: "เสนอ Offer",    cur: thisMonth.offers,        prev: lastMonth.offers,        icon: "📨" },
    { label: "รับเข้าทำงาน", cur: thisMonth.hired,         prev: lastMonth.hired,         icon: "✅" },
  ];
  return (
    <>
      <div className="hr-stats-row">
        {metrics.map(m => {
          const diff = m.cur - m.prev;
          const up   = diff >= 0;
          return (
            <div key={m.label} className="hr-stat-card">
              <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{m.icon}</div>
              <div className="hr-stat-num">{m.cur}</div>
              <div className="hr-stat-label">{m.label}</div>
              <div style={{ fontSize: "0.72rem", marginTop: 4, color: up ? "#15803d" : "#be123c", fontWeight: 600 }}>
                {up ? "▲" : "▼"} {Math.abs(diff)} vs เดือนที่แล้ว
              </div>
            </div>
          );
        })}
      </div>
      <div className="hr-card">
        <div className="hr-card-header"><div className="hr-card-title">📊 แหล่งที่มาของผู้สมัคร</div></div>
        <div style={{ padding: "1rem 1.25rem" }}>
          {topSources.map(s => (
            <div key={s.name} style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <span style={{ color: "#6b7280" }}>{s.pct}%</span>
              </div>
              <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.pct}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 99, transition: "width 0.6s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Open/Closed Jobs Views ────────────────────────────────────
function OpenJobsView({ openJobs }) {
  return (
    <div className="hr-card">
      <div className="hr-card-header">
        <div className="hr-card-title">🟢 ตำแหน่งที่เปิดรับ</div>
        <button className="hr-card-action">+ โพสต์งานใหม่</button>
      </div>
      <div className="hr-jobs-list">
        {openJobs.length === 0
          ? <EmptySlot icon="💼" text="รอข้อมูลตำแหน่งงานจาก Backend" />
          : openJobs.map(job => {
            const dept = DEPT_COLORS[job.dept] || { bg: "#f4f4f5", text: "#52525b" };
            return (
              <div key={job.id} className="hr-job-card">
                <div className="hr-job-top">
                  <div className="hr-job-title-wrap">
                    <div className="hr-job-title">{job.title}</div>
                    <span className="hr-job-dept" style={{ background: dept.bg, color: dept.text }}>{job.dept}</span>
                  </div>
                  {job.urgent && <span className="hr-urgent-badge">⚡ ด่วน</span>}
                </div>
                <div className="hr-job-meta">
                  <span className="hr-job-meta-item">📍 {job.location}</span>
                  <span className="hr-job-meta-item">⏱ {job.type}</span>
                  <span className="hr-job-meta-item">💰 {job.salary}</span>
                </div>
                <div className="hr-job-footer">
                  <div>
                    <div className="hr-job-posted">โพสต์เมื่อ {job.posted}</div>
                    <div className="hr-job-applicants">👥 {job.applicants} ผู้สมัคร</div>
                  </div>
                  <button className="hr-apply-btn">ดูผู้สมัคร →</button>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

function ClosedJobsView({ closedJobs }) {
  return (
    <div className="hr-card">
      <div className="hr-card-header"><div className="hr-card-title">⚫ ตำแหน่งที่ปิดแล้ว</div></div>
      <div className="hr-jobs-list">
        <div className="hr-closed-list">
          {closedJobs.length === 0
            ? <EmptySlot icon="📁" text="รอข้อมูลตำแหน่งที่ปิดแล้วจาก Backend" />
            : closedJobs.map(job => <ClosedJobCard key={job.id} job={job} />)
          }
        </div>
      </div>
    </div>
  );
}

function CompanyView({ hr, setHr }) {
  const updateHr = (key) => (val) => {
    setHr(prev => ({ ...(prev || {}), [key]: val }));
    saveHrProfile({ [key]: val });
  };
  return (
    <div className="hr-card">
      <div className="hr-card-header">
        <div className="hr-card-title">🏢 {hr?.company ?? <Skeleton w={160} />}</div>
        <span className="hr-edit-hint-badge">คลิกข้อความเพื่อแก้ไข</span>
      </div>
      <div className="hr-company-body">
        <div className="hr-company-top">
          <div className="hr-company-logo">{hr?.companyLogo ?? "?"}</div>
          <div>
            <div className="hr-company-name"><EditableField value={hr?.company}  onChange={updateHr("company")} /></div>
            <div className="hr-company-industry"><EditableField value={hr?.industry} onChange={updateHr("industry")} /></div>
          </div>
        </div>
        <div className="hr-company-desc"><EditableField value={hr?.companyDesc} onChange={updateHr("company_desc")} multiline /></div>
        <div className="hr-company-meta">
          <div className="hr-company-meta-item">👥 <strong><EditableField value={hr?.companySize} onChange={updateHr("company_size")} /></strong></div>
          <div className="hr-company-meta-item">📅 ก่อตั้ง <strong><EditableField value={hr?.founded}     onChange={updateHr("founded")} /></strong></div>
          <div className="hr-company-meta-item">🌏 <strong><EditableField value={hr?.location}    onChange={updateHr("location")} /></strong></div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function HRProfile() {
  const [activePage, setActivePage] = useState("profile");
  const [savedJobs, setSavedJobs]   = useState([]);
  const [newPerk, setNewPerk]       = useState("");
  const navigate  = useNavigate();
  const location  = useLocation();

  // ถ้ามา navigate พร้อม state { scrollTo: "saved" } ให้ scroll ไปที่ saved tab
  const initialTab = location.state?.scrollTo ?? null;

  // state ทั้งหมดเริ่มว่าง — โครงสร้างพร้อม รอ backend เติมข้อมูล
  const [hr, setHr]                   = useState(null);
  const [aboutItems, setAboutItems]   = useState([]);
  const [stats, setStats]             = useState([]);
  const [openJobs, setOpenJobs]       = useState([]);
  const [closedJobs, setClosedJobs]   = useState([]);
  const [applicants, setApplicants]   = useState([]);
  const [interviews, setInterviews]   = useState([]);
  const [reportData, setReportData]   = useState(null);
  const [activities, setActivities]   = useState([]);
  const [quickActions, setQuickActions] = useState([]);

  // ── TODO: แก้ getXxx() ด้านบนให้เรียก backend จริง ──────────
  useEffect(() => {
    getHrProfile().then(setHr);
    getAboutItems().then(setAboutItems);
    getStats().then(setStats);
    getOpenJobs().then(setOpenJobs);
    getClosedJobs().then(setClosedJobs);
    getApplicants().then(setApplicants);
    getInterviews().then(setInterviews);
    getReportData().then(setReportData);
    getActivities().then(setActivities);
    getQuickActions().then(setQuickActions);
  }, []);

  const renderMain = () => {
    switch (activePage) {
      case "profile":    return <ProfileView hr={hr} setHr={setHr} aboutItems={aboutItems} setAboutItems={setAboutItems} stats={stats} openJobs={openJobs} closedJobs={closedJobs} newPerk={newPerk} setNewPerk={setNewPerk} savedJobs={savedJobs} setSavedJobs={setSavedJobs} setActivePage={setActivePage} initialTab={initialTab} />;
      case "applicants": return <ApplicantsView applicants={applicants} />;
      case "interviews": return <InterviewView interviews={interviews} />;
      case "report":     return <ReportView reportData={reportData} />;
      case "open":       return <OpenJobsView openJobs={openJobs} />;
      case "closed":     return <ClosedJobsView closedJobs={closedJobs} />;
      case "company":    return <CompanyView hr={hr} setHr={setHr} />;
      default:           return null;
    }
  };

  return (
    <div className="hr-page">

      {/* shimmer animation */}
      <style>{`@keyframes hr-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ── NAV ── */}
      <nav className="hr-nav">
        <div className="hr-nav-left">
          <div className="hr-nav-logo" onClick={() => navigate("/hr-feed")} style={{ cursor: "pointer" }}>
            Per<span>File</span>
          </div>
          <div className="hr-nav-search">
            <span>🔍</span>
            <input placeholder="ค้นหา Username หรือ Company..." />
          </div>
        </div>
        <div className="hr-nav-right">
          <button className="hr-icon-btn">🔔</button>
          <button className="hr-icon-btn">💬</button>
          <div className="hr-nav-avatar">{hr?.name?.[0] ?? "?"}</div>
        </div>
      </nav>

      <div className="hr-body">

        {/* ── SIDEBAR ── */}
        <aside className="hr-sidebar">
          <button className="hr-post-btn">＋ โพสต์งาน</button>

          {[
            { key: "profile",    icon: "🏠", label: "Profile" },
            { key: "applicants", icon: "📋", label: "ผู้สมัคร",   badge: applicants.length || null },
            { key: "interviews", icon: "📅", label: "สัมภาษณ์" },
            { key: "report",     icon: "📊", label: "รายงาน" },
          ].map(m => (
            <button key={m.key} className={`hr-menu-item${activePage === m.key ? " active" : ""}`} onClick={() => setActivePage(m.key)}>
              <span className="hr-menu-icon">{m.icon}</span> {m.label}
              {m.badge ? <span className="hr-menu-badge">{m.badge}</span> : null}
            </button>
          ))}

          <div className="hr-section-title">ตำแหน่งงาน</div>
          <button className={`hr-menu-item${activePage === "open"   ? " active" : ""}`} onClick={() => setActivePage("open")}>
            <span>🟢</span> เปิดรับ ({openJobs.length})
          </button>
          <button className={`hr-menu-item${activePage === "closed" ? " active" : ""}`} onClick={() => setActivePage("closed")}>
            <span>⚫</span> ปิดแล้ว ({closedJobs.length})
          </button>

          <div className="hr-section-title">บริษัท</div>
          <button className={`hr-menu-item${activePage === "company" ? " active" : ""}`} onClick={() => setActivePage("company")}>
            <span>🏢</span> {hr?.company ?? "—"}
          </button>
        </aside>

        {/* ── MAIN ── */}
        <main className="hr-main">{renderMain()}</main>

        {/* ── RIGHT PANEL ── */}
        <div className="hr-right">
          <div className="hr-right-card">
            <div className="hr-right-title">กิจกรรมล่าสุด</div>
            {activities.length === 0
              ? [1,2,3].map(i => (
                <div key={i} className="hr-activity-item">
                  <div className="hr-activity-dot" />
                  <div style={{ flex: 1 }}>
                    <Skeleton w="90%" h={12} style={{ marginBottom: 6 }} />
                    <Skeleton w={60} h={10} />
                  </div>
                </div>
              ))
              : activities.map((a, i) => (
                <div key={i} className="hr-activity-item">
                  <div className="hr-activity-dot" />
                  <div>
                    <div className="hr-activity-text">{a.text}</div>
                    <div className="hr-activity-time">{a.time}</div>
                  </div>
                </div>
              ))
            }
          </div>

          <div className="hr-right-card">
            <div className="hr-right-title">Quick Actions</div>
            {quickActions.length === 0
              ? [1,2,3].map(i => (
                <div key={i} className="hr-quick-action" style={{ pointerEvents: "none" }}>
                  <Skeleton w={32} h={32} radius={8} />
                  <div style={{ flex: 1, marginLeft: 10 }}>
                    <Skeleton w={100} h={12} style={{ marginBottom: 5 }} />
                    <Skeleton w={60} h={10} />
                  </div>
                </div>
              ))
              : quickActions.map(q => (
                <button key={q.label} className="hr-quick-action" onClick={() => {
                  if (q.label === "ดูผู้สมัครทั้งหมด") setActivePage("applicants");
                  if (q.label === "ตารางสัมภาษณ์")    setActivePage("interviews");
                  if (q.label === "รายงานการสรรหา")    setActivePage("report");
                }}>
                  <div className="hr-quick-icon">{q.icon}</div>
                  <div>
                    <div className="hr-quick-label">{q.label}</div>
                    <div className="hr-quick-sub">{q.sub}</div>
                  </div>
                </button>
              ))
            }
          </div>

          <div className="hr-right-card hr-right-card--upgrade">
            <div className="hr-upgrade-icon">✨</div>
            <div className="hr-upgrade-title">Upgrade to Pro</div>
            <div className="hr-upgrade-desc">
              ปลดล็อค Analytics เชิงลึก, ATS integration และเครื่องมือ AI สรรหาบุคลากร
            </div>
            <button className="hr-upgrade-btn">ดูแผน Pro →</button>
          </div>
        </div>

      </div>
    </div>
  );
}
