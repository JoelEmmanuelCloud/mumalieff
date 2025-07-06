const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const folder = req.query.uploadType === 'custom-design' 
      ? 'mumalieff/custom-designs' 
      : 'mumalieff/products';

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder,
      resource_type: 'auto',
    });

    await unlinkFile(req.file.path);


    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {

    if (req.file) {
      await unlinkFile(req.file.path).catch(() => {});
    }
    
    res.status(500);
    throw new Error(`Upload failed: ${error.message}`);
  }
});

const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  try {
 
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