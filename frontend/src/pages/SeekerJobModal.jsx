import React, { useEffect, useState } from "react";
import {
  LuX, LuBriefcase, LuMapPin, LuBadgeCheck,
  LuClock, LuDollarSign, LuUsers, LuBookmark,
  LuShare2, LuSend,
} from "react-icons/lu";

const API = "http://localhost:3000";

export default function SeekerJobModal({ open, job, onClose, isSaved, onToggleSave }) {
  const [applying, setApplying]   = useState(false);
  const [applied, setApplied]     = useState(false);
  const [applyMsg, setApplyMsg]   = useState("");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Reset state เมื่อเปิด job ใหม่
  useEffect(() => {
    if (open) {
      setApplied(job?.alreadyApplied ?? false);  // ← แก้ตรงนี้
      setApplyMsg(job?.alreadyApplied ? "คุณสมัครงานนี้ไปแล้ว" : "");
    }
  }, [open, job?.id]);

  if (!open || !job) return null;

  const salary = job.salary || "ไม่ระบุ";
  const company = job.company_name || job.users?.hr_profile?.company || job.company || "";

  const handleApply = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("กรุณาเข้าสู่ระบบก่อนสมัครงาน");
    setApplying(true);
    try {
      const res = await fetch(`${API}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ job_id: job.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplied(true);
        setApplyMsg("สมัครงานสำเร็จแล้ว! 🎉");
      } else {
        setApplyMsg(data.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      setApplyMsg("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setApplying(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: job.title, text: `ตำแหน่ง: ${job.title}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("คัดลอก URL แล้ว!");
    }
  };

  return (
    <>
      <style>{`
        @keyframes sjm-fade  { from { opacity:0 } to { opacity:1 } }
        @keyframes sjm-slide { from { opacity:0; transform:translateY(28px) scale(0.98) } to { opacity:1; transform:none } }

        .sjm-overlay {
          position: fixed; inset: 0; zIndex: 600;
          background: rgba(15,23,42,0.5);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: sjm-fade 0.18s ease;
          z-index: 600;
        }
        .sjm-sheet {
          background: #fff; border-radius: 22px;
          width: 100%; max-width: 620px; max-height: 88vh;
          overflow-y: auto;
          box-shadow: 0 32px 80px rgba(0,0,0,0.22);
          animation: sjm-slide 0.22s cubic-bezier(.4,0,.2,1);
          font-family: 'Inter','Noto Sans Thai',sans-serif;
          scrollbar-width: thin; scrollbar-color: #e4e4e7 transparent;
        }
        .sjm-hero {
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%);
          padding: 28px 28px 22px;
          border-radius: 22px 22px 0 0;
          position: relative;
        }
        .sjm-close {
          position: absolute; top: 14px; right: 14px;
          width: 32px; height: 32px; border-radius: 8px;
          border: 1.5px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; font-size: 16px;
          transition: background 0.15s;
        }
        .sjm-close:hover { background: rgba(255,255,255,0.25); }
        .sjm-hero-icon {
          width: 52px; height: 52px; border-radius: 13px;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 24px; margin-bottom: 12px;
        }
        .sjm-hero-title { font-size: 21px; font-weight: 800; color: #fff; margin-bottom: 6px; line-height: 1.25; }
        .sjm-hero-company { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.85); font-size: 13.5px; font-weight: 600; margin-bottom: 10px; }
        .sjm-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .sjm-tag {
          background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
          color: #e0eaff; border-radius: 99px;
          padding: 4px 11px; font-size: 11.5px; font-weight: 600;
          display: flex; align-items: center; gap: 5px;
        }
        .sjm-body { padding: 22px 26px; display: flex; flex-direction: column; gap: 20px; }
        .sjm-section-label {
          font-size: 10.5px; font-weight: 800; color: #a1a1aa;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;
        }
        .sjm-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sjm-info-card {
          background: #f8fafc; border: 1.5px solid #f0f0f0;
          border-radius: 11px; padding: 11px 13px;
          display: flex; align-items: center; gap: 10px;
        }
        .sjm-info-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: #eff6ff; color: #1d4ed8;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }
        .sjm-info-label { font-size: 10px; color: #a1a1aa; font-weight: 600; margin-bottom: 2px; }
        .sjm-info-value { font-size: 13px; font-weight: 700; color: #18181b; }
        .sjm-text-block {
          background: #fafafa; border: 1.5px solid #f0f0f0;
          border-radius: 11px; padding: 14px;
          font-size: 13.5px; color: #3f3f46; line-height: 1.7;
          white-space: pre-wrap;
        }
        .sjm-footer {
          padding: 14px 26px 20px;
          border-top: 1px solid #f0f0f0;
          display: flex; justify-content: space-between; align-items: center; gap: 10px;
        }
        .sjm-btn-ghost {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1.5px solid #e4e4e7; border-radius: 10px;
          padding: 9px 15px; font-size: 13px; font-weight: 600; color: #52525b;
          cursor: pointer; transition: all 0.13s; font-family: inherit;
        }
        .sjm-btn-ghost:hover { border-color: #3b82f6; color: #1d4ed8; background: #eff6ff; }
        .sjm-btn-save {
          display: flex; align-items: center; gap: 6px;
          background: none; border-radius: 10px;
          padding: 9px 15px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.13s; font-family: inherit;
          border: 1.5px solid #e4e4e7; color: #52525b;
        }
        .sjm-btn-save.saved { background: #eff6ff; border-color: #1e3a8a; color: #1e3a8a; }
        .sjm-btn-apply {
          display: flex; align-items: center; gap: 7px;
          background: #1e3a8a; color: #fff; border: none; border-radius: 10px;
          padding: 10px 24px; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.15s; font-family: inherit;
        }
        .sjm-btn-apply:hover:not(:disabled) { background: #1d4ed8; box-shadow: 0 4px 14px rgba(29,78,216,0.3); }
        .sjm-btn-apply:disabled { opacity: 0.6; cursor: not-allowed; }
        .sjm-btn-apply.applied { background: #15803d; }
        .sjm-apply-msg {
          text-align: center; font-size: 13px; font-weight: 600;
          padding: 8px 0 0; color: #15803d;
        }
        .sjm-apply-msg.error { color: #ef4444; }
      `}</style>

      <div className="sjm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sjm-sheet">

          {/* Hero */}
          <div className="sjm-hero">
            <button className="sjm-close" onClick={onClose}><LuX /></button>
            <div className="sjm-hero-icon"><LuBriefcase /></div>
            <div className="sjm-hero-title">{job.title || "ไม่ระบุตำแหน่ง"}</div>
            {company && (
              <div className="sjm-hero-company">
                <LuBadgeCheck size={13} style={{ opacity: 0.8 }} />
                {company}
              </div>
            )}
            <div className="sjm-tags">
              {job.job_type  && <span className="sjm-tag"><LuClock size={11}/> {job.job_type}</span>}
              {job.category  && <span className="sjm-tag"><LuBadgeCheck size={11}/> {job.category}</span>}
              {job.location  && <span className="sjm-tag"><LuMapPin size={11}/> {job.location}</span>}
              {job.experience && <span className="sjm-tag"><LuUsers size={11}/> {job.experience}</span>}
            </div>
          </div>

          {/* Body */}
          <div className="sjm-body">

            {/* Info Grid */}
            <div>
              <div className="sjm-section-label">ข้อมูลตำแหน่ง</div>
              <div className="sjm-info-grid">
                <div className="sjm-info-card">
                  <div className="sjm-info-icon"><LuDollarSign /></div>
                  <div>
                    <div className="sjm-info-label">เงินเดือน</div>
                    <div className="sjm-info-value" style={{ color: "#15803d" }}>฿ {salary}</div>
                  </div>
                </div>
                <div className="sjm-info-card">
                  <div className="sjm-info-icon"><LuMapPin /></div>
                  <div>
                    <div className="sjm-info-label">สถานที่</div>
                    <div className="sjm-info-value">{job.location || "ไม่ระบุ"}</div>
                  </div>
                </div>
                <div className="sjm-info-card">
                  <div className="sjm-info-icon"><LuClock /></div>
                  <div>
                    <div className="sjm-info-label">รูปแบบงาน</div>
                    <div className="sjm-info-value">{job.job_type || "ไม่ระบุ"}</div>
                  </div>
                </div>
                <div className="sjm-info-card">
                  <div className="sjm-info-icon"><LuUsers /></div>
                  <div>
                    <div className="sjm-info-label">ระดับประสบการณ์</div>
                    <div className="sjm-info-value">{job.experience || "ไม่ระบุ"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {job.description && (
              <div>
                <div className="sjm-section-label">รายละเอียดงาน</div>
                <div className="sjm-text-block">{job.description}</div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div>
                <div className="sjm-section-label">คุณสมบัติที่ต้องการ</div>
                <div className="sjm-text-block">{job.requirements}</div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div>
                <div className="sjm-section-label">สวัสดิการ / สิทธิประโยชน์</div>
                <div className="sjm-text-block">{job.benefits}</div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="sjm-footer">
            <div style={{ display: "flex", gap: 8 }}>
              {/* Save button */}
              <button
                className={`sjm-btn-save${isSaved ? " saved" : ""}`}
                onClick={onToggleSave}
              >
                <LuBookmark size={14} style={{ fill: isSaved ? "currentColor" : "none" }} />
                {isSaved ? "บันทึกแล้ว" : "บันทึก"}
              </button>
              {/* Share button */}
              <button className="sjm-btn-ghost" onClick={handleShare}>
                <LuShare2 size={14}/> แชร์
              </button>
            </div>

            {/* Apply button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <button
                className={`sjm-btn-apply${applied ? " applied" : ""}`}
                onClick={handleApply}
                disabled={applying || applied}
              >
                {applying ? "กำลังส่ง..." : applied ? "สมัครแล้ว ✓" : <><LuSend size={14}/> สมัครงาน</>}
              </button>
              {applyMsg && (
                <div className={`sjm-apply-msg${applied ? "" : " error"}`}>
                  {applyMsg}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}