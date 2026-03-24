import { Router } from 'express'
import { requireRole } from '../middleware/requireRole.js'

const notificationRouter = Router()

// base path: "/notifications"

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API สำหรับจัดการการแจ้งเตือน และ WebSocket real-time
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "notif_abc123"
 *         type:
 *           type: string
 *           enum: [info, warning, success, error]
 *           example: "info"
 *         data:
 *           type: object
 *           description: ข้อมูลเพิ่มเติมของการแจ้งเตือน
 *           example: { "title": "มีผู้สนใจ resume ของคุณ", "resumeId": "res_xyz" }
 *         isRead:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-01-15T10:30:00Z"
 */

// ─────────────────────────────────────────────────────────────────────────────
// GET /notifications
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: ดูรายการแจ้งเตือนทั้งหมด พร้อมจำนวนที่ยังไม่ได้อ่าน
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: หน้าที่ต้องการ (เริ่มที่ 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *         description: จำนวนรายการต่อหน้า
 *     responses:
 *       200:
 *         description: รายการแจ้งเตือนพร้อมจำนวนที่ยังไม่ได้อ่าน
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 unread:
 *                   type: integer
 *                   description: จำนวนแจ้งเตือนที่ยังไม่ได้อ่าน
 *                   example: 5
 *       401:
 *         description: Unauthorized
 */
notificationRouter.get('/', (req, res) => {
  // TODO: implement
  // query: req.query.page, req.query.limit
  res.json({ notifications: [], unread: 0 })
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /notifications/:id/read
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: ทำเครื่องหมายว่าอ่านแจ้งเตือนแล้ว
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "notif_abc123"
 *         description: ID ของแจ้งเตือนที่ต้องการทำเครื่องหมายว่าอ่านแล้ว
 *     responses:
 *       200:
 *         description: ทำเครื่องหมายสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification marked as read"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found - ไม่พบแจ้งเตือนนี้
 */
notificationRouter.patch('/:id/read', (req, res) => {
  // TODO: implement
  const { id } = req.params
  res.json({ message: 'Notification marked as read' })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /notifications/clear
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /notifications/clear:
 *   delete:
 *     summary: ลบแจ้งเตือนทั้งหมดของตัวเองออก
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ลบแจ้งเตือนทั้งหมดสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All notifications cleared"
 *       401:
 *         description: Unauthorized
 */
notificationRouter.delete('/clear', (req, res) => {
  // TODO: implement
  res.json({ message: 'All notifications cleared' })
})

// ─────────────────────────────────────────────────────────────────────────────
// WS /notifications/connect
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /notifications/connect:
 *   get:
 *     summary: เปิด WebSocket รับแจ้งเตือน real-time (ตรวจ JWT ตอน handshake)
 *     tags: [Notifications]
 *     description: |
 *       **WebSocket endpoint** — ไม่ใช่ HTTP request ปกติ
 *
 *       ส่ง JWT token ตอน handshake ผ่าน query param หรือ header:
 *       ```
 *       ws://localhost:3000/notifications/connect?token=<JWT>
 *       ```
 *
 *       หลังเชื่อมต่อสำเร็จ server จะส่ง event กลับมาในรูปแบบ:
 *       ```json
 *       {
 *         "type": "NEW_NOTIFICATION",
 *         "data": {
 *           "id": "notif_abc123",
 *           "type": "info",
 *           "data": { "title": "มีผู้สนใจ resume ของคุณ" },
 *           "isRead": false,
 *           "createdAt": "2025-01-15T10:30:00Z"
 *         }
 *       }
 *       ```
 *
 *       **Event types:**
 *       - `NEW_NOTIFICATION` — มีแจ้งเตือนใหม่เข้ามา
 *       - `NOTIFICATION_READ` — แจ้งเตือนถูกทำเครื่องหมายว่าอ่านแล้ว
 *       - `NOTIFICATIONS_CLEARED` — ล้างแจ้งเตือนทั้งหมดแล้ว
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         description: JWT Access Token สำหรับ authenticate WebSocket connection
 *     responses:
 *       101:
 *         description: Switching Protocols — WebSocket connection established
 *       401:
 *         description: Unauthorized - JWT ไม่ถูกต้องหรือหมดอายุ
 */
notificationRouter.get('/connect', (req, res) => {
  // TODO: implement WebSocket upgrade
  // ตรวจสอบ JWT จาก req.query.token หรือ req.headers['authorization']
  // แล้ว upgrade connection เป็น WebSocket
  res.status(426).json({ message: 'This endpoint requires a WebSocket connection' })
})

export default notificationRouter