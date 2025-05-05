const jwt = require('jsonwebtoken');

module.exports = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: "Authorization token required" 
        });
      }

      const decoded = jwt.verify(token, process.env.SchoolJWT_SECRET);
      
      // Verify role access
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ 
          success: false, 
          message: "Insufficient permissions" 
        });
      }

      // Attach full user data to request
      req.user = {
        id: decoded.id,
        schoolId: decoded.schoolId, // Ensure this exists
        role: decoded.role,
        email: decoded.email
      };

      next();
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(401).json({ 
        success: false, 
        message: error instanceof jwt.TokenExpiredError 
          ? "Session expired. Please login again" 
          : "Invalid authentication token"
      });
    }
  };
};