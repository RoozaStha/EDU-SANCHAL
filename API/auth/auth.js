const jwt = require("jsonwebtoken");
require("dotenv").config(); // This should be at the top


const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.header("Authorization");
      
      if (!authHeader) {
        return res.status(401).json({ 
          success: false, 
          message: "Authorization header missing" 
        });
      }

      const tokenParts = authHeader.split(' ');
      
      // Check for "Bearer" format
      if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid authorization format. Use 'Bearer <token>'" 
        });
      }

      const token = tokenParts[1];
      
      // Basic token validation
      if (!token || token.split('.').length !== 3) {
        return res.status(401).json({ 
          success: false, 
          message: "Malformed token" 
        });
      }

      const decoded = jwt.verify(token, process.env.SchoolJWT_SECRET);

      req.user = decoded;

      // Role-based access control
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: "Access Denied." 
        });
      }

      next();
    } catch (error) {
      console.error("Authentication error:", error);
      
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid token" 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Authentication failed" 
      });
    }
  };
};

module.exports = authMiddleware;
