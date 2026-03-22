export const checkAccountStatus = (req, res, next) => {
  if (req.user.status === 'BANNED' || req.user.status === 'SUSPENDED') {
    return res.status(403).json({ message: 'บัญชีถูกระงับการใช้งาน' })
  }

  if (req.user.role === 'HR' && req.user.hrStatus !== 'APPROVED') {
    return res.status(403).json({ message: 'บัญชี HR ยังไม่ได้รับการอนุมัติ' })
  }

  next()
}