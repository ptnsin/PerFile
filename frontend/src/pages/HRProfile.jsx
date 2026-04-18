import React, { useState, useEffect, useRef } from "react"
import "../styles/HRProfile.css";
import { useNavigate, useLocation } from "react-router-dom";
import PostJobModal from "./PostJobModal";
import JobDetailModal from "./JobDetailModal";

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
    return {
      ...profile,
      name: profile.fullName || profile.username || "ยังไม่ระบุชื่อ", 
      avatar: profile.avatar || null,
      
      // ✅ ตรวจสอบชื่อ property จากก้อน hr_profile ที่ส่งมาจาก Backend
      bio: profile.hr_profile?.bio || profile.bio || "ยังไม่ระบุรายละเอียด",
      website: profile.hr_profile?.website || profile.website || "ยังไม่ระบุ",
      location: profile.hr_profile?.location || profile.location || "ยังไม่ระบุ",
      
      company: profile.hr_profile?.company || profile.company || "ยังไม่ระบุบริษัท",
      industry: profile.hr_profile?.industry || profile.industry || "ยังไม่ระบุ",
      
      // ✅ ต้องใช้ชื่อที่ UI เข้าใจ (companyDesc) แต่ดึงมาจาก DB (company_desc)
      companyDesc: profile.hr_profile?.company_desc || profile.company_desc || "ยังไม่ระบุข้อมูลบริษัท",
      companySize: profile.hr_profile?.company_size || profile.company_size || "ยังไม่ระบุ",
      founded: profile.hr_profile?.founded || profile.founded || "ยังไม่ระบุ",
      
      role: profile.hr_profile?.role || "HR Recruiter",
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
    
    return (data.jobs || [])
      .filter(job => job.status === "เปิดรับสมัคร")
      .map(job => ({
        ...job,
        // Map ชื่อฟิลด์ให้ตรงกับที่ Component เรียกใช้
        dept: job.category || "ทั่วไป", 
        type: job.job_type || "ไม่ระบุ",
        posted: new Date(job.createdAt).toLocaleDateString('th-TH', { 
          day: 'numeric', month: 'short' 
        }),
        applicants: job._count?.applications || 0
      }));
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
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/hr/about", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return getAboutItemsDefault();
    const data = await res.json();
    return (data.aboutItems || []).length > 0 ? data.aboutItems : getAboutItemsDefault();
  } catch (err) {
    console.error(err);
    return getAboutItemsDefault();
  }
}

function getAboutItemsDefault() {
  return [
    { icon: "🎓", title: "การศึกษา", detail: "คลิกเพื่อแก้ไข" },
    { icon: "💼", title: "ประสบการณ์", detail: "คลิกเพื่อแก้ไข" },
    { icon: "🌟", title: "ความเชี่ยวชาญ", detail: "คลิกเพื่อแก้ไข" },
  ];
}

async function getQuickActions() {
  return [
    { icon: "👥", label: "ดูผู้สมัครทั้งหมด", sub: "ตรวจสอบใบสมัครใหม่" },
    { icon: "📅", label: "ตารางสัมภาษณ์", sub: "ดูนัดหมายวันนี้" },
    { icon: "📊", label: "รายงานการสรรหา", sub: "สรุปผลรายเดือน" },
  ];
}

