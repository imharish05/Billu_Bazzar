'use strict';
const router = require('express').Router();
const { getAll, getPublic, getOne, create, update, remove, getOrders, trackClick } = require('../controllers/affiliateController');
const { verifyAdmin } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');
const upload = require('../middleware/upload');

// Safe upload wrapper: only invoke multer when Content-Type is multipart/form-data
// and handle errors immediately so requests never hang or time out.
const handleUpload = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.single('documentProof')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
      }
      next();
    });
  } else {
    next();
  }
};

router.get('/public', getPublic);
router.get('/track', trackClick);

// GET / - Public for storefront (when called with no params), strictly authenticated for admin panel
router.get('/', (req, res, next) => {
  const isExplicitAdminRequest = req.query.page !== undefined || 
                                req.query.limit !== undefined || 
                                req.query.search !== undefined || 
                                Boolean(req.headers.authorization);

  if (isExplicitAdminRequest) {
    return verifyAdmin(req, res, (err) => {
      if (err) return next(err);
      return hasPermission('manage_affiliates')(req, res, next);
    });
  }
  return getPublic(req, res);
}, getAll);
router.get('/:id', verifyAdmin, hasPermission('manage_affiliates'), getOne);
router.post('/', verifyAdmin, hasPermission('manage_affiliates'), handleUpload, create);
router.put('/:id', verifyAdmin, hasPermission('manage_affiliates'), handleUpload, update);
router.delete('/:id', verifyAdmin, hasPermission('manage_affiliates'), remove);
router.get('/:id/orders', verifyAdmin, hasPermission('manage_affiliates'), getOrders);

module.exports = router;
