import React, { useState, useEffect } from "react";
import {
    LuX, LuBriefcase, LuMapPin, LuBuilding2,
    LuUser, LuGlobe, LuBadgeCheck,
} from "react-icons/lu";

const API = "http://localhost:3000";

export default function HRPopupModal({ userId, onClose }) {
    const [hr, setHr] = useState(null);
    const [activeJobs, setActiveJobs] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const fetchHR = async () => {
            try {
                const res = await fetch(`${API}/profile/hr/${userId}`);
                if (!res.ok) throw new Error("ไม่พบข้อมูล HR");
                const data = await res.json();
                setHr(data.hr);
                setActiveJobs(data.activeJobs || 0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHR();
    }, [userId]);

    const handleBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const displayName = hr?.fullName || "HR";
    const initial = displayName?.[0]?.toUpperCase() ?? "H";

    return (
        <div
            onClick={handleBackdrop}
            style={{
                position: "fixed", inset: 0, zIndex: 700,
                background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 16,
            }}
        >
            <div style={{
                background: "#f8fafc", borderRadius: 20,
                width: "100%", maxWidth: 460,
                maxHeight: "80vh", overflowY: "auto",
                boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
                position: "relative",
            }}>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
                        <div style={{
                            width: 32, height: 32, border: "3px solid #e5e7eb",
                            borderTop: "3px solid #1e3a8a", borderRadius: "50%",
                            animation: "hr-spin 0.8s linear infinite",
                            margin: "0 auto 12px",
                        }} />
                        กำลังโหลด...
                    </div>
                ) : (
                    <>
                        {/* Banner */}
                        <div style={{
                            height: 100,
                            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 60%, #60a5fa 100%)",
                            borderRadius: "20px 20px 0 0",
                            position: "relative",
                        }}>
                            <button
                                onClick={onClose}
                                style={{
                                    position: "absolute", top: 12, right: 12,
                                    background: "rgba(255,255,255,0.2)",
                                    border: "1.5px solid rgba(255,255,255,0.3)",
                                    borderRadius: "50%", width: 30, height: 30,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", color: "#fff", fontSize: 14,
                                }}
                            ><LuX size={14} /></button>
                        </div>

                        {/* Body */}
                        <div style={{ background: "#fff", borderRadius: "0 0 20px 20px", padding: "0 24px 24px" }}>

                            {/* Avatar */}
                            <div style={{
                                width: 70, height: 70, borderRadius: "50%",
                                border: "3px solid #fff",
                                background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                overflow: "hidden", fontSize: 24, fontWeight: 800, color: "#fff",
                                marginTop: -35, marginBottom: 12,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                position: "relative",
                                zIndex: 2,
                            }}>
                                {hr?.avatar
                                    ? <img src={hr.avatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                                    : initial}
                            </div>

                            {/* Name + role */}
                            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>
                                {displayName}
                            </div>
                            {hr?.role && (
                                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                                    <LuUser size={12} /> {hr.role}
                                </div>
                            )}

                            {/* Company + info chips */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                                {hr?.company && (
                                    <span style={chipStyle}>
                                        <LuBuilding2 size={11} /> {hr.company}
                                    </span>
                                )}
                                {hr?.location && (
                                    <span style={chipStyle}>
                                        <LuMapPin size={11} /> {hr.location}
                                    </span>
                                )}
                                {hr?.industry && (
                                    <span style={chipStyle}>
                                        <LuBadgeCheck size={11} /> {hr.industry}
                                    </span>
                                )}
                                {hr?.website && (
                                    <a href={hr.website} target="_blank" rel="noreferrer"
                                        style={{ ...chipStyle, color: "#7c3aed", textDecoration: "none" }}>
                                        <LuGlobe size={11} /> {hr.website}
                                    </a>
                                )}
                            </div>

                            {/* Bio */}
                            {hr?.bio && (
                                <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, marginBottom: 14 }}>
                                    {hr.bio}
                                </p>
                            )}

                            {/* Stats */}
                            <div style={{
                                display: "flex", gap: 10, marginBottom: 20,
                            }}>
                                <div style={statBox}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1e3a8a" }}>{activeJobs}</div>
                                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>งานเปิดรับ</div>
                                </div>
                                {hr?.company_size && (
                                    <div style={statBox}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a" }}>{hr.company_size}</div>
                                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>ขนาดบริษัท</div>
                                    </div>
                                )}
                                {hr?.founded && (
                                    <div style={statBox}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a" }}>{hr.founded}</div>
                                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>ก่อตั้ง</div>
                                    </div>
                                )}
                            </div>

                            {/* ปุ่มปิด */}
                            <button
                                onClick={onClose}
                                style={{
                                    width: "100%", padding: "11px 0", borderRadius: 12,
                                    border: "1.5px solid #e5e7eb", background: "#fff",
                                    color: "#374151", fontWeight: 600, fontSize: 14,
                                    cursor: "pointer",
                                }}
                            >
                                ปิด
                            </button>
                        </div>
                    </>
                )}

                <style>{`@keyframes hr-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}

const chipStyle = {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 12, color: "#6b7280", background: "#f3f4f6",
    borderRadius: 20, padding: "3px 10px", fontWeight: 500,
};

const statBox = {
    flex: 1, background: "#f8fafc", borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    padding: "10px 12px", textAlign: "center",
};