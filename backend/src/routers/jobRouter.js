import { Router } from 'express'
import prisma from '../config/prisma.js'
import { verifyJWT } from '../middleware/verifyJWT.js'
import { requireRole } from '../middleware/requireRole.js'

const jobRouter = Router()

// 1. Public Routes: ใครก็ดูได้ (สำหรับหน้า Feed)
// ใน src/routers/jobRouter.js
jobRouter.get('/all', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'เปิดรับสมัคร' },
      include: {
        users: { // เปลี่ยนจาก hr เป็น users ตาม schema.prisma 
          include: { 
            hr_profile: true // เปลี่ยนจาก hr_profile เป็น hr_profile ตาม schema.prisma 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ jobs })
  } catch (err) {
    console.error(err); // เพิ่ม log เพื่อดู error จริงใน terminal
    res.status(500).json({ message: "Error fetching jobs" })
  }
})

// 2. Protected Routes: ต้อง Login ก่อน (เช่น ดูรายละเอียดลึกๆ หรือกดสมัคร)
jobRouter.get('/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params
    
    const job = await prisma.job.findUnique({
      where: { id: Number(id) },
      include: {
        users: {
          include: {
            hr_profile: true
          }
        }
      }
    })

    if (!job) {
      return res.status(404).json({ message: "ไม่พบงานนี้" })
    }

    res.json({ job })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Error fetching job" })
  }
})

// 3. HR Routes: เฉพาะ HR เท่านั้นที่จัดการงานของตัวเองได้
jobRouter.post('/create', verifyJWT, requireRole(3), async (req, res) => {
  // Logic การสร้างงาน (ย้ายมาจาก hrRouter)
})


export default jobRouter