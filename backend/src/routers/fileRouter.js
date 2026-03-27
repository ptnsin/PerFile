import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/requireRole.js'

const fileRouter = Router()

// base path: "/files"

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: API สำหรับจัดการไฟล์และสื่อ
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FileItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "file_abc123"
 *         url:
 *           type: string
 *           example: "https://cdn.example.com/files/file_abc123.pdf"
 *         privacy:
 *           type: string
 *           enum: [public, private]
 *           example: "private"
 *         ownerId:
 *           type: string
 *           example: "user_abc123"
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// ─────────────────────────────────────────────────────────────────────────────
// POST /files/upload
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: อัปโหลดรูปหรือเอกสารแนบใน resume (max 10 MB)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: ไฟล์รูปภาพหรือเอกสาร ขนาดไม่เกิน 10 MB
 *     responses:
 *       201:
 *         description: อัปโหลดไฟล์สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File uploaded successfully"
 *                 fileId:
 *                   type: string
 *                   example: "file_abc123"
 *                 url:
 *                   type: string
 *                   example: "https://cdn.example.com/files/file_abc123.pdf"
 *       400:
 *         description: Bad Request - ไม่มีไฟล์หรือไฟล์เกินขนาด
 *       401:
 *         description: Unauthorized
 */
fileRouter.post('/upload', (req, res) => {
  // TODO: implement
  res.status(201).json({ message: 'File uploaded successfully', fileId: '', url: '' })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /files/upload/video
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /files/upload/video:
 *   post:
 *     summary: อัปโหลดวิดีโอส่งเข้า queue encode
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: ไฟล์วิดีโอที่ต้องการอัปโหลด
 *     responses:
 *       201:
 *         description: อัปโหลดวิดีโอสำเร็จ ส่งเข้า encode queue แล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Video uploaded and queued for encoding"
 *                 fileId:
 *                   type: string
 *                   example: "file_vid789"
 *                 jobId:
 *                   type: string
 *                   example: "job_encode_456"
 *       400:
 *         description: Bad Request - ไม่มีไฟล์วิดีโอหรือรูปแบบไม่รองรับ
 *       401:
 *         description: Unauthorized
 */
fileRouter.post('/upload/video', (req, res) => {
  // TODO: implement
  res.status(201).json({ message: 'Video uploaded and queued for encoding', fileId: '', jobId: '' })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /files/admin/all
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /files/admin/all:
 *   get:
 *     summary: ดูรายการไฟล์ทั้งหมดในระบบ (Admin เท่านั้น)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: หน้าที่ต้องการ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *         description: จำนวนรายการต่อหน้า
 *     responses:
 *       200:
 *         description: รายการไฟล์ทั้งหมดในระบบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FileItem'
 *                 total:
 *                   type: integer
 *                   example: 150
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin เท่านั้น
 */
fileRouter.get('/admin/all', authMiddleware, requireRole(1), (req, res) => {
  // TODO: implement
  res.json({ files: [], total: 0 })
  console.log(req.user)
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /files/:fileId/signed-url
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /files/{fileId}/signed-url:
 *   get:
 *     summary: ขอ Presigned URL เพื่อเข้าถึงไฟล์ private ชั่วคราว
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของไฟล์
 *     responses:
 *       200:
 *         description: Presigned URL สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 signedUrl:
 *                   type: string
 *                   example: "https://s3.amazonaws.com/bucket/file_abc123?X-Amz-Signature=..."
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-03-24T13:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่มีสิทธิ์เข้าถึงไฟล์นี้
 *       404:
 *         description: ไม่พบไฟล์
 */
fileRouter.get('/:fileId/signed-url', (req, res) => {
  // TODO: implement
  res.json({ signedUrl: '', expiresAt: '' })
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /files/:fileId/privacy
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /files/{fileId}/privacy:
 *   patch:
 *     summary: เปลี่ยนไฟล์ระหว่าง public กับ private
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของไฟล์
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - privacy
 *             properties:
 *               privacy:
 *                 type: string
 *                 enum: [public, private]
 *                 example: "public"
 *     responses:
 *       200:
 *         description: เปลี่ยน privacy สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File privacy updated to public"
 *       400:
 *         description: Bad Request - privacy ไม่ถูกต้อง
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่ใช่เจ้าของไฟล์
 *       404:
 *         description: ไม่พบไฟล์
 */
fileRouter.patch('/:fileId/privacy', (req, res) => {
  // TODO: implement
  res.json({ message: 'File privacy updated' })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /files/:fileId
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /files/{fileId}:
 *   delete:
 *     summary: ลบไฟล์ออกจาก S3 เจ้าของหรือ Super Admin เท่านั้น
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของไฟล์ที่ต้องการลบ
 *     responses:
 *       200:
 *         description: ลบไฟล์สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่ใช่เจ้าของหรือ Super Admin
 *       404:
 *         description: ไม่พบไฟล์
 */
fileRouter.delete('/:fileId', (req, res) => {
  // TODO: implement
  res.json({ message: 'File deleted successfully' })
})

export default fileRouter