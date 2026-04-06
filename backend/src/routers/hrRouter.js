import { Router } from 'express'
import prisma from '../config/prisma.js'
import { verifyJWT } from '../middleware/verifyJWT.js'
import { requireRole } from '../middleware/requireRole.js'
import { checkAccountStatus } from '../middleware/checkAccountStatus.js'

const hrRouter = Router()

// middleware ทุก route ใน hrRouter ต้อง login และเป็น HR ที่ approved แล้วเท่านั้น
hrRouter.use(verifyJWT)
hrRouter.use(requireRole(3))
hrRouter.use(checkAccountStatus)

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: HR
 *   description: ค้นหาผู้สมัคร จัดการ Shortlist และโปรไฟล์บริษัท (เฉพาะ HR ที่ approved แล้ว)
 */

/**
 * @swagger
 * /hr/search:
 *   get:
 *     summary: ค้นหา resume (public) ด้วย keyword ผ่าน Elasticsearch
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: keyword ที่ต้องการค้นหา
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: หน้าที่ต้องการ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: จำนวนผลลัพธ์ต่อหน้า
 *     responses:
 *       200:
 *         description: ค้นหาสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resumes:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *       400:
 *         description: ไม่ได้ระบุ keyword
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
hrRouter.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query

    if (!q) {
      return res.status(400).json({ message: 'กรุณาระบุ keyword สำหรับค้นหา' })
    }

    const from = (parseInt(page) - 1) * parseInt(limit)

    // ค้นหาผ่าน Elasticsearch
    const result = await esClient.search({
      index: 'resumes',
      body: {
        from,
        size: parseInt(limit),
        query: {
          multi_match: {
            query: q,
            fields: ['title', 'bio', 'skills', 'experience.title', 'experience.company'],
          },
        },
      },
    })

    const resumes = result.hits.hits.map((hit) => ({
      id    : hit._id,
      score : hit._score,
      ...hit._source,
    }))

    return res.status(200).json({
      resumes,
      total: result.hits.total.value,
    })

  } catch (err) {
    console.error('HR search error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหา' })
  }
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /hr/search/filter:
 *   get:
 *     summary: กรอง resume ตาม skill, location, ประสบการณ์
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skill
 *         schema:
 *           type: string
 *         description: ทักษะที่ต้องการ เช่น JavaScript, React
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: ที่อยู่หรือจังหวัด เช่น กรุงเทพ
 *       - in: query
 *         name: exp
 *         schema:
 *           type: integer
 *         description: ประสบการณ์ขั้นต่ำ (ปี)
 *     responses:
 *       200:
 *         description: กรองสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resumes:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
hrRouter.get('/search/filter', async (req, res) => {
  try {
    const { skill, location, exp } = req.query

    // สร้าง filter conditions
    const must = []

    if (skill) {
      must.push({ match: { skills: skill } })
    }

    if (location) {
      must.push({ match: { location } })
    }

    if (exp) {
      must.push({
        range: { experienceYears: { gte: parseInt(exp) } }
      })
    }

    const result = await esClient.search({
      index: 'resumes',
      body: {
        query: {
          bool: { must: must.length > 0 ? must : [{ match_all: {} }] }
        }
      }
    })

    const resumes = result.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    }))

    return res.status(200).json({
      resumes,
      total: result.hits.total.value,
    })

  } catch (err) {
    console.error('HR filter error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการกรองข้อมูล' })
  }
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /hr/shortlist:
 *   post:
 *     summary: บันทึก resume เข้า shortlist ของบริษัท
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resumeId
 *             properties:
 *               resumeId:
 *                 type: string
 *                 description: ID ของ resume ที่ต้องการบันทึก
 *               note:
 *                 type: string
 *                 description: หมายเหตุเพิ่มเติม (ไม่บังคับ)
 *     responses:
 *       201:
 *         description: บันทึก shortlist สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: ไม่ได้ระบุ resumeId
 *       409:
 *         description: resume นี้อยู่ใน shortlist แล้ว
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
hrRouter.post('/shortlist', async (req, res) => {
  try {
    const { resumeId, note } = req.body

    if (!resumeId) {
      return res.status(400).json({ message: 'กรุณาระบุ resumeId' })
    }

    // ตรวจว่ามีใน shortlist แล้วหรือยัง
    const existing = await prisma.shortlist.findFirst({
      where: { resumeId, hrId: req.user.id }
    })

    if (existing) {
      return res.status(409).json({ message: 'resume นี้อยู่ใน shortlist แล้ว' })
    }

    await prisma.shortlist.create({
      data: {
        resumeId,
        hrId : req.user.id,
        note : note || '',
      }
    })

    return res.status(201).json({ message: 'บันทึก shortlist สำเร็จ' })

  } catch (err) {
    console.error('Shortlist create error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึก shortlist' })
  }
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /hr/shortlist:
 *   get:
 *     summary: ดูรายการ shortlist ทั้งหมดของบริษัทตัวเอง
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: หน้าที่ต้องการ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: จำนวนรายการต่อหน้า
 *     responses:
 *       200:
 *         description: ดึงข้อมูล shortlist สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortlist:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
hrRouter.get('/shortlist', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const shortlist = await prisma.shortlist.findMany({
      where  : { hrId: req.user.id },
      skip,
      take   : parseInt(limit),
      include: { resume: true },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({ shortlist })

  } catch (err) {
    console.error('Shortlist get error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึง shortlist' })
  }
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /hr/shortlist/{id}:
 *   delete:
 *     summary: ลบ resume ออกจาก shortlist
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของ shortlist ที่ต้องการลบ
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: ไม่พบรายการนี้ใน shortlist
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
hrRouter.delete('/shortlist/:id', async (req, res) => {
  try {
    const { id } = req.params

    const item = await prisma.shortlist.findFirst({
      where: { id, hrId: req.user.id }
    })

    if (!item) {
      return res.status(404).json({ message: 'ไม่พบรายการนี้ใน shortlist' })
    }

    await prisma.shortlist.delete({ where: { id } })

    return res.status(200).json({ message: 'ลบออกจาก shortlist สำเร็จ' })

  } catch (err) {
    console.error('Shortlist delete error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบ shortlist' })
  }
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /hr/contact/{resumeId}:
 *   post:
 *     summary: ส่งข้อความติดต่อหาคนหางานโดยตรง
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resumeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ของ resume ที่ต้องการติดต่อ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 description: หัวข้อข้อความ
 *               message:
 *                 type: string
 *                 description: เนื้อหาข้อความ
 *     responses:
 *       200:
 *         description: ส่งข้อความสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: ข้อมูลไม่ครบ
 *       404:
 *         description: ไม่พบ resume นี้
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
hrRouter.post('/contact/:resumeId', async (req, res) => {
  try {
    const { resumeId }        = req.params
    const { subject, message } = req.body

    if (!subject || !message) {
      return res.status(400).json({ message: 'กรุณาระบุ subject และ message' })
    }

    // ตรวจว่า resume มีอยู่จริงและเป็น public
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, visibility: 'PUBLIC' }
    })

    if (!resume) {
      return res.status(404).json({ message: 'ไม่พบ resume หรือ resume นี้ไม่เป็นสาธารณะ' })
    }

    // บันทึกข้อความและส่ง notification ให้เจ้าของ resume
    await prisma.message.create({
      data: {
        senderId   : req.user.id,
        receiverId : resume.userId,
        resumeId,
        subject,
        content    : message,
      }
    })

    // TODO: ส่ง WebSocket notification ให้ผู้รับ

    return res.status(200).json({ message: 'ส่งข้อความสำเร็จ' })

  } catch (err) {
    console.error('Contact error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความ' })
  }
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /hr/profile:
 *   get:
 *     summary: ดูโปรไฟล์บริษัทและข้อมูล HR ของตัวเอง
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ดึงโปรไฟล์สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     company:
 *                       type: string
 *                     position:
 *                       type: string
 *                     location:
 *                       type: string
 *       404:
 *         description: ไม่พบโปรไฟล์
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
hrRouter.get('/profile', async (req, res) => {
  try {
    const profile = await prisma.user.findUnique({
      where : { id: req.user.id },
      select: {
        id       : true,
        fullName : true,
        email    : true,
        company  : true,
        position : true,
        location : true,
        status   : true,
        createdAt: true,
      }
    })

    if (!profile) {
      return res.status(404).json({ message: 'ไม่พบโปรไฟล์' })
    }

    return res.status(200).json({ profile })

  } catch (err) {
    console.error('HR profile get error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงโปรไฟล์' })
  }
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /hr/profile:
 *   put:
 *     summary: แก้ไขโปรไฟล์บริษัท เช่น ชื่อ ที่อยู่
 *     tags: [HR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: string
 *                 description: ชื่อบริษัท
 *               position:
 *                 type: string
 *                 description: ตำแหน่งงานของ HR
 *               location:
 *                 type: string
 *                 description: ที่อยู่บริษัท
 *               fullName:
 *                 type: string
 *                 description: ชื่อ-นามสกุล HR
 *     responses:
 *       200:
 *         description: แก้ไขโปรไฟล์สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 profile:
 *                   type: object
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
hrRouter.put('/profile', async (req, res) => {
  try {
    const { company, position, location, fullName } = req.body

    const updatedProfile = await prisma.user.update({
      where : { id: req.user.id },
      data  : {
        ...(company  && { company }),
        ...(position && { position }),
        ...(location && { location }),
        ...(fullName && { fullName }),
      },
      select: {
        id       : true,
        fullName : true,
        email    : true,
        company  : true,
        position : true,
        location : true,
      }
    })

    return res.status(200).json({
      message : 'แก้ไขโปรไฟล์สำเร็จ',
      profile : updatedProfile,
    })

  } catch (err) {
    console.error('HR profile update error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขโปรไฟล์' })
  }
})

// ─────────────────────────────────────────────────────────────

hrRouter.post('/jobs', async (req, res) => {
  try {
    const { 
      title, category, type, location, 
      salaryMin, salaryMax, experience, 
      description, requirements, benefits 
    } = req.body

    // รวมเงินเดือนให้เป็นช่วงตาม Logic ของ Frontend
    const salary = salaryMin && salaryMax 
      ? `${salaryMin}-${salaryMax}` 
      : (salaryMin || salaryMax || "ไม่ระบุ")

    const newJob = await prisma.job.create({
      data: {
        title,
        category,
        job_type     : type, // ระวังชื่อ Field ให้ตรงกับ Database (เช่น job_type หรือ type)
        location,
        salary,
        experience,
        description,
        requirements : requirements || '',
        benefits     : benefits || '',
        hrId: Number(req.user.id), // ใช้ ID จาก JWT ที่ผ่าน middleware มาแล้ว
      }
    })

    return res.status(201).json({
      message: 'ลงประกาศงานสำเร็จ',
      job: newJob
    })

  } catch (err) {
    console.error('Post job error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงประกาศงาน' })
  }
})

export default hrRouter