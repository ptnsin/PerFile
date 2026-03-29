import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuSearch, LuBell, LuUser, LuFilter,
  LuFileText, LuBriefcase, LuPanelLeft
} from "react-icons/lu";
import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";
import "../styles/HRDashboard.css";

function HRDashboard() {
  const [activeTab, setActiveTab] = useState("candidates");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const hrName = "HR Manager";

  const toggleSidebar = () => {
    if (isSidebarOpen) sidebarRef.current.style.width = "";
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const handle = sidebar.querySelector(".sidebar-handle");

    let dragging = false;
    let startX = 0;
    let startW = 0;

    const onMouseDown = (e) => {
      dragging = true;
      startX = e.clientX;
      startW = sidebar.offsetWidth;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!dragging) return;
      const newW = Math.min(400, Math.max(80, startW + (e.clientX - startX)));
      sidebar.style.width = newW + "px";
    };

    const onMouseUp = () => {
      dragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    handle.addEventListener("mousedown", onMouseDown);
    return () => handle.removeEventListener("mousedown", onMouseDown);
  }, []);

  // mock data
  const candidates = [
    { id: 1, name: "John Doe", position: "Frontend Dev", skills: ["React", "JS"], status: "Interview" },
    { id: 2, name: "Jane Smith", position: "UX Designer", skills: ["Figma"], status: "Applied" },
  ];

  const jobs = [
    { id: 1, title: "Frontend Developer", company: "Tech Co", applicants: 12, date: "2026-03-01" },
    { id: 2, title: "Backend Developer", company: "API Co", applicants: 8, date: "2026-03-10" },
  ];

  return (
    <div className="feed-container">
      {/* NAV */}
      <nav className="feed-nav">
        <div className="nav-left-group">
          <button onClick={toggleSidebar}><LuPanelLeft /></button>
          <div className="nav-logo">HR Dashboard</div>
          <div className="nav-search-wrapper">
            <LuSearch />
            <input placeholder="Search candidates..." />
          </div>
        </div>

        <div className="nav-right-links">
          <LuBell />
          <div><LuUser /> {hrName}</div>
        </div>
      </nav>

      <div className="feed-layout">
      {/* SIDEBAR */}
{/* SIDEBAR */}
<aside
  ref={sidebarRef}
  className={`feed-sidebar ${isSidebarOpen ? "open" : "closed"}`}
>
  <div className="sidebar-handle"></div>

  {/* Dashboard */}
  <Link to="/dashboard" className="menu-item active">
    <FiGrid /> Dashboard
  </Link>
  
<Link to="/profile" className="menu-item">
    <LuUser /> Profile
  </Link>


  {/* Saved */}
  <Link to="/saved" className="menu-item">
    <LuFileText /> Saved
  </Link>

  {/* Profile */}
  
</aside>
        {/* MAIN */}
        <main className="feed-main">
          <header className="feed-header">
            <h1>Hi, {hrName}</h1>
            <p>Manage candidates and hiring pipeline</p>

            <div className="tab-switcher">
              <button
                className={activeTab === "candidates" ? "active" : ""}
                onClick={() => setActiveTab("candidates")}
              >
                Candidates
              </button>
              <button
                className={activeTab === "jobs" ? "active" : ""}
                onClick={() => setActiveTab("jobs")}
              >
                Job Posts
              </button>
            </div>
          </header>

          {/* STATS */}
          <div className="stats">
            <div className="stat">Candidates: 20</div>
            <div className="stat">Jobs: 5</div>
            <div className="stat">Interviews: 8</div>
            <div className="stat">Hired: 3</div>
          </div>

          {/* CONTENT */}
          <div className="cards-grid">
            {activeTab === "candidates" &&
              candidates.map(c => (
                <div key={c.id} className="card" onClick={() => navigate(`/candidate/${c.id}`)}>
                  <h3>{c.name}</h3>
                  <p>{c.position}</p>
                  <div className="skills">
                    {c.skills.map(s => <span key={s}>{s}</span>)}
                  </div>
                  <span className={`status ${c.status.toLowerCase()}`}>{c.status}</span>
                </div>
              ))}

            {activeTab === "jobs" &&
              jobs.map(j => (
                <div key={j.id} className="card">
                  <h3>{j.title}</h3>
                  <p>{j.company}</p>
                  <p>{j.applicants} applicants</p>
                  <small>{j.date}</small>
                </div>
              ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default HRDashboard;