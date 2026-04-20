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
  const [activeTab, setActiveTab]         = useState("candidates");
  const [userData, setUserData]           = useState(null);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [modalOpen, setModalOpen]         = useState(false);
  const [jobs, setJobs]                   = useState([]);
  const [savedJobIds, setSavedJobIds]     = useState([]);
  const [selectedJob, setSelectedJob]     = useState(null);
  const [editJob, setEditJob]             = useState(null);
  const [publicResumes, setPublicResumes] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  // key = String(resumeId), value = shortlistId (เพื่อใช้ตอน unsave)
  const [applicants, setApplicants]         = useState([]);
  const [interviews, setInterviews]         = useState([]);
  const [savedResumeMap, setSavedResumeMap] = useState({});
  const sidebarRef = useRef(null);

  // Notification
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen]   = useState(false);
  const [filterType, setFilterType]   = useState("");   // job_type filter
  const [responseRate, setResponseRate] = useState(null); // null = loading

  // Notification
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const navigate   = useNavigate();

  const now = new Date();
  const interviewsThisMonth = interviews.filter(iv => {
    const d = new Date(iv.interview_date || iv.date || "");
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const STATS = [
    { num: jobs.filter(j => j.status !== "ปิดแล้ว").length.toString(), label: "ตำแหน่งเปิดรับ", icon: <LuBriefcase />, color: "#1d4ed8", bg: "#eff6ff" },
    { num: applicants.length.toString(),   label: "ผู้สมัครทั้งหมด", icon: <LuUsers />, color: "#15803d", bg: "#f0fdf4" },
    { num: interviewsThisMonth.toString(), label: "สัมภาษณ์เดือนนี้", icon: <LuBadgeCheck />, color: "#a855f7", bg: "#faf5ff" },
    { num: responseRate !== null ? `${responseRate}%` : "...", label: "อัตราตอบรับ", icon: <LuBadgeCheck />, color: "#f97316", bg: "#fff7ed" },
  ];

  const TABS = [
    { key: "candidates", label: " Public Resume", icon: <LuUsers />, count: publicResumes.length },
    { key: "jobs",       label: "JobPost", icon: <LuBriefcase />, count: jobs.filter(j => j.status !== "ปิดแล้ว").length.toString() },
  ];

  // Fetch HR Notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/hr/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications ?? []);
        }
      } catch (err) {
        console.error("Fetch HR notifications error:", err);
      }
    };
    fetchNotifs();
  }, []);

  useEffect(() => {
    const close = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

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
        const res = await fetch("http://localhost:3000/hr/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          setUserData({
            ...p,
            avatar: p.hr_profile?.profile_image || p.profile_image || p.avatar || null,
          });
        } else navigate("/hr-login");
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

/* ── Fetch Public Resumes (แท็บ candidates) ── */
useEffect(() => {
  const fetchPublicResumes = async () => {
    setResumeLoading(true);
    try {
      const res = await fetch("http://localhost:3000/resumes/public");
      if (res.ok) {
        const data = await res.json();
        setPublicResumes(data.resumes || []);
      }
    } catch (err) {
      console.error("Fetch public resumes error:", err);
    } finally {
      setResumeLoading(false);
    }
  };
  fetchPublicResumes();
}, []);

/* ── Fetch Shortlist (resume ที่ HR save ไว้แล้ว) ── */
useEffect(() => {
  const fetchShortlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:3000/hr/shortlist?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // สร้าง map: resumeId → shortlistId เพื่อเช็คว่า save แล้วหรือยัง
        const map = {};
        (data.shortlist || []).forEach(item => {
          map[String(item.resumeId)] = item.id;
        });
        setSavedResumeMap(map);
      }
    } catch (err) {
      console.error("Fetch saved resumes error:", err);
    }
  };
  fetchShortlist();
}, []);

/* ── Fetch Applicants ── */
useEffect(() => {
  const fetchApplicants = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:3000/hr/applicants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApplicants(data.applicants || []);
      }
    } catch (err) {
      console.error("Fetch applicants error:", err);
    }
  };
  fetchApplicants();
}, []);

/* ── Fetch Interviews ── */
useEffect(() => {
  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:3000/hr/interviews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInterviews(data.interviews || []);
      }
    } catch (err) {
      console.error("Fetch interviews error:", err);
    }
  };
  fetchInterviews();
}, []);

