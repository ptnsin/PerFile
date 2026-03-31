import React, { useState } from "react"
import "../styles/HRProfile.css";
import { useNavigate } from "react-router-dom";

// ---- Mock Data ----
const INITIAL_HR_DATA = {
  name: "Pavinee Wongchai",
  handle: "@pavinee.hr",
  role: "Senior HR Manager",
  company: "Innovate Solutions Co., Ltd.",
  companyLogo: "IS",
  bio: "Passionate about connecting great talent with great opportunities. 8+ years in tech recruitment & people operations 🌟",
  location: "Bangkok, Thailand",
  email: "pavinee@innovate.co.th",
  linkedin: "linkedin.com/in/pavinee",
  website: "innovate.co.th/careers",
  industry: "Technology",
  companySize: "200–500 คน",
  founded: "2015",
  companyDesc:
    "Innovate Solutions เป็นบริษัท SaaS ชั้นนำในไทย พัฒนาซอฟต์แวร์ ERP และ HRM สำหรับองค์กรขนาดกลาง–ใหญ่ มุ่งสร้างวัฒนธรรมการทำงานที่เปิดกว้างและให้โอกาสทุกคนเติบโต",
  perks: ["Remote/Hybrid", "Health Insurance", "Learning Budget", "Flexible Hours", "Team Retreats"],
};

const INITIAL_ABOUT_ITEMS = [
  { icon: "🎓", title: "การศึกษา", detail: "M.A. HRM, Chulalongkorn University" },
  { icon: "💼", title: "ประสบการณ์", detail: "8+ ปี ในสาย Tech Recruitment" },
  { icon: "🏆", title: "ความเชี่ยวชาญ", detail: "Tech Hiring, Employer Branding, People Ops" },
];

const STATS = [
  { num: "12", label: "ตำแหน่งเปิดรับ" },
  { num: "340", label: "ผู้สมัครทั้งหมด" },
  { num: "28", label: "สัมภาษณ์เดือนนี้" },
  { num: "94%", label: "อัตราตอบรับ" },
];

const OPEN_JOBS = [
  { id: 1, title: "Senior Frontend Developer", dept: "Engineering", type: "Full-time", location: "Bangkok / Remote", salary: "80,000–120,000 ฿", posted: "2 วันที่แล้ว", applicants: 47, urgent: true },
  { id: 2, title: "Product Designer (UX/UI)", dept: "Design", type: "Full-time", location: "Bangkok", salary: "60,000–90,000 ฿", posted: "5 วันที่แล้ว", applicants: 31, urgent: false },
  { id: 3, title: "DevOps Engineer", dept: "Infrastructure", type: "Full-time", location: "Remote", salary: "90,000–130,000 ฿", posted: "1 สัปดาห์ที่แล้ว", applicants: 19, urgent: false },
  { id: 4, title: "Data Analyst", dept: "Analytics", type: "Contract", location: "Bangkok", salary: "50,000–70,000 ฿", posted: "3 วันที่แล้ว", applicants: 22, urgent: true },
];

const CLOSED_JOBS = [
  { id: 5, title: "iOS Developer", dept: "Engineering", type: "Full-time", location: "Bangkok", salary: "75,000–100,000 ฿", closedDate: "15 มี.ค. 2568", applicants: 63, hired: "Thanakorn S." },
  { id: 6, title: "Marketing Manager", dept: "Marketing", type: "Full-time", location: "Bangkok", salary: "55,000–80,000 ฿", closedDate: "2 มี.ค. 2568", applicants: 89, hired: "Nattaporn K." },
  { id: 7, title: "Backend Developer (Node.js)", dept: "Engineering", type: "Full-time", location: "Remote", salary: "70,000–100,000 ฿", closedDate: "20 ก.พ. 2568", applicants: 41, hired: "Wirut P." },
];

const DEPT_COLORS = {
  Engineering:    { bg: "#eff6ff", text: "#1d4ed8", accent: "#3b82f6" },
  Design:         { bg: "#fdf4ff", text: "#7e22ce", accent: "#a855f7" },
  Infrastructure: { bg: "#f0fdf4", text: "#15803d", accent: "#22c55e" },
  Analytics:      { bg: "#fff7ed", text: "#c2410c", accent: "#f97316" },
  Marketing:      { bg: "#fff1f2", text: "#be123c", accent: "#f43f5e" },
};

