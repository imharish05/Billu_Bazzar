'use strict';
const router = require('express').Router();
const controller = require('./offersController');

router.get('/offers', controller.getCoupons);
router.post('/offers/validate', controller.validate);

module.exports = router;
