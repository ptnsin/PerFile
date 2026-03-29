// import React, { useState, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useResumes } from "./ResumeContext";
// import {
//   LuSearch, LuBell, LuUser, LuPanelLeft, LuFilter
// } from "react-icons/lu";
// import { FiPlusSquare, FiHome, FiGrid } from "react-icons/fi";
// import "../styles/UsersFeed.css"; // ใช้ style เดิม

// function PrivateFeed() {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const sidebarRef = useRef(null);
//   const navigate = useNavigate();

//   const { publishedResumes } = useResumes();

//   // ✅ เอาเฉพาะ private
//   const privateProfiles = publishedResumes.filter(r => !r.isPublic);

//   const toggleSidebar = () => {
//     if (isSidebarOpen) sidebarRef.current.style.width = "";
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   useEffect(() => {
//     const sidebar = sidebarRef.current;
//     const handle = sidebar.querySelector(".sidebar-handle");

//     let dragging = false;
//     let startX = 0;
//     let startW = 0;

//     const onMouseDown = (e) => {
//       dragging = true;
//       startX = e.clientX;
//       startW = sidebar.offsetWidth;
//       document.addEventListener("mousemove", onMouseMove);
//       document.addEventListener("mouseup", onMouseUp);
//     };

//     const onMouseMove = (e) => {
//       if (!dragging) return;
//       const newW = Math.min(400, Math.max(60, startW + (e.clientX - startX)));
//       sidebar.style.width = newW + "px";
//     };

//     const onMouseUp = () => {
//       dragging = false;
//       document.removeEventListener("mousemove", onMouseMove);
//       document.removeEventListener("mouseup", onMouseUp);
//     };

//     handle.addEventListener("mousedown", onMouseDown);
//     return () => handle.removeEventListener("mousedown", onMouseDown);
//   }, []);

//   return (
//     <div className="feed-container">
//       {/* NAV */}
//       <nav className="feed-nav">
//         <div className="nav-left-group">
//           <button onClick={toggleSidebar}><LuPanelLeft /></button>
//           <div className="nav-logo">Private Feed</div>
//           <div className="nav-search-wrapper">
//             <LuSearch />
//             <input placeholder="ค้นหา..." />
//           </div>
//         </div>

//         <div className="nav-right-links">
//           <LuBell />
//           <div><LuUser /> You</div>
//         </div>
//       </nav>

//       <div className="feed-layout">
//         {/* SIDEBAR */}
//         <aside
//           ref={sidebarRef}
//           className={`feed-sidebar ${isSidebarOpen ? "open" : "closed"}`}
//         >
//           <div className="sidebar-handle"></div>

//           <div className="sidebar-menu">
//             <button onClick={() => navigate('/resume')} className="create-btn">
//               <FiPlusSquare /> Create
//             </button>

//             <button className="menu-item" onClick={() => navigate("/feed")}>
//               <FiGrid /> Public Feed
//             </button>

//             <button className="menu-item active">
//               <FiHome /> Private
//             </button>

//             <button className="menu-item" onClick={() => navigate("/profile")}>
//               <FiHome /> Profile
//             </button>
//           </div>
//         </aside>

//         {/* MAIN */}
//         <main className="feed-main">
//           <header className="feed-header">
//             <h1>Private Resumes</h1>
//             <p>เฉพาะ Resume ของคุณ (ยังไม่ Public)</p>
//           </header>

//           <div className="content-scroll-area">
//             <div className="filter-bar">
//               <button className="filter-btn">
//                 <LuFilter /> กรอง
//               </button>
//             </div>

//             <div className="cards-grid">
//               {privateProfiles.length > 0 ? (
//                 privateProfiles.map(resume => (
//                   <div
//                     key={resume.id}
//                     className="feed-card resume-border"
//                     onClick={() => navigate(`/view-resume/${resume.id}`)}
//                     style={{ cursor: "pointer" }}
//                   >
//                     <div className="card-info">
//                       <h3 className="resume-title">
//                         {resume.title || "No Title"}
//                       </h3>
//                       <p className="resume-owner">
//                         by {resume.owner || "You"}
//                       </p>
//                       <small className="resume-date">
//                         {resume.publishedAt}
//                       </small>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <p style={{ padding: "20px", color: "#999" }}>
//                   ยังไม่มี Private Resume
//                 </p>
//               )}
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default PrivateFeed;