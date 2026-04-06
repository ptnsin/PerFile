import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LuUser, LuMail, LuPhone, LuMapPin, LuGraduationCap, 
  LuBriefcase, LuWrench, LuPlus, LuChevronRight, LuChevronLeft, LuCheck,
  LuBuilding
} from "react-icons/lu";
import DatePicker from "react-datePicker ";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/Userdata.css";

function Userdata() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

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
                <div className="input-box"><label>ชื่อ-นามสกุล (TH)</label><input type="text" placeholder="" /></div>
                <div className="input-box"><label>ชื่อ-นามสกุล (EN)</label><input type="text" placeholder="" /></div>
                <div className="input-box"><label>เบอร์โทรศัพท์</label><input type="tel" placeholder="090-xxx-xxxx" /></div>
                <div className="input-box"><label>Email</label><input type="email" placeholder="example@gmail.com" /></div>
                <div className="input-box full"><label>ที่อยู่ปัจจุบัน</label><input type="text" placeholder="Bangkok, Thailand" /></div>
                <div className="input-box full"><label>แนะนำตัวสั้นๆ</label><textarea placeholder="จุดเด่นของคุณ..."></textarea></div>
              </div>
            </div>
          )}

          {/* STEP 2: Education & Skills */}
          {step === 2 && (
            <div className="step-content fade-in">
              <div className="section-header">
                <h2>ประวัติการศึกษา</h2>
                <p>ระบุรายละเอียดวุฒิการศึกษาและทักษะของคุณ</p>
              </div>
              <div className="dynamic-section">
                <div className="input-box full">
                  <label>ชื่อสถานศึกษา (School Name)</label>
                  <input type="text" placeholder="เช่น มหาวิทยาลัยเกษตรศาสตร์" />
                </div>
                <div className="input-grid">
                  <div className="input-box">
                    <label>คณะ (Faculty)</label>
                    <input type="text" placeholder="เช่น วิศวกรรมศาสตร์" />
                  </div>
                  <div className="input-box">
                    <label>สาขาวิชา (Major / Field of Study)</label>
                    <input type="text" placeholder="เช่น วิศวกรรมซอฟต์แวร์" />
                  </div>
                </div>
                <div className="input-box full">
                  <label>วุฒิการศึกษา (Degree)</label>
                  <input type="text" placeholder="เช่น ปริญญาตรี (B.Eng.)" />
                </div>
                <div className="input-grid">
                  <div className="input-box">
                    <label>วันที่เริ่มการศึกษา (Start Date)</label>
                    <DatePicker 
                      selected={startDate} 
                      onChange={(date) => setStartDate(date)} 
                      className="custom-datepicker-input" // ใช้ Class CSS ของเราเอง
                      dateFormat="dd/MM/yyyy"
                      placeholderText="เลือกวันที่"
                    />
                  </div>
                  <div className="input-box">
                    <label>วันที่คาดว่าจะจบ (End Date)</label>
                    <DatePicker 
                      selected={endDate} 
                      onChange={(date) => setEndDate(date)} 
                      className="custom-datepicker-input" // ใช้ Class CSS ของเราเอง
                      dateFormat="dd/MM/yyyy"
                      placeholderText="เลือกวันที่"
                    />
                  </div>
                </div>
                <div className="skill-section" style={{marginTop: '35px', paddingTop: '25px', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                  <label style={{fontSize: '1rem', color: '#0046ff', fontWeight: 'bold', marginBottom: '15px', display: 'block'}}>
                    ทักษะและความสามารถ (Skills)
                  </label>
                  <div className="input-box full">
                    <input type="text" placeholder="ระบุทักษะ เช่น React, SQL, Figma (คั่นด้วยเครื่องหมายจุลภาค , )" />
                    <p className="input-hint">ทักษะเหล่านี้จะช่วยให้บริษัทค้นหาโปรไฟล์ของคุณได้ง่ายขึ้น</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Experience */}
          {step === 3 && (
            <div className="step-content fade-in">
              <div className="section-header">
                <h2>ประสบการณ์ทำงาน</h2>
                <p>ระบุประวัติการทำงานหรือฝึกงานที่ผ่านมา</p>
              </div>
              <div className="dynamic-section">
                <div className="input-box full">
                  <label>ชื่อบริษัท / องค์กร (Company Name)</label>
                  <div className="input-field">
                    <LuBuilding className="field-icon" />
                    <input type="text" placeholder="เช่น บริษัท เอบีซี จำกัด" />
                  </div>
                </div>
                <div className="input-box full">
                  <label>ตำแหน่งงาน (Job Title / Position)</label>
                  <div className="input-field">
                    <LuBriefcase className="field-icon" />
                    <input type="text" placeholder="เช่น Frontend Developer Intern" />
                  </div>
                </div>
                <div className="input-grid">
                  <div className="input-box">
                    <label>วันที่เริ่มงาน (Start Date)</label>
                    <DatePicker 
                      selected={startDate} 
                      onChange={(date) => setStartDate(date)} 
                      className="custom-datepicker-input" // ใช้ Class CSS ของเราเอง
                      dateFormat="dd/MM/yyyy"
                      placeholderText="เลือกวันที่"
                    />
                  </div>
                  <div className="input-box">
                    <label>วันที่สิ้นสุดงาน (End Date)</label>
                    <DatePicker 
                      selected={endDate} 
                      onChange={(date) => setEndDate(date)} 
                      className="custom-datepicker-input" // ใช้ Class CSS ของเราเอง
                      dateFormat="dd/MM/yyyy"
                      placeholderText="เลือกวันที่"
                    />
                  </div>
                </div>
                <div className="input-box full">
                  <label>หน้าที่ความรับผิดชอบ (Job Description)</label>
                  <textarea placeholder="อธิบายสิ่งที่คุณทำ..." rows="5"></textarea>
                </div>
              </div>
            </div>
          )}

          {/* 2. เพิ่มส่วนปุ่มควบคุมด้านล่างฟอร์ม (สำคัญมาก!) */}
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