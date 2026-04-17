import { Router } from 'express'
import db from '../config/db.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const profileRouter = Router()

// base path: "/profile"

// ─────────────────────────────────────────────────────────────
// SKILLS
// ─────────────────────────────────────────────────────────────

// GET /profile/skills — ดึง skills ของตัวเอง
profileRouter.get('/skills', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name FROM user_skills WHERE user_id = ? ORDER BY id ASC',
      [req.user.id]
    )
    res.json({ skills: rows.map(r => ({ id: r.id, name: r.name })) })
  } catch (err) {
    console.error('GET skills error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /profile/skills — เพิ่ม skill
profileRouter.post('/skills', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'กรุณาระบุชื่อทักษะ' })

    // เช็คซ้ำ
    const [existing] = await db.query(
      'SELECT id FROM user_skills WHERE user_id = ? AND name = ?',
      [req.user.id, name.trim()]
    )
    if (existing.length > 0) return res.status(409).json({ message: 'มีทักษะนี้อยู่แล้ว' })

    const [result] = await db.query(
      'INSERT INTO user_skills (user_id, name) VALUES (?, ?)',
      [req.user.id, name.trim()]
    )
    res.status(201).json({ skill: { id: result.insertId, name: name.trim() } })
  } catch (err) {
    console.error('POST skill error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// DELETE /profile/skills/:id — ลบ skill
profileRouter.delete('/skills/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM user_skills WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบทักษะนี้' })
    res.json({ message: 'ลบทักษะสำเร็จ' })
  } catch (err) {
    console.error('DELETE skill error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// ─────────────────────────────────────────────────────────────
// EXPERIENCES
// ─────────────────────────────────────────────────────────────

// GET /profile/experiences — ดึง experiences ของตัวเอง
profileRouter.get('/experiences', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, icon, title, company, date FROM user_experiences WHERE user_id = ? ORDER BY id ASC',
      [req.user.id]
    )
    res.json({ experiences: rows })
  } catch (err) {
    console.error('GET experiences error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /profile/experiences — เพิ่ม experience
profileRouter.post('/experiences', authMiddleware, async (req, res) => {
  try {
    const { icon, title, company, date } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'กรุณาระบุตำแหน่งงาน' })

    const [result] = await db.query(
      'INSERT INTO user_experiences (user_id, icon, title, company, date) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, icon || '💼', title.trim(), company || '', date || '']
    )
    res.status(201).json({
      experience: { id: result.insertId, icon: icon || '💼', title: title.trim(), company: company || '', date: date || '' }
    })
  } catch (err) {
    console.error('POST experience error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// PUT /profile/experiences/:id — แก้ไข experience
profileRouter.put('/experiences/:id', authMiddleware, async (req, res) => {
  try {
    const { icon, title, company, date } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'กรุณาระบุตำแหน่งงาน' })

    const [result] = await db.query(
      'UPDATE user_experiences SET icon = ?, title = ?, company = ?, date = ? WHERE id = ? AND user_id = ?',
      [icon || '💼', title.trim(), company || '', date || '', req.params.id, req.user.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบประสบการณ์นี้' })
    res.json({ message: 'แก้ไขสำเร็จ' })
  } catch (err) {
    console.error('PUT experience error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// DELETE /profile/experiences/:id — ลบ experience
profileRouter.delete('/experiences/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM user_experiences WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบประสบการณ์นี้' })
    res.json({ message: 'ลบประสบการณ์สำเร็จ' })
  } catch (err) {
    console.error('DELETE experience error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default profileRouter