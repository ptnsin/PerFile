import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()
const prisma = new PrismaClient()

/**
 * @swagger
 * /applications/my:
 *   get:
 *     summary: ดึงรายการงานที่ Seeker สมัครไว้
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการงานที่สมัคร
 *       401:
 *         description: Unauthorized
 */
// GET /applications/my — งานที่ seeker คนนี้สมัครไป
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const applications = await prisma.$queryRaw`
      SELECT
        a.id,
        a.status,
        a.applied_at,
        j.id        AS job_id,
        j.title     AS job_title,
        j.location  AS job_location,
        j.salary    AS job_salary,
        j.job_type  AS job_type,
        hp.company  AS company_name
      FROM applications a
      JOIN Job j        ON j.id  = a.job_id
      LEFT JOIN hr_profile hp ON hp.user_id = j.hrId
      WHERE a.user_id = ${Number(req.user.id)}
      ORDER BY a.applied_at DESC
    `

    const result = applications.map(a => ({
      id:          a.id,
      status:      a.status,           // pending | accepted | rejected
      appliedAt:   a.applied_at,
      jobId:       a.job_id,
      jobTitle:    a.job_title,
      location:    a.job_location,
      salary:      a.job_salary,
      jobType:     a.job_type,
      companyName: a.company_name,
    }))

    res.json({ applications: result })
  } catch (err) {
    console.error('GET /applications/my error:', err)
    res.status(500).json({ message: 'Error fetching applications' })
  }
})

export default router