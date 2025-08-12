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
    console.log('🔍 Decoded token contents:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    });
    
    // Ensure the creator object is properly set
    req.creator = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    console.log('🔒 req.creator set successfully:', req.creator);
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  console.log('🔒 ADMIN CHECK - Starting admin verification...');
  console.log('🔒 ADMIN CHECK - req.creator exists:', !!req.creator);
  console.log('🔒 ADMIN CHECK - req.creator type:', typeof req.creator);
  console.log('🔒 ADMIN CHECK - User object:', req.creator);
  console.log('🔒 ADMIN CHECK - User role:', req.creator?.role);
  console.log('🔒 ADMIN CHECK - Is admin?', req.creator?.role === 'ADMIN');
  
  if (!req.creator) {
    console.log('❌ ADMIN ACCESS DENIED - req.creator is undefined');
    return res.status(403).json({ error: 'Admin access required - User not authenticated' });
  }
  
  if (req.creator.role !== 'ADMIN') {
    console.log('❌ ADMIN ACCESS DENIED - User role is not ADMIN:', req.creator.role);
    return res.status(403).json({ error: 'Admin access required - Insufficient privileges' });
  }
  
  console.log('✅ ADMIN ACCESS GRANTED');
  next();
};

module.exports = { verifyToken, requireAdmin };
