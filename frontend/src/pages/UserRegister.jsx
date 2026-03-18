import React from "react";
import { Link } from "react-router-dom";
import { LuMail, LuLock, LuUser, LuArrowLeft, LuCheck } from "react-icons/lu";
import { FaGoogle, FaGithub } from "react-icons/fa";
import "../styles/UserRegister.css";

function UserRegister() {
  return (
    <div className="reg-page-wrapper">
      <Link to="/login" className="reg-back-btn">
        <LuArrowLeft /> Back to Login
      </Link>

      <div className="reg-main-card">
        <div className="reg-split-layout">
          
          {/* ฝั่งซ้าย: Benefits / Welcome */}
          <div className="reg-side-left">
            <div className="reg-info-content">
              <h3>เข้าร่วมกับเราวันนี้</h3>
              <p>สร้างโปรไฟล์ของคุณเพื่อโอกาสในการทำงานที่เหนือกว่า</p>
              
              <ul className="benefits-list">
                <li><LuCheck className="check-icon" /> ฝากเรซูเม่ให้บริษัทชั้นนำเห็น</li>
                <li><LuCheck className="check-icon" /> ระบบแนะนำงานที่ตรงใจคุณ</li>
                <li><LuCheck className="check-icon" /> ติดตามสถานะการสมัครงานได้ทันที</li>
              </ul>

              <div className="reg-social-gap">
                <button className="reg-social-btn google"><FaGoogle /> Sign up with Google</button>
                <button className="reg-social-btn github"><FaGithub /> Sign up with GitHub</button>
              </div>
            </div>
          </div>

          {/* เส้นคั่นกลาง OR */}
          <div className="reg-divider">
            <span>OR</span>
          </div>

          {/* ฝั่งขวา: Register Form */}
          <div className="reg-side-right">
            <div className="reg-form-container">
              <div className="reg-header">
                <h1>Create Account</h1>
                <p>กรุณากรอกข้อมูลเพื่อสร้างบัญชีผู้หางาน</p>
              </div>

              <form className="reg-form">
                <div className="reg-input-group">
                  <LuUser className="reg-icon" />
                  <input type="text" placeholder="Full Name" required />
                </div>
                
                <div className="reg-input-group">
                  <LuMail className="reg-icon" />
                  <input type="email" placeholder="Email Address" required />
                </div>

                <div className="reg-input-group">
                  <LuLock className="reg-icon" />
                  <input type="password" placeholder="Password" required />
                </div>

                <div className="reg-input-group">
                  <LuLock className="reg-icon" />
                  <input type="password" placeholder="Confirm Password" required />
                </div>

                <button type="submit" className="reg-primary-btn">
                  Create Account
                </button>
              </form>

              <div className="reg-footer-area">
                <p>มีบัญชีอยู่แล้วใช่ไหม?</p>
                <Link to="/login" className="reg-login-btn-outline">
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

export default UserRegister;