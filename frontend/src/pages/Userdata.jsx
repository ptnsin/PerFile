import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LuUser, LuMail, LuPhone, LuMapPin, LuGraduationCap, 
  LuBriefcase, LuWrench, LuPlus, LuChevronRight, LuChevronLeft, LuCheck 
} from "react-icons/lu";
import "../styles/Userdata.css";

function Userdata() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="userdata-wrapper">
      <div className="userdata-container">
        
        {/* Progress Bar */}
        <div className="progress-stepper">
          {[1, 2, 3].map((num) => (
            <div key={num} className={`step-item ${step >= num ? "active" : ""} ${step > num ? "completed" : ""}`}>
              <div className="step-number">
                {step > num ? <LuCheck /> : num}
              </div>
              <p className="step-label">{num === 1 ? "ข้อมูลส่วนตัว" : num === 2 ? "การศึกษา" : "ประสบการณ์"}</p>
              {num < 3 && <div className="step-line"></div>}
            </div>
          ))}
        </div>

        <form className="userdata-form" onSubmit={(e) => e.preventDefault()}>
          
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="step-content fade-in">
              <div className="section-header">
                <h2>ข้อมูลส่วนตัว</h2>
                <p>กรุณากรอกข้อมูลพื้นฐานสำหรับการติดต่อ</p>
              </div>
              <div className="input-grid">
                <div className="input-box"><label>ชื่อ-นามสกุล (EN)</label><input type="text" placeholder="John Doe" /></div>
                <div className="input-box"><label>เบอร์โทรศัพท์</label><input type="tel" placeholder="090-xxx-xxxx" /></div>
                <div className="input-box full"><label>ที่อยู่ปัจจุบัน</label><input type="text" placeholder="Bangkok, Thailand" /></div>
                <div className="input-box full"><label>แนะนำตัวสั้นๆ</label><textarea placeholder="จุดเด่นของคุณ..."></textarea></div>
              </div>
            </div>
          )}

          {/* STEP 2: Education & Skills */}
          {step === 2 && (
            <div className="step-content fade-in">
              <div className="section-header">
                <h2>การศึกษาและทักษะ</h2>
                <p>ระบุประวัติการเรียนและทักษะที่ถนัด</p>
              </div>
              <div className="dynamic-section">
                <div className="input-box full"><label>มหาวิทยาลัย / โรงเรียน</label><input type="text" placeholder="ชื่อสถานศึกษา" /></div>
                <div className="input-grid">
                  <input type="text" placeholder="สาขาวิชา" />
                  <input type="text" placeholder="ปีที่จบการศึกษา" />
                </div>
                <div className="skill-input-area" style={{marginTop: '20px'}}>
                  <label>ทักษะ (เช่น React, SQL, Figma)</label>
                  <input type="text" placeholder="คั่นด้วยเครื่องหมายจุลภาค ," />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Experience */}
          {step === 3 && (
            <div className="step-content fade-in">
              <div className="section-header">
                <h2>ประสบการณ์ทำงาน</h2>
                <p>ระบุที่ทำงานล่าสุดหรือโปรเจกต์ที่เคยทำ</p>
              </div>
              <div className="input-box full"><label>ชื่อบริษัท / โปรเจกต์</label><input type="text" placeholder="Company Name" /></div>
              <div className="input-box full"><label>ตำแหน่งงาน</label><input type="text" placeholder="Position" /></div>
              <div className="input-box full"><label>หน้าที่ความรับผิดชอบ</label><textarea placeholder="เล่าสั้นๆ ว่าทำอะไรบ้าง..."></textarea></div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="step-navigation">
            {step > 1 && (
              <button type="button" className="btn-back" onClick={prevStep}>
                <LuChevronLeft /> ย้อนกลับ
              </button>
            )}
            
            {step < 3 ? (
              <button type="button" className="btn-next" onClick={nextStep}>
                ถัดไป <LuChevronRight />
              </button>
            ) : (
              <button type="button" className="btn-save" onClick={() => navigate("/feed")}>
                บันทึกข้อมูลและเสร็จสิ้น <LuCheck />
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}

export default Userdata;