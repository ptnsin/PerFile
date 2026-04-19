import { Router } from 'express'
import db from '../config/db.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const notificationRouter = Router()

// base path: "/notifications"

// GET /notifications — ดึงแจ้งเตือนของตัวเอง
notificationRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT id, type, title, message, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    )
    const unread = notifications.filter(n => !n.is_read).length
    res.json({ notifications, unread })
  } catch (err) {
    console.error('GET /notifications Error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// PATCH /notifications/:id/read — อ่านแจ้งเตือน
notificationRouter.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    res.json({ message: 'Notification marked as read' })
  } catch (err) {
    console.error('PATCH /notifications/:id/read Error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// PATCH /notifications/read-all — อ่านทั้งหมด
notificationRouter.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    )
    res.json({ message: 'All notifications marked as read' })
  } catch (err) {
    console.error('PATCH /notifications/read-all Error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// DELETE /notifications/clear — ลบทั้งหมด
notificationRouter.delete('/clear', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM notifications WHERE user_id = ?',
      [req.user.id]
    )
    res.json({ message: 'All notifications cleared' })
  } catch (err) {
    console.error('DELETE /notifications/clear Error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default notificationRouter