const ACTIVITIES = [
  { text: "ตำแหน่ง Frontend Dev มีผู้สมัครใหม่ 3 คน", time: "10 นาทีที่แล้ว" },
  { text: "นัดสัมภาษณ์กับ Somsak W. พรุ่งนี้ 14:00", time: "1 ชั่วโมงที่แล้ว" },
  { text: "ตำแหน่ง DevOps ถูก save โดย 5 คน", time: "3 ชั่วโมงที่แล้ว" },
];

const QUICK_ACTIONS = [
  { icon: "📋", label: "ดูผู้สมัครทั้งหมด", sub: "340 คน" },
  { icon: "📅", label: "ตารางสัมภาษณ์", sub: "5 นัดสัปดาห์นี้" },
  { icon: "📊", label: "รายงานการสรรหา", sub: "อัปเดตล่าสุด" },
];

// Mock applicant data
const APPLICANTS = [
  { id: 1, name: "Somsak Wirachai", role: "Senior Frontend Developer", status: "สัมภาษณ์รอบ 2", applied: "3 วันที่แล้ว", avatar: "S" },
  { id: 2, name: "Nattaya Pornpan", role: "Product Designer (UX/UI)", status: "รอการตรวจสอบ", applied: "1 วันที่แล้ว", avatar: "N" },
  { id: 3, name: "Krit Tanawat", role: "DevOps Engineer", status: "ผ่านคัดกรอง", applied: "5 วันที่แล้ว", avatar: "K" },
  { id: 4, name: "Pimchanok Suri", role: "Data Analyst", status: "รอการตรวจสอบ", applied: "2 วันที่แล้ว", avatar: "P" },
  { id: 5, name: "Thanakorn Siri", role: "Senior Frontend Developer", status: "เสนอ offer", applied: "7 วันที่แล้ว", avatar: "T" },
];

// Mock interview schedule
const INTERVIEWS = [
  { id: 1, candidate: "Somsak Wirachai", role: "Senior Frontend Developer", date: "พรุ่งนี้", time: "14:00", type: "Video Call", interviewer: "คุณ Pavinee + Tech Lead" },
  { id: 2, candidate: "Krit Tanawat", role: "DevOps Engineer", date: "1 เม.ย. 2568", time: "10:30", type: "On-site", interviewer: "คุณ Pavinee" },
  { id: 3, candidate: "Pimchanok Suri", role: "Data Analyst", date: "2 เม.ย. 2568", time: "13:00", type: "Video Call", interviewer: "คุณ Pavinee + Data Team" },
];

// Mock report data
const REPORT_DATA = {
  thisMonth: { applications: 87, interviews: 28, offers: 5, hired: 3 },
  lastMonth: { applications: 62, interviews: 21, offers: 4, hired: 4 },
  topSources: [
    { name: "LinkedIn", pct: 45 },
    { name: "PerFile", pct: 30 },
    { name: "Referral", pct: 15 },
    { name: "อื่นๆ", pct: 10 },
  ],
};

// ---- Inline Edit Field ----
function EditableField({ value, onChange, multiline = false, className = "", style = {} }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return (
      <span className="hr-edit-inline-wrap">
        {multiline ? (
          <textarea
            className={`hr-edit-textarea ${className}`}
            style={style}
            value={draft}
            autoFocus
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") cancel(); }}
          />
        ) : (
          <input
            className={`hr-edit-input ${className}`}
            style={style}
            value={draft}
            autoFocus
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
          />
        )}
        <span className="hr-edit-actions">
          <button className="hr-edit-confirm" onClick={commit} title="บันทึก">✓</button>
          <button className="hr-edit-cancel" onClick={cancel} title="ยกเลิก">✕</button>
        </span>
      </span>
    );
  }

  return (
    <span
      className={`hr-editable ${className}`}
      style={style}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="คลิกเพื่อแก้ไข"
    >
      {value}
      <span className="hr-edit-pencil">✏️</span>
    </span>
  );
}

// ---- Page Views ----

