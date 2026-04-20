import { Router } from 'express'
import prisma from '../config/prisma.js'
import db from '../config/db.js'
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
    const { resumeId } = req.body

    if (!resumeId) {
      return res.status(400).json({ message: 'กรุณาระบุ resumeId' })
    }

    const [existing] = await db.query(
      'SELECT id FROM saved_resumes WHERE resume_id = ? AND seeker_id = ?',
      [Number(resumeId), Number(req.user.id)]
    )

    if (existing.length > 0) {
      return res.status(409).json({ message: 'resume นี้อยู่ใน shortlist แล้ว', id: existing[0].id })
    }

    const [result] = await db.query(
      'INSERT INTO saved_resumes (resume_id, seeker_id) VALUES (?, ?)',
      [Number(resumeId), Number(req.user.id)]
    )

    return res.status(201).json({ message: 'บันทึก shortlist สำเร็จ', id: result.insertId })

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
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const [rows] = await db.query(
      `SELECT
        sr.id        AS id,
        sr.resume_id AS resumeId,
        r.title      AS resume_title,
        r.visibility,
        u.id         AS user_id,
        u.fullName,
        u.avatar,
        u.username
      FROM saved_resumes sr
      JOIN resumes r ON sr.resume_id = r.id
      JOIN users u   ON r.user_id   = u.id
      WHERE sr.seeker_id = ?
      ORDER BY sr.id DESC
      LIMIT ? OFFSET ?`,
      [Number(req.user.id), parseInt(limit), offset]
    )

    const shortlist = rows.map(r => ({
      id       : r.id,
      resumeId : r.resumeId,
      resume   : {
        id         : r.resumeId,
        title      : r.resume_title,
        visibility : r.visibility,
        users      : {
          id       : r.user_id,
          fullName : r.fullName,
          avatar   : r.avatar,
          username : r.username,
        }
      }
    }))

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

    const [existing] = await db.query(
      'SELECT id FROM saved_resumes WHERE id = ? AND seeker_id = ?',
      [Number(id), Number(req.user.id)]
    )

    if (existing.length === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการนี้ใน shortlist' })
    }

    await db.query('DELETE FROM saved_resumes WHERE id = ?', [Number(id)])

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
    const userWithProfile = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        hr_profile: true 
      }
    });

    if (!userWithProfile) return res.status(404).json({ message: 'ไม่พบโปรไฟล์' });

    const { hr_profile, ...userData } = userWithProfile;
    const formattedProfile = {
      ...userData,
      ...(hr_profile || {}) 
    };

    return res.status(200).json({ profile: formattedProfile });
  } catch (err) {
    console.error('HR profile get error:', err.message);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงโปรไฟล์' });
  }
});

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
// ใน hrRouter.js ส่วน PUT /profile
hrRouter.put('/profile', async (req, res) => {
  try {
    const { 
      fullName, 
      company, bio, website, location, industry, 
      company_desc, // รับจาก UI
      company_size, // รับจาก UI
      founded,
      role,    // ✅ เพิ่มการรับค่าเหล่านี้จาก UI
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        hr_profile: {
          upsert: { 
            create: { 
              company, bio, website, location, industry, founded,
              company_desc: company_desc, 
              company_size: company_size,
              // role ยังไม่มีใน DB — ถ้าจะใช้ให้รัน: ALTER TABLE hr_profiles ADD COLUMN role VARCHAR(100) DEFAULT 'HR Recruiter';
            },
            update: { 
              company, bio, website, location, industry, founded,
              company_desc: company_desc,
              company_size: company_size,
            }
          }
        }
      },
      include: { hr_profile: true }
    });

    await prisma.hr_activities.create({
      data: {
        hr_id: Number(req.user.id),
        text: "คุณได้อัปเดตข้อมูลโปรไฟล์และบริษัท"
      }
    });

    // ✅ แผ่ข้อมูล (Flatten) ส่งกลับไปให้ UI อัปเดต State ทันที
    const profile = { 
      ...updatedUser, 
      ...updatedUser.hr_profile,
      name: updatedUser.fullName,
      companyDesc: updatedUser.hr_profile?.company_desc,
      companySize: updatedUser.hr_profile?.company_size,
      handle: `@${updatedUser.username}`
    };

    return res.status(200).json({ message: 'แก้ไขโปรไฟล์สำเร็จ', profile });
  } catch (err) {
    console.error('HR profile update error:', err.message);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขโปรไฟล์' });
  }
});

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

    await prisma.hr_activities.create({
      data: {
        hr_id: req.user.id,
        text: `คุณได้ลงประกาศงานใหม่: ${req.body.title}`
      }
    });

    return res.status(201).json({
      message: 'ลงประกาศงานสำเร็จ',
      job: newJob
    })

  } catch (err) {
    console.error('Post job error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงประกาศงาน' })
  }
})

