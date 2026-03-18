import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  LuSearch, LuBookmark,
  LuBell, LuUser, LuFilter, LuFileText, LuBriefcase 
} from "react-icons/lu";
import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";
import "../styles/UsersFeed.css";

function UsersFeed() {
  const [activeTab, setActiveTab] = useState("resume"); // 'resume' หรือ 'job'

  return (
    <div className="feed-container">

      <nav className="feed-nav">
        <div className="nav-left-group">
        <div className="nav-logo">PerFile</div>
            <div className="nav-search-wrapper">
            <LuSearch className="search-icon" />
            <input type="text" placeholder="ค้นหา Username หรือ Company..." />
            </div>
        </div>

        <div className="nav-right">
          <button className="nav-notif"><LuBell /></button>
          <div className="user-profile-dropdown">
            <LuUser /> <span>Un know</span>
          </div>
        </div>
      </nav>

      <div className="feed-layout">
        {/* 2. Sidebar ฝั่งซ้าย */}
        <aside className="feed-sidebar">
          <div className="sidebar-menu">
            <button className="create-btn"><FiPlusSquare/> Create</button>
            <Link to="/" className="menu-item active"><FiGrid /> Feed</Link>
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

        {/* 3. Main Feed Area */}
        <main className="feed-main">
          <header className="feed-header">
            <div className="welcome-text">
              <h1>hi , Un know</h1>
              <p>Explore public resumes and job opportunities</p>
            </div>
            
            {/* เมนูเลือกดู Resume หรือ Job */}
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

            {/* ส่วนแสดง Grid ของการ์ด */}
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