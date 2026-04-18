import { Router } from "express";
import db from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const savedRouter = Router();

// base path: "/saved"

// ═══════════════════════════════════════════════════════════════
//  SAVED JOBS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /saved/jobs
 * ดึง job ทั้งหมดที่ seeker บันทึกไว้
 */
savedRouter.get("/jobs", authMiddleware, async (req, res) => {
  try {
    const seekerId = req.user.id;

    const [rows] = await db.query(
      `SELECT 
        sj.id        AS saved_id,
        COALESCE(sj.saved_at, sj.created_at) AS saved_at,
        j.id         AS job_id,
        j.title,
        j.salary,
        j.location,
        j.job_type,
        j.status,
        j.createdAt,
        u.fullName   AS hr_name,
        hp.company   AS company_name,
        hp.logo_url  AS company_logo
      FROM saved_jobs sj
      JOIN Job j        ON sj.job_id    = j.id
      JOIN users u      ON j.hrId       = u.id
      LEFT JOIN hr_profiles hp ON u.id  = hp.user_id
      WHERE sj.seeker_id = ?
      ORDER BY sj.saved_at DESC`,
      [seekerId]
    );

    res.status(200).json({ savedJobs: rows });
  } catch (err) {
    console.error("GET /saved/jobs Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /saved/jobs/:jobId
 * Toggle: save ถ้ายังไม่ได้ save / unsave ถ้า save แล้ว
 */
savedRouter.post("/jobs/:jobId", authMiddleware, async (req, res) => {
  try {
    const seekerId = req.user.id;
    const { jobId } = req.params;

    // เช็คว่ามี Job อยู่จริง
    const [jobRows] = await db.query("SELECT id FROM Job WHERE id = ?", [jobId]);
    if (jobRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบงานนี้" });
    }

    // เช็คว่า save ไว้แล้วหรือยัง
    const [existing] = await db.query(
      "SELECT id FROM saved_jobs WHERE seeker_id = ? AND job_id = ?",
      [seekerId, jobId]
    );

    if (existing.length > 0) {
      // มีอยู่แล้ว → unsave
      await db.query(
        "DELETE FROM saved_jobs WHERE seeker_id = ? AND job_id = ?",
        [seekerId, jobId]
      );
      return res.status(200).json({ saved: false, message: "ยกเลิกการบันทึกงานแล้ว" });
    }

    // ยังไม่มี → save
    await db.query(
      "INSERT INTO saved_jobs (seeker_id, job_id) VALUES (?, ?)",
      [seekerId, jobId]
    );
    res.status(201).json({ saved: true, message: "บันทึกงานสำเร็จ" });
  } catch (err) {
    console.error("POST /saved/jobs/:jobId Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /saved/jobs/check/:jobId
 * เช็คว่า seeker save job นี้ไว้แล้วหรือยัง (ใช้แสดงสีปุ่ม Bookmark)
 */
savedRouter.get("/jobs/check/:jobId", authMiddleware, async (req, res) => {
  try {
    const seekerId = req.user.id;
    const { jobId } = req.params;

    const [rows] = await db.query(
      "SELECT id FROM saved_jobs WHERE seeker_id = ? AND job_id = ?",
      [seekerId, jobId]
    );

    res.status(200).json({ saved: rows.length > 0 });
  } catch (err) {
    console.error("GET /saved/jobs/check Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /saved/jobs/:jobId
 * ลบ saved job ออกโดยตรง (ไม่ต้อง toggle)
 */
savedRouter.delete("/jobs/:jobId", authMiddleware, async (req, res) => {
  try {
    const seekerId = req.user.id;
    const { jobId } = req.params;

    await db.query(
      "DELETE FROM saved_jobs WHERE seeker_id = ? AND job_id = ?",
      [seekerId, jobId]
    );
    res.status(200).json({ saved: false, message: "ลบออกจากรายการบันทึกแล้ว" });
  } catch (err) {
    console.error("DELETE /saved/jobs/:jobId Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SAVED RESUMES (บันทึก resume ของ user คนอื่น)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /saved/resumes
 * ดึง resume ทั้งหมดที่ seeker บันทึกไว้
 */
savedRouter.get("/resumes", authMiddleware, async (req, res) => {
  try {
    const seekerId = req.user.id;

    const [rows] = await db.query(
      `SELECT
        sr.id           AS saved_id,
        sr.saved_at,
        r.id            AS resume_id,
        r.title         AS resume_title,
        r.visibility,
        r.created_at    AS resume_created_at,
        u.id            AS owner_id,
        u.fullName      AS owner_name,
        sp.bio          AS owner_bio,
        sp.location     AS owner_location
      FROM saved_resumes sr
      JOIN resumes r          ON sr.resume_id      = r.id
      JOIN users u            ON r.user_id          = u.id
      LEFT JOIN seeker_profiles sp ON u.id          = sp.user_id
      WHERE sr.seeker_id = ?
        AND r.visibility  = 'public'
      ORDER BY sr.saved_at DESC`,
      [seekerId]
    );

    res.status(200).json({ savedResumes: rows });
  } catch (err) {
    console.error("GET /saved/resumes Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /saved/resumes/:resumeId
 * Toggle: save/unsave resume ของคนอื่น (เฉพาะ public resume เท่านั้น)
 */
savedRouter.post("/resumes/:resumeId", authMiddleware, async (req, res) => {
  try {
    const seekerId = req.user.id;
    const { resumeId } = req.params;

    // เช็คว่า resume มีอยู่ + เป็น public + ไม่ใช่ของตัวเอง
    const [resumeRows] = await db.query(
      "SELECT id, user_id, visibility FROM resumes WHERE id = ?",
      [resumeId]
    );

    if (resumeRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบ Resume นี้" });
    }

    const resume = resumeRows[0];

    if (resume.user_id === seekerId) {
      return res.status(422).json({ message: "ไม่สามารถบันทึก Resume ของตัวเองได้" });
    }

    if (resume.visibility !== "public") {
      return res.status(403).json({ message: "Resume นี้ไม่ได้เปิดสาธารณะ" });
    }

    // Toggle
    const [existing] = await db.query(
      "SELECT id FROM saved_resumes WHERE seeker_id = ? AND resume_id = ?",
      [seekerId, resumeId]
    );

    if (existing.length > 0) {
      await db.query(
        "DELETE FROM saved_resumes WHERE seeker_id = ? AND resume_id = ?",
        [seekerId, resumeId]
      );
      return res.status(200).json({ saved: false, message: "ยกเลิกการบันทึก Resume แล้ว" });
    }

    await db.query(
      "INSERT INTO saved_resumes (seeker_id, resume_id) VALUES (?, ?)",
      [seekerId, resumeId]
    );
    res.status(201).json({ saved: true, message: "บันทึก Resume สำเร็จ" });
  } catch (err) {
    console.error("POST /saved/resumes/:resumeId Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /saved/resumes/check/:resumeId
 * เช็คว่า seeker save resume นี้แล้วหรือยัง
 */
savedRouter.get("/resumes/check/:resumeId", authMiddleware, async (req, res) => {
  try {
    const seekerId = req.user.id;
    const { resumeId } = req.params;

    const [rows] = await db.query(
      "SELECT id FROM saved_resumes WHERE seeker_id = ? AND resume_id = ?",
      [seekerId, resumeId]
    );

    res.status(200).json({ saved: rows.length > 0 });
  } catch (err) {
    console.error("GET /saved/resumes/check Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * DELETE /saved/resumes/:resumeId
 * ลบ saved resume ออกโดยตรง
 */
savedRouter.delete("/resumes/:resumeId", authMiddleware, async (req, res) => {
  try {
    const seekerId = req.user.id;
    const { resumeId } = req.params;

    await db.query(
      "DELETE FROM saved_resumes WHERE seeker_id = ? AND resume_id = ?",
      [seekerId, resumeId]
    );
    res.status(200).json({ saved: false, message: "ลบออกจากรายการบันทึกแล้ว" });
  } catch (err) {
    console.error("DELETE /saved/resumes/:resumeId Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default savedRouter;