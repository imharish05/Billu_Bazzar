'use strict';
const { Op, literal, where: sqlWhere } = require('sequelize');
const { Product, Category, SubCategory, ProductVariant } = require('../../models');
const { formatMobileProducts, omittedFields } = require('./productResponse');
const sorts = { price_asc: ['price', 'ASC'], price_desc: ['price', 'DESC'], newest: ['createdAt', 'DESC'], rating: ['rating', 'DESC'] };
const collections = { 'new-arrivals': 'isNewArrival', 'best-sellers': 'isBestSeller', featured: 'isFeatured' };
const invalid = message => Object.assign(new Error(message), { status: 400 });

const parseFilters = (query, requireSearch = false) => {
  const number = (key, fallback, max = Number.MAX_SAFE_INTEGER, integer = false) => {
    if (query[key] === undefined) return fallback;
    const raw = query[key];
    if (typeof raw !== 'string' || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(raw)) throw invalid(`${key} must be a valid non-negative number`);
    const value = Number(raw);
    if (!Number.isFinite(value) || value > max || (integer && (!Number.isSafeInteger(value) || value < 1))) throw invalid(`${key} is outside the allowed range`);
    return value;
  };
  const q = query.q === undefined ? '' : query.q;
  if (typeof q !== 'string' || q.trim().length > 200 || (requireSearch && !q.trim())) throw invalid('q must contain 1 to 200 characters for product search');
  const sort = query.sort === undefined ? 'newest' : query.sort;
  if (typeof sort !== 'string' || !Object.hasOwn(sorts, sort)) throw invalid('sort must be price_asc, price_desc, newest, or rating');
  let selectedCollections = [];
  if (query.collection !== undefined) {
    if (typeof query.collection !== 'string') throw invalid('collection must be a comma-separated string');
    selectedCollections = [...new Set(query.collection.split(',').map(value => value.trim()))];
    if (selectedCollections.some(value => !Object.hasOwn(collections, value))) throw invalid('collection must contain new-arrivals, best-sellers, or featured');
  }
  const filters = {
    q: q.trim(), sort, collections: selectedCollections,
    categoryId: number('categoryId', undefined, Number.MAX_SAFE_INTEGER, true),
    subCategoryId: number('subCategoryId', undefined, Number.MAX_SAFE_INTEGER, true),
    page: number('page', 1, Number.MAX_SAFE_INTEGER, true),
    limit: number('limit', 20, 100, true),
    minPrice: number('minPrice', undefined), maxPrice: number('maxPrice', undefined),
    minDiscount: number('minDiscount', undefined, 100), maxDiscount: number('maxDiscount', undefined, 100),
  };
  if (!Number.isSafeInteger((filters.page - 1) * filters.limit)) throw invalid('page is too large');
  for (const [min, max] of [['minPrice', 'maxPrice'], ['minDiscount', 'maxDiscount']]) {
    if (filters[min] !== undefined && filters[max] !== undefined && filters[min] > filters[max]) throw invalid(`${min} must not exceed ${max}`);
  }
  return filters;
};

const buildQuery = filters => {
  const where = { isActive: true };
  if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
  if (filters.subCategoryId !== undefined) where.subCategoryId = filters.subCategoryId;
  if (filters.q) where.name = { [Op.like]: `%${filters.q.replace(/[\\%_]/g, value => '\\' + value)}%` };
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price[Op.gte] = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price[Op.lte] = filters.maxPrice;
  }
  if (filters.collections.length) where[Op.or] = filters.collections.map(key => ({ [collections[key]]: true }));
  if (filters.minDiscount !== undefined || filters.maxDiscount !== undefined) {
    // Fixed SQL expression: no request values are interpolated into SQL.
    const discount = literal('CASE WHEN `Product`.`comparePrice` > 0 AND `Product`.`comparePrice` > `Product`.`price` THEN ROUND((`Product`.`comparePrice` - `Product`.`price`) / `Product`.`comparePrice` * 100) ELSE 0 END');
    where[Op.and] = [];
    if (filters.minDiscount !== undefined) where[Op.and].push(sqlWhere(discount, { [Op.gte]: filters.minDiscount }));
    if (filters.maxDiscount !== undefined) where[Op.and].push(sqlWhere(discount, { [Op.lte]: filters.maxDiscount }));
  }
  return {
    attributes: { exclude: omittedFields },
    where, distinct: true, limit: filters.limit, offset: (filters.page - 1) * filters.limit,
    order: [sorts[filters.sort], ['id', 'DESC']],
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      { model: SubCategory, as: 'subcategory', attributes: ['id', 'categoryId', 'name', 'slug'] },
      { model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'price', 'priceAED', 'mrp', 'mrpAED', 'stock', 'attributes', 'colorHex', 'image', 'images', 'gstRate'] },
    ],
  };
};

const handler = requireSearch => async (req, res) => {
  try {
    const filters = parseFilters(req.query, requireSearch);
    if (filters.categoryId !== undefined && !await Category.findOne({ where: { id: filters.categoryId, isActive: true }, attributes: ['id'] })) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (filters.subCategoryId !== undefined) {
      const sub = await SubCategory.findOne({ where: { id: filters.subCategoryId, isActive: true }, attributes: ['id', 'categoryId'] });
      if (!sub) return res.status(404).json({ success: false, message: 'Subcategory not found' });
      if (filters.categoryId !== undefined && sub.categoryId !== filters.categoryId) throw invalid('Subcategory does not belong to the selected category');
      if (filters.categoryId === undefined && !await Category.findOne({ where: { id: sub.categoryId, isActive: true }, attributes: ['id'] })) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
    }
    const { rows, count } = await Product.findAndCountAll(buildQuery(filters));
    const totalPages = Math.ceil(count / filters.limit);
    return res.json({ success: true, products: await formatMobileProducts(rows, req), total: count, page: filters.page, limit: filters.limit, totalPages, hasMore: filters.page < totalPages });
  } catch (err) {
    return res.status(err.status === 400 ? 400 : 500).json({ success: false, message: err.status === 400 ? err.message : 'Unable to fetch products' });
  }
};
module.exports = { parseFilters, buildQuery, list: handler(false), search: handler(true) };
