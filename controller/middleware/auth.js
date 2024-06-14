const jwt = require('jsonwebtoken');
const secretKey = 'iwishiwasyourjoke'; // Move this to your config file or environment variable

const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(403).send('Token is required');
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).send('Invalid token');
        }
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    authenticateJWT(req, res, () => {
        if (req.user && req.user.isAdmin) {
            next();
        } else {
            return res.status(403).send('Access denied. Only admins can access this route.');
        }
    });
};

const isSiswa = (req, res, next) => {
    authenticateJWT(req, res, () => {
        if (req.user && req.user.isSiswa) {
            next();
        } else {
            return res.status(403).send('Access denied. Only students can access this route.');
        }
    });
};

const isParent = (req, res, next) => {
    authenticateJWT(req, res, () => {
        if (req.user && req.user.isParent) {
            next();
        } else {
            return res.status(403).send('Access denied. Only parents can access this route.');
        }
    });
};

module.exports = {
    isAdmin,
    isSiswa,
    isParent,
    authenticateJWT
};
