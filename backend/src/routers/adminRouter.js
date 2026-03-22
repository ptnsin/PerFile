
// import { Router } from "express";
// import db from "../db.js"; //ยังไม่มี

// const router = Router();

// // ─────────────────────────────────────────────
// // Middleware: ตรวจสอบว่าเป็น admin เท่านั้น
// // ─────────────────────────────────────────────
// const requireAdmin = (req, res, next) => {
//   // สมมติว่า auth middleware ใส่ข้อมูล user ไว้ใน req.user แล้ว
//   if (!req.user || req.user.role !== "admin") {
//     return res.status(403).json({ message: "Access denied: Admins only" });
//   }
//   next();
// };

// // Helper: บันทึก audit log
// const logAction = async (adminId, action, targetId = null, detail = null) => {
//   try {
//     await db.query(
//       "INSERT INTO audit_logs (admin_id, action, target_id, detail, created_at) VALUES (?, ?, ?, ?, NOW())",
//       [adminId, action, targetId, detail]
//     );
//   } catch (err) {
//     console.error("Audit log error:", err.message);
//   }
// };

// // ─────────────────────────────────────────────
// // 1. GET /admin/users
// //    ดูรายชื่อ user ทั้งหมด กรองตาม role / status ได้
// //    Query: ?role=&status=&page=
// // ─────────────────────────────────────────────
// router.get("/users", requireAdmin, async (req, res) => {
//   try {
//     const { role, status, page = 1 } = req.query;
//     const limit = 20;
//     const offset = (parseInt(page) - 1) * limit;

//     let conditions = [];
//     let params = [];

//     if (role) {
//       conditions.push("role = ?");
//       params.push(role);
//     }
//     if (status) {
//       conditions.push("status = ?");
//       params.push(status);
//     }

//     const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

//     const [users] = await db.query(
//       `SELECT id, name, email, role, status, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
//       [...params, limit, offset]
//     );

//     const [[{ total }]] = await db.query(
//       `SELECT COUNT(*) AS total FROM users ${whereClause}`,
//       params
//     );

//     res.status(200).json({ users, total });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // ─────────────────────────────────────────────
// // 2. PUT /admin/users/:id/role
// //    เปลี่ยน role ของ user
// //    Body: { role }
// // ─────────────────────────────────────────────
// router.put("/users/:id/role", requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { role } = req.body;

//     const allowedRoles = ["user", "hr", "admin"];
//     if (!role || !allowedRoles.includes(role)) {
//       return res.status(400).json({ message: "Invalid role. Allowed: user, hr, admin" });
//     }

//     const [result] = await db.query(
//       "UPDATE users SET role = ? WHERE id = ?",
//       [role, id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const [[user]] = await db.query(
//       "SELECT id, name, email, role, status FROM users WHERE id = ?",
//       [id]
//     );

//     await logAction(req.user.id, "CHANGE_ROLE", id, `New role: ${role}`);

//     res.status(200).json({ message: "Role updated successfully", user });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // ─────────────────────────────────────────────
// // 3. PUT /admin/users/:id/status
// //    ban / suspend / activate user
// //    Body: { status }
// // ─────────────────────────────────────────────
// router.put("/users/:id/status", requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const allowedStatuses = ["active", "suspended", "banned"];
//     if (!status || !allowedStatuses.includes(status)) {
//       return res.status(400).json({ message: "Invalid status. Allowed: active, suspended, banned" });
//     }

//     const [result] = await db.query(
//       "UPDATE users SET status = ? WHERE id = ?",
//       [status, id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const [[user]] = await db.query(
//       "SELECT id, name, email, role, status FROM users WHERE id = ?",
//       [id]
//     );

//     await logAction(req.user.id, "CHANGE_STATUS", id, `New status: ${status}`);

//     res.status(200).json({ message: `User status updated to "${status}"`, user });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // ─────────────────────────────────────────────
// // 4. DELETE /admin/users/:id
// //    ลบ user ออกจากระบบถาวร
// // ─────────────────────────────────────────────
// router.delete("/users/:id", requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [[user]] = await db.query("SELECT id FROM users WHERE id = ?", [id]);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     await db.query("DELETE FROM users WHERE id = ?", [id]);

//     await logAction(req.user.id, "DELETE_USER", id, `Deleted user ID: ${id}`);

//     res.status(200).json({ message: "User deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // ─────────────────────────────────────────────
// // 5. POST /admin/hr/approve/:id
// //    อนุมัติ HR account ที่รอ pending ให้ใช้งานได้
// // ─────────────────────────────────────────────
// router.post("/hr/approve/:id", requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [[hrUser]] = await db.query(
//       "SELECT id, role, status FROM users WHERE id = ? AND role = 'hr'",
//       [id]
//     );

