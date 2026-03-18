import React from "react";
import { Link } from "react-router-dom";
import { LuMail, LuLock, LuArrowLeft } from "react-icons/lu";
import { FaGoogle, FaGithub } from "react-icons/fa";
import "../styles/UsersLogin.css";

export default function UsersLogin() {
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
              <button className="social-entry-btn">
                <FaGoogle size={20} /> Continue with Google
              </button>
              <button className="social-entry-btn">
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
              <p>Enter your details to access your account.</p>
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
              <p className="reg-text">Don't have an account?</p>
              <Link to="/register" className="outline-reg-btn">Register Now</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
