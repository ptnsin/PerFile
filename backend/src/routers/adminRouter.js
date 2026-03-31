import { Router } from "express";
import db from '../config/db.js'
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from '../middleware/requireRole.js'

const router = Router();

// ─────────────────────────────────────────────
// Middleware: ตรวจสอบว่าเป็น admin เท่านั้น
// ─────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.roles_id !== 1 ) {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

// Helper: บันทึก audit log
const logAction = async (adminId, action, targetId = null, detail = null) => {
  try {
    // ตัด created_at ออก เพราะ DB ใส่ให้เองอัตโนมัติ
    await db.query(
      "INSERT INTO audit_logs (admin_id, action, target_id, detail) VALUES (?, ?, ?, ?)",
      [adminId, action, targetId, detail]
    );
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: API สำหรับผู้ดูแลระบบ (Admin only)
 */

// ─────────────────────────────────────────────
// 1. GET /admin/users
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: ดูรายชื่อ user ทั้งหมด
 *     description: ดึงรายชื่อ user ทั้งหมดในระบบ สามารถกรองตาม role และ status ได้
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, hr, admin]
 *         description: กรองตาม role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, banned, pending]
 *         description: กรองตาม status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: หน้าที่ต้องการ (20 รายการต่อหน้า)
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       name: { type: string }
 *                       email: { type: string }
 *                       role: { type: string }
 *                       status: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                 total:
 *                   type: integer
 *                   example: 42
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
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
        id, 
        username, 
        email, 
        google_id,
        github_id,
        fullName, 
        avatar, 
        company, 
        roles_id, 
        status, 
        created_at 
      FROM users 
      ${whereClause} 
      ORDER BY created_at DESC 
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

// ─────────────────────────────────────────────
// 2. PUT /admin/users/:id/role
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/users/{id}/role:
 *   put:
 *     summary: เปลี่ยน role ของ user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, hr, admin]
 *                 example: hr
 *     responses:
 *       200:
 *         description: เปลี่ยน role สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     status: { type: string }
 *       400:
 *         description: role ไม่ถูกต้อง
 *       403:
 *         description: Access denied
 *       404:
 *         description: ไม่พบ user
 *       500:
 *         description: Internal server error
 */
