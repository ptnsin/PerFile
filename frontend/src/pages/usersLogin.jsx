import React, { useEffect } from "react";
import { Link,useNavigate } from "react-router-dom";
import { LuMail, LuLock, LuArrowLeft } from "react-icons/lu";
import { FaGoogle, FaGithub } from "react-icons/fa";
import "../styles/UsersLogin.css";

export default function UsersLogin() {
  const navigate = useNavigate();

  // --- ส่วนที่ต้องเพิ่ม: ฟังก์ชันรอรับ Token จาก Popup ---
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== "http://localhost:3000") return;

      if (event.data.type === "AUTH_SUCCESS") {
        const { token } = event.data;
        localStorage.setItem("token", token);
        navigate("/feed"); 
      }
    };

    // 1. "เปิดเครื่องรับ" เมื่อเข้าหน้านี้
    window.addEventListener("message", handleMessage);
    
    // 2. "ปิดเครื่องรับ" เมื่อออกจากหน้านี้ (Cleanup Function)
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]);

  // --- ฟังก์ชันเดิม (ห้ามลบ!) ---
  const handleSocialLogin = (provider) => {
    const backendUrl = `http://localhost:3000/auth/oauth/${provider}`;
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      backendUrl,
      `Login with ${provider}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <div className="login-page-wrapper">
      <Link to="/" className="back-to-home-btn">
        <LuArrowLeft /> Back to Home
      </Link>

      <div className="main-login-card">
        <div className="split-layout-inner">
          
          {/* ฝั่งซ้าย: Social */}
          <div className="left-social-side">
            <h3>Quick Access</h3>
            <div className="social-links-gap">
              <button 
                className="social-entry-btn"
                onClick={() => handleSocialLogin('google')}
              >
                <FaGoogle size={20} /> Continue with Google
              </button>

              <button 
                className="social-entry-btn"
                onClick={() => handleSocialLogin('github')}
              >
                <FaGithub size={20} /> Continue with GitHub
              </button>
            </div>
            <p className="helper-text">Fast and secure access to your profile.</p>
          </div>

          {/* เส้นคั่นกลาง OR */}
          <div className="center-divider">
            <span>OR</span>
          </div>

          {/* ฝั่งขวา: Email Form */}
          <div className="right-form-side">
            <div className="header-text">
              <h1>Seeker Login</h1>
              <p>ระบุข้อมูลของคุณเพื่อเข้าสู่ระบบ</p>
            </div>

            <form className="login-form-fields">
              <div className="input-field-wrapper">
                <LuMail className="field-icon" />
                <input type="email" placeholder="Email Address" required />
              </div>
              <div className="input-field-wrapper">
                <LuLock className="field-icon" />
                <input type="password" placeholder="Password" required />
              </div>
              <div className="forgot-pw-link">
                <a href="#forgot">Forgot your password?</a>
              </div>
              <button type="submit" className="primary-login-btn">Login</button>
            </form>

            <div className="bottom-register-area">
              <p className="reg-text">ยังไม่มีบัญชี?</p>
              <Link to="/register" className="outline-reg-btn">Register Now</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
