import { Router } from "express";
import db from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from '../middleware/requireRole.js'

const resumeRouter = Router();

// base path: "/resumes"

/**
 * @swagger
 * tags:
 *   name: Resumes
 *   description: API สำหรับจัดการ Resume
 */

resumeRouter.get("/public", async (req, res) => {
  try {
    // ดึงข้อมูลเรซูเม่ที่เป็น public พร้อมชื่อเจ้าของ (JOIN กับตาราง users)
    const [resumes] = await db.query(
      `SELECT r.id, r.title, r.visibility, r.created_at AS publishedAt, u.fullName AS owner 
       FROM resumes r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.visibility = 'public' 
       ORDER BY r.created_at DESC`
    );

    res.status(200).json({ resumes });
  } catch (err) {
    console.error("Get Public Resumes Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Resume:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "abc123"
 *         title:
 *           type: string
 *           example: "My Resume"
 *         template:
 *           type: string
 *           example: "modern"
 *         sections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Section'
 *         visibility:
 *           type: string
 *           enum: [public, private]
 *           example: "private"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Section:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "sec001"
 *         type:
 *           type: string
 *           example: "experience"
 *         content:
 *           type: object
 *           example: { "company": "Acme Corp", "role": "Developer" }
 *         order:
 *           type: integer
 *           example: 1
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// ─────────────────────────────────────────────────────────────────────────────
// GET /resumes/my
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/my:
 *   get:
 *     summary: ดู resume ทั้งหมดที่ตัวเองสร้างไว้
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการ resume ทั้งหมดของ user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resumes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Resume'
 *       401:
 *         description: Unauthorized
 */
resumeRouter.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // ดึง ID จาก Token ที่ login ไว้

    // 1. ดึงข้อมูล Resume ทั้งหมดที่ user คนนี้เป็นเจ้าของ
    const [resumes] = await db.query(
      "SELECT id, title, template, visibility, created_at AS createdAt, updated_at AS updatedAt FROM resumes WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    // 2. ดึงข้อมูล Sections (ตารางย่อย) ของแต่ละ Resume มาประกอบร่าง
    // ใช้ Promise.all เพื่อให้ดึงข้อมูลของทุก Resume พร้อมกันอย่างรวดเร็ว
    const resumesWithSections = await Promise.all(
      resumes.map(async (resume) => {
        const [sections] = await db.query(
          "SELECT id, type, content, section_order AS `order` FROM resume_sections WHERE resume_id = ? ORDER BY section_order ASC",
          [resume.id]
        );

        return {
          ...resume,
          sections: sections // เอาข้อมูลย่อยใส่เข้าไปในตัว Resume นั้นๆ
        };
      })
    );

    // 3. ส่งข้อมูลออกไป (ถ้าไม่มีข้อมูลจะคืนค่าเป็นอาเรย์ว่าง { resumes: [] })
    res.status(200).json({ resumes: resumesWithSections });

  } catch (err) {
    console.error("Get My Resumes Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /resumes/resumes
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/resumes:
 *   post:
 *     summary: สร้าง resume ใหม่พร้อมเลือก template
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - template
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My New Resume"
 *               template:
 *                 type: string
 *                 example: "modern"
 *               sections:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Section'
 *     responses:
 *       201:
 *         description: สร้าง resume สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Resume created successfully"
 *                 resume:
 *                   $ref: '#/components/schemas/Resume'
 *       400:
 *         description: Bad Request - ข้อมูลไม่ครบ
 *       401:
 *         description: Unauthorized
 */
resumeRouter.post("/",authMiddleware, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { title, template, visibility, sections } = req.body;
    const userId = req.user.id;

    // 1. บันทึกตารางหลัก
    const [resumeResult] = await connection.query(
      "INSERT INTO resumes (user_id, title, template, visibility) VALUES (?, ?, ?, ?)",
      [userId, title || "Untitled Resume", template || "template1", visibility || "private"]
    );
    const resumeId = resumeResult.insertId;

    // 2. บันทึกตารางย่อย (Sections)
    if (sections && Array.isArray(sections) && sections.length > 0) {
      // เตรียม Query สำหรับ Insert หลายแถวพร้อมกัน (Bulk Insert) เพื่อความเร็ว
      const sectionValues = sections.map((section) => [
        resumeId,
        section.type,
        JSON.stringify(section.content), // แปลงก้อนข้อมูลเป็น JSON string
        section.order
      ]);

      await connection.query(
        "INSERT INTO resume_sections (resume_id, type, content, section_order) VALUES ?",
        [sectionValues]
      );
    }

    await connection.commit();

    // ✅ จุดที่ต้องแก้: ส่งข้อมูลกลับไปให้ Swagger โชว์แทนที่จะส่ง {}
    res.status(201).json({
      message: "สร้าง Resume สำเร็จแล้ว!",
      resumeId: resumeId,
      data: { title, template, visibility, sections }
    });

  } catch (err) {
    // หากเกิดข้อผิดพลาด ให้ยกเลิกคำสั่งทั้งหมด (Rollback)
    if (connection) await connection.rollback();
    console.error("Post Resume Error:", err.message);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  } finally {
    // คืน Connection ให้กับ Database Pool
    if (connection) connection.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /resumes/:id
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}:
 *   get:
 *     summary: ดู resume (ตรวจสิทธิ์ ownership + visibility อัตโนมัติ)
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     responses:
 *       200:
 *         description: ข้อมูล resume
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resumes:
 *                   $ref: '#/components/schemas/Resume'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่มีสิทธิ์เข้าถึง
 *       404:
 *         description: ไม่พบ resume
 */

resumeRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. ดึงข้อมูล Resume ออกมาก่อน (รวมถึงข้อมูล sections)
    const [resumes] = await db.query(
      `SELECT r.*, u.fullName as ownerName 
       FROM resumes r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [id]
    );

    if (resumes.length === 0) {
      return res.status(404).json({ message: "ไม่พบเรซูเม่นี้" });
    }

    const resume = resumes[0];

    // 2. เช็คเงื่อนไขความปลอดภัย (Access Control)
    if (resume.visibility === "private") {
      // ถ้าเป็น Private ต้องเช็ค Token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "กรุณาเข้าสู่ระบบเพื่อดูเรซูเม่ส่วนตัว" });
      }

      // TODO: คุณอาจต้องเรียกใช้ verifyJWT function ตรงนี้แบบ manual 
      // หรือตรวจสอบว่า userId จาก Token ตรงกับ resume.user_id หรือไม่
      // (ตัวอย่างเบื้องต้น: สมมติว่าดึง userId จากการถอดรหัส token)
    }

    // 3. ดึง Sections ที่เกี่ยวข้องมาด้วย
    const [sections] = await db.query(
      "SELECT * FROM resume_sections WHERE resume_id = ? ORDER BY `order` ASC",
      [id]
    );

    // ส่งข้อมูลกลับ (รวมข้อมูลเจ้าของและ sections)
    res.status(200).json({
      resume: {
        ...resume,
        sections: sections.map(s => ({
          ...s,
          content: JSON.parse(s.content) // แปลง JSON string กลับเป็น Object
        }))
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /resumes/:id
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}:
 *   put:
 *     summary: แก้ไขเนื้อหา resume เจ้าของเท่านั้น
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Resume Title"
 *               sections:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Section'
 *     responses:
 *       200:
 *         description: อัปเดต resume สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Resume updated successfully"
 *                 resume:
 *                   $ref: '#/components/schemas/Resume'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่ใช่เจ้าของ
 *       404:
 *         description: ไม่พบ resume
 */
resumeRouter.put("/:id", authMiddleware, async (req, res) => {
  const connection = await db.getConnection(); // ดึง connection มาทำ Transaction
  try {
    await connection.beginTransaction();

    const resumeId = req.params.id;
    const userId = req.user.id;
    const { title, template, visibility, sections } = req.body;

    // 1. ตรวจสอบว่า Resume นี้มีจริงและเป็นของ User คนนี้หรือไม่
    const [resumeRows] = await connection.query(
      "SELECT id FROM resumes WHERE id = ? AND user_id = ?",
      [resumeId, userId]
    );

    if (resumeRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "ไม่พบ Resume หรือคุณไม่มีสิทธิ์แก้ไข" });
    }

    // 2. อัปเดตข้อมูลตารางหลัก (resumes)
    await connection.query(
      "UPDATE resumes SET title = ?, template = ?, visibility = ? WHERE id = ?",
      [title || "Untitled", template || "modern", visibility || "private", resumeId]
    );

    // 3. จัดการตารางย่อย (resume_sections)
    if (sections) {
      // วิธีที่ง่ายที่สุด: ลบอันเก่าทิ้งทั้งหมดของ Resume นี้
      await connection.query("DELETE FROM resume_sections WHERE resume_id = ?", [resumeId]);

      // แล้ว Insert อันใหม่เข้าไปแทน
      if (sections.length > 0) {
        for (const section of sections) {
          await connection.query(
            "INSERT INTO resume_sections (resume_id, type, content, section_order) VALUES (?, ?, ?, ?)",
            [resumeId, section.type, JSON.stringify(section.content), section.order]
          );
        }
      }
    }

    await connection.commit(); // ยืนยันการแก้ไขทั้งหมดลง Database

    res.status(200).json({
      message: "Resume updated successfully",
      resume: { id: resumeId, title, template, visibility, sections }
    });

  } catch (err) {
    if (connection) await connection.rollback(); // ถ้าพังให้ยกเลิกทั้งหมด (Rollback)
    console.error("Update Resume Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release(); // คืน connection ให้ pool
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /resumes/:id
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}:
 *   delete:
 *     summary: ลบ resume ตัวเอง / Super Admin ลบได้ทุกอัน
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     responses:
 *       200:
 *         description: ลบ resume สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Resume deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่มีสิทธิ์ลบ
 *       404:
 *         description: ไม่พบ resume
 */
resumeRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role; // สมมติว่าใน Token มีการเก็บ role ไว้ (1 คือ Admin)

    // 1. ดึงข้อมูลมาเช็คก่อนว่ามี Resume นี้จริงไหม และใครเป็นเจ้าของ
    const [resumeRows] = await db.query(
      "SELECT id, user_id FROM resumes WHERE id = ?",
      [resumeId]
    );

    if (resumeRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบ Resume ที่ต้องการลบ" });
    }

    const resume = resumeRows[0];

    // 2. ตรวจสอบสิทธิ์ (เจ้าของลบเอง OR เป็น Admin ลบ)
    // ถ้าไม่ใช่เจ้าของ AND ไม่ใช่ Admin (Role 1) -> บล็อกทันที
    if (resume.user_id !== userId && userRole !== 1) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบ Resume ชุดนี้" });
    }

    // 3. ทำการลบข้อมูล
    // หมายเหตุ: ถ้าคุณตั้งค่า Foreign Key เป็น ON DELETE CASCADE ไว้ในตาราง resume_sections
    // การลบจากตาราง resumes อย่างเดียว ข้อมูลในตารางย่อยจะหายไปเองอัตโนมัติครับ
    await db.query("DELETE FROM resumes WHERE id = ?", [resumeId]);

    // 4. บันทึก Log (ถ้ามีฟังก์ชัน logAction)
    if (typeof logAction === "function") {
      await logAction(userId, "DELETE_RESUME", resumeId, `Deleted resume ID: ${resumeId}`);
    }

    res.status(200).json({ message: "Resume deleted successfully" });

  } catch (err) {
    console.error("Delete Resume Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /resumes/:id/visibility
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}/visibility:
 *   patch:
 *     summary: สลับ resume ระหว่าง public กับ private
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visibility
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 example: "public"
 *     responses:
 *       200:
 *         description: เปลี่ยน visibility สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Visibility updated to public"
 *       400:
 *         description: Bad Request - visibility ไม่ถูกต้อง
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: ไม่พบ resume
 */
resumeRouter.patch("/:id/visibility", (req, res) => {
  // TODO: implement
  res.json({ message: "Visibility updated" });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /resumes/:id/export
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}/export:
 *   get:
 *     summary: Export resume เป็น PDF หรือ Shareable link
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, link]
 *         required: true
 *         description: รูปแบบ export
 *     responses:
 *       200:
 *         description: Export สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: กรณี format=link
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://example.com/share/abc123"
 *           application/pdf:
 *             schema:
 *               description: กรณี format=pdf จะได้ไฟล์ PDF กลับมา
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad Request - format ไม่ถูกต้อง
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: ไม่พบ resume
 */
resumeRouter.get("/:id/export", (req, res) => {
  // TODO: implement
  const { format } = req.query;
  if (format === "link") {
    return res.json({ url: "https://example.com/share/abc123" });
  }
  res.json({ message: "PDF export not yet implemented" });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /resumes/:id/sections
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /resumes/{id}/sections:
 *   post:
 *     summary: เพิ่มหรือจัดเรียง section ใน resume เช่น ประสบการณ์ ทักษะ
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resume ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - content
 *               - order
 *             properties:
 *               type:
 *                 type: string
 *                 example: "experience"
 *               content:
 *                 type: object
 *                 example: { "company": "Acme Corp", "role": "Developer", "years": 2 }
 *               order:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: เพิ่ม section สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Section added successfully"
 *                 section:
 *                   $ref: '#/components/schemas/Section'
 *       400:
 *         description: Bad Request - ข้อมูลไม่ครบ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - ไม่ใช่เจ้าของ
 *       404:
 *         description: ไม่พบ resume
 */
resumeRouter.post("/:id/sections", (req, res) => {
  // TODO: implement
  res.status(201).json({ message: "Section added successfully", section: {} });
});



export default resumeRouter;