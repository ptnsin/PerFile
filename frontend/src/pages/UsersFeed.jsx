import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  LuSearch, LuBookmark, LuBell, LuUser, LuFilter, 
  LuFileText, LuBriefcase, LuPanelLeft 
} from "react-icons/lu";
import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";
import "../styles/UsersFeed.css";

function UsersFeed() {
  const [activeTab, setActiveTab] = useState("resume");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);

  const toggleSidebar = () => {
    if (isSidebarOpen) {
    sidebarRef.current.style.width = "";
  }
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
    sidebar.classList.add("dragging");
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const newW = Math.min(400, Math.max(60, startW + (e.clientX - startX)));
    sidebar.style.width = newW + "px";
  };

  const onMouseUp = () => {
    dragging = false;
    sidebar.classList.remove("dragging");
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  handle.addEventListener("mousedown", onMouseDown);

  return () => {
    handle.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
}, []);
  
  return (
    <div className="feed-container">
      <nav className="feed-nav">
        <div className="nav-left-group">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            <LuPanelLeft />
          </button>
          <div className="nav-logo">PerFile</div>
          <div className="nav-search-wrapper">
            <LuSearch className="search-icon" />
            <input type="text" placeholder="ค้นหา Username หรือ Company..." />
          </div>
        </div>

        <div className="nav-right-links">
          <button className="nav-notif">
            <LuBell />
          </button>
          <div className="user-profile-dropdown">
            <LuUser /> 
            <span>Un know</span>
          </div>
        </div>
      </nav>

      <div className="feed-layout">
        {/* ใส่ Class เพิ่มตาม State isSidebarOpen */}
        <aside ref={sidebarRef} className={`feed-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
           <div className="sidebar-handle">
              <div className="handle-line"></div>
          </div>
          <div className="sidebar-menu">
            <button className="create-btn"><FiPlusSquare/> Create</button>
            <Link to="/feed" className="menu-item active"><FiGrid /> Feed</Link>
            <button className="menu-item"><FiHome /> Profile</button>
            <button className="menu-item"><LuBookmark /> Saved</button>
          </div>
          
          <div className="sidebar-section">
            <p className="section-title private">Private Profile</p>
            <div className="sub-item">Development 1</div>
            <div className="sub-item">Tutor 1</div>
          </div>

          <div className="sidebar-section">
            <p className="section-title public">Public Profile</p>
            <div className="sub-item">Ux/Ui 2</div>
          </div>
        </aside>

        <main className="feed-main">
          <header className="feed-header">
            <div className="welcome-text">
              <h1>hi , Un know</h1>
              <p>Explore public resumes and job opportunities</p>
            </div>
            
            <div className="tab-switcher">
              <button 
                className={activeTab === "resume" ? "active" : ""} 
                onClick={() => setActiveTab("resume")}
              >
                <LuFileText /> Public Resumes
              </button>
              <button 
                className={activeTab === "job" ? "active" : ""} 
                onClick={() => setActiveTab("job")}
              >
                <LuBriefcase /> Job Vacancies
              </button>
            </div>
          </header>

          <div className="content-scroll-area">
            <div className="filter-bar">
              <button className="filter-btn"><LuFilter /> กรอง</button>
            </div>

            <div className="cards-grid">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`feed-card ${activeTab === "resume" ? "resume-border" : "job-border"}`}>
                  <div className="card-thumb"></div>
                  <div className="card-info">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UsersFeed;