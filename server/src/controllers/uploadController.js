const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @desc    Upload file to Cloudinary
 * @route   POST /api/upload
 * @access  Private
 */
const uploadImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    // Determine folder based on uploadType query parameter
    const folder = req.query.uploadType === 'custom-design' 
      ? 'mumalieff/custom-designs' 
      : 'mumalieff/products';

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder,
      resource_type: 'auto',
    });

    // Delete file from server after upload
    await unlinkFile(req.file.path);

    // Return Cloudinary URL and public_id
    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    // Delete file from server if upload fails
    if (req.file) {
      await unlinkFile(req.file.path).catch(() => {});
    }
    
    res.status(500);
    throw new Error(`Upload failed: ${error.message}`);
  }
});

/**
 * @desc    Delete file from Cloudinary
 * @route   DELETE /api/upload/:publicId
 * @access  Private/Admin
 */
const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  try {
    // Delete image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(400);
      throw new Error('Failed to delete image');
    }
  } catch (error) {
    res.status(500);
    throw new Error(`Deletion failed: ${error.message}`);
  }
});

module.exports = {
  uploadImage,
  deleteImage,
};