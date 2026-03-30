import React, { useEffect, useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import { LuMail, LuLock, LuArrowLeft } from "react-icons/lu";
import { FaGoogle, FaGithub } from "react-icons/fa";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../styles/UsersLogin.css";

export default function UsersLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    // 1. ฟังก์ชันจัดการการเปลี่ยนหน้าตามสิทธิ์ (ย้ายมาไว้ข้างในเพื่อแก้ Warning)
    const handleRedirectByRole = (token) => {
      try {
        const decoded = jwtDecode(token);
        const { roles_id, status } = decoded;

        // 1. ถ้าเป็น Admin (roles_id === 1)
        if (roles_id === 1) {
          // แอดมินล็อกอินผ่านหน้านี้ได้เลย วาร์ปไปหน้า Dashboard
          navigate("/admin"); 
        } 
        
        // 2. ถ้าเป็น HR (roles_id === 3) แต่มาโผล่หน้า Seeker
        else if (roles_id === 3) {
          alert("หน้านี้สำหรับผู้สมัครงานและแอดมินเท่านั้น กรุณาเข้าสู่ระบบผ่านหน้า HR");
          localStorage.removeItem("token"); // ล้าง token ทิ้ง
          navigate("/hr-login"); // ดีดไปหน้า HR Login ที่คุณแยกไว้
        } 
        
        // 3. ถ้าเป็น Seeker/User ทั่วไป (roles_id === 2 หรืออื่นๆ)
        else {
          // เช็ค status นิดนึงเผื่อกรณีโดนแบน
          if (status === "banned") {
            alert("บัญชีของคุณถูกระงับการใช้งาน");
            localStorage.removeItem("token");
            return;
          }
          navigate("/feed");
        }
      } catch (error) {
        console.error("Token Decode Error:", error);
        navigate("/feed");
      }
    };

    const handleFormLogin = async (e) => {
      e.preventDefault();
      try {
        // ยิงไปที่ Endpoint Login หลักของคุณ (เช็ค URL ให้ตรงกับ Backend นะครับ)
        const response = await axios.post("http://localhost:3000/auth/login", {
          email,
          password
        });

        if (response.data.token) {
          const token = response.data.token;
          localStorage.setItem("token", token);
          handleRedirectByRole(token); // เรียกใช้ Logic วาร์ปตัวเดียวกัน
        }
      } catch (err) {
        alert(err.response?.data?.message || "Login failed");
      }
    };

    // เก็บ handleFormLogin ไว้ใช้ในตัวแปรเพื่อให้เรียกใช้ข้างนอก useEffect ได้ (หรือย้ายไว้ข้างนอกตามสะดวก)
    window.handleFormSubmit = handleFormLogin;

    // 2. ฟังก์ชันรอรับ Message จาก Popup OAuth
   const handleMessage = (event) => {
      if (event.origin !== "http://localhost:3000") return;
      if (event.data.type === "AUTH_SUCCESS") {
        const { token } = event.data;
        localStorage.setItem("token", token);
        handleRedirectByRole(token);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate, email, password]); 

  // --- ฟังก์ชัน Social Login (เหมือนเดิม) ---
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

            <form className="login-form-fields" onSubmit={(e) => window.handleFormSubmit(e)}>
              <div className="input-field-wrapper">
                <LuMail className="field-icon" />
                <input type="email"
                       placeholder="Email Address" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       required 
                />
              </div>
              <div className="input-field-wrapper">
                <LuLock className="field-icon" />
                <input type="password" 
                       placeholder="Password" 
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       required 
                />
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
