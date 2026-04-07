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
    .view-header { display: none; }
    .preview-area { padding: 0; background: #fff; }
    .resume { box-shadow: none; }
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

  const findSection = (type) => resume.sections?.find(s => s.type === type)?.content || null;
  const findSections = (type) => resume.sections?.filter(s => s.type === type).map(s => s.content) || [];

  const header = findSection('header') || {};

  return (
    <>
      <style>{fonts}</style>
      <style>{styles}</style>
      <div className="view-container">
        <header className="view-header">
          <div className="view-header-info">
            <h1>{header.name || resume.title}</h1>
            <p>{header.title || "No Title"}</p>
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
              <div className="resume-name">{header.name || "ชื่อของคุณ"}</div>
              <div className="resume-title">{header.title || "ตำแหน่ง"}</div>
              <div className="resume-contacts">
                {header.email && <span>{header.email}</span>}
                {header.phone && <span>{header.phone}</span>}
                {header.location && <span>{header.location}</span>}
              </div>
            </div>

            {/* Content */}
            <div className="resume-content">
              
              {/* Summary */}
              {findSection('summary') && (
                <div className="resume-section">
                  <div className="section-title">สรุปประวัติ</div>
                  <div className="summary-text">{findSection('summary').text || findSection('summary')}</div>
                </div>
              )}

              {/* Experience */}
              {findSections('experience').length > 0 && (
                <div className="resume-section">
                  <div className="section-title">ประสบการณ์ทำงาน</div>
                  {findSections('experience').map((exp, i) => (
                    <div key={i} className="entry">
                      <div className="entry-header">
                        <div className="entry-title">{exp.role}</div>
                        <div className="entry-period">{exp.period}</div>
                      </div>
                      <div className="entry-org">{exp.company || exp.org}</div>
                      {exp.description && <div className="entry-desc">{exp.description}</div>}
                    </div>
                  ))}
                </div>
              )}

             {/* Education */}
              {findSections('education').length > 0 && (
                <div className="resume-section">
                  <div className="section-title">การศึกษา</div>
                  {findSections('education').map((edu, i) => (
                    <div key={i} className="entry">
                      <div className="entry-header">
                        <div className="entry-title">{edu.degree}</div>
                        <div className="entry-period">{edu.period}</div>
                      </div>
                      <div className="entry-org">{edu.school}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {findSection('skills') && (
                <div className="resume-section">
                  <div className="section-title">ทักษะ</div>
                  <div className="skills-grid">
                    {(Array.isArray(findSection('skills')) ? findSection('skills') : []).map((skill, i) => (
                      <div key={i} className="skill-tag">{typeof skill === 'string' ? skill : skill.name}</div>
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