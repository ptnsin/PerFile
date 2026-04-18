import { Router } from 'express'
import db from '../config/db.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const profileRouter = Router()

// base path: "/profile"

// ─────────────────────────────────────────────────────────────
// PROFILE STATS & VIEWS
// ─────────────────────────────────────────────────────────────

// GET /profile/stats
profileRouter.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [profileRows] = await db.query(
      'SELECT views FROM seeker_profiles WHERE user_id = ?',
      [req.user.id]
    );
    const [resumeRows] = await db.query(
      'SELECT COUNT(*) as count FROM resumes WHERE user_id = ?',
      [req.user.id]
    );
    res.json({
      views: profileRows[0]?.views || 0,
      resumes: resumeRows[0]?.count || 0,
      saved: 0,
      jobs_posted: 0
    });
  } catch (err) {
    console.error('GET stats error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /profile/:id/view
profileRouter.post('/view/:id', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    await db.query(
      'INSERT INTO seeker_profiles (user_id, views) VALUES (?, 1) ON DUPLICATE KEY UPDATE views = views + 1',
      [targetUserId]
    );
    res.json({ message: 'บันทึกการเข้าชมสำเร็จ' });
  } catch (err) {
    console.error('Increment view error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// SKILLS
// ─────────────────────────────────────────────────────────────

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

profileRouter.post('/skills', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'กรุณาระบุชื่อทักษะ' })
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

// ─────────────────────────────────────────────────────────────
// PROFILE INFO (github, linkedin, portfolio, bio, location)
// ─────────────────────────────────────────────────────────────

profileRouter.get('/info', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT bio, location, portfolio, github, linkedin FROM seeker_profiles WHERE user_id = ?',
      [req.user.id]
    )
    if (rows.length === 0) {
      return res.json({ bio: '', location: '', portfolio: '', github: '', linkedin: '' })
    }
    res.json(rows[0])
  } catch (err) {
    console.error('GET info error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

profileRouter.put('/info', authMiddleware, async (req, res) => {
  try {
    const { bio, location, portfolio, github, linkedin } = req.body
    const [existing] = await db.query(
      'SELECT user_id FROM seeker_profiles WHERE user_id = ?',
      [req.user.id]
    )
    if (existing.length === 0) {
      await db.query(
        'INSERT INTO seeker_profiles (user_id, bio, location, portfolio, github, linkedin) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, bio || '', location || '', portfolio || '', github || '', linkedin || '']
      )
    } else {
      await db.query(
        'UPDATE seeker_profiles SET bio = ?, location = ?, portfolio = ?, github = ?, linkedin = ? WHERE user_id = ?',
        [bio || '', location || '', portfolio || '', github || '', linkedin || '', req.user.id]
      )
    }
    res.json({ message: 'บันทึกโปรไฟล์สำเร็จ' })
  } catch (err) {
    console.error('PUT info error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// ─────────────────────────────────────────────────────────────
// PUBLIC PROFILE
// ─────────────────────────────────────────────────────────────

profileRouter.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [userRows] = await db.query(
      `SELECT u.fullName, u.email, u.avatar,
              s.bio, s.location, s.portfolio, s.github, s.linkedin
       FROM users u
       LEFT JOIN seeker_profiles s ON u.id = s.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const [resumes] = await db.query(
      'SELECT id, title, visibility, created_at FROM resumes WHERE user_id = ? AND visibility = "public"',
      [userId]
    );

    res.json({
      user: userRows[0],
      resumes: resumes
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ export default อยู่ท้ายสุด
export default profileRouter