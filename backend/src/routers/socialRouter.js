import { Router } from 'express'
import multer from 'multer'
import axios from 'axios'
import unzipper from 'unzipper'
import csv from 'csv-parser'
import { Readable } from 'stream'

import { verifyJWT } from '../middleware/verifyJWT.js'
import { requireRole } from '../middleware/requireRole.js'

const socialRouter = Router()

// Multer — รับ .zip ใน memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed'
    ) {
      cb(null, true)
    } else {
      cb(new Error('รองรับเฉพาะไฟล์ .zip เท่านั้น'))
    }
  },
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Social
 *   description: นำเข้าข้อมูลจาก Social Platform (GitHub, LinkedIn)
 */

/**
 * @swagger
 * /social/github/import:
 *   get:
 *     summary: ดึง repositories, bio, languages จาก GitHub API
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username ของผู้หางาน
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 repos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       url:
 *                         type: string
 *                       language:
 *                         type: string
 *                       stars:
 *                         type: integer
 *                 bio:
 *                   type: string
 *                 languages:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: ไม่ได้ระบุ username
 *       404:
 *         description: ไม่พบ GitHub user นี้
 *       500:
 *         description: เกิดข้อผิดพลาดจาก GitHub API
 */
socialRouter.get('/github/import', verifyJWT, requireRole('JOB_SEEKER'), async (req, res) => {
  try {
    const { username } = req.query

    if (!username) {
      return res.status(400).json({ message: 'กรุณาระบุ username' })
    }

    const userRes = await axios.get(`https://api.github.com/users/${username}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })

    const reposRes = await axios.get(`https://api.github.com/users/${username}/repos`, {
      params: { sort: 'updated', per_page: 10 },
      headers: { Accept: 'application/vnd.github+json' },
    })

    const repos = reposRes.data.map((repo) => ({
      name        : repo.name,
      description : repo.description,
      url         : repo.html_url,
      language    : repo.language,
      stars       : repo.stargazers_count,
    }))

    const languageSet = [...new Set(
      reposRes.data.map((r) => r.language).filter(Boolean)
    )]

    return res.status(200).json({
      repos,
      bio       : userRes.data.bio || '',
      languages : languageSet,
    })

  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ message: 'ไม่พบ GitHub user นี้' })
    }
    console.error('GitHub import error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก GitHub' })
  }
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /social/import/{provider}:
 *   post:
 *     summary: map ข้อมูลจาก social เข้าโครงสร้าง resume ที่เลือก
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [github, linkedin]
 *         description: ชื่อ social platform
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resumeId
 *               - fields
 *             properties:
 *               resumeId:
 *                 type: string
 *                 description: ID ของ resume ที่ต้องการนำเข้าข้อมูล
 *               fields:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [bio, skills, projects]
 *                 description: fields ที่ต้องการ map เข้า resume
 *               data:
 *                 type: object
 *                 description: ข้อมูลจาก social ที่จะนำเข้า
 *     responses:
 *       200:
 *         description: นำเข้าข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 resume:
 *                   type: object
 *       400:
 *         description: ข้อมูลไม่ครบหรือ provider ไม่ถูกต้อง
 *       404:
 *         description: ไม่พบ resume หรือไม่มีสิทธิ์แก้ไข
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
socialRouter.post('/import/:provider', verifyJWT, requireRole('JOB_SEEKER'), async (req, res) => {
  try {
    const { provider } = req.params
    const { resumeId, fields } = req.body

    if (!resumeId || !fields || !Array.isArray(fields)) {
      return res.status(400).json({ message: 'กรุณาระบุ resumeId และ fields' })
    }

    const allowedProviders = ['github', 'linkedin']
    if (!allowedProviders.includes(provider)) {
      return res.status(400).json({ message: 'provider ไม่ถูกต้อง' })
    }

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: req.user.id },
    })

    if (!resume) {
      return res.status(404).json({ message: 'ไม่พบ resume หรือคุณไม่มีสิทธิ์แก้ไข' })
    }

    const updateData = {}
    if (fields.includes('bio'))      updateData.bio      = req.body.data?.bio
    if (fields.includes('skills'))   updateData.skills   = req.body.data?.languages
    if (fields.includes('projects')) updateData.projects = req.body.data?.repos

    const updatedResume = await prisma.resume.update({
      where: { id: resumeId },
      data:  updateData,
    })

    return res.status(200).json({
      message : 'นำเข้าข้อมูลสำเร็จ',
      resume  : updatedResume,
    })

  } catch (err) {
    console.error('Social import error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' })
  }
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /social/preview:
 *   get:
 *     summary: preview ข้อมูลที่จะดึงจาก social ก่อน import จริง
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [github, linkedin]
 *         description: ชื่อ social platform ที่ต้องการ preview
 *     responses:
 *       200:
 *         description: ดึง preview สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 previewData:
 *                   type: object
 *                   properties:
 *                     provider:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                     projects:
 *                       type: array
 *                     fetchedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: ไม่ได้ระบุ provider
 *       404:
 *         description: ยังไม่ได้เชื่อมต่อบัญชี social นี้
 *       500:
 *         description: เกิดข้อผิดพลาด
 */
