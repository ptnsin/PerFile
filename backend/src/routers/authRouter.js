import { Router } from 'express'
import { requireRole } from '../middleware/requireRole.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import db from '../config/db.js'

const authRouter = Router()

// base path: "/auth"

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API สำหรับจัดการ Authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "user_abc123"
 *         email:
 *           type: string
 *           example: "user@example.com"
 *         role:
 *           type: string
 *           enum: [user, hr, admin]
 *           example: "user"
 *         status:
 *           type: string
 *           enum: [active, pending, suspended, banned]
 *           example: "active"
 */

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: ลงทะเบียนผู้ใช้งานใหม่ (Job Seeker)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "StrongPass123!"
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: ลงทะเบียนสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Registration successful"
 *       400:
 *         description: Bad Request - ข้อมูลไม่ครบหรือ email ซ้ำ
 */
authRouter.post('/register', async (req, res) => {
  // TODO: implement
  const { username, email, password } = req.body;

    try {
        // 1. เข้ารหัสผ่าน (Hash Password) เพื่อความปลอดภัย
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. เขียนคำสั่ง SQL (เช็คชื่อ Column ใน phpMyAdmin ของคุณให้ตรงนะครับ)
        // จากรูปคุณมี: username, email, password, roles_id
        const sql = "INSERT INTO users (username, email, password, roles_id) VALUES (?, ?, ?, ?)";
        
        // 3. สั่ง Execute (ส่งค่าไปที่ db)
        // ใส่ 2 เป็นค่า default สำหรับบทบาท 'user' (ตามที่คุณตั้งไว้ในตาราง roles)
        const [result] = await db.query(sql, [username, email, hashedPassword, 2]);

        // 4. ถ้าสำเร็จ ส่งข้อความกลับไปบอก Postman
        res.status(201).json({ message: "Registration successful", userId: result.insertId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Database Error", error: error.message });
    }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/hr/register
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/hr/register:
 *   post:
 *     summary: ลงทะเบียนผู้ใช้งานใหม่ (HR) รอ Admin approve ก่อนใช้งาน
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - fullName
 *               - company
 *             properties:
 *               username:
 *                 type: string
 *                 example: "hr_jane"
 *               email:
 *                 type: string
 *                 example: "hr@company.com"
 *               password:
 *                 type: string
 *                 example: "StrongPass123!"
 *               fullName:
 *                 type: string
 *                 example: "Jane Smith"
 *               company:
 *                 type: string
 *                 example: "Acme Corp"
 *     responses:
 *       201:
 *         description: ลงทะเบียนสำเร็จ รอ Admin อนุมัติ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "HR registration submitted. Awaiting admin approval."
 *       400:
 *         description: Bad Request - ข้อมูลไม่ครบหรือ email ซ้ำ
 */
authRouter.post('/hr/register', (req, res) => {
  // TODO: implement
  res.status(201).json({ message: 'HR registration submitted. Awaiting admin approval.' })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: ตรวจสอบ email และ password คืนค่าเป็น Access Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "StrongPass123!"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Bad Request - ข้อมูลไม่ครบ
 *       401:
 *         description: Unauthorized - email หรือ password ไม่ถูกต้อง
 *       403:
 *         description: Forbidden - บัญชียังไม่ได้รับการอนุมัติ (HR pending)
 */
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

    try {
        // 1. ค้นหา User จาก email ในฐานข้อมูล
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        // ถ้าไม่เจอ User
        if (users.length === 0) {
            return res.status(401).json({ message: "ไม่พบอีเมลนี้ในระบบ" });
        }

        const user = users[0];

        // 2. เปรียบเทียบรหัสผ่าน (bcrypt จะเทียบ password ที่ส่งมา กับรหัสที่ hash ใน DB)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
        }

        // 3. ถ้าถูกต้อง สร้าง Token (JWT) เพื่อส่งกลับไปให้ User ใช้
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.roles_id },
            'SECRET_KEY',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "เข้าสู่ระบบสำเร็จ",
            token: token,
            user: { id: user.id, username: user.username, role: user.roles_id }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
})
// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: ขอ Access Token ใหม่ด้วย Refresh Token ใน Cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: ได้ Access Token ใหม่
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Unauthorized - ไม่มี Refresh Token หรือ Token หมดอายุ
 */
authRouter.post('/refresh', (req, res) => {
  // TODO: implement
  res.json({ accessToken: '' })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/logout
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: ออกจากระบบ
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ออกจากระบบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/logout', (req, res) => {
  // TODO: implement
  res.json({ message: 'Logout successful' })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/me
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: ดูข้อมูล user ที่ login อยู่ พร้อม role และ status
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ข้อมูล user ปัจจุบัน
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
// ต้องมั่นใจว่ามี Middleware verifyToken (หรือชื่อคล้ายๆ กัน) นำหน้า
authRouter.get('/me', authMiddleware , async (req, res) => {
    try {
        // 1. ดึง id มาจาก req.user (ซึ่ง Middleware verifyJWT เป็นคนถอดรหัสใส่ไว้ให้)
        const userId = req.user.id; 

        // 2. ไป query หาข้อมูล user จริงๆ ใน DB (ไม่เอา password ออกมานะ)
        const [users] = await db.query(
            "SELECT id, username, email, roles_id FROM users WHERE id = ?", 
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // 3. ส่งข้อมูล user ออกไป
        res.status(200).json({
            user: users[0] // ส่งข้อมูลก้อนนี้ออกไปแทน {}
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/oauth/:provider
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/oauth/{provider}:
 *   get:
 *     summary: OAuth redirect ไปหา Google หรือ Github
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github]
 *         description: OAuth provider ที่ต้องการใช้
 *     responses:
 *       302:
 *         description: Redirect ไปยัง OAuth provider
 *       400:
 *         description: Bad Request - provider ไม่รองรับ
 */
authRouter.get('/oauth/:provider', (req, res) => {
  const { provider } = req.params; // รับค่า 'github' มาจาก URL

    // ตรวจสอบว่า provider ที่ส่งมาคืออะไร (ต้องเป็นตัวพิมพ์เล็กตามที่ Swagger ส่ง)
    if (provider === 'github') {
        // ตรงนี้คือส่วนที่คุณต้องใส่ Logic สำหรับพาไปหน้า Login ของ GitHub จริงๆ
        // แต่ตอนนี้แก้ให้มัน Return ค่ากลับไปก่อนเพื่อให้หาย Error
        return res.json({ 
            message: "กำลังเชื่อมต่อกับ GitHub OAuth...",
            provider: provider 
        });
    } else if (provider === 'google') {
        return res.json({ 
            message: "กำลังเชื่อมต่อกับ Google OAuth...",
            provider: provider 
        });
    } else {
        // ถ้าส่งอย่างอื่นมา (ที่ไม่ใช่ github หรือ google) ถึงจะขึ้น "ไม่รองรับ"
        return res.status(400).json({ message: "Provider ไม่รองรับ" });
    }
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /auth/password
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/password:
 *   patch:
 *     summary: เปลี่ยนรหัสผ่านของตัวเอง
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "OldPass123!"
 *               newPassword:
 *                 type: string
 *                 example: "NewPass456!"
 *     responses:
 *       200:
 *         description: เปลี่ยนรหัสผ่านสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Bad Request - ข้อมูลไม่ครบ
 *       401:
 *         description: Unauthorized - รหัสผ่านเดิมไม่ถูกต้อง
 */
authRouter.patch('/password', (req, res) => {
  // TODO: implement
  res.json({ message: 'Password changed successfully' })
})

export default authRouter