import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuSearch, LuBell, LuFilter, LuBriefcase,
  LuPanelLeft, LuPlus, LuBookmark, LuLayoutDashboard, LuUsers,
  LuMapPin, LuClock, LuBadgeCheck,
} from "react-icons/lu";
import PostJobModal from "./PostJobModal";         // ← import modal
import "../styles/HRFeed.css";

const STATS = [
  { num: "12", label: "ตำแหน่งเปิดรับ" },
  { num: "340", label: "ผู้สมัครทั้งหมด" },
  { num: "28", label: "สัมภาษณ์เดือนนี้" },
  { num: "94%", label: "อัตราตอบรับ" },
];

const TABS = [
  { key: "candidates", label: "Candidates", icon: <LuUsers />, count: 340 },
  { key: "jobs",       label: "My Job Posts", icon: <LuBriefcase /> },   // count is dynamic
];

export default function HrFeed() {
  const [activeTab, setActiveTab]     = useState("candidates");
  const [userData, setUserData]       = useState(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [jobs, setJobs]               = useState([]);          // ← posted jobs list
  const sidebarRef = useRef(null);
  const navigate   = useNavigate();

  /* ── Resizable sidebar ── */
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const handle = sidebar.querySelector(".hrf-resize-handle");
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

  /* ── Fetch HR user ── */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/hr-login");
        const res = await fetch("http://localhost:3000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setUserData((await res.json()).user);
        else navigate("/hr-login");
      } catch (err) {
        console.error(err);
      }
    })();
  }, [navigate]);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".hrf-user-area")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const initial   = userData?.username?.[0]?.toUpperCase() ?? "H";
  const firstName = userData?.fullName?.split(" ")[0] ?? "HR";

  const toggleSidebar = () => {
    if (sidebarOpen && sidebarRef.current) sidebarRef.current.style.width = "";
    setSidebarOpen((v) => !v);
  };

  /* ── Add job from modal ── */
  const handleJobPosted = (job) => {
    setJobs((prev) => [{ id: Date.now(), time: "เพิ่งโพสต์", ...job }, ...prev]);
    setActiveTab("jobs");   // switch to jobs tab automatically
  };

  /* ── Open modal from sidebar OR nav button ── */
  const openModal = () => setModalOpen(true);

  return (
    <div className="hrf-page">

      {/* ─── MODAL ─── */}
      <PostJobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleJobPosted}
      />

      {/* ─── NAV ─── */}
      <nav className="hrf-nav">
        <div className="hrf-nav-left">
          <button className="hrf-toggle-btn" onClick={toggleSidebar} title="Toggle sidebar">
            <LuPanelLeft />
          </button>

          <div className="hrf-logo">
            Per<em>File</em>
            <span className="hrf-logo-badge">HR</span>
          </div>

          <div className="hrf-search">
            <LuSearch />
            <input type="text" placeholder="ค้นหาแคนดิเดต หรือเรซูเม่..." />
          </div>
        </div>

        <div className="hrf-nav-right">
          <button className="hrf-icon-btn" title="Notifications"><LuBell /></button>

          <div className="hrf-user-area" style={{ position: "relative" }}>
            <div className="hrf-user-chip" onClick={() => setMenuOpen((v) => !v)}>
              <div className="hrf-avatar">
                {userData?.avatar
                  ? <img src={userData.avatar} alt="avatar" />
                  : initial}
              </div>
              <span>{userData?.fullName ?? "Loading..."}</span>
            </div>

            {menuOpen && (
              <div className="hrf-dropdown">
                <button onClick={() => navigate("/hr-profile")}>Company Profile</button>
                <button
                  className="hrf-logout"
                  onClick={() => { localStorage.clear(); navigate("/hr-login"); }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ─── BODY ─── */}
      <div className="hrf-body">

        {/* ─── SIDEBAR ─── */}
        <aside ref={sidebarRef} className={`hrf-sidebar${sidebarOpen ? "" : " closed"}`}>
          <div className="hrf-resize-handle">
            <div className="hrf-resize-bar" />
          </div>

          <button className="hrf-post-btn" onClick={openModal}>
            <LuPlus /> Post Job
          </button>

          <Link to="/hr-feed" className="hrf-menu-item active">
            <LuLayoutDashboard /> Dashboard
          </Link>
          <button className="hrf-menu-item" onClick={() => setActiveTab("jobs")}>
            <LuBriefcase /> My Jobs
          </button>
          <button className="hrf-menu-item">
            <LuBookmark /> Shortlisted
          </button>

          <div className="hrf-section-label">Recent Applicants</div>
          <div className="hrf-sub-item">Wasin Most</div>
          <div className="hrf-sub-item">Supaji Wongpa</div>
        </aside>

        {/* ─── MAIN ─── */}
        <main className="hrf-main">

          {/* Header + Tab Bar */}
          <div className="hrf-header-card">
            <div className="hrf-welcome">
              <h1>Hi, {firstName} 👋</h1>
              <p>Manage your company's recruitment and job posts</p>
            </div>

            <div className="hrf-tab-bar">
              {TABS.map((t) => {
                const count = t.key === "jobs" ? jobs.length : t.count;
                return (
                  <button
                    key={t.key}
                    className={`hrf-tab${activeTab === t.key ? " active" : ""}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.icon}
                    {t.label}
                    <span className="hrf-tab-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="hrf-stats">
            {STATS.map((s) => (
              <div key={s.label} className="hrf-stat-card">
                <div className="hrf-stat-num">{s.num}</div>
                <div className="hrf-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Content panel */}
          <div className="hrf-panel">
            <div className="hrf-filter-bar">
              <button className="hrf-filter-btn"><LuFilter /> กรอง</button>
              {activeTab === "jobs" && (
                <button
                  className="hrf-filter-btn"
                  style={{ marginLeft: "auto", background: "#1e3a8a", color: "#fff", border: "none" }}
                  onClick={openModal}
                >
                  <LuPlus /> โพสต์งานใหม่
                </button>
              )}
            </div>

            <div className="hrf-cards-grid">
              {activeTab === "candidates" ? (
                <div className="hrf-empty">
                  <div className="hrf-empty-icon">👥</div>
                  <div className="hrf-empty-title">ยังไม่มีผู้สมัคร</div>
                  <div className="hrf-empty-desc">รายการผู้สมัครงานจะแสดงที่นี่</div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="hrf-empty">
                  <div className="hrf-empty-icon">📋</div>
                  <div className="hrf-empty-title">ยังไม่มีประกาศงาน</div>
                  <div className="hrf-empty-desc">
                    กด{" "}
                    <span
                      style={{ color: "#1d4ed8", cursor: "pointer", fontWeight: 700 }}
                      onClick={openModal}
                    >
                      Post Job
                    </span>{" "}
                    เพื่อลงประกาศงานใหม่
                  </div>
                </div>
              ) : (
                jobs.map((job) => <JobCard key={job.id} job={job} />)
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

/* ── Job Card ── */
function JobCard({ job }) {
  return (
    <div className="hrf-job-card">
      <div className="hrf-job-header">
        <div className="hrf-job-icon"><LuBriefcase /></div>
        <span className="hrf-job-type">{job.type}</span>
      </div>
      <div className="hrf-job-title">{job.title}</div>
      <div className="hrf-job-meta">
        {job.category && <span><LuBadgeCheck /> {job.category}</span>}
        {job.location  && <span><LuMapPin /> {job.location}</span>}
        {(job.salaryMin || job.salaryMax) && (
          <span>฿ {job.salaryMin || "?"} – {job.salaryMax || "?"}</span>
        )}
      </div>
      {job.time && <div className="hrf-job-time">{job.time}</div>}
    </div>
  );
}
