import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuMail, LuLock, LuArrowLeft, LuBriefcase } from "react-icons/lu";
import { FaGoogle } from "react-icons/fa";
import Swal from "sweetalert2";
import "../styles/HrLogin.css"; 

export default function HrLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 1. ฟังก์ชัน Login แบบปกติ
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/auth/hr/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "HR"); // เก็บสถานะว่าเป็น HR
        
        Swal.fire({
          title: "สำเร็จ!",
          text: "ยินดีต้อนรับเข้าสู่ระบบจัดการผู้ประกอบการ",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        navigate("/hr-dashboard"); // ไปหน้า Dashboard ของ HR
      } else {
        // ดัก Error เฉพาะ (เช่น กรณีสถานะยังเป็น pending)
        Swal.fire({
          title: "เข้าสู่ระบบไม่สำเร็จ",
          text: data.message,
          icon: response.status === 403 ? "info" : "error",
        });
      }
    } catch (error) {
      console.error("Login Error:", error);
      Swal.fire("Error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
    }
  };

  // 2. ฟังก์ชัน Social Login สำหรับ Workspace
  const handleSocialLogin = (provider) => {
    // ส่ง state=hr_login ไปด้วยเพื่อให้ Backend รู้ว่าต้องเช็คสิทธิ์ HR
    const backendUrl = `http://localhost:3000/auth/oauth/${provider}?state=hr_login`;
    const width = 500, height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(backendUrl, `Login with ${provider}`, `width=${width},height=${height},left=${left},top=${top}`);
  };

  // 3. รับ Token จาก Social Login Popup
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== "http://localhost:3000") return;

      if (event.data.type === "AUTH_SUCCESS") {
        localStorage.setItem("token", event.data.token);
        localStorage.setItem("role", "HR");
        navigate("/hr-dashboard");
      }
      
      if (event.data.type === "AUTH_ERROR") {
        Swal.fire("แจ้งเตือน", event.data.message, "info");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  return (
    <div className="hr-login-wrapper">
      <Link to="/" className="hr-back-btn">
        <LuArrowLeft /> Back to Home
      </Link>

      <div className="hr-main-card">
        <div className="hr-split-layout">
          
          <div className="hr-side-left">
            <div className="hr-info-content">
              <LuBriefcase size={50} color="#a855f7" />
              <h3>Employer Portal</h3>
              <p>จัดการการประกาศรับสมัครงานและค้นหาบุคลากรที่ใช่สำหรับองค์กรของคุณ</p>
              
              <div className="hr-social-gap">
                <button 
                  className="hr-social-btn" 
                  onClick={() => handleSocialLogin('google')}
                >
                  <FaGoogle /> Sign in with Workspace
                </button>
              </div>
              <p className="hr-helper-text">Secure access for verified organizations.</p>
            </div>
          </div>

          <div className="hr-divider">
            <span>OR</span>
          </div>

          <div className="hr-side-right">
            <div className="hr-form-container">
              <div className="hr-header">
                <h1>Owner Login</h1>
                <p>ก้าวเข้าสู่ระบบจัดการสำหรับผู้ประกอบการ</p>
              </div>

              <form className="hr-login-form" onSubmit={handleLogin}>
                <div className="hr-input-group">
                  <LuMail className="hr-icon" />
                  <input 
                    type="email" 
                    placeholder="Business Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="hr-input-group">
                  <LuLock className="hr-icon" />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
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