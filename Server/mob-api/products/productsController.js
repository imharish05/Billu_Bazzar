'use strict';
const product = require('../../controllers/productController');
const productSearch = require('./productSearch');

exports.getAll = productSearch.list;

exports.getFeatured = (req, res, next) => product.getFeatured(req, res, next);

exports.search = productSearch.search;

exports.getPriceRange = (req, res, next) => product.getPriceRange(req, res, next);

exports.getOne = (req, res, next) => product.getOne(req, res, next);

const { Product } = require('../../models');
const variant = require('../../controllers/variantController');
exports.getVariants = async (req, res, next) => {
  try {
    const product = await Product.findOne({ where: { id: req.params.productId, isActive: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return variant.getByProduct(req, res, next);
  } catch (err) { return next(err); }
};

