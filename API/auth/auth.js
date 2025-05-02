const jwt = require("jsonwebtoken");

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Authorization token required" 
        });
      }

      const decoded = jwt.verify(token, process.env.SchoolJWT_SECRET);
      
      // Role validation
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ 
            success: false, 
            message: "Insufficient permissions" 
        });
      }

      req.user = decoded;
      next();

    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ 
          success: false, 
          message: "Invalid or expired token" 
      });
    }
  };
};

module.exports = authMiddleware;