const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
    const authorization = req.get("Authorization");
    const match = authorization && authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        return res.status(401).json({
            error: { message: "Authentication required. Send a Bearer token." }
        });
    }

    try {
        const payload = jwt.verify(match[1], process.env.JWT_SECRET);
        if (typeof payload === "string" || !payload.sub) {
            return res.status(401).json({
                error: { message: "Invalid or expired token." }
            });
        }
        req.user = { id: payload.sub };
        return next();
    } catch (error) {
        if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
            return res.status(401).json({
                error: { message: "Invalid or expired token." }
            });
        }
        return next(error);
    }
}

module.exports = requireAuth;
