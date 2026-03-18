import React from "react";
import { Link } from "react-router-dom";
import { LuMail, LuLock, LuArrowLeft, LuBriefcase } from "react-icons/lu";
import { FaGoogle } from "react-icons/fa";
import "../styles/HrLogin.css"; 

export default function HrLogin() {
  return (
    <div className="hr-login-wrapper">
      <Link to="/" className="hr-back-btn">
        <LuArrowLeft /> Back to Home
      </Link>

      <div className="hr-main-card">
        <div className="hr-split-layout">
          
          {/* ฝั่งซ้าย: Branding/Info */}
          <div className="hr-side-left">
            <div className="hr-info-content">
              <LuBriefcase size={50} color="#a855f7" />
              <h3>Employer Portal</h3>
              <p>จัดการการประกาศรับสมัครงานและค้นหาบุคลากรที่ใช่สำหรับองค์กรของคุณ</p>
              
              <div className="hr-social-gap">
                <button className="hr-social-btn">
                  <FaGoogle /> Sign in with Workspace
                </button>
              </div>
              <p className="hr-helper-text">Secure access for verified organizations.</p>
            </div>
          </div>

          {/* เส้นคั่นกลาง */}
          <div className="hr-divider">
            <span>OR</span>
          </div>

          {/* ฝั่งขวา: Login Form */}
          <div className="hr-side-right">
            <div className="hr-form-container">
              <div className="hr-header">
                <h1>Owner Login</h1>
                <p>ก้าวเข้าสู่ระบบจัดการสำหรับผู้ประกอบการ</p>
              </div>

              <form className="hr-login-form">
                <div className="hr-input-group">
                  <LuMail className="hr-icon" />
                  <input type="email" placeholder="Business Email" required />
                </div>
                <div className="hr-input-group">
                  <LuLock className="hr-icon" />
                  <input type="password" placeholder="Password" required />
                </div>
                
                <div className="hr-forgot-link">
                  <a href="#forgot">Forgot your password?</a>
                </div>

                <button type="submit" className="hr-primary-btn">
                  Access Dashboard
                </button>
              </form>

              <div className="hr-register-area">
                <p>ยังไม่มีบัญชีผู้ประกอบการ?</p>
                <Link to="/hr-register" className="hr-outline-btn">
                  Register Business
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

