import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  LuSearch, LuBell, LuFilter, LuFileText, LuBriefcase,
  LuPanelLeft, LuPlus, LuBookmark, LuLayoutDashboard,
  LuBadgeCheck, LuClock, LuMapPin, LuBadgeMinus, LuUser
} from "react-icons/lu";
import { FiHome } from "react-icons/fi";
import SeekerJobModal from "./SeekerJobModal";
import HRPopupModal from "./HRPopupModal";

import "../styles/UsersFeed.css";

const TABS = [
  { key: "resume", label: "Public Resumes", icon: <LuFileText /> },
  { key: "job", label: "Job Vacancies", icon: <LuBriefcase /> },
];

export default function UsersFeed() {
  const [activeTab, setActiveTab] = useState("resume");
  const [userData, setUserData] = useState(null);
  const [publicResumes, setPublicResumes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [myResumes, setMyResumes] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profilePopup, setProfilePopup] = useState(null);
  const [hrPopup, setHrPopup] = useState(null);


  // Saved resumes — sync จาก backend
  const [savedResumes, setSavedResumes] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);

  // Notification
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Filter states — Resume
  const [resumeFilter, setResumeFilter] = useState({ position: "" });
  // Filter states — Job
  const [jobFilter, setJobFilter] = useState({ type: "", location: "", salaryMin: "", salaryMax: "" });
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  // Fetch saved jobs/resumes จาก backend ตอน mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // saved jobs
    fetch("http://localhost:3000/saved/jobs", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSavedJobs((d.savedJobs || []).map(j => j.job_id)); })
      .catch(() => {});
    // saved resumes
    fetch("http://localhost:3000/saved/resumes", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSavedResumes((d.savedResumes || []).map(r => r.resume_id)); })
      .catch(() => {});
  }, []);

  const toggleSaveJob = async (jobId) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("กรุณาเข้าสู่ระบบก่อนบันทึก");
    const isSaved = savedJobs.includes(jobId);
    // optimistic UI
    setSavedJobs(prev => isSaved ? prev.filter(id => id !== jobId) : [...prev, jobId]);
    const method = isSaved ? "DELETE" : "POST";
    const res = await fetch(`http://localhost:3000/saved/jobs/${jobId}`, {
      method,
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      // rollback
      setSavedJobs(prev => isSaved ? [...prev, jobId] : prev.filter(id => id !== jobId));
    }
  };

  const toggleSave = async (resumeId) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("กรุณาเข้าสู่ระบบก่อนบันทึก");
    const isSaved = savedResumes.includes(resumeId);
    // optimistic UI
    setSavedResumes(prev => isSaved ? prev.filter(id => id !== resumeId) : [...prev, resumeId]);
    const method = isSaved ? "DELETE" : "POST";
    const res = await fetch(`http://localhost:3000/saved/resumes/${resumeId}`, {
      method,
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      // rollback
      setSavedResumes(prev => isSaved ? [...prev, resumeId] : prev.filter(id => id !== resumeId));
    }
  };

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/notifications", {
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

  // Close notification dropdown on outside click
  useEffect(() => {
    const close = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Fetch Jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:3000/jobs/all");
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error("Fetch jobs error:", err);
      }
    };
    fetchJobs();
  }, []);

  const handleOpenJobDetail = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  // Fetch Public Resumes
  useEffect(() => {
    const fetchPublicResumes = async () => {
      try {
        const res = await fetch("http://localhost:3000/resumes/public");
        if (res.ok) {
          const data = await res.json();
          setPublicResumes(data.resumes);
        }
      } catch (err) {
        console.error("Fetch public resumes error:", err);
      }
    };
    fetchPublicResumes();
  }, []);

  const filteredResumes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return publicResumes.filter((r) => {
      const matchSearch = !q ||
        (r.title?.toLowerCase() || "").includes(q) ||
        (r.owner?.toLowerCase() || "").includes(q) ||
        (r.users?.fullName?.toLowerCase() || "").includes(q);
      const matchPosition = !resumeFilter.position ||
        (r.title?.toLowerCase() || "").includes(resumeFilter.position.toLowerCase());
      return matchSearch && matchPosition;
    });
  }, [publicResumes, searchTerm, resumeFilter]);

  const filteredJobs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchSearch = !q ||
        (j.title?.toLowerCase() || "").includes(q) ||
        (j.users?.hr_profile?.company?.toLowerCase() || "").includes(q) ||
        (j.location?.toLowerCase() || "").includes(q);
      const matchType = !jobFilter.type || j.job_type === jobFilter.type;
      const matchLocation = !jobFilter.location ||
        (j.location?.toLowerCase() || "").includes(jobFilter.location.toLowerCase());
      // salary อาจเป็น string "15000-30000" หรือ "15000" ให้ดึงตัวเลขทั้งหมดออกมา
      const salaryNums = String(j.salary || "").match(/\d+/g)?.map(Number) || [];
      const salaryMin = salaryNums.length > 0 ? Math.min(...salaryNums) : 0;
      const salaryMax = salaryNums.length > 0 ? Math.max(...salaryNums) : 0;
      const matchMin = !jobFilter.salaryMin || salaryMax >= parseFloat(jobFilter.salaryMin);
      const matchMax = !jobFilter.salaryMax || salaryMin <= parseFloat(jobFilter.salaryMax);
      return matchSearch && matchType && matchLocation && matchMin && matchMax;
    });
  }, [jobs, searchTerm, jobFilter]);

  // Sidebar Resize Logic
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

  // Auth Me
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

  // Fetch Applied Jobs (for sidebar)
  useEffect(() => {
    const fetchApplied = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/applications/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAppliedJobs(data.applications ?? []);
        }
      } catch (err) {
        console.error("Fetch applied jobs error:", err);
      }
    };
    fetchApplied();
  }, []);



  // Fetch My Resumes (for sidebar)
  useEffect(() => {
    const fetchMyResumes = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/resumes/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMyResumes(data.resumes ?? []);
        }
      } catch (err) {
        console.error("Fetch my resumes error:", err);
      }
    };
    fetchMyResumes();
  }, []);

  const privateList = myResumes.filter(r => r.visibility === "private");
  const publicList = myResumes.filter(r => r.visibility === "public");

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".uf-user-area")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Close filter dropdown on tab change
  useEffect(() => {
    setIsFilterOpen(false);
  }, [activeTab]);

  const initial = userData?.username?.[0]?.toUpperCase() ?? "U";
  const firstName = userData?.fullName?.split(" ")[0] ?? "there";

  const toggleSidebar = () => {
    if (sidebarOpen && sidebarRef.current) sidebarRef.current.style.width = "";
    setSidebarOpen((v) => !v);
  };

  return (
    <div className="uf-page">
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
                {/* Header */}
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>แจ้งเตือน</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <>
                        <span style={{ background: "#eff6ff", color: "#1e3a8a", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>
                          {notifications.filter(n => !n.is_read).length} ใหม่
                        </span>
                        {/* ✅ ปุ่มอ่านทั้งหมด */}
                        <button
                          onClick={async () => {
                            const token = localStorage.getItem("token");
                            await fetch("http://localhost:3000/notifications/read-all", {
                              method: "PATCH",
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
                          }}
                          style={{
                            fontSize: 11, color: "#1e3a8a", background: "none",
                            border: "none", cursor: "pointer", fontWeight: 600, padding: 0,
                          }}
                        >
                          อ่านทั้งหมด
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* List */}
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {notifications.length > 0 ? notifications.map((n, i) => (
                    <div
                      key={n.id ?? i}
                      onClick={async () => {
                        if (!n.is_read) {
                          const token = localStorage.getItem("token");
                          await fetch(`http://localhost:3000/notifications/${n.id}/read`, {
                            method: "PATCH",
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
                        }
                      }}
                      style={{
                        padding: "10px 16px", borderBottom: "1px solid #f9fafb",
                        background: n.is_read ? "#fff" : "#f0f7ff",
                        display: "flex", gap: 10, alignItems: "flex-start",
                        cursor: n.is_read ? "default" : "pointer",
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{ fontSize: 18, flexShrink: 0 }}>
                        {n.type === "application" ? "📋" : n.type === "shortlist" ? "⭐" : n.type === "interview" ? "📅" : "🔔"}
                      </div>
                      <div style={{ flex: 1 }}>
                        {n.title && <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 2 }}>{n.title}</div>}
                        <div style={{ fontSize: 13, color: "#111827", fontWeight: n.is_read ? 400 : 600 }}>{n.message ?? n.title}</div>
                        {n.created_at && (
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                            {new Date(n.created_at).toLocaleDateString("th-TH")}
                          </div>
                        )}
                      </div>
                      {!n.is_read && (
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#1e3a8a", flexShrink: 0, marginTop: 4 }} />
                      )}
                    </div>
                  )) : (
                    <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                      ยังไม่มีแจ้งเตือน
                    </div>
                  )}
                </div>

                {/* Footer — ลบทั้งหมด */}
                {notifications.length > 0 && (
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem("token");
                        await fetch("http://localhost:3000/notifications/clear", {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        setNotifications([]);
                      }}
                      style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      ลบทั้งหมด
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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

      <div className="uf-body">
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
          <button className="uf-menu-item" onClick={() => navigate("/profile", { state: { scrollTo: "saved" } })}>
            <LuBookmark /> Saved
          </button>
          {/* Jobs Applied */}
          <div className="uf-section-label">Jobs Applied
            {appliedJobs.length > 0 && (
              <span style={{ marginLeft: 6, background: "#1e3a8a", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>
                {appliedJobs.length}
              </span>
            )}
          </div>
          {appliedJobs.length > 0 ? (
            appliedJobs.slice(0, 5).map(a => (
              <div
                key={a.id}
                className="uf-sub-item"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/jobs/${a.job_id}`)}
              >
                💼 {a.jobs?.title ?? "งาน"}
              </div>
            ))
          ) : (
            <div className="uf-sub-item" style={{ color: "#9ca3af", fontSize: 11 }}>ยังไม่ได้สมัคร</div>
          )}

          {privateList.length > 0 && (
            <>
              <div className="uf-section-label">Private Resumes</div>
              {privateList.map(r => (
                <div
                  key={r.id}
                  className="uf-sub-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/view-resume/${r.id}`)}
                >
                  🔒 {r.title}
                </div>
              ))}
            </>
          )}
          {publicList.length > 0 && (
            <>
              <div className="uf-section-label">Public Resumes</div>
              {publicList.map(r => (
                <div
                  key={r.id}
                  className="uf-sub-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/view-resume/${r.id}`)}
                >
                  🌐 {r.title}
                </div>
              ))}
            </>
          )}
        </aside>

        <main className="uf-main">
          <div className="uf-header-card">
            <div className="uf-welcome">
              <h1>hi, {firstName} </h1>
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
                </button>
              ))}
            </div>
          </div>

          <div className="uf-panel">
            <div className="uf-filter-bar" style={{ position: "relative" }}>
              <button
                className="uf-filter-btn"
                onClick={() => setIsFilterOpen((v) => !v)}
                style={isFilterOpen ? { background: "#eff6ff", color: "#1e3a8a", borderColor: "#1e3a8a" } : {}}
              >
                <LuFilter /> กรอง
                {((activeTab === "resume" && resumeFilter.position) ||
                  (activeTab === "job" && (jobFilter.type || jobFilter.location || jobFilter.salaryMin || jobFilter.salaryMax))) && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1e3a8a", display: "inline-block", marginLeft: 4 }} />
                  )}
              </button>

              {/* ── Filter Dropdown ── */}
              {isFilterOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: 0,
                  background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 100,
                  padding: 16, minWidth: 280,
                }}>
                  {activeTab === "resume" ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#374151", marginBottom: 10 }}>🔍 กรอง Resume</div>
                      <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>ตำแหน่ง / ชื่อเรซูเม่</label>
                      <input
                        type="text" placeholder="เช่น Frontend, Designer..."
                        value={resumeFilter.position}
                        onChange={e => setResumeFilter(f => ({ ...f, position: e.target.value }))}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                      />
                      <button onClick={() => setResumeFilter({ position: "" })}
                        style={{ marginTop: 10, fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        ล้างตัวกรอง
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#374151", marginBottom: 10 }}>🔍 กรอง Job</div>
                      <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>ประเภทงาน</label>
                      <select
                        value={jobFilter.type}
                        onChange={e => setJobFilter(f => ({ ...f, type: e.target.value }))}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Remote">Remote</option>
                      </select>
                      <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>สถานที่ทำงาน</label>
                      <input
                        type="text" placeholder="เช่น Bangkok, Remote..."
                        value={jobFilter.location}
                        onChange={e => setJobFilter(f => ({ ...f, location: e.target.value }))}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
                      />
                      <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 4 }}>เงินเดือน (฿)</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="number" placeholder="ต่ำสุด"
                          value={jobFilter.salaryMin}
                          onChange={e => setJobFilter(f => ({ ...f, salaryMin: e.target.value }))}
                          style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none" }}
                        />
                        <input
                          type="number" placeholder="สูงสุด"
                          value={jobFilter.salaryMax}
                          onChange={e => setJobFilter(f => ({ ...f, salaryMax: e.target.value }))}
                          style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none" }}
                        />
                      </div>
                      <button onClick={() => setJobFilter({ type: "", location: "", salaryMin: "", salaryMax: "" })}
                        style={{ marginTop: 10, fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        ล้างตัวกรอง
                      </button>
                    </>
                  )}
                </div>
              )}

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

            <div className="uf-cards-grid">
              {activeTab === "resume" ? (
                filteredResumes.length > 0 ? (
                  filteredResumes.map((resume) => {
                    // parse users ที่อาจเป็น JSON string จาก MySQL
                    const usersObj = typeof resume.users === 'string'
                      ? JSON.parse(resume.users)
                      : (resume.users || {});

                    return (
                      <ResumeCard
                        key={resume.id}
                        resume={{ ...resume, users: usersObj }}
                        isSaved={savedResumes.includes(resume.id)}
                        onSave={() => toggleSave(resume.id)}
                        onClick={() => navigate(`/view-resume/${resume.id}`)}  // ✅ กดรูป → ViewResume
                        onOwnerClick={(e) => {
                          e.stopPropagation();
                          const usersObj = typeof resume.users === 'string'
                            ? JSON.parse(resume.users) : (resume.users || {});
                          const targetId = resume.user_id || usersObj?.id;
                          if (targetId) {
                            setProfilePopup({ userId: targetId });
                          }
                        }}
                      />
                    );
                  })
                ) : (
                  <div className="uf-empty">
                    <div className="uf-empty-icon">📄</div>
                    <div className="uf-empty-title">ยังไม่มีเรซูเม่สาธารณะ</div>
                  </div>
                )
              ) : (
                jobs.length > 0 ? (
                  filteredJobs.length > 0 ? (
                    <>
                      {filteredJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={{ ...job, company_name: job.users?.hr_profile?.company }}
                          onClick={() => handleOpenJobDetail(job)}
                          onCompanyClick={(e) => {
                            e.stopPropagation();
                            const hrId = job.hrId || job.users?.id;
                            if (hrId) setHrPopup(hrId);
                          }}
                          isSaved={savedJobs.includes(job.id)}
                          onSave={(e) => { e.stopPropagation(); toggleSaveJob(job.id); }}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="uf-empty">
                      <div className="uf-empty-icon">🔍</div>
                      <div className="uf-empty-title">ไม่พบงานที่ตรงกับการค้นหา</div>
                    </div>
                  )
                ) : (
                  <div className="uf-empty">
                    <div className="uf-empty-icon">💼</div>
                    <div className="uf-empty-title">ยังไม่มีประกาศรับสมัครงาน</div>
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>

      {profilePopup && (
        <ProfilePopupModal
          userId={profilePopup.userId}
          onClose={() => setProfilePopup(null)}
          navigate={navigate}
        />
      )}

      <SeekerJobModal
        open={isModalOpen}
        job={selectedJob}
        onClose={handleCloseModal}
        isSaved={savedJobs.includes(selectedJob?.id)}
        onToggleSave={() => toggleSaveJob(selectedJob?.id)}
      />

      {hrPopup && (
        <HRPopupModal
          userId={hrPopup}
          onClose={() => setHrPopup(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ResumeCard — ชื่อเจ้าของเด่นสุด + ปุ่ม Save
// ─────────────────────────────────────────────
function ResumeCard({ resume, onClick, onOwnerClick, onSave, isSaved }) {
  const cardRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);

  const displayDate =
    resume.published_at || resume.publishedAt
      ? new Date(resume.published_at || resume.publishedAt).toLocaleDateString("th-TH")
      : "No date";
  const ownerName = resume.fullName || resume.ownerName || (resume.users && resume.users.fullName) || "Unknown User";
  const ownerAvatar = resume.users?.avatar;
  const ownerInitial = ownerName?.[0]?.toUpperCase() ?? "?";

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
      className="uf-resume-card"
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
      {/* ── Save Button (top-right corner) ── */}
      <button
        onClick={(e) => { e.stopPropagation(); onSave(); }}
        title={isSaved ? "Unsave" : "Save"}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
          background: isSaved ? "#1e3a8a" : "rgba(255,255,255,0.92)",
          border: isSaved ? "none" : "1.5px solid #e2e8f0",
          borderRadius: "50%",
          width: 30,
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          transition: "background 0.2s, transform 0.15s",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          color: isSaved ? "#fff" : "#6b7280",
          fontSize: 14,
        }}
      >
        <LuBookmark style={{ fill: isSaved ? "#fff" : "none" }} size={14} />
      </button>

      {/* ── PREVIEW AREA ── */}
      <div
        onClick={onClick}
        style={{
          position: "relative",
          width: "100%",
          height: previewH,
          overflow: "hidden",
          background: "#f8fafc",
          flexShrink: 0,
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
        {inView ? (
          <iframe
            src={`/view-resume/${resume.id}`}
            title={resume.title}
            scrolling="no"
            style={{
              width: IFRAME_W,
              height: IFRAME_H,
              border: "none",
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "uf-shimmer 1.4s infinite",
          }} />
        )}

        {/* Hover overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: hovered ? "rgba(30,58,138,0.06)" : "transparent",
            transition: "background 0.2s",
            borderRadius: "8px",
          }}
        />
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: "10px 2px 12px" }}>

        {/* ── Owner Row (คลิกดูโปรไฟล์) ── */}
        <div
          onClick={onOwnerClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            padding: "5px 7px",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background 0.15s",
            background: hovered ? "#f0f4ff" : "transparent",
          }}
          title={`ดูโปรไฟล์ ${ownerName}`}
        >
          {/* Avatar */}
          <div
            onClick={onOwnerClick}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              overflow: "hidden",
              border: "2px solid #e0e7ff",
            }}>
            {ownerAvatar
              ? <img src={ownerAvatar} alt={ownerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
              : ownerInitial}
          </div>

          {/* Name */}
          <span style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#1e3a8a",
            letterSpacing: "-0.01em",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {ownerName}
          </span>

          {/* View profile arrow */}
          <LuUser size={12} style={{ color: "#93c5fd", flexShrink: 0 }} />
        </div>

        {/* ── Resume Title (รอง) ── */}
        <div style={{
          fontSize: "12px",
          fontWeight: 500,
          color: "#4b5563",
          marginBottom: 4,
          paddingLeft: 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {resume.title}
        </div>

        {/* ── Date ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: "11px",
          color: "#9ca3af",
          paddingLeft: 2,
        }}>
          <LuClock size={11} />
          {displayDate}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, onClick, onCompanyClick, isSaved, onSave }) {
  const [hovered, setHovered] = useState(false);

  const company = job.company_name || job.users?.hr_profile?.company;
  const companyInitial = company?.[0]?.toUpperCase() ?? "?";
  const postedDate = job.createdAt || job.created_at
    ? new Date(job.createdAt || job.created_at).toLocaleDateString("th-TH")
    : "—";

  return (
    <div
      className="uf-resume-card"
      onClick={onClick}
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
      {/* ── PREVIEW AREA — gradient banner ── */}
      <div style={{
        position: "relative",
        width: "100%",
        height: 148,
        overflow: "hidden",
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 60%, #60a5fa 100%)",
        flexShrink: 0,
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <button
          onClick={onSave}
          title={isSaved ? "Unsave" : "Save"}
          style={{
            position: "absolute", top: 10, right: 10, zIndex: 10,
            background: isSaved ? "#1e3a8a" : "rgba(255,255,255,0.92)",
            border: isSaved ? "none" : "1.5px solid #e2e8f0",
            borderRadius: "50%", width: 30, height: 30,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            color: isSaved ? "#fff" : "#6b7280",
          }}
        >
          <LuBookmark style={{ fill: isSaved ? "#fff" : "none" }} size={14} />
        </button>
        {/* Job type badge */}
        <span style={{
          position: "absolute", top: 10, left: 10,
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(4px)",
          color: "#fff", fontSize: 10, fontWeight: 700,
          borderRadius: 6, padding: "3px 8px",
          letterSpacing: "0.05em", textTransform: "uppercase",
          border: "1px solid rgba(255,255,255,0.3)",
        }}>
          {job.job_type || "งาน"}
        </span>

        {/* Center icon */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          border: "2px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 800, color: "#fff",
        }}>
          <LuBriefcase size={24} />
        </div>

        {/* Salary badge bottom-right */}
        <span style={{
          position: "absolute", bottom: 10, right: 10,
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(4px)",
          color: "#fff", fontSize: 11, fontWeight: 700,
          borderRadius: 6, padding: "3px 8px",
          border: "1px solid rgba(255,255,255,0.3)",
        }}>
          ฿ {job.salary ?? "ไม่ระบุ"}
        </span>

        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: hovered ? "rgba(30,58,138,0.15)" : "transparent",
          transition: "background 0.2s", borderRadius: "8px",
        }} />
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: "10px 2px 12px" }}>

        {/* Company row */}
        <div
          onClick={onCompanyClick}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 6, padding: "5px 7px", borderRadius: 8,
            cursor: "pointer",
            transition: "background 0.15s",
            background: hovered ? "#f0f4ff" : "transparent",
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
            flexShrink: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 700,
            color: "#fff", border: "2px solid #e0e7ff",
          }}>
            {companyInitial}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e3a8a", flex: 1 }}>
            {company || "ไม่ระบุบริษัท"}
          </span>
          <LuBriefcase size={12} style={{ color: "#93c5fd" }} />
        </div>

        {/* Job title */}
        <div style={{
          fontSize: 12, fontWeight: 600, color: "#111827",
          marginBottom: 4, paddingLeft: 2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {job.title || "ไม่ระบุตำแหน่ง"}
        </div>

        {/* Location + date */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, color: "#9ca3af", paddingLeft: 2,
        }}>
          {job.location && <><LuMapPin size={11} />{job.location} · </>}
          <LuClock size={11} />{postedDate}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ProfilePopupModal
// ─────────────────────────────────────────────
function ProfilePopupModal({ userId, onClose, navigate }) {
  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:3000/profile/public/${userId}`);
        if (!res.ok) throw new Error("ไม่พบโปรไฟล์");
        const data = await res.json();
        setProfile(data.user);
        setResumes(data.resumes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    fetch(`http://localhost:3000/profile/view/${userId}`, { method: "POST" });
  }, [userId]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const displayName = profile?.fullName || "ผู้ใช้";
  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        background: "#f8fafc",
        borderRadius: 20,
        width: "100%", maxWidth: 520,
        maxHeight: "88vh",
        overflowY: "auto",
        overflowX: "visible",
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        position: "relative",

      }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
            <div style={{
              width: 32, height: 32, border: "3px solid #e5e7eb",
              borderTop: "3px solid #1e3a8a", borderRadius: "50%",
              animation: "uf-spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }} />
            กำลังโหลด...
          </div>
        ) : (
          <>
            {/* ── Hero Card ── */}
            <div style={{
              background: "#fff",
              borderRadius: "20px 20px 0 0",
            }}>
              {/* Banner */}
              <div style={{
                height: 130,
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)",
                borderRadius: "20px 20px 0 0",
                position: "relative",
              }}>
                {/* ปุ่ม X มุมขวาบน */}
                <button
                  onClick={onClose}
                  style={{
                    position: "absolute", top: 12, right: 12,
                    background: "rgba(255,255,255,0.2)",
                    border: "1.5px solid rgba(255,255,255,0.4)",
                    borderRadius: "50%", width: 30, height: 30,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#fff", fontSize: 14,
                    backdropFilter: "blur(4px)",
                  }}
                >✕</button>
              </div>

              {/* Avatar + Info */}
              <div style={{ padding: "0 24px 24px" }}>
                {/* Avatar */}
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  border: "4px solid #fff",
                  background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", flexShrink: 0, fontSize: 28, fontWeight: 800, color: "#fff",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  marginTop: -45, marginBottom: 12, position: "relative", zIndex: 10,
                }}>
                  {profile?.avatar
                    ? <img src={profile.avatar} alt={displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      crossOrigin="anonymous" />
                    : initial}
                </div>

                {/* ชื่อ */}
                <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 2 }}>
                  {displayName}
                </div>

                {/* bio */}
                {profile?.bio && (
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
                    {profile.bio}
                  </div>
                )}

                {/* chips: location, email, portfolio */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {profile?.location && (
                    <span style={ppChip}>
                      <LuMapPin size={11} /> {profile.location}
                    </span>
                  )}
                  {profile?.email && (
                    <span style={ppChip}>
                      <LuUser size={11} /> {profile.email}
                    </span>
                  )}
                  {profile?.portfolio && (
                    <a href={profile.portfolio} target="_blank" rel="noreferrer"
                      style={{ ...ppChip, color: "#7c3aed", textDecoration: "none" }}>
                      🔗 {profile.portfolio}
                    </a>
                  )}
                </div>

                {/* GitHub / LinkedIn */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {profile?.github && (
                    <a href={profile.github} target="_blank" rel="noreferrer" style={ppLinkBtn}>
                      GitHub ↗
                    </a>
                  )}
                  {profile?.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noreferrer"
                      style={{ ...ppLinkBtn, borderColor: "#0077b5", color: "#0077b5" }}>
                      LinkedIn ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ── Public Resumes ── */}
            <div style={{ background: "#fff", margin: "8px 0 0", padding: "20px 24px 24px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
              }}>
                <LuFileText size={15} style={{ color: "#1e3a8a" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                  เรซูเม่สาธารณะ
                </span>
                <span style={{
                  background: "#eff6ff", color: "#1e3a8a",
                  borderRadius: 10, padding: "1px 8px",
                  fontSize: 11, fontWeight: 700,
                }}>
                  {resumes.length}
                </span>
              </div>

              {resumes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: 14 }}>
                  📄 ยังไม่มีเรซูเม่สาธารณะ
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {resumes.map(r => (
                    <div
                      key={r.id}
                      onClick={() => { onClose(); navigate(`/view-resume/${r.id}`); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 12,
                        border: "1.5px solid #e5e7eb", background: "#f8fafc",
                        cursor: "pointer", transition: "border-color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "#eff6ff", display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <LuFileText size={16} style={{ color: "#1e3a8a" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700, color: "#111827",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {r.title}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          <LuClock size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString("th-TH")
                            : "—"}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>ดู ↗</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── ปุ่มดูโปรไฟล์เต็ม ── */}
            <div style={{ padding: "12px 24px 24px", background: "#fff", borderRadius: "0 0 20px 20px" }}>
              <button
                onClick={() => { onClose(); navigate(`/view-profile/${userId}`); }}
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 12,
                  border: "none", background: "#1e3a8a",
                  color: "#fff", fontWeight: 700, fontSize: 15,
                  cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <LuUser size={15} /> ดูโปรไฟล์เต็ม
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// styles สำหรับ popup
const ppChip = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 12, color: "#6b7280", background: "#f3f4f6",
  borderRadius: 20, padding: "3px 10px", fontWeight: 500,
};

const ppLinkBtn = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 12, color: "#374151", background: "#fff",
  border: "1.5px solid #d1d5db", borderRadius: 8,
  padding: "5px 12px", fontWeight: 600, textDecoration: "none",
  cursor: "pointer",
};