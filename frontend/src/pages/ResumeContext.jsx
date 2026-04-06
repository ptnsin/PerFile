import { createContext, useContext, useState } from "react";

const ResumeContext = createContext(null);

export function ResumeProvider({ children }) {
  const [publishedResumes, setPublishedResumes] = useState([]);
  const [privateResumes, setPrivateResumes] = useState([
    {
      id: 1680000000000,
      title: "Resume ทดสอบ",
      owner: "Demo User",
      createdAt: new Date().toLocaleDateString("th-TH"),
      data: {
        name: "Demo User",
        title: "Frontend Developer",
        template: "classic",
        image: null,
        email: "demo@example.com",
        phone: "081-234-5678",
        location: "กรุงเทพมหานคร, ประเทศไทย",
        linkedin: "linkedin.com/in/demo",
        website: "demo-portfolio.com",
        summary: "นักพัฒนาซอฟต์แวร์ที่ชอบสร้าง UI สวยงามและประสบการณ์การใช้งานที่ลื่นไหล",
        experience: [
          { id: 1, role: "Frontend Developer", org: "Tech Startup Co.", period: "2022 – ปัจจุบัน", desc: "พัฒนาแอปเว็บด้วย React, Vite และ CSS Module เพื่อเพิ่มประสิทธิภาพการใช้งาน." },
          { id: 2, role: "UI/UX Intern", org: "Creative Studio", period: "2021 – 2022", desc: "ออกแบบหน้าจอและร่วมสร้างแนวทางการใช้งานสำหรับทีมผลิตภัณฑ์." },
        ],
        education: [
          { id: 1, degree: "ปริญญาตรี วิทยาการคอมพิวเตอร์", school: "มหาวิทยาลัยกรุงเทพ", period: "2018 – 2022", desc: "เกรดเฉลี่ย 3.78, โครงการวิจัยด้าน Web Performance." },
        ],
        skillDisplayMode: "simple",
        skills: [
          { id: 1, name: "React", type: "Hard Skill", level: 90, label: "Advanced" },
          { id: 2, name: "JavaScript", type: "Hard Skill", level: 85, label: "Advanced" },
          { id: 3, name: "UI Design", type: "Soft Skill", level: 80, label: "Good" },
        ],
      },
    },
  ]);   // ← ตัวอย่าง Resume สำหรับทดสอบหน้าโปรไฟล์

  // บันทึกแบบ Private (ไม่โชว์ใน Feed)
  const savePrivate = (resumeData) => {
    const card = {
      id: Date.now(),
      title: resumeData.title || resumeData.name || "Resume",
      owner: resumeData.name || "Unknown",
      createdAt: new Date().toLocaleDateString("th-TH"),
      data: resumeData,
    };
    setPrivateResumes((prev) => [card, ...prev]);
    return card.id;
  };

  // โพสต์สาธารณะ (โชว์ใน Feed)
  const publish = (resumeData) => {
    const card = {
      id: Date.now(),
      title: resumeData.title || "Resume",
      owner: resumeData.name || "Unknown",
      views: 0,
      type: "resume",
      publishedAt: new Date().toLocaleDateString("th-TH"),
      data: resumeData,
    };
    setPublishedResumes((prev) => [card, ...prev]);
    return card.id;
  };

  const removeResume = (id) => {
    setPublishedResumes((prev) => prev.filter((r) => r.id !== id));
  };

  const unpublishToPrivate = (id) => {
    const resume = publishedResumes.find((r) => r.id === id);
    if (!resume) return;
    const card = {
      id: Date.now(),
      title: resume.title || resume.owner || "Resume",
      owner: resume.owner || "Unknown",
      createdAt: new Date().toLocaleDateString("th-TH"),
      data: resume.data,
    };
    setPrivateResumes((prev) => [card, ...prev]);
    removeResume(id);
  };

  const publishPrivate = (id) => {
    const resume = privateResumes.find((r) => r.id === id);
    if (!resume) return;
    publish(resume.data);
    removePrivate(id);
  };

  // ลบ private resume
  const removePrivate = (id) => {
    setPrivateResumes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <ResumeContext.Provider
      value={{
        publishedResumes,
        publish,
        removeResume,
        unpublishToPrivate,
        publishPrivate,
        privateResumes,      // ← export ใหม่
        savePrivate,         // ← export ใหม่
        removePrivate,       // ← export ใหม่
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export const useResumes = () => useContext(ResumeContext);
