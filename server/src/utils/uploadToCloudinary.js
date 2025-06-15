const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const util = require('util');
const sharp = require('sharp'); // For image processing
const unlinkFile = util.promisify(fs.unlink);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @desc    Upload file to Cloudinary with enhanced processing
 * @route   POST /api/upload
 * @access  Private
 */
const uploadImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const uploadType = req.query.uploadType || 'product';
    let folder, transformation = {};

    // Determine folder and transformations based on upload type
    switch (uploadType) {
      case 'custom-design':
        folder = 'mumalieff/custom-designs';
        // Optimize for printing - high quality, specific DPI
        transformation = {
          quality: 'auto:best',
          format: 'png',
          flags: 'preserve_transparency',
          dpr: '2.0'
        };
        break;
      case 'conviction-product':
        folder = 'mumalieff/conviction-products';
        transformation = {
          quality: 'auto:good',
          format: 'auto',
          crop: 'limit',
          width: 1200,
          height: 1200
        };
        break;
      case 'base-product':
        folder = 'mumalieff/base-products';
        transformation = {
          quality: 'auto:good',
          format: 'auto',
          crop: 'limit',
          width: 800,
          height: 800
        };
        break;
      default:
        folder = 'mumalieff/products';
        transformation = {
          quality: 'auto:good',
          format: 'auto'
        };
    }

    // Additional processing for custom designs
    if (uploadType === 'custom-design') {
      // Check image dimensions and quality for printing
      try {
        const metadata = await sharp(req.file.path).metadata();
        
        // Validate minimum dimensions for quality printing
        if (metadata.width < 300 || metadata.height < 300) {
          await unlinkFile(req.file.path);
          res.status(400);
          throw new Error('Image resolution too low for quality printing. Minimum 300x300 pixels required.');
        }

        // Check DPI if available
        if (metadata.density && metadata.density < 150) {
          console.warn('Image DPI is below recommended 300 DPI for printing');
        }

        // Add metadata to transformation
        transformation.context = `width=${metadata.width}|height=${metadata.height}|format=${metadata.format}`;
        
      } catch (sharpError) {
        console.error('Image processing error:', sharpError);
        // Continue with upload even if Sharp processing fails
      }
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder,
      resource_type: 'auto',
      ...transformation,
      // Add tags based on upload type
      tags: [uploadType, 'mumalieff'],
      // Add context for better organization
      context: {
        upload_type: uploadType,
        uploaded_at: new Date().toISOString(),
        ...(transformation.context && { original_dimensions: transformation.context })
      }
    });

    // Delete file from server after upload
    await unlinkFile(req.file.path);

    // Return enhanced response with additional metadata
    const response = {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      uploadType
    };

    // Add print-specific information for custom designs
    if (uploadType === 'custom-design') {
      response.printQuality = {
        recommendedDPI: 300,
        currentEstimatedDPI: result.width > 1000 ? 300 : Math.round((result.width / 3.33)), // Rough estimate
        printReady: result.width >= 1000 && result.height >= 1000,
        maxPrintSize: {
          inches: {
            width: Math.round((result.width / 300) * 100) / 100,
            height: Math.round((result.height / 300) * 100) / 100
          },
          cm: {
            width: Math.round((result.width / 118.11) * 100) / 100,
            height: Math.round((result.height / 118.11) * 100) / 100
          }
        }
      };
    }

    res.json(response);

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
 * @desc    Upload multiple files for product gallery
 * @route   POST /api/upload/multiple
 * @access  Private/Admin
 */
