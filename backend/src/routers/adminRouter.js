import { Router } from "express";
import db from '../config/db.js'
import prisma from '../config/prisma.js'
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from '../middleware/requireRole.js'

const router = Router();

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.roles_id !== 1 ) {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

const logAction = async (adminId, action, targetId = null, detail = null) => {
  try {
    await db.query(
      "INSERT INTO audit_logs (admin_id, action, target_id, detail) VALUES (?, ?, ?, ?)",
      [adminId, action, targetId, detail]
    );
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

router.get("/users",authMiddleware, requireRole(1), async (req, res) => {
  try {
    const { role, status, page = 1, search } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;

    let conditions = [];
    let params = [];

    if (role) {
    let roleId = role;
    if (role === 'admin') roleId = 1;
    else if (role === 'user') roleId = 2;
    else if (role === 'hr') roleId = 3;

    conditions.push("roles_id = ?"); 
    params.push(roleId);
    }
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (search) {
      conditions.push("(username LIKE ? OR email LIKE ? OR fullName LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [users] = await db.query(
      `SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.google_id,
        u.github_id,
        u.fullName, 
        u.avatar, 
        h.company,
        u.roles_id, 
        u.status, 
        u.created_at 
      FROM users u
      LEFT JOIN hr_profiles h ON u.id = h.user_id 
      ${whereClause} 
      ORDER BY u.created_at DESC 
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [totalResult] = await db.query(
    `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params
    );

    const total = totalResult[0].total;

    res.status(200).json({ users, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/users/:id/role",authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const roleMap = { admin: 1, user: 2, hr: 3 };
    const roleId = roleMap[role];

    if (!roleId) {
      return res.status(400).json({ message: "Invalid role. Allowed: admin, user, hr" });
    }

    const [result] = await db.query(
      "UPDATE users SET roles_id = ? WHERE id = ?",
      [roleId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [rows] = await db.query(
      "SELECT id, username, email, roles_id, status FROM users WHERE id = ?",
      [id]
    );
    const user = rows[0];

    await logAction(req.user.id, "CHANGE_ROLE", id, `Changed to: ${role}`);

    res.status(200).json({ message: "Role updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/users/:id/status",authMiddleware , requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["active", "pending", "suspended", "banned"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Allowed: active, pending, suspended, banned" });
    }

    const [result] = await db.query(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [[user]] = await db.query(
      "SELECT id, username, email, roles_id, status FROM users WHERE id = ?",
      [id]
    );

    await logAction(req.user.id, "CHANGE_STATUS", id, `New status: ${status}`);

    res.status(200).json({ message: `User status updated to "${status}"`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/users/:id",authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own admin account!" });
    }

    const [[user]] = await db.query("SELECT id FROM users WHERE id = ?", [id]);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.query("DELETE FROM users WHERE id = ?", [id]);

    await logAction(req.user.id, "DELETE_USER", id, `Deleted user ID: ${id}`);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/hr/approve/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT id, username, status FROM users WHERE id = ? AND roles_id = 3",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบบัญชี HR นี้ในระบบ" });
    }

    const hrUser = rows[0];

    if (hrUser.status !== "pending") {
      return res.status(400).json({ message: "บัญชีนี้ไม่ได้อยู่ในสถานะรออนุมัติ" });
    }

    await db.query("UPDATE users SET status = 'active' WHERE id = ?", [id]);

    await logAction(req.user.id, "APPROVE_HR", id, `Approved HR: ${hrUser.username}`);

    res.status(200).json({ message: "อนุมัติบัญชี HR เรียบร้อยแล้ว" });
  } catch (err) {
    console.error("Approve HR Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/hr/revoke/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT id FROM users WHERE id = ? AND roles_id = 3",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูล HR ที่ต้องการยกเลิกสิทธิ์" });
    }

    await db.query("UPDATE users SET status = 'pending' WHERE id = ?", [id]);

    if (typeof logAction === "function") {
      await logAction(
        req.user.id, 
        "REVOKE_HR", 
        id, 
        `Admin ID: ${req.user.id} revoked HR ID: ${id} back to pending`
      );
    }

    res.status(200).json({ message: "ยกเลิกสิทธิ์ HR เรียบร้อยแล้ว (สถานะเปลี่ยนเป็น pending)" });
  } catch (err) {
    console.error("Revoke HR Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/audit-logs", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, action, admin, target } = req.query;
    const parsedLimit = parseInt(limit);
    const offset = (parseInt(page) - 1) * parsedLimit;

    let conditions = [];
    let params = [];

    if (action) {
      conditions.push("al.action = ?");
      params.push(action);
    }

    if (admin) {
      conditions.push("u1.username LIKE ?");
      params.push(`%${admin}%`);
    }

    if (target) {
      conditions.push("u2.username LIKE ?");
      params.push(`%${target}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [logs] = await db.query(
      `SELECT al.id, 
              al.action, 
              al.target_id, 
              al.detail, 
              al.created_at,
              u1.username AS admin_name, 
              u2.username AS target_name
       FROM audit_logs al
       LEFT JOIN users u1 ON al.admin_id = u1.id
       LEFT JOIN users u2 ON al.target_id = u2.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parsedLimit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total 
       FROM audit_logs al
       LEFT JOIN users u1 ON al.admin_id = u1.id
       LEFT JOIN users u2 ON al.target_id = u2.id
       ${whereClause}`, 
      params
    );

    res.status(200).json({ logs, total });
  } catch (err) {
    console.error("Audit Logs Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/dashboard-stats", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [userRows] = await db.query(
      "SELECT roles_id, COUNT(*) as count FROM users GROUP BY roles_id"
    );
    
    const userStats = {
      admin: userRows.find(r => r.roles_id === 1)?.count || 0,
      generalUser: userRows.find(r => r.roles_id === 2)?.count || 0,
      hr: userRows.find(r => r.roles_id === 3)?.count || 0
    };

    const [resumeRows] = await db.query(
      "SELECT visibility, COUNT(*) as count FROM resumes GROUP BY visibility"
    );
    
    const resumeStats = {
      public: resumeRows.find(r => r.visibility === 'public')?.count || 0,
      private: resumeRows.find(r => r.visibility === 'private')?.count || 0
    };

    const [jobRows] = await db.query("SELECT COUNT(*) as count FROM Job");
    const jobStats = { total: jobRows[0].count || 0 };

    const [pendingRows] = await db.query(
      "SELECT COUNT(*) as pendingHR FROM users WHERE roles_id = 3 AND status = 'pending'"
    );

    res.status(200).json({
      userStats,
      resumeStats,
      jobStats,
      pendingHR: pendingRows[0].pendingHR
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/settings", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { maxFileSize, maintenanceMode, maxResumesPerUser, allowRegistration, autoApproveHr } = req.body;

    if ([maxFileSize, maintenanceMode, maxResumesPerUser, allowRegistration, autoApproveHr].every(v => v === undefined)) {
      return res.status(400).json({ message: "No settings provided to update" });
    }

    const [rows] = await db.query("SELECT * FROM system_settings WHERE id = 1");

    if (rows.length === 0) {
      await db.query(`INSERT INTO system_settings 
        (id, max_file_size, maintenance_mode, max_resumes_per_user, allow_registration, auto_approve_hr) 
        VALUES (1, 10485760, 0, 5, 1, 0)`);
      return res.status(200).json({ message: "Settings initialized. Please try updating again." });
    }

    const c = rows[0];

    const updatedMaxFileSize      = maxFileSize        !== undefined ? parseInt(maxFileSize)           : c.max_file_size;
    const updatedMaintenanceMode  = maintenanceMode    !== undefined ? (maintenanceMode    ? 1 : 0)    : c.maintenance_mode;
    const updatedMaxResumes       = maxResumesPerUser  !== undefined ? parseInt(maxResumesPerUser)     : c.max_resumes_per_user;
    const updatedAllowReg         = allowRegistration  !== undefined ? (allowRegistration  ? 1 : 0)    : c.allow_registration;
    const updatedAutoApprove      = autoApproveHr      !== undefined ? (autoApproveHr      ? 1 : 0)    : c.auto_approve_hr;

    await db.query(
      `UPDATE system_settings SET 
        max_file_size = ?, maintenance_mode = ?, 
        max_resumes_per_user = ?, allow_registration = ?, auto_approve_hr = ?
       WHERE id = 1`,
      [updatedMaxFileSize, updatedMaintenanceMode, updatedMaxResumes, updatedAllowReg, updatedAutoApprove]
    );

    if (typeof logAction === "function") {
      await logAction(req.user.id, "UPDATE_SETTINGS", null,
        `maxFileSize: ${updatedMaxFileSize}, maintenanceMode: ${updatedMaintenanceMode}, ` +
        `maxResumes: ${updatedMaxResumes}, allowReg: ${updatedAllowReg}, autoApproveHr: ${updatedAutoApprove}`
      );
    }

    res.status(200).json({
      message: "Settings updated successfully",
      settings: {
        maxFileSize:        updatedMaxFileSize,
        maintenanceMode:    !!updatedMaintenanceMode,
        maxResumesPerUser:  updatedMaxResumes,
        allowRegistration:  !!updatedAllowReg,
        autoApproveHr:      !!updatedAutoApprove,
      },
    });
  } catch (err) {
    console.error("Update Settings Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/settings", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM system_settings WHERE id = 1");

    if (rows.length === 0) {
      await db.query(`INSERT INTO system_settings 
        (id, max_file_size, maintenance_mode, max_resumes_per_user, allow_registration, auto_approve_hr) 
        VALUES (1, 10485760, 0, 5, 1, 0)`);
      return res.status(200).json({
        maxFileSize: 10485760, maintenanceMode: false,
        maxResumesPerUser: 5, allowRegistration: true, autoApproveHr: false
      });
    }

    const s = rows[0];
    res.status(200).json({
      maxFileSize:       s.max_file_size,
      maintenanceMode:   !!s.maintenance_mode,
      maxResumesPerUser: s.max_resumes_per_user ?? 5,
      allowRegistration: s.allow_registration  !== undefined ? !!s.allow_registration : true,
      autoApproveHr:     !!s.auto_approve_hr,
    });
  } catch (err) {
    console.error("Get Settings Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/resumes", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        r.id, 
        r.title, 
        r.template, 
        r.visibility, 
        r.created_at, 
        r.updated_at,
        u.username AS owner_name,
        u.email AS owner_email
      FROM resumes r
      JOIN users u ON r.user_id = u.id
    `;
    
    const params = [];
    if (search) {
      query += " WHERE r.title LIKE ? OR u.username LIKE ? OR u.email LIKE ?";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY r.created_at DESC";

    const [resumes] = await db.query(query, params);
    
    res.status(200).json(resumes);
  } catch (err) {
    console.error("Fetch all resumes error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/resumes/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [[resume]] = await db.query("SELECT id FROM resumes WHERE id = ?", [id]);
    if (!resume) {
      return res.status(404).json({ message: "ไม่พบ Resume ที่ต้องการลบ" });
    }

    await db.query("DELETE FROM resumes WHERE id = ?", [id]);

    await logAction(req.user.id, "DELETE_RESUME", id, `Admin deleted resume ID: ${id}`);

    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (err) {
    console.error("Admin Delete Resume Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/all-jobs', authMiddleware, async (req, res) => {
  try {
    const [jobs] = await db.query(`
      SELECT 
        j.*, 
        h.company AS company_name, 
        u.fullName AS hr_name 
      FROM Job j                     
      LEFT JOIN users u ON j.hrId = u.id
      LEFT JOIN hr_profiles h ON u.id = h.user_id 
      WHERE j.status = 'เปิดรับสมัคร'
      ORDER BY j.createdAt DESC
    `);
    res.json({ jobs });
  } catch (err) {
    console.error("Fetch jobs error:", err.message);
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// ─────────────────────────────────────────────
// ✅ NEW: DELETE /admin/jobs/:id
// ลบ Job Post โดย Admin
// ─────────────────────────────────────────────
router.delete("/jobs/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. ตรวจสอบว่า Job นี้มีอยู่จริง
    const [[job]] = await db.query("SELECT id FROM Job WHERE id = ?", [id]);
    if (!job) {
      return res.status(404).json({ message: "ไม่พบ Job Post ที่ต้องการลบ" });
    }

    // 2. ลบ Job
    await db.query("DELETE FROM Job WHERE id = ?", [id]);

    // 3. บันทึก Audit Log
    await logAction(req.user.id, "DELETE_JOB", id, `Admin deleted Job ID: ${id}`);

    res.status(200).json({ message: "ลบ Job Post สำเร็จ" });
  } catch (err) {
    console.error("Admin Delete Job Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;