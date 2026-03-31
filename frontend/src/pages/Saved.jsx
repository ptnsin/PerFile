import React from "react";
import { useNavigate } from "react-router-dom";
import { useResumes } from "./ResumeContext";

const Saved = () => {
  const navigate = useNavigate();
  const { privateResumes, removePrivate } = useResumes();

  return (
    <div style={{ padding: "40px", color: "#fff", background: "#001a43", minHeight: "100vh" }}>
      <h1>Saved</h1>
      <p>รวมรายการที่คุณบันทึกไว้จะแสดงที่หน้านี้</p>

      {privateResumes.length === 0 ? (
        <p>คุณยังไม่มี resume ที่บันทึกไว้ กดปุ่มที่หน้า Feed หรือ Profile เพื่อสร้าง/บันทึก Resume</p>
      ) : (
        <div style={{ marginTop: 16 }}>
          <p>รายการที่บันทึก ({privateResumes.length})</p>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {privateResumes.map((resume) => (
              <div
                key={resume.id}
                style={{ background: "#fff", color: "#0f172a", borderRadius: 10, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>{resume.title}</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 14, color: "#475569" }}><b>Owner:</b> {resume.owner}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>สร้างเมื่อ {resume.createdAt}</p>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #0ea5e9", background: "#ffffff", color: "#0f172a", cursor: "pointer" }}
                    onClick={() => navigate(`/view-resume/${resume.id}`)}
                  >
                    ดู Resume
                  </button>
                  <button
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ef4444", background: "#ef4444", color: "#fff", cursor: "pointer" }}
                    onClick={() => removePrivate(resume.id)}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        style={{ padding: "10px 14px", fontSize: "16px", marginTop: "24px" }}
        onClick={() => navigate("/feed")}
      >
        กลับไปหน้า Feed
      </button>
    </div>
  );
};

export default Saved;
