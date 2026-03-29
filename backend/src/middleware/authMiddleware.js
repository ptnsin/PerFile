import jwt from 'jsonwebtoken'

export const authMiddleware = (req, res, next) => {
  console.log("Current JWT_SECRET:", process.env.JWT_SECRET);
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: "No token" })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY")
    req.user = decoded
    next()
  } catch (err) {
    console.error("JWT Error Name:", err.name); // จะบอกว่าเป็น TokenExpiredError หรือ JsonWebTokenError
    console.error("JWT Error Message:", err.message); // จะบอกสาเหตุละเอียด
    return res.status(401).json({ message: "Invalid token", error: err.message })
  }
}