function ProfileView({ hr, setHr, aboutItems, setAboutItems, newPerk, setNewPerk, savedJobs, setSavedJobs, setActivePage }) {
  const [activeTab, setActiveTab] = useState("jobs");

  const updateHr = (key) => (val) => setHr(prev => ({ ...prev, [key]: val }));
  const updateAbout = (idx, key) => (val) =>
    setAboutItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));

  const toggleSave = (id) =>
    setSavedJobs((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const removePerk = (p) => setHr(prev => ({ ...prev, perks: prev.perks.filter(x => x !== p) }));
  const addPerk = () => {
    if (newPerk.trim()) {
      setHr(prev => ({ ...prev, perks: [...prev.perks, newPerk.trim()] }));
      setNewPerk("");
    }
  };

  const savedJobsList = OPEN_JOBS.filter(j => savedJobs.includes(j.id));
  const TABS = [
    { key: "jobs", label: "ตำแหน่งงาน", count: OPEN_JOBS.length },
    { key: "closed", label: "ปิดแล้ว", count: CLOSED_JOBS.length },
    { key: "saved", label: "Saved", count: savedJobsList.length },
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
            <div className="hr-avatar">P</div>
          </div>
          <div className="hr-profile-name">
            <EditableField value={hr.name} onChange={updateHr("name")} />
          </div>
          <div className="hr-profile-role">
            <EditableField value={hr.role} onChange={updateHr("role")} /> ·{" "}
            <EditableField value={hr.company} onChange={updateHr("company")} />
          </div>
          <div className="hr-profile-handle">
            <EditableField value={hr.handle} onChange={updateHr("handle")} /> · PerFile HR
          </div>
          <div className="hr-profile-bio">
            <EditableField value={hr.bio} onChange={updateHr("bio")} multiline />
          </div>
          <div className="hr-meta-row">
            <span className="hr-meta-item">📍 <EditableField value={hr.location} onChange={updateHr("location")} /></span>
            <span className="hr-meta-item">🔗 <EditableField value={hr.website} onChange={updateHr("website")} /></span>
            <span className="hr-meta-item">✉️ <EditableField value={hr.email} onChange={updateHr("email")} /></span>
          </div>
          <div className="hr-social-row">
            <button className="hr-social-btn">💼 LinkedIn</button>
            <button className="hr-social-btn">🌐 Company Page</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="hr-stats-row">
        {STATS.map((s) => (
          <div key={s.label} className="hr-stat-card">
            <div className="hr-stat-num">{s.num}</div>
            <div className="hr-stat-label">{s.label}</div>
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
            <div className="hr-company-logo">{hr.companyLogo}</div>
            <div>
              <div className="hr-company-name">
                <EditableField value={hr.company} onChange={updateHr("company")} />
              </div>
              <div className="hr-company-industry">
                <EditableField value={hr.industry} onChange={updateHr("industry")} />
              </div>
            </div>
          </div>
          <div className="hr-company-desc">
            <EditableField value={hr.companyDesc} onChange={updateHr("companyDesc")} multiline />
          </div>
          <div className="hr-company-meta">
            <div className="hr-company-meta-item">👥 <strong><EditableField value={hr.companySize} onChange={updateHr("companySize")} /></strong></div>
            <div className="hr-company-meta-item">📅 ก่อตั้ง <strong><EditableField value={hr.founded} onChange={updateHr("founded")} /></strong></div>
            <div className="hr-company-meta-item">🌏 <strong><EditableField value={hr.location} onChange={updateHr("location")} /></strong></div>
          </div>
          <div className="hr-perks-row">
            {hr.perks.map((p) => (
              <span key={p} className="hr-perk-chip">
                {p}
                <button className="hr-perk-remove" onClick={() => removePerk(p)} title="ลบ">×</button>
              </span>
            ))}
            <span className="hr-perk-add-wrap">
              <input
                className="hr-perk-input"
                value={newPerk}
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
          {aboutItems.map((a, idx) => (
            <div key={a.title} className="hr-about-item">
              <div className="hr-about-icon">{a.icon}</div>
              <div>
                <div className="hr-about-title">
                  <EditableField value={a.title} onChange={updateAbout(idx, "title")} />
                </div>
                <div className="hr-about-detail">
                  <EditableField value={a.detail} onChange={updateAbout(idx, "detail")} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Postings */}
      <div className="hr-card">
        <div className="hr-card-header">
          <div className="hr-tab-bar">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`hr-tab${activeTab === t.key ? " active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                <span className={`hr-tab-count${activeTab === t.key ? " active" : ""}`}>{t.count}</span>
              </button>
            ))}
          </div>
          <button className="hr-card-action">+ โพสต์งานใหม่</button>
        </div>

        <div className="hr-jobs-list">
          {/* OPEN JOBS */}
          {activeTab === "jobs" && OPEN_JOBS.map((job) => {
            const dept = DEPT_COLORS[job.dept] || { bg: "#f4f4f5", text: "#52525b", accent: "#71717a" };
            const isSaved = savedJobs.includes(job.id);
            return (
              <div key={job.id} className="hr-job-card">
                <div className="hr-job-top">
                  <div className="hr-job-title-wrap">
                    <div className="hr-job-title">{job.title}</div>
                    <span className="hr-job-dept" style={{ background: dept.bg, color: dept.text }}>{job.dept}</span>
                  </div>
                  <div className="hr-job-actions">
                    {job.urgent && <span className="hr-urgent-badge">⚡ ด่วน</span>}
                    <button
                      className={`hr-save-btn${isSaved ? " saved" : ""}`}
                      onClick={() => toggleSave(job.id)}
                      title={isSaved ? "ยกเลิก save" : "บันทึกงาน"}
                    >
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
          })}

          {/* CLOSED JOBS */}
          {activeTab === "closed" && (
            <div className="hr-closed-list">
              {CLOSED_JOBS.map(job => {
                const dept = DEPT_COLORS[job.dept] || { bg: "#f4f4f5", text: "#52525b" };
                return (
                  <div key={job.id} className="hr-closed-card">
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
              })}
            </div>
          )}

          {/* SAVED JOBS */}
          {activeTab === "saved" && (
            savedJobsList.length === 0 ? (
              <div className="hr-empty-tab">
                <div className="hr-empty-icon">🏷️</div>
                <div className="hr-empty-title">ยังไม่มีงานที่ save</div>
                <div className="hr-empty-desc">กด 🏷️ ที่ตำแหน่งงานไหนก็ได้เพื่อบันทึก</div>
              </div>
            ) : (
              savedJobsList.map(job => {
                const dept = DEPT_COLORS[job.dept] || { bg: "#f4f4f5", text: "#52525b" };
                return (
                  <div key={job.id} className="hr-saved-card">
                    <div className="hr-saved-ribbon">🔖 Saved</div>
                    <div className="hr-job-top">
                      <div className="hr-job-title-wrap">
                        <div className="hr-job-title">{job.title}</div>
                        <span className="hr-job-dept" style={{ background: dept.bg, color: dept.text }}>{job.dept}</span>
                      </div>
                      <button
                        className="hr-save-btn saved"
                        onClick={() => toggleSave(job.id)}
                        title="ยกเลิก save"
                      >🔖</button>
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
            )
          )}
        </div>
      </div>
    </>
  );
}

function ApplicantsView() {
  const statusColor = {
    "รอการตรวจสอบ": { bg: "#fff7ed", text: "#c2410c" },
    "ผ่านคัดกรอง": { bg: "#eff6ff", text: "#1d4ed8" },
    "สัมภาษณ์รอบ 2": { bg: "#fdf4ff", text: "#7e22ce" },
    "เสนอ offer": { bg: "#f0fdf4", text: "#15803d" },
  };
  return (
    <div className="hr-card">
      <div className="hr-card-header">
        <div className="hr-card-title">📋 ผู้สมัครทั้งหมด</div>
        <span className="hr-edit-hint-badge">340 คน</span>
      </div>
      <div className="hr-jobs-list">
        {APPLICANTS.map(a => {
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
        })}
      </div>
    </div>
  );
}

function InterviewView() {
  return (
    <div className="hr-card">
      <div className="hr-card-header">
        <div className="hr-card-title">📅 ตารางสัมภาษณ์</div>
        <button className="hr-card-action">+ นัดสัมภาษณ์</button>
      </div>
      <div className="hr-jobs-list">
        {INTERVIEWS.map(iv => (
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
        ))}
      </div>
    </div>
  );
}

function ReportView() {
  const { thisMonth, lastMonth, topSources } = REPORT_DATA;
  const metrics = [
    { label: "ผู้สมัคร", cur: thisMonth.applications, prev: lastMonth.applications, icon: "📋" },
    { label: "สัมภาษณ์", cur: thisMonth.interviews, prev: lastMonth.interviews, icon: "📅" },
    { label: "เสนอ Offer", cur: thisMonth.offers, prev: lastMonth.offers, icon: "📨" },
    { label: "รับเข้าทำงาน", cur: thisMonth.hired, prev: lastMonth.hired, icon: "✅" },
  ];
  return (
    <>
      <div className="hr-stats-row">
        {metrics.map(m => {
          const diff = m.cur - m.prev;
          const up = diff >= 0;
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
        <div className="hr-card-header">
          <div className="hr-card-title">📊 แหล่งที่มาของผู้สมัคร</div>
        </div>
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

function OpenJobsView() {
  return (
    <div className="hr-card">
      <div className="hr-card-header">
        <div className="hr-card-title">🟢 ตำแหน่งที่เปิดรับ</div>
        <button className="hr-card-action">+ โพสต์งานใหม่</button>
      </div>
      <div className="hr-jobs-list">
        {OPEN_JOBS.map((job) => {
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
        })}
      </div>
    </div>
  );
}

function ClosedJobsView() {
  return (
    <div className="hr-card">
      <div className="hr-card-header">
        <div className="hr-card-title">⚫ ตำแหน่งที่ปิดแล้ว</div>
      </div>
      <div className="hr-jobs-list">
        <div className="hr-closed-list">
          {CLOSED_JOBS.map(job => {
            const dept = DEPT_COLORS[job.dept] || { bg: "#f4f4f5", text: "#52525b" };
            return (
              <div key={job.id} className="hr-closed-card">
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
          })}
        </div>
      </div>
    </div>
  );
}

function CompanyView({ hr, setHr }) {
  const updateHr = (key) => (val) => setHr(prev => ({ ...prev, [key]: val }));
  return (
    <div className="hr-card">
      <div className="hr-card-header">
        <div className="hr-card-title">🏢 Innovate Solutions</div>
        <span className="hr-edit-hint-badge">คลิกข้อความเพื่อแก้ไข</span>
      </div>
      <div className="hr-company-body">
        <div className="hr-company-top">
          <div className="hr-company-logo">{hr.companyLogo}</div>
          <div>
            <div className="hr-company-name">
              <EditableField value={hr.company} onChange={updateHr("company")} />
            </div>
            <div className="hr-company-industry">
              <EditableField value={hr.industry} onChange={updateHr("industry")} />
            </div>
          </div>
        </div>
        <div className="hr-company-desc">
          <EditableField value={hr.companyDesc} onChange={updateHr("companyDesc")} multiline />
        </div>
        <div className="hr-company-meta">
          <div className="hr-company-meta-item">👥 <strong><EditableField value={hr.companySize} onChange={updateHr("companySize")} /></strong></div>
          <div className="hr-company-meta-item">📅 ก่อตั้ง <strong><EditableField value={hr.founded} onChange={updateHr("founded")} /></strong></div>
          <div className="hr-company-meta-item">🌏 <strong><EditableField value={hr.location} onChange={updateHr("location")} /></strong></div>
        </div>
      </div>
    </div>
  );
}

// ---- Component ----
export default function HRProfile() {
  const [activePage, setActivePage] = useState("profile");
  const [savedJobs, setSavedJobs] = useState([]);
  const [hr, setHr] = useState(INITIAL_HR_DATA);
  const [aboutItems, setAboutItems] = useState(INITIAL_ABOUT_ITEMS);
  const [newPerk, setNewPerk] = useState("");
  const navigate = useNavigate();

  const PAGE_TITLES = {
    profile: "Profile",
    applicants: "ผู้สมัคร",
    interviews: "สัมภาษณ์",
    report: "รายงาน",
    open: "เปิดรับ",
    closed: "ปิดแล้ว",
    company: "Innovate Solutions",
  };

  const renderMain = () => {
    switch (activePage) {
      case "profile":
        return <ProfileView hr={hr} setHr={setHr} aboutItems={aboutItems} setAboutItems={setAboutItems} newPerk={newPerk} setNewPerk={setNewPerk} savedJobs={savedJobs} setSavedJobs={setSavedJobs} setActivePage={setActivePage} />;
      case "applicants":
        return <ApplicantsView />;
      case "interviews":
        return <InterviewView />;
      case "report":
        return <ReportView />;
      case "open":
        return <OpenJobsView />;
      case "closed":
        return <ClosedJobsView />;
      case "company":
        return <CompanyView hr={hr} setHr={setHr} />;
      default:
        return null;
    }
  };

  return (
    <div className="hr-page">

      {/* ── NAV ── */}
      <nav className="hr-nav">
        <div className="hr-nav-left">
          <div
            className="hr-nav-logo"
            onClick={() => navigate("/hr-feed")}
            style={{ cursor: "pointer" }}
          >
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
          <div className="hr-nav-avatar">P</div>
        </div>
      </nav>

      <div className="hr-body">

        {/* ── SIDEBAR ── */}
        <aside className="hr-sidebar">
          <button className="hr-post-btn">＋ โพสต์งาน</button>

          <button
            className={`hr-menu-item${activePage === "profile" ? " active" : ""}`}
            onClick={() => setActivePage("profile")}
          >
            <span className="hr-menu-icon">🏠</span> Profile
          </button>

          <button
            className={`hr-menu-item${activePage === "applicants" ? " active" : ""}`}
            onClick={() => setActivePage("applicants")}
          >
            <span className="hr-menu-icon">📋</span> ผู้สมัคร
            <span className="hr-menu-badge">12</span>
          </button>

          <button
            className={`hr-menu-item${activePage === "interviews" ? " active" : ""}`}
            onClick={() => setActivePage("interviews")}
          >
            <span className="hr-menu-icon">📅</span> สัมภาษณ์
          </button>

          <button
            className={`hr-menu-item${activePage === "report" ? " active" : ""}`}
            onClick={() => setActivePage("report")}
          >
            <span className="hr-menu-icon">📊</span> รายงาน
          </button>

          <div className="hr-section-title">ตำแหน่งงาน</div>

          <button
            className={`hr-menu-item${activePage === "open" ? " active" : ""}`}
            onClick={() => setActivePage("open")}
          >
            <span>🟢</span> เปิดรับ (12)
          </button>

          <button
            className={`hr-menu-item${activePage === "closed" ? " active" : ""}`}
            onClick={() => setActivePage("closed")}
          >
            <span>⚫</span> ปิดแล้ว (8)
          </button>

          <div className="hr-section-title">บริษัท</div>

          <button
            className={`hr-menu-item${activePage === "company" ? " active" : ""}`}
            onClick={() => setActivePage("company")}
          >
            <span>🏢</span> Innovate Solutions
          </button>
        </aside>

        {/* ── MAIN ── */}
        <main className="hr-main">
          {renderMain()}
        </main>

        {/* ── RIGHT PANEL ── */}
        <div className="hr-right">
          <div className="hr-right-card">
            <div className="hr-right-title">กิจกรรมล่าสุด</div>
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="hr-activity-item">
                <div className="hr-activity-dot" />
                <div>
                  <div className="hr-activity-text">{a.text}</div>
                  <div className="hr-activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="hr-right-card">
            <div className="hr-right-title">Quick Actions</div>
            {QUICK_ACTIONS.map((q) => (
              <button
                key={q.label}
                className="hr-quick-action"
                onClick={() => {
                  if (q.label === "ดูผู้สมัครทั้งหมด") setActivePage("applicants");
                  if (q.label === "ตารางสัมภาษณ์") setActivePage("interviews");
                  if (q.label === "รายงานการสรรหา") setActivePage("report");
                }}
              >
                <div className="hr-quick-icon">{q.icon}</div>
                <div>
                  <div className="hr-quick-label">{q.label}</div>
                  <div className="hr-quick-sub">{q.sub}</div>
                </div>
              </button>
            ))}
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
