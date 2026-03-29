
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LuSearch, LuBookmark, LuBell, LuUser, LuPanelLeft,
  LuFileText, LuBriefcase, LuEye, LuTrash2, LuFilter,
  LuFolderOpen, LuX, LuPlus,
} from "react-icons/lu";
import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";
const C = {
  indigo: "#0284c7", // Sky blue 600 - "ฟ้าคราม"
  indigoLight: "#e0f2fe", // Sky blue 100
  indigoMid: "#38bdf8", // Sky blue 400
  green: "#0d9488", // Teal 600
  greenLight: "#ccfbf1", // Teal 100
  red: "#e11d48", // Rose 600
  redLight: "#ffe4e6", // Rose 100
  bg: "#f8fafc", // Slate 50
  white: "#ffffff",
  border: "#e2e8f0", // Slate 200
  text: "#0f172a", // Slate 900
  sub: "#475569", // Slate 600
  muted: "#94a3b8", // Slate 400
};
const S = {
  page: { minHeight: "100vh", background: C.bg, fontFamily: "'Inter', 'Sarabun', sans-serif", color: C.text },
  // NAV
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 28px", height: 60,
    background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(8px)",
    borderBottom: `1px solid ${C.border}`, gap: 16,
  },
  navLeft: { display: "flex", alignItems: "center", gap: 14 },
  navLogo: { fontWeight: 800, fontSize: 19, color: C.indigo, letterSpacing: "-0.5px" },
  navSearch: {
    display: "flex", alignItems: "center",
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "8px 14px", gap: 8, width: 280,
    transition: "all 0.2s ease",
  },
  navInput: { border: "none", background: "transparent", outline: "none", fontSize: 13, color: C.text, width: "100%" },
  navRight: { display: "flex", alignItems: "center", gap: 14 },
  iconBtn: { border: "none", background: "transparent", cursor: "pointer", color: C.sub, display: "flex", alignItems: "center", fontSize: 18, padding: 8, borderRadius: 8, transition: "background 0.2s" },
  userDrop: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.text },
  // BODY
  body: { display: "flex", minHeight: "calc(100vh - 60px)" },
  sidebar: {
    width: 240, flexShrink: 0,
    background: C.white, borderRight: `1px solid ${C.border}`,
    padding: "24px 16px", display: "flex", flexDirection: "column", gap: 8,
  },
  createBtn: {
    display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
    background: `linear-gradient(135deg, ${C.indigo}, #0369a1)`, color: C.white,
    border: "none", borderRadius: 10, padding: "10px 16px",
    cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 16, width: "100%",
    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.2)",
  },
  menuItem: {
    display: "flex", alignItems: "center", gap: 10,
    background: "transparent", border: "none",
    color: C.sub, fontSize: 13, fontWeight: 600,
    padding: "10px 14px", borderRadius: 8, cursor: "pointer",
    width: "100%", textAlign: "left", textDecoration: "none",
    transition: "all 0.2s"
  },
  menuActive: { background: C.indigoLight, color: C.indigo, fontWeight: 700 },
  secTitle: { fontSize: 11, fontWeight: 700, color: C.muted, padding: "16px 14px 6px", letterSpacing: 1.2 },
  subItem: { fontSize: 12, color: C.sub, padding: "8px 18px", cursor: "pointer", borderRadius: 6, fontWeight: 500 },
  // MAIN
  main: { flex: 1, padding: "36px 40px 60px", maxWidth: 1040, margin: "0 auto" },
  pageHeader: { marginBottom: 32 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 12, marginBottom: 6 },
  pageSub: { fontSize: 14, color: C.sub, fontWeight: 500 },
  // TOOLBAR
  toolbar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" },
  tabGroup: { display: "flex", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, gap: 4 },
  tabBtn: {
    display: "flex", alignItems: "center", gap: 6,
    border: "none", background: "transparent",
    borderRadius: 8, padding: "8px 16px",
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.sub,
    transition: "all 0.2s",
  },
  tabBtnActive: { background: C.white, color: C.indigo, boxShadow: "0 2px 6px rgba(0,0,0,0.05)" },
  spacer: { flex: 1 },
  filterBtn: {
    display: "flex", alignItems: "center", gap: 6,
    border: `1px solid ${C.border}`, background: C.white,
    borderRadius: 10, padding: "8px 16px",
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.text,
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  searchBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: C.white, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "8px 14px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  searchInput: { border: "none", outline: "none", fontSize: 13, color: C.text, background: "transparent", width: 180 },
  // COLLECTION ROW
  collectionRow: { display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" },
  collectionChip: {
    display: "flex", alignItems: "center", gap: 8,
    border: `1.5px solid ${C.border}`, background: C.white,
    borderRadius: 24, padding: "6px 16px",
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.sub,
    transition: "all 0.2s",
  },
  collectionChipActive: { borderColor: C.indigo, background: C.indigoLight, color: C.indigo, boxShadow: "0 2px 8px rgba(2, 132, 199, 0.15)" },
  collectionCount: {
    background: C.bg, color: C.sub,
    fontSize: 11, fontWeight: 700,
    borderRadius: 20, padding: "2px 8px",
  },
  collectionCountActive: { background: C.indigo, color: C.white },
  addCollectionChip: {
    display: "flex", alignItems: "center", gap: 6,
    border: `1.5px dashed ${C.indigoMid}`, background: "transparent",
    borderRadius: 24, padding: "6px 16px",
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.indigo,
  },
  // GRID
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px,1fr))", gap: 20 },
  card: {
    background: C.white, borderRadius: 16,
    border: `1px solid ${C.border}`, overflow: "hidden",
    cursor: "pointer", position: "relative",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    transition: "all 0.2s",
  },
  cardThumbResume: { width: "100%", height: 130, background: `linear-gradient(135deg, ${C.indigoLight} 0%, ${C.indigoMid} 100%)` },
  cardThumbJob: { width: "100%", height: 130, background: `linear-gradient(135deg, ${C.greenLight} 0%, ${C.green} 100%)` },
  cardBody: { padding: "16px" },
  cardName: { fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: C.sub, marginBottom: 8 },
  cardMeta: { display: "flex", alignItems: "center", gap: 12 },
  badge: { fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 },
  resumeBadge: { background: C.indigoLight, color: C.indigo },
  jobBadge: { background: C.greenLight, color: C.green },
  viewsText: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.muted, fontWeight: 500 },
  // Remove btn overlay
  removeBtn: {
    position: "absolute", top: 10, right: 10,
    background: "rgba(255,255,255,0.95)", border: "none",
    borderRadius: 8, padding: "6px",
    cursor: "pointer", color: C.red, fontSize: 16,
    display: "flex", alignItems: "center",
    opacity: 0, transition: "opacity 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  // Empty state
  empty: {
    gridColumn: "1/-1",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "80px 0", gap: 16, color: C.muted,
  },
  emptyIcon: { fontSize: 56, marginBottom: 8, color: C.indigoLight },
  emptyText: { fontSize: 16, fontWeight: 700, color: C.text },
  emptyDesc: { fontSize: 14, color: C.sub },
};

