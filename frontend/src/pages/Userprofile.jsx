import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LuSearch, LuBookmark, LuBell, LuPanelLeft,
  LuFileText, LuBriefcase, LuMapPin, LuLink, LuPencil,
  LuGithub, LuLinkedin, LuMail, LuStar, LuPlus, LuTrash2,
  LuLayoutDashboard, LuBadgeCheck, LuCheck, LuX,
} from "react-icons/lu";
import { FiHome } from "react-icons/fi";
import { useResumes } from "./ResumeContext";
import "../styles/Userprofile.css";

const PROFILE_KEY = "userprofile_local";
const EXP_KEY     = "userprofile_exp";
const AVATAR_KEY  = "userprofile_avatar";
const COVER_KEY   = "userprofile_cover";

const DEFAULT_PROFILE = {
  displayName: "",
  bio: "Frontend Developer & UI/UX Designer ที่ชอบสร้างประสบการณ์ที่สวยงามและใช้งานได้จริง 🚀",
  location: "Bangkok, Thailand",
  portfolio: "portfolio.dev",
  email: "",
};

const DEFAULT_EXP = [
  { id: 1, icon: "💼", title: "Frontend Developer", company: "Tech Startup Co.", date: "2022 – ปัจจุบัน" },
  { id: 2, icon: "🎨", title: "UX/UI Designer",     company: "Creative Agency",  date: "2020 – 2022" },
];

const TABS = [
  { key: "resumes", label: "Private Resumes" },
  { key: "jobs",    label: "Public Resumes"  },
  { key: "saved",   label: "Saved"           },
];

const ICONS = ["💼","🎨","💻","📊","🔧","🏗️","📱","🎯","📝","⚙️"];

