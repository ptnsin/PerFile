import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LuArrowLeft, LuBadgeCheck, LuFileText, LuClock,
  LuMail, LuMapPin, LuBookmark, LuUser, LuExternalLink
} from "react-icons/lu";

// ─────────────────────────────────────────────────────────────────────
// ViewProfile — หน้าดูโปรไฟล์ผู้ใช้คนอื่น (public)
// Route: /view-profile/:userId
// ─────────────────────────────────────────────────────────────────────
export default function ViewProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Saved resumes (same source as UsersFeed)
  const [savedResumes, setSavedResumes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savedResumes") || "[]"); }
    catch { return []; }
  });

  const toggleSave = (resumeId) => {
    setSavedResumes(prev => {
      const next = prev.includes(resumeId)
        ? prev.filter(id => id !== resumeId)
        : [...prev, resumeId];
      localStorage.setItem("savedResumes", JSON.stringify(next));
      return next;
    });
  };

  // ปรับปรุง useEffect ใน ViewProfile.jsx
useEffect(() => {
  if (!userId || userId === "undefined") return;

  const fetchFullProfile = async () => {
    try {
      setLoading(true);
      // ใช้ Route ที่คุณสร้างไว้ใน Backend (ซึ่งรวมทั้ง User และ Resumes มาให้แล้ว)
      const res = await fetch(`http://localhost:3000/profile/public/${userId}`);
      
      if (!res.ok) throw new Error("ไม่พบโปรไฟล์ผู้ใช้");
      
      const data = await res.json();
      
      // data จะมีโครงสร้าง { user: {...}, resumes: [...] } ตามที่คุณเขียนใน Backend
      setProfile(data.user);
      setResumes(data.resumes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchFullProfile();
  fetch(`http://localhost:3000/profile/view/${userId}`, { method: "POST" });
}, [userId]);
  // ── Loading ──
  if (loading) return (
    <div style={styles.page}>
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <span style={{ color: "#6b7280", fontSize: 14, marginTop: 12 }}>กำลังโหลดโปรไฟล์...</span>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={styles.page}>
      <div style={styles.loadingWrap}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>ไม่พบโปรไฟล์</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>{error}</div>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <LuArrowLeft size={14} /> กลับ
        </button>
      </div>
    </div>
  );

  const displayName = profile?.fullName || profile?.username || "ผู้ใช้";
  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <div style={styles.page}>
      {/* ── Topbar ── */}
      <header style={styles.topbar}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <LuArrowLeft size={16} /> กลับ
        </button>
        <div style={styles.logoText}>Per<em>File</em><span style={styles.logoBadge}>Seeker</span></div>
      </header>

      <div style={styles.container}>
        {/* ── Profile Hero ── */}
        <div style={styles.heroCard}>
          {/* Banner */}
          <div style={styles.banner} />

          {/* Avatar + Info */}
          <div style={styles.heroBody}>
            <div style={styles.avatarWrap}>
              {profile?.avatar
                ? <img src={profile.avatar} alt={displayName} style={styles.avatarImg} crossOrigin="anonymous" />
                : <span style={styles.avatarInitial}>{initial}</span>}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={styles.displayName}>{displayName}</h1>
              {profile?.username && profile?.fullName && (
                <div style={styles.username}>@{profile.username}</div>
              )}

              <div style={styles.metaRow}>
                {profile?.email && (
                  <span style={styles.metaChip}><LuMail size={12} /> {profile.email}</span>
                )}
                {profile?.location && (
                  <span style={styles.metaChip}><LuMapPin size={12} /> {profile.location}</span>
                )}
                {profile?.role && (
                  <span style={{ ...styles.metaChip, background: "#eff6ff", color: "#1e3a8a", fontWeight: 700 }}>
                    <LuUser size={12} /> {profile.role}
                  </span>
                )}
              </div>

              {profile?.bio && (
                <p style={styles.bio}>{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Public Resumes ── */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <LuFileText size={16} style={{ color: "#1e3a8a" }} />
            <span style={styles.sectionTitle}>เรซูเม่สาธารณะ</span>
            <span style={styles.countBadge}>{resumes.length}</span>
          </div>

          {resumes.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, color: "#9ca3af" }}>ยังไม่มีเรซูเม่สาธารณะ</div>
            </div>
          ) : (
            <div style={styles.resumeGrid}>
              {resumes.map(resume => (
                <ResumePreviewCard
                  key={resume.id}
                  resume={resume}
                  isSaved={savedResumes.includes(resume.id)}
                  onSave={() => toggleSave(resume.id)}
                  onClick={() => navigate(`/view-resume/${resume.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Resume Preview Card (mini version) ──────────────────────────────
function ResumePreviewCard({ resume, onClick, onSave, isSaved }) {
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const cardRef = React.useRef(null);

  const displayDate = resume.published_at || resume.publishedAt
    ? new Date(resume.published_at || resume.publishedAt).toLocaleDateString("th-TH")
    : "—";

  const CARD_W = 220;
  const IFRAME_W = 794;
  const IFRAME_H = 1123;
  const scale = CARD_W / IFRAME_W;
  const previewH = Math.round((IFRAME_H / 2) * scale);

  React.useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.15s",
        boxShadow: hovered ? "0 8px 28px rgba(30,58,138,0.13)" : "0 2px 8px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-2px)" : "none",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Save Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onSave(); }}
        title={isSaved ? "Unsave" : "Save"}
        style={{
          position: "absolute", top: 8, right: 8, zIndex: 10,
          background: isSaved ? "#1e3a8a" : "rgba(255,255,255,0.92)",
          border: isSaved ? "none" : "1.5px solid #e2e8f0",
          borderRadius: "50%", width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          color: isSaved ? "#fff" : "#6b7280", fontSize: 13,
          transition: "background 0.2s",
        }}
      >
        <LuBookmark style={{ fill: isSaved ? "#fff" : "none" }} size={13} />
      </button>

      {/* Preview */}
      <div style={{
        position: "relative", width: "100%", height: previewH,
        overflow: "hidden", background: "#f8fafc", flexShrink: 0,
      }}>
        {inView ? (
          <iframe
            src={`/view-resume/${resume.id}`}
            title={resume.title}
            scrolling="no"
            style={{
              width: IFRAME_W, height: IFRAME_H, border: "none",
              transformOrigin: "top left", transform: `scale(${scale})`,
              pointerEvents: "none", userSelect: "none",
            }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)",
            backgroundSize: "200% 100%", animation: "vp-shimmer 1.4s infinite",
          }} />
        )}
        {hovered && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(30,58,138,0.06)", borderRadius: 0,
          }} />
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {resume.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af" }}>
          <LuClock size={11} /> {displayDate}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3, color: "#3b82f6", fontWeight: 600, fontSize: 11 }}>
            <LuExternalLink size={11} /> ดูเรซูเม่
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', 'Noto Sans Thai', sans-serif",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "0 24px",
    height: 56,
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 8,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  logoText: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1e3a8a",
    letterSpacing: "-0.03em",
  },
  logoBadge: {
    background: "#1e3a8a",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 6,
    padding: "1px 6px",
    marginLeft: 4,
    letterSpacing: 0,
    verticalAlign: "middle",
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "28px 20px 60px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  heroCard: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  banner: {
    height: 100,
    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)",
  },
  heroBody: {
    display: "flex",
    gap: 20,
    padding: "0 28px 28px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    border: "4px solid #fff",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    overflow: "hidden",
    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
  },
  displayName: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    margin: "12px 0 2px",
    letterSpacing: "-0.02em",
  },
  username: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  metaChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "#6b7280",
    background: "#f3f4f6",
    borderRadius: 20,
    padding: "3px 10px",
    fontWeight: 500,
  },
  bio: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 1.6,
    marginTop: 4,
    maxWidth: 500,
  },
  section: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    padding: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
  },
  countBadge: {
    background: "#eff6ff",
    color: "#1e3a8a",
    borderRadius: 10,
    padding: "1px 8px",
    fontSize: 11,
    fontWeight: 700,
  },
  resumeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
  },
  emptyBox: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#9ca3af",
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #1e3a8a",
    borderRadius: "50%",
    animation: "vp-spin 0.8s linear infinite",
  },
};

// Inject keyframes
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @keyframes vp-spin { to { transform: rotate(360deg); } }
    @keyframes vp-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  if (!document.head.querySelector("[data-vp-styles]")) {
    styleEl.setAttribute("data-vp-styles", "1");
    document.head.appendChild(styleEl);
  }
}