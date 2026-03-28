import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LuSearch, LuBookmark, LuBell, LuUser, LuPanelLeft,
  LuFileText, LuBriefcase, LuEye, LuTrash2, LuFilter,
  LuFolderOpen, LuX, LuPlus,
} from "react-icons/lu";
import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";

// ─── Design Tokens ───────────────────────────────────────────────
const C = {
  indigo: "#4f46e5",
  indigoLight: "#ede9fe",
  indigoMid: "#818cf8",
  green: "#059669",
  greenLight: "#d1fae5",
  red: "#ef4444",
  redLight: "#fee2e2",
  bg: "#f7f8fa",
  white: "#fff",
  border: "#eee",
  text: "#111827",
  sub: "#6b7280",
  muted: "#9ca3af",
};

const S = {
  page: { minHeight: "100vh", background: C.bg, fontFamily: "'Sarabun','Inter',sans-serif", color: C.text },
  // NAV
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px", height: 56,
    background: C.white, borderBottom: `1px solid ${C.border}`, gap: 16,
  },
  navLeft: { display: "flex", alignItems: "center", gap: 12 },
  navLogo: { fontWeight: 800, fontSize: 18, color: C.indigo, letterSpacing: "-0.5px" },
  navSearch: {
    display: "flex", alignItems: "center",
    background: "#f3f4f6", borderRadius: 8,
    padding: "6px 12px", gap: 8, width: 260,
  },
  navInput: { border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#374151", width: "100%" },
  navRight: { display: "flex", alignItems: "center", gap: 12 },
  iconBtn: { border: "none", background: "transparent", cursor: "pointer", color: C.sub, display: "flex", alignItems: "center", fontSize: 18, padding: 6, borderRadius: 6 },
  userDrop: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" },
  // BODY
  body: { display: "flex", minHeight: "calc(100vh - 56px)" },
  sidebar: {
    width: 220, flexShrink: 0,
    background: C.white, borderRight: `1px solid ${C.border}`,
    padding: "20px 12px", display: "flex", flexDirection: "column", gap: 6,
  },
  createBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: C.indigo, color: C.white,
    border: "none", borderRadius: 8, padding: "9px 14px",
    cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 8, width: "100%",
  },
  menuItem: {
    display: "flex", alignItems: "center", gap: 8,
    background: "transparent", border: "none",
    color: C.sub, fontSize: 13, fontWeight: 500,
    padding: "9px 12px", borderRadius: 8, cursor: "pointer",
    width: "100%", textAlign: "left", textDecoration: "none",
  },
  menuActive: { background: C.indigoLight, color: C.indigo, fontWeight: 700 },
  secTitle: { fontSize: 11, fontWeight: 700, color: C.muted, padding: "10px 12px 4px", letterSpacing: 1 },
  subItem: { fontSize: 12, color: C.sub, padding: "6px 16px", cursor: "pointer", borderRadius: 6 },
  // MAIN
  main: { flex: 1, padding: "32px 32px 48px", maxWidth: 960, margin: "0 auto" },
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  pageSub: { fontSize: 13, color: C.sub },
  // TOOLBAR
  toolbar: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" },
  tabGroup: { display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3, gap: 2 },
  tabBtn: {
    display: "flex", alignItems: "center", gap: 6,
    border: "none", background: "transparent",
    borderRadius: 6, padding: "7px 14px",
    cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.sub,
    transition: "all 0.15s",
  },
  tabBtnActive: { background: C.white, color: C.indigo, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  spacer: { flex: 1 },
  filterBtn: {
    display: "flex", alignItems: "center", gap: 6,
    border: `1px solid ${C.border}`, background: C.white,
    borderRadius: 8, padding: "7px 14px",
    cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.sub,
  },
  searchBox: {
    display: "flex", alignItems: "center", gap: 6,
    background: C.white, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: "7px 12px",
  },
  searchInput: { border: "none", outline: "none", fontSize: 12, color: C.text, background: "transparent", width: 160 },
  // COLLECTION ROW
  collectionRow: { display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" },
  collectionChip: {
    display: "flex", alignItems: "center", gap: 6,
    border: `1.5px solid ${C.border}`, background: C.white,
    borderRadius: 20, padding: "5px 14px",
    cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.sub,
    transition: "all 0.15s",
  },
  collectionChipActive: { borderColor: C.indigo, background: C.indigoLight, color: C.indigo },
  collectionCount: {
    background: "#e5e7eb", color: C.sub,
    fontSize: 10, fontWeight: 700,
    borderRadius: 20, padding: "1px 7px",
  },
  collectionCountActive: { background: C.indigo, color: C.white },
  addCollectionChip: {
    display: "flex", alignItems: "center", gap: 5,
    border: `1.5px dashed #c7d2fe`, background: "transparent",
    borderRadius: 20, padding: "5px 14px",
    cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.indigoMid,
  },
  // GRID
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))", gap: 16 },
  card: {
    background: C.white, borderRadius: 12,
    border: `1px solid ${C.border}`, overflow: "hidden",
    cursor: "pointer", position: "relative",
    transition: "box-shadow 0.18s, transform 0.18s",
  },
  cardThumbResume: { width: "100%", height: 116, background: `linear-gradient(135deg,${C.indigoLight} 0%,#c7d2fe 100%)` },
  cardThumbJob: { width: "100%", height: 116, background: "linear-gradient(135deg,#d1fae5 0%,#6ee7b7 100%)" },
  cardBody: { padding: "12px 14px" },
  cardName: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 },
  cardSub: { fontSize: 11, color: C.sub, marginBottom: 6 },
  cardMeta: { display: "flex", alignItems: "center", gap: 10 },
  badge: { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 },
  resumeBadge: { background: C.indigoLight, color: C.indigo },
  jobBadge: { background: C.greenLight, color: C.green },
  viewsText: { display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.muted },
  // Remove btn overlay
  removeBtn: {
    position: "absolute", top: 8, right: 8,
    background: "rgba(255,255,255,0.9)", border: "none",
    borderRadius: 6, padding: "4px 6px",
    cursor: "pointer", color: C.red, fontSize: 14,
    display: "flex", alignItems: "center",
    opacity: 0, transition: "opacity 0.15s",
  },
  // Empty state
  empty: {
    gridColumn: "1/-1",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "60px 0", gap: 12, color: C.muted,
  },
  emptyIcon: { fontSize: 48, marginBottom: 4 },
  emptyText: { fontSize: 14, fontWeight: 600, color: C.sub },
  emptyDesc: { fontSize: 12, color: C.muted },
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
  { label: "แรงบันดาลใจ", key: "แรงบันดาลใจ" },
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
