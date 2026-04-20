import express from 'express'
import prisma from '../config/prisma.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import db from '../config/db.js'

const router = express.Router()
// ✅ ลบ new PrismaClient() ออก

// POST /applications — สมัครงาน
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user.id)
    const jobId = Number(req.body.job_id)

    if (!jobId || isNaN(jobId)) {
      return res.status(400).json({ message: 'กรุณาระบุ job_id' })
    }

    // เช็คว่างานมีอยู่จริงและยังเปิดรับสมัคร
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) {
      return res.status(404).json({ message: 'ไม่พบงานนี้' })
    }
    if (job.status !== 'เปิดรับสมัคร') {
      return res.status(403).json({ message: 'งานนี้ปิดรับสมัครแล้ว' })
    }

    // เช็คว่าสมัครแล้วหรือยัง
    const existing = await prisma.jobApplication.findFirst({
      where: { job_id: jobId, user_id: userId }
    })
    if (existing) {
      return res.status(409).json({ message: 'คุณสมัครงานนี้ไปแล้ว' })
    }

    const application = await prisma.jobApplication.create({
      data: { job_id: jobId, user_id: userId, status: 'รอการตรวจสอบ' }
    })

    // แจ้ง HR ผ่าน admin_notifications
    await db.query(
      'INSERT INTO admin_notifications (admin_id, type, title, body) VALUES (?, ?, ?, ?)',
      [
        job.hrId,
        'new_application',
        '📋 มีผู้สมัครงานใหม่',
        `มีคนสมัครงาน "${job.title}" ของคุณ`
      ]
    )

    return res.status(201).json({
      message: 'สมัครงานสำเร็จ',
      applicationId: application.id,
    })
  } catch (err) {
    console.error('POST /applications error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
})

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: { user_id: Number(req.user.id) },
      orderBy: { applied_at: 'desc' },
      include: {
        job: {
          include: {
            users: { include: { hr_profile: true } }
          }
        }
      }
    })

    const result = applications.map(a => ({
      id: a.id,
      status: a.status,
      appliedAt: a.applied_at,       // ✅
      jobId: a.job.id,
      jobTitle: a.job.title,
      location: a.job.location,
      salary: a.job.salary,
      jobType: a.job.job_type,
      companyName: a.job.users?.hr_profile?.company ?? null,
    }))

    res.json({ applications: result })
  } catch (err) {
    console.error('GET /applications/my error:', err)
    res.status(500).json({ message: 'Error fetching applications' })
  }
})

// PATCH /applications/:id/status — HR อัปเดตสถานะ
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body // 'accepted' | 'rejected' | 'รอการตรวจสอบ'

    const application = await prisma.jobApplication.update({
      where: { id: Number(req.params.id) },
      data: { status },
      include: { job: true }
    })

    // แจ้งเตือน seeker
    const emoji = status === 'accepted' ? '✅' : status === 'rejected' ? '❌' : '📋'
    await db.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [
        application.user_id,
        'application_status',
        `${emoji} สถานะใบสมัครเปลี่ยนแปลง`,
        `งาน "${application.job.title}" : ${status}`
      ]
    )

    res.json({ message: 'อัปเดตสถานะสำเร็จ' })
  } catch (err) {
    console.error('PATCH /applications/:id/status error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
})

export default router