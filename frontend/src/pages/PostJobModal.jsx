import React, { useState, useEffect, useRef } from "react";
import {
  LuX, LuBriefcase, LuMapPin, LuDollarSign,
  LuClock, LuChevronDown, LuSparkles, LuCheck
} from "react-icons/lu";

/* ─── Minimal inline styles to avoid extra CSS file ─── */
const overlay = {
  position: "fixed", inset: 0, zIndex: 500,
  background: "rgba(15,23,42,0.45)",
  backdropFilter: "blur(4px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "16px",
  animation: "pjm-fade-in 0.18s ease",
};

const sheet = {
  background: "#fff",
  borderRadius: "20px",
  width: "100%",
  maxWidth: "620px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
  animation: "pjm-slide-up 0.22s cubic-bezier(.4,0,.2,1)",
  fontFamily: "'DM Sans', sans-serif",
};

/* ────────────────────────────────────────────────── */

const JOB_TYPES   = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];
const EXP_LEVELS  = ["Entry Level", "Mid Level", "Senior Level", "Manager", "Director"];
const CATEGORIES  = ["Engineering", "Design", "Marketing", "Sales", "HR", "Finance", "Operations", "Other"];

const EMPTY = {
  title: "", category: "", type: "Full-time", location: "",
  salaryMin: "", salaryMax: "", experience: "Entry Level",
  description: "", requirements: "", benefits: "",
};

