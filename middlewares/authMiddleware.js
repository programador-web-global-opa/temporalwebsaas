const config = require('../config/config');

const authMiddleware = (req, res, next) => {
  if (!req.session?.user) {
    return res.redirect('/auth/login');
  }

  const elapsed = Date.now() - (req.session.user.loginAt ?? 0);
  if (elapsed > config.sessionMaxAge) {
    req.session.destroy(() => res.redirect('/auth/login'));
    return;
  }

  next();
};

module.exports = authMiddleware;
