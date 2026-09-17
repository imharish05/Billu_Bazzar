'use strict';
const category = require('../../controllers/categoryController');
const subCategory = require('../../controllers/subCategoryController');
const { Category } = require('../../models');

exports.getTree = (req, res, next) => category.getTree(req, res, next);

// Mobile lists are unpaginated. Keep web/admin query behavior unchanged.
const withQuery = (req, query) => {
  const request = Object.create(req);
  Object.defineProperty(request, 'query', { value: query, configurable: true });
  return request;
};

exports.getAll = (req, res, next) => category.getAll(withQuery(req, {}), res, next);

exports.getSubCategories = async (req, res, next) => {
  const { categoryId } = req.query;
  if (categoryId !== undefined && (!/^[1-9]\d*$/.test(String(categoryId)) || !Number.isSafeInteger(Number(categoryId)))) {
    return res.status(400).json({ success: false, message: 'categoryId must be a positive integer' });
  }
  try {
    if (categoryId !== undefined) {
      const parent = await Category.findOne({
        where: { id: Number(categoryId), isActive: true },
        attributes: ['id'],
      });
      if (!parent) return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return await subCategory.getAll(withQuery(req, categoryId === undefined ? {} : { categoryId }), res, next);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to fetch subcategories' });
  }
};
