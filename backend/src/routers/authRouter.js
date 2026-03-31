import { Router } from 'express'
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
    const { username, email, password, fullName } = req.body; // เพิ่ม fullName เข้ามาด้วย

    try {
        // 1. เช็ค Email ซ้ำก่อน (ป้องกัน Error จาก DB)
        const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานไปแล้ว" });
        }

        // 2. เข้ารหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. บันทึกลงตาราง (เพิ่ม fullName เข้าไปตามที่คุณมีใน Form)
        const sql = "INSERT INTO users (username, email, password, fullName, roles_id, status) VALUES (?, ?, ?, ?, ?, ?)";
        const [result] = await db.query(sql, [username, email, hashedPassword, fullName, 2, 'active']);

        const userId = result.insertId;

        // 🌟 4. สร้าง Token ทันที (เพื่อให้ Frontend เอาไปใช้ Login ต่อได้เลย)
        const token = jwt.sign(
            { id: userId, email: email, role: 2 },
            process.env.JWT_SECRET || 'SECRET_KEY',
            { expiresIn: '1d' }
        );

        // 5. ส่งทั้ง message และ token กลับไป
        res.status(201).json({ 
            message: "Registration successful", 
            token: token, // ส่งกุญแจกลับไปให้ Frontend วาร์ป
            user: { id: userId, username, role: 2 }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Database Error", error: error.message });
    }
});

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

    if (!username || !email || !password || !fullName || !company) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' });
    }

    const [existingUser] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานไปแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🌟 Logic พิเศษ: ถ้าชื่อบริษัทคือ "PerFile" ให้เป็น Admin ทันที
    const isAdminKeyword = company.trim().toLowerCase() === 'perfile';
    const assignedRole = isAdminKeyword ? 1 : 3; // 1 = Admin, 3 = HR
    const assignedStatus = isAdminKeyword ? 'active' : 'pending'; // Admin ไม่ต้องรออนุมัติ

    await db.query(
      `INSERT INTO users (username, email, password, fullName, company, roles_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, fullName, company, assignedRole, assignedStatus]
    );

    res.status(201).json({ 
      message: isAdminKeyword 
        ? 'ลงทะเบียนบัญชี Admin สำเร็จแล้ว' 
        : 'สมัครสมาชิก HR สำเร็จ กรุณารอ Admin อนุมัติการใช้งาน' 
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
          { id: user.id, email: user.email, roles_id: user.roles_id },
          process.env.JWT_SECRET || 'SECRET_KEY', 
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
    // 🌟 ค้นหา User ที่เป็นได้ทั้ง Admin (1) หรือ HR (3)
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ? AND roles_id IN (1, 3)", 
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "ไม่พบอีเมลนี้ในระบบจัดการ" });
    }

    const user = users[0];

    // ตรวจสอบสถานะ (ถ้า Admin สมัครด้วย Keyword จะเป็น active ทันที)
    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: "บัญชีของคุณอยู่ระหว่างการรออนุมัติ หรือถูกระงับการใช้งาน" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, roles_id: user.roles_id },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: user.roles_id === 1 ? "ยินดีต้อนรับ Admin" : "เข้าสู่ระบบ HR สำเร็จ",
      token: token,
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.roles_id,
        status: user.status 
      }
    });

  } catch (error) {
    console.error("Management Login Error:", error);
    res.status(500).json({ message: "Server Error" });
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
authRouter.post('/logout', authMiddleware, (req, res) => {
  // ในระบบ JWT ปกติ เราแค่ตอบกลับว่าสำเร็จ
  // เพราะหน้าที่หลักในการทำลาย Token คือฝั่ง Frontend
  
  // 💡 ถ้าในอนาคตอยากทำระบบ "Blacklist Token" 
  // คุณสามารถเอาค่า req.user.id หรือ Token ไปเก็บในฐานข้อมูลที่ชื่อ 'revoked_tokens' ได้ที่นี่
  
  res.status(200).json({ 
    message: 'Logout successful',
    info: 'Please remove the token from your local storage' 
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/me
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: ดูข้อมูล user ที่ login อยู่ พร้อมบทบาทและสถานะ
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *       401:
 *         description: ไม่พบ Token หรือ Token หมดอายุ
 */

// ต้องมั่นใจว่ามี Middleware verifyToken (หรือชื่อคล้ายๆ กัน) นำหน้า
authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // ดึงมาจาก JWT Payload

    // เพิ่ม u.avatar เข้าไปใน SQL (อย่าลืมไปเพิ่ม column นี้ในตาราง users นะครับ)
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.email, u.fullName, u.avatar, u.status, r.name as role 
       FROM users u 
       JOIN roles r ON u.roles_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน" });
    }

    const user = rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || user.username, // ถ้าไม่มีชื่อจริง ให้ใช้ username แทน
        avatar: user.avatar || null,             // ส่ง URL รูปโปรไฟล์กลับไป
        role: user.role,                         // 'Admin', 'User', 'HR'
        status: user.status
      }
    });

  } catch (err) {
    console.error("GET /me Error:", err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
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
// 1. Google Callback (เพิ่มระบบ Avatar)
authRouter.get('/oauth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send("Login Failed: No code provided");

  try {
    // 1. แลก Code เป็น Access Token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'http://localhost:3000/auth/oauth/google/callback',
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    // 2. ดึงข้อมูล User จาก Google (ข้อมูลที่ได้จะมีฟิลด์ 'id' หรือ 'sub')
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const googleUser = userResponse.data;
    // ใช้ sub (มาตรฐาน JWT) หรือ id (มาตรฐาน Google API)
    const googleId = googleUser.sub || googleUser.id; 

    // 3. ตรวจสอบว่ามี Email นี้ในระบบหรือยัง
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [googleUser.email]);
    
    let user;
    if (rows.length > 0) {
      user = rows[0];
      // 🌟 อัปเดตข้อมูลเดิม: บันทึก google_id เพิ่มเข้าไปด้วย
      await db.query(
        "UPDATE users SET avatar = ?, fullName = ?, google_id = ? WHERE id = ?",
        [googleUser.picture, googleUser.name, googleId, user.id]
      );
      // อัปเดตตัวแปร user ให้มีค่าล่าสุด
      user.google_id = googleId;
      user.avatar = googleUser.picture;
      user.fullName = googleUser.name;
    } else {
      // 🌟 สมัครสมาชิกใหม่: บันทึก google_id ลงไปตั้งแต่แรก
      const isHR = state === 'hr_register'; 
      const defaultRole = isHR ? 3 : 2;
      const defaultStatus = isHR ? 'pending' : 'active';

      const [result] = await db.query(
        "INSERT INTO users (username, email, fullName, avatar, google_id, password, roles_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          googleUser.email.split('@')[0], 
          googleUser.email, 
          googleUser.name, 
          googleUser.picture, 
          googleId, // <--- เพิ่มตรงนี้
          null, 
          defaultRole, 
          defaultStatus
        ]
      );
      user = { id: result.insertId, email: googleUser.email, roles_id: defaultRole, status: defaultStatus };
    }

    // 🔒 เช็คสถานะ (HR ต้องรอ Admin Approve)
    if (user.status !== 'active') {
      return res.send(`
        <script>
          window.opener.postMessage({ type: 'AUTH_ERROR', message: 'บัญชีของคุณอยู่ระหว่างการรออนุมัติ' }, 'http://localhost:5173');
          window.close();
        </script>
      `);
    }

    // 4. สร้าง JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.roles_id },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1d' }
    );

    // 5. ส่งสคริปต์กลับไปปิด Popup
    res.send(`
    <html>
      <body>
        <script>
          const token = "${token}";
          const role = "${user.roles_id}";
          const frontendUrl = "http://localhost:5173";

          if (window.opener) {
            window.opener.postMessage({ type: 'AUTH_SUCCESS', token: token, role: role }, frontendUrl);
            setTimeout(() => { window.close(); }, 500);
          } else {
            localStorage.setItem('token', token);
            window.location.href = frontendUrl + (role === "3" ? "/hr-feed" : "/feed");
          }
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
  const { code } = req.query;
  if (!code) return res.status(400).send("Login Failed: No code provided from GitHub");

  try {
    // 1. นำ code ไปแลก Access Token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, { headers: { Accept: 'application/json' } });

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) return res.status(400).send("GitHub Auth failed: No token");

    // 2. ดึงข้อมูล User Profile พื้นฐาน
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const githubUser = userResponse.data; 
    const githubId = githubUser.id; // 🌟 นี่คือ ID ตัวเลขของ GitHub User

    // 3. --- Logic ดึงอีเมลสำรอง (เหมือนเดิมของคุณ) ---
    let userEmail = githubUser.email;
    if (!userEmail) {
      try {
        const emailResponse = await axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const primaryEmail = emailResponse.data.find(e => e.primary && e.verified);
        userEmail = primaryEmail ? primaryEmail.email : (emailResponse.data[0] ? emailResponse.data[0].email : null);
      } catch (e) {
        console.error("Failed to fetch GitHub emails:", e.message);
      }
    }

    if (!userEmail) {
      userEmail = `${githubUser.login}@github.com`;
    }

    // 4. จัดการ Database (เช็ค/เพิ่ม/อัปเดต)
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [userEmail]);
    
    let user;
    if (rows.length > 0) {
      user = rows[0];
      // 🌟 อัปเดตข้อมูลเดิม: บันทึก github_id เพิ่มเข้าไปด้วย
      await db.query(
        "UPDATE users SET avatar = ?, github_id = ? WHERE id = ?", 
        [githubUser.avatar_url, githubId, user.id]
      );
      user.github_id = githubId;
      user.avatar = githubUser.avatar_url;
    } else {
      // 🌟 สมัครสมาชิกใหม่: บันทึก github_id ลงไปตั้งแต่แรก
      const [result] = await db.query(
        "INSERT INTO users (username, email, fullName, avatar, github_id, roles_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          githubUser.login, 
          userEmail, 
          githubUser.name || githubUser.login, 
          githubUser.avatar_url, 
          githubId, // <--- เพิ่มตรงนี้
          2, 
          'active'
        ]
      );
      user = { id: result.insertId, email: userEmail, roles_id: 2 };
    }

    // 5. สร้าง JWT สำหรับระบบของเรา
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.roles_id },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1d' }
    );

    // 6. ส่ง Token กลับไปปิด Popup ที่ Frontend
    res.send(`
      <html>
        <body>
          <script>
            // ส่ง message กลับไปที่หน้าหลัก (เหมือน Google เพื่อความสัมพันธ์ที่ถูกต้อง)
            window.opener.postMessage({ 
                type: 'AUTH_SUCCESS', 
                token: '${token}', 
                role: '${user.roles_id}' 
            }, 'http://localhost:5173');
            window.close();
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("GitHub OAuth Error:", error.response?.data || error.message);
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
authRouter.patch('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // ได้มาจาก authMiddleware

    // 1. ตรวจสอบข้อมูลว่าส่งมาครบไหม
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่" });
    }

    // 2. ดึงรหัสผ่านปัจจุบัน (Hashed) จากฐานข้อมูล
    const [users] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    }

    const user = users[0];

    // 3. ตรวจสอบว่ารหัสผ่านเดิม (oldPassword) ถูกต้องไหม
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" });
    }

    // 4. ตรวจสอบว่ารหัสผ่านใหม่ต้องไม่เหมือนรหัสเดิม (Optional - เพื่อความปลอดภัย)
    if (oldPassword === newPassword) {
      return res.status(400).json({ message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" });
    }

    // 5. Hash รหัสผ่านใหม่
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 6. อัปเดตรหัสผ่านใหม่ลงฐานข้อมูล
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, userId]);

    res.status(200).json({ message: "Password changed successfully" });

  } catch (error) {
    console.error("Change Password Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: ขอรีเซ็ตรหัสผ่าน (ส่งลิงก์ไปที่เมล)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: ส่งลิงก์สำเร็จ
 *       404:
 *         description: ไม่พบอีเมลนี้ในระบบ
 */

authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query("SELECT id, password FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: "ไม่พบอีเมลนี้ในระบบ" });
    }

    const user = users[0];
    const secret = (process.env.JWT_SECRET || "PerFile") + user.password;
    
    // สร้าง Token ชั่วคราว 15 นาที
    const token = jwt.sign({ id: user.id, email: email }, secret, { expiresIn: '15m' });

    // 🔗 สร้างลิงก์สมมติ (เพื่อเอาไว้ก๊อปปี้ค่าไปเทส)
    const resetLink = `http://localhost:5173/reset-password/${user.id}/${token}`;

    // 🚩 หัวใจสำคัญ: พ่นลง Terminal ให้เราเห็น
    console.log("\n================ RESET PASSWORD DEBUG ================");
    console.log("USER ID:", user.id);
    console.log("TOKEN:", token);
    console.log("======================================================\n");

    res.status(200).json({ 
      message: "ระบบได้รับคำขอแล้ว (ตรวจสอบลิงก์ใน Backend Console เพื่อเทส)",
      debug_info: "Copy token from console to use in /reset-password" 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: รีเซ็ตรหัสผ่านใหม่
 *     description: >
 *       รับ id, token จากลิงก์รีเซ็ต และรหัสผ่านใหม่จากผู้ใช้
 *       ตรวจสอบความถูกต้องของ token แล้วอัปเดตรหัสผ่านในระบบ
 *       token จะใช้ได้ครั้งเดียว (หลังเปลี่ยนรหัสผ่านแล้ว token เก่าจะหมดสภาพทันที)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - token
 *               - newPassword
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID ของผู้ใช้ (มาจาก URL ของลิงก์รีเซ็ต)
 *                 example: 42
 *               token:
 *                 type: string
 *                 description: JWT token ที่ได้รับจากลิงก์รีเซ็ตในอีเมล
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: รหัสผ่านใหม่ที่ต้องการตั้ง
 *                 example: MyNewP@ssw0rd
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
 *                   example: เปลี่ยนรหัสผ่านใหม่สำเร็จ!
 *       400:
 *         description: Token ไม่ถูกต้องหรือหมดอายุแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว
 *       404:
 *         description: ไม่พบผู้ใช้ในระบบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ไม่พบผู้ใช้
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

authRouter.post('/reset-password', async (req, res) => {
  const { id, token, newPassword } = req.body;
  try {
    // 1. ดึงข้อมูล User มาเพื่อสร้างกุญแจ Verify
    const [users] = await db.query("SELECT password FROM users WHERE id = ?", [id]);
    if (users.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    const user = users[0];
    const secret = process.env.JWT_SECRET + user.password;

    // 2. ตรวจสอบ Token ว่าถูกต้องและยังไม่หมดอายุไหม
    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({ message: "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว" });
    }

    // 3. ถ้าผ่าน ก็ Hash รหัสใหม่แล้ว Update เลย
    const hashedPass = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPass, id]);

    res.json({ message: "เปลี่ยนรหัสผ่านใหม่สำเร็จ!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default authRouter