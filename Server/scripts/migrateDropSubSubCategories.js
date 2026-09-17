'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');

async function runMigration() {
  let sequelize;
  try {
    sequelize = require('../config/db');
    await sequelize.authenticate();
    console.log('Connected using default db config');
  } catch (err) {
    console.log('Default connection failed. Attempting local root connection...');
    sequelize = new Sequelize('billu_bazaar', 'root', '', {
      host: 'localhost',
      dialect: 'mysql',
      logging: false,
    });
    await sequelize.authenticate();
    console.log('Connected using local root fallback');
  }

  try {
    try {
      const [fks] = await sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'products' 
          AND COLUMN_NAME = 'subSubCategoryId' 
          AND CONSTRAINT_NAME != 'PRIMARY'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      for (const fk of fks) {
        console.log('Dropping FK constraint: ' + fk.CONSTRAINT_NAME);
        await sequelize.query('ALTER TABLE products DROP FOREIGN KEY `' + fk.CONSTRAINT_NAME + '`');
      }
    } catch (fkErr) {
      console.log('Note on FK check:', fkErr.message);
    }

    try {
      const [indexes] = await sequelize.query(`
        SHOW INDEX FROM products WHERE Key_name = 'subSubCategoryId'
      `);
      if (indexes.length > 0) {
        console.log('Dropping index subSubCategoryId from products');
        await sequelize.query('ALTER TABLE products DROP INDEX `subSubCategoryId`');
      }
    } catch (idxErr) {
      console.log('Note on index drop:', idxErr.message);
    }

    try {
      const [cols] = await sequelize.query(`
        SHOW COLUMNS FROM products LIKE 'subSubCategoryId'
      `);
      if (cols.length > 0) {
        console.log('Dropping column subSubCategoryId from products table');
        await sequelize.query('ALTER TABLE products DROP COLUMN `subSubCategoryId`');
        console.log('Column subSubCategoryId dropped from products table');
      } else {
        console.log('Column subSubCategoryId already dropped or does not exist');
      }
    } catch (colErr) {
      console.log('Error dropping column subSubCategoryId:', colErr.message);
    }

    console.log('Dropping table subsubcategories if exists');
    await sequelize.query('DROP TABLE IF EXISTS SubSubCategories');
    await sequelize.query('DROP TABLE IF EXISTS subsubcategories');
    console.log('Table subsubcategories dropped');

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

runMigration();
