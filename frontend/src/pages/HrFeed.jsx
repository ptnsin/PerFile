import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuSearch, LuBell, LuFilter, LuBriefcase,
  LuPanelLeft, LuPlus, LuBookmark, LuLayoutDashboard, LuUsers,
  LuMapPin, LuBadgeCheck, LuEllipsis, LuBadgeMinus, LuTrash2
} from "react-icons/lu";
import PostJobModal from "./PostJobModal";
import JobDetailModal from "./JobDetailModal";
import "../styles/HRFeed.css";


export default function HrFeed() {
  const [activeTab, setActiveTab]     = useState("candidates");
  const [userData, setUserData]       = useState(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [jobs, setJobs]               = useState([]);
  const [selectedJob, setSelectedJob] = useState(null); // ← job detail modal
  const sidebarRef = useRef(null);
  const navigate   = useNavigate();

  const STATS = [
    { num: jobs.length.toString(), label: "ตำแหน่งเปิดรับ" },
    { num: "340", label: "ผู้สมัครทั้งหมด" },
    { num: "28", label: "สัมภาษณ์เดือนนี้" },
    { num: "94%", label: "อัตราตอบรับ" },
  ];

  const TABS = [
    { key: "candidates", label: "Candidates", icon: <LuUsers />, count: 340 },
    { key: "jobs",       label: "My Job Posts", icon: <LuBriefcase /> },   // count is dynamic
  ];

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

  /* ── Fetch Jobs from DB ── */
useEffect(() => {
  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // เรียกไปที่ Route ใน hrRouter.js ที่เราทำไว้
      const res = await fetch("http://localhost:3000/hr/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // ถ้า Backend ส่งมาเป็น { jobs: [...] } ให้ใช้ data.jobs
        setJobs(data.jobs || data); 
      }
    } catch (err) {
      console.error("Fetch jobs error:", err);
    }
  };

  fetchJobs();
}, []);

const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/hr/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // อัปเดตข้อมูลใน State ทันทีเพื่อให้หน้าจอเปลี่ยนตามโดยไม่ต้องรีเฟรช
        setJobs((prevJobs) =>
          prevJobs.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
        );
      } else {
        const errorData = await res.json();
        alert(errorData.message || "อัปเดตไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

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

  /* ── Refresh jobs after posting ── */
  const handleJobPosted = () => {
    // แทนที่จะเซ็ต State เอง ให้เรียกฟังก์ชันดึงข้อมูลใหม่ (หรือรีเฟรชหน้า)
    window.location.reload(); 
    // หรือถ้าเขียนฟังก์ชัน fetchJobs แยกไว้ ก็เรียกใช้ฟังก์ชันนั้นแทนครับ
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

      {/* ─── JOB DETAIL MODAL ─── */}
      <JobDetailModal
        open={!!selectedJob}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
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
          <button className="hrf-menu-item" onClick={() => navigate("/hr-profile", { state: { scrollTo: "saved" } })}>
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
                jobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onClick={() => setSelectedJob(job)} 
                    onUpdateStatus={handleUpdateStatus} // ส่งฟังก์ชันไปที่นี่
                  />
                ))
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

/* ── Job Card ── */
function JobCard({ job, onClick, onUpdateStatus }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation(); // กันไม่ให้ไปเปิด Modal รายละเอียดงาน
    setMenuOpen(!menuOpen);
  };

  const deleteJob = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (window.confirm(`ยืนยันการลบ "${job.title}"?`)) {
      console.log(`Delete: ${job.id}`);
      // ใส่ logic ลบงานตรงนี้ (เช่น fetch ไปที่ backend)
    }
  };


  return (
    <div
      className="hrf-job-card"
      onClick={onClick}
      style={{
        cursor: "pointer",
        position: "relative",
        overflow: "visible", // สำคัญมาก เพื่อให้เมนูลอยออกมาได้
      }}
    >
      {/* 2. ตัวช่วยปิดเมนู (Backdrop) เมื่อคลิกที่อื่น */}
      {menuOpen && (
        <div 
          onClick={(e) => {
            e.stopPropagation(); 
            setMenuOpen(false);
          }}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 90,
            background: "transparent"
          }}
        />
      )}

      <div className="hrf-job-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div className="hrf-job-icon"><LuBriefcase /></div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative", zIndex: 100 }}>
          <span className="hrf-job-type">{job.job_type || "ไม่ระบุ"}</span>
          
          <button
            onClick={handleMenuClick}
            style={{
              background: menuOpen ? "#f1f5f9" : "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              color: "#64748b"
            }}
          >
            {/* ใช้ LuEllipsis ตามที่คุณ Import ไว้ด้านบน */}
            <LuEllipsis size={20} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "8px",
                background: "#fff",
                border: "1px solid #e4e4e7",
                borderRadius: "10px",
                width: "160px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                padding: "6px",
                zIndex: 101,
              }}
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  setMenuOpen(false);
                  // เรียกใช้ฟังก์ชันที่ส่งมาจากตัวแม่
                  onUpdateStatus(job.id, job.status === "เปิดรับสมัคร" ? "ปิดแล้ว" : "เปิดรับสมัคร");
                }} 
                style={dropdownItemStyle}
              >
                {/* ใช้ LuCheck ตามที่คุณ Import ไว้ด้านบน */}
                <LuBadgeMinus size={14} /> {job.status === "ปิดแล้ว" ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
              </button>
              <button onClick={deleteJob} style={{ ...dropdownItemStyle, color: "#ef4444" }}>
                <LuTrash2 size={14} /> ลบโพสงาน
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="hrf-job-title" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{job.title}</div>
      <div className="hrf-job-meta" style={{ marginTop: "8px" }}>
        {job.category && <span><LuBadgeCheck /> {job.category}</span>}
        {job.location  && <span><LuMapPin /> {job.location}</span>}
      </div>
    </div>
  );
}

// ย้ายมาไว้ข้างนอกฟังก์ชัน JobCard เพื่อให้เรียกใช้ได้ไม่ error
const dropdownItemStyle = {
  width: "100%",
  background: "none",
  border: "none",
  textAlign: "left",
  padding: "10px 12px",
  fontSize: "13px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  borderRadius: "6px",
  transition: "background 0.2s",
  fontFamily: "inherit",
  color: "#334155"
};