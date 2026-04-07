import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useResumes } from "./ResumeContext";
import {
  LuSearch, LuBell, LuFilter, LuFileText, LuBriefcase,
  LuPanelLeft, LuPlus, LuBookmark, LuLayoutDashboard,
  LuBadgeCheck, LuClock,
} from "react-icons/lu";
import { FiHome } from "react-icons/fi";
import "../styles/UsersFeed.css";

const TABS = [
  { key: "resume", label: "Public Resumes", icon: <LuFileText /> },
  { key: "job",    label: "Job Vacancies",  icon: <LuBriefcase /> },
];

export default function UsersFeed() {
  const [activeTab, setActiveTab]       = useState("resume");
  const [userData, setUserData]         = useState(null);
  const [searchTerm, setSearchTerm]     = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const sidebarRef = useRef(null);
  const navigate   = useNavigate();
  const { publishedResumes } = useResumes();

  const filteredResumes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return publishedResumes.filter((r) => {
      if (!q) return true;
      return (r.title?.toLowerCase() || "").includes(q) ||
             (r.owner?.toLowerCase() || "").includes(q);
    });
  }, [publishedResumes, searchTerm]);

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

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".uf-user-area")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const initial   = userData?.username?.[0]?.toUpperCase() ?? "U";
  const firstName = userData?.fullName?.split(" ")[0] ?? "there";

  const toggleSidebar = () => {
    if (sidebarOpen && sidebarRef.current) sidebarRef.current.style.width = "";
    setSidebarOpen((v) => !v);
  };

  return (
    <div className="uf-page">

      {/* NAV */}
      <nav className="uf-nav">
        <div className="uf-nav-left">
          <button className="uf-toggle-btn" onClick={toggleSidebar} title="Toggle sidebar">
            <LuPanelLeft />
          </button>
          <div className="uf-logo">Per<em>File</em><span className="uf-logo-badge">Seeker</span></div>
          <div className="uf-search">
            <LuSearch />
            <input
              type="text"
              placeholder="ค้นหา Username หรือ Company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <span>{userData?.fullName ?? "Loading..."}</span>
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

      {/* BODY */}
      <div className="uf-body">

        {/* SIDEBAR */}
        <aside ref={sidebarRef} className={`uf-sidebar${sidebarOpen ? "" : " closed"}`}>
          <div className="uf-resize-handle">
            <div className="uf-resize-bar" />
          </div>
          <button className="uf-create-btn" onClick={() => navigate("/resume")}>
            <LuPlus /> Create Resume
          </button>
          <Link to="/feed" className="uf-menu-item active">
            <LuLayoutDashboard /> Feed
          </Link>
          <button className="uf-menu-item" onClick={() => navigate("/profile")}>
            <FiHome /> Profile
          </button>
          <button className="uf-menu-item" onClick={() => navigate("/saved")}>
            <LuBookmark /> Saved
          </button>
          <div className="uf-section-label">Private Profile</div>
          <div className="uf-sub-item">Development 1</div>
          <div className="uf-sub-item">Tutor 1</div>
          <div className="uf-section-label">Public Profile</div>
          <div className="uf-sub-item">Ux/Ui 2</div>
        </aside>

        {/* MAIN */}
        <main className="uf-main">

          {/* Header + Tab Bar */}
          <div className="uf-header-card">
            <div className="uf-welcome">
              <h1>hi, {firstName} 👋</h1>
              <p>Explore public resumes and job opportunities</p>
            </div>
            <div className="uf-tab-bar">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`uf-tab${activeTab === t.key ? " active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.icon}
                  {t.label}
                  {t.key === "resume" && (
                    <span className="uf-tab-badge">{filteredResumes.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content panel */}
          <div className="uf-panel">
            <div className="uf-filter-bar">
              <button className="uf-filter-btn" onClick={() => setIsFilterOpen((v) => !v)}>
                <LuFilter /> กรอง
              </button>
              {activeTab === "resume" && (
                <button
                  className="uf-filter-btn"
                  style={{ marginLeft: "auto", background: "#1e3a8a", color: "#fff", border: "none" }}
                  onClick={() => navigate("/resume")}
                >
                  <LuPlus /> สร้างเรซูเม่
                </button>
              )}
            </div>

            {isFilterOpen && (
              <div className="uf-filter-panel">
                <p>ตัวอย่างตั้งค่า filter:</p>
                <button
                  className="uf-filter-option"
                  onClick={() => { setSearchTerm(""); setIsFilterOpen(false); }}
                >ล้าง filter</button>
              </div>
            )}

            <div className="uf-cards-grid">
              {activeTab === "resume" ? (
                filteredResumes.length > 0 ? (
                  filteredResumes.map((resume) => (
                    <ResumeCard
                      key={resume.id}
                      resume={resume}
                      onClick={() => navigate(`/view-resume/${resume.id}`)}
                    />
                  ))
                ) : (
                  <div className="uf-empty">
                    <div className="uf-empty-icon">📄</div>
                    <div className="uf-empty-title">ยังไม่มีเรซูเม่สาธารณะ</div>
                    <div className="uf-empty-desc">
                      กด{" "}
                      <span
                        style={{ color: "#1e3a8a", cursor: "pointer", fontWeight: 700 }}
                        onClick={() => navigate("/resume")}
                      >Create Resume</span>{" "}
                      เพื่อสร้างและเผยแพร่เรซูเม่ของคุณ
                    </div>
                  </div>
                )
              ) : (
                [...Array(12)].map((_, i) => (
                  <div key={i} className="uf-skeleton-card">
                    <div className="uf-skeleton-thumb" />
                    <div className="uf-skeleton-line" />
                    <div className="uf-skeleton-line short" />
                  </div>
                ))
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

function ResumeCard({ resume, onClick }) {
  return (
    <div className="uf-resume-card" onClick={onClick}>
      <div className="uf-resume-header">
        <div className="uf-resume-icon"><LuFileText /></div>
        <span className="uf-resume-badge">Public</span>
      </div>
      <div className="uf-resume-title">{resume.title}</div>
      <div className="uf-resume-meta">
        {resume.owner       && <span><LuBadgeCheck /> {resume.owner}</span>}
        {resume.publishedAt && <span><LuClock /> {resume.publishedAt}</span>}
      </div>
    </div>
  );
}