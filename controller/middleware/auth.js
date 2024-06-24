const jwt = require("jsonwebtoken");
const config = require("../../config");
const { getTokenFromHeaders } = require("../../utils");
const secretKey = config.jwt.secret; // Move this to your config file or environment variable

// Middleware to authenticate and authorize based on roles
const authenticateToken = (req, res, next) => {
  const token = getTokenFromHeaders(req.headers);

  if (!token) {
    return res.status(401).send("Access token missing or invalid");
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).send("Invalid token");
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    next();
  } else {
    res.status(403).send("Access denied");
  }
};

const isSiswa = (req, res, next) => {
  if (req.user.isSiswa) {
    next();
  } else {
    res.status(403).send("Access denied");
  }
};

const isParent = (req, res, next) => {
  if (req.user.isParent) {
    next();
  } else {
    res.status(403).send("Access denied");
  }
};

module.exports = { authenticateToken, isAdmin, isSiswa, isParent };
