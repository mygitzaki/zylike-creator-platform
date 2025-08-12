const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  console.log('🔒 Auth middleware - verifying token for:', req.url);
  const authHeader = req.headers.authorization;
  console.log('🔍 Auth header present:', !!authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid auth header found');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔑 Token extracted:', token ? 'Present' : 'Missing');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified successfully for creator:', decoded.id);
    req.creator = decoded; // ✅ renamed from req.user to req.creator
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  console.log('🔒 ADMIN CHECK - User object:', req.creator);
  console.log('🔒 ADMIN CHECK - User role:', req.creator?.role);
  console.log('🔒 ADMIN CHECK - Is admin?', req.creator?.role === 'ADMIN');
  
  if (!req.creator || req.creator.role !== 'ADMIN') {
    console.log('❌ ADMIN ACCESS DENIED - Role check failed');
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  console.log('✅ ADMIN ACCESS GRANTED');
  next();
};

module.exports = { verifyToken, requireAdmin };
