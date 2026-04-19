import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResumes } from "./ResumeContext";
import axios from "axios";
import "../styles/Resume.css";

const defaultData = {
  name: "",
  title: "",
  template: "",
  image: null,
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  summary: "",
  experience: [],
  education: [],
  skillDisplayMode: "simple",
  skills: [],
};

// ── EntryBlock (with datalist autocomplete + period formatting from Doc1) ──
function EntryBlock({ type, entries, onChange, onAdd, onRemove }) {
  const isEdu = type === "education";
  return (
    <div>
      {entries.map((e, i) => (
        <div key={e.id} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-title">
              {isEdu ? (e.degree || `ประวัติการศึกษาที่ ${i + 1}`) : (e.role || `ประสบการณ์ที่ ${i + 1}`)}
            </span>
            <button className="btn-remove" onClick={() => onRemove(e.id)}>×</button>
          </div>
          <div className="field">
            <label>{isEdu ? "วุฒิการศึกษา / สาขา" : "ตำแหน่ง / ชื่อ"}</label>
            <input
              list={isEdu ? `degree-list-${e.id}` : undefined}
              value={isEdu ? e.degree : e.role}
              onChange={ev => onChange(e.id, isEdu ? "degree" : "role", ev.target.value)}
              placeholder={isEdu ? "เช่น ปริญญาตรี วิทยาการคอมพิวเตอร์" : "ชื่อตำแหน่งงาน"}
            />
            {isEdu && (
              <datalist id={`degree-list-${e.id}`}>
                <option value="ปริญญาตรี วิทยาการคอมพิวเตอร์" /><option value="ปริญญาตรี วิศวกรรมคอมพิวเตอร์" />
                <option value="ปริญญาตรี วิศวกรรมซอฟต์แวร์" /><option value="ปริญญาตรี เทคโนโลยีสารสนเทศ" />
                <option value="ปริญญาตรี บริหารธุรกิจ (การตลาด)" /><option value="ปริญญาตรี บริหารธุรกิจ (การจัดการ)" />
                <option value="ปริญญาตรี บัญชี" /><option value="ปริญญาตรี นิติศาสตร์" />
                <option value="ปริญญาตรี นิเทศศาสตร์" /><option value="ปริญญาตรี รัฐศาสตร์" />
                <option value="ปริญญาตรี วิศวกรรมไฟฟ้า" /><option value="ปริญญาตรี สถาปัตยกรรมศาสตร์" />
                <option value="ปริญญาโท บริหารธุรกิจ (MBA)" /><option value="ปริญญาโท วิทยาการคอมพิวเตอร์" />
                <option value="ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)" /><option value="ประกาศนียบัตรวิชาชีพ (ปวช.)" />
                <option value="มัธยมศึกษาตอนปลาย" />
              </datalist>
            )}
          </div>
          <div className="row">
            <div className="field">
              <label>{isEdu ? "สถานศึกษา" : "องค์กร / บริษัท"}</label>
              <input
                list={isEdu ? `school-list-${e.id}` : undefined}
                value={isEdu ? e.school : e.org}
                onChange={ev => onChange(e.id, isEdu ? "school" : "org", ev.target.value)}
                placeholder={isEdu ? "ชื่อมหาวิทยาลัย / โรงเรียน" : "ชื่อบริษัท"}
              />
              {isEdu && (
                <datalist id={`school-list-${e.id}`}>
                  <option value="มหาวิทยาลัยศรีปทุม" />
                  <option value="จุฬาลงกรณ์มหาวิทยาลัย" /><option value="มหาวิทยาลัยธรรมศาสตร์" />
                  <option value="มหาวิทยาลัยมหิดล" /><option value="มหาวิทยาลัยเกษตรศาสตร์" />
                  <option value="มหาวิทยาลัยศิลปากร" /><option value="มหาวิทยาลัยขอนแก่น" />
                  <option value="มหาวิทยาลัยเชียงใหม่" /><option value="มหาวิทยาลัยสงขลานครินทร์" />
                  <option value="มหาวิทยาลัยบูรพา" /><option value="สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง" />
                  <option value="มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี" /><option value="มหาวิทยาลัยรามคำแหง" />
                  <option value="มหาวิทยาลัยศรีนครินทรวิโรฒ" /><option value="มหาวิทยาลัยนเรศวร" />
                  <option value="มหาวิทยาลัยกรุงเทพ" /><option value="มหาวิทยาลัยหอการค้าไทย" />
                  <option value="มหาวิทยาลัยรังสิต" /><option value="มหาวิทยาลัยอัสสัมชัญ" />
                </datalist>
              )}
            </div>
            <div className="field">
              <label>ช่วงเวลา</label>
              <input
                value={e.period}
                onChange={ev => {
                  const digits = ev.target.value.replace(/\D/g, "").slice(0, 8);
                  const formatted = digits.length > 4
                    ? digits.slice(0, 4) + " – " + digits.slice(4)
                    : digits;
                  onChange(e.id, "period", formatted);
                }}
                placeholder="2020 – 2023"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="field">
            <label>{isEdu ? "รายละเอียดเพิ่มเติม" : "รายละเอียดงาน"}</label>
            <textarea
              rows={3}
              value={e.desc}
              onChange={ev => onChange(e.id, "desc", ev.target.value)}
              placeholder={isEdu ? "เช่น เกรดเฉลี่ย หรือรางวัล" : "อธิบายหน้าที่ความรับผิดชอบ"}
            />
          </div>
        </div>
      ))}
      <button className="btn-add" onClick={onAdd}>
        {isEdu ? "+ เพิ่มประวัติการศึกษา" : "+ เพิ่มประสบการณ์"}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   A4 RESUME CONTENT
───────────────────────────────────────────── */
function ResumeContent({ data, highlightField }) {
  const themeColor = data.themeColor || "#d4af37";

  const highlight = (field) =>
    highlightField === field
      ? { outline: `2px solid ${themeColor}`, outlineOffset: "2px", borderRadius: "3px", transition: "outline 0.2s" }
      : {};

  // ── CLASSIC TEMPLATE ──────────────────────────────────────────
  if (!data.template || data.template === "classic") {
    const tc = themeColor;

    return (
      <div
        className="resume-a4-sheet resume classic"
        style={{
          "--theme-color": tc,
          width: "210mm",
          minHeight: "297mm",
          backgroundColor: "#fff",
          color: "#1a1a1a",
          fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT SIDEBAR ── */}
        <div style={{
          width: "220px",
          flexShrink: 0,
          backgroundColor: tc,
          display: "flex",
          flexDirection: "column",
          minHeight: "297mm",
        }}>
          {/* Profile photo */}
          <div style={{ padding: "36px 24px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            {data.image ? (
              <div style={{
                width: "90px", height: "90px", borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.85)",
                overflow: "hidden", marginBottom: "14px", flexShrink: 0,
              }}>
                <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{
                width: "90px", height: "90px", borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.4)",
                backgroundColor: "rgba(0,0,0,0.15)",
                marginBottom: "14px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="40" height="40" viewBox="0 0 42 42" fill="none">
                  <circle cx="21" cy="16" r="9" fill="rgba(255,255,255,0.45)" />
                  <path d="M4 38c0-9.39 7.61-17 17-17s17 7.61 17 17" fill="rgba(255,255,255,0.45)" />
                </svg>
              </div>
            )}
            <h1 style={{
              margin: "0 0 5px", fontSize: "16px", fontWeight: "800",
              color: "#fff", lineHeight: 1.2, ...highlight("name"),
            }}>
              {data.name || "ชื่อ-นามสกุล"}
            </h1>
            <p style={{
              margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.82)",
              fontWeight: "500", letterSpacing: "1.2px", textTransform: "uppercase",
              ...highlight("title"),
            }}>
              {data.title || "ตำแหน่งงาน"}
            </p>
          </div>

          {/* Divider */}
          <div style={{ margin: "0 24px", height: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />

          {/* Contact */}
          <div style={{ padding: "18px 24px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "9px", fontWeight: "800", color: "rgba(255,255,255,0.55)", letterSpacing: "1.5px", textTransform: "uppercase" }}>ช่องทางติดต่อ</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {data.phone    && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: "7px", ...highlight("phone") }}>{ICON_PHONE_DARK}{data.phone}</span>}
              {data.email    && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: "7px", wordBreak: "break-all", ...highlight("email") }}>{ICON_MAIL_DARK}{data.email}</span>}
              {data.location && <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: "7px", ...highlight("location") }}>{ICON_PIN_DARK}{data.location}</span>}
              {data.linkedin && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: "7px", wordBreak: "break-all" }}>{ICON_LI_DARK}{data.linkedin}</span>}
              {data.website  && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: "7px", wordBreak: "break-all" }}>{ICON_WEB_DARK}{data.website}</span>}
            </div>
          </div>

          {/* Divider */}
          {data.skills.length > 0 && <div style={{ margin: "0 24px", height: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />}

          {/* Skills */}
          {data.skills.length > 0 && (
            <div style={{ padding: "18px 24px" }}>
              <p style={{ margin: "0 0 12px", fontSize: "9px", fontWeight: "800", color: "rgba(255,255,255,0.55)", letterSpacing: "1.5px", textTransform: "uppercase" }}>ทักษะ</p>
              <SkillsDisplay data={data} themeColor={tc} sidebar={true} />
            </div>
          )}

          {/* Education in sidebar */}
          {data.education.length > 0 && (
            <>
              <div style={{ margin: "0 24px", height: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />
              <div style={{ padding: "18px 24px" }}>
                <p style={{ margin: "0 0 12px", fontSize: "9px", fontWeight: "800", color: "rgba(255,255,255,0.55)", letterSpacing: "1.5px", textTransform: "uppercase" }}>การศึกษา</p>
                {data.education.map((edu, i) => (
                  <div key={edu.id} style={{ marginBottom: i === data.education.length - 1 ? 0 : "14px" }}>
                    {edu.degree && <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "10.5px", color: "#fff", lineHeight: 1.3 }}>{edu.degree}</p>}
                    {edu.school && <p style={{ margin: "0 0 2px", fontSize: "10px", color: "rgba(255,255,255,0.75)" }}>{edu.school}</p>}
                    {edu.period && <p style={{ margin: "0 0 2px", fontSize: "9.5px", color: "rgba(255,255,255,0.55)", fontWeight: "600" }}>{edu.period}</p>}
                    {edu.desc   && <p style={{ margin: 0, fontSize: "9.5px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>{edu.desc}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT MAIN CONTENT ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Top accent bar */}
          <div style={{ height: "6px", backgroundColor: tc, opacity: 0.15 }} />

          <div style={{ padding: "32px 36px 36px 32px", flex: 1 }}>
            {data.summary && (
              <ClassicSection title="เกี่ยวกับฉัน" tc={tc}>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.85", color: "#444", ...highlight("summary") }}>
                  {data.summary}
                </p>
              </ClassicSection>
            )}
            {data.experience.length > 0 && (
              <ClassicSection title="ประสบการณ์ทำงาน" tc={tc}>
                {data.experience.map((exp, i) => (
                  <ClassicItem
                    key={exp.id}
                    title={exp.role} subtitle={exp.org}
                    period={exp.period} desc={exp.desc}
                    tc={tc} isLast={i === data.experience.length - 1}
                  />
                ))}
              </ClassicSection>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── MODERN TEMPLATE ───────────────────────────────────────────
  if (data.template === "modern") {
    const tc = themeColor;

    return (
      <div
        className="resume-a4-sheet resume modern"
        style={{
          "--theme-color": tc,
          width: "210mm",
          minHeight: "297mm",
          backgroundColor: "#fff",
          color: "#222",
          fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          position: "relative",
          fontSize: "12px",
        }}
      >
        {/* ── LEFT SIDEBAR ── */}
        <div style={{
          width: "210px",
          flexShrink: 0,
          backgroundColor: "#1a1a2e",
          display: "flex",
          flexDirection: "column",
          minHeight: "297mm",
        }}>
          {/* Profile */}
          <div style={{ padding: "36px 20px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            {data.image ? (
              <div style={{
                width: "90px", height: "90px", borderRadius: "50%",
                border: `3px solid ${tc}`,
                overflow: "hidden", marginBottom: "14px",
              }}>
                <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{
                width: "90px", height: "90px", borderRadius: "50%",
                border: `3px solid ${tc}`,
                backgroundColor: "rgba(255,255,255,0.06)",
                marginBottom: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="40" height="40" viewBox="0 0 42 42" fill="none">
                  <circle cx="21" cy="16" r="9" fill="rgba(255,255,255,0.3)" />
                  <path d="M4 38c0-9.39 7.61-17 17-17s17 7.61 17 17" fill="rgba(255,255,255,0.3)" />
                </svg>
              </div>
            )}
            <h1 style={{
              margin: "0 0 5px", fontSize: "15px", fontWeight: "800",
              color: "#fff", lineHeight: 1.25, ...highlight("name"),
            }}>
              {data.name || "ชื่อ-นามสกุล"}
            </h1>
            <p style={{
              margin: 0, fontSize: "9.5px", color: tc,
              fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase",
              ...highlight("title"),
            }}>
              {data.title || "ตำแหน่งงาน"}
            </p>
          </div>

          {/* Accent line */}
          <div style={{ margin: "0 20px", height: "2px", backgroundColor: tc, borderRadius: "1px", opacity: 0.6 }} />

          {/* Contact */}
          <div style={{ padding: "18px 20px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "8.5px", fontWeight: "800", color: tc, letterSpacing: "1.5px", textTransform: "uppercase" }}>ติดต่อ</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {data.phone    && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "7px", ...highlight("phone") }}>{ICON_PHONE_DARK}{data.phone}</span>}
              {data.email    && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "7px", wordBreak: "break-all", ...highlight("email") }}>{ICON_MAIL_DARK}{data.email}</span>}
              {data.location && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "7px", ...highlight("location") }}>{ICON_PIN_DARK}{data.location}</span>}
              {data.linkedin && <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: "7px", wordBreak: "break-all" }}>{ICON_LI_DARK}{data.linkedin}</span>}
              {data.website  && <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: "7px", wordBreak: "break-all" }}>{ICON_WEB_DARK}{data.website}</span>}
            </div>
          </div>

          {/* Skills */}
          {data.skills.length > 0 && (
            <>
              <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
              <div style={{ padding: "18px 20px" }}>
                <p style={{ margin: "0 0 12px", fontSize: "8.5px", fontWeight: "800", color: tc, letterSpacing: "1.5px", textTransform: "uppercase" }}>ทักษะ</p>
                <SkillsDisplay data={data} themeColor={tc} sidebar={true} />
              </div>
            </>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <>
              <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
              <div style={{ padding: "18px 20px" }}>
                <p style={{ margin: "0 0 12px", fontSize: "8.5px", fontWeight: "800", color: tc, letterSpacing: "1.5px", textTransform: "uppercase" }}>การศึกษา</p>
                {data.education.map((edu, i) => (
                  <div key={edu.id} style={{ marginBottom: i === data.education.length - 1 ? 0 : "14px" }}>
                    {edu.degree && <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "10.5px", color: "#fff", lineHeight: 1.3 }}>{edu.degree}</p>}
                    {edu.school && <p style={{ margin: "0 0 2px", fontSize: "10px", color: "rgba(255,255,255,0.65)" }}>{edu.school}</p>}
                    {edu.period && <p style={{ margin: "0 0 2px", fontSize: "9.5px", color: tc, fontWeight: "600" }}>{edu.period}</p>}
                    {edu.desc   && <p style={{ margin: 0, fontSize: "9.5px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>{edu.desc}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT MAIN CONTENT ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Top accent bar */}
          <div style={{ height: "5px", backgroundColor: tc }} />

          <div style={{ padding: "28px 36px 36px 30px", flex: 1 }}>
            {data.summary && (
              <ModernSection title="ข้อมูลโดยย่อ" tc={tc}>
                <p style={{ margin: 0, fontSize: "11.5px", lineHeight: "1.85", color: "#444", ...highlight("summary") }}>
                  {data.summary}
                </p>
              </ModernSection>
            )}
            {data.experience.length > 0 && (
              <ModernSection title="ประสบการณ์การทำงาน" tc={tc}>
                {data.experience.map((exp, i) => (
                  <div key={exp.id} style={{ marginBottom: i === data.experience.length - 1 ? 0 : "18px", paddingBottom: i === data.experience.length - 1 ? 0 : "18px", borderBottom: i === data.experience.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3px" }}>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "12.5px", color: "#111" }}>{exp.role || "—"}</p>
                      {exp.period && <span style={{ fontSize: "10px", color: tc, fontWeight: "700", backgroundColor: `${tc}15`, padding: "2px 8px", borderRadius: "10px", whiteSpace: "nowrap", flexShrink: 0, marginLeft: "8px" }}>{exp.period}</span>}
                    </div>
                    {exp.org  && <p style={{ margin: "0 0 5px", fontSize: "11px", color: "#666", fontStyle: "italic" }}>{exp.org}</p>}
                    {exp.desc && <p style={{ margin: 0, fontSize: "11px", color: "#555", lineHeight: "1.75" }}>{exp.desc}</p>}
                  </div>
                ))}
              </ModernSection>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── PROFESSIONAL / FALLBACK TEMPLATE ─────────────────────────
  return (
    <div
      className={`resume-a4-sheet resume ${data.template}`}
      style={{
        "--theme-color": themeColor,
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "#fff",
        color: "#1a1a1a",
        fontFamily: "'Georgia', serif",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "row",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── LEFT SIDEBAR ── */}
      <div style={{
        width: "215px",
        flexShrink: 0,
        backgroundColor: "#2c2c3e",
        display: "flex",
        flexDirection: "column",
        minHeight: "297mm",
      }}>
        {/* Profile */}
        <div style={{
          backgroundColor: themeColor,
          padding: "36px 20px 28px",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        }}>
          {data.image && (
            <div style={{
              width: "90px", height: "90px", borderRadius: "50%",
              border: "4px solid rgba(255,255,255,0.9)",
              overflow: "hidden", marginBottom: "14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            }}>
              <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <h1 style={{
            margin: "0 0 6px", fontSize: "16px", fontWeight: "700",
            color: "#fff", letterSpacing: "0.3px",
            textShadow: "0 1px 3px rgba(0,0,0,0.2)",
            ...highlight("name"),
          }}>
            {data.name || "ชื่อ-นามสกุล"}
          </h1>
          <p style={{
            margin: 0, fontSize: "10px",
            color: "rgba(255,255,255,0.88)", fontStyle: "italic",
            ...highlight("title"),
          }}>
            {data.title || "ตำแหน่งงาน"}
          </p>
        </div>

        {/* Contact */}
        <div style={{ padding: "20px 20px 16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "8.5px", fontWeight: "700", color: themeColor, letterSpacing: "1.5px", textTransform: "uppercase" }}>ข้อมูลติดต่อ</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {data.email    && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "7px", wordBreak: "break-all", ...highlight("email") }}>{ICON_MAIL_DARK}{data.email}</span>}
            {data.phone    && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "7px", ...highlight("phone") }}>{ICON_PHONE_DARK}{data.phone}</span>}
            {data.location && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "7px", ...highlight("location") }}>{ICON_PIN_DARK}{data.location}</span>}
            {data.linkedin && <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: "7px", wordBreak: "break-all" }}>{ICON_LI_DARK}{data.linkedin}</span>}
            {data.website  && <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: "7px", wordBreak: "break-all" }}>{ICON_WEB_DARK}{data.website}</span>}
          </div>
        </div>

        {/* Skills */}
        {data.skills.length > 0 && (
          <>
            <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
            <div style={{ padding: "16px 20px" }}>
              <p style={{ margin: "0 0 12px", fontSize: "8.5px", fontWeight: "700", color: themeColor, letterSpacing: "1.5px", textTransform: "uppercase" }}>ทักษะความชำนาญ</p>
              <SkillsDisplay data={data} themeColor={themeColor} sidebar={true} />
            </div>
          </>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <>
            <div style={{ margin: "0 20px", height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
            <div style={{ padding: "16px 20px" }}>
              <p style={{ margin: "0 0 12px", fontSize: "8.5px", fontWeight: "700", color: themeColor, letterSpacing: "1.5px", textTransform: "uppercase" }}>การศึกษา</p>
              {data.education.map((edu, i) => (
                <div key={edu.id} style={{ marginBottom: i === data.education.length - 1 ? 0 : "14px" }}>
                  {edu.degree && <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "10.5px", color: "#fff", lineHeight: 1.3 }}>{edu.degree}</p>}
                  {edu.school && <p style={{ margin: "0 0 2px", fontSize: "10px", color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>{edu.school}</p>}
                  {edu.period && <p style={{ margin: "0 0 2px", fontSize: "9.5px", color: themeColor, fontWeight: "600" }}>{edu.period}</p>}
                  {edu.desc   && <p style={{ margin: 0, fontSize: "9.5px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>{edu.desc}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Accent top bar */}
        <div style={{ height: "5px", backgroundColor: themeColor, transition: "background-color 0.3s" }} />

        <div style={{ padding: "30px 36px 36px 30px", flex: 1 }}>
          {data.summary && (
            <Section title="เกี่ยวกับฉัน" color={themeColor}>
              <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.75", color: "#444", ...highlight("summary") }}>{data.summary}</p>
            </Section>
          )}
          {data.experience.length > 0 && (
            <Section title="ประสบการณ์ทำงาน" color={themeColor}>
              {data.experience.map((exp, i) => (
                <TimelineItem key={exp.id} title={exp.role} subtitle={exp.org} period={exp.period} desc={exp.desc} color={themeColor} isLast={i === data.experience.length - 1} />
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modern template helpers ──────────────────────────────────── */
function ModernSection({ title, tc, children }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{
        display: "inline-block",
        border: `1.5px solid ${tc}`,
        borderRadius: "20px",
        padding: "4px 16px",
        marginBottom: "12px",
      }}>
        <span style={{ fontSize: "11px", fontWeight: "700", color: tc, whiteSpace: "nowrap" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function ModernBadge({ label }) {
  return (
    <div style={{
      border: "1.5px solid rgba(255,255,255,0.7)",
      borderRadius: "20px",
      padding: "3px 14px",
      display: "inline-block",
    }}>
      <span style={{ fontSize: "11px", fontWeight: "700", color: "#fff" }}>{label}</span>
    </div>
  );
}

/* ── SVG icon constants ───────────────────────────────────────── */
const ICON_MAIL  = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M0 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V4zm2-1a1 1 0 00-1 1v.217l7 4.2 7-4.2V4a1 1 0 00-1-1H2zm13 2.383l-4.758 2.855L15 11.114V5.383zm-.034 6.876l-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 002 13h12a1 1 0 00.966-.741zM1 11.114l4.758-2.876L1 5.383v5.731z"/></svg>;
const ICON_PHONE = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M3.654 1.328a.678.678 0 00-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 004.168 6.608 17.6 17.6 0 006.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 00-.063-1.015l-2.307-1.794a.678.678 0 00-.58-.122l-2.19.547a1.745 1.745 0 01-1.657-.459L5.482 9.5a1.745 1.745 0 01-.46-1.657l.548-2.19a.678.678 0 00-.122-.58L3.654 1.328z"/></svg>;
const ICON_PIN   = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M8 16s6-5.686 6-10A6 6 0 002 6c0 4.314 6 10 6 10zm0-7a3 3 0 110-6 3 3 0 010 6z"/></svg>;
const ICON_LI    = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>;
const ICON_WEB   = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.8)"><path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 005.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 01.64-1.539 6.7 6.7 0 01.597-.933A7.025 7.025 0 001.97 4h2.12zm-.24 1.5a12.97 12.97 0 00-.087 1.5c0 .527.033 1.023.087 1.5h2.763a14.37 14.37 0 01-.085-1.5c0-.528.033-1.025.085-1.5H3.85zm1.166 4H3.054a7.025 7.025 0 003.86 2.472 6.676 6.676 0 01-.597-.933A9.267 9.267 0 015.016 10zm.133 1.539c.552 1.035 1.218 1.65 1.887 1.855V11.5H5.145a7.97 7.97 0 01-.996-1.461zM8.5 1.077V4h2.354a7.97 7.97 0 00-.367-1.068C9.835 1.897 9.17 1.28 8.5 1.077zM10.91 4a9.267 9.267 0 00-.64-1.539 6.676 6.676 0 00-.597-.933A7.025 7.025 0 0114.03 4h-3.12zm.24 1.5h-2.763a14.37 14.37 0 01.085 1.5c0 .528-.033 1.025-.085 1.5H14.15a12.97 12.97 0 00.087-1.5c0-.527-.033-1.023-.087-1.5zm-1.166 4H12a7.025 7.025 0 01-3.86 2.472 6.7 6.7 0 00.597-.933A9.267 9.267 0 0110.984 10zm-.133 1.539A7.97 7.97 0 0110.855 11H8.5v2.923c.67-.204 1.335-.82 1.887-1.855a7.97 7.97 0 00.464-.529z"/></svg>;

// Icons for dark sidebar backgrounds (same fill, kept separate for clarity)
const ICON_MAIL_DARK  = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.7)"><path d="M0 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V4zm2-1a1 1 0 00-1 1v.217l7 4.2 7-4.2V4a1 1 0 00-1-1H2zm13 2.383l-4.758 2.855L15 11.114V5.383zm-.034 6.876l-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 002 13h12a1 1 0 00.966-.741zM1 11.114l4.758-2.876L1 5.383v5.731z"/></svg>;
const ICON_PHONE_DARK = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.7)"><path d="M3.654 1.328a.678.678 0 00-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 004.168 6.608 17.6 17.6 0 006.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 00-.063-1.015l-2.307-1.794a.678.678 0 00-.58-.122l-2.19.547a1.745 1.745 0 01-1.657-.459L5.482 9.5a1.745 1.745 0 01-.46-1.657l.548-2.19a.678.678 0 00-.122-.58L3.654 1.328z"/></svg>;
const ICON_PIN_DARK   = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.7)"><path d="M8 16s6-5.686 6-10A6 6 0 002 6c0 4.314 6 10 6 10zm0-7a3 3 0 110-6 3 3 0 010 6z"/></svg>;
const ICON_LI_DARK    = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.7)"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>;
const ICON_WEB_DARK   = <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.7)"><path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 005.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 01.64-1.539 6.7 6.7 0 01.597-.933A7.025 7.025 0 001.97 4h2.12zm-.24 1.5a12.97 12.97 0 00-.087 1.5c0 .527.033 1.023.087 1.5h2.763a14.37 14.37 0 01-.085-1.5c0-.528.033-1.025.085-1.5H3.85zm1.166 4H3.054a7.025 7.025 0 003.86 2.472 6.676 6.676 0 01-.597-.933A9.267 9.267 0 015.016 10zm.133 1.539c.552 1.035 1.218 1.65 1.887 1.855V11.5H5.145a7.97 7.97 0 01-.996-1.461zM8.5 1.077V4h2.354a7.97 7.97 0 00-.367-1.068C9.835 1.897 9.17 1.28 8.5 1.077zM10.91 4a9.267 9.267 0 00-.64-1.539 6.676 6.676 0 00-.597-.933A7.025 7.025 0 0114.03 4h-3.12zm.24 1.5h-2.763a14.37 14.37 0 01.085 1.5c0 .528-.033 1.025-.085 1.5H14.15a12.97 12.97 0 00.087-1.5c0-.527-.033-1.023-.087-1.5zm-1.166 4H12a7.025 7.025 0 01-3.86 2.472 6.7 6.7 0 00.597-.933A9.267 9.267 0 0110.984 10zm-.133 1.539A7.97 7.97 0 0110.855 11H8.5v2.923c.67-.204 1.335-.82 1.887-1.855a7.97 7.97 0 00.464-.529z"/></svg>;

function ChipRow({ icon, text, hl = {} }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(255,255,255,0.85)", ...hl }}>
      {icon}{text}
    </span>
  );
}

function ClassicSection({ title, tc, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "13px" }}>
        <div style={{ width: "3px", height: "15px", backgroundColor: tc, borderRadius: "2px", flexShrink: 0 }} />
        <h2 style={{ margin: 0, fontSize: "10.5px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "1.4px", textTransform: "uppercase" }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e4e4e4" }} />
      </div>
      {children}
    </div>
  );
}

function ClassicItem({ title, subtitle, period, desc, tc, isLast }) {
  return (
    <div style={{ display: "flex", gap: "13px", marginBottom: isLast ? 0 : "17px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "4px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: tc, flexShrink: 0 }} />
        {!isLast && <div style={{ width: "1px", flex: 1, backgroundColor: "#e0e0e0", marginTop: "4px" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#111", lineHeight: 1.3 }}>{title || "—"}</span>
          {period && <span style={{ fontSize: "11px", color: "#888", whiteSpace: "nowrap", flexShrink: 0 }}>{period}</span>}
        </div>
        {subtitle && <p style={{ margin: "0 0 5px", fontSize: "12px", color: "#555", fontWeight: "500" }}>{subtitle}</p>}
        {desc && <p style={{ margin: 0, fontSize: "11.5px", color: "#666", lineHeight: "1.7" }}>{desc}</p>}
      </div>
    </div>
  );
}

/* ── Pro helpers (Professional / fallback template) ───────────── */
function ContactChip({ icon, text, hl = {} }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "rgba(255,255,255,0.9)", ...hl }}>
      <span style={{ fontSize: "11px" }}>{icon}</span> {text}
    </span>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: "26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: "4px", height: "18px", backgroundColor: color, borderRadius: "2px", transition: "background-color 0.3s" }} />
        <h2 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "1.2px", textTransform: "uppercase" }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }} />
      </div>
      {children}
    </div>
  );
}

function TimelineItem({ title, subtitle, period, desc, color, isLast }) {
  return (
    <div style={{ display: "flex", gap: "14px", marginBottom: isLast ? 0 : "18px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: color, marginTop: "4px", flexShrink: 0, transition: "background-color 0.3s" }} />
        {!isLast && <div style={{ width: "1px", flex: 1, backgroundColor: "#e0e0e0", marginTop: "4px" }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#1a1a1a" }}>{title || "—"}</span>
          {period && (
            <span style={{ fontSize: "11px", color: color, fontWeight: "600", whiteSpace: "nowrap", marginLeft: "8px", transition: "color 0.3s" }}>{period}</span>
          )}
        </div>
        {subtitle && <p style={{ margin: "0 0 5px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>{subtitle}</p>}
        {desc && <p style={{ margin: 0, fontSize: "12px", color: "#555", lineHeight: "1.6" }}>{desc}</p>}
      </div>
    </div>
  );
}

function SkillsDisplay({ data, themeColor, sidebar = false }) {
  const { skillDisplayMode, skills } = data;

  const textColor = sidebar ? "#ccc" : "#333";
  const tagBg = sidebar ? "rgba(255,255,255,0.1)" : `${themeColor}18`;
  const trackBg = sidebar ? "rgba(255,255,255,0.15)" : "#e8e8e8";

  if (skillDisplayMode === "simple") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {skills.map(s => (
          <span key={s.id} style={{
            fontSize: "10.5px", padding: "3px 9px", borderRadius: "12px",
            backgroundColor: sidebar ? "rgba(255,255,255,0.1)" : `${themeColor}14`,
            border: `1px solid ${sidebar ? "rgba(255,255,255,0.2)" : themeColor + "40"}`,
            color: sidebar ? "rgba(255,255,255,0.82)" : "#2a2a2a",
            fontWeight: "500", letterSpacing: "0.2px",
          }}>
            {s.name}
          </span>
        ))}
      </div>
    );
  }

  if (skillDisplayMode === "category") {
    const hard = skills.filter(s => s.type === "Hard Skill");
    const soft = skills.filter(s => s.type === "Soft Skill");
    return (
      <div style={{ fontSize: "12px" }}>
        {hard.length > 0 && (
          <>
            <p style={{ margin: "0 0 4px", fontWeight: "700", color: themeColor, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Hard Skills</p>
            <p style={{ margin: "0 0 12px", color: textColor, lineHeight: "1.6" }}>{hard.map(s => s.name).join(" · ")}</p>
          </>
        )}
        {soft.length > 0 && (
          <>
            <p style={{ margin: "0 0 4px", fontWeight: "700", color: themeColor, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Soft Skills</p>
            <p style={{ margin: 0, color: textColor, lineHeight: "1.6" }}>{soft.map(s => s.name).join(" · ")}</p>
          </>
        )}
      </div>
    );
  }

  if (skillDisplayMode === "level-text") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {skills.filter(s => s.type === "Hard Skill").map(s => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: textColor }}>• {s.name}</span>
            <span style={{ fontSize: "10px", color: themeColor, fontWeight: "700", padding: "2px 7px", borderRadius: "10px", backgroundColor: tagBg }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (skillDisplayMode === "level-bar") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {skills.filter(s => s.type === "Hard Skill").map(s => (
          <div key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11.5px", color: textColor, fontWeight: "500" }}>{s.name}</span>
              <span style={{ fontSize: "10px", color: themeColor, fontWeight: "700" }}>{s.level}%</span>
            </div>
            <div style={{ height: "4px", backgroundColor: trackBg, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.level}%`, backgroundColor: themeColor, borderRadius: "3px" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────
   A4 PREVIEW MODAL
───────────────────────────────────────────── */
function A4PreviewModal({ data, onClose }) {
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    const updateScale = () => {
      const availW = window.innerWidth - 80;
      const a4w = 794;
      setScale(Math.min(0.9, availW / a4w));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handlePrint = () => {
    const printContent = document.getElementById("a4-print-target").innerHTML;
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${data.name || "Resume"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Georgia&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; }
            @page { size: A4; margin: 0; }
            @media print {
              html, body { width: 210mm; height: 297mm; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    win.document.close();
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column", alignItems: "center",
        backgroundColor: "rgba(10,10,10,0.88)", overflowY: "auto",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

      {/* TOP BAR */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 24px",
        backgroundColor: "rgba(15,15,15,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(4px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: data.themeColor || "#d4af37",
            boxShadow: `0 0 8px ${data.themeColor || "#d4af37"}`,
          }} />
          <div>
            <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600", margin: 0 }}>
              {data.name || "Resume Preview"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "2px 0 0" }}>
              ตัวอย่าง A4 · กด ESC หรือคลิกพื้นหลังเพื่อปิด
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginRight: "4px" }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handlePrint}
            style={{
              padding: "9px 20px", borderRadius: "8px", border: "none",
              background: `linear-gradient(135deg, ${data.themeColor || "#d4af37"}, ${data.themeColor || "#d4af37"}cc)`,
              color: "#1a1a1a", fontWeight: "700", fontSize: "13px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              boxShadow: `0 4px 16px ${data.themeColor || "#d4af37"}44`,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
          >
            🖨️ Print / Save PDF
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px", borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.75)", fontWeight: "500", fontSize: "13px", cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >
            ✕ ปิด
          </button>
        </div>
      </div>

      {/* A4 SHEET */}
      <div style={{ padding: "32px 24px 48px", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={{
          transform: `scale(${scale})`, transformOrigin: "top center",
          marginBottom: `calc((297mm * ${scale}) - 297mm + 32px)`,
          animation: "slideUp 0.25s ease",
        }}>
          <div id="a4-print-target" style={{
            width: "210mm", minHeight: "297mm", backgroundColor: "#fff",
            boxShadow: "0 12px 60px rgba(0,0,0,0.6), 0 2px 12px rgba(0,0,0,0.4)",
            borderRadius: "2px", overflow: "hidden",
          }}>
            <ResumeContent data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SPLIT-SCREEN LIVE PREVIEW PANEL
───────────────────────────────────────────── */
function LivePreviewPanel({ data, onOpenA4 }) {
  const [previewScale, setPreviewScale] = useState(0.55);
  const [manualScale, setManualScale] = useState(null);
  const containerRef = useRef();

  useEffect(() => {
    if (manualScale !== null) return;
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const a4w = 794;
      const autoScale = Math.max(0.3, Math.min(0.75, (w - 48) / a4w));
      setPreviewScale(autoScale);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [manualScale]);

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setManualScale(val);
    setPreviewScale(val);
  };

  const handleResetAuto = () => setManualScale(null);
  const a4HeightPx = 1123;

  return (
    <div ref={containerRef} style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      backgroundColor: "#1a1a1e", overflowY: "auto", position: "relative",
    }}>
      {/* Preview toolbar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 5, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px",
        backgroundColor: "rgba(20,20,26,0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(4px)", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            backgroundColor: "#22c55e", boxShadow: "0 0 6px #22c55e",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
            LIVE PREVIEW
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <button
            onClick={() => handleSliderChange({ target: { value: Math.max(0.25, previewScale - 0.05) } })}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "14px", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
          >−</button>
          <input
            type="range" min="0.25" max="0.90" step="0.05" value={previewScale}
            onChange={handleSliderChange}
            style={{ flex: 1, height: "3px", accentColor: "#d4af37", cursor: "pointer", minWidth: 0 }}
          />
          <button
            onClick={() => handleSliderChange({ target: { value: Math.min(0.90, previewScale + 0.05) } })}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "14px", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
          >+</button>
          <span style={{ fontSize: "11px", color: "#d4af37", fontWeight: "700", minWidth: "34px", textAlign: "right", flexShrink: 0 }}>
            {Math.round(previewScale * 100)}%
          </span>
          {manualScale !== null && (
            <button onClick={handleResetAuto} title="รีเซ็ตเป็นอัตโนมัติ"
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "10px", flexShrink: 0, padding: "0 2px" }}
            >auto</button>
          )}
        </div>

        <button onClick={onOpenA4} style={{
          fontSize: "11px", padding: "5px 10px", borderRadius: "6px",
          border: "1px solid rgba(212,175,55,0.3)",
          background: "rgba(212,175,55,0.08)", color: "#d4af37",
          cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap", flexShrink: 0,
        }}>
          📄 A4 เต็มหน้า
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        input[type=range]::-webkit-slider-thumb { width: 14px; height: 14px; }
      `}</style>

      {/* Scaled A4 */}
      <div style={{ padding: "16px 16px 40px", width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{
          transform: `scale(${previewScale})`, transformOrigin: "top center",
          height: `${a4HeightPx * previewScale}px`, position: "relative", width: "794px",
        }}>
          <div style={{
            width: "210mm", minHeight: "297mm",
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)", borderRadius: "2px", overflow: "hidden",
          }}>
            <ResumeContent data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ResumeBuilder() {
  const [data, setData] = useState(defaultData);
  const [tab, setTab] = useState("info");
  const [newSkill, setNewSkill] = useState("");
  const [savedToast, setSavedToast] = useState(false);
  const [showA4Preview, setShowA4Preview] = useState(false);
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  const updateEntry = (section, id, field, val) =>
    set(section, data[section].map(e => e.id === id ? { ...e, [field]: val } : e));

  const addEntry = (section) =>
    set(section, [...data[section], { id: Date.now(), role: "", org: "", period: "", desc: "" }]);

  const removeEntry = (section, id) =>
    set(section, data[section].filter(e => e.id !== id));

  const filteredSkills = data.skills.filter(skill => {
    switch (data.skillDisplayMode) {
      case "category": return skill.type === "Hard Skill" || skill.type === "Soft Skill";
      case "level-text":
      case "level-bar": return skill.type === "Hard Skill";
      default: return true;
    }
  });

  const handleAddSkillDetailed = () => {
    const type = document.getElementById("skillType")?.value || "Hard Skill";
    const levelSelect = document.getElementById("skillLevel")?.value || "80|ดีมาก";
    const [lv, lb] = levelSelect.split("|");
    if (newSkill.trim()) {
      set("skills", [...data.skills, { id: Date.now(), name: newSkill.trim(), type, level: parseInt(lv), label: lb }]);
      setNewSkill("");
    }
  };

  const removeSkill = (id) => set("skills", data.skills.filter(x => x.id !== id));

  const handleSavePrivate = async () => {
    try {
      setSavedToast(true);
      const payload = {
        title: data.name + " - Resume",
        template: data.template,
        themeColor: data.themeColor || "#d4af37",
        image_url: data.image,  // ส่งเป็น image_url ให้ backend บันทึกลง DB
        visibility: "private",
        // ข้อมูลส่วนตัว
        name: data.name,
        jobTitle: data.title,
        email: data.email,
        phone: data.phone,
        location: data.location,
        linkedin: data.linkedin,
        website: data.website,
        // เนื้อหา Resume
        summary: data.summary,
        experience: data.experience.map((exp) => ({
          role: exp.role,
          org: exp.org,
          period: exp.period,
          desc: exp.desc,
        })),
        education: data.education.map((edu) => ({
          degree: edu.degree,
          school: edu.school,
          period: edu.period,
          desc: edu.desc,
        })),
        skills: {
          displayMode: data.skillDisplayMode,
          list: data.skills,
        },
      };

      const response = await axios.post("http://localhost:3000/resumes", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.status === 201) {
        setTimeout(() => { setSavedToast(false); navigate("/profile"); }, 1200);
      }
    } catch (error) {
      console.error("Save Error:", error);
      setSavedToast(false);
      alert("บันทึกไม่สำเร็จ");
    }
  };

  const handlePublish = async () => {
    try {
      const payload = {
        title: data.name ? data.name + " - Resume" : "My Resume",
        template: data.template,
        themeColor: data.themeColor || "#d4af37",
        image_url: data.image,
        visibility: "public",
        name: data.name,
        jobTitle: data.title,
        email: data.email,
        phone: data.phone,
        location: data.location,
        linkedin: data.linkedin,
        website: data.website,
        summary: data.summary,
        experience: data.experience.map((exp) => ({
          role: exp.role,
          org: exp.org,
          period: exp.period,
          desc: exp.desc,
        })),
        education: data.education.map((edu) => ({
          degree: edu.degree,
          school: edu.school,
          period: edu.period,
          desc: edu.desc,
        })),
        skills: {
          displayMode: data.skillDisplayMode,
          list: data.skills,
        },
      };

      const response = await axios.post("http://localhost:3000/resumes", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.status === 201) {
        alert("✅ โพสต์ Resume สาธารณะสำเร็จ!");
        navigate("/feed");
      }
    } catch (error) {
      console.error("Publish Error:", error);
      alert("โพสต์ไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const tabs = [
    { id: "template", label: "เทมเพลต" },
    { id: "info", label: "ข้อมูล" },
    { id: "exp", label: "ประสบการณ์" },
    { id: "edu", label: "การศึกษา" },
    { id: "skills", label: "ทักษะ" },
  ];

  return (
    <>
      {savedToast && <div className="toast-notification">✓ บันทึก Resume แล้ว! กำลังไปหน้า Profile...</div>}
      {showA4Preview && <A4PreviewModal data={data} onClose={() => setShowA4Preview(false)} />}

      <div className="app" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="back-link" onClick={() => navigate("/feed")}>← กลับไปหน้า Feed</button>
            <div className="logo">Resume<span>craft</span></div>
          </div>

          <div className="sidebar-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="sidebar-body">

            {/* ── TAB: TEMPLATE ── */}
            {tab === "template" && (
              <>
                <div className="section-label">1. เลือกรูปแบบ Resume</div>
                <div className="template-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "25px" }}>
                  {[
                    { id: "classic", icon: "📜", label: "Classic" },
                    { id: "modern", icon: "📱", label: "Modern" },
                    { id: "professional", icon: "💼", label: "Professional" },
                  ].map(t => (
                    <div key={t.id} className={`template-card ${data.template === t.id ? "active" : ""}`} onClick={() => set("template", t.id)}>
                      <div className="tm-icon">{t.icon}</div>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>

                <div className="section-label">2. เลือกโทนสีที่ต้องการ</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                  {[
                    { name: "Gold",    code: "#d4af37" },
                    { name: "Navy",    code: "#1e3a8a" },
                    { name: "Blue",    code: "#0044cc" },
                    { name: "Sky",     code: "#0ea5e9" },
                    { name: "Green",   code: "#10b981" },
                    { name: "Emerald", code: "#059669" },
                    { name: "Rose",    code: "#e11d48" },
                    { name: "Violet",  code: "#7c3aed" },
                    { name: "Orange",  code: "#ea580c" },
                    { name: "Dark",    code: "#1f2937" },
                  ].map(color => (
                    <button
                      key={color.code}
                      onClick={() => set("themeColor", color.code)}
                      title={color.name}
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        backgroundColor: color.code,
                        border: data.themeColor === color.code ? "3px solid #fff" : "2px solid transparent",
                        outline: data.themeColor === color.code ? `2px solid ${color.code}` : "none",
                        cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                        transition: "transform 0.15s",
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>กำหนดเอง:</label>
                  <input
                    type="color"
                    value={data.themeColor || "#d4af37"}
                    onChange={e => set("themeColor", e.target.value)}
                    style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", cursor: "pointer", padding: 0 }}
                  />
                  <span style={{ fontSize: "11px", color: "#6b7280", fontFamily: "monospace" }}>
                    {data.themeColor || "#d4af37"}
                  </span>
                </div>
              </>
            )}

            {/* ── TAB: INFO ── */}
            {tab === "info" && (
              <>
                <div className="section-label">รูปถ่ายโปรไฟล์</div>
                <div className="image-upload-wrapper" style={{ marginBottom: "20px", textAlign: "center" }}>
                  <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "#222", margin: "0 auto 10px", overflow: "hidden", border: "2px dashed #444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {data.image ? (
                      <img src={data.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ color: "#666", fontSize: "12px" }}>ไม่มีรูป</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" id="profile-upload" style={{ display: "none" }}
                    onChange={async e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        const res = await fetch("http://localhost:3000/files/upload", {
                          method: "POST",
                          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                          body: formData,
                        });
                        const result = await res.json();
                        if (res.ok) {
                          set("image", result.url);
                        } else {
                          alert("อัพโหลดรูปไม่สำเร็จ: " + result.message);
                        }
                      } catch (err) {
                        alert("เกิดข้อผิดพลาดในการอัพโหลดรูป");
                      }
                    }}
                  />
                  <label htmlFor="profile-upload" className="btn-add" style={{ display: "inline-block", width: "auto", padding: "8px 16px", cursor: "pointer" }}>
                    📸 เลือกรูปถ่าย
                  </label>
                  {data.image && (
                    <button onClick={() => set("image", null)} style={{ background: "none", border: "none", color: "#e05555", fontSize: "12px", marginLeft: "10px", cursor: "pointer" }}>
                      ลบรูป
                    </button>
                  )}
                </div>

                <div className="section-label">ข้อมูลส่วนตัว</div>
                <div className="field">
                  <label>ชื่อ-นามสกุล</label>
                  <input value={data.name} onChange={e => set("name", e.target.value)} placeholder="ชื่อเต็มของคุณ" />
                </div>
                <div className="field">
                  <label>ตำแหน่ง / สาขาอาชีพ</label>
                  <input value={data.title} onChange={e => set("title", e.target.value)} placeholder="เช่น Software Engineer" />
                </div>

                <div className="section-label">ช่องทางติดต่อ</div>
                <div className="row">
                  {/* Email with validation */}
                  <div className="field">
                    <label>อีเมล</label>
                    <input
                      value={data.email}
                      onChange={e => { set("email", e.target.value); if (emailError) setEmailError(""); }}
                      onBlur={e => {
                        const v = e.target.value.trim();
                        if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
                          setEmailError("รูปแบบอีเมลไม่ถูกต้อง เช่น example@email.com");
                        else setEmailError("");
                      }}
                      placeholder="example@email.com"
                      style={emailError ? { borderColor: "#ef4444" } : {}}
                    />
                    {emailError && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#ef4444" }}>{emailError}</p>}
                  </div>
                  {/* Phone with auto-format */}
                  <div className="field">
                    <label>เบอร์โทรศัพท์</label>
                    <input
                      value={data.phone}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 0 && v[0] !== "0") v = "0" + v.slice(0, 9);
                        if (v.length > 10) v = v.slice(0, 10);
                        set("phone", v);
                      }}
                      placeholder="08XXXXXXXX"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="row">
                  {/* Location with datalist */}
                  <div className="field">
                    <label>ที่อยู่</label>
                    <input
                      list="location-list"
                      value={data.location}
                      onChange={e => set("location", e.target.value)}
                      placeholder="กรุงเทพฯ, ประเทศไทย"
                    />
                    <datalist id="location-list">
                      <option value="กรุงเทพมหานคร" /><option value="กรุงเทพฯ, ประเทศไทย" />
                      <option value="เชียงใหม่" /><option value="เชียงราย" /><option value="ขอนแก่น" />
                      <option value="นครราชสีมา" /><option value="อุดรธานี" /><option value="สงขลา" />
                      <option value="ภูเก็ต" /><option value="ชลบุรี" /><option value="ระยอง" />
                      <option value="นนทบุรี" /><option value="ปทุมธานี" /><option value="สมุทรปราการ" />
                      <option value="นครปฐม" /><option value="Bangkok, Thailand" /><option value="Chiang Mai, Thailand" />
                    </datalist>
                  </div>
                  <div className="field">
                    <label>LinkedIn</label>
                    <input
                      value={data.linkedin}
                      onChange={e => set("linkedin", e.target.value)}
                      onBlur={e => {
                        let v = e.target.value.trim();
                        if (!v) return;
                        // ตัด protocol ออก
                        v = v.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
                        // ถ้ายังไม่มี linkedin.com/ นำหน้าเลย → เติมให้
                        if (!v.startsWith("linkedin.com/")) {
                          // มี in/ นำหน้า → เติมแค่ domain
                          if (v.startsWith("in/")) v = "linkedin.com/" + v;
                          // แค่ username ล้วน → เติมทั้งหมด
                          else v = "linkedin.com/in/" + v;
                        }
                        // ตัด trailing slash
                        v = v.replace(/\/$/, "");
                        set("linkedin", v);
                      }}
                      placeholder="yourname หรือ linkedin.com/in/yourname"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>เว็บไซต์</label>
                  <input value={data.website} onChange={e => set("website", e.target.value)} />
                </div>
                <div className="field">
                  <label>สรุปประวัติ</label>
                  <textarea rows={5} value={data.summary} onChange={e => set("summary", e.target.value)} />
                </div>
              </>
            )}

            {/* ── TAB: EXPERIENCE ── */}
            {tab === "exp" && (
              <>
                <div className="section-label">ประสบการณ์ทำงาน</div>
                <EntryBlock
                  type="experience" entries={data.experience}
                  onChange={(id, f, v) => updateEntry("experience", id, f, v)}
                  onAdd={() => addEntry("experience")}
                  onRemove={id => removeEntry("experience", id)}
                />
              </>
            )}

            {/* ── TAB: EDUCATION ── */}
            {tab === "edu" && (
              <>
                <div className="section-label">การศึกษา</div>
                <EntryBlock
                  type="education" entries={data.education}
                  onChange={(id, f, v) => updateEntry("education", id, f, v)}
                  onAdd={() => addEntry("education")}
                  onRemove={id => removeEntry("education", id)}
                />
              </>
            )}

            {/* ── TAB: SKILLS ── */}
            {tab === "skills" && (
              <>
                <div className="section-label">รูปแบบการแสดงผล</div>
                <select
                  value={data.skillDisplayMode}
                  onChange={e => set("skillDisplayMode", e.target.value)}
                  style={{ width: "100%", marginBottom: "15px", padding: "9px 12px", borderRadius: "6px", border: "2px solid #636363", backgroundColor: "#24262a", color: "#fff" }}
                >
                  <option value="simple">รายการทั่วไป (Bullet Points)</option>
                  <option value="category">แยก Hard Skills & Soft Skills</option>
                  <option value="level-text">บอกระดับ (ดีมาก, ปานกลาง, พอใช้)</option>
                  <option value="level-bar">บอกเป็นเปอร์เซ็นต์ (Progress Bar)</option>
                </select>

                <div className="section-label">รายการทักษะที่เกี่ยวข้อง</div>
                <div className="skill-tags">
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map(s => (
                      <div key={s.id} className="skill-tag">
                        {s.name}
                        <button onClick={() => removeSkill(s.id)}>×</button>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: "12px", color: "#666" }}>ยังไม่มีข้อมูลสำหรับรูปแบบนี้</p>
                  )}
                </div>

                <div className="skill-add-form" style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="ชื่อทักษะ..." />
                  <div style={{ display: "flex", gap: "8px" }}>
                    {data.skillDisplayMode === "category" && (
                      <select id="skillType" style={{ flex: 1, padding: "9px 12px", borderRadius: "6px", border: "2px solid #636363", backgroundColor: "#24262a", color: "#fff" }}>
                        <option value="Hard Skill">Hard Skill</option>
                        <option value="Soft Skill">Soft Skill</option>
                      </select>
                    )}
                    {(data.skillDisplayMode === "level-text" || data.skillDisplayMode === "level-bar") && (
                      <select id="skillLevel" style={{ flex: 1, padding: "9px 12px", borderRadius: "6px", border: "2px solid #636363", backgroundColor: "#24262a", color: "#fff" }}>
                        <option value="100|เชี่ยวชาญ">เชี่ยวชาญ (100%)</option>
                        <option value="80|ดีมาก">ดีมาก (80%)</option>
                        <option value="60|ปานกลาง">ปานกลาง (60%)</option>
                        <option value="40|พอใช้">พอใช้ (40%)</option>
                      </select>
                    )}
                  </div>
                  <button className="btn-add" onClick={handleAddSkillDetailed}>+ เพิ่มทักษะ</button>
                </div>
              </>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div style={{
            flexShrink: 0, display: "flex", flexDirection: "column", gap: 8,
            padding: "12px 16px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "#181818",
          }}>
            <button
              onClick={() => setShowA4Preview(true)}
              style={{
                padding: "10px", borderRadius: "8px",
                border: "1.5px solid rgba(212,175,55,0.5)",
                background: "rgba(212,175,55,0.08)", color: "#d4af37",
                fontWeight: "700", fontSize: "12px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.08)"; }}
            >
              📄 ดูตัวอย่าง A4 / Print
            </button>
            <button className="btn-download" onClick={handleSavePrivate}>💾 บันทึก Resume</button>
            <button
              className="btn-download"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
              onClick={handlePublish}
            >
              🌐 โพสต์สาธารณะ → Feed
            </button>
          </div>
        </div>

        {/* ── LIVE PREVIEW ── */}
        <LivePreviewPanel data={data} onOpenA4={() => setShowA4Preview(true)} />
      </div>
    </>
  );
}