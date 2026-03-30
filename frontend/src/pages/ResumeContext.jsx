import { createContext, useContext, useState } from "react";

const ResumeContext = createContext(null);

export function ResumeProvider({ children }) {
  const [publishedResumes, setPublishedResumes] = useState([]);
  const [privateResumes, setPrivateResumes] = useState([]);   // ← เพิ่มใหม่

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
