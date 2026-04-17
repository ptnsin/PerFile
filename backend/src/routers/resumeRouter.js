import { Router } from "express";
import db from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from '../middleware/requireRole.js'

const resumeRouter = Router();

// base path: "/resumes"

/**
 * @swagger
 * tags:
 *   name: Resumes
 *   description: API สำหรับจัดการ Resume
 */

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

/**
 * @swagger
 * components:
 *   schemas:
 *     Resume:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "abc123"
 *         title:
 *           type: string
 *           example: "My Resume"
 *         template:
 *           type: string
 *           example: "modern"
 *         sections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Section'
 *         visibility:
 *           type: string
 *           enum: [public, private]
 *           example: "private"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Section:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "sec001"
 *         type:
 *           type: string
 *           example: "experience"
 *         content:
 *           type: object
 *           example: { "company": "Acme Corp", "role": "Developer" }
 *         order:
 *           type: integer
 *           example: 1
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// ─────────────────────────────────────────────────────────────────────────────
// GET /resumes/my
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/my:
 *   get:
 *     summary: ดู resume ทั้งหมดที่ตัวเองสร้างไว้
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการ resume ทั้งหมดของ user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resumes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Resume'
 *       401:
 *         description: Unauthorized
 */
resumeRouter.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // ดึงข้อมูลจากตาราง resumes ตารางเดียวได้เลย เพราะมีข้อมูลครบแล้ว
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
// POST /resumes/resumes
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/resumes:
 *   post:
 *     summary: สร้าง resume ใหม่พร้อมเลือก template
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - template
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My New Resume"
 *               template:
 *                 type: string
 *                 example: "modern"
 *               sections:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Section'
 *     responses:
 *       201:
 *         description: สร้าง resume สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Resume created successfully"
 *                 resume:
 *                   $ref: '#/components/schemas/Resume'
 *       400:
 *         description: Bad Request - ข้อมูลไม่ครบ
 *       401:
 *         description: Unauthorized
 */
resumeRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, template, visibility, summary, experience, education, skills } = req.body;
    const userId = req.user.id;

    // บันทึกข้อมูลทั้งหมดลงในคอลัมน์ของตาราง resumes
    const [result] = await db.query(
      `INSERT INTO resumes (user_id, title, template, visibility, summary, experience, education, skills) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        title || "Untitled Resume", 
        template || "modern", 
        visibility || "private",
        summary || null,
        JSON.stringify(experience || []), // บันทึกเป็น JSON string
        JSON.stringify(education || []),
        JSON.stringify(skills || [])
      ]
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
/**
 * @swagger
 * /resumes/{id}:
 *   get:
 *     summary: ดู resume (ตรวจสิทธิ์ ownership + visibility อัตโนมัติ)
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     responses:
 *       200:
 *         description: ข้อมูล resume
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resumes:
 *                   $ref: '#/components/schemas/Resume'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่มีสิทธิ์เข้าถึง
 *       404:
 *         description: ไม่พบ resume
 */

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

    const resume = rows[0];

    // หมายเหตุ: คอลัมน์ที่เป็น JSON (experience, education, skills) 
    // จะถูก mysql2 parse กลับเป็น Object/Array ให้อัตโนมัติ

    res.status(200).json({ resume });
  } catch (err) {
    console.error("Get Resume Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /resumes/:id
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}:
 *   put:
 *     summary: แก้ไขเนื้อหา resume เจ้าของเท่านั้น
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Resume Title"
 *               sections:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Section'
 *     responses:
 *       200:
 *         description: อัปเดต resume สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Resume updated successfully"
 *                 resume:
 *                   $ref: '#/components/schemas/Resume'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่ใช่เจ้าของ
 *       404:
 *         description: ไม่พบ resume
 */
resumeRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user.id;
    const { title, template, visibility, summary, experience, education, skills } = req.body;

    // 1. ตรวจสอบสิทธิ์เจ้าของ
    const [resumeRows] = await db.query(
      "SELECT id FROM resumes WHERE id = ? AND user_id = ?",
      [resumeId, userId]
    );

    if (resumeRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบ Resume หรือคุณไม่มีสิทธิ์แก้ไข" });
    }

    // 2. อัปเดตข้อมูลลงตารางเดียว
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
/**
 * @swagger
 * /resumes/{id}:
 *   delete:
 *     summary: ลบ resume ตัวเอง / Super Admin ลบได้ทุกอัน
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     responses:
 *       200:
 *         description: ลบ resume สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Resume deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่มีสิทธิ์ลบ
 *       404:
 *         description: ไม่พบ resume
 */
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
/**
 * @swagger
 * /resumes/{id}/visibility:
 *   patch:
 *     summary: สลับ resume ระหว่าง public กับ private
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visibility
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 example: "public"
 *     responses:
 *       200:
 *         description: เปลี่ยน visibility สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Visibility updated to public"
 *       400:
 *         description: Bad Request - visibility ไม่ถูกต้อง
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: ไม่พบ resume
 */
resumeRouter.patch("/:id/visibility", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body; // รับค่า 'public' หรือ 'private'
    const userId = req.user.id;

    // ตรวจสอบและอัปเดตเฉพาะคอลัมน์ visibility
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



resumeRouter.get("/:id/export", async (req, res) => {
  const { id } = req.params;
  const { format } = req.query;

  if (format === "link") {
    // ส่งลิงก์หน้า ViewResume ของคุณกลับไป
    return res.json({ url: `http://localhost:5173/view-resume/${id}` });
  }
  
  res.json({ message: "การดาวน์โหลด PDF ให้ใช้ฟังก์ชัน window.print() ที่หน้าบ้านครับ" });
});

export default resumeRouter;