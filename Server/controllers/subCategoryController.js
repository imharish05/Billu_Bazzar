'use strict';
const { Category, SubCategory, Product, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

const handleDBError = (err, res, type = 'item') => {
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ success: false, message: `A ${type} with this name or slug already exists.` });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ success: false, message: 'Foreign key constraint fails. Please verify that all parent links are valid.' });
  }
  if (err.name === 'SequelizeValidationError') {
    const msg = err.errors.map(e => e.message).join(', ');
    return res.status(400).json({ success: false, message: msg });
  }
  return res.status(500).json({ success: false, message: err.message });
};

const { deleteLocalFile } = require('../utils/fileHelper');
const { deleteProductsCascade } = require('../services/productCascadeService');
const { toAbsoluteUrl } = require('../utils/imageUrl');

const formatSubCategory = (sub, req) => {
  if (!sub) return sub;
  const json = typeof sub.toJSON === 'function' ? sub.toJSON() : { ...sub };
  if (json.image) json.image = toAbsoluteUrl(json.image, req);
  return json;
};

const getAll = async (req, res) => {
  try {
    const { all, page, limit, categoryId, search } = req.query;
    const { Op } = require('sequelize');
    const where = {};
    if (!all) where.isActive = true;
    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = { [Op.like]: `%${search}%` };

    if (page !== undefined || limit !== undefined) {
      const p = Math.max(1, parseInt(page || 1, 10));
      const l = Math.max(1, parseInt(limit || 10, 10));

      const { count, rows } = await SubCategory.findAndCountAll({
        where,
        attributes: ['id', 'categoryId', 'name', 'slug', 'image', 'sortOrder', 'isActive'],
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
        order: [['sortOrder', 'ASC']],
        limit: l,
        offset: (p - 1) * l
      });

      return res.json({
        success: true,
        subCategories: rows.map(r => formatSubCategory(r, req)),
        total: count,
        page: p,
        limit: l,
        totalPages: Math.ceil(count / l)
      });
    }

    const subCategories = await SubCategory.findAll({
      where,
      attributes: ['id', 'categoryId', 'name', 'slug', 'image', 'sortOrder', 'isActive'],
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['sortOrder', 'ASC']]
    });
    res.json({ success: true, subCategories: subCategories.map(s => formatSubCategory(s, req)) });
  } catch (err) {
    return handleDBError(err, res, 'subcategory');
  }
};

const create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      if (req.file.size > 5 * 1024 * 1024) {
        const normalizedPath = req.file.path.replace(/\\/g, '/');
        const uploadsIndex = normalizedPath.indexOf('uploads');
        deleteLocalFile('/' + normalizedPath.substring(uploadsIndex));
        return res.status(400).json({ success: false, message: 'Sub-category image file size exceeds 5MB limit. Please upload an image under 5MB.' });
      }
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      const uploadsIndex = normalizedPath.indexOf('uploads');
      data.image = '/' + normalizedPath.substring(uploadsIndex);
    }
    if (data.isActive !== undefined) {
      data.isActive = data.isActive === 'true' || data.isActive === true;
    }
    const subCategory = await SubCategory.create(data);
    const fresh = await SubCategory.findByPk(subCategory.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
    });
    res.status(201).json({ success: true, subCategory: formatSubCategory(fresh, req) });
  } catch (err) {
    return handleDBError(err, res, 'sub-category');
  }
};

const update = async (req, res) => {
  try {
    const subCategory = await SubCategory.findByPk(req.params.id);
    if (!subCategory) {
      return res.status(404).json({ success: false, message: 'Sub-category not found' });
    }
    const data = { ...req.body };
    if (req.file) {
      if (req.file.size > 5 * 1024 * 1024) {
        const normalizedPath = req.file.path.replace(/\\/g, '/');
        const uploadsIndex = normalizedPath.indexOf('uploads');
        deleteLocalFile('/' + normalizedPath.substring(uploadsIndex));
        return res.status(400).json({ success: false, message: 'Sub-category image file size exceeds 5MB limit. Please upload an image under 5MB.' });
      }
      deleteLocalFile(subCategory.image);
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      const uploadsIndex = normalizedPath.indexOf('uploads');
      data.image = '/' + normalizedPath.substring(uploadsIndex);
    }
    if (data.isActive !== undefined) {
      data.isActive = data.isActive === 'true' || data.isActive === true;
    }
    await subCategory.update(data);
    const fresh = await SubCategory.findByPk(subCategory.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
    });
    res.json({ success: true, subCategory: formatSubCategory(fresh, req) });
  } catch (err) {
    return handleDBError(err, res, 'sub-category');
  }
};

const remove = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const subCategory = await SubCategory.findByPk(id, { transaction });
    if (!subCategory) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Sub-category not found' });
    }

    // 1. Find all products linked to this sub-category
    const products = await Product.findAll({
      where: { subCategoryId: id },
      attributes: ['id'],
      transaction
    });
    const productIds = products.map(p => p.id);

    // 2. Cascade delete linked products and their variants (preserves product & variant images on disk)
    if (productIds.length > 0) {
      await deleteProductsCascade(productIds, transaction);
    }

    // 3. Delete sub-category image file from disk
    if (subCategory.image) {
      deleteLocalFile(subCategory.image);
    }

    // 4. Destroy the sub-category record
    await subCategory.destroy({ transaction });

    await transaction.commit();
    res.json({
      success: true,
      message: 'Sub-category and all linked products and variants have been deleted successfully.'
    });
  } catch (err) {
    await transaction.rollback();
    return handleDBError(err, res, 'sub-category');
  }
};

const reorder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items array required' });
    }
    await Promise.all(
      items.map(({ id, sortOrder }) => SubCategory.update({ sortOrder }, { where: { id } }))
    );
    res.json({ success: true });
  } catch (err) {
    return handleDBError(err, res, 'sub-category');
  }
};

module.exports = { getAll, create, update, remove, reorder };
