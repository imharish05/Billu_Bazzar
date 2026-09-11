'use strict';

// All mobile commerce and storefront endpoints are protected and require
// an active customer bearer token.
exports.isPublic = () => false;

exports.middleware = (req, res, next) => {
  return require('./auth')(req, res, next);
};