/* ── Fetch Stats (response rate) ── */
useEffect(() => {
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:3000/hr/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResponseRate(data.responseRate ?? 0);
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
      setResponseRate(0);
    }
  };
  fetchStats();
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

  /* ── Refresh jobs after posting (no full reload) ── */
  const handleJobPosted = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:3000/hr/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || data);
      }
    } catch (err) {
      console.error("Refetch jobs error:", err);
    }
  };

  /* ── Save / Unsave Resume (Shortlist) ── */
  const handleSaveResume = async (resumeId) => {
    const key = String(resumeId);
    const existingShortlistId = savedResumeMap[key];
    const isSaved = !!existingShortlistId;
    const token = localStorage.getItem("token");

    if (isSaved) {
      // Optimistic remove
      setSavedResumeMap(prev => { const n = { ...prev }; delete n[key]; return n; });
      try {
        await fetch(`http://localhost:3000/hr/shortlist/${existingShortlistId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error(err);
        // Rollback
        setSavedResumeMap(prev => ({ ...prev, [key]: existingShortlistId }));
      }
    } else {
      // Optimistic add (ใช้ "pending" ชั่วคราวก่อนได้ id จริง)
      setSavedResumeMap(prev => ({ ...prev, [key]: "pending" }));
      try {
        const res = await fetch("http://localhost:3000/hr/shortlist", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ resumeId }),
        });
        if (res.ok) {
          const data = await res.json();
          // อัปเดต id จริงจาก server (ถ้า API ส่ง id กลับมา)
          const realId = data.id || data.shortlistId || "saved";
          setSavedResumeMap(prev => ({ ...prev, [key]: realId }));
        } else if (res.status === 409) {
          // มีอยู่แล้วใน shortlist — fetch ใหม่เพื่อเอา id ที่ถูกต้อง
          const refetch = await fetch("http://localhost:3000/hr/shortlist?limit=100", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (refetch.ok) {
            const d = await refetch.json();
            const map = {};
            (d.shortlist || []).forEach(item => { map[String(item.resumeId)] = item.id; });
            setSavedResumeMap(map);
          }
        } else {
          // Rollback
          setSavedResumeMap(prev => { const n = { ...prev }; delete n[key]; return n; });
        }
      } catch (err) {
        console.error(err);
        setSavedResumeMap(prev => { const n = { ...prev }; delete n[key]; return n; });
      }
    }
  };

  /* ── Save / Unsave job ── */
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
    // ไม่ navigate ออกจากหน้า — ให้ user กด Saved ใน sidebar เองถ้าอยากไปดู
  };

  /* ── Navigate to HR Profile applicants filtered by job ── */
  const handleViewApplicants = (jobId) => {
    navigate("/hr-profile", { state: { scrollTo: "applicants", filterJobId: jobId } });
  };

  /* ── Open modal from sidebar OR nav button ── */
  const openModal = () => setModalOpen(true);

  return (
    <div className="hrf-page">

      {/* ─── MODAL (Post new) ─── */}
      <PostJobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleJobPosted}
      />

      {/* ─── MODAL (Edit) ─── */}
      <PostJobModal
        open={!!editJob}
        initialData={editJob}
        editMode={true}
        onClose={() => setEditJob(null)}
        onSubmit={handleJobPosted}
      />

      {/* ─── JOB DETAIL MODAL ─── */}
      <JobDetailModal
        open={!!selectedJob}
        job={selectedJob}
        applicantCount={selectedJob ? applicants.filter(
          (a) => String(a.job_id ?? a.jobId ?? a.jobID) === String(selectedJob.id)
        ).length : 0}
        onClose={() => setSelectedJob(null)}
        onEdit={(job) => { setSelectedJob(null); setEditJob(job); }}
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
            <input
              type="text"
              placeholder="ค้นหาแคนดิเดต หรือเรซูเม่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="hrf-nav-right">
          <div ref={notifRef} style={{ position: "relative" }}>
            <button className="hrf-icon-btn" title="Notifications" onClick={() => setNotifOpen(v => !v)} style={{ position: "relative" }}>
              <LuBell />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "1.5px solid #fff" }} />
              )}
            </button>
            {notifOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 320, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.13)", border: "1px solid #e5e7eb", zIndex: 999, overflow: "hidden" }}>
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
                          await fetch("http://localhost:3000/hr/notifications/read-all", { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
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
                          await fetch(`http://localhost:3000/hr/notifications/${n.id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
                        }
                      }}
                      style={{ padding: "10px 16px", borderBottom: "1px solid #f9fafb", background: n.is_read ? "#fff" : "#f0f7ff", display: "flex", gap: 10, alignItems: "flex-start", cursor: n.is_read ? "default" : "pointer" }}>
                      <div style={{ fontSize: 18, flexShrink: 0 }}>
                        {n.type === "new_application" ? "📋" : n.type === "NEW_RESUME" ? "📄" : "🔔"}
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
                      await fetch("http://localhost:3000/hr/notifications/clear", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                      setNotifications([]);
                    }} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      ลบทั้งหมด
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hrf-user-area" style={{ position: "relative" }}>
            <div className="hrf-user-chip" onClick={() => setMenuOpen((v) => !v)}>
              <div className="hrf-avatar">
                {userData?.avatar
                  ? <img
                      src={userData.avatar.startsWith("http") ? userData.avatar : `http://localhost:3000${userData.avatar}`}
                      alt="avatar"
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                    />
                  : initial}
              </div>
              <span>{userData?.fullName ?? userData?.username ?? "Loading..."}</span>
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
            <LuBookmark /> Saved
          </button>

          <div className="hrf-section-label">Recent Applicants</div>
          {[...applicants]
            .sort((a, b) => new Date(b.applied_at || b.createdAt || 0) - new Date(a.applied_at || a.createdAt || 0))
            .slice(0, 5)
            .map((ap, i) => (
              <div key={ap.id ?? i} className="hrf-sub-item">
                {ap.fullName || ap.full_name || ap.users?.fullName || ap.name || "ไม่ระบุชื่อ"}
              </div>
            ))
          }
          {applicants.length === 0 && (
            <div className="hrf-sub-item" style={{ color: "#9ca3af", fontSize: 12 }}>ยังไม่มีผู้สมัคร</div>
          )}
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
              {TABS.map((t) => (
                  <button
                    key={t.key}
                    className={`hrf-tab${activeTab === t.key ? " active" : ""}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.icon}
                    {t.label}
                    <span className="hrf-tab-badge">{t.count}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Stats */}
          <div className="hrf-stats">
            {STATS.map((s) => (
              <div key={s.label} className="hrf-stat-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: s.bg, color: s.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>
                  {s.icon}
                </div>
                <div>
                  <div className="hrf-stat-num" style={{ color: s.color }}>{s.num}</div>
                  <div className="hrf-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Content panel */}
          <div className="hrf-panel">
            <div className="hrf-filter-bar" style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <button
                  className="hrf-filter-btn"
                  onClick={() => setFilterOpen(v => !v)}
                  style={filterType ? { background: "#eff6ff", color: "#1d4ed8", borderColor: "#93c5fd" } : {}}
                >
                  <LuFilter /> กรอง {filterType ? `· ${filterType}` : ""}
                </button>
                {filterOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0,
                    background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 8, zIndex: 200,
                    minWidth: 180,
                  }}>
                    {["", "Full-time", "Part-time", "Freelance", "Internship"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setFilterType(opt); setFilterOpen(false); }}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          padding: "9px 12px", background: filterType === opt ? "#eff6ff" : "none",
                          border: "none", borderRadius: 8, cursor: "pointer",
                          fontSize: 13, color: filterType === opt ? "#1d4ed8" : "#334155",
                          fontWeight: filterType === opt ? 700 : 400,
                        }}
                      >
                        {opt === "" ? "ทั้งหมด" : opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {filterOpen && (
                <div onClick={() => setFilterOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
              )}
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

            <div className="hrf-cards-grid" style={{ alignItems: "stretch" }}>
              {activeTab === "candidates" ? (() => {
                const filteredResumes = publicResumes.filter((r) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  const user = typeof r.users === "string"
                    ? (() => { try { return JSON.parse(r.users); } catch { return {}; } })()
                    : r.users || {};
                  return (
                    (user.fullName || "").toLowerCase().includes(q) ||
                    (r.title || "").toLowerCase().includes(q)
                  );
                });
                if (resumeLoading) return (
                  <div className="hrf-empty">
                    <div className="hrf-empty-icon">⏳</div>
                    <div className="hrf-empty-title">กำลังโหลด...</div>
                  </div>
                );
                if (filteredResumes.length === 0) return (
                  <div className="hrf-empty">
                    <div className="hrf-empty-icon">👥</div>
                    <div className="hrf-empty-title">{searchQuery ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}"` : "ยังไม่มี Public Resume"}</div>
                    <div className="hrf-empty-desc">{searchQuery ? "ลองค้นหาด้วยคำอื่น" : "ยังไม่มีผู้ใช้โพสต์เรซูเม่สาธารณะ"}</div>
                  </div>
                );
                return filteredResumes.map((resume) => (
                  <CandidateCard
                    key={resume.id}
                    resume={resume}
                    isSaved={!!savedResumeMap[String(resume.id)]}
                    onSave={() => handleSaveResume(resume.id)}
                    onView={() => navigate(`/view-resume/${resume.id}`, { state: { from: "/hr-feed" } })}
                  />
                ));
              })() : (() => {
                const filteredJobs = jobs
                  .filter((j) => j.status !== "ปิดแล้ว")
                  .filter((j) => !filterType || (j.job_type || "").toLowerCase() === filterType.toLowerCase())
                  .filter((j) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (j.title || "").toLowerCase().includes(q) ||
                      (j.location || "").toLowerCase().includes(q) ||
                      (j.category || "").toLowerCase().includes(q) ||
                      (j.company || "").toLowerCase().includes(q) ||
                      (j.description || "").toLowerCase().includes(q)
                    );
                  });
                if (filteredJobs.length === 0) return (
                  <div className="hrf-empty">
                    <div className="hrf-empty-icon">📋</div>
                    <div className="hrf-empty-title">{searchQuery ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}"` : "ยังไม่มีประกาศงาน"}</div>
                    <div className="hrf-empty-desc">
                      {searchQuery ? "ลองค้นหาด้วยคำอื่น" : <>กด{" "}<span style={{ color: "#1d4ed8", cursor: "pointer", fontWeight: 700 }} onClick={openModal}>Post Job</span>{" "}เพื่อลงประกาศงานใหม่</>}
                    </div>
                  </div>
                );
                return filteredJobs.map((job) => {
                  const jobApplicantCount = applicants.filter(
                    (a) => String(a.job_id ?? a.jobId ?? a.jobID) === String(job.id)
                  ).length;
                  return (
                    <JobCard
                      key={job.id}
                      job={{ ...job, applicantCount: jobApplicantCount }}
                      onClick={() => setSelectedJob(job)}
                      onUpdateStatus={handleUpdateStatus}
                      isSaved={savedJobIds.includes(String(job.id))}
                      onSave={handleSaveJob}
                      onViewApplicants={handleViewApplicants}
                    />
                  );
                });
              })()}
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

  const salary =
    job.salaryMin && job.salaryMax
      ? `฿${Number(job.salaryMin).toLocaleString()} – ฿${Number(job.salaryMax).toLocaleString()}`
      : job.salaryMin
      ? `฿${Number(job.salaryMin).toLocaleString()}+`
      : job.salaryMax
      ? `≤ ฿${Number(job.salaryMax).toLocaleString()}`
      : job.salary || null;

  const isOpen = job.status !== "ปิดแล้ว";

  // colour accent per category
  const CATEGORY_COLORS = {
    "Design":     { bg: "#fdf4ff", accent: "#a855f7", light: "#f3e8ff" },
    "Marketing":  { bg: "#fff7ed", accent: "#f97316", light: "#ffedd5" },
    "Engineering":{ bg: "#eff6ff", accent: "#3b82f6", light: "#dbeafe" },
    "Finance":    { bg: "#f0fdf4", accent: "#22c55e", light: "#dcfce7" },
    "HR":         { bg: "#fef9c3", accent: "#eab308", light: "#fef9c3" },
  };
  const col = CATEGORY_COLORS[job.category] || { bg: "#f8fafc", accent: "#1d4ed8", light: "#eff6ff" };

  return (
    <div
      className="hrf-job-card hrf-job-card-v2"
      onClick={onClick}
      style={{ cursor: "pointer", position: "relative", overflow: "visible", padding: 0, height: "100%", display: "flex", flexDirection: "column" }}
    >
      {/* Backdrop */}
      {menuOpen && (
        <div
          onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 90, background: "transparent" }}
        />
      )}

      {/* ── Coloured top strip ── */}
      <div style={{
        height: 5, borderRadius: "14px 14px 0 0",
        background: `linear-gradient(90deg, ${col.accent}, ${col.accent}aa)`,
      }} />

      <div style={{ padding: "16px 16px 14px", display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Top row: icon + badges + 3-dot */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
          {/* Icon */}
          <div style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            background: col.light, border: `1.5px solid ${col.accent}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: col.accent, fontSize: 18,
          }}>
            <LuBriefcase />
          </div>

          {/* Badges */}
          <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 2 }}>
            <span style={{
              background: isOpen ? "#f0fdf4" : "#fef2f2",
              color: isOpen ? "#15803d" : "#dc2626",
              border: `1px solid ${isOpen ? "#bbf7d0" : "#fecaca"}`,
              borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 700,
            }}>
              ● {isOpen ? "เปิดรับ" : "ปิดแล้ว"}
            </span>
            {job.job_type && (
              <span style={{
                background: col.light, color: col.accent,
                border: `1px solid ${col.accent}44`,
                borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 700,
              }}>
                {job.job_type}
              </span>
            )}
            {isSaved && (
              <span style={{
                background: "#eff6ff", color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <LuBookmarkCheck size={9} /> Saved
              </span>
            )}
          </div>

          {/* 3-dot */}
          <div style={{ position: "relative", zIndex: 100, flexShrink: 0 }}>
            <button
              onClick={handleMenuClick}
              style={{
                width: 28, height: 28,
                background: menuOpen ? "#e0e7ff" : "rgba(248,250,252,0.9)",
                border: "1.5px solid " + (menuOpen ? "#a5b4fc" : "#e4e4e7"),
                borderRadius: "50%", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: menuOpen ? "#4f46e5" : "#94a3b8",
                transition: "all 0.15s",
              }}
            >
              <LuEllipsisVertical size={14} />
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
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onUpdateStatus(job.id, job.status === "เปิดรับสมัคร" ? "ปิดแล้ว" : "เปิดรับสมัคร"); }} style={dropdownItemStyle}>
                  <LuBadgeMinus size={14} /> {job.status === "ปิดแล้ว" ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
                </button>
                <button onClick={deleteJob} style={{ ...dropdownItemStyle, color: "#ef4444" }}>
                  <LuTrash2 size={14} /> ลบโพสงาน
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", lineHeight: 1.3, marginBottom: 4 }}>
          {job.title}
        </div>

        {/* Company */}
        {job.company && (
          <div style={{ fontSize: 12, color: col.accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
            <LuBadgeCheck size={11} /> {job.company}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: "#f1f5f9", margin: "10px 0" }} />

        {/* Meta pills row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {job.category && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "3px 8px", fontWeight: 600 }}>
              <LuBadgeCheck size={10} style={{ color: col.accent }} /> {job.category}
            </span>
          )}
          {job.location && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "3px 8px", fontWeight: 600 }}>
              <LuMapPin size={10} style={{ color: "#f97316" }} /> {job.location}
            </span>
          )}
          {job.experience && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "3px 8px", fontWeight: 600 }}>
              <LuUsers size={10} style={{ color: "#8b5cf6" }} /> {job.experience}
            </span>
          )}
        </div>

        {/* Salary bar */}
        {salary && (
          <div style={{
            marginTop: 10, padding: "8px 10px",
            background: `linear-gradient(135deg, ${col.light}, #fff)`,
            border: `1px solid ${col.accent}33`,
            borderRadius: 9,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: col.accent }}>{salary}</span>
            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>/ เดือน</span>
          </div>
        )}

        {/* Description snippet */}
        

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 8 }} />

        {/* Footer: applicants + posted */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 99, padding: "3px 10px" }}>
            <LuUsers size={10} /> {job.applicantCount ?? 0} ผู้สมัคร
          </div>
          {job.time && (
            <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 500 }}>
              {job.time}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Candidate Card (Public Resume) — iframe preview แบบ UsersFeed ── */
