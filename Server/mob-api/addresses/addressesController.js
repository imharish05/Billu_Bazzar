'use strict';
const { CustomerAddress } = require('../../models');
const { fail, integer, mutate } = require('../common/shopping');
const fields = { label: 40, name: 120, phone: 20, email: 180, address: 255, addressLine2: 255, landmark: 120, city: 100, state: 100, pincode: 20, country: 100 };
const required = ['name', 'phone', 'address', 'city', 'state', 'pincode', 'country'];
const validate = (body, partial = false) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'A JSON object is required');
  const result = {};
  for (const key of Object.keys(body)) if (!(key in fields) && key !== 'isDefault') fail(400, `Unknown field: ${key}`);
  for (const [key, max] of Object.entries(fields)) {
    if (body[key] === undefined) { if (!partial && required.includes(key)) fail(400, `${key} is required`); continue; }
    if (typeof body[key] !== 'string') fail(400, `${key} must be a string`);
    result[key] = body[key].trim();
    if (result[key].length > max || (!result[key] && (required.includes(key) || key === 'label'))) fail(400, `${key} must contain 1 to ${max} characters`);
  }
  if (result.phone !== undefined && !/^\+?[\d ()-]{7,20}$/.test(result.phone)) fail(400, 'Invalid phone number');
  if (result.phone !== undefined && result.phone.replace(/\D/g, '').length < 7) fail(400, 'Invalid phone number');
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) fail(400, 'Invalid email');
  if (body.isDefault !== undefined) {
    if (typeof body.isDefault !== 'boolean') fail(400, 'isDefault must be a boolean');
    result.isDefault = body.isDefault;
  }
  if (partial && !Object.keys(result).length) fail(400, 'Provide at least one address field');
  return result;
};
const addressId = value => {
  if (!/^[1-9]\d*$/.test(String(value))) fail(400, 'Invalid addressId');
  return integer(Number(value), 'addressId');
};
const owned = async (req, transaction) => {
  const address = await CustomerAddress.findOne({ where: { id: addressId(req.params.addressId), customerId: req.customer.id }, transaction });
  if (!address) fail(404, 'Saved address not found');
  return address;
};
const handle = (work, status = 200) => async (req, res, next) => {
  try { return res.status(status).json({ success: true, ...await work(req) }); }
  catch (error) { if (error.status) return res.status(error.status).json({ success: false, message: error.message }); return next(error); }
};
const clearDefault = (req, transaction) => CustomerAddress.update({ isDefault: false }, { where: { customerId: req.customer.id, isDefault: true }, transaction });
exports.listAddresses = handle(async req => ({ addresses: await CustomerAddress.findAll({ where: { customerId: req.customer.id }, order: [['isDefault', 'DESC'], ['id', 'ASC']] }) }));
exports.getAddress = handle(async req => ({ address: await owned(req) }));
exports.createAddress = handle(async req => {
  const input = validate(req.body);
  return mutate(req, async transaction => {
    const count = await CustomerAddress.count({ where: { customerId: req.customer.id }, transaction });
    const isDefault = count === 0 || input.isDefault === true;
    if (isDefault) await clearDefault(req, transaction);
    return { address: await CustomerAddress.create({ ...input, customerId: req.customer.id, isDefault }, { transaction }) };
  });
}, 201);
exports.updateAddress = handle(async req => {
  const input = validate(req.body, true);
  return mutate(req, async transaction => {
    const address = await owned(req, transaction);
    if (address.isDefault && input.isDefault === false) fail(400, 'Set another saved address as default first');
    if (input.isDefault) await clearDefault(req, transaction);
    await address.update(input, { transaction });
    if (input.isDefault) await CustomerAddress.update({ isDefault: true }, { where: { id: address.id, customerId: req.customer.id }, transaction });
    return { address: await address.reload({ transaction }) };
  });
});
exports.setDefaultAddress = handle(req => mutate(req, async transaction => {
  const address = await owned(req, transaction);
  await clearDefault(req, transaction);
  // Force persistence even if this instance was loaded with isDefault=true.
  await CustomerAddress.update({ isDefault: true }, { where: { id: address.id, customerId: req.customer.id }, transaction });
  return { address: await address.reload({ transaction }) };
}));
exports.deleteAddress = handle(req => mutate(req, async transaction => {
  const address = await owned(req, transaction);
  await address.destroy({ transaction });
  if (address.isDefault) {
    const replacement = await CustomerAddress.findOne({ where: { customerId: req.customer.id }, order: [['id', 'ASC']], transaction });
    if (replacement) await replacement.update({ isDefault: true }, { transaction });
  }
  return { message: 'Saved address deleted' };
}));
// Copy only address fields into the order; future address edits cannot alter it.
exports.resolveOrderAddresses = async (req, res, next) => {
  try {
    const body = req.body || {};
    for (const kind of ['shipping', 'billing']) {
      const idKey = `${kind}AddressId`, valueKey = `${kind}Address`;
      if (body[idKey] === undefined) continue;
      const id = integer(body[idKey], idKey);
      if (body[valueKey] !== undefined) fail(400, `Provide either ${idKey} or ${valueKey}, not both`);
      const row = await CustomerAddress.findOne({ where: { id, customerId: req.customer.id } });
      if (!row) fail(404, 'Saved address not found');
      const plain = row.toJSON();
      body[valueKey] = Object.fromEntries(Object.keys(fields).filter(key => key !== 'label').map(key => [key, plain[key]]));
      body[valueKey].fullName = plain.name;
      body[valueKey].flatHouse = [plain.address, plain.addressLine2].filter(Boolean).join(', ');
      delete body[idKey];
    }
    req.body = body;
    return next();
  } catch (error) { if (error.status) return res.status(error.status).json({ success: false, message: error.message }); return next(error); }
};