export default function UserProfile() {
  const [activeTab,    setActiveTab]    = useState("resumes");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [userData,     setUserData]     = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [deleteConfirm,setDeleteConfirm]= useState(null);
  const [myResumes,    setMyResumes]    = useState([]);

  // ── Profile editable state ──────────────────────────────────
  const [profile, setProfile] = useState(() => {
    try { return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") }; }
    catch { return DEFAULT_PROFILE; }
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft,   setProfileDraft]   = useState(profile);

  // ── Experience state ────────────────────────────────────────
  const [experiences, setExperiences] = useState(() => {
    try {
      const saved = localStorage.getItem(EXP_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_EXP;
    } catch { return DEFAULT_EXP; }
  });
  const [expModal,    setExpModal]    = useState(false);   // เพิ่ม
  const [expEditId,   setExpEditId]   = useState(null);    // แก้ไข id
  const [expForm,     setExpForm]     = useState({ icon: "💼", title: "", company: "", date: "" });

  // ── Skills state ────────────────────────────────────────────
  const [skills, setSkills] = useState(() => {
    try { return JSON.parse(localStorage.getItem("userprofile_skills") || "null") || ["React","TypeScript","Figma","Node.js","Tailwind CSS","Python","PostgreSQL","Git"]; }
    catch { return ["React","TypeScript","Figma","Node.js","Tailwind CSS","Python","PostgreSQL","Git"]; }
  });
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkill,       setNewSkill]       = useState("");

  // ── Avatar & Cover image state ───────────────────────────────
  const [avatarImg, setAvatarImg] = useState(() => localStorage.getItem(AVATAR_KEY) || null);
  const [coverImg,  setCoverImg]  = useState(() => localStorage.getItem(COVER_KEY)  || null);
  const avatarInputRef = useRef(null);
  const coverInputRef  = useRef(null);

  const sidebarRef      = useRef(null);
  const savedSectionRef = useRef(null);
  const navigate        = useNavigate();
  const location        = useLocation();

  const { privateResumes, removePrivate, removeResume, publishPrivate } = useResumes();

  // ── auto-save to localStorage ────────────────────────────────
  useEffect(() => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {} }, [profile]);
  useEffect(() => { try { localStorage.setItem(EXP_KEY, JSON.stringify(experiences)); } catch {} }, [experiences]);
  useEffect(() => { try { localStorage.setItem("userprofile_skills", JSON.stringify(skills)); } catch {} }, [skills]);
  useEffect(() => { try { if (avatarImg) localStorage.setItem(AVATAR_KEY, avatarImg); else localStorage.removeItem(AVATAR_KEY); } catch {} }, [avatarImg]);
  useEffect(() => { try { if (coverImg)  localStorage.setItem(COVER_KEY,  coverImg);  else localStorage.removeItem(COVER_KEY);  } catch {} }, [coverImg]);

  // ── Image upload handlers ─────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarImg(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCoverImg(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Profile handlers ─────────────────────────────────────────
  const startEditProfile = () => { setProfileDraft({ ...profile }); setEditingProfile(true); };
  const cancelEditProfile= () => setEditingProfile(false);
  const saveProfile      = () => { setProfile(profileDraft); setEditingProfile(false); };

  // ── Experience handlers ──────────────────────────────────────
  const openAddExp = () => {
    setExpForm({ icon: "💼", title: "", company: "", date: "" });
    setExpEditId(null);
    setExpModal(true);
  };
  const openEditExp = (exp) => {
    setExpForm({ icon: exp.icon, title: exp.title, company: exp.company, date: exp.date });
    setExpEditId(exp.id);
    setExpModal(true);
  };
  const saveExp = () => {
    if (!expForm.title.trim()) return;
    if (expEditId !== null) {
      setExperiences(prev => prev.map(e => e.id === expEditId ? { ...e, ...expForm } : e));
    } else {
      setExperiences(prev => [...prev, { id: Date.now(), ...expForm }]);
    }
    setExpModal(false);
  };
  const deleteExp = (id) => setExperiences(prev => prev.filter(e => e.id !== id));

  // ── Skill handlers ───────────────────────────────────────────
  const handleAddSkill = () => {
    const t = newSkill.trim();
    if (t && !skills.includes(t)) setSkills(prev => [...prev, t]);
    setNewSkill(""); setShowSkillModal(false);
  };
  const handleRemoveSkill = (sk) => setSkills(prev => prev.filter(s => s !== sk));

  // ── scroll to saved ──────────────────────────────────────────
  useEffect(() => {
    if (location.state?.scrollTo === "saved") {
      setActiveTab("saved");
      setTimeout(() => savedSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [location.state]);

  // ── fetch resumes ────────────────────────────────────────────
  useEffect(() => {
    const go = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/resumes/my", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); setMyResumes(d.resumes ?? []); }
      } catch {}
    };
    go();
  }, []);

  const privateList = myResumes.filter(r => r.visibility === "private");
  const publicList  = myResumes.filter(r => r.visibility === "public");

  // ── fetch user ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const u = (await res.json()).user;
          setUserData(u);
          // sync email จาก server ถ้ายังว่าง
          setProfile(p => ({ ...p, email: p.email || u?.email || "", displayName: p.displayName || u?.fullName || "" }));
        } else localStorage.removeItem("token");
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const close = (e) => { if (!e.target.closest(".uf-user-area")) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // ── resizable sidebar ────────────────────────────────────────
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const handle = sidebar.querySelector(".uf-resize-handle");
    if (!handle) return;
    let drag = false, startX = 0, startW = 0;
    const down = (e) => { drag=true; startX=e.clientX; startW=sidebar.offsetWidth; document.body.style.userSelect="none"; document.addEventListener("mousemove",move); document.addEventListener("mouseup",up); };
    const move = (e) => { if(!drag) return; sidebar.style.width=Math.min(340,Math.max(80,startW+(e.clientX-startX)))+"px"; };
    const up   = () => { drag=false; document.body.style.userSelect=""; document.removeEventListener("mousemove",move); document.removeEventListener("mouseup",up); };
    handle.addEventListener("mousedown", down);
    return () => handle.removeEventListener("mousedown", down);
  }, []);

  const initial  = userData?.username?.[0]?.toUpperCase() ?? "U";
  const fullName = profile.displayName || userData?.fullName || "Unknown";

  const toggleSidebar = () => { if (sidebarOpen && sidebarRef.current) sidebarRef.current.style.width=""; setSidebarOpen(v=>!v); };
  const handleTabClick= (key) => { setActiveTab(key); if (key==="saved"&&savedSectionRef.current) setTimeout(()=>savedSectionRef.current.scrollIntoView({behavior:"smooth",block:"start"}),50); };
  const handleDelete  = () => { if (!deleteConfirm) return; deleteConfirm.type==="private" ? removePrivate(deleteConfirm.id) : removeResume(deleteConfirm.id); setDeleteConfirm(null); };

  return (
    <div className="uf-page">

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm !== null && (
        <div className="up-modal-overlay">
          <div className="up-modal">
            <div className="up-modal-icon">🗑️</div>
            <div className="up-modal-title">ลบ Resume นี้?</div>
            <div className="up-modal-desc">ไม่สามารถกู้คืนได้หลังจากลบแล้ว</div>
            <div className="up-modal-actions">
              <button className="up-modal-cancel" onClick={() => setDeleteConfirm(null)}>ยกเลิก</button>
              <button className="up-modal-confirm" onClick={handleDelete}>ลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Experience Modal ── */}
      {expModal && (
        <div className="up-modal-overlay" onClick={() => setExpModal(false)}>
          <div className="up-modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
            <div className="up-modal-icon">{expForm.icon}</div>
            <div className="up-modal-title">{expEditId ? "แก้ไขประสบการณ์" : "เพิ่มประสบการณ์"}</div>

            {/* Icon picker */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 12 }}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setExpForm(f => ({ ...f, icon: ic }))}
                  style={{ fontSize: 20, background: expForm.icon===ic ? "#eff6ff" : "transparent", border: expForm.icon===ic ? "2px solid #1e3a8a" : "2px solid transparent", borderRadius: 8, padding: "2px 6px", cursor: "pointer" }}>
                  {ic}
                </button>
              ))}
            </div>

            {[
              { key: "title",   label: "ตำแหน่งงาน",     ph: "เช่น Frontend Developer" },
              { key: "company", label: "บริษัท / องค์กร", ph: "เช่น Tech Startup Co." },
              { key: "date",    label: "ช่วงเวลา",        ph: "เช่น 2022 – ปัจจุบัน" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10, textAlign: "left" }}>
                <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 3 }}>{f.label}</label>
                <input
                  type="text" value={expForm[f.key]} placeholder={f.ph}
                  onChange={e => setExpForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}

            <div className="up-modal-actions">
              <button className="up-modal-cancel" onClick={() => setExpModal(false)}>ยกเลิก</button>
              <button className="up-modal-confirm" onClick={saveExp} disabled={!expForm.title.trim()}>
                {expEditId ? "บันทึก" : "เพิ่ม"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Skill Modal ── */}
      {showSkillModal && (
        <div className="up-modal-overlay" onClick={() => { setShowSkillModal(false); setNewSkill(""); }}>
          <div className="up-modal" onClick={e => e.stopPropagation()}>
            <div className="up-modal-icon">⭐</div>
            <div className="up-modal-title">เพิ่มทักษะ</div>
            <input autoFocus type="text" placeholder="เช่น React, Python, Figma..." value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter") handleAddSkill(); if(e.key==="Escape"){setShowSkillModal(false);setNewSkill("");} }}
              style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:14,marginBottom:4,outline:"none",boxSizing:"border-box" }}
            />
            <div className="up-modal-actions">
              <button className="up-modal-cancel" onClick={() => { setShowSkillModal(false); setNewSkill(""); }}>ยกเลิก</button>
              <button className="up-modal-confirm" onClick={handleAddSkill} disabled={!newSkill.trim()}>เพิ่ม</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="uf-nav">
        <div className="uf-nav-left">
          <button className="uf-toggle-btn" onClick={toggleSidebar}><LuPanelLeft /></button>
          <div className="uf-logo">Per<em>File</em><span className="uf-logo-badge">Seeker</span></div>
          <div className="uf-search"><LuSearch /><input type="text" placeholder="ค้นหา Username หรือ Company..." /></div>
        </div>
        <div className="uf-nav-right">
          <button className="uf-icon-btn"><LuBell /></button>
          <div className="uf-user-area" style={{ position: "relative" }}>
            <div className="uf-user-chip" onClick={() => setMenuOpen(v=>!v)}>
              <div className="uf-avatar">
                {avatarImg
                  ? <img src={avatarImg} alt="avatar" style={{ width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%" }} />
                  : userData?.avatar
                    ? <img src={userData.avatar} alt="avatar" crossOrigin="anonymous" />
                    : initial}
              </div>
              <span>{fullName}</span>
            </div>
            {menuOpen && (
              <div className="uf-dropdown">
                <button onClick={() => navigate("/profile")}>View Profile</button>
                <button className="uf-logout" onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div className="uf-body">

        {/* SIDEBAR */}
        <aside ref={sidebarRef} className={`uf-sidebar${sidebarOpen ? "" : " closed"}`}>
          <div className="uf-resize-handle"><div className="uf-resize-bar" /></div>
          <button className="uf-create-btn" onClick={() => navigate("/resume")}><LuPlus /> Create Resume</button>
          <Link to="/feed" className="uf-menu-item"><LuLayoutDashboard /> Feed</Link>
          <button className="uf-menu-item active"><FiHome /> Profile</button>
          <button className="uf-menu-item" onClick={() => handleTabClick("saved")}><LuBookmark /> Saved</button>
          <div className="uf-section-label">Private Profile</div>
          <div className="uf-sub-item">Development 1</div>
          <div className="uf-sub-item">Tutor 1</div>
          <div className="uf-section-label">Public Profile</div>
          <div className="uf-sub-item">Ux/Ui 2</div>
        </aside>

        {/* MAIN */}
        <main className="uf-main">

          {/* Cover + Profile Info */}
          <div className="up-cover-card">
            <div className="up-cover" style={{ position: "relative", overflow: "hidden" }}>
              {/* Cover image or pattern */}
              {coverImg
                ? <img src={coverImg} alt="cover" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }} />
                : <div className="up-cover-pattern" />
              }
              {/* Hidden cover file input */}
              <input ref={coverInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleCoverChange} />
              <button
                className="up-edit-cover-btn"
                style={{ position:"relative",zIndex:2 }}
                onClick={() => coverInputRef.current?.click()}
              >
                <LuPencil size={11} /> แก้ไขปก
              </button>

              {/* Avatar — clickable */}
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarChange} />
              <div
                className="up-avatar-lg"
                onClick={() => avatarInputRef.current?.click()}
                title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
                style={{ cursor:"pointer", position:"relative", overflow:"hidden" }}
              >
                {avatarImg
                  ? <img src={avatarImg} alt="avatar" style={{ width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%" }} />
                  : initial
                }
                {/* hover overlay */}
                <div style={{
                  position:"absolute",inset:0,borderRadius:"50%",
                  background:"rgba(0,0,0,0.35)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  opacity:0,transition:"opacity 0.2s",
                  fontSize:18,color:"#fff",
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity="1"}
                  onMouseLeave={e => e.currentTarget.style.opacity="0"}
                >
                  <LuPencil size={16} />
                </div>
              </div>
            </div>

            <div className="up-profile-info">
              {editingProfile ? (
                /* ── EDIT MODE ── */
                <div style={{ flex: 1 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: 10 }}>
                    {[
                      { key: "displayName", label: "ชื่อ-นามสกุล",    ph: "ชื่อที่แสดง" },
                      { key: "email",       label: "อีเมล",            ph: "your@email.com" },
                      { key: "location",    label: "ที่อยู่",           ph: "Bangkok, Thailand" },
                      { key: "portfolio",   label: "เว็บไซต์ / Portfolio", ph: "portfolio.dev" },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 2 }}>{f.label}</label>
                        <input
                          type="text" value={profileDraft[f.key]} placeholder={f.ph}
                          onChange={e => setProfileDraft(p => ({ ...p, [f.key]: e.target.value }))}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 2 }}>Bio</label>
                    <textarea rows={2} value={profileDraft.bio} onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value }))}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveProfile}
                      style={{ display:"flex",alignItems:"center",gap:4,padding:"8px 16px",borderRadius:8,border:"none",background:"#1e3a8a",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer" }}>
                      <LuCheck size={13} /> บันทึก
                    </button>
                    <button onClick={cancelEditProfile}
                      style={{ display:"flex",alignItems:"center",gap:4,padding:"8px 14px",borderRadius:8,border:"1.5px solid #e5e7eb",background:"#fff",color:"#374151",fontWeight:600,fontSize:12,cursor:"pointer" }}>
                      <LuX size={13} /> ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                /* ── VIEW MODE ── */
                <>
                  <div>
                    <div className="up-profile-name">{fullName}</div>
                    <div className="up-profile-handle">@{userData?.username || "unknown"} · PerFile</div>
                    <div className="up-profile-bio">{profile.bio}</div>
                    <div className="up-profile-meta">
                      {profile.location  && <span className="up-meta-item"><LuMapPin size={11} /> {profile.location}</span>}
                      {profile.portfolio && <a href={`https://${profile.portfolio.replace(/^https?:\/\//,"")}`} target="_blank" rel="noreferrer" className="up-meta-link"><LuLink size={11} /> {profile.portfolio}</a>}
                      {profile.email     && <span className="up-meta-item"><LuMail size={11} /> {profile.email}</span>}
                    </div>
                    <div className="up-social-row">
                      <button className="up-social-btn"><LuGithub size={13} /> GitHub</button>
                      <button className="up-social-btn"><LuLinkedin size={13} /> LinkedIn</button>
                    </div>
                  </div>
                  <button className="up-edit-profile-btn" onClick={startEditProfile}>
                    <LuPencil size={12} /> แก้ไขโปรไฟล์
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="up-stats-row">
            {[
              { num: privateResumes.length.toString(), label: "RESUMES"     },
              { num: "287",                            label: "VIEWS"       },
              { num: "14",                             label: "SAVED"       },
              { num: "5",                              label: "JOBS POSTED" },
            ].map(s => (
              <div key={s.label} className="up-stat-card">
                <div className="up-stat-num">{s.num}</div>
                <div className="up-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="up-section-card">
            <div className="up-section-header">
              <span><LuStar size={14} style={{ marginRight:5,verticalAlign:"middle",color:"#4f46e5" }} />ทักษะ</span>
              <button className="uf-filter-btn" onClick={() => setShowSkillModal(true)}><LuPlus size={12} /> เพิ่ม</button>
            </div>
            <div className="up-skills-wrap">
              {skills.length > 0 ? skills.map(sk => (
                <span key={sk} className="up-skill-chip" style={{ display:"inline-flex",alignItems:"center",gap:5 }}>
                  {sk}
                  <button onClick={() => handleRemoveSkill(sk)}
                    style={{ background:"none",border:"none",cursor:"pointer",padding:0,lineHeight:1,color:"#9ca3af",fontSize:14,display:"flex",alignItems:"center" }}>
                    ×
                  </button>
                </span>
              )) : (
                <span style={{ color:"#9ca3af",fontSize:13 }}>ยังไม่มีทักษะ กด "+ เพิ่ม" เพื่อเพิ่มทักษะแรก</span>
              )}
            </div>
          </div>

          {/* Experience */}
          <div className="up-section-card">
            <div className="up-section-header">
              <span><LuBriefcase size={14} style={{ marginRight:5,verticalAlign:"middle",color:"#4f46e5" }} />ประสบการณ์</span>
              <button className="uf-filter-btn" onClick={openAddExp}><LuPlus size={12} /> เพิ่ม</button>
            </div>
            {experiences.length === 0 && (
              <p style={{ color:"#9ca3af",fontSize:13 }}>ยังไม่มีประสบการณ์ กด "+ เพิ่ม" เพื่อเพิ่มรายการแรก</p>
            )}
            {experiences.map(e => (
              <div key={e.id} className="up-exp-item" style={{ position:"relative" }}>
                <div className="up-exp-dot">{e.icon}</div>
                <div style={{ flex:1 }}>
                  <div className="up-exp-title">{e.title}</div>
                  <div className="up-exp-sub">{e.company}</div>
                  <div className="up-exp-date">{e.date}</div>
                </div>
                {/* Edit / Delete buttons */}
                <div style={{ display:"flex",gap:4,flexShrink:0 }}>
                  <button onClick={() => openEditExp(e)}
                    style={{ background:"none",border:"1px solid #e5e7eb",borderRadius:6,padding:"3px 8px",cursor:"pointer",color:"#6b7280",fontSize:11,display:"flex",alignItems:"center",gap:3 }}>
                    <LuPencil size={11} /> แก้ไข
                  </button>
                  <button onClick={() => deleteExp(e.id)}
                    style={{ background:"none",border:"1px solid #fecaca",borderRadius:6,padding:"3px 8px",cursor:"pointer",color:"#ef4444",fontSize:11,display:"flex",alignItems:"center",gap:3 }}>
                    <LuTrash2 size={11} /> ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Panel */}
          <div className="uf-panel">
            <div className="uf-tab-bar">
              {TABS.map(t => (
                <button key={t.key} className={`uf-tab${activeTab===t.key?" active":""}`} onClick={() => handleTabClick(t.key)}>
                  {t.label}
                  {t.key==="resumes"&&activeTab==="resumes"&&privateList.length>0&&<span className="uf-tab-badge">{privateList.length}</span>}
                  {t.key==="jobs"&&activeTab==="jobs"&&publicList.length>0&&<span className="uf-tab-badge" style={{background:"#16a34a"}}>{publicList.length}</span>}
                </button>
              ))}
            </div>

            <div className="uf-filter-bar">
              {activeTab==="resumes"&&(
                <button className="uf-filter-btn" style={{marginLeft:"auto",background:"#1e3a8a",color:"#fff",border:"none"}} onClick={() => navigate("/resume")}>
                  <LuPlus /> สร้างเรซูเม่
                </button>
              )}
            </div>

            {/* Private Resumes */}
            {activeTab==="resumes"&&(
              <div className="uf-cards-grid">
                {privateResumes.length > 0 ? (
                  <>
                    {privateResumes.map(p => (
                      <div key={p.id} className="uf-resume-card" onClick={() => navigate(`/view-resume/${p.id}`)}>
                        <div className="uf-resume-header"><div className="uf-resume-icon"><LuFileText /></div></div>
                        <div className="uf-resume-title">{p.title}</div>
                        <div className="uf-resume-meta">
                          <span><LuBadgeCheck /> {p.owner??"You"}</span>
                          {p.createdAt&&<span style={{color:"#9ca3af",fontSize:11}}>🔒 {p.createdAt}</span>}
                        </div>
                        <div style={{position:"absolute",top:16,right:16,zIndex:1}} onClick={e=>e.stopPropagation()}>
                          <button className="uf-action-btn" onClick={e=>{e.stopPropagation();setActionMenuId(prev=>prev===p.id?null:p.id);}}>⋮</button>
                          {actionMenuId===p.id&&(
                            <div className="uf-action-menu" onClick={e=>e.stopPropagation()}>
                              <button className="uf-action-menu-item uf-action-menu-item--accent" onClick={()=>{setActionMenuId(null);publishPrivate(p.id);setActiveTab("jobs");}}>เปลี่ยนเป็น public</button>
                              <button className="uf-action-menu-item uf-action-menu-item--danger" onClick={()=>{setActionMenuId(null);setDeleteConfirm({id:p.id,type:"private"});}}>ลบ Resume</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="uf-resume-card up-add-card" onClick={() => navigate("/resume")}><LuPlus size={26} /><span>เพิ่ม Resume</span></div>
                  </>
                ) : (
                  <div className="uf-empty">
                    <div className="uf-empty-icon">📄</div>
                    <div className="uf-empty-title">ยังไม่มี Resume ที่บันทึกไว้</div>
                    <div className="uf-empty-desc">กด <span style={{color:"#1e3a8a",cursor:"pointer",fontWeight:700}} onClick={()=>navigate("/resume")}>Create Resume</span> เพื่อสร้าง Resume แรกของคุณ</div>
                  </div>
                )}
              </div>
            )}

            {/* Public Resumes */}
            {activeTab==="jobs"&&(
              <div className="uf-cards-grid">
                {publicList.length > 0 ? (
                  <>
                    {publicList.map(p => (
                      <div key={p.id} className="uf-resume-card" onClick={() => navigate(`/view-resume/${p.id}`)}>
                        <div className="uf-resume-header"><div className="uf-resume-icon"><LuFileText /></div></div>
                        <div className="uf-resume-title">{p.title}</div>
                        <div className="uf-resume-meta">
                          <span><LuBadgeCheck /> {userData?.fullName||"You"}</span>
                          {p.createdAt&&<span style={{color:"#16a34a",fontSize:11}}>🌐 {new Date(p.createdAt).toLocaleDateString("th-TH")}</span>}
                        </div>
                        <div style={{position:"absolute",top:16,right:16,zIndex:1}} onClick={e=>e.stopPropagation()}>
                          <button className="uf-action-btn" onClick={e=>{e.stopPropagation();setActionMenuId(prev=>prev===p.id?null:p.id);}}>⋮</button>
                          {actionMenuId===p.id&&(
                            <div className="uf-action-menu" onClick={e=>e.stopPropagation()}>
                              <button className="uf-action-menu-item uf-action-menu-item--danger" onClick={()=>{setActionMenuId(null);setDeleteConfirm({id:p.id,type:"public"});}}>ลบ Resume</button>
                              <button className="uf-action-menu-item uf-action-menu-item--accent" onClick={()=>{setActionMenuId(null);alert("กำลังเปลี่ยนเป็น Private...");}}>เปลี่ยนเป็น private</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="uf-resume-card up-add-card" onClick={() => navigate("/resume")}><LuPlus size={26} /><span>เพิ่ม Resume</span></div>
                  </>
                ) : (
                  <div className="uf-empty">
                    <div className="uf-empty-icon">🌐</div>
                    <div className="uf-empty-title">ยังไม่มีเรซูเม่สาธารณะ</div>
                    <div className="uf-empty-desc">คุณสามารถเปลี่ยนเรซูเม่ส่วนตัวให้เป็นสาธารณะได้ผ่านเมนูแก้ไข</div>
                  </div>
                )}
              </div>
            )}

            {/* Saved */}
            {activeTab==="saved"&&(
              <div ref={savedSectionRef} className="uf-cards-grid">
                <div className="uf-empty">
                  <div className="uf-empty-icon">🔖</div>
                  <div className="uf-empty-title">ยังไม่มีรายการที่บันทึกไว้</div>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}