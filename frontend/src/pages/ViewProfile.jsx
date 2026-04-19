import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  LuFileText, LuClock, LuMail, LuMapPin, LuBookmark,
  LuUser, LuExternalLink, LuPanelLeft, LuPlus,
  LuLayoutDashboard, LuBell, LuSearch
} from "react-icons/lu";
import { FiHome } from "react-icons/fi";

export default function ViewProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navbar states
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [myResumes, setMyResumes] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

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

  // Fetch profile
  useEffect(() => {
    if (!userId || userId === "undefined") return;
    const fetchFullProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:3000/profile/public/${userId}`);
        if (!res.ok) throw new Error("ไม่พบโปรไฟล์ผู้ใช้");
        const data = await res.json();
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

  // Fetch auth user
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setUserData((await res.json()).user);
      } catch (err) { console.error(err); }
    })();
  }, []);

  // Fetch my resumes (sidebar)
  useEffect(() => {
    const fetchMyResumes = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/resumes/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setMyResumes((await res.json()).resumes ?? []);
      } catch (err) { console.error(err); }
    };
    fetchMyResumes();
  }, []);

  // Fetch applied jobs (sidebar)
  useEffect(() => {
    const fetchApplied = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/applications/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setAppliedJobs((await res.json()).applications ?? []);
      } catch (err) { console.error(err); }
    };
    fetchApplied();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:3000/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setNotifications((await res.json()).notifications ?? []);
      } catch (err) { console.error(err); }
    };
    fetchNotifs();
  }, []);

  // Close notif on outside click
  useEffect(() => {
    const close = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const close = (e) => { if (!e.target.closest(".uf-user-area")) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggleSidebar = () => {
    if (sidebarOpen && sidebarRef.current) sidebarRef.current.style.width = "";
    setSidebarOpen(v => !v);
  };

  const initial = userData?.username?.[0]?.toUpperCase() ?? "U";
  const privateList = myResumes.filter(r => r.visibility === "private");
  const publicList = myResumes.filter(r => r.visibility === "public");

  const displayName = profile?.fullName || "ผู้ใช้";
  const profileInitial = displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="uf-page">

      {/* ── NAVBAR ── */}
      <nav className="uf-nav">
        <div className="uf-nav-left">
          <button className="uf-toggle-btn" onClick={toggleSidebar}>
            <LuPanelLeft />
          </button>
          <div className="uf-logo">Per<em>File</em><span className="uf-logo-badge">Seeker</span></div>

          {/* ✅ เพิ่มช่องค้นหา */}
          <div className="uf-search">
            <LuSearch />
            <input
              type="text"
              placeholder={`ค้นหาเรซูเม่ของ ${profile?.fullName || "ผู้ใช้"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="uf-nav-right">
          {/* Notification */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button className="uf-icon-btn" onClick={() => setNotifOpen(v => !v)} style={{ position: "relative" }}>
              <LuBell />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span style={{
                  position: "absolute", top: 4, right: 4,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#ef4444", border: "1.5px solid #fff",
                }} />
              )}
            </button>
            {notifOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: 300, background: "#fff", borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.13)", border: "1px solid #e5e7eb", zIndex: 999,
              }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontWeight: 700, fontSize: 14, color: "#111827" }}>
                  แจ้งเตือน
                </div>
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {notifications.length > 0 ? notifications.map((n, i) => (
                    <div key={n.id ?? i} style={{
                      padding: "10px 16px", borderBottom: "1px solid #f9fafb",
                      background: n.is_read ? "#fff" : "#f0f7ff",
                    }}>
                      <div style={{ fontSize: 13, color: "#111827" }}>{n.message ?? n.title}</div>
                    </div>
                  )) : (
                    <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>ยังไม่มีแจ้งเตือน</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="uf-user-area" style={{ position: "relative" }}>
            <div className="uf-user-chip" onClick={() => setMenuOpen(v => !v)}>
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
                <button className="uf-logout" onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="uf-body">

        {/* ── SIDEBAR ── */}
        <aside ref={sidebarRef} className={`uf-sidebar${sidebarOpen ? "" : " closed"}`}>
          <div className="uf-resize-handle"><div className="uf-resize-bar" /></div>
          <button className="uf-create-btn" onClick={() => navigate("/resume")}>
            <LuPlus /> Create Resume
          </button>
          <Link to="/feed" className="uf-menu-item">
            <LuLayoutDashboard /> Feed
          </Link>
          <button className="uf-menu-item" onClick={() => navigate("/profile")}>
            <FiHome /> Profile
          </button>
          <button className="uf-menu-item" onClick={() => navigate("/profile", { state: { scrollTo: "saved" } })}>
            <LuBookmark /> Saved
          </button>

          {appliedJobs.length > 0 && (
            <>
              <div className="uf-section-label">Jobs Applied</div>
              {appliedJobs.slice(0, 5).map(a => (
                <div key={a.id} className="uf-sub-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/jobs/${a.job_id}`)}>
                  💼 {a.jobs?.title ?? "งาน"}
                </div>
              ))}
            </>
          )}

          {resumes.length > 0 && (
            <>
              <div className="uf-section-label">
                เรซูเม่ของ {profile?.fullName || "ผู้ใช้"}
              </div>
              {resumes.map(r => (
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

        {/* ── MAIN CONTENT ── */}
        <main className="uf-main">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
              <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTop: "3px solid #1e3a8a", borderRadius: "50%", animation: "uf-spin 0.8s linear infinite", marginBottom: 12 }} />
              <span style={{ color: "#6b7280", fontSize: 14 }}>กำลังโหลดโปรไฟล์...</span>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>ไม่พบโปรไฟล์</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>{error}</div>
              <button onClick={() => navigate(-1)} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600 }}>
                กลับ
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 60px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ── Hero Card ── */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                {/* Banner */}
                <div style={{ height: 110, background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)" }} />

                {/* Avatar + Info */}
                <div style={{ display: "flex", gap: 20, padding: "0 28px 28px", alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    border: "4px solid #fff", overflow: "hidden",
                    background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, fontWeight: 800, color: "#fff",
                    marginTop: -40, flexShrink: 0,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    position: "relative", zIndex: 2,
                  }}>
                    {profile?.avatar
                      ? <img src={profile.avatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                      : profileInitial}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "12px 0 4px", letterSpacing: "-0.02em" }}>
                      {displayName}
                    </h1>

                    {/* Meta chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      {profile?.email && (
                        <span style={chipStyle}><LuMail size={11} /> {profile.email}</span>
                      )}
                      {profile?.location && (
                        <span style={chipStyle}><LuMapPin size={11} /> {profile.location}</span>
                      )}
                      {profile?.portfolio && (
                        <a href={profile.portfolio} target="_blank" rel="noreferrer" style={{ ...chipStyle, color: "#7c3aed", textDecoration: "none" }}>
                          🔗 {profile.portfolio}
                        </a>
                      )}
                    </div>

                    {/* GitHub / LinkedIn buttons */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {profile?.github && (
                        <a href={profile.github} target="_blank" rel="noreferrer" style={linkBtnStyle}>
                          GitHub ↗
                        </a>
                      )}
                      {profile?.linkedin && (
                        <a href={profile.linkedin} target="_blank" rel="noreferrer" style={{ ...linkBtnStyle, borderColor: "#0077b5", color: "#0077b5" }}>
                          LinkedIn ↗
                        </a>
                      )}
                    </div>

                    {profile?.bio && (
                      <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, marginTop: 10, maxWidth: 500 }}>
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Public Resumes ── */}
              {(() => {
                const filteredResumes = resumes.filter(r =>
                  !searchTerm.trim() ||
                  (r.title?.toLowerCase() || "").includes(searchTerm.trim().toLowerCase())
                );
                return (
                  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                      <LuFileText size={16} style={{ color: "#1e3a8a" }} />
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>เรซูเม่สาธารณะ</span>
                      <span style={{ background: "#eff6ff", color: "#1e3a8a", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>
                        {filteredResumes.length}
                      </span>
                    </div>

                    {filteredResumes.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>{searchTerm ? "🔍" : "📄"}</div>
                        <div style={{ fontSize: 14 }}>
                          {searchTerm ? `ไม่พบเรซูเม่ "${searchTerm}"` : "ยังไม่มีเรซูเม่สาธารณะ"}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                        {filteredResumes.map(resume => (
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
                );
              })()}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Resume Preview Card ──────────────────────────────────────
function ResumePreviewCard({ resume, onClick, onSave, isSaved }) {
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const cardRef = React.useRef(null);

  const displayDate = resume.published_at || resume.created_at
    ? new Date(resume.published_at || resume.created_at).toLocaleDateString("th-TH")
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
        background: "#fff", borderRadius: 12,
        border: "1px solid #e5e7eb", overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.15s",
        boxShadow: hovered ? "0 8px 28px rgba(30,58,138,0.13)" : "0 2px 8px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-2px)" : "none",
        position: "relative", display: "flex", flexDirection: "column",
      }}
    >
      {/* Save Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onSave(); }}
        style={{
          position: "absolute", top: 8, right: 8, zIndex: 10,
          background: isSaved ? "#1e3a8a" : "rgba(255,255,255,0.92)",
          border: isSaved ? "none" : "1.5px solid #e2e8f0",
          borderRadius: "50%", width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: isSaved ? "#fff" : "#6b7280",
        }}
      >
        <LuBookmark style={{ fill: isSaved ? "#fff" : "none" }} size={13} />
      </button>

      {/* Preview */}
      <div style={{ position: "relative", width: "100%", height: previewH, overflow: "hidden", background: "#f8fafc", flexShrink: 0 }}>
        {inView ? (
          <iframe
            src={`/view-resume/${resume.id}`}
            title={resume.title}
            scrolling="no"
            style={{ width: IFRAME_W, height: IFRAME_H, border: "none", transformOrigin: "top left", transform: `scale(${scale})`, pointerEvents: "none", userSelect: "none" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "vp-shimmer 1.4s infinite" }} />
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

const chipStyle = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 12, color: "#6b7280", background: "#f3f4f6",
  borderRadius: 20, padding: "3px 10px", fontWeight: 500,
};

const linkBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 12, color: "#374151", background: "#fff",
  border: "1.5px solid #d1d5db", borderRadius: 8,
  padding: "5px 12px", fontWeight: 600, textDecoration: "none", cursor: "pointer",
};

// Inject keyframes
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @keyframes uf-spin { to { transform: rotate(360deg); } }
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