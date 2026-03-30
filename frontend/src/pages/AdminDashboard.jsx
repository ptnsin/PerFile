import React from "react";
import "../styles/AdminDashboard.css"; // Import ไฟล์ CSS
import { LuSearch, LuBell, LuUser, LuUsers, LuFileText, LuSettings, LuActivity, LuShieldCheck } from "react-icons/lu";
import { FiHome, FiGrid } from "react-icons/fi";

export default function AdminDashboard() {
  return (
    <div className="admin-page">
      {/* NAV */}
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
        {/* SIDEBAR */}
        <aside className="admin-sidebar">
          <div className="section-title">Main Menu</div>
          <button className="menu-item active"><FiHome /> Overview</button>
          <button className="menu-item"><LuUsers /> User Management</button>
          <button className="menu-item"><LuFileText /> Resume Controls</button>
          
          <div className="section-title">System</div>
          <button className="menu-item"><LuActivity /> Audit Logs</button>
          <button className="menu-item"><LuSettings /> System Settings</button>
        </aside>

        {/* MAIN */}
        <main className="admin-main">
          <header className="dashboard-header">
            <h1 className="dashboard-title">Dashboard Overview</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>ยินดีต้อนรับกลับมา, ข้อมูลระบบล่าสุดในวันนี้</p>
          </header>

          {/* STATS CARDS */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Seekers</span>
              <span className="stat-num">1,284</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Active HRs</span>
              <span className="stat-num">42</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Pending Approval</span>
              <span className="stat-num" style={{ color: '#d97706' }}>12</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Resumes</span>
              <span className="stat-num">3,512</span>
            </div>
          </div>

          {/* USER TABLE EXAMPLE */}
          <div className="data-section">
            <div className="table-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Registrations</h2>
              <button className="action-btn" style={{ padding: '6px 12px' }}>View All</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>pao_dev</td>
                  <td>pao@example.com</td>
                  <td>User</td>
                  <td><span className="status-badge status-active">Active</span></td>
                  <td>
                    <button className="action-btn">Edit</button>
                    <button className="action-btn">Ban</button>
                  </td>
                </tr>
                {/* เพิ่มข้อมูลอื่นๆ ตรงนี้ */}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}