router.put("/users/:id/role",authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // รับมาเป็น 'admin', 'hr', หรือ 'user'

    // 1. แปลงคำอ่านจาก Body ให้เป็นตัวเลข ID ตามตาราง roles ที่คุณเปิดโชว์
    const roleMap = { admin: 1, user: 2, hr: 3 };
    const roleId = roleMap[role];

    if (!roleId) {
      return res.status(400).json({ message: "Invalid role. Allowed: admin, user, hr" });
    }

    // 2. อัปเดต roles_id (ต้องใช้ชื่อคอลัมน์นี้ตามตาราง users ของคุณ)
    const [result] = await db.query(
      "UPDATE users SET roles_id = ? WHERE id = ?",
      [roleId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. ดึงข้อมูลกลับมาโชว์ (เปลี่ยน name เป็น username / role เป็น roles_id)
    const [rows] = await db.query(
      "SELECT id, username, email, roles_id, status FROM users WHERE id = ?",
      [id]
    );
    const user = rows[0];

    // 4. บันทึก Log (ถ้ายังไม่มีตาราง audit_logs ให้คอมเมนต์บรรทัดนี้ไว้ก่อน)
    await logAction(req.user.id, "CHANGE_ROLE", id, `Changed to: ${role}`);

    res.status(200).json({ message: "Role updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// 3. PUT /admin/users/:id/status
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/users/{id}/status:
 *   put:
 *     summary: ban / suspend / activate user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended, banned]
 *                 example: banned
 *     responses:
 *       200:
 *         description: เปลี่ยนสถานะสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     status: { type: string }
 *       400:
 *         description: status ไม่ถูกต้อง
 *       403:
 *         description: Access denied
 *       404:
 *         description: ไม่พบ user
 *       500:
 *         description: Internal server error
 */
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

// ─────────────────────────────────────────────
// 4. DELETE /admin/users/:id
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: ลบ user ออกจากระบบถาวร
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ user ที่ต้องการลบ
 *     responses:
 *       200:
 *         description: ลบ user สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "User deleted successfully" }
 *       403:
 *         description: Access denied
 *       404:
 *         description: ไม่พบ user
 *       500:
 *         description: Internal server error
 */
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

// ─────────────────────────────────────────────
// 5. POST /admin/hr/approve/:id
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/hr/approve/{id}:
 *   post:
 *     summary: อนุมัติ HR account ที่รอ pending
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ HR ที่ต้องการอนุมัติ
 *     responses:
 *       200:
 *         description: อนุมัติ HR สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "HR account approved successfully" }
 *       400:
 *         description: HR account ไม่ได้อยู่ในสถานะ pending
 *       403:
 *         description: Access denied
 *       404:
 *         description: ไม่พบ HR account
 *       500:
 *         description: Internal server error
 */
router.post("/hr/approve/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. แก้ role เป็น roles_id และเช็คเลข 3 (HR)
    const [rows] = await db.query(
      "SELECT id, username, status FROM users WHERE id = ? AND roles_id = 3",
      [id]
    );

    // เช็คว่าเจอ HR ไหม
    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบบัญชี HR นี้ในระบบ" });
    }

    const hrUser = rows[0];

    // 2. เช็คสถานะว่ารออนุมัติ (pending) จริงไหม
    if (hrUser.status !== "pending") {
      return res.status(400).json({ message: "บัญชีนี้ไม่ได้อยู่ในสถานะรออนุมัติ" });
    }

    // 3. อัปเดตสถานะเป็น active
    await db.query("UPDATE users SET status = 'active' WHERE id = ?", [id]);

    // 4. บันทึก Log โดยใช้ username จริง
    await logAction(req.user.id, "APPROVE_HR", id, `Approved HR: ${hrUser.username}`);

    res.status(200).json({ message: "อนุมัติบัญชี HR เรียบร้อยแล้ว" });
  } catch (err) {
    console.error("Approve HR Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// 6. DELETE /admin/hr/revoke/:id
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/hr/revoke/{id}:
 *   delete:
 *     summary: ยกเลิกสิทธิ์ HR ให้กลับไปเป็น pending
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของ HR ที่ต้องการยกเลิกสิทธิ์
 *     responses:
 *       200:
 *         description: ยกเลิกสิทธิ์ HR สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "HR account revoked and set back to pending" }
 *       403:
 *         description: Access denied
 *       404:
 *         description: ไม่พบ HR account
 *       500:
 *         description: Internal server error
 */
router.delete("/hr/revoke/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. ตรวจสอบว่ามี User นี้จริงไหม และต้องเป็น HR (roles_id = 3)
    // เปลี่ยนจาก role = 'hr' เป็น roles_id = 3
    const [rows] = await db.query(
      "SELECT id FROM users WHERE id = ? AND roles_id = 3",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูล HR ที่ต้องการยกเลิกสิทธิ์" });
    }

    // 2. อัปเดตสถานะกลับเป็น pending (เพื่อให้ HR เข้าใช้งานไม่ได้จนกว่าจะอนุมัติใหม่)
    await db.query("UPDATE users SET status = 'pending' WHERE id = ?", [id]);

    // 3. บันทึก Log การกระทำของ Admin
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

// ─────────────────────────────────────────────
// 7. GET /admin/audit-logs
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: ดู log การกระทำทั้งหมดในระบบ
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: หน้าที่ต้องการ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: จำนวนรายการต่อหน้า
 *     responses:
 *       200:
 *         description: ดึง logs สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       action: { type: string }
 *                       target_id: { type: integer }
 *                       detail: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                       admin_name: { type: string }
 *                       admin_email: { type: string }
 *                 total:
 *                   type: integer
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get("/audit-logs", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const parsedLimit = parseInt(limit);
    const offset = (parseInt(page) - 1) * parsedLimit;

    // แก้ u.name เป็น u.username ให้ตรงกับ Database จริงของคุณ
    const [logs] = await db.query(
      `SELECT al.id, al.action, al.target_id, al.detail, al.created_at,
              u.username AS admin_name, u.email AS admin_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.admin_id
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [parsedLimit, offset]
    );

    // ดึงจำนวนทั้งหมดเพื่อทำ Pagination
    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM audit_logs");

    res.status(200).json({ logs, total });
  } catch (err) {
    console.error("Audit Logs Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// 8. GET /admin/dashboard-stats
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/dashboard-stats:
 *   get:
 *     summary: ดึงข้อมูลสถิติทั้งหมดสำหรับหน้า Admin Dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ข้อมูลสถิติภาพรวมของระบบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userStats:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       type: integer
 *                     generalUser:
 *                       type: integer
 *                     hr:
 *                       type: integer
 *                 resumeStats:
 *                   type: object
 *                   properties:
 *                     public:
 *                       type: integer
 *                     private:
 *                       type: integer
 *                 postStats:
 *                   type: object
 *                   properties:
 *                     public:
 *                       type: integer
 *                     private:
 *                       type: integer
 *                 pendingHR:
 *                   type: integer
 *       403:
 *         description: Access denied - Admins only
 *       500:
 *         description: Internal server error
 */

router.get("/dashboard-stats", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [userRows] = await db.query(
      "SELECT roles_id, COUNT(*) as count FROM users WHERE status = 'active' GROUP BY roles_id"
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

    const [postRows] = await db.query(
      "SELECT visibility, COUNT(*) as count FROM posts GROUP BY visibility"
    ).catch(() => [[]]); // กันเหนียวถ้ายังไม่มีตารางหรือคอลัมน์ visibility ใน posts
    
    const postStats = {
      public: postRows.find(r => r.visibility === 'public')?.count || 0,
      private: postRows.find(r => r.visibility === 'private')?.count || 0
    };

    const [pendingRows] = await db.query("SELECT COUNT(*) as pendingHR FROM users WHERE roles_id = 3 AND status = 'pending'");
    const pendingHR = pendingRows[0].pendingHR;

    res.status(200).json({
      userStats,
      resumeStats,
      postStats,
      pendingHR
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// 9. PUT /admin/settings
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/settings:
 *   put:
 *     summary: ตั้งค่าระบบ
 *     description: ปรับค่า เช่น ขนาดไฟล์สูงสุด และ maintenance mode
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxFileSize:
 *                 type: integer
 *                 description: ขนาดไฟล์สูงสุด (bytes)
 *                 example: 10485760
 *               maintenanceMode:
 *                 type: boolean
 *                 description: เปิด/ปิด maintenance mode
 *                 example: false
 *     responses:
 *       200:
 *         description: บันทึกการตั้งค่าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 settings:
 *                   type: object
 *                   properties:
 *                     maxFileSize: { type: integer }
 *                     maintenanceMode: { type: boolean }
 *       400:
 *         description: ไม่มี field ที่จะอัปเดต
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.put("/settings", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { maxFileSize, maintenanceMode } = req.body;

    if (maxFileSize === undefined && maintenanceMode === undefined) {
      return res.status(400).json({ message: "No settings provided to update" });
    }

    // 1. ดึงค่าปัจจุบันมาดู (และป้องกันกรณีไม่มีข้อมูลใน DB)
    const [rows] = await db.query("SELECT * FROM system_settings WHERE id = 1");
    
    // ถ้ายังไม่มีข้อมูลแถวที่ 1 ให้สร้างขึ้นมาใหม่ (Default)
    if (rows.length === 0) {
      await db.query("INSERT INTO system_settings (id, max_file_size, maintenance_mode) VALUES (1, 10485760, 0)");
      return res.status(200).json({ message: "Settings initialized. Please try updating again." });
    }

    const current = rows[0];

    // 2. เตรียมค่าที่จะอัปเดต
    const updatedMaxFileSize = maxFileSize !== undefined ? parseInt(maxFileSize) : current.max_file_size;
    
    // แปลง boolean เป็น 1 หรือ 0 สำหรับ MySQL TinyInt
    const updatedMaintenanceMode = maintenanceMode !== undefined ? (maintenanceMode ? 1 : 0) : current.maintenance_mode;

    // 3. อัปเดตลง Database
    await db.query(
      "UPDATE system_settings SET max_file_size = ?, maintenance_mode = ? WHERE id = 1",
      [updatedMaxFileSize, updatedMaintenanceMode]
    );

    // 4. บันทึก Log (ตอนนี้จะไม่ Error แล้วเพราะมี authMiddleware)
    if (typeof logAction === "function") {
      await logAction(
        req.user.id,
        "UPDATE_SETTINGS",
        null,
        `maxFileSize: ${updatedMaxFileSize}, maintenanceMode: ${updatedMaintenanceMode}`
      );
    }

    res.status(200).json({
      message: "Settings updated successfully",
      settings: {
        maxFileSize: updatedMaxFileSize,
        maintenanceMode: !!updatedMaintenanceMode, // แปลงกลับเป็น boolean ส่งให้ Frontend
      },
    });
  } catch (err) {
    console.error("Update Settings Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
