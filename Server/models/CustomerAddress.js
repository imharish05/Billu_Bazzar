'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
module.exports = sequelize.define('CustomerAddress', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  label: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Home' },
  name: { type: DataTypes.STRING(120), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  email: { type: DataTypes.STRING(180), allowNull: false, defaultValue: '' },
  address: { type: DataTypes.STRING(255), allowNull: false },
  addressLine2: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
  landmark: { type: DataTypes.STRING(120), allowNull: false, defaultValue: '' },
  city: { type: DataTypes.STRING(100), allowNull: false },
  state: { type: DataTypes.STRING(100), allowNull: false },
  pincode: { type: DataTypes.STRING(20), allowNull: false },
  country: { type: DataTypes.STRING(100), allowNull: false },
  isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'CustomerAddresses', indexes: [{ fields: ['customerId', 'isDefault'] }] });
