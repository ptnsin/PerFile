import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuSearch, LuBookmark, LuBell, LuPanelLeft,
  LuFileText, LuBriefcase, LuMapPin, LuLink, LuPencil,
  LuGithub, LuLinkedin, LuMail, LuStar, LuPlus, LuTrash2,
  LuLayoutDashboard, LuBadgeCheck,
} from "react-icons/lu";
import { FiHome, FiGrid } from "react-icons/fi";
import { useResumes } from "./ResumeContext";
import "../styles/Userprofile.css";

// ---- Mock Data ----
const SKILLS = ["React", "TypeScript", "Figma", "Node.js", "Tailwind CSS", "Python", "PostgreSQL", "Git"];
const EXP = [
  { icon: "💼", title: "Frontend Developer", company: "Tech Startup Co.", date: "2022 – ปัจจุบัน" },
  { icon: "🎨", title: "UX/UI Designer", company: "Creative Agency", date: "2020 – 2022" },
];

const TABS = [
  { key: "resumes", label: "Private Resumes" },
  { key: "jobs",   label: "Public Resumes"  },
  { key: "saved",  label: "Saved"           },
];

// ---- Component ----
export default function UserProfile() {
  const [activeTab, setActiveTab]       = useState("resumes");
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [userData, setUserData]         = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const sidebarRef    = useRef(null);
  const savedSectionRef = useRef(null);
  const navigate      = useNavigate();

  const { privateResumes, removePrivate } = useResumes();

  /* ── fetch current user ── */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setUserData((await res.json()).user);
        else localStorage.removeItem("token");
      } catch (err) {
        console.error("Fetch user error:", err);
      }
    })();
  }, []);

  /* ── close user dropdown on outside click ── */
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".uf-user-area")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ── resizable sidebar (same logic as UsersFeed) ── */
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const handle = sidebar.querySelector(".uf-resize-handle");
    if (!handle) return;
    let drag = false, startX = 0, startW = 0;
    const down = (e) => {
      drag = true; startX = e.clientX; startW = sidebar.offsetWidth;
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    };
    const move = (e) => {
      if (!drag) return;
      const w = Math.min(340, Math.max(80, startW + (e.clientX - startX)));
      sidebar.style.width = w + "px";
    };
    const up = () => {
      drag = false;
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    handle.addEventListener("mousedown", down);
    return () => handle.removeEventListener("mousedown", down);
  }, []);

  const initial   = userData?.username?.[0]?.toUpperCase() ?? "U";
  const firstName = userData?.fullName?.split(" ")[0] ?? "there";
  const fullName  = userData?.fullName ?? "Unknown";

  const toggleSidebar = () => {
    if (sidebarOpen && sidebarRef.current) sidebarRef.current.style.width = "";
    setSidebarOpen((v) => !v);
  };

  const handleTabClick = (key) => {
    setActiveTab(key);
    if (key === "saved" && savedSectionRef.current) {
      setTimeout(() => savedSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  const handleDelete = (id) => {
    removePrivate(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="uf-page">

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirmId !== null && (
        <div className="up-modal-overlay">
          <div className="up-modal">
            <div className="up-modal-icon">🗑️</div>
            <div className="up-modal-title">ลบ Resume นี้?</div>
            <div className="up-modal-desc">ไม่สามารถกู้คืนได้หลังจากลบแล้ว</div>
            <div className="up-modal-actions">
              <button className="up-modal-cancel" onClick={() => setDeleteConfirmId(null)}>ยกเลิก</button>
              <button className="up-modal-confirm" onClick={() => handleDelete(deleteConfirmId)}>ลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NAV (identical structure to UsersFeed) ── */}
      <nav className="uf-nav">
        <div className="uf-nav-left">
          <button className="uf-toggle-btn" onClick={toggleSidebar} title="Toggle sidebar">
            <LuPanelLeft />
          </button>
          <div className="uf-logo">Per<em>File</em></div>
          <div className="uf-search">
            <LuSearch />
            <input
              type="text"
              placeholder="ค้นหา Username หรือ Company..."
            />
          </div>
        </div>

        <div className="uf-nav-right">
          <button className="uf-icon-btn" title="Notifications"><LuBell /></button>
          <div className="uf-user-area" style={{ position: "relative" }}>
            <div className="uf-user-chip" onClick={() => setMenuOpen((v) => !v)}>
              <div className="uf-avatar">
                {userData?.avatar
                  ? <img src={userData.avatar} alt="avatar" crossOrigin="anonymous" />
                  : initial}
              </div>
              <span>{fullName}</span>
            </div>
            {menuOpen && (
              <div className="uf-dropdown">
                <button onClick={() => navigate("/profile")}>View Profile</button>
                <button
                  className="uf-logout"
                  onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}
                >Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div className="uf-body">

        {/* ── SIDEBAR (identical structure to UsersFeed) ── */}
        <aside ref={sidebarRef} className={`uf-sidebar${sidebarOpen ? "" : " closed"}`}>
          <div className="uf-resize-handle">
            <div className="uf-resize-bar" />
          </div>
          <button className="uf-create-btn" onClick={() => navigate("/resume")}>
            <LuPlus /> Create Resume
          </button>
          <Link to="/feed" className="uf-menu-item">
            <LuLayoutDashboard /> Feed
          </Link>
          <button className="uf-menu-item active">
            <FiHome /> Profile
          </button>
          <button className="uf-menu-item" onClick={() => handleTabClick("saved")}>
            <LuBookmark /> Saved
          </button>
          <div className="uf-section-label">Private Profile</div>
          <div className="uf-sub-item">Development 1</div>
          <div className="uf-sub-item">Tutor 1</div>
          <div className="uf-section-label">Public Profile</div>
          <div className="uf-sub-item">Ux/Ui 2</div>
        </aside>

        {/* ── MAIN ── */}
        <main className="uf-main">

          {/* Cover + Profile Info Card */}
          <div className="up-cover-card">
            <div className="up-cover">
              <div className="up-cover-pattern" />
              <button className="up-edit-cover-btn"><LuPencil size={11} /> แก้ไขปก</button>
              <div className="up-avatar-lg">{initial}</div>
            </div>
            <div className="up-profile-info">
              <div>
                <div className="up-profile-name">{fullName}</div>
                <div className="up-profile-handle">@unknown · PerFile</div>
                <div className="up-profile-bio">
                  Frontend Developer & UI/UX Designer ที่ชอบสร้างประสบการณ์ที่สวยงามและใช้งานได้จริง 🚀
                </div>
                <div className="up-profile-meta">
                  <span className="up-meta-item"><LuMapPin size={11} /> Bangkok, Thailand</span>
                  <a href="#" className="up-meta-link"><LuLink size={11} /> portfolio.dev</a>
                  <span className="up-meta-item"><LuMail size={11} /> unknown@email.com</span>
                </div>
                <div className="up-social-row">
                  <button className="up-social-btn"><LuGithub size={13} /> GitHub</button>
                  <button className="up-social-btn"><LuLinkedin size={13} /> LinkedIn</button>
                </div>
              </div>
              <button className="up-edit-profile-btn"><LuPencil size={12} /> แก้ไขโปรไฟล์</button>
            </div>
          </div>

          {/* Stats */}
          <div className="up-stats-row">
            {[
              { num: privateResumes.length.toString(), label: "RESUMES"     },
              { num: "287",                            label: "VIEWS"       },
              { num: "14",                             label: "SAVED"       },
              { num: "5",                              label: "JOBS POSTED" },
            ].map((s) => (
              <div key={s.label} className="up-stat-card">
                <div className="up-stat-num">{s.num}</div>
                <div className="up-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="up-section-card">
            <div className="up-section-header">
              <span><LuStar size={14} style={{ marginRight: 5, verticalAlign: "middle", color: "#4f46e5" }} />ทักษะ</span>
              <button className="uf-filter-btn"><LuPlus size={12} /> เพิ่ม</button>
            </div>
            <div className="up-skills-wrap">
              {SKILLS.map((sk) => <span key={sk} className="up-skill-chip">{sk}</span>)}
            </div>
          </div>

          {/* Experience */}
          <div className="up-section-card">
            <div className="up-section-header">
              <span><LuBriefcase size={14} style={{ marginRight: 5, verticalAlign: "middle", color: "#4f46e5" }} />ประสบการณ์</span>
              <button className="uf-filter-btn"><LuPlus size={12} /> เพิ่ม</button>
            </div>
            {EXP.map((e, i) => (
              <div key={i} className="up-exp-item">
                <div className="up-exp-dot">{e.icon}</div>
                <div>
                  <div className="up-exp-title">{e.title}</div>
                  <div className="up-exp-sub">{e.company}</div>
                  <div className="up-exp-date">{e.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Panel (same uf-panel structure as UsersFeed) */}
          <div className="uf-panel">

            {/* Tab Bar */}
            <div className="uf-tab-bar">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`uf-tab${activeTab === t.key ? " active" : ""}`}
                  onClick={() => handleTabClick(t.key)}
                >
                  {t.label}
                  {t.key === "resumes" && privateResumes.length > 0 && (
                    <span className="uf-tab-badge">{privateResumes.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Filter Bar */}
            <div className="uf-filter-bar">
              {activeTab === "resumes" && (
                <button
                  className="uf-filter-btn"
                  style={{ marginLeft: "auto", background: "#1e3a8a", color: "#fff", border: "none" }}
                  onClick={() => navigate("/resume")}
                >
                  <LuPlus /> สร้างเรซูเม่
                </button>
              )}
            </div>

            {/* ── Private Resumes ── */}
            {activeTab === "resumes" && (
              <div className="uf-cards-grid">
                {privateResumes.length > 0 ? (
                  <>
                    {privateResumes.map((p, i) => (
                      <div
                        key={p.id}
                        className="uf-resume-card"
                        onClick={() => navigate(`/view-resume/${p.id}`)}
                      >
                        <div className="uf-resume-header">
                          <div className="uf-resume-icon"><LuFileText /></div>
                          <span className="up-badge-private">Private</span>
                        </div>
                        <div className="uf-resume-title">{p.title}</div>
                        <div className="uf-resume-meta">
                          <span><LuBadgeCheck /> {p.owner ?? "You"}</span>
                          {p.createdAt && <span style={{ color: "#9ca3af", fontSize: 11 }}>🔒 {p.createdAt}</span>}
                        </div>
                        <button
                          className="up-del-btn"
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(p.id); }}
                        >
                          <LuTrash2 size={12} /> ลบ
                        </button>
                      </div>
                    ))}
                    <div className="uf-resume-card up-add-card" onClick={() => navigate("/resume")}>
                      <LuPlus size={26} />
                      <span>เพิ่ม Resume</span>
                    </div>
                  </>
                ) : (
                  <div className="uf-empty">
                    <div className="uf-empty-icon">📄</div>
                    <div className="uf-empty-title">ยังไม่มี Resume ที่บันทึกไว้</div>
                    <div className="uf-empty-desc">
                      กด{" "}
                      <span
                        style={{ color: "#1e3a8a", cursor: "pointer", fontWeight: 700 }}
                        onClick={() => navigate("/resume")}
                      >Create Resume</span>{" "}
                      เพื่อสร้าง Resume แรกของคุณ
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Public Resumes ── */}
            {activeTab === "jobs" && (
              <div className="uf-cards-grid">
                <div className="uf-empty">
                  <div className="uf-empty-icon">💼</div>
                  <div className="uf-empty-title">ยังไม่มีตำแหน่งงานที่โพสต์ไว้</div>
                </div>
              </div>
            )}

            {/* ── Saved ── */}
            {activeTab === "saved" && (
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