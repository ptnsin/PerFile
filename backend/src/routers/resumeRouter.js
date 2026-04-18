import { Router } from "express";
import db from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from '../middleware/requireRole.js'

const resumeRouter = Router();

// ✅ Helper: แจ้งเตือน Admin ทุกคนในระบบ
const notifyAdmins = async (type, title, body = null) => {
  try {
    const [admins] = await db.query(
      "SELECT id FROM users WHERE roles_id = 1"
    );
    for (const admin of admins) {
      await db.query(
        `INSERT INTO admin_notifications (admin_id, type, title, body, is_read) 
         VALUES (?, ?, ?, ?, 0)`,
        [admin.id, type, title, body]
      );
    }
  } catch (err) {
    console.error("notifyAdmins error:", err.message);
  }
};

// base path: "/resumes"

resumeRouter.get("/public", async (req, res) => {
  try {
    const [resumes] = await db.query(
      `SELECT 
        r.id, 
        r.title, 
        r.visibility, 
        r.created_at AS published_at,
        JSON_OBJECT('fullName', u.fullName) AS users
      FROM resumes r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.visibility = 'public' 
      ORDER BY r.created_at DESC`
    );
    res.status(200).json({ resumes });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /resumes/my
// ─────────────────────────────────────────────────────────────────────────────
resumeRouter.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [resumes] = await db.query(
      "SELECT id, title, template, visibility, summary, experience, education, skills, created_at AS createdAt FROM resumes WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    res.status(200).json({ resumes });
  } catch (err) {
    console.error("Get My Resumes Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /resumes  ✅ เพิ่ม notifyAdmins หลังสร้างสำเร็จ
// ─────────────────────────────────────────────────────────────────────────────
resumeRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, template, visibility, summary, experience, education, skills } = req.body;
    const userId = req.user.id;

    const [result] = await db.query(
      `INSERT INTO resumes (user_id, title, template, visibility, summary, experience, education, skills) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        title || "Untitled Resume", 
        template || "modern", 
        visibility || "private",
        summary || null,
        JSON.stringify(experience || []),
        JSON.stringify(education || []),
        JSON.stringify(skills || [])
      ]
    );

    // ✅ ดึงชื่อ user แล้วแจ้งเตือน Admin
    const [[user]] = await db.query(
      "SELECT username FROM users WHERE id = ?",
      [userId]
    );
    await notifyAdmins(
      "new_resume",
      `📄 Resume ใหม่ถูกสร้าง`,
      `${user?.username || "ผู้ใช้"} สร้าง Resume: "${title || "Untitled Resume"}"`
    );

    res.status(201).json({
      message: "สร้าง Resume สำเร็จแล้ว!",
      resumeId: result.insertId
    });

  } catch (err) {
    console.error("Post Resume Error:", err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /resumes/:id
// ─────────────────────────────────────────────────────────────────────────────
resumeRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT r.*, u.fullName AS ownerName 
       FROM resumes r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบเรซูเม่" });
    }

    res.status(200).json({ resume: rows[0] });
  } catch (err) {
    console.error("Get Resume Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /resumes/:id
// ─────────────────────────────────────────────────────────────────────────────
resumeRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user.id;
    const { title, template, visibility, summary, experience, education, skills } = req.body;

    const [resumeRows] = await db.query(
      "SELECT id FROM resumes WHERE id = ? AND user_id = ?",
      [resumeId, userId]
    );

    if (resumeRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบ Resume หรือคุณไม่มีสิทธิ์แก้ไข" });
    }

    await db.query(
      `UPDATE resumes 
       SET title = ?, template = ?, visibility = ?, summary = ?, experience = ?, education = ?, skills = ? 
       WHERE id = ?`,
      [
        title, 
        template, 
        visibility, 
        summary, 
        JSON.stringify(experience), 
        JSON.stringify(education), 
        JSON.stringify(skills), 
        resumeId
      ]
    );

    res.status(200).json({ message: "Resume updated successfully" });
  } catch (err) {
    console.error("Update Resume Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /resumes/:id
// ─────────────────────────────────────────────────────────────────────────────
resumeRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user.id;

    const [resumeRows] = await db.query(
      "SELECT id FROM resumes WHERE id = ? AND user_id = ?",
      [resumeId, userId]
    );

    if (resumeRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบ Resume ที่ต้องการลบ" });
    }

    await db.query("DELETE FROM resumes WHERE id = ?", [resumeId]);
    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /resumes/:id/visibility
// ─────────────────────────────────────────────────────────────────────────────
resumeRouter.patch("/:id/visibility", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;
    const userId = req.user.id;

    const [result] = await db.query(
      "UPDATE resumes SET visibility = ? WHERE id = ? AND user_id = ?",
      [visibility, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบเรซูเม่หรือไม่มีสิทธิ์แก้ไข" });
    }

    res.json({ message: `เปลี่ยนสถานะเป็น ${visibility} สำเร็จ` });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /resumes/:id/export
// ─────────────────────────────────────────────────────────────────────────────
resumeRouter.get("/:id/export", async (req, res) => {
  const { id } = req.params;
  const { format } = req.query;

  if (format === "link") {
    return res.json({ url: `http://localhost:5173/view-resume/${id}` });
  }
  
  res.json({ message: "การดาวน์โหลด PDF ให้ใช้ฟังก์ชัน window.print() ที่หน้าบ้านครับ" });
});

export default resumeRouter;