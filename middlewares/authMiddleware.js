const config = require('../config/config');

const authMiddleware = (req, res, next) => {
  const user = req.session?.user;

  if (!user) return res.redirect('/auth/login');

  const elapsed = Date.now() - (user.loginAt ?? 0);
  if (elapsed > config.sessionMaxAge) {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect('/auth/login');
    });
    return;
  }

  if (!user.tokenWeb) {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect('/auth/login')
    });
    return;
  }

  next();
};

module.exports = authMiddleware;
