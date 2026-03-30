import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  LuSearch, LuBookmark, LuBell, LuUser, LuPanelLeft,
  LuFileText, LuBriefcase, LuMapPin, LuLink, LuPencil,
  LuGithub, LuLinkedin, LuMail, LuStar, LuEye, LuPlus
} from "react-icons/lu";
import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";
import "../styles/UserProfile.css";

// ---- Mock Data ----
const PROFILES = [
  { title: "Frontend Dev Resume", type: "resume", views: 142 },
  { title: "UI/UX Portfolio 2024", type: "resume", views: 89 },
  { title: "Full Stack Resume", type: "resume", views: 56 },
];
const SKILLS = ["React", "TypeScript", "Figma", "Node.js", "Tailwind CSS", "Python", "PostgreSQL", "Git"];
const EXP = [
  { icon: "💼", title: "Frontend Developer", company: "Tech Startup Co.", date: "2022 – ปัจจุบัน" },
  { icon: "🎨", title: "UX/UI Designer", company: "Creative Agency", date: "2020 – 2022" },
];

// ---- Component ----
export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("resumes");
  const [isSidebarOpen] = useState(true);

  // Ref สำหรับ scroll ไปที่ section Saved
  const savedSectionRef = useRef(null);

  const tabs = ["resumes", "jobs", "saved"];
  const tabLabels = { resumes: "Private Resumes", jobs: "Public Resumes", saved: "Saved" };

  const handleTabClick = (t) => {
    setActiveTab(t);
    if (t === "saved" && savedSectionRef.current) {
      setTimeout(() => {
        savedSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  return (
    <div className="up-page">
      {/* NAV */}
      <nav className="up-nav">
        <div className="up-nav-left">
          <button className="up-icon-btn"><LuPanelLeft /></button>
          <div className="up-nav-logo">PerFile</div>
          <div className="up-nav-search">
            <LuSearch style={{ color: "#9ca3af", fontSize: 15 }} />
            <input className="up-nav-search-input" placeholder="ค้นหา Username หรือ Company..." />
          </div>
        </div>
        <div className="up-nav-right">
          <button className="up-icon-btn"><LuBell /></button>
          <div className="up-user-dropdown">
            <LuUser style={{ fontSize: 16 }} />
            <span>Un know</span>
          </div>
        </div>
      </nav>

      <div className="up-body">
        {/* SIDEBAR */}
        {isSidebarOpen && (
          <aside className="up-sidebar">
            <button className="up-create-btn"><FiPlusSquare /> Create</button>
            <Link to="/feed" className="up-menu-item">
              <FiGrid /> Feed
            </Link>
            <button className="up-menu-item active">
              <FiHome /> Profile
            </button>
            <button
              className="up-menu-item"
              onClick={() => handleTabClick("saved")}
            >
              <LuBookmark /> Saved
            </button>

            <div className="up-section-title">PRIVATE PROFILE</div>
            <div className="up-sub-item">Development 1</div>
            <div className="up-sub-item">Tutor 1</div>

            <div className="up-section-title" style={{ color: "#6b7280" }}>PUBLIC PROFILE</div>
            <div className="up-sub-item">Ux/Ui 2</div>
          </aside>
        )}

        {/* MAIN */}
        <main className="up-main">
          {/* COVER + AVATAR */}
          <div className="up-cover-wrap">
            <div className="up-cover">
              <div className="up-cover-pattern" />
              <button className="up-edit-cover-btn"><LuPencil size={12} /> แก้ไขปก</button>
            </div>
            <div className="up-avatar">U</div>
          </div>

          {/* PROFILE INFO */}
          <div className="up-profile-info-row">
            <div>
              <div className="up-profile-name">Un know</div>
              <div className="up-profile-handle">@unknown · PerFile</div>
              <div className="up-profile-bio">
                Frontend Developer & UI/UX Designer ที่ชอบสร้างประสบการณ์ที่สวยงามและใช้งานได้จริง 🚀
              </div>
              <div className="up-profile-meta">
                <span className="up-meta-item"><LuMapPin size={12} /> Bangkok, Thailand</span>
                <a href="#" className="up-meta-link"><LuLink size={12} /> portfolio.dev</a>
                <span className="up-meta-item"><LuMail size={12} /> unknown@email.com</span>
              </div>
              <div className="up-social-row">
                <button className="up-social-btn"><LuGithub size={14} /> GitHub</button>
                <button className="up-social-btn"><LuLinkedin size={14} /> LinkedIn</button>
              </div>
            </div>
            <button className="up-edit-profile-btn"><LuPencil size={13} /> แก้ไขโปรไฟล์</button>
          </div>

          {/* STATS */}
          <div className="up-stats-row">
            {[
              { num: "3", label: "RESUMES" },
              { num: "287", label: "VIEWS" },
              { num: "14", label: "SAVED" },
              { num: "5", label: "JOBS POSTED" },
            ].map((s) => (
              <div key={s.label} className="up-stat-card">
                <div className="up-stat-num">{s.num}</div>
                <div className="up-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* SKILLS */}
          <div className="up-section-card">
            <div className="up-section-header">
              <span><LuStar size={14} style={{ marginRight: 6, verticalAlign: "middle", color: "#4f46e5" }} />ทักษะ</span>
              <button className="up-add-btn"><LuPlus size={12} /> เพิ่ม</button>
            </div>
            <div className="up-skills-wrap">
              {SKILLS.map((sk) => <span key={sk} className="up-skill-chip">{sk}</span>)}
            </div>
          </div>

          {/* EXPERIENCE */}
          <div className="up-section-card">
            <div className="up-section-header">
              <span><LuBriefcase size={14} style={{ marginRight: 6, verticalAlign: "middle", color: "#4f46e5" }} />ประสบการณ์</span>
              <button className="up-add-btn"><LuPlus size={12} /> เพิ่ม</button>
            </div>
            {EXP.map((e, i) => (
              <div key={i} className="up-exp-item">
                <div className="up-exp-dot">{e.icon}</div>
                <div>
                  <div className="up-exp-title">{e.title}</div>
                  <div className="up-exp-sub">{e.company}</div>
                  <div className="up-exp-date">{e.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div className="up-tab-bar">
            {tabs.map((t) => (
              <button
                key={t}
                className={`up-tab${activeTab === t ? " active" : ""}`}
                onClick={() => handleTabClick(t)}
              >
                {tabLabels[t]}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="up-cards-grid">
            {activeTab === "resumes" && (
              <>
                {PROFILES.map((p, i) => (
                  <div key={i} className="up-card">
                    <div
                      className="up-card-thumb"
                      style={{ background: `linear-gradient(135deg, #ede9fe ${i * 10}%, #c7d2fe 100%)` }}
                    />
                    <div className="up-card-info">
                      <div className="up-card-title">{p.title}</div>
                      <div className="up-card-meta">
                        <LuEye size={11} style={{ marginRight: 4 }} />{p.views} views
                      </div>
                      <span className="up-card-badge up-badge-resume">Resume</span>
                    </div>
                  </div>
                ))}
                <div className="up-add-card">
                  <LuPlus size={28} />
                  <span>เพิ่ม Resume</span>
                </div>
              </>
            )}
            {activeTab === "jobs" && (
              <div style={{ color: "#9ca3af", fontSize: 13, gridColumn: "1/-1", paddingTop: 16 }}>
                ยังไม่มีตำแหน่งงานที่โพสต์ไว้
              </div>
            )}
            {activeTab === "saved" && (
              <div
                ref={savedSectionRef}
                className="up-saved-section"
                style={{ gridColumn: "1/-1" }}
              >
                <p className="up-saved-empty">ยังไม่มีรายการที่บันทึกไว้</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
