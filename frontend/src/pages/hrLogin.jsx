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

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  }, []);

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
        localStorage.setItem("role", data.user.role);

        Swal.fire({
          title: data.user.role === 1 ? "ยินดีต้อนรับ Admin" : "สำเร็จ!",
          text: data.message,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });

        if (data.user.role === 1) {
          navigate("/admin");
        } else {
          navigate("/hr-feed");
        }

      } else {
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

  const handleSocialLogin = (provider) => {
    const backendUrl = `http://localhost:3000/auth/oauth/${provider}?state=hr_login`;
    const width = 500, height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      backendUrl,
      `Login with ${provider}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== "http://localhost:3000") return;

      if (event.data.type === "AUTH_SUCCESS") {
        const { token, role } = event.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);

        if (parseInt(role) === 1) {
          navigate("/admin");
        } else {
          navigate("/hr-feed");
        }
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
              <p>ระบบจัดการประกาศรับสมัครงานและค้นหาบุคลากรที่ใช่สำหรับองค์กรของคุณ</p>
              
              <div className="hr-social-gap">
                <button 
                  className="hr-social-btn1" 
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

              {/* ✅ ปิด autofill ทั้ง form */}
              <form 
                className="hr-login-form" 
                onSubmit={handleLogin}
                autoComplete="off"
              >
                <div className="hr-input-group">
                  <LuMail className="hr-icon" />
                  <input 
                    type="email"
                    name="hr_email"
                    autoComplete="username"
                    placeholder="Business Address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === " ") e.preventDefault(); // ❌ กัน spacebar
                    }}
                    required 
                  />
                </div>

                <div className="hr-input-group">
                  <LuLock className="hr-icon" />
                  <input 
                    type="password"
                    name="hr_password"
                    autoComplete="new-password"
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === " ") e.preventDefault(); // ❌ กัน spacebar
                    }}
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