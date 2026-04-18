import express from 'express'
import prisma from '../config/prisma.js'          // ✅ เปลี่ยน
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()
                                                   // ✅ ลบ new PrismaClient() ออก

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
      id:          a.id,
      status:      a.status,
      appliedAt:   a.applied_at,       // ✅
      jobId:       a.job.id,
      jobTitle:    a.job.title,
      location:    a.job.location,
      salary:      a.job.salary,
      jobType:     a.job.job_type,
      companyName: a.job.users?.hr_profile?.company ?? null,
    }))

    res.json({ applications: result })
  } catch (err) {
    console.error('GET /applications/my error:', err)
    res.status(500).json({ message: 'Error fetching applications' })
  }
})

export default router