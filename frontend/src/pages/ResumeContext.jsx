import { createContext, useContext, useState } from "react";

const ResumeContext = createContext(null);

export function ResumeProvider({ children }) {
  const [publishedResumes, setPublishedResumes] = useState([]);

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

  return (
    <ResumeContext.Provider value={{ publishedResumes, publish }}>
      {children}
    </ResumeContext.Provider>
  );
}

export const useResumes = () => useContext(ResumeContext);
