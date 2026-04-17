import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0e0e0e; }

  .view-container { display: flex; flex-direction: column; height: 100vh; }

  .view-header {
    background: #111;
    border-bottom: 1px solid #2a2a2a;
    padding: 16px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .view-header-info h1 { color: #fff; font-size: 18px; margin-bottom: 4px; }
  .view-header-info p { color: #c9a84c; font-size: 12px; }

  .view-header-actions { display: flex; gap: 12px; }

  .btn-back {
    padding: 10px 16px;
    background: #c9a84c;
    border: none;
    border-radius: 6px;
    color: #000;
    font-weight: 600;
    cursor: pointer;
    font-size: 12px;
  }

  .btn-back:hover { background: #e8c97a; }

  .preview-area {
    flex: 1;
    overflow-y: auto;
    background: #1a1a1a;
    display: flex;
    justify-content: center;
    padding: 40px 20px;
  }

  .resume {
    width: 794px;
    min-height: 1123px;
    background: #fff;
    color: #1a1a1a;
    box-shadow: 0 25px 80px rgba(0,0,0,0.5);
  }

  .resume-header {
    background: #111;
    padding: 48px 52px 40px;
    border-bottom: 1px solid #c9a84c;
  }

  .resume-name {
    font-family: 'DM Serif Display', serif;
    font-size: 46px;
    color: #fff;
    margin-bottom: 6px;
  }

  .resume-title {
    font-size: 14px;
    color: #c9a84c;
    font-weight: 500;
    margin-bottom: 16px;
    text-transform: uppercase;
  }

  .resume-contacts {
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: #fff;
    flex-wrap: wrap;
  }

  .resume-content { padding: 40px 52px; }

  .resume-section { margin-bottom: 28px; }

  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #000;
    border-bottom: 2px solid #c9a84c;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }

  .entry { margin-bottom: 16px; }

  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }

  .entry-title { font-weight: 600; font-size: 12px; }
  .entry-period { font-size: 11px; color: #666; }
  .entry-org { font-size: 11px; color: #666; font-style: italic; }
  .entry-desc { font-size: 10px; color: #555; line-height: 1.5; margin-top: 4px; }

  .summary-text { font-size: 11px; color: #333; line-height: 1.6; }

  .skills-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .skill-tag {
    background: #f0f0f0;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 10px;
  }

  .not-found {
    color: #fff;
    text-align: center;
    padding: 60px 20px;
  }

  @media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }
  body {
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .view-header { display: none !important; }
  .preview-area {
    padding: 0 !important;
    margin: 0 !important;
    background: #fff !important;
    overflow: visible !important;
    display: block !important;
  }
  .resume {
    width: 210mm !important;
    height: 297mm !important;
    box-shadow: none !important;
    margin: 0 auto !important;
    page-break-after: always;
  }
}
`;

export default function ViewResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  

 useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/resumes/${id}`, {
          headers: { 
            "Authorization": `Bearer ${token}` 
          },
        });

        if (res.ok) {
          const data = await res.json();
          setResume(data.resume); // เก็บข้อมูล resume ที่ได้จาก Backend
        } else {
          setResume(null);
        }
      } catch (err) {
        console.error("Fetch Resume Error:", err);
        setResume(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResumeData();
  }, [id]);

  if (loading) return <div className="loading">กำลังโหลดเรซูเม่...</div>;

  if (!resume) {
    return (
      <div className="not-found" style={{ textAlign: 'center', color: '#fff', paddingTop: '100px' }}>
        <h2>Resume ไม่พบ</h2>
        <button onClick={() => navigate('/feed')} className="btn-back" style={{ marginTop: "20px" }}>
          ← กลับไปหน้า Feed
        </button>
      </div>
    );
  }

  return (
  <>
    <style>{fonts}</style>
    <style>{styles}</style>
    <div className="view-container">
      <header className="view-header">
        <div className="view-header-info">
          {/* ✅ เปลี่ยนมาใช้ resume.title โดยตรง */}
          <h1>{resume.title}</h1>
          <p>{resume.ownerName || "No Title"}</p>
        </div>
        <div className="view-header-actions">
          <button className="btn-back" onClick={() => window.print()}>🖨️ พิมพ์</button>
          <button className="btn-back" onClick={() => navigate('/feed')}>← กลับ</button>
        </div>
      </header>

      <div className="preview-area">
        <div className="resume">
          {/* Header */}
          <div className="resume-header">
            <div className="resume-name">{resume.title}</div>
            <div className="resume-title">{resume.template} Template</div>
            {/* หมายเหตุ: หากต้องการ Email/Phone ให้เพิ่มฟิลด์เหล่านี้ในตาราง resumes ด้วย */}
          </div>

          <div className="resume-content">
            {/* ✅ 1. แสดง Summary จากคอลัมน์ resume.summary */}
            {resume.summary && (
              <div className="resume-section">
                <div className="section-title">สรุปประวัติ</div>
                <div className="summary-text">{resume.summary}</div>
              </div>
            )}

            {/* ✅ 2. แสดง Experience จากคอลัมน์ resume.experience */}
            {resume.experience && resume.experience.length > 0 && (
              <div className="resume-section">
                <div className="section-title">ประสบการณ์ทำงาน</div>
                {resume.experience.map((exp, i) => {
                  return <div key={i} className="entry">
                    <div className="entry-header">
                      <div className="entry-title">{exp?.content?.role || "ไม่ระบุตำแหน่ง"}</div>
                      <div className="entry-period">{exp?.content?.period}</div>
                    </div>
                    <div className="entry-org">{exp?.content?.org || exp?.content?.company}</div>
                    {exp?.content?.desc && <div className="entry-desc">{exp.content.desc}</div>}
                  </div>
            })}
              </div>
            )}

            {/* ✅ 3. แสดง Education จากคอลัมน์ resume.education */}
            {resume.education && resume.education.length > 0 && (
              <div className="resume-section">
                <div className="section-title">การศึกษา</div>
                {resume.education.map((edu, i) => (
                  <div key={i} className="entry">
                    <div className="entry-header">
                      <div className="entry-title">{edu?.content?.degree || "ไม่ระบุวุฒิการศึกษา"}</div>
                      <div className="entry-period">{edu?.content?.period}</div>
                    </div>
                    <div className="entry-org">{edu?.content?.school}</div>
                    {edu?.content?.desc && <div className="entry-desc">{edu.content.desc}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* ✅ 4. แสดง Skills จากคอลัมน์ resume.skills */}
            {resume.skills && resume.skills.length > 0 && (
              <div className="resume-section">
                <div className="section-title">ทักษะ</div>
                <div className="skills-grid">
                  {resume.skills.map((skill, i) => (
                    <div key={i} className="skill-tag">
                      {typeof skill === 'string' ? skill : (skill?.name || skill?.label || "ทักษะ")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
}