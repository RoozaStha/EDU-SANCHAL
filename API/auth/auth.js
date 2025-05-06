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

      // Decode token to get role before verification
      const decodedUnverified = jwt.decode(token);
      
      if (!decodedUnverified?.role) {
        return res.status(401).json({
          success: false,
          message: "Invalid token structure"
        });
      }

      // Get appropriate secret based on role
      const getSecret = () => {
        switch(decodedUnverified.role) {
          case 'SCHOOL':
            return process.env.SchoolJWT_SECRET;
          case 'TEACHER':
            return process.env.TEACHER_JWT_SECRET;
          case 'STUDENT':
            return process.env.STUDENT_JWT_SECRET;
          default:
            throw new Error('Invalid role type');
        }
      };

      const secret = getSecret();
      
      // Verify token with correct secret
      const decoded = jwt.verify(token, secret);

      // Verify role access
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ 
          success: false, 
          message: "Insufficient permissions" 
        });
      }

      // Attach user data to request
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
        message = "Invalid token format";
      } else if (error.message === 'Invalid role type') {
        message = "Unrecognized user role";
      }
      
      res.status(401).json({ 
        success: false, 
        message: message,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};