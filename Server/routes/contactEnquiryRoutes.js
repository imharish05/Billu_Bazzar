'use strict';

const router = require('express').Router();
const {
  submitContactEnquiry,
  getContactEnquiries,
  getContactEnquiryById,
  updateContactEnquiry,
  deleteContactEnquiry,
  bulkDeleteContactEnquiries,
  sendTestEmail,
} = require('../controllers/contactEnquiryController');
const { verifyAdmin } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');

// Public route: Storefront contact form submit
router.post('/', submitContactEnquiry);

// Admin routes
router.post('/test-email', verifyAdmin, sendTestEmail);
router.get('/', verifyAdmin, hasPermission('view_contact_enquiries'), getContactEnquiries);
router.get('/:id', verifyAdmin, hasPermission('view_contact_enquiries'), getContactEnquiryById);
router.put('/:id', verifyAdmin, hasPermission('manage_customers'), updateContactEnquiry);
router.delete('/bulk', verifyAdmin, hasPermission('delete_contact_enquiry'), bulkDeleteContactEnquiries);
router.delete('/:id', verifyAdmin, hasPermission('delete_contact_enquiry'), deleteContactEnquiry);

module.exports = router;
