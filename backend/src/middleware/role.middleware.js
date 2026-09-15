export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required.' });
  }
};

export const requireMember = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized access.' });
  }
};
