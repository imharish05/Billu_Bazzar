'use strict';
const router = require('express').Router();
const controller = require('./wishlistController');
router.get('/wishlist', controller.getWishlist);
router.post('/wishlist/add', controller.addToWishlist);
router.post('/wishlist/toggle', controller.toggleWishlist);
router.delete('/wishlist/item/:itemId', controller.removeFromWishlist);
router.delete('/wishlist/clear', controller.clearWishlist);
module.exports = router;
