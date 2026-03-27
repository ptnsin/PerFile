export const requireRole = (...roles) => {
  return (req, res, next) => {
    // 1. เช็คก่อนว่ามี req.user ไหม (ถ้าไม่มี แปลว่าลืมใส่ authMiddleware ไว้ข้างหน้า)
    if (!req.user) {
      return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    }

    // 2. เช็คว่ามีค่า role หรือ roles_id ใน req.user ไหม 
    // (ลองเช็คดูว่าใน Token คุณใช้ชื่อว่า role หรือ roles_id นะครับ)
    const userRole = req.user.role || req.user.roles_id;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
    }

    next();
  };
};