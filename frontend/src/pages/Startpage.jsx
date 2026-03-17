import React from "react";
import { Link } from "react-router-dom";
// เปลี่ยนจาก LuUserCircle เป็น LuUser หรือ LuCircleUser
import { LuCircleUser, LuSearch, LuRocket, LuUsers, LuBriefcase, LuTrendingUp } from "react-icons/lu";
import "../styles/Startpage.css"

export default function Startpage(){
    return (
    <div className="container">
      <nav className="navbar">
        <div className="logo">PerFile</div>
        <div className="nav-links">
          <Link to="/login" className="btn-outline">Login for Seeker</Link>
          <Link to="/hr-login" className="link-text">Login for Owner</Link>
        </div>
      </nav>

      <div className="split-container">
        <div className="side left-side">
          <div className="content">
            <h1>For Seeker</h1>
            <ul className="features-list">
                <li><LuCircleUser className="icon" /><b>Create Professional Profile</b> สร้างโปรไฟล์ดิจิทัลที่เป็นเอกลักษณ์</li>
                <li><LuRocket className="icon" /><b>Skill Showcase</b> นำเสนอทักษะและผลงาน (Portfolio) ให้เข้าตาผู้จ้าง</li>
                <li><LuSearch className="icon" /><b>Smart Search</b> ค้นหางานที่ตรงกับความสามารถและไลฟ์สไตล์ของคุณ</li>
            </ul>
            <p></p>
            <Link to="/login" className="cta-button">Get Started</Link>
          </div>
        </div>

        {/* ฝั่ง Owner */}
        <div className="side right-side">
          <div className="content">
            <h1>For Owner</h1>
            <ul className="features-list">
                <li><LuUsers className="icon" /><b>Talent Discovery</b>เข้าถึงฐานข้อมูลผู้สมัครที่ผ่านการคัดกรองคุณภาพ</li>
                <li><LuBriefcase className="icon" /><b>Effortless Management</b>จัดการประกาศรับสมัครงานและคัดเลือกคนได้ในที่เดียว</li>
                <li><LuTrendingUp className="icon" /><b>Grow Your Team</b>ขยายทีมงานด้วยบุคลากรที่ตอบโจทย์ความต้องการของธุรกิจ</li>
            </ul>
            <p></p>
            <Link to="/hr-login" className="cta-button">Join as Owner</Link>
          </div>
        </div>
      </div>
    </div>
    )
}