// ─── Mock Data ────────────────────────────────────────────────────
const SAVED_ITEMS = [
  { id: 1, type: "resume", title: "Senior Frontend Dev", owner: "@patcharapon", views: 312, collection: "งาน" },
  { id: 2, type: "job",    title: "UX Designer @ Agoda", owner: "Agoda",          views: 89,  collection: "งาน" },
  { id: 3, type: "resume", title: "Full Stack Engineer", owner: "@nueng_dev",     views: 204, collection: "แรงบันดาลใจ" },
  { id: 4, type: "resume", title: "Data Scientist CV",   owner: "@minsiri",       views: 145, collection: "แรงบันดาลใจ" },
  { id: 5, type: "job",    title: "React Dev @ SCB",     owner: "SCB Tech",       views: 67,  collection: "งาน" },
  { id: 6, type: "resume", title: "Motion Designer",     owner: "@korn.design",   views: 178, collection: "ทั้งหมด" },
];
const COLLECTIONS = [
  { label: "ทั้งหมด", key: "all" },
  { label: "งาน",     key: "งาน" },
];
export default function SavedPage() {
  const [activeType, setActiveType] = useState("all");   // all | resume | job
  const [activeCol,  setActiveCol]  = useState("all");
  const [search,     setSearch]     = useState("");
  const [items,      setItems]      = useState(SAVED_ITEMS);
  const [hoveredId,  setHoveredId]  = useState(null);
  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const filtered = items.filter((item) => {
    const matchType = activeType === "all" || item.type === activeType;
    const matchCol  = activeCol  === "all" || item.collection === activeCol;
    const matchSrch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                      item.owner.toLowerCase().includes(search.toLowerCase());
    return matchType && matchCol && matchSrch;
  });
  const countFor = (key) =>
    key === "all" ? items.length : items.filter((i) => i.collection === key).length;
  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navLeft}>
          <button style={S.iconBtn}><LuPanelLeft /></button>
          <div style={S.navLogo}>PerFile</div>
          <div style={S.navSearch}>
            <LuSearch style={{ color: C.muted, fontSize: 15 }} />
            <input style={S.navInput} placeholder="ค้นหา Username หรือ Company..." />
          </div>
        </div>
        <div style={S.navRight}>
          <button style={S.iconBtn}><LuBell /></button>
          <div style={S.userDrop}><LuUser style={{ fontSize: 16 }} /><span>Un know</span></div>
        </div>
      </nav>
      <div style={S.body}>
        {/* SIDEBAR */}
        <aside style={S.sidebar}>
          <button style={S.createBtn}><FiPlusSquare /> Create</button>
          <Link to="/feed" style={{ ...S.menuItem, textDecoration: "none" }}><FiGrid /> Feed</Link>
          <button style={S.menuItem}><FiHome /> Profile</button>
          <button style={{ ...S.menuItem, ...S.menuActive }}><LuBookmark /> Saved</button>
          <div style={S.secTitle}>PRIVATE PROFILE</div>
          <div style={S.subItem}>Development 1</div>
          <div style={S.subItem}>Tutor 1</div>
          <div style={{ ...S.secTitle, color: "#6b7280" }}>PUBLIC PROFILE</div>
          <div style={S.subItem}>Ux/Ui 2</div>
        </aside>
        {/* MAIN */}
        <main style={S.main}>
          {/* Header */}
          <div style={S.pageHeader}>
            <div style={S.pageTitle}>
              <LuBookmark size={20} color={C.indigo} />
              รายการที่บันทึกไว้
            </div>
            <div style={S.pageSub}>{items.length} รายการ · จัดเป็น {COLLECTIONS.length - 1} คอลเลกชัน</div>
          </div>
          {/* Toolbar */}
          <div style={S.toolbar}>
            {/* Type tabs */}
            <div style={S.tabGroup}>
              {[
                { key: "all",    label: "ทั้งหมด",  icon: null },
                { key: "resume", label: "Resume",   icon: <LuFileText size={12} /> },
                { key: "job",    label: "Job",      icon: <LuBriefcase size={12} /> },
              ].map((t) => (
                <button
                  key={t.key}
                  style={{ ...S.tabBtn, ...(activeType === t.key ? S.tabBtnActive : {}) }}
                  onClick={() => setActiveType(t.key)}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            <div style={S.spacer} />
            {/* Search */}
            <div style={S.searchBox}>
              <LuSearch size={13} color={C.muted} />
              <input
                style={S.searchInput}
                placeholder="ค้นหาในรายการบันทึก..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ ...S.iconBtn, padding: 2, fontSize: 13 }}>
                  <LuX />
                </button>
              )}
            </div>
            <button style={S.filterBtn}><LuFilter size={13} /> กรอง</button>
          </div>
          {/* Collection chips */}
          <div style={S.collectionRow}>
            {COLLECTIONS.map((c) => (
              <button
                key={c.key}
                style={{ ...S.collectionChip, ...(activeCol === c.key ? S.collectionChipActive : {}) }}
                onClick={() => setActiveCol(c.key)}
              >
                {c.label}
                <span style={{ ...S.collectionCount, ...(activeCol === c.key ? S.collectionCountActive : {}) }}>
                  {countFor(c.key)}
                </span>
              </button>
            ))}
            <button style={S.addCollectionChip}><LuPlus size={12} /> คอลเลกชันใหม่</button>
          </div>
          {/* Cards */}
          <div style={S.grid}>
            {filtered.length === 0 ? (
              <div style={S.empty}>
                <LuFolderOpen size={48} color={C.muted} />
                <div style={S.emptyText}>ไม่พบรายการ</div>
                <div style={S.emptyDesc}>ลองเปลี่ยนตัวกรองหรือค้นหาใหม่อีกครั้ง</div>
              </div>
            ) : filtered.map((item) => (
              <div
                key={item.id}
                style={S.card}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={item.type === "resume" ? S.cardThumbResume : S.cardThumbJob} />
                {/* Remove button — shows on hover */}
                <button
                  style={{ ...S.removeBtn, opacity: hoveredId === item.id ? 1 : 0 }}
                  onClick={(e) => { e.stopPropagation(); remove(item.id); }}
                  title="เอาออกจาก Saved"
                >
                  <LuTrash2 size={13} />
                </button>
                <div style={S.cardBody}>
                  <div style={S.cardName}>{item.title}</div>
                  <div style={S.cardSub}>{item.owner}</div>
                  <div style={S.cardMeta}>
                    <span style={{ ...S.badge, ...(item.type === "resume" ? S.resumeBadge : S.jobBadge) }}>
                      {item.type === "resume" ? "Resume" : "Job"}
                    </span>
                    <span style={S.viewsText}><LuEye size={11} />{item.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
