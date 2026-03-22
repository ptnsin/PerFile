import { Router } from "express";
import { requireRole } from '../middleware/requireRole.js'

const resumeRouter = Router();

// base path: "/resumes"

/**
 * @swagger
 * tags:
 *   name: Resumes
 *   description: API สำหรับจัดการ Resume
 */

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
resumeRouter.get("/my", (req, res) => {
  // TODO: implement
  res.json({ resumes: [] });
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
resumeRouter.post("/resumes", (req, res) => {
  // TODO: implement
  res.status(201).json({ message: "Resume created successfully", resume: {} });
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
resumeRouter.get("/:id", (req, res) => {
  // TODO: implement
  res.json({ resumes: {} });
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
resumeRouter.put("/:id", (req, res) => {
  // TODO: implement
  res.json({ message: "Resume updated successfully", resume: {} });
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
resumeRouter.delete("/:id", (req, res) => {
  // TODO: implement
  res.json({ message: "Resume deleted successfully" });
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
resumeRouter.patch("/:id/visibility", (req, res) => {
  // TODO: implement
  res.json({ message: "Visibility updated" });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /resumes/:id/export
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}/export:
 *   get:
 *     summary: Export resume เป็น PDF หรือ Shareable link
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
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, link]
 *         required: true
 *         description: รูปแบบ export
 *     responses:
 *       200:
 *         description: Export สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: กรณี format=link
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://example.com/share/abc123"
 *           application/pdf:
 *             schema:
 *               description: กรณี format=pdf จะได้ไฟล์ PDF กลับมา
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad Request - format ไม่ถูกต้อง
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: ไม่พบ resume
 */
resumeRouter.get("/:id/export", (req, res) => {
  // TODO: implement
  const { format } = req.query;
  if (format === "link") {
    return res.json({ url: "https://example.com/share/abc123" });
  }
  res.json({ message: "PDF export not yet implemented" });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /resumes/:id/sections
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}/sections:
 *   post:
 *     summary: เพิ่มหรือจัดเรียง section ใน resume เช่น ประสบการณ์ ทักษะ
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
 *               - type
 *               - content
 *               - order
 *             properties:
 *               type:
 *                 type: string
 *                 example: "experience"
 *               content:
 *                 type: object
 *                 example: { "company": "Acme Corp", "role": "Developer", "years": 2 }
 *               order:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: เพิ่ม section สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Section added successfully"
 *                 section:
 *                   $ref: '#/components/schemas/Section'
 *       400:
 *         description: Bad Request - ข้อมูลไม่ครบ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่ใช่เจ้าของ
 *       404:
 *         description: ไม่พบ resume
 */
resumeRouter.post("/:id/sections", (req, res) => {
  // TODO: implement
  res.status(201).json({ message: "Section added successfully", section: {} });
});

export default resumeRouter;