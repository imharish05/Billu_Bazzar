'use strict';
const router = require('express').Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, syncCart, mergeCart, getAbandonedCarts, sendAbandonedCartEmail } = require('../controllers/cartController');
const { optionalCustomer, verifyCustomer, verifyAdmin } = require('../middleware/auth');

router.get('/', optionalCustomer, getCart);
router.post('/add', optionalCustomer, addToCart);
router.post('/sync', optionalCustomer, syncCart);
router.post('/merge', verifyCustomer, mergeCart);
router.put('/item/:itemId', optionalCustomer, updateCartItem);
router.delete('/item/:itemId', optionalCustomer, removeFromCart);
router.delete('/clear', optionalCustomer, clearCart);

// Admin endpoints
router.get('/admin/abandoned', verifyAdmin, getAbandonedCarts);
router.post('/admin/send-email', verifyAdmin, sendAbandonedCartEmail);

module.exports = router;
