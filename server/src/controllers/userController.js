const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      shippingAddresses: user.shippingAddresses,
      wishlist: user.wishlist,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    
    // Only update password if it's provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Create new JWT token
    const token = generateToken(updatedUser._id);

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
      token,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Add shipping address
 * @route   POST /api/users/shipping
 * @access  Private
 */
const addShippingAddress = asyncHandler(async (req, res) => {
  const { address, city, state, postalCode, country, isDefault } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    const newAddress = {
      address,
      city,
      state,
      postalCode,
      country: country || 'Nigeria',
      isDefault: isDefault || false,
    };

    // If this address is set as default, unset any previous default address
    if (newAddress.isDefault) {
      user.shippingAddresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.shippingAddresses.push(newAddress);
    await user.save();

    res.status(201).json({
      message: 'Shipping address added',
      shippingAddresses: user.shippingAddresses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Change required password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
const changeAdminPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters long');
    }
  
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    // Verify current password
    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }
    
    // Update password and reset requirePasswordChange flag
    user.password = newPassword;
    user.requirePasswordChange = false;
    await user.save();
    
    // Generate new token
    const token = generateToken(user._id);
    
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      requirePasswordChange: false,
      token,
    });
  });
  

/**
 * @desc    Update shipping address
 * @route   PUT /api/users/shipping/:id
 * @access  Private
 */
const updateShippingAddress = asyncHandler(async (req, res) => {
  const { address, city, state, postalCode, country, isDefault } = req.body;
  const addressId = req.params.id;

  const user = await User.findById(req.user._id);

  if (user) {
    const addressIndex = user.shippingAddresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      res.status(404);
      throw new Error('Shipping address not found');
    }

    // If this address is being set as default, unset any previous default
    if (isDefault) {
      user.shippingAddresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // Update the address
    user.shippingAddresses[addressIndex] = {
      ...user.shippingAddresses[addressIndex],
      address: address || user.shippingAddresses[addressIndex].address,
      city: city || user.shippingAddresses[addressIndex].city,
      state: state || user.shippingAddresses[addressIndex].state,
      postalCode: postalCode || user.shippingAddresses[addressIndex].postalCode,
      country: country || user.shippingAddresses[addressIndex].country,
      isDefault: isDefault !== undefined ? isDefault : user.shippingAddresses[addressIndex].isDefault,
      _id: user.shippingAddresses[addressIndex]._id, // Preserve the original ID
    };

    await user.save();

    res.json({
      message: 'Shipping address updated',
      shippingAddresses: user.shippingAddresses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error('Cannot delete admin user');
    }
    
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Get all users with search and order count
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword;

  // Build search query
  let query = {};
  if (keyword) {
    query = {
      $or: [
        { firstName: { $regex: keyword, $options: 'i' } },
        { lastName: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ]
    };
  }

  const count = await User.countDocuments(query);
  
  // Get users with order count aggregation
  const users = await User.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'user',
        as: 'orders'
      }
    },
    {
      $addFields: {
        orderCount: { $size: '$orders' },
        fullName: { $concat: ['$firstName', ' ', '$lastName'] }
      }
    },
    {
      $project: {
        password: 0,
        orders: 0 // Don't include the full orders array
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: pageSize * (page - 1) },
    { $limit: pageSize }
  ]);

  res.json({
    users,
    page,
    pages: Math.ceil(count / pageSize),
    totalUsers: count,
  });
});

/**
 * @desc    Update user (Admin) - Enhanced with isActive field
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
      isActive: updatedUser.isActive,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Add product to wishlist
 * @route   POST /api/users/wishlist
 * @access  Private
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  
  const user = await User.findById(req.user._id);

  if (user) {
    // Check if product is already in wishlist
    const alreadyInWishlist = user.wishlist.find(
      (id) => id.toString() === productId
    );

    if (alreadyInWishlist) {
      res.status(400);
      throw new Error('Product already in wishlist');
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(201).json({ 
      message: 'Product added to wishlist',
      wishlist: user.wishlist,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/users/wishlist/:productId
 * @access  Private
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  
  const user = await User.findById(req.user._id);

  if (user) {
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );
    
    await user.save();

    res.json({ 
      message: 'Product removed from wishlist',
      wishlist: user.wishlist,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Get user wishlist
 * @route   GET /api/users/wishlist
 * @access  Private
 */
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');

  if (user) {
    res.json(user.wishlist);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  addShippingAddress,
  updateShippingAddress,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  changeAdminPassword
};