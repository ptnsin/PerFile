import React from "react";
import { Link } from "react-router-dom";
import { LuMail, LuLock, LuBriefcase, LuArrowLeft, LuBuilding, LuShieldCheck } from "react-icons/lu";
import { FaGoogle } from "react-icons/fa";
import "../styles/HrRegister.css";

function HrRegister() {
  return (
    <div className="hr-reg-wrapper">
      <Link to="/hr-login" className="hr-reg-back-btn">
        <LuArrowLeft /> Back to Login
      </Link>

      <div className="hr-reg-card">
        <div className="hr-reg-split">
          
          {/* ฝั่งซ้าย: Branding & Business Benefits */}
          <div className="hr-reg-side-left">
            <div className="hr-reg-info">
              <LuBuilding size={50} color="#a855f7" />
              <h3>ลงทะเบียนธุรกิจของคุณ</h3>
              <p>เริ่มต้นค้นหาบุคลากรคุณภาพและจัดการการจ้างงานอย่างมืออาชีพ</p>
              
              <ul className="hr-benefits">
                <li><LuShieldCheck className="hr-check" /> ระบบคัดกรองแคนดิเดตอัจฉริยะ</li>
                <li><LuShieldCheck className="hr-check" /> จัดการประกาศงานได้ไม่จำกัด</li>
                <li><LuShieldCheck className="hr-check" /> แดชบอร์ดวิเคราะห์สถิติการจ้างงาน</li>
              </ul>

              <div className="hr-reg-social">
                <button className="hr-social-btn">
                  <FaGoogle /> Register with Workspace
                </button>
              </div>
            </div>
          </div>

          {/* เส้นคั่นกลาง OR */}
          <div className="hr-reg-divider">
            <span>OR</span>
          </div>

          {/* ฝั่งขวา: Register Form */}
          <div className="hr-reg-side-right">
            <div className="hr-reg-form-container">
              <div className="hr-reg-header">
                <h1>Business Registration</h1>
                <p>กรุณากรอกข้อมูลองค์กรเพื่อสร้างบัญชี</p>
              </div>

              <form className="hr-reg-form">
                <div className="hr-reg-input">
                  <LuBuilding className="hr-reg-icon" />
                  <input type="text" placeholder="Company Name" required />
                </div>
                
                <div className="hr-reg-input">
                  <LuMail className="hr-reg-icon" />
                  <input type="email" placeholder="Business Email" required />
                </div>

                <div className="hr-reg-input">
                  <LuLock className="hr-reg-icon" />
                  <input type="password" placeholder="Password" required />
                </div>

                <div className="hr-reg-input">
                  <LuLock className="hr-reg-icon" />
                  <input type="password" placeholder="Confirm Password" required />
                </div>

                <button type="submit" className="hr-reg-btn-primary">
                  Create Business Account
                </button>
              </form>

              <div className="hr-reg-footer">
                <p>มีบัญชีบริษัทอยู่แล้ว?</p>
                <Link to="/hr-login" className="hr-login-btn-outline">
                  Log In Now
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default HrRegister;