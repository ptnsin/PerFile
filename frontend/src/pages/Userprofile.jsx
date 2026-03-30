import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LuSearch, LuBookmark, LuBell, LuUser, LuPanelLeft,
  LuFileText, LuBriefcase, LuMapPin, LuLink, LuPencil,
  LuGithub, LuLinkedin, LuMail, LuStar, LuEye, LuPlus
} from "react-icons/lu";
import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";


// ---- Inline styles (no external CSS needed) ----
const S = {
  // Layout
  page: {
    minHeight: "100vh",
    background: "#f7f8fa",
    fontFamily: "'Sarabun', 'Inter', sans-serif",
    color: "#1a1a2e",
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 56,
    background: "#fff",
    borderBottom: "1px solid #eee",
    gap: 16,
  },
  navLeft: { display: "flex", alignItems: "center", gap: 12 },
  navLogo: { fontWeight: 800, fontSize: 18, color: "#4f46e5", letterSpacing: "-0.5px" },
  navSearch: {
    display: "flex", alignItems: "center",
    background: "#f3f4f6", borderRadius: 8,
    padding: "6px 12px", gap: 8, width: 260,
  },
  navSearchInput: {
    border: "none", background: "transparent",
    outline: "none", fontSize: 13, color: "#374151", width: "100%",
  },
  navRight: { display: "flex", alignItems: "center", gap: 12 },
  iconBtn: {
    border: "none", background: "transparent",
    cursor: "pointer", color: "#6b7280",
    display: "flex", alignItems: "center", fontSize: 18,
    padding: 6, borderRadius: 6,
  },
  userDropdown: {
    display: "flex", alignItems: "center", gap: 6,
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151",
  },
  // Body layout
  body: { display: "flex", minHeight: "calc(100vh - 56px)" },
  sidebar: {
    width: 220, flexShrink: 0,
    background: "#fff", borderRight: "1px solid #eee",
    padding: "20px 12px", display: "flex", flexDirection: "column", gap: 8,
  },
  createBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#4f46e5", color: "#fff",
    border: "none", borderRadius: 8, padding: "9px 14px",
    cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 8,
    width: "100%",
  },
  menuItem: {
    display: "flex", alignItems: "center", gap: 8,
    background: "transparent", border: "none",
    color: "#6b7280", fontSize: 13, fontWeight: 500,
    padding: "9px 12px", borderRadius: 8, cursor: "pointer",
    width: "100%", textAlign: "left", textDecoration: "none",
  },
  menuItemActive: {
    background: "#ede9fe", color: "#4f46e5", fontWeight: 700,
  },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#9ca3af", padding: "10px 12px 4px", letterSpacing: 1 },
  subItem: { fontSize: 12, color: "#6b7280", padding: "6px 16px", cursor: "pointer", borderRadius: 6 },
  // Main
  main: { flex: 1, maxWidth: 860, margin: "0 auto", padding: "32px 24px" },
  // Cover
  coverWrap: { position: "relative", marginBottom: 80 },
  cover: {
    width: "100%", height: 180, borderRadius: 16,
    background: "linear-gradient(135deg,#4f46e5 0%,#818cf8 60%,#c7d2fe 100%)",
    position: "relative", overflow: "hidden",
  },
  coverPattern: {
    position: "absolute", inset: 0,
    backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)",
  },
  avatar: {
    position: "absolute", bottom: -52, left: 32,
    width: 96, height: 96, borderRadius: "50%",
    border: "4px solid #fff", background: "#c7d2fe",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 36, fontWeight: 700, color: "#4f46e5",
    boxShadow: "0 4px 16px rgba(79,70,229,0.2)",
  },
  editCoverBtn: {
    position: "absolute", bottom: 12, right: 12,
    background: "rgba(255,255,255,0.85)", border: "none",
    borderRadius: 8, padding: "6px 12px", cursor: "pointer",
    fontSize: 12, fontWeight: 600, color: "#374151",
    display: "flex", alignItems: "center", gap: 5,
  },
  // Profile info row
  profileInfoRow: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    paddingLeft: 148, marginBottom: 20,
  },
  profileName: { fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 2 },
  profileHandle: { fontSize: 13, color: "#9ca3af", marginBottom: 6 },
  profileBio: { fontSize: 13, color: "#374151", maxWidth: 420, lineHeight: 1.6 },
  profileMeta: { display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" },
  metaItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" },
  metaLink: { color: "#4f46e5", textDecoration: "none", fontSize: 12 },
  editProfileBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#fff", border: "1.5px solid #e5e7eb",
    borderRadius: 8, padding: "8px 16px",
    cursor: "pointer", fontSize: 13, fontWeight: 600,
    color: "#374151", whiteSpace: "nowrap",
    alignSelf: "flex-start",
  },
  // Stats
  statsRow: {
    display: "flex", gap: 16, marginBottom: 28,
    paddingLeft: 0,
  },
  statCard: {
    flex: 1, background: "#fff", border: "1px solid #eee",
    borderRadius: 12, padding: "14px 20px",
    display: "flex", flexDirection: "column", gap: 2,
  },
  statNum: { fontSize: 22, fontWeight: 800, color: "#4f46e5" },
  statLabel: { fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: 0.5 },
  // Tabs
  tabBar: {
    display: "flex", gap: 2, borderBottom: "1.5px solid #eee", marginBottom: 24,
  },
  tab: {
    padding: "10px 20px", background: "transparent",
    border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 600, color: "#9ca3af",
    borderBottom: "2px solid transparent", marginBottom: -1.5,
  },
  tabActive: { color: "#4f46e5", borderBottomColor: "#4f46e5" },
  // Cards grid
  cardsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16,
  },
  card: {
    background: "#fff", borderRadius: 12,
    border: "1px solid #eee", overflow: "hidden",
    cursor: "pointer", transition: "box-shadow 0.18s",
  },
  cardThumb: {
    width: "100%", height: 110,
    background: "linear-gradient(135deg,#ede9fe 0%,#c7d2fe 100%)",
  },
  cardInfo: { padding: "12px 14px" },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 },
  cardMeta: { fontSize: 11, color: "#9ca3af" },
  cardBadge: {
    display: "inline-block", fontSize: 10, fontWeight: 700,
    padding: "2px 8px", borderRadius: 20, marginTop: 6,
  },
  resumeBadge: { background: "#ede9fe", color: "#4f46e5" },
  jobBadge: { background: "#d1fae5", color: "#059669" },
  addCard: {
    border: "1.5px dashed #c7d2fe", borderRadius: 12,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 8, minHeight: 180, cursor: "pointer",
    color: "#a5b4fc", fontSize: 13, fontWeight: 600,
    background: "transparent",
  },
  // Skills section
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 0 },
  skillChip: {
    background: "#ede9fe", color: "#4f46e5",
    fontSize: 12, fontWeight: 600,
    padding: "4px 12px", borderRadius: 20,
  },
  sectionCard: {
    background: "#fff", border: "1px solid #eee",
    borderRadius: 12, padding: "20px 24px", marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14, fontWeight: 800, color: "#111827",
    marginBottom: 14, display: "flex", alignItems: "center",
    justifyContent: "space-between",
  },
  addBtn: {
    display: "flex", alignItems: "center", gap: 4,
    background: "transparent", border: "1px solid #e5e7eb",
    borderRadius: 6, padding: "4px 10px",
    cursor: "pointer", fontSize: 12, color: "#6b7280",
  },
  // Experience
  expItem: { display: "flex", gap: 14, marginBottom: 16 },
  expDot: {
    width: 36, height: 36, borderRadius: 8,
    background: "#ede9fe", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: 18, flexShrink: 0,
  },
  expTitle: { fontSize: 13, fontWeight: 700, color: "#111827" },
  expSub: { fontSize: 12, color: "#6b7280" },
  expDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  // Social links
  socialRow: { display: "flex", gap: 10 },
  socialBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#f3f4f6", border: "none",
    borderRadius: 8, padding: "8px 14px",
    cursor: "pointer", fontSize: 12, color: "#374151", fontWeight: 500,
  },
};

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

  const tabs = ["resumes", "jobs", "saved"];
  const tabLabels = { resumes: "Private Resumes", jobs: "Public Resumes", saved: "Saved" };

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navLeft}>
          <button style={S.iconBtn}><LuPanelLeft /></button>
          <div style={S.navLogo}>PerFile</div>
          <div style={S.navSearch}>
            <LuSearch style={{ color: "#9ca3af", fontSize: 15 }} />
            <input style={S.navSearchInput} placeholder="ค้นหา Username หรือ Company..." />
          </div>
        </div>
        <div style={S.navRight}>
          <button style={S.iconBtn}><LuBell /></button>
          <div style={S.userDropdown}>
            <LuUser style={{ fontSize: 16 }} />
            <span>Un know</span>
          </div>
        </div>
      </nav>

      <div style={S.body}>
        {/* SIDEBAR */}
        {isSidebarOpen && (
          <aside style={S.sidebar}>
            <button style={S.createBtn}><FiPlusSquare /> Create</button>
            <Link to="/feed" style={{ ...S.menuItem, textDecoration: "none" }}>
              <FiGrid /> Feed
            </Link>
            <button style={{ ...S.menuItem, ...S.menuItemActive }}>
              <FiHome /> Profile
            </button>
            <button style={S.menuItem}><LuBookmark /> Saved</button>

            <div style={S.sectionTitle}>PRIVATE PROFILE</div>
            <div style={S.subItem}>Development 1</div>
            <div style={S.subItem}>Tutor 1</div>

            <div style={{ ...S.sectionTitle, color: "#6b7280" }}>PUBLIC PROFILE</div>
            <div style={S.subItem}>Ux/Ui 2</div>
          </aside>
        )}

        {/* MAIN */}
        <main style={S.main}>
          {/* COVER + AVATAR */}
          <div style={S.coverWrap}>
            <div style={S.cover}>
              <div style={S.coverPattern} />
              <button style={S.editCoverBtn}><LuPencil size={12} /> แก้ไขปก</button>
            </div>
            <div style={S.avatar}>U</div>
          </div>

          {/* PROFILE INFO */}
          <div style={S.profileInfoRow}>
            <div>
              <div style={S.profileName}>Un know</div>
              <div style={S.profileHandle}>@unknown · PerFile</div>
              <div style={S.profileBio}>
                Frontend Developer & UI/UX Designer ที่ชอบสร้างประสบการณ์ที่สวยงามและใช้งานได้จริง 🚀
              </div>
              <div style={S.profileMeta}>
                <span style={S.metaItem}><LuMapPin size={12} /> Bangkok, Thailand</span>
                <a href="#" style={S.metaLink}><LuLink size={12} /> portfolio.dev</a>
                <span style={S.metaItem}><LuMail size={12} /> unknown@email.com</span>
              </div>
              <div style={{ ...S.socialRow, marginTop: 12 }}>
                <button style={S.socialBtn}><LuGithub size={14} /> GitHub</button>
                <button style={S.socialBtn}><LuLinkedin size={14} /> LinkedIn</button>
              </div>
            </div>
            <button style={S.editProfileBtn}><LuPencil size={13} /> แก้ไขโปรไฟล์</button>
          </div>

          {/* STATS */}
          <div style={S.statsRow}>
            {[
              { num: "3", label: "RESUMES" },
              { num: "287", label: "VIEWS" },
              { num: "14", label: "SAVED" },
              { num: "5", label: "JOBS POSTED" },
            ].map((s) => (
              <div key={s.label} style={S.statCard}>
                <div style={S.statNum}>{s.num}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* SKILLS */}
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <span><LuStar size={14} style={{ marginRight: 6, verticalAlign: "middle", color: "#4f46e5" }} />ทักษะ</span>
              <button style={S.addBtn}><LuPlus size={12} /> เพิ่ม</button>
            </div>
            <div style={S.skillsWrap}>
              {SKILLS.map((sk) => <span key={sk} style={S.skillChip}>{sk}</span>)}
            </div>
          </div>

          {/* EXPERIENCE */}
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <span><LuBriefcase size={14} style={{ marginRight: 6, verticalAlign: "middle", color: "#4f46e5" }} />ประสบการณ์</span>
              <button style={S.addBtn}><LuPlus size={12} /> เพิ่ม</button>
            </div>
            {EXP.map((e, i) => (
              <div key={i} style={S.expItem}>
                <div style={S.expDot}>{e.icon}</div>
                <div>
                  <div style={S.expTitle}>{e.title}</div>
                  <div style={S.expSub}>{e.company}</div>
                  <div style={S.expDate}>{e.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* TABS + CONTENT */}
          <div style={S.tabBar}>
            {tabs.map((t) => (
              <button
                key={t}
                style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }}
                onClick={() => setActiveTab(t)}
              >
                {tabLabels[t]}
              </button>
            ))}
          </div>

          <div style={S.cardsGrid}>
            {activeTab === "resumes" && (
              <>
                {PROFILES.map((p, i) => (
                  <div key={i} style={S.card}>
                    <div style={{ ...S.cardThumb, background: `linear-gradient(135deg, #ede9fe ${i * 10}%, #c7d2fe 100%)` }} />
                    <div style={S.cardInfo}>
                      <div style={S.cardTitle}>{p.title}</div>
                      <div style={S.cardMeta}>
                        <LuEye size={11} style={{ marginRight: 4 }} />{p.views} views
                      </div>
                      <span style={{ ...S.cardBadge, ...S.resumeBadge }}>Resume</span>
                    </div>
                  </div>
                ))}
                <div style={S.addCard}>
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
              <div style={{ color: "#9ca3af", fontSize: 13, gridColumn: "1/-1", paddingTop: 16 }}>
                ยังไม่มีรายการที่บันทึกไว้
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