async function getActivities() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/hr/activities", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    
    // แปลงข้อมูลจาก Backend ให้เข้ากับ UI
    return (data.activities || []).map(act => ({
      text: act.text, //
      time: new Date(act.created_at).toLocaleString('th-TH') //
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function getApplicants() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/hr/applicants", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.applicants || []).map(a => ({
      ...a,
      name:    a.fullName   || a.name     || "ไม่ระบุชื่อ",
      avatar:  (a.fullName  || a.name     || "?")[0].toUpperCase(),
      role:    a.position   || a.role     || "ไม่ระบุตำแหน่ง",
      status:  a.status     || "รอการตรวจสอบ",
      applied: a.appliedAt  ? new Date(a.appliedAt).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : (a.applied || ""),
      exp:     a.experience || a.exp      || null,
      score:   a.score      ?? null,
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}
async function getInterviews() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/hr/interviews", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.interviews || []).map(iv => ({
      ...iv,
      candidate:   iv.candidate_name || iv.candidate || "ไม่ระบุชื่อ",
      role:        iv.job_title      || iv.role      || "ไม่ระบุตำแหน่ง",
      date:        iv.interview_date ? new Date(iv.interview_date).toLocaleDateString("th-TH") : iv.date || "",
      time:        iv.interview_time || iv.time      || "",
      type:        iv.interview_type || iv.type      || "Online",
      interviewer: iv.interviewer    || "ไม่ระบุ",
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}
async function getReportData() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/hr/report", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.report || null;
  } catch (err) {
    console.error(err);
    return null;
  }
}



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

async function saveAboutItems(items) {
  try {
    const token = localStorage.getItem("token");
    await fetch("http://localhost:3000/hr/about", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ aboutItems: items }),
    });
  } catch (err) {
    console.error(err);
  }
}

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
function JobCard({ job, savedJobs, toggleSave, setActivePage, onViewDetail, goToApplicants }) {
  const dept    = DEPT_COLORS[job.dept] || { bg: "#f4f4f5", text: "#52525b" };
  const isSaved = savedJobs.includes(job.id);
  return (
    <div className="hr-job-card" onClick={() => onViewDetail?.(job)} style={{ cursor: onViewDetail ? "pointer" : "default" }}>
      <div className="hr-job-top">
        <div className="hr-job-title-wrap">
          <div className="hr-job-title">{job.title}</div>
          <span className="hr-job-dept" style={{ background: dept.bg, color: dept.text }}>{job.dept}</span>
        </div>
        <div className="hr-job-actions">
          {job.urgent && <span className="hr-urgent-badge">⚡ ด่วน</span>}
          <button className={`hr-save-btn${isSaved ? " saved" : ""}`} onClick={(e) => { e.stopPropagation(); toggleSave(job.id); }} title={isSaved ? "ยกเลิก save" : "บันทึกงาน"}>
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
        <div style={{ display: "flex", gap: 6 }}>
          <button className="hr-apply-btn" style={{ background: "#f4f4f5", color: "#52525b" }}
            onClick={(e) => { e.stopPropagation(); goToApplicants ? goToApplicants(job) : setActivePage("applicants"); }}>
            👥 ผู้สมัคร
          </button>
          <button className="hr-apply-btn" onClick={(e) => { e.stopPropagation(); onViewDetail?.(job); }}>ดูรายละเอียด →</button>
        </div>
      </div>
    </div>
  );
}

function ClosedJobCard({ job, onViewDetail, onReopen }) {
  const dept = DEPT_COLORS[job.dept] || { bg: "#f4f4f5", text: "#52525b" };
  return (
    <div className="hr-closed-card" onClick={() => onViewDetail?.(job)} style={{ cursor: onViewDetail ? "pointer" : "default" }}>
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
      <div className="hr-closed-actions" style={{ display: "flex", gap: 6 }}>
        <button className="hr-reopen-btn" onClick={(e) => { e.stopPropagation(); onViewDetail?.(job); }}>📄 รายละเอียด</button>
        <button className="hr-reopen-btn" onClick={(e) => { e.stopPropagation(); onReopen?.(job.id); }}>↩ เปิดใหม่</button>
      </div>
    </div>
  );
}

