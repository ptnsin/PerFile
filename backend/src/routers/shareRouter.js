import { Router } from 'express'

const shareRouter = Router()

// base path: "/share" (for GET /share/view/:token)
// also handles "/resumes/:id/share" via resumeRouter or mounted separately

/**
 * @swagger
 * tags:
 *   name: Share
 *   description: API สำหรับแชร์ Resume ให้คนภายนอกดูโดยไม่ต้อง login
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ShareToken:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: "shr_a1b2c3d4e5f6"
 *         shareUrl:
 *           type: string
 *           example: "https://perfile.app/share/view/shr_a1b2c3d4e5f6"
 *         resumeId:
 *           type: string
 *           example: "res_abc123"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-03-26T10:00:00.000Z"
 */

// ─────────────────────────────────────────────────────────────────────────────
// POST /resumes/:id/share
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}/share:
 *   post:
 *     summary: สร้าง shareToken และคืน URL สำหรับแชร์ให้คนภายนอก
 *     tags: [Share]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "res_abc123"
 *         description: ID ของ resume ที่ต้องการแชร์
 *     responses:
 *       201:
 *         description: สร้าง share link สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shareUrl:
 *                   type: string
 *                   example: "https://perfile.app/share/view/shr_a1b2c3d4e5f6"
 *                 token:
 *                   type: string
 *                   example: "shr_a1b2c3d4e5f6"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่ใช่เจ้าของ resume
 *       404:
 *         description: ไม่พบ resume
 */
shareRouter.post('/resumes/:id/share', (req, res) => {
  // TODO: implement
  // 1. ตรวจสอบว่า user เป็นเจ้าของ resume ที่ระบุ
  // 2. สร้าง shareToken ใหม่ (uuid / nanoid)
  // 3. บันทึก token ลง DB พร้อม resumeId และ expiry (ถ้ามี)
  // 4. คืน shareUrl และ token กลับไป
  const { id } = req.params
  res.status(201).json({
    shareUrl: `https://perfile.app/share/view/shr_placeholder`,
    token: 'shr_placeholder',
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /resumes/:id/share
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}/share:
 *   delete:
 *     summary: ยกเลิก share link ทำให้ token หมดอายุทันที
 *     tags: [Share]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "res_abc123"
 *         description: ID ของ resume ที่ต้องการยกเลิก share link
 *     responses:
 *       200:
 *         description: ยกเลิก share link สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Share link revoked successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่ใช่เจ้าของ resume
 *       404:
 *         description: ไม่พบ resume หรือไม่มี share link ที่ active
 */
shareRouter.delete('/resumes/:id/share', (req, res) => {
  // TODO: implement
  // 1. ตรวจสอบว่า user เป็นเจ้าของ resume ที่ระบุ
  // 2. ลบ / expire token ที่ผูกกับ resumeId นี้ใน DB ทันที
  const { id } = req.params
  res.json({ message: 'Share link revoked successfully' })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /share/view/:token
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /share/view/{token}:
 *   get:
 *     summary: ดู resume ผ่าน share token โดยไม่ต้อง login (read only)
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           example: "shr_a1b2c3d4e5f6"
 *         description: Share token ที่ได้จากการสร้าง share link
 *     responses:
 *       200:
 *         description: ข้อมูล resume แบบ read-only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resume:
 *                   $ref: '#/components/schemas/Resume'
 *       404:
 *         description: ไม่พบ token หรือ token หมดอายุแล้ว
 */
shareRouter.get('/view/:token', (req, res) => {
  // TODO: implement
  // 1. ค้นหา token ใน DB ว่ายังใช้งานได้อยู่หรือไม่
  // 2. ถ้าหมดอายุหรือไม่พบ → 404
  // 3. ดึงข้อมูล resume ที่ผูกกับ token แล้วคืนกลับไปแบบ read-only
  const { token } = req.params
  res.json({ resume: {} })
})

export default shareRouter