const uploadMultipleImages = asyncHandler(async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error('No files uploaded');
    }

    const uploadType = req.query.uploadType || 'product';
    const folder = uploadType === 'conviction-product' 
      ? 'mumalieff/conviction-products' 
      : 'mumalieff/base-products';

    const uploadPromises = req.files.map(async (file, index) => {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder,
          resource_type: 'auto',
          quality: 'auto:good',
          format: 'auto',
          crop: 'limit',
          width: 1200,
          height: 1200,
          tags: [uploadType, 'mumalieff', 'gallery'],
          context: {
            upload_type: uploadType,
            gallery_position: index,
            uploaded_at: new Date().toISOString()
          }
        });

        // Delete file from server after upload
        await unlinkFile(file.path);

        return {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          isPrimary: index === 0 // First image is primary
        };
      } catch (error) {
        // Delete file from server if upload fails
        await unlinkFile(file.path).catch(() => {});
        throw error;
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    res.json({ images: uploadResults });

  } catch (error) {
    // Clean up any remaining files
    if (req.files) {
      await Promise.all(
        req.files.map(file => unlinkFile(file.path).catch(() => {}))
      );
    }
    
    res.status(500);
    throw new Error(`Multiple upload failed: ${error.message}`);
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

/**
 * @desc    Validate custom design for printing
 * @route   POST /api/upload/validate-design
 * @access  Private
 */
const validateDesignForPrinting = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded for validation');
    }

    // Process image with Sharp for detailed analysis
    const metadata = await sharp(req.file.path).metadata();
    
    const validation = {
      isValid: true,
      warnings: [],
      errors: [],
      recommendations: [],
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        channels: metadata.channels
      }
    };

    // Check minimum dimensions
    if (metadata.width < 300 || metadata.height < 300) {
      validation.errors.push('Image resolution too low. Minimum 300x300 pixels required for quality printing.');
      validation.isValid = false;
    }

    // Check for optimal dimensions
    if (metadata.width < 1000 || metadata.height < 1000) {
      validation.warnings.push('For best print quality, we recommend images of at least 1000x1000 pixels.');
    }

    // Check DPI/density
    if (metadata.density && metadata.density < 200) {
      validation.warnings.push('Image DPI is below recommended 300 DPI. Print quality may be affected.');
    }

    // Check file format
    if (!['png', 'jpeg', 'jpg', 'svg'].includes(metadata.format.toLowerCase())) {
      validation.errors.push('Unsupported file format. Please use PNG, JPEG, or SVG.');
      validation.isValid = false;
    }

    // Recommendations based on analysis
    if (metadata.format === 'jpeg' && !metadata.hasAlpha) {
      validation.recommendations.push('Consider using PNG format for designs with transparency.');
    }

    if (metadata.channels === 4) {
      validation.recommendations.push('Great! Your image has transparency support.');
    }

    // Calculate estimated print sizes
    const dpi = metadata.density || 300;
    validation.estimatedPrintSizes = {
      atCurrentDPI: {
        inches: {
          width: Math.round((metadata.width / dpi) * 100) / 100,
          height: Math.round((metadata.height / dpi) * 100) / 100
        }
      },
      at300DPI: {
        inches: {
          width: Math.round((metadata.width / 300) * 100) / 100,
          height: Math.round((metadata.height / 300) * 100) / 100
        }
      }
    };

    // Clean up uploaded file
    await unlinkFile(req.file.path);

    res.json(validation);

  } catch (error) {
    // Clean up uploaded file
    if (req.file) {
      await unlinkFile(req.file.path).catch(() => {});
    }
    
    res.status(500);
    throw new Error(`Validation failed: ${error.message}`);
  }
});

/**
 * @desc    Get upload guidelines and requirements
 * @route   GET /api/upload/guidelines
 * @access  Public
 */
const getUploadGuidelines = asyncHandler(async (req, res) => {
  const guidelines = {
    customDesigns: {
      formats: ['PNG', 'JPEG', 'SVG'],
      minDimensions: { width: 300, height: 300 },
      recommendedDimensions: { width: 1000, height: 1000 },
      maxFileSize: '10MB',
      recommendedDPI: 300,
      tips: [
        'Use PNG for designs with transparency',
        'Higher resolution images produce better prints',
        'Vector formats (SVG) scale perfectly at any size',
        'Avoid overly complex designs for screen printing',
        'Use high contrast colors for better visibility'
      ]
    },
    productImages: {
      formats: ['PNG', 'JPEG'],
      recommendedDimensions: { width: 1200, height: 1200 },
      maxFileSize: '5MB',
      tips: [
        'Use square aspect ratio for consistent display',
        'Ensure good lighting and clear product visibility',
        'Include multiple angles and detail shots',
        'Use neutral backgrounds when possible'
      ]
    },
    printMethods: {
      screenPrint: {
        description: 'Best for simple designs with few colors',
        colorLimit: 6,
        durability: 'Excellent',
        recommended: 'Large orders, simple designs'
      },
      digitalPrint: {
        description: 'Perfect for complex, full-color designs',
        colorLimit: 'Unlimited',
        durability: 'Very Good',
        recommended: 'Photo-realistic designs, gradients'
      },
      vinyl: {
        description: 'Great for text and simple graphics',
        colorLimit: 'Single color per layer',
        durability: 'Excellent',
        recommended: 'Names, numbers, simple logos'
      }
    }
  };

  res.json(guidelines);
});

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  validateDesignForPrinting,
  getUploadGuidelines
};