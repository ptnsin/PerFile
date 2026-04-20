import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LuSearch, LuBookmark, LuBell, LuPanelLeft,
  LuFileText, LuBriefcase, LuMapPin, LuLink, LuPencil,
  LuGithub, LuLinkedin, LuMail, LuStar, LuPlus, LuTrash2,
  LuLayoutDashboard, LuBadgeCheck, LuCheck, LuX, LuCamera,
  LuUpload, LuLoader,
} from "react-icons/lu";
import { FiHome } from "react-icons/fi";
import "../styles/Userprofile.css";

const API = "http://localhost:3000";

const PROFILE_KEY = "userprofile_local";
// หมายเหตุ: AVATAR_KEY / COVER_KEY ยังคงไว้เป็น fallback แต่แหล่งข้อมูลหลักคือ backend แล้ว
const AVATAR_KEY = "userprofile_avatar";
const COVER_KEY = "userprofile_cover";

const DEFAULT_PROFILE = {
  displayName: "",
  bio: "",
  location: "",
  portfolio: "",
  email: "",
  github: "",
  linkedin: "",
};

const TABS = [
  { key: "resumes", label: "Private Resumes" },
  { key: "jobs", label: "Public Resumes" },
  { key: "saved", label: "Saved" },
];

const ICONS = ["💼", "🎨", "💻", "📊", "🔧", "🏗️", "📱", "🎯", "📝", "⚙️"];

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// ── Upload รูปไปที่ Backend แล้วรับ URL กลับมา ──────────────────────
async function uploadImage(file, type) {
  // type = "avatar" | "cover"
  const formData = new FormData();
  formData.append("image", file);
  formData.append("type", type);

  const res = await fetch(`${API}/profile/upload-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  return data.url; // backend ส่งกลับมาเป็น URL
}

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("resumes");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [myResumes, setMyResumes] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedResumes, setSavedResumes] = useState([]);
  const [savedSubTab, setSavedSubTab] = useState("jobs");
  const [savedLoading, setSavedLoading] = useState(false);
  const [stats, setStats] = useState({ views: "0", score: "0%", interviewing: "0", shortlisted: "0" });
  const [searchQuery, setSearchQuery] = useState("");
  // Notification
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications ?? []);
        }
      } catch (err) {
        console.error("Fetch notifications error:", err);
      }
    };
    fetchNotifs();
  }, []);

  // Close on outside click
  useEffect(() => {
    const close = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // ── Fetch Stats จาก backend ──────────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API}/profile/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats({
            views: String(data.views ?? 0),
            score: `${data.profile_score ?? 0}%`,
            interviewing: String(data.interview_count ?? 0),
            shortlisted: String(data.shortlisted_count ?? 0),
          });
        }
      } catch (err) {
        console.error("Fetch stats error:", err);
      }
    };
    fetchStats();
  }, []);

  // ── Profile editable state ──────────────────────────────────────
  const [profile, setProfile] = useState(() => {
    try { return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") }; }
    catch { return DEFAULT_PROFILE; }
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(profile);

  // ── Experience ──────────────────────────────────────────────────
  const [experiences, setExperiences] = useState([]);
  const [expLoading, setExpLoading] = useState(true);
  const [expModal, setExpModal] = useState(false);
  const [expEditId, setExpEditId] = useState(null);
  const [expForm, setExpForm] = useState({ icon: "💼", title: "", company: "", date: "" });

  // ── Skills ──────────────────────────────────────────────────────
  const [skills, setSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  // ── Avatar & Cover ───────────────────────────────────────────────
  // แหล่งข้อมูลหลัก: URL จาก backend (เก็บใน state)
  // fallback: base64 ใน localStorage (กรณีไม่มี backend)
  const [avatarUrl, setAvatarUrl] = useState(null);   // URL จาก DB
  const [coverUrl, setCoverUrl] = useState(null);   // URL จาก DB
  const [avatarPreview, setAvatarPreview] = useState(() => localStorage.getItem(AVATAR_KEY) || null);
  const [coverPreview, setCoverPreview] = useState(() => localStorage.getItem(COVER_KEY) || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const savedSectionRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();


  // ── auto-save profile to localStorage ─────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    } catch (err) {
      console.error("fetch user error:", err);
    }
  }, [profile]);

  // ── Fetch profile info (รวม avatar + cover_image) ──────────────
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${API}/profile/info`, { headers: authHeader() });
        if (res.ok) {
          const data = await res.json();
          setProfile(p => ({
            ...p,
            bio: data.bio || p.bio,
            location: data.location || p.location,
            portfolio: data.portfolio || p.portfolio,
            github: data.github || p.github,
            linkedin: data.linkedin || p.linkedin,
          }));
          // ตั้งค่า URL รูปจาก backend
          if (data.avatar) setAvatarUrl(data.avatar);
          if (data.cover_image) setCoverUrl(data.cover_image);
        }
      } catch (err) {
        console.error("fetchInfo error:", err);
      }
    };
    fetchInfo();
  }, []);

  // ── Image display: ใช้ URL จาก backend ก่อน ถ้าไม่มีใช้ preview ──
  const displayAvatar = avatarUrl || avatarPreview;
  const displayCover = coverUrl || coverPreview;

  // ── Upload Handlers ───────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setUploadError(null);

    // แสดง preview ทันที (optimistic)
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      try {
        localStorage.setItem(AVATAR_KEY, reader.result);

      } catch (err) {
        console.error("fetch user error:", err);
      }
    };
    reader.readAsDataURL(file);

    // Upload จริงไปที่ backend
    setAvatarUploading(true);
    try {
      const url = await uploadImage(file, "avatar");
      setAvatarUrl(url);
      setAvatarPreview(null); // ใช้ URL จาก backend แทน base64
      localStorage.removeItem(AVATAR_KEY);
    } catch (err) {
      console.error("avatar upload error:", err);
      setUploadError("อัปโหลดรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setUploadError(null);

    // แสดง preview ทันที
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result);
      try {
        localStorage.setItem(COVER_KEY, reader.result);

      } catch (err) {
        console.error("fetch user error:", err);
      }
    };
    reader.readAsDataURL(file);

    // Upload จริง
    setCoverUploading(true);
    try {
      const url = await uploadImage(file, "cover");
      setCoverUrl(url);
      setCoverPreview(null);
      localStorage.removeItem(COVER_KEY);
    } catch (err) {
      console.error("cover upload error:", err);
      setUploadError("อัปโหลดรูปปกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setCoverUploading(false);
    }
  };

  // ── Profile handlers ──────────────────────────────────────────
  const startEditProfile = () => { setProfileDraft({ ...profile }); setEditingProfile(true); };
  const cancelEditProfile = () => setEditingProfile(false);
  const saveProfile = async () => {
    try {
      await fetch(`${API}/profile/info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          bio: profileDraft.bio,
          location: profileDraft.location,
          portfolio: profileDraft.portfolio,
          github: profileDraft.github,
          linkedin: profileDraft.linkedin,
        }),
      });
    } catch (err) {
      console.error("saveProfile error:", err);
    }
    setProfile(profileDraft);
    setEditingProfile(false);
  };

  // ── Experience handlers ───────────────────────────────────────
  const openAddExp = () => { setExpForm({ icon: "💼", title: "", company: "", date: "" }); setExpEditId(null); setExpModal(true); };
  const openEditExp = (exp) => { setExpForm({ icon: exp.icon, title: exp.title, company: exp.company, date: exp.date }); setExpEditId(exp.id); setExpModal(true); };
  const saveExp = async () => {
    if (!expForm.title.trim()) return;
    try {
      if (expEditId !== null) {
        const res = await fetch(`${API}/profile/experiences/${expEditId}`, { method: "PUT", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify(expForm) });
        if (res.ok) setExperiences(prev => prev.map(e => e.id === expEditId ? { ...e, ...expForm } : e));
      } else {
        const res = await fetch(`${API}/profile/experiences`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify(expForm) });
        if (res.ok) { const data = await res.json(); setExperiences(prev => [...prev, data.experience]); }
      }
      setExpModal(false);
    } catch (err) { console.error("saveExp error:", err); }
  };
  const deleteExp = async (id) => {
    try {
      const res = await fetch(`${API}/profile/experiences/${id}`, { method: "DELETE", headers: authHeader() });
      if (res.ok) setExperiences(prev => prev.filter(e => e.id !== id));
    } catch (err) { console.error("deleteExp error:", err); }
  };

  // ── Skill handlers ────────────────────────────────────────────
  const handleAddSkill = async () => {
    const t = newSkill.trim();
    if (!t) return;
    try {
      const res = await fetch(`${API}/profile/skills`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ name: t }) });
      if (res.ok) { const data = await res.json(); setSkills(prev => [...prev, data.skill]); }
      else if (res.status === 409) alert("มีทักษะนี้อยู่แล้ว");
    } catch (err) { console.error("addSkill error:", err); }
    setNewSkill(""); setShowSkillModal(false);
  };
  const handleRemoveSkill = async (skill) => {
    try {
      const res = await fetch(`${API}/profile/skills/${skill.id}`, { method: "DELETE", headers: authHeader() });
      if (res.ok) setSkills(prev => prev.filter(s => s.id !== skill.id));
    } catch (err) { console.error("removeSkill error:", err); }
  };

  // ── scroll to saved ───────────────────────────────────────────
  useEffect(() => {
    if (location.state?.scrollTo === "saved") {
      setActiveTab("saved");
      setTimeout(() => savedSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [location.state]);

  // ── Fetch skills / stats / experiences ────────────────────────
  useEffect(() => {
    fetch(`${API}/profile/skills`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setSkills(d.skills); }).catch(() => { }).finally(() => setSkillsLoading(false));
  }, []);
  useEffect(() => {
    fetch(`${API}/profile/stats`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : null).then(d => {
        if (d) setStats({ views: d.views?.toString() || "0", score: (d.profile_score || "0") + "%", interviewing: d.interview_count?.toString() || "0", shortlisted: d.shortlisted_count?.toString() || "0" });
      }).catch(() => { });
  }, []);
  useEffect(() => {
    fetch(`${API}/profile/experiences`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setExperiences(d.experiences); }).catch(() => { }).finally(() => setExpLoading(false));
  }, []);

  // ── fetch resumes ─────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/resumes/my`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setMyResumes(d.resumes ?? []); }).catch(() => { });
  }, []);

  const privateList = myResumes.filter(r => r.visibility === "private");
  const publicList = myResumes.filter(r => r.visibility === "public");

  // ── fetch applied jobs ────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/applications/my`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setAppliedJobs(d.applications ?? []); }).catch(() => { });
  }, []);

  // ── fetch saved jobs + resumes ────────────────────────────────
  useEffect(() => {
    if (activeTab !== "saved") return;
    setSavedLoading(true);
    Promise.all([
      fetch(`${API}/saved/jobs`, { headers: authHeader() }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/saved/resumes`, { headers: authHeader() }).then(r => r.ok ? r.json() : null),
    ]).then(([j, r]) => {
      if (j) setSavedJobs(j.savedJobs ?? []);
      if (r) setSavedResumes(r.savedResumes ?? []);
    }).catch(err => console.error("fetch saved error:", err)).finally(() => setSavedLoading(false));
  }, [activeTab]);

  // ── unsave handlers ───────────────────────────────────────────
  const handleUnsaveJob = async (id) => { const r = await fetch(`${API}/saved/jobs/${id}`, { method: "DELETE", headers: authHeader() }); if (r.ok) setSavedJobs(p => p.filter(j => j.job_id !== id)); };
  const handleUnsaveResume = async (id) => { const r = await fetch(`${API}/saved/resumes/${id}`, { method: "DELETE", headers: authHeader() }); if (r.ok) setSavedResumes(p => p.filter(r => r.resume_id !== id)); };

  // ── fetch user ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const u = (await res.json()).user;
          setUserData(u);
          setProfile(p => ({ ...p, email: p.email || u?.email || "", displayName: p.displayName || u?.fullName || "" }));
        } else localStorage.removeItem("token");
      } catch (err) {
        console.error("fetch user error:", err);
      }
    })();
  }, []);

  // ── misc ──────────────────────────────────────────────────────
  useEffect(() => {
    const close = (e) => { if (!e.target.closest(".uf-user-area")) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const handle = sidebar.querySelector(".uf-resize-handle");
    if (!handle) return;
    let drag = false, startX = 0, startW = 0;
    const down = (e) => { drag = true; startX = e.clientX; startW = sidebar.offsetWidth; document.body.style.userSelect = "none"; document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); };
    const move = (e) => { if (!drag) return; sidebar.style.width = Math.min(340, Math.max(80, startW + (e.clientX - startX))) + "px"; };
    const up = () => { drag = false; document.body.style.userSelect = ""; document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    handle.addEventListener("mousedown", down);
    return () => handle.removeEventListener("mousedown", down);
  }, []);

  const initial = userData?.username?.[0]?.toUpperCase() ?? "U";
  const fullName = profile.displayName || userData?.fullName || "Unknown";
  const toggleSidebar = () => { if (sidebarOpen && sidebarRef.current) sidebarRef.current.style.width = ""; setSidebarOpen(v => !v); };
  const handleTabClick = (key) => { setActiveTab(key); if (key === "saved" && savedSectionRef.current) setTimeout(() => savedSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await fetch(`${API}/resumes/${deleteConfirm.id}`, { method: "DELETE", headers: authHeader() });
    const res = await fetch(`${API}/resumes/my`, { headers: authHeader() });
    if (res.ok) { const d = await res.json(); setMyResumes(d.resumes ?? []); }
    setDeleteConfirm(null);
  };

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
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 12 }}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setExpForm(f => ({ ...f, icon: ic }))}
                  style={{ fontSize: 20, background: expForm.icon === ic ? "#eff6ff" : "transparent", border: expForm.icon === ic ? "2px solid #1e3a8a" : "2px solid transparent", borderRadius: 8, padding: "2px 6px", cursor: "pointer" }}>
                  {ic}
                </button>
              ))}
            </div>
            {[
              { key: "title", label: "ตำแหน่งงาน", ph: "เช่น Frontend Developer" },
              { key: "company", label: "บริษัท / องค์กร", ph: "เช่น Tech Startup Co." },
              { key: "date", label: "ช่วงเวลา", ph: "เช่น 2022 – ปัจจุบัน" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10, textAlign: "left" }}>
                <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 3 }}>{f.label}</label>
                <input type="text" value={expForm[f.key]} placeholder={f.ph}
                  onChange={e => setExpForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div className="up-modal-actions">
              <button className="up-modal-cancel" onClick={() => setExpModal(false)}>ยกเลิก</button>
              <button className="up-modal-confirm" onClick={saveExp} disabled={!expForm.title.trim()}>{expEditId ? "บันทึก" : "เพิ่ม"}</button>
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
              onKeyDown={e => { if (e.key === "Enter") handleAddSkill(); if (e.key === "Escape") { setShowSkillModal(false); setNewSkill(""); } }}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, marginBottom: 4, outline: "none", boxSizing: "border-box" }} />
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
          <div className="uf-search"><LuSearch /><input
              type="text"
              placeholder="ค้นหา Username หรือ Company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  navigate(`/feed?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            /></div>
        </div>
        <div className="uf-nav-right">
          <div ref={notifRef} style={{ position: "relative" }}>
            <button className="uf-icon-btn" title="Notifications" onClick={() => setNotifOpen(v => !v)}
              style={{ position: "relative" }}>
              <LuBell />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span style={{
                  position: "absolute", top: 4, right: 4,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#ef4444", border: "1.5px solid #fff",
                }} />
              )}
            </button>
            {notifOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: 320, background: "#fff", borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.13)", border: "1px solid #e5e7eb",
                zIndex: 999, overflow: "hidden",
              }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>แจ้งเตือน</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <>
                        <span style={{ background: "#eff6ff", color: "#1e3a8a", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>
                          {notifications.filter(n => !n.is_read).length} ใหม่
                        </span>
                        <button onClick={async () => {
                          const token = localStorage.getItem("token");
                          await fetch(`${API}/notifications/read-all`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
                          setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
                        }} style={{ fontSize: 11, color: "#1e3a8a", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}>
                          อ่านทั้งหมด
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {notifications.length > 0 ? notifications.map((n, i) => (
                    <div key={n.id ?? i}
                      onClick={async () => {
                        if (!n.is_read) {
                          const token = localStorage.getItem("token");
                          await fetch(`${API}/notifications/${n.id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
                        }
                      }}
                      style={{
                        padding: "10px 16px", borderBottom: "1px solid #f9fafb",
                        background: n.is_read ? "#fff" : "#f0f7ff",
                        display: "flex", gap: 10, alignItems: "flex-start",
                        cursor: n.is_read ? "default" : "pointer",
                      }}>
                      <div style={{ fontSize: 18, flexShrink: 0 }}>
                        {n.type === "save_resume" ? "📌" : "🔔"}
                      </div>
                      <div style={{ flex: 1 }}>
                        {n.title && <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 2 }}>{n.title}</div>}
                        <div style={{ fontSize: 13, color: "#111827", fontWeight: n.is_read ? 400 : 600 }}>{n.message ?? n.title}</div>
                        {n.created_at && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{new Date(n.created_at).toLocaleDateString("th-TH")}</div>}
                      </div>
                      {!n.is_read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#1e3a8a", flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  )) : (
                    <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>ยังไม่มีแจ้งเตือน</div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
                    <button onClick={async () => {
                      const token = localStorage.getItem("token");
                      await fetch(`${API}/notifications/clear`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                      setNotifications([]);
                    }} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      ลบทั้งหมด
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="uf-user-area" style={{ position: "relative" }}>
            <div className="uf-user-chip" onClick={() => setMenuOpen(v => !v)}>
              <div className="uf-avatar">
                {displayAvatar
                  ? <img src={displayAvatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} crossOrigin="anonymous" />
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
          <div className="uf-section-label">
            Jobs Applied
            {appliedJobs.length > 0 && (
              <span style={{ marginLeft: 6, background: "#1e3a8a", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{appliedJobs.length}</span>
            )}
          </div>
          {appliedJobs.length > 0 ? appliedJobs.slice(0, 5).map(a => (
            <div key={a.id} className="uf-sub-item" style={{ cursor: "default" }}>
              <span style={{
                display: "inline-block", marginRight: 5, fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6,
                background: a.status === "accepted" ? "#dcfce7" : a.status === "rejected" ? "#fee2e2" : "#fef9c3",
                color: a.status === "accepted" ? "#16a34a" : a.status === "rejected" ? "#dc2626" : "#ca8a04",
              }}>
                {a.status === "accepted" ? "✓" : a.status === "rejected" ? "✕" : "⏳"}
              </span>
              {a.jobTitle}
            </div>
          )) : (
            <div className="uf-sub-item" style={{ color: "#9ca3af", fontSize: 11 }}>ยังไม่ได้สมัครงาน</div>
          )}
          {privateList.length > 0 && (
            <>
              <div className="uf-section-label">Private Resumes</div>
              {privateList.map(r => (
                <div key={r.id} className="uf-sub-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/view-resume/${r.id}`)}>🔒 {r.title}</div>
              ))}
            </>
          )}
          {publicList.length > 0 && (
            <>
              <div className="uf-section-label">Public Resumes</div>
              {publicList.map(r => (
                <div key={r.id} className="uf-sub-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/view-resume/${r.id}`)}>🌐 {r.title}</div>
              ))}
            </>
          )}
        </aside>

        {/* MAIN */}
        <main className="uf-main">

          {/* ── Upload Error Toast ── */}
          {uploadError && (
            <div style={{
              position: "fixed", top: 72, right: 24, zIndex: 9999,
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)", fontSize: 13, color: "#dc2626",
            }}>
              ⚠️ {uploadError}
              <button onClick={() => setUploadError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 0, fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
          )}

          {/* ── Cover + Profile Info ── */}
          <div className="up-cover-card">
            <div className="up-cover" style={{ position: "relative", overflow: "hidden" }}>

              {/* Cover Image */}
              {displayCover
                ? <img src={displayCover} alt="cover" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                : <div className="up-cover-pattern" />
              }

              {/* Uploading overlay — Cover */}
              {coverUploading && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 8, color: "#fff", fontSize: 13, fontWeight: 600, zIndex: 5,
                }}>
                  <LuLoader size={22} style={{ animation: "up-spin 0.9s linear infinite" }} />
                  กำลังอัปโหลดรูปปก...
                </div>
              )}

              {/* Hidden file input — Cover */}
              <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />

              {/* Edit Cover Button */}
              <button
                className="up-edit-cover-btn"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
                style={{ opacity: coverUploading ? 0.6 : 1 }}
              >
                {coverUploading
                  ? <><LuLoader size={11} style={{ animation: "up-spin 0.9s linear infinite" }} /> กำลังอัปโหลด...</>
                  : <><LuCamera size={11} /> เปลี่ยนรูปปก</>
                }
              </button>

              {/* Hidden file input — Avatar */}
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />

              {/* Avatar */}
              <div
                className="up-avatar-lg"
                onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
                style={{ cursor: avatarUploading ? "default" : "pointer", position: "relative", overflow: "hidden" }}
              >
                {displayAvatar
                  ? <img src={displayAvatar} alt="avatar" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  : userData?.avatar
                    ? <img src={userData.avatar} alt="avatar" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    : initial
                }

                {/* Avatar hover / uploading overlay */}
                <div className="up-avatar-overlay"
                  style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: avatarUploading ? "rgba(0,0,0,0.50)" : "rgba(0,0,0,0.35)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    opacity: avatarUploading ? 1 : 0,
                    transition: "opacity 0.2s",
                    fontSize: 11, color: "#fff", fontWeight: 600, gap: 3,
                  }}
                  onMouseEnter={e => { if (!avatarUploading) e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={e => { if (!avatarUploading) e.currentTarget.style.opacity = "0"; }}
                >
                  {avatarUploading
                    ? <LuLoader size={18} style={{ animation: "up-spin 0.9s linear infinite" }} />
                    : <><LuCamera size={16} /><span style={{ fontSize: 10 }}>เปลี่ยนรูป</span></>
                  }
                </div>
              </div>
            </div>

            {/* ── Profile Info ── */}
            <div className="up-profile-info">
              {editingProfile ? (
                <div style={{ flex: 1 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: 10 }}>
                    {[
                      { key: "displayName", label: "ชื่อ-นามสกุล", ph: "ชื่อที่แสดง" },
                      { key: "email", label: "อีเมล", ph: "your@email.com" },
                      { key: "location", label: "ที่อยู่", ph: "Bangkok, Thailand" },
                      { key: "portfolio", label: "เว็บไซต์ / Portfolio", ph: "portfolio.dev" },
                      { key: "github", label: "GitHub", ph: "github.com/username" },
                      { key: "linkedin", label: "LinkedIn", ph: "linkedin.com/in/username" },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 2 }}>{f.label}</label>
                        <input type="text" value={profileDraft[f.key]} placeholder={f.ph}
                          onChange={e => setProfileDraft(p => ({ ...p, [f.key]: e.target.value }))}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 2 }}>Bio</label>
                    <textarea rows={2} value={profileDraft.bio} onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value }))}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveProfile} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 16px", borderRadius: 8, border: "none", background: "#1e3a8a", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      <LuCheck size={13} /> บันทึก
                    </button>
                    <button onClick={cancelEditProfile} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                      <LuX size={13} /> ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="up-profile-name">{fullName}</div>
                    <div className="up-profile-handle">@{userData?.username || "unknown"} · PerFile</div>
                    <div className="up-profile-bio">{profile.bio}</div>
                    <div className="up-profile-meta">
                      {profile.location && <span className="up-meta-item"><LuMapPin size={11} /> {profile.location}</span>}
                      {profile.portfolio && <a href={`https://${profile.portfolio.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="up-meta-link"><LuLink size={11} /> {profile.portfolio}</a>}
                      {profile.email && <span className="up-meta-item"><LuMail size={11} /> {profile.email}</span>}
                    </div>
                    <div className="up-social-row">
                      {profile.github ? (
                        <a href={`https://${profile.github.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="up-social-btn" style={{ textDecoration: "none" }}>
                          <LuGithub size={13} /> GitHub
                        </a>
                      ) : (
                        <button className="up-social-btn" onClick={startEditProfile}><LuGithub size={13} /> GitHub</button>
                      )}
                      {profile.linkedin ? (
                        <a href={`https://${profile.linkedin.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="up-social-btn" style={{ textDecoration: "none" }}>
                          <LuLinkedin size={13} /> LinkedIn
                        </a>
                      ) : (
                        <button className="up-social-btn" onClick={startEditProfile}><LuLinkedin size={13} /> LinkedIn</button>
                      )}
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
              { num: stats.views, label: "VIEWS", color: "#1e3a8a" },
              { num: stats.score, label: "PROFILE SCORE", color: "#4f46e5" },
              { num: stats.interviewing, label: "INTERVIEWING", color: "#1e3a8a" },
              { num: stats.shortlisted, label: "SHORTLISTED", color: "#1e3a8a" },
            ].map(s => (
              <div key={s.label} className="up-stat-card">
                <div className="up-stat-num" style={{ color: s.color }}>{s.num}</div>
                <div className="up-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="up-section-card">
            <div className="up-section-header">
              <span><LuStar size={14} style={{ marginRight: 5, verticalAlign: "middle", color: "#4f46e5" }} />ทักษะ</span>
              <button className="uf-filter-btn" onClick={() => setShowSkillModal(true)}><LuPlus size={12} /> เพิ่ม</button>
            </div>
            <div className="up-skills-wrap">
              {skillsLoading ? <span style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</span>
                : skills.length > 0 ? skills.map(sk => (
                  <span key={sk.id} className="up-skill-chip" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {sk.name}
                    <button onClick={() => handleRemoveSkill(sk)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "#9ca3af", fontSize: 14 }}>×</button>
                  </span>
                )) : <span style={{ color: "#9ca3af", fontSize: 13 }}>ยังไม่มีทักษะ กด "+ เพิ่ม" เพื่อเพิ่มทักษะแรก</span>
              }
            </div>
          </div>

          {/* Experience */}
          <div className="up-section-card">
            <div className="up-section-header">
              <span><LuBriefcase size={14} style={{ marginRight: 5, verticalAlign: "middle", color: "#4f46e5" }} />ประสบการณ์</span>
              <button className="uf-filter-btn" onClick={openAddExp}><LuPlus size={12} /> เพิ่ม</button>
            </div>
            {expLoading ? <p style={{ color: "#9ca3af", fontSize: 13 }}>กำลังโหลด...</p>
              : experiences.length === 0 ? <p style={{ color: "#9ca3af", fontSize: 13 }}>ยังไม่มีประสบการณ์ กด "+ เพิ่ม"</p>
                : experiences.map(e => (
                  <div key={e.id} className="up-exp-item" style={{ position: "relative" }}>
                    <div className="up-exp-dot">{e.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="up-exp-title">{e.title}</div>
                      <div className="up-exp-sub">{e.company}</div>
                      <div className="up-exp-date">{e.date}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => openEditExp(e)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: "#6b7280", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                        <LuPencil size={11} /> แก้ไข
                      </button>
                      <button onClick={() => deleteExp(e.id)} style={{ background: "none", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: "#ef4444", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                        <LuTrash2 size={11} /> ลบ
                      </button>
                    </div>
                  </div>
                ))
            }
          </div>

          {/* Tab Panel */}
          <div className="uf-panel">
            <div className="uf-tab-bar">
              {TABS.map(t => (
                <button key={t.key} className={`uf-tab${activeTab === t.key ? " active" : ""}`} onClick={() => handleTabClick(t.key)}>
                  {t.label}
                  {t.key === "resumes" && privateList.length > 0 && <span className="uf-tab-badge">{privateList.length}</span>}
                  {t.key === "jobs" && publicList.length > 0 && <span className="uf-tab-badge" style={{ background: "#16a34a" }}>{publicList.length}</span>}
                </button>
              ))}
              <button className="uf-filter-btn" style={{ marginLeft: "auto", background: "#1e3a8a", color: "#fff", border: "none", whiteSpace: "nowrap" }} onClick={() => navigate("/resume")}>
                <LuPlus /> สร้างเรซูเม่
              </button>
            </div>

            {/* Private Resumes */}
            {activeTab === "resumes" && (
              <div className="uf-cards-grid">
                {privateList.length > 0 ? (
                  <>
                    {privateList.map(p => (
                      <div key={p.id} className="uf-resume-card" onClick={() => navigate(`/view-resume/${p.id}`)}>
                        <div className="uf-resume-header"><div className="uf-resume-icon"><LuFileText /></div></div>
                        <div className="uf-resume-title">{p.title}</div>
                        <div className="uf-resume-meta">
                          <span><LuBadgeCheck /> {userData?.fullName ?? "You"}</span>
                          {p.createdAt && <span style={{ color: "#9ca3af", fontSize: 11 }}>🔒 {new Date(p.createdAt).toLocaleDateString("th-TH")}</span>}
                        </div>
                        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 1 }} onClick={e => e.stopPropagation()}>
                          <button className="uf-action-btn" onClick={e => { e.stopPropagation(); setActionMenuId(prev => prev === p.id ? null : p.id); }}>⋮</button>
                          {actionMenuId === p.id && (
                            <div className="uf-action-menu" onClick={e => e.stopPropagation()}>
                              <button className="uf-action-menu-item uf-action-menu-item--accent"
                                onClick={async () => {
                                  setActionMenuId(null);
                                  await fetch(`${API}/resumes/${p.id}/visibility`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ visibility: "public" }) });
                                  const res = await fetch(`${API}/resumes/my`, { headers: authHeader() });
                                  if (res.ok) { const d = await res.json(); setMyResumes(d.resumes ?? []); }
                                  setActiveTab("jobs");
                                }}>เปลี่ยนเป็น public</button>
                              <button className="uf-action-menu-item uf-action-menu-item--danger" onClick={() => { setActionMenuId(null); setDeleteConfirm({ id: p.id, type: "private" }); }}>ลบ Resume</button>
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
                    <div className="uf-empty-desc">กด <span style={{ color: "#1e3a8a", cursor: "pointer", fontWeight: 700 }} onClick={() => navigate("/resume")}>Create Resume</span> เพื่อสร้าง Resume แรกของคุณ</div>
                  </div>
                )}
              </div>
            )}

            {/* Public Resumes */}
            {activeTab === "jobs" && (
              <div className="uf-cards-grid">
                {publicList.length > 0 ? (
                  <>
                    {publicList.map(p => (
                      <div key={p.id} className="uf-resume-card" onClick={() => navigate(`/view-resume/${p.id}`)}>
                        <div className="uf-resume-header"><div className="uf-resume-icon"><LuFileText /></div></div>
                        <div className="uf-resume-title">{p.title}</div>
                        <div className="uf-resume-meta">
                          <span><LuBadgeCheck /> {userData?.fullName || "You"}</span>
                          {p.createdAt && <span style={{ color: "#16a34a", fontSize: 11 }}>🌐 {new Date(p.createdAt).toLocaleDateString("th-TH")}</span>}
                        </div>
                        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 1 }} onClick={e => e.stopPropagation()}>
                          <button className="uf-action-btn" onClick={e => { e.stopPropagation(); setActionMenuId(prev => prev === p.id ? null : p.id); }}>⋮</button>
                          {actionMenuId === p.id && (
                            <div className="uf-action-menu" onClick={e => e.stopPropagation()}>
                              <button className="uf-action-menu-item uf-action-menu-item--accent"
                                onClick={async () => {
                                  setActionMenuId(null);
                                  const res = await fetch(`${API}/resumes/${p.id}/visibility`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ visibility: "private" }) });
                                  if (res.ok) {
                                    const r2 = await fetch(`${API}/resumes/my`, { headers: authHeader() });
                                    if (r2.ok) { const d = await r2.json(); setMyResumes(d.resumes ?? []); }
                                    setActiveTab("resumes");
                                  }
                                }}>เปลี่ยนเป็น private</button>
                              <button className="uf-action-menu-item uf-action-menu-item--danger" onClick={() => { setActionMenuId(null); setDeleteConfirm({ id: p.id, type: "public" }); }}>ลบ Resume</button>
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
            {activeTab === "saved" && (
              <div ref={savedSectionRef}>
                <div style={{ display: "flex", gap: 8, padding: "12px 16px 0" }}>
                  {[
                    { key: "jobs", label: "งานที่บันทึก", count: savedJobs.length },
                    { key: "resumes", label: "Resume ที่บันทึก", count: savedResumes.length },
                  ].map(st => (
                    <button key={st.key} onClick={() => setSavedSubTab(st.key)}
                      style={{
                        padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
                        background: savedSubTab === st.key ? "#1e3a8a" : "#f1f5f9",
                        color: savedSubTab === st.key ? "#fff" : "#64748b",
                        display: "flex", alignItems: "center", gap: 6, transition: "all .15s",
                      }}>
                      {st.label}
                      {st.count > 0 && (
                        <span style={{ background: savedSubTab === st.key ? "rgba(255,255,255,.25)" : "#e2e8f0", color: savedSubTab === st.key ? "#fff" : "#64748b", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{st.count}</span>
                      )}
                    </button>
                  ))}
                </div>
                {savedLoading ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>กำลังโหลด...</div>
                ) : (
                  <>
                    {savedSubTab === "jobs" && (
                      <div className="uf-cards-grid">
                        {savedJobs.length === 0 ? (
                          <div className="uf-empty"><div className="uf-empty-icon">🔖</div><div className="uf-empty-title">ยังไม่มีงานที่บันทึกไว้</div><div className="uf-empty-desc">กดปุ่ม Bookmark บนหน้า Feed เพื่อบันทึกงานที่สนใจ</div></div>
                        ) : savedJobs.map(item => (
                          <div key={item.saved_id} className="uf-resume-card" onClick={() => navigate(`/jobs/${item.job_id}`)}>
                            <div className="uf-resume-header"><div className="uf-resume-icon"><LuBriefcase /></div></div>
                            <div className="uf-resume-title" style={{ fontSize: 14 }}>{item.title}</div>
                            <div className="uf-resume-meta">
                              <span style={{ color: "#64748b" }}>🏢 {item.company_name || item.hr_name}</span>
                              {item.location && <span style={{ color: "#94a3b8", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}><LuMapPin size={10} /> {item.location}</span>}
                            </div>
                            {item.salary && <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>💰 {item.salary}</div>}
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>บันทึกเมื่อ {new Date(item.saved_at || item.created_at).toLocaleDateString("th-TH")}</div>
                            <button onClick={e => { e.stopPropagation(); handleUnsaveJob(item.job_id); }}
                              style={{ position: "absolute", top: 12, right: 12, background: "none", border: "1px solid #fca5a5", borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: "#ef4444", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                              <LuBookmark size={11} /> ยกเลิก
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {savedSubTab === "resumes" && (
                      <div className="uf-cards-grid">
                        {savedResumes.length === 0 ? (
                          <div className="uf-empty"><div className="uf-empty-icon">📄</div><div className="uf-empty-title">ยังไม่มี Resume ที่บันทึกไว้</div><div className="uf-empty-desc">กดปุ่ม Bookmark บน Resume ของผู้อื่นเพื่อบันทึกไว้ดูทีหลัง</div></div>
                        ) : savedResumes.map(item => (
                          <div key={item.saved_id} className="uf-resume-card" onClick={() => navigate(`/view-resume/${item.resume_id}`)}>
                            <div className="uf-resume-header"><div className="uf-resume-icon"><LuFileText /></div></div>
                            <div className="uf-resume-title" style={{ fontSize: 14 }}>{item.resume_title}</div>
                            <div className="uf-resume-meta">
                              <span><LuBadgeCheck /> {item.owner_name}</span>
                              {item.owner_location && <span style={{ color: "#94a3b8", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}><LuMapPin size={10} /> {item.owner_location}</span>}
                            </div>
                            {item.owner_bio && <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.owner_bio}</div>}
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>บันทึกเมื่อ {new Date(item.saved_at).toLocaleDateString("th-TH")}</div>
                            <button onClick={e => { e.stopPropagation(); handleUnsaveResume(item.resume_id); }}
                              style={{ position: "absolute", top: 12, right: 12, background: "none", border: "1px solid #fca5a5", borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: "#ef4444", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                              <LuBookmark size={11} /> ยกเลิก
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes up-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}