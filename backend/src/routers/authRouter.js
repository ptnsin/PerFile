import { Router } from 'express'
import { requireRole } from '../middleware/requireRole.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import axios from 'axios';
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
authRouter.post('/hr/register', async (req, res) => {
  try {
    const { username, email, password, fullName, company } = req.body;

    // 1. Validation: เช็คว่าส่งข้อมูลมาครบไหม
    if (!username || !email || !password || !fullName || !company) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' });
    }

    // 2. Check Duplicate: เช็ค Email ซ้ำ
    const [existingUser] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานไปแล้ว' });
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User: บันทึกลงตาราง users 
    // ใช้ roles_id = 3 (HR) และ status = 'pending'
    await db.query(
      `INSERT INTO users (username, email, password, fullName, company, roles_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, fullName, company, 3, 'pending']
    );

    res.status(201).json({ 
      message: 'สมัครสมาชิก HR สำเร็จ กรุณารอ Admin อนุมัติการใช้งาน' 
    });

  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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
// POST /auth/hr/login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /auth/hr/login:
 *   post:
 *     summary: เข้าสู่ระบบสำหรับ HR
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
 *                 example: hr@company.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login สำเร็จ
 *       401:
 *         description: Email หรือ Password ผิด
 *       403:
 *         description: บัญชี HR ยังไม่ได้รับการอนุมัติ (Pending)
 */

authRouter.post('/hr/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. ค้นหา User จาก email และต้องเป็น HR (roles_id = 3) เท่านั้น
        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ? AND roles_id = 3", 
            [email]
        );

        // ถ้าไม่เจอ User หรือไม่ใช่ HR
        if (users.length === 0) {
            return res.status(401).json({ message: "ไม่พบอีเมลนี้ในระบบ HR" });
        }

        const user = users[0];

        // 2. ตรวจสอบสถานะ (ถ้าเป็น pending จะยัง Login ไม่ได้)
        if (user.status !== 'active') {
            return res.status(403).json({ 
                message: "บัญชีของคุณอยู่ระหว่างการรออนุมัติ หรือถูกระงับการใช้งาน" 
            });
        }

        // 3. เปรียบเทียบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
        }

        // 4. สร้าง Token (ใช้ JWT_SECRET จาก .env เพื่อแก้ Error ที่คุณเจอ)
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.roles_id },
            process.env.JWT_SECRET || 'SECRET_KEY', // แนะนำให้ใช้ .env เสมอ
            { expiresIn: '1d' }
        );

        // 5. ส่ง Response กลับ (โครงสร้างเดียวกับ User Login)
        res.status(200).json({
            message: "เข้าสู่ระบบ HR สำเร็จ",
            token: token,
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.roles_id,
                status: user.status 
            }
        });

    } catch (error) {
        console.error("HR Login Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

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
authRouter.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // ดึง ID จาก Token

    // SQL: JOIN ตาราง roles เพื่อเอาชื่อ role_name มาแสดงแทนตัวเลข
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.email, u.fullName, u.status, r.name as role 
       FROM users u 
       JOIN roles r ON u.roles_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || "N/A", // ป้องกันกรณี fullName เป็นค่าว่าง
        role: user.role,      // จะแสดงเป็น 'Admin', 'User', หรือ 'HR' ตามในตาราง roles
        status: user.status
      }
    });

  } catch (err) {
    console.error("GET /me Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/oauth/:provider
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/oauth/{provider}:
 *   get:
 *     summary: Redirect ไปยังหน้า Social Login (Google/GitHub)
 *     tags: [Auth]
 *     description: |
 *       **คลิกเพื่อทดสอบ:**
 *       - [Login with Google](http://localhost:3000/auth/oauth/google)
 *       - [Login with GitHub](http://localhost:3000/auth/oauth/github)
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github]
 *         description: เลือก provider ที่ต้องการ
 *     responses:
 *       302:
 *         description: Redirect ไปยังหน้า Login ของ Provider
 */

authRouter.get('/oauth/:provider', (req, res) => {
  const { provider } = req.params;

  if (provider === 'google') {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // ดึงจาก .env
    const REDIRECT_URI = "http://localhost:3000/auth/oauth/google/callback";

    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=email%20profile`;
    return res.redirect(googleUrl);
  }

  if (provider === 'github') {
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID; // ดึงจาก .env
    const REDIRECT_URI = "http://localhost:3000/auth/oauth/github/callback";
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`;
    return res.redirect(githubUrl);
  }

  return res.status(400).json({ message: "Provider ไม่รองรับ" });
});

// 2. Google Callback
authRouter.get('/oauth/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).send("Login Failed: No code provided");

  try {
    // แลก Token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'http://localhost:3000/auth/oauth/google/callback',
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    // ขอข้อมูล Profile
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const googleUser = userResponse.data;

    // จัดการ Database
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [googleUser.email]);
    
    let user;
    if (rows.length > 0) {
      user = rows[0];
    } else {
      const [result] = await db.query(
        "INSERT INTO users (username, email, fullName, roles_id, status) VALUES (?, ?, ?, ?, ?)",
        [googleUser.email.split('@')[0], googleUser.email, googleUser.name, 2, 'active']
      );
      user = { id: result.insertId, email: googleUser.email, roles_id: 2 };
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.roles_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'AUTH_SUCCESS', token: '${token}' }, 'http://localhost:5173');
            window.close();
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("Google Auth Error:", error.response?.data || error.message);
    res.status(500).send("Authentication failed");
  }
});

authRouter.get('/oauth/github/callback', async (req, res) => {
  const { code } = req.query; // GitHub ส่ง code มาให้ทาง URL เหมือนกัน

  if (!code) return res.status(400).send("Login Failed: No code provided from GitHub");

  try {
    // A. นำ code ไปแลก Access Token จาก GitHub
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }, {
      headers: { Accept: 'application/json' } // GitHub ต้องการ header นี้เพื่อให้ส่งกลับเป็น JSON
    });

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
        return res.status(400).send("GitHub Authentication failed: No access token");
    }

    // B. นำ access_token ไปขอข้อมูล Profile (Username, Email)
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const githubUser = userResponse.data; 
    // ข้อมูลที่ได้: githubUser.login (username), githubUser.email, githubUser.name, githubUser.id

    // C. ตรวจสอบในฐานข้อมูล (Logic เหมือน Google)
    // หมายเหตุ: บางครั้ง GitHub ไม่คืน Email ถ้า User ตั้งค่าเป็น Private 
    // เราจะใช้ githubUser.login + "@github.com" เป็นตัวสำรองถ้าไม่มี email
    const userEmail = githubUser.email || `${githubUser.login}@github.com`;

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [userEmail]);
    
    let user;
    if (rows.length > 0) {
      user = rows[0];
    } else {
      // สร้าง User ใหม่
      const [result] = await db.query(
        "INSERT INTO users (username, email, fullName, roles_id, status) VALUES (?, ?, ?, ?, ?)",
        [githubUser.login, userEmail, githubUser.name || githubUser.login, 2, 'active']
      );
      user = { id: result.insertId, email: userEmail, roles_id: 2 };
    }

    // D. สร้าง JWT Token ของระบบเรา
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.roles_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // E. ส่งสคริปต์ปิด Popup และส่ง Token กลับไปที่ Frontend
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'AUTH_SUCCESS', token: '${token}' }, 'http://localhost:5173');
            window.close();
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("GitHub Auth Error:", error.response?.data || error.message);
    res.status(500).send("GitHub Authentication failed");
  }
});

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