// ── Profile View ──────────────────────────────────────────────
function ProfileView({ hr, setHr, aboutItems, setAboutItems, stats, openJobs, closedJobs, newPerk, setNewPerk, savedJobs, setSavedJobs, setActivePage, initialTab, openPostModal, onViewDetail, goToApplicants, onReopen }) {
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

  // ใน ProfileView
const updateHr = (key) => (val) => {
  const updated = { ...(hr || {}), [key]: val };
  setHr(updated);
  
  // ✅ ต้อง Map ชื่อ Key ให้ตรงกับที่ Backend PUT คาดหวัง
  // เช่น ถ้าส่ง "name" มา ต้องเปลี่ยนเป็น "fullName" ก่อนส่งไป API
  const payloadKey = key === "name" ? "fullName" : key;
  saveHrProfile({ [payloadKey]: val });
};

// ใน CompanyView (ตรวจสอบชื่อตัวแปรที่ส่งไปบันทึก)
<EditableField value={hr?.companyDesc} onChange={updateHr("companyDesc")} multiline />
// ตัว updateHr จะส่ง { companyDesc: val } ซึ่งใน Backend PUT ผมแก้ให้รับค่านี้แล้ว

  const updateAbout = (idx, key) => (val) => {
    const updated = aboutItems.map((item, i) => i === idx ? { ...item, [key]: val } : item);
    setAboutItems(updated);
    saveAboutItems(updated);
  };
  const toggleSave = async (id) => {
    const isSaved = savedJobs.includes(id);
    // optimistic UI
    setSavedJobs(prev => isSaved ? prev.filter(x => x !== id) : [...prev, id]);
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3000/hr/saved-jobs/${id}`, {
        method: isSaved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
      // rollback ถ้า API fail
      setSavedJobs(prev => isSaved ? [...prev, id] : prev.filter(x => x !== id));
    }
  };
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
            
            <div>
              <div className="hr-company-name"><EditableField value={hr?.company}  onChange={updateHr("company")} /></div>
             
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
          <button className="hr-card-action" onClick={openPostModal}>+ โพสต์งานใหม่</button>
        </div>
        <div className="hr-jobs-list">
          {activeTab === "jobs" && (
            openJobs.length === 0
              ? <EmptySlot icon="💼" text="รอข้อมูลตำแหน่งงานจาก Backend" />
              : openJobs.map(job => <JobCard key={job.id} job={job} savedJobs={savedJobs} toggleSave={toggleSave} setActivePage={setActivePage} onViewDetail={onViewDetail} goToApplicants={goToApplicants} />)
          )}
          {activeTab === "closed" && (
            <div className="hr-closed-list">
              {closedJobs.length === 0
                ? <EmptySlot icon="📁" text="รอข้อมูลตำแหน่งที่ปิดแล้วจาก Backend" />
                : closedJobs.map(job => <ClosedJobCard key={job.id} job={job} onViewDetail={onViewDetail} onReopen={onReopen} />)
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
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="hr-apply-btn" style={{ background: "#f4f4f5", color: "#52525b" }}
                        onClick={() => goToApplicants ? goToApplicants(job) : setActivePage("applicants")}>
                        👥 ผู้สมัคร
                      </button>
                      <button className="hr-apply-btn" onClick={() => onViewDetail?.(job)}>ดูรายละเอียด →</button>
                    </div>
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

// ── Applicants Modal ──────────────────────────────────────────
function ApplicantsModal({ open, onClose, job, applicants }) {
  const [search, setSearch]         = useState("");
  const [activeStatus, setStatus]   = useState("ทั้งหมด");

  // useEffect(() => { if (open) { setSearch(""); setStatus("ทั้งหมด"); } }, [open]);

  if (!open || !job) return null;

  const jobApplicants = applicants.filter(
    a => !a.jobId || String(a.jobId ?? a.job_id) === String(job.id)
  );

  const statuses = ["ทั้งหมด", ...Object.keys(STATUS_CONFIG).filter(k => k !== "ทั้งหมด")];

  const filtered = jobApplicants
    .filter(a => activeStatus === "ทั้งหมด" || a.status === activeStatus)
    .filter(a => {
      const q = search.toLowerCase();
      return !q || a.name.toLowerCase().includes(q) || (a.role||"").toLowerCase().includes(q);
    });

  return (
    <>
      <style>{`
        @keyframes apr-fade { from{opacity:0} to{opacity:1} }
        @keyframes apr-up   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:600,
        background:"rgba(15,23,42,0.45)", backdropFilter:"blur(4px)",
        animation:"apr-fade 0.18s ease",
      }} />
      {/* Sheet */}
      <div style={{
        position:"fixed", inset:0, zIndex:601,
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
        pointerEvents:"none",
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#fff", borderRadius:20, width:"100%", maxWidth:660,
          maxHeight:"88vh", overflowY:"auto", pointerEvents:"all",
          boxShadow:"0 24px 60px rgba(0,0,0,0.18)",
          animation:"apr-up 0.22s cubic-bezier(.4,0,.2,1)",
          fontFamily:"'DM Sans',sans-serif",
        }}>
          {/* Header */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"18px 22px 14px", borderBottom:"1px solid #f0f0f0", position:"sticky", top:0, background:"#fff", zIndex:1, borderRadius:"20px 20px 0 0",
          }}>
            <div>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:"#18181b" }}>
                👥 ผู้สมัคร
              </div>
              <div style={{ fontSize:12, color:"#71717a", marginTop:2 }}>{job.title}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{
                background:"#f4f4f5", borderRadius:8, padding:"3px 10px",
                fontSize:12, fontWeight:700, color:"#52525b",
              }}>{jobApplicants.length} คน</span>
              <button onClick={onClose} style={{
                width:32, height:32, borderRadius:8, border:"1.5px solid #e4e4e7",
                background:"#fff", cursor:"pointer", color:"#71717a", fontSize:16,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>✕</button>
            </div>
          </div>

          {/* Search */}
          <div style={{
            margin:"14px 20px 0", display:"flex", alignItems:"center", gap:10,
            padding:"9px 14px", background:"#f8f9ff",
            border:"1.5px solid #e4e4e7", borderRadius:12,
          }}>
            <span style={{ fontSize:14 }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ หรือตำแหน่ง..."
              style={{ flex:1, border:"none", background:"none", outline:"none", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#18181b" }}
            />
            {search && <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:"#a1a1aa", fontSize:13 }}>✕</button>}
          </div>

          {/* Status filter */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, padding:"12px 20px", borderBottom:"1px solid #f4f4f5" }}>
            {statuses.map(s => {
              const cfg = STATUS_CONFIG[s] || STATUS_CONFIG["ทั้งหมด"];
              const isActive = activeStatus === s;
              const count = s === "ทั้งหมด" ? jobApplicants.length : jobApplicants.filter(a => a.status === s).length;
              return (
                <button key={s} onClick={() => setStatus(s)} style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"5px 12px", borderRadius:99, fontSize:12.5, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif",
                  background: isActive ? (s==="ทั้งหมด" ? "#18181b" : cfg.bg) : "#f4f4f5",
                  color:      isActive ? (s==="ทั้งหมด" ? "#fff" : cfg.active) : "#71717a",
                  border:     isActive ? `1.5px solid ${s==="ทั้งหมด" ? "#18181b" : cfg.active}` : "1.5px solid transparent",
                  fontWeight: isActive ? 700 : 500,
                }}>
                  {s}
                  <span style={{
                    borderRadius:99, fontSize:10, fontWeight:700, padding:"1px 6px",
                    background: isActive ? "rgba(255,255,255,0.25)" : "#e4e4e7",
                    color: isActive ? (s==="ทั้งหมด" ? "#fff" : cfg.active) : "#a1a1aa",
                  }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* List */}
          <div style={{ padding:"10px 16px 16px", display:"flex", flexDirection:"column", gap:8 }}>
            {filtered.length === 0 ? (
              <div style={{ padding:"40px 16px", textAlign:"center", color:"#9ca3af" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{search || activeStatus !== "ทั้งหมด" ? "🔍" : "👥"}</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#52525b", marginBottom:4 }}>
                  {search || activeStatus !== "ทั้งหมด" ? "ไม่พบผู้สมัคร" : "ยังไม่มีผู้สมัคร"}
                </div>
                <div style={{ fontSize:12 }}>
                  {search || activeStatus !== "ทั้งหมด" ? "ลองค้นหาด้วยคำอื่น หรือเปลี่ยน filter" : "ผู้สมัครจะแสดงที่นี่เมื่อมีคนส่งใบสมัคร"}
                </div>
              </div>
            ) : filtered.map(a => {
              const sc = STATUS_CONFIG[a.status] || { bg:"#f4f4f5", text:"#52525b" };
              return (
                <div key={a.id} style={{
                  display:"flex", alignItems:"center", gap:12,
                  border:"1.5px solid #e4e4e7", borderRadius:12, padding:"12px 14px",
                  transition:"all 0.15s", background:"#fff",
                }}>
                  <div style={{
                    width:44, height:44, borderRadius:13, flexShrink:0,
                    background:"linear-gradient(140deg,#3b82f6,#6366f1,#7c3aed)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontSize:17, fontWeight:700, fontFamily:"'DM Serif Display',serif",
                  }}>{a.avatar}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:"#18181b" }}>{a.name}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:3 }}>
                      <span style={{ fontSize:12, color:"#71717a" }}>💼 {a.role}</span>
                      {a.exp && <span style={{ fontSize:12, color:"#71717a" }}>📈 {a.exp}</span>}
                      <span style={{ fontSize:12, color:"#71717a" }}>🕐 {a.applied}</span>
                    </div>
                  </div>
                  {a.score != null && (
                    <div style={{ textAlign:"center", minWidth:44 }}>
                      <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, fontWeight:700, color: a.score>=85?"#15803d":a.score>=70?"#c2410c":"#be123c" }}>{a.score}</div>
                      <div style={{ fontSize:10, color:"#a1a1aa", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>คะแนน</div>
                    </div>
                  )}
                  <span style={{ background:sc.bg, color:sc.text, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{a.status}</span>
                  <button style={{
                    background:"#18181b", color:"#fff", border:"none", borderRadius:8,
                    padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                    whiteSpace:"nowrap",
                  }}>ดูโปรไฟล์</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Applicants View ───────────────────────────────────────────
const STATUS_CONFIG = {
  "ทั้งหมด":        { bg: "#f4f4f5",  text: "#52525b",  active: "#18181b" },
  "รอการตรวจสอบ":  { bg: "#fff7ed",  text: "#c2410c",  active: "#c2410c" },
  "ผ่านคัดกรอง":   { bg: "#eff6ff",  text: "#1d4ed8",  active: "#1d4ed8" },
  "สัมภาษณ์รอบ 2": { bg: "#fdf4ff",  text: "#7e22ce",  active: "#7e22ce" },
  "เสนอ offer":    { bg: "#f0fdf4",  text: "#15803d",  active: "#15803d" },
  "ไม่ผ่าน":       { bg: "#fef2f2",  text: "#be123c",  active: "#be123c" },
};

function ApplicantsView({ applicants, filterJobId, onClearFilter, openJobs }) {
  // กรองตาม job ถ้ามี filterJobId
  const baseData = filterJobId
    ? applicants.filter(a => String(a.jobId ?? a.job_id) === String(filterJobId))
    : applicants;
  const allData = baseData;
  const filterJobName = filterJobId
    ? (openJobs?.find(j => String(j.id) === String(filterJobId))?.title ?? `Job #${filterJobId}`)
    : null;

  const [search, setSearch]             = useState("");
  const [activeStatus, setActiveStatus] = useState("ทั้งหมด");
  const [sortBy, setSortBy]             = useState("latest");

  const statuses = ["ทั้งหมด", ...Object.keys(STATUS_CONFIG).filter(k => k !== "ทั้งหมด")];
  const statusCounts = statuses.reduce((acc, s) => {
    acc[s] = s === "ทั้งหมด" ? allData.length : allData.filter(a => a.status === s).length;
    return acc;
  }, {});

  const filtered = allData
    .filter(a => activeStatus === "ทั้งหมด" || a.status === activeStatus)
    .filter(a => {
      const q = search.toLowerCase();
      return !q || a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "score") return (b.score || 0) - (a.score || 0);
      if (sortBy === "exp")   return parseInt(b.exp || 0) - parseInt(a.exp || 0);
      return 0; // latest = original order
    });

  return (
    <div className="hr-card">
      {/* Header */}
      <div className="hr-card-header">
        <div className="hr-card-title">📋 ผู้สมัครทั้งหมด</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="hr-edit-hint-badge">{filtered.length} / {allData.length} คน</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              border: "1px solid #e4e4e7", borderRadius: 8, padding: "4px 10px",
              fontSize: 12, color: "#52525b", background: "#fafafa",
              cursor: "pointer", outline: "none", fontFamily: "inherit"
            }}
          >
            <option value="latest">🕐 ล่าสุด</option>
            <option value="score">⭐ คะแนนสูงสุด</option>
            <option value="exp">💼 ประสบการณ์</option>
          </select>
        </div>
      </div>

      {/* Banner กรองตามงาน */}
      {filterJobName && (
        <div style={{
          margin: "0 20px", marginTop: 12,
          background: "#eff6ff", border: "1.5px solid #bfdbfe",
          borderRadius: 10, padding: "8px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 13,
        }}>
          <span>📋 แสดงผู้สมัครสำหรับ: <strong>{filterJobName}</strong></span>
          <button onClick={onClearFilter} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#3b82f6", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
          }}>
            ✕ ดูทั้งหมด
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="hr-applicant-search-wrap">
        <span className="hr-applicant-search-icon">🔍</span>
        <input
          className="hr-applicant-search-input"
          placeholder="ค้นหาชื่อผู้สมัคร หรือตำแหน่งงาน..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="hr-applicant-search-clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {/* Status filter pills */}
      <div className="hr-applicant-filter-bar">
        {statuses.map(s => {
          const cfg = STATUS_CONFIG[s] || STATUS_CONFIG["ทั้งหมด"];
          const isActive = activeStatus === s;
          return (
            <button
              key={s}
              className="hr-applicant-filter-pill"
              onClick={() => setActiveStatus(s)}
              style={{
                background: isActive ? (s === "ทั้งหมด" ? "#18181b" : cfg.bg) : "#f4f4f5",
                color:      isActive ? (s === "ทั้งหมด" ? "#fff"     : cfg.active) : "#71717a",
                border:     isActive ? `1.5px solid ${s === "ทั้งหมด" ? "#18181b" : cfg.active}` : "1.5px solid transparent",
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {s}
              <span className="hr-applicant-pill-count"
                style={{ background: isActive ? "rgba(255,255,255,0.25)" : "#e4e4e7",
                         color: isActive ? (s === "ทั้งหมด" ? "#fff" : cfg.active) : "#a1a1aa" }}>
                {statusCounts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="hr-jobs-list">
        {filtered.length === 0 ? (
          <div className="hr-empty-tab">
            <div className="hr-empty-icon">{search || activeStatus !== "ทั้งหมด" ? "🔍" : "👥"}</div>
            <div className="hr-empty-title">
              {search || activeStatus !== "ทั้งหมด" ? "ไม่พบผู้สมัคร" : "ยังไม่มีผู้สมัคร"}
            </div>
            <div className="hr-empty-desc">
              {search || activeStatus !== "ทั้งหมด" ? "ลองค้นหาด้วยคำอื่น หรือเปลี่ยน filter" : "ผู้สมัครจะแสดงที่นี่เมื่อมีคนส่งใบสมัคร"}
            </div>
          </div>
        ) : filtered.map(a => {
          const sc = STATUS_CONFIG[a.status] || { bg: "#f4f4f5", text: "#52525b" };
          return (
            <div key={a.id} className="hr-applicant-row">
              <div className="hr-applicant-avatar">{a.avatar}</div>
              <div className="hr-applicant-info">
                <div className="hr-applicant-name">{a.name}</div>
                <div className="hr-job-meta" style={{ marginTop: 3 }}>
                  <span className="hr-job-meta-item">💼 {a.role}</span>
                  {a.exp  && <span className="hr-job-meta-item">📈 {a.exp}</span>}
                  <span className="hr-job-meta-item">🕐 {a.applied}</span>
                </div>
              </div>
              {a.score != null && (
                <div className="hr-applicant-score">
                  <div className="hr-applicant-score-num" style={{ color: a.score >= 85 ? "#15803d" : a.score >= 70 ? "#c2410c" : "#be123c" }}>
                    {a.score}
                  </div>
                  <div className="hr-applicant-score-label">คะแนน</div>
                </div>
              )}
              <span className="hr-job-dept" style={{ background: sc.bg, color: sc.text, whiteSpace: "nowrap" }}>{a.status}</span>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button className="hr-reopen-btn">📄 Resume</button>
                <button className="hr-apply-btn">ดูโปรไฟล์ →</button>
              </div>
            </div>
          );
        })}
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
function OpenJobsView({ openJobs, onViewDetail, goToApplicants }) {
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
              <div key={job.id} className="hr-job-card" onClick={() => onViewDetail?.(job)} style={{ cursor: "pointer" }}>
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
                  <button className="hr-apply-btn" onClick={(e) => { e.stopPropagation(); goToApplicants?.(job); }}>👥 ผู้สมัคร →</button>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

function ClosedJobsView({ closedJobs, onViewDetail, onReopen }) {
  return (
    <div className="hr-card">
      <div className="hr-card-header"><div className="hr-card-title">⚫ ตำแหน่งที่ปิดแล้ว</div></div>
      <div className="hr-jobs-list">
        <div className="hr-closed-list">
          {closedJobs.length === 0
            ? <EmptySlot icon="📁" text="รอข้อมูลตำแหน่งที่ปิดแล้วจาก Backend" />
            : closedJobs.map(job => <ClosedJobCard key={job.id} job={job} onViewDetail={onViewDetail} onReopen={onReopen} />)
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
  const [activePage, setActivePage]     = useState("profile");
  const [savedJobs, setSavedJobs]       = useState([]);
  const [newPerk, setNewPerk]           = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [modalOpen, setModalOpen]       = useState(false);
  const [selectedJob, setSelectedJob]     = useState(null);
  const [filterJobId, setFilterJobId]     = useState(null);
  const [applicantsModal, setApplicantsModal] = useState(null); // job object

  // const goToApplicants = (jobId = null) => {
  //   setFilterJobId(jobId);
  //   setActivePage("applicants");
  // };

  const openApplicantsModal = (job) => setApplicantsModal(job);
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/hr-login");
  };

  const handleJobPosted = () => {
    // รีโหลดข้อมูลงานใหม่หลังโพสต์
    getOpenJobs().then(setOpenJobs);
    getStats().then(setStats);
  };

  const handleReopenJob = async (jobId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/hr/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "เปิดรับสมัคร" }),
      });
      if (res.ok) {
        // ย้ายงานจาก closedJobs กลับไป openJobs
        const job = closedJobs.find(j => j.id === jobId);
        if (job) {
          const reopened = { ...job, status: "เปิดรับสมัคร" };
          setClosedJobs(prev => prev.filter(j => j.id !== jobId));
          setOpenJobs(prev => [...prev, reopened]);
        }
      } else {
        const err = await res.json();
        alert(err.message || "เปิดรับสมัครไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Reopen job error:", err);
    }
  };

  // ถ้ามา navigate พร้อม state ต่างๆ
  const initialTab    = location.state?.scrollTo === "saved" ? "saved" : null;
  const navToPage     = location.state?.scrollTo === "applicants" ? "applicants" : null;
  const navFilterJob  = location.state?.filterJobId ?? null;
  
  // ถ้า navigate มาพร้อม scrollTo: "applicants" ให้เปิดหน้าผู้สมัครทันที
  useEffect(() => {
    if (navToPage === "applicants") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilterJobId(navFilterJob);
      setActivePage("applicants");
      window.history.replaceState({}, document.title);
    }
  }, []); // eslint-disable-line

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

    // โหลด saved jobs จาก backend
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:3000/hr/saved-jobs", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : { savedJobs: [] })
        .then(data => {
          const ids = (data.savedJobs || []).map(j => j.id ?? j);
          setSavedJobs(ids);
        })
        .catch(console.error);
    }
  }, []);

  const renderMain = () => {
    switch (activePage) {
      case "profile":    return <ProfileView hr={hr} setHr={setHr} aboutItems={aboutItems} setAboutItems={setAboutItems} stats={stats} openJobs={openJobs} closedJobs={closedJobs} newPerk={newPerk} setNewPerk={setNewPerk} savedJobs={savedJobs} setSavedJobs={setSavedJobs} setActivePage={setActivePage} initialTab={initialTab} openPostModal={() => setModalOpen(true)} onViewDetail={setSelectedJob} goToApplicants={openApplicantsModal} onReopen={handleReopenJob} />;
      case "applicants": return <ApplicantsView applicants={applicants} filterJobId={filterJobId} onClearFilter={() => setFilterJobId(null)} openJobs={openJobs} />;
      case "interviews": return <InterviewView interviews={interviews} />;
      case "report":     return <ReportView reportData={reportData} />;
      case "open":       return <OpenJobsView openJobs={openJobs} onViewDetail={setSelectedJob} goToApplicants={openApplicantsModal} />;
      case "closed":     return <ClosedJobsView closedJobs={closedJobs} onViewDetail={setSelectedJob} onReopen={handleReopenJob} />;
      case "company":    return <CompanyView hr={hr} setHr={setHr} />;
      default:           return null;
    }
  };

  return (
    <div className="hr-page">

      {/* shimmer animation */}
      <style>{`@keyframes hr-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ── POST JOB MODAL ── */}
      <PostJobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleJobPosted}
      />

      {/* ── JOB DETAIL MODAL ── */}
      <JobDetailModal
        open={!!selectedJob}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onViewApplicants={(job) => { setSelectedJob(null); setApplicantsModal(job); }}
      />

      {/* ── APPLICANTS MODAL ── */}
      <ApplicantsModal
        open={!!applicantsModal}
        job={applicantsModal}
        applicants={applicants}
        onClose={() => setApplicantsModal(null)}
      />

      {/* ── NAV ── */}
      <nav className="hr-nav">
        <div className="hr-nav-left">
          <div className="hrf-logo" onClick={() => navigate("/hr-feed")} style={{ cursor: "pointer" }}>
            Per<em>File</em>
            <span className="hrf-logo-badge">HR</span>
          </div>
          <div className="hr-nav-search">
            <span>🔍</span>
            <input placeholder="ค้นหา Username หรือ Company..." />
          </div>
        </div>
        <div className="hr-nav-right">
          <button className="hr-icon-btn">🔔</button>
          <div className="hrf-user-area" style={{ position: "relative" }}>
            <div className="hrf-user-chip" onClick={() => setShowUserMenu(v => !v)}>
              <div className="hrf-avatar">
                {hr?.avatar
                  ? <img src={hr.avatar} alt="avatar" />
                  : (hr?.name?.[0]?.toUpperCase() ?? "H")}
              </div>
              <span>{hr?.name ?? "Loading..."}</span>
            </div>
            {showUserMenu && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 199 }}
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="hrf-dropdown">
                  <button onClick={() => { setActivePage("profile"); setShowUserMenu(false); }}>
                    โปรไฟล์ของฉัน
                  </button>
                  <button onClick={() => { setActivePage("company"); setShowUserMenu(false); }}>
                    ข้อมูลบริษัท
                  </button>
                  <button className="hrf-logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="hr-body">

        {/* ── SIDEBAR ── */}
        <aside className="hr-sidebar">
          <button className="hr-post-btn" onClick={() => setModalOpen(true)}>＋ โพสต์งาน</button>

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

          <div style={{ flex: 1 }} />
          <div className="hr-sidebar-divider" />
         
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

        
        </div>

      </div>
    </div>
  );
}