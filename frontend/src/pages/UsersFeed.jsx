import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LuSearch, LuBookmark, LuBell, LuUser, LuFilter, 
  LuFileText, LuBriefcase, LuPanelLeft 
} from "react-icons/lu";
import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";
import "../styles/UsersFeed.css";

function UsersFeed() {
  const [activeTab, setActiveTab] = useState("resume");
  const [userData, setUserData] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

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

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // ถ้าไม่มี token ให้เด้งกลับหน้า login
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:3000/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user); // เก็บข้อมูล user (id, fullName, avatar, etc.)
      } else {
        // ถ้า token หมดอายุ หรือผิดพลาด
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (error) {
      console.error("Fetch user error:", error);
    }
  };

  fetchUser();
}, [navigate]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    // ถ้าคลิกข้างนอกตัว wrapper ให้ปิดเมนู
    if (!event.target.closest('.user-profile-wrapper')) {
      setIsUserMenuOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
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

          <div className="user-profile-wrapper" style={{ position: 'relative' }}>
    <div className="user-profile-dropdown" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
      {userData?.avatar ? (
        <img src={userData.avatar} alt="Profile" className="nav-avatar-img" />
      ) : (
        <LuUser />
      )}
      <span>{userData?.fullName || "Loading..."}</span>
    </div>

    {/* กล่องเมนูที่จะเด้งออกมาเมื่อคลิก */}
    {isUserMenuOpen && (
      <div className="profile-menu-popup">
        <button onClick={() => navigate("/profile")}>View Profile</button>
        <button className="logout-action" onClick={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}>
          Logout
        </button>
      </div>
    )}
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
            <button className="create-btn" onClick={() => navigate('/resume')}><FiPlusSquare/> Create</button>
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
              <h1>hi, {userData?.fullName?.split(" ")[0] || "there"}</h1> {/* split เอาเฉพาะชื่อเล่น/ชื่อแรก */}
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