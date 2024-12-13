const jwt = require('jsonwebtoken');

module.exports.authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = jwt.verify(token, process.env.SECRET);
        req.role = decodedToken.role;
        req.id = decodedToken.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token is invalid or expired' });
    }
};