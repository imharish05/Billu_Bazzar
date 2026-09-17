'use strict';
const search = require('../../controllers/searchController');
const { Op } = require('sequelize');
const { Product } = require('../../models');

exports.suggestions = async (req, res) => {
  const { q, limit = '6' } = req.query;
  if (typeof q !== 'string' || !q.trim() || q.trim().length > 200) {
    return res.status(400).json({ success: false, message: 'q must contain 1 to 200 characters' });
  }
  if (!/^[1-9]\d*$/.test(String(limit)) || !Number.isSafeInteger(Number(limit))) {
    return res.status(400).json({ success: false, message: 'limit must be a positive integer' });
  }
  try {
    const query = q.trim();
    // Treat typed percent/underscore characters literally, not as SQL wildcards.
    const escaped = query.replace(/[\\%_]/g, value => '\\' + value);
    const products = await Product.findAll({
      where: { isActive: true, name: { [Op.like]: `%${escaped}%` } },
      attributes: ['id', 'name'],
      order: [['name', 'ASC'], ['id', 'ASC']],
      limit: Math.min(Number(limit), 100),
    });
    return res.json({ success: true, query, suggestions: products.map(product => ({ id: product.id, name: product.name })) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to fetch product suggestions' });
  }
};

// Compatibility alias for mobile clients using the previous URL.
exports.autocomplete = exports.suggestions;

exports.trending = (req, res, next) => search.trending(req, res, next);

exports.track = (req, res, next) => search.track(req, res, next);
