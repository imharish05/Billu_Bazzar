'use strict';
const product = require('../../controllers/productController');
const productSearch = require('./productSearch');

exports.getAll = productSearch.list;

exports.getFeatured = (req, res, next) => product.getFeatured(req, res, next);

exports.search = productSearch.search;

exports.getPriceRange = (req, res, next) => product.getPriceRange(req, res, next);

exports.getOne = (req, res, next) => product.getOne(req, res, next);

const { Product, ProductVariant } = require('../../models');
const variant = require('../../controllers/variantController');
exports.getAllVariants = async (req, res, next) => {
  const parseBoundedInteger = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (!/^[1-9]\d*$/.test(String(value))) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) && number <= max ? number : null;
  };
  const page = parseBoundedInteger(req.query.page, 1, 1000000);
  const limit = parseBoundedInteger(req.query.limit, 20, 100);
  if (page === null || limit === null) return res.status(400).json({ success: false, message: 'page and limit must be positive integers; limit cannot exceed 100' });
  try {
    const { rows, count } = await ProductVariant.findAndCountAll({
      attributes: ['id', 'productId', 'sku', 'price', 'mrp', 'priceAED', 'mrpAED', 'stock', 'attributes', 'colorHex', 'image', 'images', 'gstRate'],
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'slug'], where: { isActive: true }, required: true }],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });
    return res.json({ success: true, variants: rows, total: count, page, limit, totalPages: Math.ceil(count / limit), hasMore: page * limit < count });
  } catch (err) { return next(err); }
};
exports.getVariants = async (req, res, next) => {
  try {
    const product = await Product.findOne({ where: { id: req.params.productId, isActive: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return variant.getByProduct(req, res, next);
  } catch (err) { return next(err); }
};