//     if (!hrUser) {
//       return res.status(404).json({ message: "HR account not found" });
//     }

//     if (hrUser.status !== "pending") {
//       return res.status(400).json({ message: "This HR account is not in pending status" });
//     }

//     await db.query(
//       "UPDATE users SET status = 'active' WHERE id = ?",
//       [id]
//     );

//     await logAction(req.user.id, "APPROVE_HR", id, `Approved HR ID: ${id}`);

//     res.status(200).json({ message: "HR account approved successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // ─────────────────────────────────────────────
// // 6. DELETE /admin/hr/revoke/:id
// //    ยกเลิกสิทธิ์ HR ให้กลับไปเป็น pending
// // ─────────────────────────────────────────────
// router.delete("/hr/revoke/:id", requireAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [[hrUser]] = await db.query(
//       "SELECT id, role FROM users WHERE id = ? AND role = 'hr'",
//       [id]
//     );

//     if (!hrUser) {
//       return res.status(404).json({ message: "HR account not found" });
//     }

//     await db.query(
//       "UPDATE users SET status = 'pending' WHERE id = ?",
//       [id]
//     );

//     await logAction(req.user.id, "REVOKE_HR", id, `Revoked HR ID: ${id}`);

//     res.status(200).json({ message: "HR account revoked and set back to pending" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // ─────────────────────────────────────────────
// // 7. GET /admin/audit-logs
// //    ดู log การกระทำทั้งหมดในระบบ
// //    Query: ?page=&limit=
// // ─────────────────────────────────────────────
// router.get("/audit-logs", requireAdmin, async (req, res) => {
//   try {
//     const { page = 1, limit = 20 } = req.query;
//     const parsedLimit = parseInt(limit);
//     const offset = (parseInt(page) - 1) * parsedLimit;

//     const [logs] = await db.query(
//       `SELECT al.id, al.action, al.target_id, al.detail, al.created_at,
//               u.name AS admin_name, u.email AS admin_email
//        FROM audit_logs al
//        LEFT JOIN users u ON u.id = al.admin_id
//        ORDER BY al.created_at DESC
//        LIMIT ? OFFSET ?`,
//       [parsedLimit, offset]
//     );

//     const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM audit_logs");

//     res.status(200).json({ logs, total });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // ─────────────────────────────────────────────
// // 8. GET /admin/stats
// //    ดู dashboard สถิติจำนวน user / resume / HR ในระบบ
// // ─────────────────────────────────────────────
// router.get("/stats", requireAdmin, async (req, res) => {
//   try {
//     const [[{ users }]] = await db.query(
//       "SELECT COUNT(*) AS users FROM users WHERE role = 'user'"
//     );

//     const [[{ resumes }]] = await db.query(
//       "SELECT COUNT(*) AS resumes FROM resumes"
//     );

//     const [[{ hrAccounts }]] = await db.query(
//       "SELECT COUNT(*) AS hrAccounts FROM users WHERE role = 'hr'"
//     );

//     res.status(200).json({ users, resumes, hrAccounts });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// // ─────────────────────────────────────────────
// // 9. PUT /admin/settings
// //    ตั้งค่าระบบ เช่น ขนาดไฟล์สูงสุด, maintenance mode
// //    Body: { maxFileSize, maintenanceMode }
// // ─────────────────────────────────────────────
// router.put("/settings", requireAdmin, async (req, res) => {
//   try {
//     const { maxFileSize, maintenanceMode } = req.body;

//     if (maxFileSize === undefined && maintenanceMode === undefined) {
//       return res.status(400).json({ message: "No settings provided to update" });
//     }

//     // ดึง settings ปัจจุบัน
//     const [[current]] = await db.query("SELECT * FROM system_settings WHERE id = 1");

//     const updatedMaxFileSize =
//       maxFileSize !== undefined ? parseInt(maxFileSize) : current.max_file_size;
//     const updatedMaintenanceMode =
//       maintenanceMode !== undefined ? Boolean(maintenanceMode) : current.maintenance_mode;

//     await db.query(
//       "UPDATE system_settings SET max_file_size = ?, maintenance_mode = ? WHERE id = 1",
//       [updatedMaxFileSize, updatedMaintenanceMode]
//     );

//     await logAction(
//       req.user.id,
//       "UPDATE_SETTINGS",
//       null,
//       `maxFileSize: ${updatedMaxFileSize}, maintenanceMode: ${updatedMaintenanceMode}`
//     );

//     res.status(200).json({
//       message: "Settings updated successfully",
//       settings: {
//         maxFileSize: updatedMaxFileSize,
//         maintenanceMode: updatedMaintenanceMode,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// export default router;
