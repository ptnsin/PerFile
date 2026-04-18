import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  LuSearch, LuBell, LuFilter, LuFileText, LuBriefcase,
  LuPanelLeft, LuPlus, LuBookmark, LuLayoutDashboard,
  LuBadgeCheck, LuClock, LuMapPin
} from "react-icons/lu";
import { FiHome } from "react-icons/fi";
import JobDetailModal from "./JobDetailModal";

import "../styles/UsersFeed.css";

const TABS = [
  { key: "resume", label: "Public Resumes", icon: <LuFileText /> },
  { key: "job",    label: "Job Vacancies",  icon: <LuBriefcase /> },
];

export default function UsersFeed() {
  const [activeTab, setActiveTab]       = useState("resume");
  const [userData, setUserData]         = useState(null);
  const [publicResumes, setPublicResumes] = useState([]);
  const [searchTerm, setSearchTerm]     = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [myResumes, setMyResumes] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const sidebarRef = useRef(null);
  const navigate   = useNavigate();

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
      if (!q) return true;
      return (r.title?.toLowerCase() || "").includes(q) ||
             (r.owner?.toLowerCase() || "").includes(q);
    });
  }, [publicResumes, searchTerm]);

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

  const JOB_CATEGORIES = [
    { key: "IT",        label: "💻 IT & Software" },
    { key: "Design",    label: "🎨 Design" },
    { key: "Marketing", label: "📣 Marketing" },
    { key: "Finance",   label: "💰 Finance" },
    { key: "Engineer",  label: "⚙️ Engineer" },
    { key: "Other",     label: "📋 Other" },
  ];

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
  const publicList  = myResumes.filter(r => r.visibility === "public");

  const filteredJobs = selectedCategory
    ? jobs.filter(j => (j.job_type || "Other").toLowerCase().includes(selectedCategory.toLowerCase()))
    : jobs;

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
                onClick={() => { setActiveTab("job"); setSelectedCategory(null); }}
              >
                <span style={{
                  display: "inline-block", marginRight: 5,
                  fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6,
                  background: a.status === "accepted" ? "#dcfce7" : a.status === "rejected" ? "#fee2e2" : "#fef9c3",
                  color:      a.status === "accepted" ? "#16a34a" : a.status === "rejected" ? "#dc2626" : "#ca8a04",
                }}>
                  {a.status === "accepted" ? "✓" : a.status === "rejected" ? "✕" : "⏳"}
                </span>
                {a.jobTitle}
              </div>
            ))
          ) : (
            <div className="uf-sub-item" style={{ color: "#9ca3af", fontSize: 11 }}>ยังไม่ได้สมัครงาน</div>
          )}

          {/* Job Categories */}
          <div className="uf-section-label">Job Categories</div>
          {JOB_CATEGORIES.map(cat => (
            <div
              key={cat.key}
              className="uf-sub-item"
              style={{
                cursor: "pointer",
                fontWeight: selectedCategory === cat.key ? 700 : 400,
                color: selectedCategory === cat.key ? "#1e3a8a" : undefined,
                background: selectedCategory === cat.key ? "#eff6ff" : undefined,
                borderRadius: 6,
              }}
              onClick={() => {
                setSelectedCategory(prev => prev === cat.key ? null : cat.key);
                setActiveTab("job");
              }}
            >
              {cat.label}
            </div>
          ))}
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
                  </div>
                )
              ) : (
                jobs.length > 0 ? (
                  filteredJobs.length > 0 ? (
                    <>
                      {selectedCategory && (
                        <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>กรองตาม:</span>
                          <span style={{ background: "#eff6ff", color: "#1e3a8a", borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                            {JOB_CATEGORIES.find(c => c.key === selectedCategory)?.label}
                            <button onClick={() => setSelectedCategory(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1e3a8a", padding: 0, lineHeight: 1 }}>✕</button>
                          </span>
                        </div>
                      )}
                      {filteredJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={{ ...job, company_name: job.users?.hr_profile?.company }}
                          onClick={() => handleOpenJobDetail(job)}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="uf-empty">
                      <div className="uf-empty-icon">🔍</div>
                      <div className="uf-empty-title">ไม่มีงานในหมวด "{selectedCategory}"</div>
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

      {/* วาง Modal ไว้ที่นี่ (ด้านนอกสุดของโครงสร้างหลัก) */}
      <JobDetailModal
        open={isModalOpen}
        job={selectedJob}
        onClose={handleCloseModal}
        onViewApplicants={() => {}} 
      />
    </div>
  );
}

function ResumeCard({ resume, onClick }) {
  const cardRef = useRef(null);
  const [inView, setInView] = useState(false);

  const displayDate =
    resume.published_at || resume.publishedAt
      ? new Date(resume.published_at || resume.publishedAt).toLocaleDateString("th-TH")
      : "No date";
  const ownerName = resume.users?.fullName || resume.owner;

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

  const CARD_W = 236;        // 260px card - 12px padding x2
  const IFRAME_W = 794;
  const IFRAME_H = 1123;
  const scale = CARD_W / IFRAME_W;
  const previewH = Math.round((IFRAME_H / 2) * scale);

  return (
    <div
      ref={cardRef}
      className="uf-resume-card"
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "12px 12px 0 12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
      }}
    >
      {/* ── PREVIEW AREA (มีขอบและ padding รอบๆ) ── */}
      <div style={{
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
            background: "transparent",
            transition: "background 0.2s",
            borderRadius: "8px",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(30,58,138,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        />

        {/* PUBLIC badge */}
       {/* PUBLIC badge */}

      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: "10px 2px 12px" }}>
        <div className="uf-resume-title" style={{ marginBottom: 5, fontSize: "13px" }}>
          {resume.title}
        </div>
        <div className="uf-resume-meta">
          {ownerName && <span><LuBadgeCheck /> {ownerName}</span>}
          <span><LuClock /> {displayDate}</span>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, onClick }) {
  const companyName = job.company_name || "ทั่วไป";
  
  return (
    <div
      className="hrf-job-card" 
      onClick={onClick}
      style={{ cursor: "pointer", position: "relative" }}
    >
      <div className="hrf-job-header">
        <div className="hrf-job-icon">
          <LuBriefcase />
        </div>
        <span className="hrf-job-type">{job.job_type || "ไม่ระบุ"}</span>
      </div>

      <div className="hrf-job-title" style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "8px" }}>
        {job.title}
      </div>

      <div className="hrf-job-meta">
        <span>
          <LuBadgeCheck /> {companyName}
        </span>
        <span>
          <LuMapPin /> {job.location || "ไม่ระบุ"}
        </span>
      </div>

      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #f1f5f9" }}>
        <span style={{ color: "#059669", fontWeight: 700, fontSize: "14px" }}>
          ฿ {job.salary}
        </span>
      </div>
    </div>
  );
}