import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuSearch, LuBell, LuUser, LuFilter,
  LuFileText, LuBriefcase, LuPanelLeft, LuPlus, LuBookmark
} from "react-icons/lu";
import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";
import "../styles/HRFeed.css"; // แนะนำให้สร้าง CSS แยก หรือใช้ตัวเดิมที่มีโครงสร้างเหมือน UsersFeed

function HrFeed() {
  const [activeTab, setActiveTab] = useState("candidates");
  const [userData, setUserData] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  // 1. ระบบ Sidebar Resizable (ก๊อปมาจา UsersFeed เป๊ะๆ)
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
      const newW = Math.min(400, Math.max(80, startW + (e.clientX - startX)));
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

  // 2. ดึงข้อมูล HR จาก Backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/hr-login");

        const response = await fetch("http://localhost:3000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        } else {
          navigate("/hr-login");
        }
      } catch (error) {
        console.error("Fetch HR error:", error);
      }
    };
    fetchUser();
  }, [navigate]);

  // 3. ปิดเมนูเมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-profile-wrapper')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    if (isSidebarOpen) sidebarRef.current.style.width = "";
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="feed-container hr-theme">
      {/* NAV */}
      <nav className="feed-nav">
        <div className="nav-left-group">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            <LuPanelLeft />
          </button>
          <div className="nav-logo">PerFile <span className="badge-hr">HR</span></div>
          <div className="nav-search-wrapper">
            <LuSearch className="search-icon" />
            <input type="text" placeholder="ค้นหาแคนดิเดต หรือเรซูเม่..." />
          </div>
        </div>

        <div className="nav-right-links">
          <button className="nav-notif"><LuBell /></button>

          <div className="user-profile-wrapper" style={{ position: 'relative' }}>
            <div className="user-profile-dropdown" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
              {userData?.avatar ? (
                <img src={userData.avatar} alt="Profile" className="nav-avatar-img" />
              ) : (
                <div className="avatar-initial">{userData?.username?.[0].toUpperCase()}</div>
              )}
              <span>{userData?.fullName || "Loading..."}</span>
            </div>

            {isUserMenuOpen && (
              <div className="profile-menu-popup">
                <button onClick={() => navigate("/hr-profile")}>Company Profile</button>
                <button className="logout-action" onClick={() => {
                  localStorage.clear();
                  navigate("/hr-login");
                }}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="feed-layout">
        {/* SIDEBAR */}
        <aside ref={sidebarRef} className={`feed-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-handle"><div className="handle-line"></div></div>
          
          <div className="sidebar-menu">
            <button className="create-btn hr-btn" onClick={() => navigate('/create-job')}>
              <LuPlus/> Post Job
            </button>
            <Link to="/hr-feed" className="menu-item active"><FiGrid /> Dashboard</Link>
            <button className="menu-item"><LuBriefcase /> My Jobs</button>
            <button className="menu-item"><LuBookmark /> Shortlisted</button>
          </div>
          
          <div className="sidebar-section">
            <p className="section-title hr-title">Recent Applicants</p>
            <div className="sub-item">Wasin Most</div>
            <div className="sub-item">Supaji Wongpa</div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="feed-main">
          <header className="feed-header">
            <div className="welcome-text">
              <h1>Hi, {userData?.fullName?.split(" ")[0] || "HR"}</h1>
              <p>Manage your company's recruitment and job posts</p>
            </div>
            
            <div className="tab-switcher">
              <button className={activeTab === "candidates" ? "active" : ""} onClick={() => setActiveTab("candidates")}>
                <LuUser /> Candidates
              </button>
              <button className={activeTab === "jobs" ? "active" : ""} onClick={() => setActiveTab("jobs")}>
                <LuBriefcase /> My Job Posts
              </button>
            </div>
          </header>

          <div className="content-scroll-area">
            <div className="filter-bar">
              <button className="filter-btn"><LuFilter /> กรอง</button>
            </div>

            <div className="cards-grid">
              {/* ส่วนนี้สามารถวน Loop ข้อมูลเหมือนใน UsersFeed ได้เลย */}
              {activeTab === "candidates" ? (
                 <p className="empty-state">แสดงรายการผู้สมัครงานตรงนี้...</p>
              ) : (
                 <p className="empty-state">แสดงรายการงานที่คุณลงประกาศไว้...</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default HrFeed;