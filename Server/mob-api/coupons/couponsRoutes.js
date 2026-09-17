'use strict';
const router = require('express').Router();
const controller = require('./couponsController');

router.get('/coupons', controller.getCoupons);
router.post('/coupons/validate', controller.validate);

module.exports = router;