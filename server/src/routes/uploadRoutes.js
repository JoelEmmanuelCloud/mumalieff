const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadMiddleware');
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { protect, admin } = require('../middleware/authMiddleware');

const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(path.dirname(require.main.filename), '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post('/', protect, upload.single('image'), uploadImage);
router.delete('/:publicId', protect, admin, deleteImage);

module.exports = router;