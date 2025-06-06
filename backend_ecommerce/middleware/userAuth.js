const jwt = require('jsonwebtoken');
const User = require("../model/user")
const userAuth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ status: 0, message: 'Authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.USER_SECRET_KEY);
    if (decoded?.id) {
      const user = User.findOne({ where: { id: decoded?.id, isActive: true } })
      if (!user) return res.status(401).json({ status: 0, message: 'Account not found' });
      req.user = user;
      next();
    } else {
      return res.status(401).json({ status: 0, message: 'Authorization denied' });
    }
  } catch (err) {
    res.status(401).json({ status: 0, message: 'Token is not valid' });
  }
};

module.exports = userAuth;
