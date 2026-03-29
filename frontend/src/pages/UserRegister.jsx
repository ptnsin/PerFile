import React, { useState, useEffect } from "react"; // เพิ่ม useState, useEffect
import { Link, useNavigate } from "react-router-dom";
import { LuMail, LuLock, LuUser, LuArrowLeft, LuCheck } from "react-icons/lu";
import { FaGoogle, FaGithub } from "react-icons/fa";
import Swal from "sweetalert2"; // แนะนำให้ลง sweetalert2 เพื่อความสวยงาม
import "../styles/UserRegister.css";

function UserRegister() {
  const navigate = useNavigate();
  
  // 1. สร้าง State สำหรับเก็บข้อมูลในฟอร์ม
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // 2. ฟังก์ชันจัดการการเปลี่ยนแปลงใน Input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. ฟังก์ชันสมัครสมาชิกแบบปกติ
  // 3. ฟังก์ชันสมัครสมาชิกแบบปกติ
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return Swal.fire("ผิดพลาด", "รหัสผ่านไม่ตรงกัน", "error");
    }

    try {
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          roles_id: 2 
        })
      });

      const data = await response.json();

      if (response.ok) {
        // --- ส่วนที่แก้ไข: เก็บ Token และวาร์ปไปหน้า Feed ---
        if (data.token) {
          localStorage.setItem("token", data.token);
          Swal.fire({
            title: "สำเร็จ!",
            text: "สร้างบัญชีและเข้าสู่ระบบเรียบร้อย",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
          });
          navigate("/feed");
        } else {
          navigate("/login");
        }
      } else {
        Swal.fire("ผิดพลาด", data.message || "ไม่สามารถสมัครสมาชิกได้", "error");
      } // ปิด if (response.ok)
    } catch (error) {
      console.error("Registration Error:", error);
      Swal.fire("ผิดพลาด", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", "error");
    } // ปิด catch
  }; // ปิด handleSubmit

  // 4. ฟังก์ชัน Social Login (ก๊อปมาจากหน้า Login ได้เลย)
  const handleSocialLogin = (provider) => {
    const backendUrl = `http://localhost:3000/auth/oauth/${provider}`;
    const width = 500, height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(backendUrl, `Login with ${provider}`, `width=${width},height=${height},left=${left},top=${top}`);
  };

  // 5. เปิดเครื่องรับสัญญาณ Token จาก Social Login
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== "http://localhost:3000") return;

      if (event.data.type === "AUTH_SUCCESS") {
        const { token } = event.data;
        localStorage.setItem("token", token);
        
        // ไม่ต้อง alert ก็ได้เพื่อให้ลื่นไหล หรือจะ alert สั้นๆ
        navigate("/feed"); 
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);
  
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
                {/* เพิ่ม onClick ให้ปุ่ม Social */}
                <button className="reg-social-btn google" onClick={() => handleSocialLogin('google')}><FaGoogle /> Sign up with Google</button>
                <button className="reg-social-btn github" onClick={() => handleSocialLogin('github')}><FaGithub /> Sign up with GitHub</button>
              </div>
            </div>
          </div>

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

              {/* เพิ่ม onSubmit และ name/value ใน input */}
              <form className="reg-form" onSubmit={handleSubmit}>
                <div className="reg-input-group">
                  <LuUser className="reg-icon" />
                  <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
                </div>

                <div className="reg-input-group">
                  <LuUser className="reg-icon" />
                  <input type="text" name="fullName" placeholder="Full Name" onChange={handleChange} required />
                </div>
                
                <div className="reg-input-group">
                  <LuMail className="reg-icon" />
                  <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
                </div>

                <div className="reg-input-group">
                  <LuLock className="reg-icon" />
                  <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                </div>

                <div className="reg-input-group">
                  <LuLock className="reg-icon" />
                  <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />
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