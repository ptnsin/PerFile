import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/AdminDashboard.css";
import { 
  LuSearch, LuBell, LuUsers, LuFileText, 
  LuSettings, LuActivity, LuShieldCheck, LuCheck, LuBan 
} from "react-icons/lu";
import { FiHome } from "react-icons/fi";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. ดึงข้อมูลสถิติและรายชื่อ User เมื่อโหลดหน้า
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // ดึงสถิติ (API ข้อ 8)
        const statsRes = await axios.get("http://localhost:3000/admin/dashboard-stats", { headers });
        setStats(statsRes.data);

        // ดึงรายชื่อ User ล่าสุด (API ข้อ 1)
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

  // 2. ฟังก์ชันอนุมัติ HR (API ข้อ 5)
  const handleApproveHR = async (userId) => {
    if (!window.confirm("ยืนยันการอนุมัติบัญชี HR นี้?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:3000/admin/hr/approve/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("อนุมัติสำเร็จ!");
      window.location.reload(); // โหลดข้อมูลใหม่
    } catch (err) {
      console.error("Approve Error:", err);
      alert("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  // 3. ฟังก์ชันระงับการใช้งาน (API ข้อ 3)
  const handleUpdateStatus = async (userId, newStatus) => {
    const msg = newStatus === 'banned' ? "ระงับการใช้งาน User นี้?" : "คืนสถานะ User นี้?";
    if (!window.confirm(msg)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:3000/admin/users/${userId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.reload();
    } catch (err) {
      console.error("Approve Error:", err);
      alert("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

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
        <aside className="admin-sidebar">
          <div className="section-title">Main Menu</div>
          <button className="menu-item active"><FiHome /> Overview</button>
          <button className="menu-item"><LuUsers /> User Management</button>
          <button className="menu-item"><LuFileText /> Resume Controls</button>
          
          <div className="section-title">System</div>
          <button className="menu-item"><LuActivity /> Audit Logs</button>
          <button className="menu-item"><LuSettings /> System Settings</button>
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
          <div className="data-section">
            <div className="table-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>User Management</h2>
              <button className="action-btn" style={{ padding: '6px 12px' }}>View All</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{user.username}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{user.email}</div>
                    </td>
                    <td>{user.roles_id === 3 ? "HR" : user.roles_id === 1 ? "Admin" : "Seeker"}</td>
                    <td>
                      <span className={`status-badge status-${user.status}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      {/* ถ้าเป็น HR และรออนุมัติ ให้โชว์ปุ่ม Approve */}
                      {user.roles_id === 3 && user.status === 'pending' ? (
                        <button className="action-btn" onClick={() => handleApproveHR(user.id)} title="Approve HR">
                          <LuCheck color="#10b981" />
                        </button>
                      ) : null}

                      {/* ปุ่มระงับการใช้งาน */}
                      {user.status !== 'banned' ? (
                        <button className="action-btn" onClick={() => handleUpdateStatus(user.id, 'banned')} title="Ban User">
                          <LuBan color="#ef4444" />
                        </button>
                      ) : (
                        <button className="action-btn" onClick={() => handleUpdateStatus(user.id, 'active')}>
                          Unban
                        </button>
                      )}
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