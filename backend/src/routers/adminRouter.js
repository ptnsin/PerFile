import { Router } from "express";
//import db from "../db.js";
import { requireRole } from '../middleware/requireRole.js'

const router = Router();

// ─────────────────────────────────────────────
// Middleware: ตรวจสอบว่าเป็น admin เท่านั้น
// ─────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

// Helper: บันทึก audit log
const logAction = async (adminId, action, targetId = null, detail = null) => {
  try {
    await db.query(
      "INSERT INTO audit_logs (admin_id, action, target_id, detail, created_at) VALUES (?, ?, ?, ?, NOW())",
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
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const { role, status, page = 1 } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;

    let conditions = [];
    let params = [];

    if (role) {
      conditions.push("role = ?");
      params.push(role);
    }
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [users] = await db.query(
      `SELECT id, name, email, role, status, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params
    );

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
router.put("/users/:id/role", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["user", "hr", "admin"];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Allowed: user, hr, admin" });
    }

    const [result] = await db.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [[user]] = await db.query(
      "SELECT id, name, email, role, status FROM users WHERE id = ?",
      [id]
    );

    await logAction(req.user.id, "CHANGE_ROLE", id, `New role: ${role}`);

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
router.put("/users/:id/status", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["active", "suspended", "banned"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Allowed: active, suspended, banned" });
    }

    const [result] = await db.query(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [[user]] = await db.query(
      "SELECT id, name, email, role, status FROM users WHERE id = ?",
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
router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

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
router.post("/hr/approve/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [[hrUser]] = await db.query(
      "SELECT id, role, status FROM users WHERE id = ? AND role = 'hr'",
      [id]
    );

    if (!hrUser) {
      return res.status(404).json({ message: "HR account not found" });
    }

    if (hrUser.status !== "pending") {
      return res.status(400).json({ message: "This HR account is not in pending status" });
    }

    await db.query("UPDATE users SET status = 'active' WHERE id = ?", [id]);

    await logAction(req.user.id, "APPROVE_HR", id, `Approved HR ID: ${id}`);

    res.status(200).json({ message: "HR account approved successfully" });
  } catch (err) {
    console.error(err);
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
router.delete("/hr/revoke/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [[hrUser]] = await db.query(
      "SELECT id, role FROM users WHERE id = ? AND role = 'hr'",
      [id]
    );

    if (!hrUser) {
      return res.status(404).json({ message: "HR account not found" });
    }

    await db.query("UPDATE users SET status = 'pending' WHERE id = ?", [id]);

    await logAction(req.user.id, "REVOKE_HR", id, `Revoked HR ID: ${id}`);

    res.status(200).json({ message: "HR account revoked and set back to pending" });
  } catch (err) {
    console.error(err);
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
router.get("/audit-logs", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const parsedLimit = parseInt(limit);
    const offset = (parseInt(page) - 1) * parsedLimit;

    const [logs] = await db.query(
      `SELECT al.id, al.action, al.target_id, al.detail, al.created_at,
              u.name AS admin_name, u.email AS admin_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.admin_id
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [parsedLimit, offset]
    );

    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM audit_logs");

    res.status(200).json({ logs, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// 8. GET /admin/stats
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: ดู dashboard สถิติในระบบ
 *     description: แสดงจำนวน user / resume / HR ทั้งหมดในระบบ
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ดึงสถิติสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: integer
 *                   example: 120
 *                 resumes:
 *                   type: integer
 *                   example: 85
 *                 hrAccounts:
 *                   type: integer
 *                   example: 15
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [[{ users }]] = await db.query(
      "SELECT COUNT(*) AS users FROM users WHERE role = 'user'"
    );
    const [[{ resumes }]] = await db.query(
      "SELECT COUNT(*) AS resumes FROM resumes"
    );
    const [[{ hrAccounts }]] = await db.query(
      "SELECT COUNT(*) AS hrAccounts FROM users WHERE role = 'hr'"
    );

    res.status(200).json({ users, resumes, hrAccounts });
  } catch (err) {
    console.error(err);
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
router.put("/settings", requireAdmin, async (req, res) => {
  try {
    const { maxFileSize, maintenanceMode } = req.body;

    if (maxFileSize === undefined && maintenanceMode === undefined) {
      return res.status(400).json({ message: "No settings provided to update" });
    }

    const [[current]] = await db.query("SELECT * FROM system_settings WHERE id = 1");

    const updatedMaxFileSize =
      maxFileSize !== undefined ? parseInt(maxFileSize) : current.max_file_size;
    const updatedMaintenanceMode =
      maintenanceMode !== undefined ? Boolean(maintenanceMode) : current.maintenance_mode;

    await db.query(
      "UPDATE system_settings SET max_file_size = ?, maintenance_mode = ? WHERE id = 1",
      [updatedMaxFileSize, updatedMaintenanceMode]
    );

    await logAction(
      req.user.id,
      "UPDATE_SETTINGS",
      null,
      `maxFileSize: ${updatedMaxFileSize}, maintenanceMode: ${updatedMaintenanceMode}`
    );

    res.status(200).json({
      message: "Settings updated successfully",
      settings: {
        maxFileSize: updatedMaxFileSize,
        maintenanceMode: updatedMaintenanceMode,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
