import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";
import { 
  LuSearch, LuBell, LuUsers, LuFileText, 
  LuSettings, LuActivity, LuShieldCheck, LuCheck, LuBan, LuUser, LuTrash2 
} from "react-icons/lu";
import { FiHome } from "react-icons/fi";
import { jwtDecode } from "jwt-decode";
import JobDetailModal from "./JobDetailModal"; // ✅ เพิ่ม import
import { useNotifications } from "../styles/useNotifications";
import NotificationDropdown from "./NotificationDropdown";

export default function AdminDashboard() {
  const [userFeedPosts, setUserFeedPosts] = useState([]);
  const [hrJobPosts, setHrJobPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const userTableRef = useRef(null);
  const sidebarRef = useRef(null);
  const overviewRef = useRef(null);
  const auditLogsRef = useRef(null);
  const [isSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [filterLogAdmin, setFilterLogAdmin] = useState("");
  const [filterLogAction, setFilterLogAction] = useState("");
  const [filterLogTarget, setFilterLogTarget] = useState("");
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const adminMenuRef = useRef(null);
  const settingsRef = useRef(null);
  const [settings, setSettings] = useState({ maxFileSize: 10485760, maintenanceMode: false });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [resumeSearch, setResumeSearch] = useState("");
  const [resumeVisibility, setResumeVisibility] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, loading: notifLoading, markAsRead, markAllAsRead } = useNotifications();

  // ✅ State สำหรับ JobDetailModal
  const [selectedJob, setSelectedJob] = useState(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  // ✅ State สำหรับ HR Feed search
  const [hrSearchTerm, setHrSearchTerm] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const fetchUserFeed = async () => {
    setFeedLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/admin/all-jobs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserFeedPosts(res.data.jobs);
    } catch (err) {
      console.error("Error fetching user feed:", err);
    } finally {
      setFeedLoading(false);
    }
  };

  const fetchHRFeed = async () => {
    setFeedLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/admin/all-jobs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Response Data:", res.data);
      setHrJobPosts(res.data.jobs);
    } catch (err) {
      console.error("Error fetching HR feed:", err);
    } finally {
      setFeedLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/admin/dashboard-stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchAuditLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: 1,
        limit: 20,
        action: filterLogAction,
        admin: filterLogAdmin,
        target: filterLogTarget
      });
      const res = await axios.get(`http://localhost:3000/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(res.data.logs);
      setAuditTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  }, [filterLogAction, filterLogAdmin, filterLogTarget]);

  useEffect(() => {
    fetchAuditLogs();
  }, [filterLogAction, filterLogAdmin, filterLogTarget, fetchAuditLogs]);

  const fetchAllResumes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/admin/resumes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumes(res.data);
    } catch (err) {
      console.error("Error fetching resumes:", err);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Resume นี้ถาวร?")) return;
    try {
      const token = localStorage.getItem("token");
      // ✅ ใช้ /admin/resumes/:id ซึ่งมี adminMiddleware รองรับอยู่แล้วใน Backend
      await axios.delete(`http://localhost:3000/admin/resumes/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumes(resumes.filter((r) => r.id !== resumeId));
      await fetchStats();
      alert("ลบข้อมูล Resume สำเร็จ");
    } catch (err) {
      console.error("Delete Resume Error:", err);
      alert("ไม่สามารถลบ Resume ได้");
    }
  };

  // ✅ ฟังก์ชันลบ Job Post
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Job Post นี้ถาวร?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/admin/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHrJobPosts(hrJobPosts.filter((job) => job.id !== jobId));
      await fetchStats();
      alert("ลบ Job Post สำเร็จ");
    } catch (err) {
      console.error("Delete Job Error:", err);
      alert("ไม่สามารถลบ Job Post ได้");
    }
  };

  // ✅ ฟังก์ชันเปิด JobDetailModal
  const handleViewJobDetail = (job) => {
    setSelectedJob(job);
    setIsJobModalOpen(true);
  };

  // ✅ ฟังก์ชันปิด JobDetailModal
  const handleCloseJobModal = () => {
    setIsJobModalOpen(false);
    setSelectedJob(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = jwtDecode(token);
          setUserData(decoded);
        }
        const headers = { Authorization: `Bearer ${token}` };
        await fetchStats();
        await fetchAuditLogs();
        await fetchAllResumes();
        const usersRes = await axios.get("http://localhost:3000/admin/users?page=1", { headers });
        setUsers(usersRes.data.users);
        const settingsRes = await axios.get("http://localhost:3000/admin/settings", { headers });
        setSettings(settingsRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const handle = sidebar.querySelector(".sidebar-handle");
    if (!handle) return;

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
      const newW = Math.min(450, Math.max(70, startW + (e.clientX - startX)));
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
  }, [loading]);

  const handleUpdateStatus = async (userId, newStatus) => {
    const msg = newStatus === 'banned' ? "ระงับการใช้งาน User นี้?" : "คืนสถานะ User นี้?";
    if (!window.confirm(msg)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:3000/admin/users/${userId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      await fetchStats();
      await fetchAuditLogs();
    } catch (err) {
      console.error("Update Status Error:", err);
      alert("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ User นี้ถาวร?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter((user) => user.id !== userId));
      await fetchStats();
      await fetchAuditLogs();
      alert("ลบข้อมูลสำเร็จเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Delete User Error:", err);
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    handleUpdateStatus(userId, newStatus);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target)) {
        setShowAdminMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToOverview = () => {
    setCurrentTab("overview");
    setTimeout(() => {
      if (overviewRef.current) {
        overviewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const scrollToAuditLogs = () => {
    if (auditLogsRef.current) {
      auditLogsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToSettings = () => {
    if (settingsRef.current) {
      settingsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsMsg("");
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:3000/admin/settings", settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettingsMsg("success");
    } catch (err) {
      console.error("Save Settings Error:", err);
      setSettingsMsg("error");
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsMsg(""), 3000);
    }
  };

  const scrollToUserManagement = () => {
    if (userTableRef.current) {
      userTableRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  if (loading) return <div className="admin-page">Loading Dashboard...</div>;

  return (
    <div className="admin-page">
      <nav className="admin-nav">
        <div className="nav-left">
          <div className="nav-logo">
            Per<em>File</em>
            <span className="nav-logo-badge">Admin</span>
          </div>
          <div className="nav-search">
            <LuSearch color="#9ca3af" size={15} />
            <input placeholder="ค้นหา User, HR หรือระบบ..." />
          </div>
        </div>
        <div className="nav-right">
<div style={{ position: "relative" }}>
  <button
    className="nav-icon-btn"
    onClick={() => setShowNotifications((v) => !v)}
    style={{ position: "relative" }}
  >
    <LuBell size={18} />
    {unreadCount > 0 && (
      <span style={{
        position: "absolute", top: 4, right: 4,
        width: 8, height: 8, borderRadius: "50%",
        background: "#ef4444", border: "2px solid #fff",
      }} />
    )}
  </button>

  <NotificationDropdown
    open={showNotifications}
    notifications={notifications}
    unreadCount={unreadCount}
    loading={notifLoading}
    onMarkAsRead={markAsRead}
    onMarkAllAsRead={markAllAsRead}
    onClose={() => setShowNotifications(false)}
  />
</div>
          <div className="nav-admin-wrapper" ref={adminMenuRef}>
            <button className="nav-admin-btn" onClick={() => setShowAdminMenu(v => !v)}>
              <div className="nav-admin-avatar">
                <LuShieldCheck size={14} />
              </div>
              <span className="nav-admin-name">Admin {userData?.username || "Admin"}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#9ca3af', transition: 'transform 0.2s', transform: showAdminMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showAdminMenu && (
              <div className="nav-admin-dropdown">
                <div className="nav-admin-dropdown-header">
                  <div className="nav-admin-avatar-lg"><LuShieldCheck size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>Admin {userData?.username || "Admin"}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Administrator</div>
                  </div>
                </div>
                <div className="nav-admin-dropdown-divider" />
                <button className="nav-admin-dropdown-item nav-admin-dropdown-item--danger" onClick={handleLogout}>
                  <LuBan size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="admin-body">
        <aside ref={sidebarRef} className={`admin-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-content-wrapper">
            <div className="section-title">Page</div>
            <button className={`page-nav-btn ${currentTab === "overview" ? "active" : ""}`}
                    onClick={() => setCurrentTab("overview")}
                    style={{
                      backgroundColor: currentTab === "overview" ? "#6366f1" : "transparent",
                      color: currentTab === "overview" ? "#fff" : "#6b7280"
                    }}
                    >Admin Page
            </button>
            <button className={`page-nav-btn ${currentTab === "user-feed" ? "active" : ""}`}
                    onClick={() => { setCurrentTab("user-feed"); fetchUserFeed(); }}
                    style={{
                      backgroundColor: currentTab === "user-feed" ? "#4f46e5" : "transparent",
                      color: currentTab === "user-feed" ? "#fff" : "#6b7280"
                    }}
                    >User Feed
            </button>
            <button className={`page-nav-btn ${currentTab === "hr-feed" ? "active" : ""}`}
                    onClick={() => { setCurrentTab("hr-feed"); fetchHRFeed(); }}
                    style={{
                      backgroundColor: currentTab === "hr-feed" ? "#3b82f6" : "transparent",
                      color: currentTab === "hr-feed" ? "#fff" : "#6b7280"
                    }}
                    >HR Feed
            </button>

            <div className="section-title">Main Menu</div>
            <button className={`menu-item ${currentTab === "overview" ? "active" : ""}`}
            onClick={goToOverview}><FiHome /> <span>Overview</span></button>
            <button className={`menu-item ${currentTab === "user-management" ? "active" : ""}`} onClick={() => {
              setCurrentTab("user-management");
              scrollToUserManagement();
            }} ><LuUsers /> <span>User Management</span></button>


            <div className="section-title">System</div>
            <button className={`menu-item ${currentTab === "audit-logs" ? "active" : ""}`} onClick={() => { setCurrentTab("audit-logs"); scrollToAuditLogs(); }}><LuActivity /> <span>Audit Logs</span></button>
            <button className={`menu-item ${currentTab === "settings" ? "active" : ""}`} onClick={() => { setCurrentTab("settings"); scrollToSettings(); }}><LuSettings /> <span>System Settings</span></button>
          </div>

          <div className="sidebar-handle">
            <div className="handle-line"></div>
          </div>
        </aside>

        <main className="admin-main">
          {(currentTab === "overview" ||
            currentTab === "user-management" ||
            currentTab === "audit-logs" ||
            currentTab === "settings") && (
            <>
          <header className="dashboard-header" ref={overviewRef}>
            <h1 className="dashboard-title">Dashboard Overview</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>ข้อมูลสรุปภาพรวมของระบบ PerFile</p>
          </header>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Users</span>
              <span className="stat-num">{users.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Seekers</span>
              <span className="stat-num">{stats?.userStats.generalUser || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Active HRs</span>
              <span className="stat-num">{stats?.userStats.hr || 0}</span>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
              <span className="stat-label">Pending Approval</span>
              <span className="stat-num" style={{ color: '#d97706' }}>{stats?.pendingHR || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Resumes</span>
              <span className="stat-num">{resumes.length}</span>
            </div>
          </div>

          <div className="pending-card">
            <h3>Pending Approval</h3>
            <div className="pending-list">
              {users
                .filter((user) => user.status === "pending")
                .map((user) => (
                  <div key={user.id} className="pending-item">
                    <div className="user-info-brief">
                      <div className="mini-avatar">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="info-text">
                        <p className="username">{user.username}</p>
                        <p className="email">{user.email}</p>
                      </div>
                    </div>
                    <div className="work-info">
                      <p className="fullname">{user.fullName || "ไม่ระบุชื่อ"}</p>
                      <p className="company">{user.company || "ไม่มีข้อมูลบริษัท"}</p>
                    </div>
                    <div className="action-group">
                      <button
                        className="approve-btn"
                        onClick={() => handleUpdateStatus(user.id, 'active')}
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              {users.filter(u => u.status === "pending").length === 0 && (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                  ไม่มีรายการรอนุมัติ
                </p>
              )}
            </div>
          </div>

          <div className="data-section" ref={userTableRef}>
            <div className="table-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>User Management</h2>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  Total {users.length} user
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="nav-search" style={{ width: '200px', marginBottom: 0 }}>
                  <LuSearch color="#9ca3af" size={15} />
                  <input
                    placeholder="ค้นหาชื่อ, อีเมล, บริษัท..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="action-btn"
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  style={{ fontSize: '12px' }}
                >
                  <option value="">All Methods</option>
                  <option value="google">Google</option>
                  <option value="github">GitHub</option>
                  <option value="email">Email</option>
                </select>
                <select
                  className="action-btn"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{ fontSize: '12px' }}
                >
                  <option value="">All Roles</option>
                  <option value="1">Admin</option>
                  <option value="2">Seeker</option>
                  <option value="3">HR Agent</option>
                </select>
                <button className="action-btn" style={{ padding: '6px 12px' }} onClick={() => { setSearchTerm(""); setSelectedRole(""); setSelectedMethod(""); }}>Reset</button>
              </div>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Info</th>
                  <th>Full Name & Company</th>
                  <th>Method</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((user) => {
                    const searchTermLower = searchTerm.toLowerCase();
                    const matchesSearch =
                      user.username?.toLowerCase().includes(searchTermLower) ||
                      user.email?.toLowerCase().includes(searchTermLower) ||
                      user.fullName?.toLowerCase().includes(searchTermLower) ||
                      user.company?.toLowerCase().includes(searchTermLower);
                    const matchesRole = selectedRole === "" || user.roles_id.toString() === selectedRole;
                    let userMethod = "email";
                    if (user.google_id) userMethod = "google";
                    else if (user.github_id) userMethod = "github";
                    const matchesMethod = selectedMethod === "" || userMethod === selectedMethod;
                    return matchesSearch && matchesRole && matchesMethod;
                  })
                  .map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {user.avatar ? (
                            <img src={user.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5e7eb' }} alt="avt" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=random` }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuUser size={16} /></div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.username}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{user.fullName || "-"}</div>
                        {user.roles_id === 3 && (
                          <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 600 }}>
                            🏢 {user.company || "No Company"}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 500 }}>
                          {user.google_id && (
                            <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="16" alt="G" /> Google</>
                          )}
                          {user.github_id && (
                            <><img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" width="16" alt="GH" /> GitHub</>
                          )}
                          {!user.google_id && !user.github_id && (
                            <><LuFileText size={14} color="#6b7280" /> Email</>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: user.roles_id === 1 ? '#ef4444' : user.roles_id === 3 ? '#4f46e5' : '#6b7280'
                        }}>
                          {user.roles_id === 1 ? "Admin" : user.roles_id === 3 ? "HR Agent" : "Seeker"}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(user.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td>
                        <select
                          className={`status-select-box status-${user.status}`}
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            border: '1px solid #ddd',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="active">active</option>
                          <option value="pending">pending</option>
                          <option value="suspended">suspended</option>
                          <option value="banned">banned</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            className="action-btn"
                            onClick={() => handleDeleteUser(user.id)}
                            style={{ color: '#ffffff', backgroundColor: '#ef4444' }}
                            title="Delete User"
                          >
                            <LuTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="audit-section" ref={auditLogsRef}>
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Audit Logs System</h2>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  Total {auditTotal} activities
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="nav-search" style={{ width: '160px', marginBottom: 0 }}>
                  <LuSearch color="#9ca3af" size={14} />
                  <input
                    placeholder="Filter Admin..."
                    value={filterLogAdmin}
                    onChange={(e) => setFilterLogAdmin(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div className="nav-search" style={{ width: '160px', marginBottom: 0 }}>
                  <LuSearch color="#9ca3af" size={14} />
                  <input
                    placeholder="Filter Target..."
                    value={filterLogTarget}
                    onChange={(e) => setFilterLogTarget(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <select
                  className="action-btn"
                  value={filterLogAction}
                  onChange={(e) => setFilterLogAction(e.target.value)}
                  style={{ fontSize: '12px', padding: '6px' }}
                >
                  <option value="">All Actions</option>
                  <option value="CHANGE_STATUS">CHANGE_STATUS</option>
                  <option value="APPROVE_HR">APPROVE_HR</option>
                  <option value="CHANGE_ROLE">CHANGE_ROLE</option>
                  <option value="DELETE_USER">DELETE_USER</option>
                </select>
                <button
                  className="action-btn"
                  onClick={() => { setFilterLogAdmin(""); setFilterLogAction(""); setFilterLogTarget(""); }}
                  style={{ padding: '3px 12px' }}
                >
                  Reset
                </button>
              </div>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target User</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString('th-TH')}</td>
                    <td style={{ fontWeight: 600 }}>{log.admin_name}</td>
                    <td>
                      <span className={`action-tag action-${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ color: '#4f46e5', fontWeight: 500 }}>
                      {log.target_name || "-"}
                    </td>
                    <td>{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div ref={settingsRef} style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div className="table-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>System Settings</h2>
              {settingsMsg === "success" && (
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>✓ บันทึกสำเร็จ</span>
              )}
              {settingsMsg === "error" && (
                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>✗ เกิดข้อผิดพลาด</span>
              )}
            </div>

            <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>Max File Size</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>ขนาดไฟล์สูงสุดที่อนุญาตให้อัปโหลด resume</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[5, 10, 20, 50].map(mb => {
                    const bytes = mb * 1024 * 1024;
                    const active = settings.maxFileSize === bytes;
                    return (
                      <button
                        key={mb}
                        onClick={() => setSettings(s => ({ ...s, maxFileSize: bytes }))}
                        style={{
                          padding: '7px 18px', borderRadius: '8px',
                          border: active ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                          background: active ? '#ede9fe' : '#fff',
                          color: active ? '#4f46e5' : '#6b7280',
                          fontWeight: active ? 700 : 500, fontSize: '13px',
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        {mb} MB
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: '1px', background: '#f0f0f0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>Maintenance Mode</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>เมื่อเปิด ผู้ใช้ทั่วไปจะไม่สามารถเข้าสู่ระบบได้</div>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
                  style={{
                    width: '52px', height: '28px', borderRadius: '99px', border: 'none',
                    background: settings.maintenanceMode ? '#4f46e5' : '#e5e7eb',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '4px',
                    left: settings.maintenanceMode ? '28px' : '4px',
                    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s'
                  }} />
                </button>
              </div>

              <div style={{ height: '1px', background: '#f0f0f0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>Max Resumes Per User</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>จำนวน resume สูงสุดที่ผู้ใช้แต่ละคนสร้างได้</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 3, 5, 10].map(n => {
                    const active = settings.maxResumesPerUser === n;
                    return (
                      <button
                        key={n}
                        onClick={() => setSettings(s => ({ ...s, maxResumesPerUser: n }))}
                        style={{
                          padding: '7px 18px', borderRadius: '8px',
                          border: active ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                          background: active ? '#ede9fe' : '#fff',
                          color: active ? '#4f46e5' : '#6b7280',
                          fontWeight: active ? 700 : 500, fontSize: '13px',
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: '1px', background: '#f0f0f0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>Allow New Registration</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>เมื่อปิด ผู้ใช้ใหม่จะไม่สามารถสมัครสมาชิกได้</div>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, allowRegistration: !s.allowRegistration }))}
                  style={{
                    width: '52px', height: '28px', borderRadius: '99px', border: 'none',
                    background: settings.allowRegistration ? '#4f46e5' : '#e5e7eb',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '4px',
                    left: settings.allowRegistration ? '28px' : '4px',
                    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s'
                  }} />
                </button>
              </div>

              <div style={{ height: '1px', background: '#f0f0f0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>Auto Approve HR</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>เมื่อเปิด HR ที่สมัครใหม่จะได้รับการอนุมัติอัตโนมัติ โดยไม่ต้องรอ Admin</div>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, autoApproveHr: !s.autoApproveHr }))}
                  style={{
                    width: '52px', height: '28px', borderRadius: '99px', border: 'none',
                    background: settings.autoApproveHr ? '#4f46e5' : '#e5e7eb',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '4px',
                    left: settings.autoApproveHr ? '28px' : '4px',
                    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s'
                  }} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  style={{
                    padding: '9px 24px', borderRadius: '8px', border: 'none',
                    background: settingsSaving ? '#a5b4fc' : '#4f46e5',
                    color: '#fff', fontWeight: 700, fontSize: '14px',
                    cursor: settingsSaving ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
                  }}
                >
                  {settingsSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
              </div>
            </div>
          </div>
          </>
          )}

          {currentTab === "user-feed" && (
            <div className="feed-view-section">
              <header className="dashboard-header">
                <h1 className="dashboard-title">Resume Control</h1>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>จัดการและตรวจสอบ Resume ของผู้ใช้งานทั้งหมดในระบบ</p>
              </header>

              <div className="data-section" id="resume-management">
                <div className="table-header">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Resume Controls</h2>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                      Total {resumes.length} resumes
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="nav-search" style={{ width: '250px', marginBottom: 0 }}>
                      <LuSearch color="#9ca3af" size={15} />
                      <input
                        placeholder="ค้นหาชื่อ Resume หรือเจ้าของ..."
                        value={resumeSearch}
                        onChange={(e) => setResumeSearch(e.target.value)}
                        style={{ outline: 'none', color: '#111827' }}
                      />
                    </div>
                    <select
                      className="action-btn"
                      value={resumeVisibility}
                      onChange={(e) => setResumeVisibility(e.target.value)}
                      style={{ fontSize: '12px' }}
                    >
                      <option value="">All Visibility</option>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                    <button className="action-btn" style={{ padding: '6px 12px' }} onClick={() => { setResumeSearch(""); setResumeVisibility(""); }}>Reset</button>
                  </div>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Resume Title</th>
                      <th>Owner</th>
                      <th>Template</th>
                      <th>Visibility</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumes
                      .filter(r => {
                        const matchesSearch =
                          r.title?.toLowerCase().includes(resumeSearch.toLowerCase()) ||
                          r.owner_name?.toLowerCase().includes(resumeSearch.toLowerCase());
                        const matchesVisibility = resumeVisibility === "" || r.visibility === resumeVisibility;
                        return matchesSearch && matchesVisibility;
                      })
                      .map((resume) => (
                        <tr key={resume.id}>
                          <td style={{ fontWeight: 600 }}>{resume.title}</td>
                          <td>
                            <div>{resume.owner_name}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{resume.owner_email}</div>
                          </td>
                          <td>
                            <span className="action-tag" style={{ background: '#f3f4f6', color: '#374151' }}>
                              {resume.template}
                            </span>
                          </td>
                          <td>
                            <span className={`status-select-box status-${resume.visibility}`}>
                              {resume.visibility}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: '#6b7280' }}>
                            {new Date(resume.created_at).toLocaleDateString('th-TH')}
                          </td>
                          <td>
                            <button
                              className="action-btn"
                              onClick={() => handleDeleteResume(resume.id)}
                              style={{ color: '#ffffff', backgroundColor: '#ef4444', border: 'none' }}
                            >
                              <LuTrash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {resumes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>ไม่พบข้อมูล Resume</div>
                )}
              </div>
            </div>
          )}

          {/* ─── HR FEED ─── */}
          {currentTab === "hr-feed" && (
            <div className="data-section">
              <div className="table-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700 }}>HR Job Feed</h2>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                    Total {hrJobPosts.length} job posts
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div className="nav-search" style={{ width: '250px', marginBottom: 0 }}>
                    <LuSearch color="#9ca3af" size={15} />
                    {/* ✅ เชื่อม search กับ state */}
                    <input
                      placeholder="ค้นหาชื่องาน หรือบริษัท..."
                      value={hrSearchTerm}
                      onChange={(e) => setHrSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    className="action-btn"
                    style={{ padding: '6px 12px' }}
                    onClick={() => setHrSearchTerm("")}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Company Info</th>
                    <th>Job Details</th>
                    <th>Location</th>
                    <th>Salary</th>
                    <th>Posted Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ กรองข้อมูลตาม hrSearchTerm */}
                  {hrJobPosts
                    .filter((job) => {
                      const term = hrSearchTerm.toLowerCase();
                      return (
                        job.title?.toLowerCase().includes(term) ||
                        job.company_name?.toLowerCase().includes(term) ||
                        job.hr_name?.toLowerCase().includes(term)
                      );
                    })
                    .map((job) => (
                      <tr key={job.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              background: '#4f46e5', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 'bold', fontSize: '12px'
                            }}>
                              {job.company_name?.charAt(0).toUpperCase() || "C"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{job.company_name || "General HR"}</div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>By: {job.hr_name}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 500 }}>{job.title}</div>
                          <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 600 }}>
                            📂 {job.category}
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            📍 {job.location}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                            ฿ {job.salary}
                          </span>
                        </td>

                        <td style={{ fontSize: '12px', color: '#6b7280' }}>
                          {new Date(job.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            {/* ✅ ปุ่มสีม่วง → เปิด JobDetailModal */}
                            <button
                              className="action-btn"
                              style={{ color: '#ffffff', backgroundColor: '#6366f1' }}
                              title="View Detail"
                              onClick={() => handleViewJobDetail(job)}
                            >
                              <LuFileText size={14} />
                            </button>

                            {/* ✅ ปุ่มแดง → ลบ Job Post จริง */}
                            <button
                              className="action-btn"
                              style={{ color: '#ffffff', backgroundColor: '#ef4444' }}
                              title="Delete Post"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <LuTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* แสดงเมื่อไม่มีข้อมูล */}
              {hrJobPosts.length === 0 && !feedLoading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  ไม่พบข้อมูล Job Post
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      

      {/* ✅ JobDetailModal - วางไว้นอก main เพื่อให้ overlay ครอบทั้งหน้า */}
      <JobDetailModal
        open={isJobModalOpen}
        job={selectedJob ? {
          ...selectedJob,
          // map field ให้ตรงกับที่ JobDetailModal ต้องการ
          company: selectedJob.company_name,
          type: selectedJob.job_type,
          salary: selectedJob.salary
            ? `฿${Number(selectedJob.salaryMin || 0).toLocaleString()} – ฿${Number(selectedJob.salaryMax || selectedJob.salary).toLocaleString()}`
            : "ไม่ระบุ",
        } : null}
        onClose={handleCloseJobModal}
        onDelete={(job) => {
          handleCloseJobModal();
          handleDeleteJob(job.id);
        }}
        // ไม่ส่ง onEdit และ onViewApplicants เพราะ Admin ไม่จำเป็นต้องแก้ไข
      />
    </div>


  );
}