const express = require('express');
const { authenticateToken: requireAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  getItems,
  getItemById,
  createItem,
  deleteItem,
} = require('../controllers/item.controller');

const router = express.Router();

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', requireAuth, upload.array('images', 5), createItem);
router.delete('/:id', requireAuth, deleteItem);

module.exports = router;
