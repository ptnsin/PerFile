import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/AdminDashboard.css";
import { 
  LuSearch, LuBell, LuUsers, LuFileText, 
  LuSettings, LuActivity, LuShieldCheck, LuCheck, LuBan, LuUser, LuTrash2 
} from "react-icons/lu";
import { FiHome } from "react-icons/fi";
import { jwtDecode } from "jwt-decode";

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState("overview","User Management");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const userTableRef = useRef(null);
  const sidebarRef = useRef(null);
  const [isSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);

  // --- 2. Helper Functions (ประกาศไว้ก่อนเพื่อให้ Effects เรียกใช้ได้) ---
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

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/admin/audit-logs?page=1&limit=20", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(res.data.logs);
      setAuditTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  // --- 3. Effects ---

  // ดึงข้อมูลครั้งแรกเมื่อโหลดหน้า
useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // 🌟 จุดสำคัญ: ต้อง Decode และเก็บลง State ตรงนี้
      if (token) {
        const decoded = jwtDecode(token);
        console.log("Decoded Token:", decoded); // <--- ลองดูใน Console (F12) ว่ามีคำว่า username ไหม
        setUserData(decoded);
      }

      const headers = { Authorization: `Bearer ${token}` };
      await fetchStats();
      await fetchAuditLogs();
      const usersRes = await axios.get("http://localhost:3000/admin/users?page=1", { headers });
      setUsers(usersRes.data.users);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };
  fetchData();
}, []);

  // ระบบลาก Sidebar
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

  // เปลี่ยนสถานะ User (จาก Select Dropdown หรือปุ่ม Ban)
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
      await fetchStats(); // อัปเดตตัวเลข Stats จาก DB จริง
      await fetchAuditLogs(); // อัปเดต audit logs ด้วย
    } catch (err) {
      console.error("Update Status Error:", err);
      alert("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  // ลบ User ถาวร
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ User นี้ถาวร?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter((user) => user.id !== userId));
      await fetchStats();
      await fetchAuditLogs(); // 🌟 อัปเดต Log หลังจากลบ
      alert("ลบข้อมูลสำเร็จเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Delete User Error:", err);
    }
  };

  // ฟังก์ชันนี้เรียกใช้ Logic เดียวกับ handleUpdateStatus เพื่อความไม่งง
  const handleStatusChange = (userId, newStatus) => {
    handleUpdateStatus(userId, newStatus);
  };

  const goToOverview = () => {
  // 1. สั่งสลับ Tab กลับไปที่ Overview
  setCurrentTab("overview");

  // 2. สั่งให้หน้าจอเลื่อนกลับไปบนสุด (Smooth Scroll to top)
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

  const scrollToUserManagement = () => {
  if (userTableRef.current) {
    userTableRef.current.scrollIntoView({ 
      behavior: "smooth", // เลื่อนแบบนุ่มนวล
      block: "start"      // ให้ส่วนหัวของตารางอยู่บนสุดของหน้าจอ
    });
  }
  };

  // --- 5. Render Logic ---
  if (loading) return <div className="admin-page">Loading Dashboard...</div>;

  return (
    <div className="admin-page">
      <nav className="admin-nav">
        <div className="nav-left">
          <div className="nav-logo">PerFile Admin</div>
          <div className="nav-search">
            <LuSearch color="#9ca3af" size={15} />
            <input placeholder="ค้นหา User, HR หรือระบบ..." />
          </div>
        </div>
        <div className="nav-right">
          <button className="icon-btn"><LuBell /></button>
          <div className="user-dropdown">
            <LuShieldCheck size={18} color="#4f46e5" />
            <span>Admin {userData?.username || "Admin"}</span>
          </div>
        </div>
      </nav>

      <div className="admin-body">
        <aside ref={sidebarRef} className={`admin-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-content-wrapper">
            <div className="section-title">Main Menu</div>
            <button className={`menu-item ${currentTab === "overview" ? "active" : ""}`} 
            onClick={goToOverview}><FiHome /> <span>Overview</span></button>
            <button className={`menu-item ${currentTab === "user-management" ? "active" : ""}`} onClick={() => {
              setCurrentTab("user-management");
              scrollToUserManagement();
            }} ><LuUsers /> <span>User Management</span></button>
            <button className="menu-item"><LuFileText /> <span>Resume Controls</span></button>
            
            <div className="section-title">System</div>
            <button className="menu-item"><LuActivity /> <span>Audit Logs</span></button>
            <button className="menu-item"><LuSettings /> <span>System Settings</span></button>
          </div>

          {/* ตัวสำหรับลากขยายซ้ายขวา */}
          <div className="sidebar-handle">
            <div className="handle-line"></div>
          </div>
        </aside>

        <main className="admin-main">
          <header className="dashboard-header">
            <h1 className="dashboard-title">Dashboard Overview</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>ข้อมูลสรุปภาพรวมของระบบ PerFile</p>
          </header>

          {/* STATS CARDS (ใช้ข้อมูลจริงจาก API) */}
          <div className="stats-grid">
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
              <span className="stat-num">{stats?.resumeStats.public + stats?.resumeStats.private || 0}</span>
            </div>
          </div>

          <div className="pending-card">
            <h3>Pending Approval</h3>
            <div className="pending-list">
              {users
                .filter((user) => user.status === "pending") // 🌟 กรองเฉพาะคนที่สถานะเป็น pending
                .map((user) => (
                  <div key={user.id} className="pending-item">
                    {/* ส่วน User Info (Avatar + Username/Email) */}
                    <div className="user-info-brief">
                      <div className="mini-avatar">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="info-text">
                        <p className="username">{user.username}</p>
                        <p className="email">{user.email}</p>
                      </div>
                    </div>

                    {/* ส่วน Full Name & Company */}
                    <div className="work-info">
                      <p className="fullname">{user.fullName || "ไม่ระบุชื่อ"}</p>
                      <p className="company">{user.company || "ไม่มีข้อมูลบริษัท"}</p>
                    </div>

                    {/* ปุ่ม Action (เผื่อคุณต้องการกดอนุมัติจากตรงนี้ได้เลย) */}
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
              
              {/* กรณีไม่มีใครรออนุมัติเลย */}
              {users.filter(u => u.status === "pending").length === 0 && (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                  ไม่มีรายการรอนุมัติ
                </p>
              )}
            </div>
          </div>

          {/* ตารางแสดงข้อมูล User ล่าสุด */}
          <div className="data-section" ref={userTableRef} >
            <div className="table-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>User Management</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="nav-search" style={{ width: '200px', marginBottom: 0 }}>
                  <LuSearch color="#9ca3af" size={15} />
                  <input 
                    placeholder="ค้นหาชื่อ, อีเมล, บริษัท..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* เลือก Method */}
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

                {/* เลือก Role */}
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

                <button className="action-btn" style={{ padding: '6px 12px' }} onClick={() => {setSearchTerm(""); setSelectedRole(""); setSelectedMethod("");}} >Reset</button>
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
                    {/* 1. ข้อมูล Username & Email */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user.avatar ? (
                          <img src={user.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover',border: '1px solid #e5e7eb' }} alt="avt" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=random` }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuUser size={16} /></div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.username}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* 2. ชื่อจริง และ บริษัท (ถ้าเป็น HR) */}
                    <td>
                      <div style={{ fontWeight: 500 }}>{user.fullName || "-"}</div>
                      {user.roles_id === 3 && (
                        <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 600 }}>
                          🏢 {user.company || "No Company"}
                        </div>
                      )}
                    </td>

                    {/* 3. คอลัมน์บอกวิธีการ Login */}
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

                    {/* 4. สิทธิ์การใช้งาน */}
                    <td>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600,
                        color: user.roles_id === 1 ? '#ef4444' : user.roles_id === 3 ? '#4f46e5' : '#6b7280'
                      }}>
                        {user.roles_id === 1 ? "Admin" : user.roles_id === 3 ? "HR Agent" : "Seeker"}
                      </span>
                    </td>

                    {/* 5. วันที่สมัคร */}
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(user.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    {/* 6. สถานะ */}
                    <td>
                      {/* เปลี่ยนจากแค่โชว์ Badge เป็น Select Dropdown */}
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

                    {/* 7. ปุ่ม Delete */}
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {/* ปุ่มลบ User (API ข้อ 4) */}
                        <button 
                          className="action-btn" 
                          onClick={() => handleDeleteUser(user.id)}
                          style={{ color: '#ffffff', backgroundColor: '#ef4444' }}
                          title="Delete User"
                        >
                          <LuTrash2  />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="audit-section">
            <div className="table-header">
              <h2>Audit Logs System</h2>
              {/* 🌟 แสดงจำนวนทั้งหมดจาก auditTotal */}
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Total {auditTotal} activities
              </span>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {/* 🌟 นำ auditLogs มาวนลูปแสดงผล */}
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString('th-TH')}</td>
                    <td>{log.admin_name}</td>
                    <td>
                      <span className={`action-tag action-${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </main>
      </div>
    </div>
  );
}
