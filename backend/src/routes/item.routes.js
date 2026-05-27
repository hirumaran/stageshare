const express = require('express');
const { authenticateToken: requireAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  getItems,
  getItemById,
  createItem,
  deleteItem,
  updateItem,
  addItemImages,
  deleteItemImage,
} = require('../controllers/item.controller');

const router = express.Router();

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', requireAuth, upload.array('images', 5), createItem);
router.patch('/:id', requireAuth, updateItem);
router.delete('/:id', requireAuth, deleteItem);

router.post('/:id/images', requireAuth, upload.array('images', 5), addItemImages);
router.delete('/:id/images/:imageId', requireAuth, deleteItemImage);

module.exports = router;
