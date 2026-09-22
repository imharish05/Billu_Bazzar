'use strict';
const router = require('express').Router();
const { getAll, getOne, getWishlist, toggleWishlist, syncWishlist, getLoyalty, getTickets, createTicket } = require('../controllers/customerController');
const { verifyCustomer, verifyAdmin } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');

// Saved addresses share ownership and validation rules with the mobile API.
const addresses = require('../mob-api/addresses/addressesController');
const addressAuth = require('../mob-api/common/auth');
router.get('/addresses', addressAuth, addresses.listAddresses);
router.post('/addresses', addressAuth, addresses.createAddress);
router.get('/addresses/:addressId', addressAuth, addresses.getAddress);
router.put('/addresses/:addressId', addressAuth, addresses.updateAddress);
router.put('/addresses/:addressId/default', addressAuth, addresses.setDefaultAddress);
router.delete('/addresses/:addressId', addressAuth, addresses.deleteAddress);

// Customer self-service routes
router.get('/wishlist', verifyCustomer, getWishlist);
router.post('/wishlist', verifyCustomer, toggleWishlist);
router.post('/wishlist/sync', verifyCustomer, syncWishlist);
router.get('/loyalty', verifyCustomer, getLoyalty);
router.get('/tickets', verifyCustomer, getTickets);
router.post('/tickets', verifyCustomer, createTicket);

// Admin-only routes
router.get('/', verifyAdmin, hasPermission('view_customers'), getAll);
router.get('/:id', verifyAdmin, hasPermission('view_customers'), getOne);

module.exports = router;
