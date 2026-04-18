import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuSearch, LuBell, LuFilter, LuBriefcase,
  LuPanelLeft, LuPlus, LuBookmark, LuLayoutDashboard, LuUsers,
  LuMapPin, LuBadgeCheck, LuEllipsisVertical, LuBadgeMinus, LuTrash2, LuBookmarkCheck
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
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
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

/* ── Fetch Saved Jobs ── */
useEffect(() => {
  const fetchSaved = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:3000/hr/saved-jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const ids = (data.savedJobs || data.saved_jobs || [])
          .map(j => String(j.id ?? j.jobId ?? j));
        setSavedJobIds(ids);
      }
    } catch (err) {
      console.error("Fetch saved jobs error:", err);
    }
  };
  fetchSaved();
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

  /* ── Save / Unsave job then navigate to profile saved section ── */
  const handleSaveJob = async (jobId) => {
    const sid = String(jobId);
    const isSaved = savedJobIds.includes(sid);
    // optimistic UI
    setSavedJobIds(prev => isSaved ? prev.filter(id => id !== sid) : [...prev, sid]);
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3000/hr/saved-jobs/${jobId}`, {
        method: isSaved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
      // rollback ถ้า API fail
      setSavedJobIds(prev => isSaved ? [...prev, sid] : prev.filter(id => id !== sid));
    }
    if (!isSaved) {
      // navigate ไป HR Profile แล้ว scroll ไปที่ saved section
      navigate("/hr-profile", { state: { scrollTo: "saved" } });
    }
  };

  /* ── Navigate to HR Profile applicants filtered by job ── */
  const handleViewApplicants = (jobId) => {
    navigate("/hr-profile", { state: { scrollTo: "applicants", filterJobId: jobId } });
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
        onViewApplicants={(job) => { setSelectedJob(null); handleViewApplicants(job.id); }}
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

          <button
            className={`hrf-menu-item${activeTab === "candidates" ? " active" : ""}`}
            onClick={() => { setActiveTab("candidates"); }}
          >
            <LuLayoutDashboard /> Dashboard
          </button>
          <button
            className={`hrf-menu-item${activeTab === "jobs" ? " active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
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
                    onUpdateStatus={handleUpdateStatus}
                    isSaved={savedJobIds.includes(String(job.id))}
                    onSave={handleSaveJob}
                    onViewApplicants={handleViewApplicants}
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
function JobCard({ job, onClick, onUpdateStatus, isSaved, onSave, onViewApplicants }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const deleteJob = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!window.confirm(`ยืนยันการลบ "${job.title}"?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/hr/jobs/${job.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || "ลบไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Delete job error:", err);
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  return (
    <div
      className="hrf-job-card"
      onClick={onClick}
      style={{ cursor: "pointer", position: "relative", overflow: "visible" }}
    >
      {menuOpen && (
        <div 
          onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90, background: "transparent" }}
        />
      )}

      {/* ── 3-dot button — absolute top-right ── */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 100 }}>
        <button
          onClick={handleMenuClick}
          style={{
            width: 30, height: 30,
            background: menuOpen ? "#e0e7ff" : "rgba(255,255,255,0.9)",
            border: "1.5px solid " + (menuOpen ? "#a5b4fc" : "#e4e4e7"),
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: menuOpen ? "#4f46e5" : "#64748b",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            transition: "all 0.15s",
          }}
        >
          <LuEllipsisVertical size={16} />
        </button>

        {menuOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: "#fff", border: "1px solid #e4e4e7", borderRadius: "12px",
            width: "185px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: "6px", zIndex: 101,
          }}>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onClick?.(); }} style={dropdownItemStyle}>
              <LuBriefcase size={14} /> ดูรายละเอียด
            </button>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onViewApplicants?.(job.id); }} style={dropdownItemStyle}>
              <LuUsers size={14} /> ดูผู้สมัคร
            </button>
            <div style={{ height: 1, background: "#f4f4f5", margin: "4px 0" }} />
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onSave?.(job.id); }}
              style={{ ...dropdownItemStyle, color: isSaved ? "#1d4ed8" : "#334155", background: isSaved ? "#eff6ff" : "none" }}
            >
              {isSaved ? <LuBookmarkCheck size={14} /> : <LuBookmark size={14} />}
              {isSaved ? "Saved แล้ว" : "Save งานนี้"}
            </button>
            <div style={{ height: 1, background: "#f4f4f5", margin: "4px 0" }} />
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onUpdateStatus(job.id, job.status === "เปิดรับสมัคร" ? "ปิดแล้ว" : "เปิดรับสมัคร"); }} style={dropdownItemStyle}>
              <LuBadgeMinus size={14} /> {job.status === "ปิดแล้ว" ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
            </button>
            <button onClick={deleteJob} style={{ ...dropdownItemStyle, color: "#ef4444" }}>
              <LuTrash2 size={14} /> ลบโพสงาน
            </button>
          </div>
        )}
      </div>

      {/* ── Header: icon + job type ── */}
      <div className="hrf-job-header" style={{ marginBottom: "12px", paddingRight: 28 }}>
        <div className="hrf-job-icon"><LuBriefcase /></div>
        <span className="hrf-job-type" style={{ marginTop: 8 }}>{job.job_type || "ไม่ระบุ"}</span>
      </div>

      <div className="hrf-job-title" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{job.title}</div>
      {job.company && (
        <div style={{
          fontSize: 12, color: "#6366f1", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 4, marginTop: 4,
        }}>
          <LuBadgeCheck size={12} /> {job.company}
        </div>
      )}
      <div className="hrf-job-meta" style={{ marginTop: "8px" }}>
        {job.category && <span><LuBadgeCheck /> {job.category}</span>}
        {job.location  && <span><LuMapPin /> {job.location}</span>}
      </div>

      {isSaved && (
        <div style={{
          position: "absolute", top: 10, left: 12,
          background: "#eff6ff", color: "#1d4ed8",
          borderRadius: 99, fontSize: 10, fontWeight: 700,
          padding: "2px 8px", display: "flex", alignItems: "center", gap: 4,
        }}>
          <LuBookmarkCheck size={10} /> Saved
        </div>
      )}
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