// ─────────────────────────────────────────────────────────────

// ใน hrRouter.js
hrRouter.get('/jobs', async (req, res) => {
  try {
    const hrId = Number(req.user.id);

    // ดึง company จาก hr_profile ของ HR คนนี้
    const hrProfile = await prisma.hr_profiles.findUnique({
      where: { user_id: hrId },
      select: { company: true }
    });
    const companyName = hrProfile?.company || null;

    const jobs = await prisma.job.findMany({
      where: { hrId },
      orderBy: { createdAt: 'desc' }
    });

    // เพิ่ม company และ applicants count ให้ทุก job
    const jobsWithCount = jobs.map(job => ({
      ...job,
      company: companyName,
      _count: { applications: 0 }
    }));

    res.json({ jobs: jobsWithCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

hrRouter.patch('/jobs/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ตรวจสอบว่างานนี้เป็นของ HR คนที่ล็อกอินอยู่จริงหรือไม่
    const job = await prisma.job.findFirst({
      where: { id: Number(id), hrId: Number(req.user.id) }
    });

    if (!job) {
      return res.status(404).json({ message: "ไม่พบประกาศงานนี้" });
    }

    const updatedJob = await prisma.job.update({
      where: { id: Number(id) },
      data: { status }
    });

    res.json({ message: "อัปเดตสถานะสำเร็จ", job: updatedJob });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /hr/jobs/:id — แก้ไขข้อมูลประกาศงาน
hrRouter.patch('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findFirst({
      where: { id: Number(id), hrId: Number(req.user.id) }
    });

    if (!job) {
      return res.status(404).json({ message: "ไม่พบประกาศงานนี้ หรือคุณไม่มีสิทธิ์แก้ไข" });
    }

    const {
      title, category, location, type, experience,
      salaryMin, salaryMax, description, requirements, benefits, status
    } = req.body;

    // คำนวณ salary string เหมือน POST route
    const salary = salaryMin && salaryMax
      ? `${salaryMin}-${salaryMax}`
      : (salaryMin || salaryMax || job.salary || "ไม่ระบุ");

    const updatedJob = await prisma.job.update({
      where: { id: Number(id) },
      data: {
        ...(title        !== undefined && { title }),
        ...(category     !== undefined && { category }),
        ...(location     !== undefined && { location }),
        ...(type         !== undefined && { job_type: type }),
        ...(experience   !== undefined && { experience }),
        ...(description  !== undefined && { description }),
        ...(requirements !== undefined && { requirements }),
        ...(benefits     !== undefined && { benefits }),
        ...(status       !== undefined && { status }),
        salary,
      }
    });

    await prisma.hr_activities.create({
      data: {
        hr_id: Number(req.user.id),
        text: `คุณได้แก้ไขประกาศงาน: ${updatedJob.title}`
      }
    });

    res.json({ message: "แก้ไขประกาศงานสำเร็จ", job: updatedJob });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขประกาศงาน" });
  }
});

hrRouter.get('/activities', async (req, res) => {
  try {
    const activities = await prisma.hr_activities.findMany({
      where: { hr_id: Number(req.user.id) },
      orderBy: { created_at: 'desc' }, // เอาใหม่ล่าสุดขึ้นก่อน
      take: 5 // ดึงแค่ 5 รายการ
    });
    res.json({ activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching activities" });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /hr/jobs/:id — ลบประกาศงาน
hrRouter.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findFirst({
      where: { id: Number(id), hrId: Number(req.user.id) }
    });

    if (!job) {
      return res.status(404).json({ message: "ไม่พบประกาศงานนี้ หรือคุณไม่มีสิทธิ์ลบ" });
    }

    await prisma.job.delete({ where: { id: Number(id) } });

    await prisma.hr_activities.create({
      data: {
        hr_id: Number(req.user.id),
        text: `คุณได้ลบประกาศงาน: ${job.title}`
      }
    });

    res.json({ message: "ลบประกาศงานสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบประกาศงาน" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /hr/saved-jobs — ดึงรายการ saved jobs
// ⚠️ ต้องสร้างตาราง saved_jobs ก่อน (ดู comment SQL ด้านบน)
hrRouter.get('/saved-jobs', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT j.* FROM saved_jobs sj
       JOIN Job j ON sj.job_id = j.id
       WHERE sj.seeker_id = ?
       ORDER BY sj.id DESC`,
      [Number(req.user.id)]
    );
    res.json({ savedJobs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching saved jobs" });
  }
});

// POST /hr/saved-jobs/:id — save งาน
hrRouter.post('/saved-jobs/:id', async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const hrId  = Number(req.user.id);

    const [jobRows] = await db.query('SELECT id FROM Job WHERE id = ?', [jobId]);
    if (jobRows.length === 0) return res.status(404).json({ message: "ไม่พบประกาศงานนี้" });

    const [existing] = await db.query(
      'SELECT id FROM saved_jobs WHERE seeker_id = ? AND job_id = ?',
      [hrId, jobId]
    );
    if (existing.length > 0) return res.status(409).json({ message: "บันทึกไว้แล้ว" });

    await db.query(
      'INSERT INTO saved_jobs (seeker_id, job_id) VALUES (?, ?)',
      [hrId, jobId]
    );

    res.status(201).json({ message: "บันทึกงานสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving job" });
  }
});

// DELETE /hr/saved-jobs/:id — unsave งาน
hrRouter.delete('/saved-jobs/:id', async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const hrId  = Number(req.user.id);

    await db.query(
      'DELETE FROM saved_jobs WHERE seeker_id = ? AND job_id = ?',
      [hrId, jobId]
    );

    res.json({ message: "ยกเลิก save สำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error unsaving job" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /hr/applicants — ดึงผู้สมัครทั้งหมดของ HR คนนี้
// ⚠️ ต้องสร้างตาราง applications ก่อน (ดู comment SQL ด้านบน)
hrRouter.get('/applicants', async (req, res) => {
  try {
    // ใช้ $queryRaw เพราะตารางชื่อ `applications` ไม่ตรงกับ Prisma model
    const applications = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.job_id,
        a.user_id,
        a.status,
        a.applied_at,
        u.fullName,
        u.username,
        u.avatar,
        u.email,
        j.title AS job_title
      FROM applications a
      JOIN users u ON u.id = a.user_id
      JOIN Job j   ON j.id = a.job_id
      WHERE j.hrId = ${Number(req.user.id)}
      ORDER BY a.applied_at DESC
    `;

    const applicants = applications.map(a => ({
      id:        a.id,
      fullName:  a.fullName || a.username,
      avatar:    a.avatar,
      email:     a.email,
      position:  a.job_title,
      jobId:     a.job_id,
      status:    a.status,
      appliedAt: a.applied_at,
    }));

    res.json({ applicants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching applicants" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /hr/about — ดึง about items ของ HR
// PUT /hr/about — บันทึก about items
// ⚠️ ต้องเพิ่ม column about_items (JSON) ใน hr_profiles:
//   ALTER TABLE hr_profiles ADD COLUMN about_items JSON DEFAULT NULL;
hrRouter.get('/about', async (req, res) => {
  try {
    const profile = await prisma.hr_profiles.findUnique({
      where: { user_id: Number(req.user.id) }
    });
    const aboutItems = profile?.about_items
      ? JSON.parse(profile.about_items)
      : [];
    res.json({ aboutItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching about items" });
  }
});

hrRouter.put('/about', async (req, res) => {
  try {
    const { aboutItems } = req.body;
    await prisma.hr_profiles.upsert({
      where: { user_id: Number(req.user.id) },
      create: { user_id: Number(req.user.id), about_items: JSON.stringify(aboutItems) },
      update: { about_items: JSON.stringify(aboutItems) },
    });
    res.json({ message: "บันทึก about items สำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving about items" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /hr/interviews — ดึงตารางสัมภาษณ์
// ⚠️ ต้องสร้างตาราง interviews ก่อน:
//   CREATE TABLE IF NOT EXISTS interviews (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     hr_id INT NOT NULL,
//     job_id INT,
//     candidate_name VARCHAR(255),
//     interview_date DATE,
//     interview_time VARCHAR(20),
//     interview_type VARCHAR(50) DEFAULT 'Online',
//     interviewer VARCHAR(255),
//     job_title VARCHAR(255),
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (hr_id) REFERENCES users(id) ON DELETE CASCADE
//   );
hrRouter.get('/interviews', async (req, res) => {
  try {
    const interviews = await prisma.$queryRaw`
      SELECT * FROM interviews
      WHERE hr_id = ${Number(req.user.id)}
      ORDER BY interview_date ASC
    `;
    res.json({ interviews });
  } catch (err) {
    console.error(err);
    // ถ้าตารางยังไม่มีให้ return [] แทน error
    res.json({ interviews: [] });
  }
});

// POST /hr/interviews — สร้างนัดสัมภาษณ์ใหม่
hrRouter.post('/interviews', async (req, res) => {
  try {
    const {
      candidate_name, job_id, job_title,
      interview_date, interview_time, interview_type,
      interviewer, applicant_id, location, note
    } = req.body;

    await prisma.$executeRaw`
      INSERT INTO interviews (hr_id, job_id, candidate_name, job_title, interview_date, interview_time, interview_type, interviewer, applicant_id, location, note)
      VALUES (
        ${Number(req.user.id)},
        ${job_id || null},
        ${candidate_name},
        ${job_title || ''},
        ${interview_date},
        ${interview_time},
        ${interview_type || 'Online'},
        ${interviewer || ''},
        ${applicant_id ? Number(applicant_id) : null},
        ${location || ''},
        ${note || ''}
      )
    `;

    // บันทึก activity
    await prisma.hr_activities.create({
      data: {
        hr_id: Number(req.user.id),
        text: `นัดสัมภาษณ์ ${candidate_name} เรียบร้อยแล้ว`
      }
    });

    // ส่ง notification ให้ผู้สมัคร (ถ้ามี applicant_id)
    if (applicant_id) {
      try {
        await prisma.notifications.create({
          data: {
            user_id: Number(applicant_id),
            type: 'interview',
            message: `คุณได้รับการนัดสัมภาษณ์ในวันที่ ${interview_date} เวลา ${interview_time} (${interview_type || 'Online'})`,
            is_read: false,
          }
        });
      } catch (notifErr) {
        console.error('Notification error (non-fatal):', notifErr.message);
      }
    }

    res.status(201).json({ message: "สร้างนัดสัมภาษณ์สำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating interview" });
  }
});

// PUT /hr/interviews/:id — แก้ไขนัดสัมภาษณ์
hrRouter.put('/interviews/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      candidate_name, job_title,
      interview_date, interview_time,
      interview_type, interviewer,
      location, note
    } = req.body;

    const [existing] = await db.query(
      'SELECT id FROM interviews WHERE id = ? AND hr_id = ?',
      [id, Number(req.user.id)]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "ไม่พบนัดสัมภาษณ์นี้" });
    }

    await db.query(
      `UPDATE interviews SET
        candidate_name = ?, job_title = ?,
        interview_date = ?, interview_time = ?,
        interview_type = ?, interviewer = ?,
        location = ?, note = ?
       WHERE id = ? AND hr_id = ?`,
      [
        candidate_name, job_title || '',
        interview_date, interview_time,
        interview_type || 'Online', interviewer || '',
        location || '', note || '',
        id, Number(req.user.id)
      ]
    );

    res.json({ message: "แก้ไขนัดสัมภาษณ์สำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating interview" });
  }
});

// DELETE /hr/interviews/:id — ลบนัดสัมภาษณ์
hrRouter.delete('/interviews/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [existing] = await db.query(
      'SELECT id FROM interviews WHERE id = ? AND hr_id = ?',
      [id, Number(req.user.id)]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "ไม่พบนัดสัมภาษณ์นี้" });
    }

    await db.query('DELETE FROM interviews WHERE id = ? AND hr_id = ?', [id, Number(req.user.id)]);

    res.json({ message: "ลบนัดสัมภาษณ์สำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting interview" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /hr/report — ดึงข้อมูลรายงาน (คำนวณจาก applications + interviews)
hrRouter.get('/report', async (req, res) => {
  try {
    const hrId = Number(req.user.id);
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);

    // นับ applications เดือนนี้ vs เดือนที่แล้ว
    const [thisApps, lastApps] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM applications a
        JOIN Job j ON j.id = a.job_id
        WHERE j.hrId = ${hrId} AND a.applied_at >= ${thisMonthStart}
      `,
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM applications a
        JOIN Job j ON j.id = a.job_id
        WHERE j.hrId = ${hrId} AND a.applied_at BETWEEN ${lastMonthStart} AND ${lastMonthEnd}
      `,
    ]);

    // นับ interviews เดือนนี้ vs เดือนที่แล้ว (ถ้ามีตาราง)
    let thisIv = 0, lastIv = 0;
    try {
      const [r1, r2] = await Promise.all([
        prisma.$queryRaw`SELECT COUNT(*) as count FROM interviews WHERE hr_id = ${hrId} AND interview_date >= ${thisMonthStart}`,
        prisma.$queryRaw`SELECT COUNT(*) as count FROM interviews WHERE hr_id = ${hrId} AND interview_date BETWEEN ${lastMonthStart} AND ${lastMonthEnd}`,
      ]);
      thisIv = Number(r1[0]?.count || 0);
      lastIv = Number(r2[0]?.count || 0);
    } catch (_) { /* ตารางยังไม่มี */ }

    const report = {
      thisMonth: {
        applications: Number(thisApps[0]?.count || 0),
        interviews:   thisIv,
        offers:       0,
        hired:        0,
      },
      lastMonth: {
        applications: Number(lastApps[0]?.count || 0),
        interviews:   lastIv,
        offers:       0,
        hired:        0,
      },
      topSources: [
        { name: "PerFile",   pct: 70 },
        { name: "LinkedIn",  pct: 20 },
        { name: "อื่นๆ",      pct: 10 },
      ],
    };

    res.json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching report" });
  }
});
// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS (HR)
// ─────────────────────────────────────────────────────────────

// GET /hr/notifications
hrRouter.get('/notifications', async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT id, type, title, body as message, is_read, created_at
       FROM admin_notifications
       WHERE admin_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    )
    const unread = notifications.filter(n => !n.is_read).length
    res.json({ notifications, unread })
  } catch (err) {
    console.error('GET /hr/notifications error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// PATCH /hr/notifications/read-all — ต้องอยู่ก่อน /:id/read
hrRouter.patch('/notifications/read-all', async (req, res) => {
  try {
    await db.query(
      'UPDATE admin_notifications SET is_read = 1 WHERE admin_id = ?',
      [req.user.id]
    )
    res.json({ message: 'ok' })
  } catch (err) {
    console.error('PATCH /hr/notifications/read-all error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// PATCH /hr/notifications/:id/read
hrRouter.patch('/notifications/:id/read', async (req, res) => {
  try {
    await db.query(
      'UPDATE admin_notifications SET is_read = 1 WHERE id = ? AND admin_id = ?',
      [req.params.id, req.user.id]
    )
    res.json({ message: 'ok' })
  } catch (err) {
    console.error('PATCH /hr/notifications/:id/read error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// DELETE /hr/notifications/clear
hrRouter.delete('/notifications/clear', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM admin_notifications WHERE admin_id = ?',
      [req.user.id]
    )
    res.json({ message: 'ok' })
  } catch (err) {
    console.error('DELETE /hr/notifications/clear error:', err.message)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default hrRouter