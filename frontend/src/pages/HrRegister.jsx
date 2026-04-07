import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuMail, LuLock, LuBriefcase, LuArrowLeft, LuBuilding, LuShieldCheck, LuUser } from "react-icons/lu";
import { FaGoogle } from "react-icons/fa";
import Swal from "sweetalert2";
import "../styles/HrRegister.css";

function HrRegister() {
  const navigate = useNavigate();
  
  // 1. State สำหรับเก็บข้อมูล
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // 2. จัดการการพิมพ์
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. ฟังก์ชัน Submit (แก้จุดที่เคยแดงให้แล้ว)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return Swal.fire("ผิดพลาด", "รหัสผ่านไม่ตรงกัน", "error");
    }

    try {
      const response = await fetch("http://localhost:3000/auth/hr/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          fullName: formData.fullName,
          company: formData.company,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          title: "ส่งคำขอสำเร็จ!",
          text: "กรุณารอ Admin อนุมัติบัญชี HR ของคุณ",
          icon: "success"
        });
        navigate("/hr-login");
      } else {
        Swal.fire("สมัครไม่สำเร็จ", data.message || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      console.error("Connection Error:", error);
      Swal.fire("Error", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    }
  };

  // ฟังก์ชันสำหรับ Social Login/Register
  const handleSocialLogin = (provider) => {
    // ชี้ไปที่ Backend Port 3000 ตัวเดิมที่เราทำ OAuth ไว้
    const backendUrl = `http://localhost:3000/auth/oauth/${provider}?state=hr_register`;
    
    // ตั้งค่าขนาดหน้าต่าง Popup
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

  // ฟังคำตอบจากหน้าต่าง Popup
  useEffect(() => {
    const handleMessage = (event) => {
      // เช็คว่าส่งมาจาก Backend เราจริงๆ ไหม
      if (event.origin !== "http://localhost:3000") return;

      if (event.data.type === "AUTH_SUCCESS") {
        const { token } = event.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", "3"); // บันทึกว่าเป็น HR
        
        Swal.fire({
          title: "สำเร็จ!",
          text: "สมัครเข้าใช้งานด้วย Google สำเร็จ",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        
        navigate("/hr-feed"); // วาร์ปไปหน้า Feed ของ HR
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  return (
    <div className="hr-reg-wrapper">
      <Link to="/hr-login" className="hr-reg-back-btn">
        <LuArrowLeft /> Back to Login
      </Link>

      <div className="hr-reg-card">
        <div className="hr-reg-split">
          
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
                <button 
                  className="hr-social-btn1" 
                  type="button" 
                  onClick={() => handleSocialLogin('google')}
                >
                  <FaGoogle /> Register with Workspace
                </button>
              </div>
            </div>
          </div>

          <div className="hr-reg-divider">
            <span>OR</span>
          </div>

          <div className="hr-reg-side-right">
            <div className="hr-reg-form-container">
              <div className="hr-reg-header">
                <h1>Business Registration</h1>
                <p>กรุณากรอกข้อมูลองค์กรเพื่อสร้างบัญชี</p>
              </div>

              <form className="hr-reg-form" onSubmit={handleSubmit}>
                <div className="hr-reg-input">
                  <LuUser className="hr-reg-icon" />
                  <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
                </div>

                <div className="hr-reg-input">
                  <LuUser className="hr-reg-icon" />
                  <input type="text" name="fullName" placeholder="Full Name (HR Representative)" onChange={handleChange} required />
                </div>

                <div className="hr-reg-input">
                  <LuBriefcase className="hr-reg-icon" />
                  <input type="text" name="company" placeholder="Company Name" onChange={handleChange} required />
                </div>
                
                <div className="hr-reg-input">
                  <LuMail className="hr-reg-icon" />
                  <input type="email" name="email" placeholder="Business Email" onChange={handleChange} required />
                </div>

                <div className="hr-reg-input">
                  <LuLock className="hr-reg-icon" />
                  <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                </div>

                <div className="hr-reg-input">
                  <LuLock className="hr-reg-icon" />
                  <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />
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