socialRouter.get('/preview', verifyJWT, requireRole('JOB_SEEKER'), async (req, res) => {
  try {
    const { provider } = req.query

    if (!provider) {
      return res.status(400).json({ message: 'กรุณาระบุ provider' })
    }

    const socialAccount = await prisma.socialAccount.findFirst({
      where: { userId: req.user.id, provider },
    })

    if (!socialAccount) {
      return res.status(404).json({
        message: `ยังไม่ได้เชื่อมต่อบัญชี ${provider} กรุณาเชื่อมต่อก่อน`,
      })
    }

    const previewData = {
      provider,
      bio       : socialAccount.bio,
      skills    : socialAccount.skills,
      projects  : socialAccount.projects,
      fetchedAt : socialAccount.updatedAt,
    }

    return res.status(200).json({ previewData })

  } catch (err) {
    console.error('Preview error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึง preview' })
  }
})

// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /social/linkedin/upload:
 *   post:
 *     summary: upload ไฟล์ .zip export จาก LinkedIn แล้ว parse ข้อมูล
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: ไฟล์ .zip ที่ export มาจาก LinkedIn
 *     responses:
 *       200:
 *         description: อ่านไฟล์สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 parsedData:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         headline:
 *                           type: string
 *                         summary:
 *                           type: string
 *                     experience:
 *                       type: array
 *                     education:
 *                       type: array
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: ไม่ได้แนบไฟล์หรือไฟล์ไม่ใช่ .zip
 *       500:
 *         description: เกิดข้อผิดพลาดในการอ่านไฟล์
 */
socialRouter.post('/linkedin/upload', verifyJWT, requireRole('JOB_SEEKER'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาอัปโหลดไฟล์ .zip' })
    }

    const parsedData = await parseLinkedInZip(req.file.buffer)

    return res.status(200).json({
      message : 'อ่านไฟล์ LinkedIn สำเร็จ',
      parsedData,
    })

  } catch (err) {
    console.error('LinkedIn upload error:', err.message)
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอ่านไฟล์ LinkedIn' })
  }
})

// ─────────────────────────────────────────────────────────────
// Helper — แตก .zip และ parse CSV ของ LinkedIn
// ─────────────────────────────────────────────────────────────
async function parseLinkedInZip(buffer) {
  const result = {
    profile    : {},
    experience : [],
    education  : [],
    skills     : [],
  }

  const directory = await unzipper.Open.buffer(buffer)

  for (const file of directory.files) {
    const rows = await readCSVFromZipEntry(file)

    if (file.path === 'Profile.csv') {
      result.profile = {
        firstName : rows[0]?.['First Name'] || '',
        lastName  : rows[0]?.['Last Name']  || '',
        headline  : rows[0]?.['Headline']   || '',
        summary   : rows[0]?.['Summary']    || '',
      }
    }

    if (file.path === 'Positions.csv') {
      result.experience = rows.map((r) => ({
        company     : r['Company Name'] || '',
        title       : r['Title']        || '',
        startDate   : r['Started On']   || '',
        endDate     : r['Finished On']  || '',
        description : r['Description'] || '',
      }))
    }

    if (file.path === 'Education.csv') {
      result.education = rows.map((r) => ({
        school    : r['School Name']    || '',
        degree    : r['Degree Name']    || '',
        field     : r['Field Of Study'] || '',
        startDate : r['Start Date']     || '',
        endDate   : r['End Date']       || '',
      }))
    }

    if (file.path === 'Skills.csv') {
      result.skills = rows.map((r) => r['Name']).filter(Boolean)
    }
  }

  return result
}

function readCSVFromZipEntry(entry) {
  return new Promise(async (resolve, reject) => {
    const rows   = []
    const buffer = await entry.buffer()
    const stream = Readable.from(buffer)
    stream
      .pipe(csv())
      .on('data',  (row) => rows.push(row))
      .on('end',   ()    => resolve(rows))
      .on('error', (err) => reject(err))
  })
}

export default socialRouter