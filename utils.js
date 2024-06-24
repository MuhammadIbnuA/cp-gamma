const getTokenFromHeaders = (headers) => {
  if (headers && headers.authorization) {
    const parts = headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      return parts[1];
    }
  }
  return null;
};

module.exports = { getTokenFromHeaders };