function CandidateCard({ resume, onView, isSaved, onSave }) {
  const cardRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const user =
    typeof resume.users === "string"
      ? (() => { try { return JSON.parse(resume.users); } catch { return {}; } })()
      : resume.users || {};

  const ownerName = user.fullName || "ไม่ระบุชื่อ";
  const ownerAvatar = user.avatar || null;
  const ownerInitial = ownerName?.[0]?.toUpperCase() ?? "?";

  const publishedDate = resume.published_at
    ? new Date(resume.published_at).toLocaleDateString("th-TH", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "";

  // IntersectionObserver — โหลด iframe ตอนการ์ดเข้า viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const CARD_W = 236;
  const IFRAME_W = 794;
  const IFRAME_H = 1123;
  const scale = CARD_W / IFRAME_W;
  const previewH = Math.round((IFRAME_H / 2) * scale);

  return (
    <div
      ref={cardRef}
      className="hrf-job-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        padding: "12px 12px 0 12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        position: "relative",
        transition: "box-shadow 0.2s",
        boxShadow: hovered ? "0 8px 28px rgba(30,58,138,0.13)" : undefined,
      }}
    >
      {/* Backdrop ปิด dropdown */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 90, background: "transparent" }}
        />
      )}

      {/* ── Save Button (top-right) ── */}
      <button
        onClick={(e) => { e.stopPropagation(); onSave(); }}
        title={isSaved ? "ยกเลิก Saved" : "บันทึก Saved"}
        style={{
          position: "absolute", top: 10, right: 10, zIndex: 10,
          background: isSaved ? "#1e3a8a" : "rgba(255,255,255,0.92)",
          border: isSaved ? "none" : "1.5px solid #e2e8f0",
          borderRadius: "50%", width: 30, height: 30,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          transition: "background 0.2s, transform 0.15s",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          color: isSaved ? "#fff" : "#6b7280", fontSize: 14,
        }}
      >
        <LuBookmark style={{ fill: isSaved ? "#fff" : "none" }} size={14} />
      </button>

      {/* ── IFRAME PREVIEW ── */}
      <div
        onClick={onView}
        style={{
          position: "relative", width: "100%", height: previewH,
          overflow: "hidden", background: "#f8fafc", flexShrink: 0,
          borderRadius: "8px", border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {inView ? (
          <iframe
            src={`/view-resume/${resume.id}`}
            title={resume.title}
            scrolling="no"
            style={{
              width: IFRAME_W, height: IFRAME_H,
              border: "none", transformOrigin: "top left",
              transform: `scale(${scale})`,
              pointerEvents: "none", userSelect: "none",
            }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "hrf-shimmer 1.4s infinite",
          }} />
        )}
        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: hovered ? "rgba(30,58,138,0.06)" : "transparent",
          transition: "background 0.2s", borderRadius: "8px",
        }} />
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: "10px 2px 12px" }}>

        {/* Owner row */}
        <div
          onClick={onView}
          style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
            padding: "5px 7px", borderRadius: 8, cursor: "pointer",
            transition: "background 0.15s",
            background: hovered ? "#f0f4ff" : "transparent",
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
            overflow: "hidden", border: "2px solid #e0e7ff",
          }}>
            {ownerAvatar
              ? <img src={ownerAvatar} alt={ownerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
              : ownerInitial}
          </div>
          <span style={{
            fontSize: "14px", fontWeight: 700, color: "#1e3a8a",
            letterSpacing: "-0.01em", flex: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {ownerName}
          </span>
          <LuUsers size={12} style={{ color: "#93c5fd", flexShrink: 0 }} />
        </div>

        {/* Resume title */}
        <div style={{
          fontSize: "12px", fontWeight: 500, color: "#4b5563",
          marginBottom: 4, paddingLeft: 2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {resume.title || "Untitled Resume"}
        </div>

        {/* Date */}
        {publishedDate && (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: "11px", color: "#9ca3af", paddingLeft: 2,
          }}>
            <LuUsers size={11} style={{ display: "none" }} />
            🕐 {publishedDate}
          </div>
        )}
      </div>

      <style>{`@keyframes hrf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
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