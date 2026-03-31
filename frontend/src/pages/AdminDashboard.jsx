import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/AdminDashboard.css";
import { 
  LuSearch, LuBell, LuUsers, LuFileText, 
  LuSettings, LuActivity, LuShieldCheck, LuCheck, LuBan, LuUser, LuTrash2 
} from "react-icons/lu";
import { FiHome } from "react-icons/fi";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const userTableRef = useRef(null);
  const sidebarRef = useRef(null);
  const [isSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");


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

  // --- 3. Effects ---
  
  // ดึงข้อมูลครั้งแรกเมื่อโหลดหน้า
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // ดึงสถิติ
        await fetchStats();

        // ดึงรายชื่อ User
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

  const scrollToUserManagement = () => {
  if (userTableRef.current) {
    userTableRef.current.scrollIntoView({ 
      behavior: "smooth", // เลื่อนแบบนุ่มนวล
      block: "start"      // ให้ส่วนหัวของตารางอยู่บนสุดของหน้าจอ
    });
  }
  };

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
    } catch (err) {
      console.error("Update Status Error:", err);
      alert("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  // ลบ User ถาวร
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ User นี้ถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`http://localhost:3000/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        setUsers(users.filter((user) => user.id !== userId));
        await fetchStats(); // อัปเดตตัวเลข Stats จาก DB จริง
        alert("ลบข้อมูลสำเร็จเรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error("Delete User Error:", err);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  // ฟังก์ชันนี้เรียกใช้ Logic เดียวกับ handleUpdateStatus เพื่อความไม่งง
  const handleStatusChange = (userId, newStatus) => {
    handleUpdateStatus(userId, newStatus);
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
            <span>Super Admin</span>
          </div>
        </div>
      </nav>

      <div className="admin-body">
        <aside ref={sidebarRef} className={`admin-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-content-wrapper">
            <div className="section-title">Main Menu</div>
            <button className="menu-item active"><FiHome /> <span>Overview</span></button>
            <button className="menu-item" onClick={scrollToUserManagement} ><LuUsers /> <span>User Management</span></button>
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

          {/* ตารางแสดงข้อมูล User ล่าสุด */}
          <div className="data-section" ref={userTableRef} >
            <div className="table-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>User Management</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="nav-search" style={{ width: '200px', marginBottom: 0 }}>
                  <LuSearch color="#9ca3af" size={15} />
                  <input 
                    placeholder="ค้นหาชื่อหรืออีเมล..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* เพิ่ม Select กรอง Role แบบง่ายๆ */}
                <select className="action-btn" style={{ fontSize: '12px' }}>
                    <option value="">All Roles</option>
                    <option value="1">Admin</option>
                    <option value="2">Seeker</option>
                    <option value="3">HR</option>
                </select>
                <button className="action-btn" style={{ padding: '6px 12px' }}>View All</button>
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
                  return (
                    user.username.toLowerCase().includes(searchTermLower) ||
                    user.email.toLowerCase().includes(searchTermLower) ||
                    user.fullName?.toLowerCase().includes(searchTermLower)
                  );
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
        </main>
      </div>
    </div>
  );
}
