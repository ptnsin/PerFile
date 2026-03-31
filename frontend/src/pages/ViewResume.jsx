import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useResumes } from "./ResumeContext";

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
  const { publishedResumes, privateResumes } = useResumes();

  const resumeId = parseInt(id);
  const resume = publishedResumes.find(r => r.id === resumeId) || privateResumes.find(r => r.id === resumeId);

  if (!resume) {
    return (
      <div className="not-found">
        <h2>Resume ไม่พบ</h2>
        <button onClick={() => navigate('/feed')} className="btn-back" style={{ marginTop: "20px" }}>
          ← กลับไปหน้า Feed
        </button>
      </div>
    );
  }

  const data = resume.data;

  return (
    <>
      <style>{fonts}</style>
      <style>{styles}</style>
      <div className="view-container">
        <header className="view-header">
          <div className="view-header-info">
            <h1>{data.name || "ไม่มีชื่อ"}</h1>
            <p>{data.title || "No Title"}</p>
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
              <div className="resume-name">{data.name || "ชื่อของคุณ"}</div>
              <div className="resume-title">{data.title || "ตำแหน่ง"}</div>
              <div className="resume-contacts">
                {data.email && <span>{data.email}</span>}
                {data.phone && <span>{data.phone}</span>}
                {data.location && <span>{data.location}</span>}
              </div>
            </div>

            {/* Content */}
            <div className="resume-content">
              {/* Summary */}
              {data.summary && (
                <div className="resume-section">
                  <div className="section-title">สรุปประวัติ</div>
                  <div className="summary-text">{data.summary}</div>
                </div>
              )}

              {/* Experience */}
              {data.experience && data.experience.length > 0 && (
                <div className="resume-section">
                  <div className="section-title">ประสบการณ์ทำงาน</div>
                  {data.experience.map(exp => (
                    <div key={exp.id} className="entry">
                      <div className="entry-header">
                        <div className="entry-title">{exp.role}</div>
                        <div className="entry-period">{exp.period}</div>
                      </div>
                      <div className="entry-org">{exp.org}</div>
                      {exp.desc && <div className="entry-desc">{exp.desc}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {data.education && data.education.length > 0 && (
                <div className="resume-section">
                  <div className="section-title">การศึกษา</div>
                  {data.education.map(edu => (
                    <div key={edu.id} className="entry">
                      <div className="entry-header">
                        <div className="entry-title">{edu.role}</div>
                        <div className="entry-period">{edu.period}</div>
                      </div>
                      <div className="entry-org">{edu.org}</div>
                      {edu.desc && <div className="entry-desc">{edu.desc}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {data.skills && data.skills.length > 0 && (
                <div className="resume-section">
                  <div className="section-title">ทักษะ</div>
                  <div className="skills-grid">
                    {data.skills.map((skill, i) => (
                      <div key={i} className="skill-tag">{skill}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {data.languages && data.languages.length > 0 && (
                <div className="resume-section">
                  <div className="section-title">ภาษา</div>
                  {data.languages.map(lang => (
                    <div key={lang.id} className="entry">
                      <div className="entry-header">
                        <div className="entry-title">{lang.role}</div>
                        <div className="entry-period">{lang.period}</div>
                      </div>
                      <div className="entry-org">{lang.org}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}