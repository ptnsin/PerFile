import React from "react";
import { LuBell, LuCheck, LuCheckCheck, LuUser, LuBriefcase, LuShieldAlert, LuX } from "react-icons/lu";

// ไอคอนตามประเภทการแจ้งเตือน
function NotifIcon({ type }) {
  const style = {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  if (type === "new_hr" || type === "APPROVE_HR")
    return (
      <div style={{ ...style, background: "#ede9fe" }}>
        <LuUser size={15} color="#7c3aed" />
      </div>
    );
  if (type === "new_job" || type === "job")
    return (
      <div style={{ ...style, background: "#dbeafe" }}>
        <LuBriefcase size={15} color="#2563eb" />
      </div>
    );
  if (type === "system" || type === "warning")
    return (
      <div style={{ ...style, background: "#fee2e2" }}>
        <LuShieldAlert size={15} color="#dc2626" />
      </div>
    );
  // default
  return (
    <div style={{ ...style, background: "#f3f4f6" }}>
      <LuBell size={15} color="#6b7280" />
    </div>
  );
}

// ✅ แก้ timeAgo ให้ใช้ timezone Asia/Bangkok
function timeAgo(dateStr) {
  const utcDate = new Date(dateStr);
  const diff = Date.now() - utcDate.getTime();

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อกี้";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;

  // แสดงวันที่จริงในเวลาไทย
  return utcDate.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotificationDropdown({
  open,
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop กด outside ปิด */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          width: 360,
          maxHeight: 480,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          border: "1px solid #e5e7eb",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px 10px",
            borderBottom: "1px solid #f0f0f0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LuBell size={16} color="#4f46e5" />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
              การแจ้งเตือน
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px",
                  lineHeight: "18px",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                title="อ่านทั้งหมด"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#4f46e5",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <LuCheckCheck size={13} /> อ่านทั้งหมด
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: 6,
                color: "#9ca3af",
                display: "flex",
                alignItems: "center",
              }}
            >
              <LuX size={15} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: "30px 0",
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              กำลังโหลด...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 16px",
                color: "#9ca3af",
              }}
            >
              <LuBell size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
              <div style={{ fontSize: 13 }}>ยังไม่มีการแจ้งเตือน</div>
            </div>
          )}

          {!loading &&
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && onMarkAsRead(notif.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: "1px solid #f9fafb",
                  cursor: notif.is_read ? "default" : "pointer",
                  background: notif.is_read ? "#fff" : "#f5f3ff",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!notif.is_read)
                    e.currentTarget.style.background = "#ede9fe";
                }}
                onMouseLeave={(e) => {
                  if (!notif.is_read)
                    e.currentTarget.style.background = "#f5f3ff";
                }}
              >
                <NotifIcon type={notif.type} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: notif.is_read ? 500 : 700,
                      color: "#111827",
                      lineHeight: 1.4,
                    }}
                  >
                    {notif.title || notif.message}
                  </div>
                  {notif.body && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {notif.body}
                    </div>
                  )}
                  <div
                    style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}
                  >
                    {timeAgo(notif.created_at)}
                  </div>
                </div>

                {!notif.is_read && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#4f46e5",
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
            ))}
        </div>
      </div>
    </>
  );
}