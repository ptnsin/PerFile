import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuSearch, LuBookmark, LuBell, LuUser, LuPanelLeft,
  LuFileText, LuBriefcase, LuMapPin, LuLink, LuPencil,
  LuGithub, LuLinkedin, LuMail, LuStar, LuEye, LuPlus, LuTrash2
} from "react-icons/lu";
import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";
import { useResumes } from "./ResumeContext"; // ← import Context
import "../styles/UserProfile.css";

// ---- Mock Data ----
const SKILLS = ["React", "TypeScript", "Figma", "Node.js", "Tailwind CSS", "Python", "PostgreSQL", "Git"];
const EXP = [
  { icon: "💼", title: "Frontend Developer", company: "Tech Startup Co.", date: "2022 – ปัจจุบัน" },
  { icon: "🎨", title: "UX/UI Designer", company: "Creative Agency", date: "2020 – 2022" },
];

// ---- Component ----
export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("resumes");
  const [isSidebarOpen] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // ← confirm ก่อนลบ

  const { privateResumes, removePrivate } = useResumes(); // ← ดึงข้อมูลจาก Context
  const navigate = useNavigate();

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

  const handleDelete = (id) => {
    removePrivate(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="up-page">

      {/* Modal ยืนยันลบ */}
      {deleteConfirmId !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: "28px 32px",
            maxWidth: 360, width: "90%", textAlign: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "#111" }}>
              ลบ Resume นี้?
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
              ไม่สามารถกู้คืนได้หลังจากลบแล้ว
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                  background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "none",
                  background: "#ef4444", color: "#fff", cursor: "pointer",
                  fontSize: 13, fontWeight: 600
                }}
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

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
            <button className="up-create-btn" onClick={() => navigate("/resume")}>
              <FiPlusSquare /> Create
            </button>
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
              { num: privateResumes.length.toString(), label: "RESUMES" },
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
                {/* แสดงจำนวน badge ของ Private Resumes */}
                {t === "resumes" && privateResumes.length > 0 && (
                  <span style={{
                    marginLeft: 6, background: "#4f46e5", color: "#fff",
                    borderRadius: 99, fontSize: 11, padding: "1px 7px", fontWeight: 700
                  }}>
                    {privateResumes.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="up-cards-grid">

            {/* ── Private Resumes Tab ── */}
            {activeTab === "resumes" && (
              <>
                {privateResumes.length > 0 ? (
                  privateResumes.map((p, i) => (
                    <div key={p.id} className="up-card" style={{ position: "relative" }}>
                      <div
                        className="up-card-thumb"
                        style={{ background: `linear-gradient(135deg, #ede9fe ${i * 10}%, #c7d2fe 100%)` }}
                      />
                      <div className="up-card-info">
                        <div className="up-card-title">{p.title}</div>
                        <div className="up-card-meta" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ color: "#9ca3af", fontSize: 11 }}>
                            🔒 Private · {p.createdAt}
                          </span>
                          {/* ปุ่มลบ */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(p.id);
                            }}
                            title="ลบ Resume"
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "#ef4444", padding: "2px 4px", borderRadius: 4,
                              display: "flex", alignItems: "center", gap: 3,
                              fontSize: 12, fontWeight: 600,
                              transition: "background 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                          >
                            <LuTrash2 size={13} /> ลบ
                          </button>
                        </div>
                        <span className="up-card-badge up-badge-resume">Resume</span>
                      </div>
                    </div>
                  ))
                ) : (
                  // ยังไม่มี Resume → แสดงปุ่มสร้าง
                  <div style={{
                    gridColumn: "1/-1", textAlign: "center",
                    padding: "40px 0", color: "#9ca3af"
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                    <div style={{ fontSize: 14, marginBottom: 16 }}>ยังไม่มี Resume ที่บันทึกไว้</div>
                    <button
                      onClick={() => navigate("/resume")}
                      style={{
                        background: "#4f46e5", color: "#fff", border: "none",
                        borderRadius: 8, padding: "10px 22px", cursor: "pointer",
                        fontSize: 14, fontWeight: 600, display: "inline-flex",
                        alignItems: "center", gap: 6
                      }}
                    >
                      <LuPlus size={15} /> สร้าง Resume แรก
                    </button>
                  </div>
                )}

                {/* ปุ่มเพิ่ม Resume (แสดงเฉพาะเมื่อมี resume อยู่แล้ว) */}
                {privateResumes.length > 0 && (
                  <div className="up-add-card" onClick={() => navigate("/resume")}>
                    <LuPlus size={28} />
                    <span>เพิ่ม Resume</span>
                  </div>
                )}
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