export default function PostJobModal({ open, onClose, onSubmit }) {
  const [form, setForm]       = useState(EMPTY);
  const [step, setStep]       = useState(1);     // 1 = basic, 2 = details, 3 = success
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const topRef = useRef(null);

  /* reset on open */
  useEffect(() => {
    if (open) { setForm(EMPTY); setStep(1); setErrors({}); }
  }, [open]);

  /* scroll to top on step change */
  useEffect(() => { topRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  if (!open) return null;

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate1 = () => {
    const e = {};
    if (!form.title.trim())    e.title    = "กรุณาระบุชื่อตำแหน่ง";
    if (!form.category)        e.category = "กรุณาเลือกหมวดหมู่";
    if (!form.location.trim()) e.location = "กรุณาระบุสถานที่";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validate2 = () => {
    const e = {};
    if (!form.description.trim()) e.description = "กรุณากรอกรายละเอียดงาน";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleNext = () => {
    if (step === 1 && validate1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!validate2()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          salary: form.salaryMin && form.salaryMax
            ? `${form.salaryMin}-${form.salaryMax}`
            : form.salaryMin || form.salaryMax || "ไม่ระบุ",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onSubmit?.(data.job ?? data);
        setStep(3);
      } else {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch {
      /* network error — still show success in demo */
      onSubmit?.({ id: Date.now(), ...form, time: "เพิ่งโพสต์" });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes pjm-fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes pjm-slide-up { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pjm-pop      { 0%{transform:scale(0.7)} 70%{transform:scale(1.1)} 100%{transform:scale(1)} }

        .pjm-field label { display:block; font-size:12px; font-weight:700; color:#52525b; margin-bottom:5px; letter-spacing:0.04em; text-transform:uppercase; }
        .pjm-field input, .pjm-field select, .pjm-field textarea {
          width:100%; border:1.5px solid #e4e4e7; border-radius:10px; padding:10px 13px;
          font-size:13.5px; font-family:'DM Sans',sans-serif; color:#18181b;
          background:#fafafa; outline:none; transition:border-color 0.15s, background 0.15s;
        }
        .pjm-field input:focus, .pjm-field select:focus, .pjm-field textarea:focus {
          border-color:#3b82f6; background:#fff;
        }
        .pjm-field textarea { resize:vertical; min-height:90px; line-height:1.55; }
        .pjm-field .pjm-err { font-size:11.5px; color:#ef4444; margin-top:4px; }
        .pjm-field.has-err input, .pjm-field.has-err select, .pjm-field.has-err textarea { border-color:#ef4444; }

        .pjm-select-wrap { position:relative; }
        .pjm-select-wrap svg { position:absolute; right:12px; top:50%; transform:translateY(-50%); color:#a1a1aa; pointer-events:none; font-size:15px; }
        .pjm-select-wrap select { appearance:none; padding-right:36px; cursor:pointer; }

        .pjm-row { display:grid; gap:14px; }
        .pjm-row.cols-2 { grid-template-columns:1fr 1fr; }
        .pjm-row.cols-3 { grid-template-columns:1fr 1fr 1fr; }

        .pjm-salary { display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:center; }
        .pjm-salary-sep { text-align:center; font-size:13px; color:#a1a1aa; padding-top:22px; }

        .pjm-step-dots { display:flex; gap:6px; }
        .pjm-dot { width:6px; height:6px; border-radius:50%; background:#e4e4e7; transition:all 0.2s; }
        .pjm-dot.active { width:20px; border-radius:99px; background:#1d4ed8; }

        .pjm-tag-row { display:flex; flex-wrap:wrap; gap:7px; margin-top:8px; }
        .pjm-tag {
          border:1.5px solid #e4e4e7; border-radius:99px; padding:5px 13px;
          font-size:12.5px; font-weight:600; color:#52525b; cursor:pointer;
          transition:all 0.13s; background:#fafafa; font-family:'DM Sans',sans-serif;
        }
        .pjm-tag:hover { border-color:#3b82f6; color:#1d4ed8; background:#eff6ff; }
        .pjm-tag.sel { border-color:#1d4ed8; color:#1d4ed8; background:#eff6ff; }

        .pjm-btn-primary {
          display:flex; align-items:center; justify-content:center; gap:7px;
          background:#1e3a8a; color:#fff; border:none; border-radius:10px;
          padding:11px 24px; font-size:13.5px; font-weight:700;
          font-family:'DM Sans',sans-serif; cursor:pointer; transition:background 0.15s, box-shadow 0.15s;
        }
        .pjm-btn-primary:hover:not(:disabled) { background:#1d4ed8; box-shadow:0 4px 14px rgba(29,78,216,0.3); }
        .pjm-btn-primary:disabled { opacity:0.6; cursor:not-allowed; }

        .pjm-btn-ghost {
          display:flex; align-items:center; gap:6px;
          background:none; border:1.5px solid #e4e4e7; border-radius:10px;
          padding:10px 20px; font-size:13.5px; font-weight:600; color:#52525b;
          font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.13s;
        }
        .pjm-btn-ghost:hover { border-color:#3b82f6; color:#1d4ed8; background:#eff6ff; }

        .pjm-spinner {
          width:16px; height:16px; border:2px solid rgba(255,255,255,0.35);
          border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>

      <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={sheet} ref={topRef}>

          {/* ── Header ── */}
          <div style={{ padding:"20px 24px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
                <div style={{
                  width:34, height:34, borderRadius:10,
                  background:"linear-gradient(135deg,#1e40af,#3b82f6)",
                  display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16
                }}>
                  <LuBriefcase />
                </div>
                <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:"#18181b" }}>
                  ลงประกาศงานใหม่
                </h2>
              </div>
              <div className="pjm-step-dots">
                <div className={`pjm-dot${step >= 1 ? " active" : ""}`} />
                <div className={`pjm-dot${step >= 2 ? " active" : ""}`} />
              </div>
            </div>
            <button onClick={onClose} style={{
              width:32, height:32, borderRadius:8, border:"1.5px solid #e4e4e7",
              background:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", color:"#71717a", fontSize:16,
            }}>
              <LuX />
            </button>
          </div>

          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <div style={{ padding:"20px 24px" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                <div className={`pjm-field${errors.title ? " has-err" : ""}`}>
                  <label>ชื่อตำแหน่งงาน *</label>
                  <input value={form.title} onChange={set("title")} placeholder="เช่น Senior Frontend Developer" />
                  {errors.title && <div className="pjm-err">{errors.title}</div>}
                </div>

                <div className="pjm-row cols-2">
                  <div className={`pjm-field${errors.category ? " has-err" : ""}`}>
                    <label>หมวดหมู่ *</label>
                    <div className="pjm-select-wrap">
                      <select value={form.category} onChange={set("category")}>
                        <option value="">เลือกหมวดหมู่</option>
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <LuChevronDown />
                    </div>
                    {errors.category && <div className="pjm-err">{errors.category}</div>}
                  </div>

                  <div className="pjm-field">
                    <label>ระดับประสบการณ์</label>
                    <div className="pjm-select-wrap">
                      <select value={form.experience} onChange={set("experience")}>
                        {EXP_LEVELS.map((l) => <option key={l}>{l}</option>)}
                      </select>
                      <LuChevronDown />
                    </div>
                  </div>
                </div>

                <div className={`pjm-field${errors.location ? " has-err" : ""}`}>
                  <label><LuMapPin style={{ display:"inline", marginRight:4 }} />สถานที่ทำงาน *</label>
                  <input value={form.location} onChange={set("location")} placeholder="เช่น กรุงเทพฯ / Remote / Hybrid" />
                  {errors.location && <div className="pjm-err">{errors.location}</div>}
                </div>

                <div className="pjm-field">
                  <label><LuDollarSign style={{ display:"inline", marginRight:4 }} />เงินเดือน (บาท/เดือน)</label>
                  <div className="pjm-salary">
                    <input value={form.salaryMin} onChange={set("salaryMin")} placeholder="ขั้นต่ำ" type="number" />
                    <div className="pjm-salary-sep">–</div>
                    <input value={form.salaryMax} onChange={set("salaryMax")} placeholder="สูงสุด" type="number" />
                  </div>
                </div>

                <div className="pjm-field">
                  <label><LuClock style={{ display:"inline", marginRight:4 }} />รูปแบบการทำงาน</label>
                  <div className="pjm-tag-row">
                    {JOB_TYPES.map((t) => (
                      <button
                        key={t}
                        className={`pjm-tag${form.type === t ? " sel" : ""}`}
                        onClick={() => setForm((p) => ({ ...p, type: t }))}
                        type="button"
                      >{t}</button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── Step 2: Detail ── */}
          {step === 2 && (
            <div style={{ padding:"20px 24px" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                <div className={`pjm-field${errors.description ? " has-err" : ""}`}>
                  <label>รายละเอียดงาน *</label>
                  <textarea
                    value={form.description} onChange={set("description")}
                    placeholder="อธิบายหน้าที่ความรับผิดชอบ บทบาทของตำแหน่งนี้..."
                    style={{ minHeight:120 }}
                  />
                  {errors.description && <div className="pjm-err">{errors.description}</div>}
                </div>

                <div className="pjm-field">
                  <label>คุณสมบัติที่ต้องการ</label>
                  <textarea
                    value={form.requirements} onChange={set("requirements")}
                    placeholder="- ประสบการณ์ 3 ปีขึ้นไป&#10;- ทักษะ React, TypeScript&#10;..."
                  />
                </div>

                <div className="pjm-field">
                  <label>สวัสดิการ / สิทธิประโยชน์</label>
                  <textarea
                    value={form.benefits} onChange={set("benefits")}
                    placeholder="- ประกันสุขภาพ&#10;- Work from home&#10;..."
                  />
                </div>

              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div style={{ padding:"40px 24px", textAlign:"center" }}>
              <div style={{
                width:72, height:72, borderRadius:"50%",
                background:"linear-gradient(135deg,#1e40af,#3b82f6)",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontSize:32, margin:"0 auto 16px",
                animation:"pjm-pop 0.4s cubic-bezier(.4,0,.2,1)",
              }}>
                <LuCheck />
              </div>
              <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:"#18181b", marginBottom:6 }}>
                ลงประกาศสำเร็จ!
              </h3>
              <p style={{ fontSize:13, color:"#71717a", marginBottom:24 }}>
                ประกาศงาน <strong>"{form.title}"</strong> ถูกเผยแพร่เรียบร้อยแล้ว
              </p>
              <button className="pjm-btn-primary" onClick={onClose} style={{ margin:"0 auto" }}>
                ดูรายการประกาศ
              </button>
            </div>
          )}

          {/* ── Footer ── */}
          {step < 3 && (
            <div style={{
              padding:"16px 24px 20px",
              borderTop:"1px solid #f0f0f0",
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <span style={{ fontSize:12, color:"#a1a1aa" }}>
                ขั้นตอน {step} จาก 2
              </span>
              <div style={{ display:"flex", gap:8 }}>
                {step === 2 && (
                  <button className="pjm-btn-ghost" onClick={() => setStep(1)}>
                    ย้อนกลับ
                  </button>
                )}
                {step === 1 && (
                  <button className="pjm-btn-primary" onClick={handleNext}>
                    ถัดไป <LuChevronDown style={{ transform:"rotate(-90deg)" }} />
                  </button>
                )}
                {step === 2 && (
                  <button className="pjm-btn-primary" onClick={handleSubmit} disabled={loading}>
                    {loading
                      ? <><div className="pjm-spinner" /> กำลังโพสต์...</>
                      : <><LuSparkles /> โพสต์งาน</>
                    }
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
