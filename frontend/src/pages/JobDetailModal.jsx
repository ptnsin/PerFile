import React, { useEffect } from "react";
import {
  LuX, LuBriefcase, LuMapPin, LuBadgeCheck,
  LuClock, LuDollarSign, LuUsers, LuCalendar,
  LuShare2, LuPencil, LuTrash2,
} from "react-icons/lu";

const overlay = {
  position: "fixed", inset: 0, zIndex: 600,
  background: "rgba(15,23,42,0.5)",
  backdropFilter: "blur(6px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "16px",
  animation: "jdm-fade 0.18s ease",
};

export default function JobDetailModal({ open, job, onClose, onEdit, onDelete }) {
  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !job) return null;

  const salary =
    job.salaryMin && job.salaryMax
      ? `฿${Number(job.salaryMin).toLocaleString()} – ฿${Number(job.salaryMax).toLocaleString()}`
      : job.salaryMin
      ? `฿${Number(job.salaryMin).toLocaleString()}+`
      : job.salaryMax
      ? `ไม่เกิน ฿${Number(job.salaryMax).toLocaleString()}`
      : job.salary || "ไม่ระบุ";

  return (
    <>
      <style>{`
        @keyframes jdm-fade    { from { opacity:0 } to { opacity:1 } }
        @keyframes jdm-slide   { from { opacity:0; transform:translateY(28px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }

        .jdm-sheet {
          background: #fff;
          border-radius: 22px;
          width: 100%;
          max-width: 660px;
          max-height: 88vh;
          overflow-y: auto;
          box-shadow: 0 32px 80px rgba(0,0,0,0.22);
          animation: jdm-slide 0.24s cubic-bezier(.4,0,.2,1);
          font-family: 'DM Sans', sans-serif;
          scrollbar-width: thin;
          scrollbar-color: #e4e4e7 transparent;
        }

        .jdm-hero {
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%);
          padding: 28px 28px 24px;
          border-radius: 22px 22px 0 0;
          position: relative;
          overflow: hidden;
        }
        .jdm-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .jdm-close {
          position: absolute; top: 16px; right: 16px;
          width: 32px; height: 32px; border-radius: 8px;
          border: 1.5px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; font-size: 16px;
          transition: background 0.15s;
          z-index: 1;
        }
        .jdm-close:hover { background: rgba(255,255,255,0.22); }

        .jdm-hero-icon {
          width: 56px; height: 56px; border-radius: 14px;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 26px; margin-bottom: 14px;
        }

        .jdm-hero-title {
          font-size: 22px; font-weight: 800; color: #fff;
          line-height: 1.25; margin-bottom: 8px;
          font-family: 'DM Serif Display', serif;
        }

        .jdm-hero-tags {
          display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px;
        }
        .jdm-hero-tag {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          color: #e0eaff; border-radius: 99px;
          padding: 4px 12px; font-size: 12px; font-weight: 600;
          display: flex; align-items: center; gap: 5px;
        }

        .jdm-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 22px; }

        .jdm-section-title {
          font-size: 11px; font-weight: 800; color: #a1a1aa;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;
        }

        .jdm-info-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .jdm-info-card {
          background: #f8fafc; border: 1.5px solid #f0f0f0;
          border-radius: 12px; padding: 12px 14px;
          display: flex; align-items: center; gap: 10px;
        }
        .jdm-info-card-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: #eff6ff; color: #1d4ed8;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .jdm-info-card-label { font-size: 10.5px; color: #a1a1aa; font-weight: 600; margin-bottom: 2px; }
        .jdm-info-card-value { font-size: 13.5px; font-weight: 700; color: #18181b; }

        .jdm-text-block {
          background: #fafafa; border: 1.5px solid #f0f0f0;
          border-radius: 12px; padding: 16px;
          font-size: 13.5px; color: #3f3f46; line-height: 1.7;
          white-space: pre-wrap;
        }
        .jdm-empty-text { color: #a1a1aa; font-style: italic; font-size: 13px; }

        .jdm-footer {
          padding: 16px 28px 22px;
          border-top: 1px solid #f0f0f0;
          display: flex; justify-content: space-between; align-items: center;
          gap: 10px;
        }
        .jdm-footer-left { display: flex; gap: 8px; }

        .jdm-btn-danger {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1.5px solid #fecaca; border-radius: 10px;
          padding: 9px 16px; font-size: 13px; font-weight: 600; color: #ef4444;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.13s;
        }
        .jdm-btn-danger:hover { background: #fef2f2; border-color: #ef4444; }

        .jdm-btn-ghost {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1.5px solid #e4e4e7; border-radius: 10px;
          padding: 9px 16px; font-size: 13px; font-weight: 600; color: #52525b;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.13s;
        }
        .jdm-btn-ghost:hover { border-color: #3b82f6; color: #1d4ed8; background: #eff6ff; }

        .jdm-btn-primary {
          display: flex; align-items: center; gap: 7px;
          background: #1e3a8a; color: #fff; border: none; border-radius: 10px;
          padding: 10px 22px; font-size: 13.5px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s;
        }
        .jdm-btn-primary:hover { background: #1d4ed8; box-shadow: 0 4px 14px rgba(29,78,216,0.3); }

        .jdm-applicant-count {
          display: inline-flex; align-items: center; gap: 6px;
          background: #f0fdf4; border: 1.5px solid #bbf7d0;
          color: #15803d; border-radius: 99px;
          padding: 4px 12px; font-size: 12px; font-weight: 700;
        }
      `}</style>

      <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="jdm-sheet">

          {/* ── Hero ── */}
          <div className="jdm-hero">
            <button className="jdm-close" onClick={onClose}><LuX /></button>
            <div className="jdm-hero-icon"><LuBriefcase /></div>
            <div className="jdm-hero-title">{job.title}</div>

            <div className="jdm-hero-tags">
              {job.job_type     && <span className="jdm-hero-tag"><LuClock size={11}/> {job.job_type}</span>}
              {job.category && <span className="jdm-hero-tag"><LuBadgeCheck size={11}/> {job.category}</span>}
              {job.location && <span className="jdm-hero-tag"><LuMapPin size={11}/> {job.location}</span>}
              {job.experience && <span className="jdm-hero-tag"><LuUsers size={11}/> {job.experience}</span>}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="jdm-body">

            {/* Info Grid */}
            <div>
              <div className="jdm-section-title">ข้อมูลตำแหน่ง</div>
              <div className="jdm-info-grid">
                <div className="jdm-info-card">
                  <div className="jdm-info-card-icon"><LuDollarSign /></div>
                  <div>
                    <div className="jdm-info-card-label">เงินเดือน</div>
                    <div className="jdm-info-card-value">{salary}</div>
                  </div>
                </div>
                <div className="jdm-info-card">
                  <div className="jdm-info-card-icon"><LuMapPin /></div>
                  <div>
                    <div className="jdm-info-card-label">สถานที่</div>
                    <div className="jdm-info-card-value">{job.location || "ไม่ระบุ"}</div>
                  </div>
                </div>
                <div className="jdm-info-card">
                  <div className="jdm-info-card-icon"><LuClock /></div>
                  <div>
                    <div className="jdm-info-card-label">รูปแบบงาน</div>
                    <div className="jdm-info-card-value">{job.job_type || "ไม่ระบุ"}</div>
                  </div>
                </div>
                <div className="jdm-info-card">
                  <div className="jdm-info-card-icon"><LuUsers /></div>
                  <div>
                    <div className="jdm-info-card-label">ระดับประสบการณ์</div>
                    <div className="jdm-info-card-value">{job.experience || "ไม่ระบุ"}</div>
                  </div>
                </div>
                {job.time && (
                  <div className="jdm-info-card" style={{ gridColumn: "span 2" }}>
                    <div className="jdm-info-card-icon"><LuCalendar /></div>
                    <div>
                      <div className="jdm-info-card-label">โพสต์เมื่อ</div>
                      <div className="jdm-info-card-value">{job.time}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="jdm-section-title">รายละเอียดงาน</div>
              <div className="jdm-text-block">
                {job.description
                  ? job.description
                  : <span className="jdm-empty-text">ไม่มีรายละเอียด</span>}
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div>
                <div className="jdm-section-title">คุณสมบัติที่ต้องการ</div>
                <div className="jdm-text-block">{job.requirements}</div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div>
                <div className="jdm-section-title">สวัสดิการ / สิทธิประโยชน์</div>
                <div className="jdm-text-block">{job.benefits}</div>
              </div>
            )}

          </div>

          {/* ── Footer ── */}
          <div className="jdm-footer">
            <div className="jdm-footer-left">
              {onDelete && (
                <button className="jdm-btn-danger" onClick={() => onDelete(job)}>
                  <LuTrash2 size={14}/> ลบ
                </button>
              )}
              {onEdit && (
                <button className="jdm-btn-ghost" onClick={() => onEdit(job)}>
                  <LuPencil size={14}/> แก้ไข
                </button>
              )}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="jdm-btn-ghost" onClick={onClose}>
                <LuShare2 size={14}/> แชร์
              </button>
              <button className="jdm-btn-primary" onClick={onClose}>
                ดูผู้สมัคร <LuUsers size={14}/>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
