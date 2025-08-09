exports.requireAdmin = (req, res, next) => {
  if (!req.creator || req.creator.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};
