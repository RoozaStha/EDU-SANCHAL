const jwt = require('jsonwebtoken');

module.exports = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: "Authorization token required" 
        });
      }

      // Verify token
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
        schoolId: decoded.schoolId,
        role: decoded.role,
        email: decoded.email,
        name: decoded.name,
        image_url: decoded.image_url
      };

      next();
    } catch (error) {
      console.error("Authentication error:", error);
      let message = "Invalid authentication token";
      if (error instanceof jwt.TokenExpiredError) {
        message = "Session expired. Please login again";
      } else if (error instanceof jwt.JsonWebTokenError) {
        message = "Invalid token";
      }
      
      res.status(401).json({ 
        success: false, 
        message: message,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};