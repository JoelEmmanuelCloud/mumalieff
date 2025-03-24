// Example: server/src/utils/uploadToCloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload your local images to Cloudinary
const uploadImage = async (filePath, folder = 'mumalieff/products') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

module.exports = { uploadImage };