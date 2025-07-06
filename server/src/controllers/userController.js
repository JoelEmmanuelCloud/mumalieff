const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

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

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

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
    
    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }
    
    user.password = newPassword;
    user.requirePasswordChange = false;
    await user.save();
    
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

    if (isDefault) {
      user.shippingAddresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.shippingAddresses[addressIndex] = {
      ...user.shippingAddresses[addressIndex],
      address: address || user.shippingAddresses[addressIndex].address,
      city: city || user.shippingAddresses[addressIndex].city,
      state: state || user.shippingAddresses[addressIndex].state,
      postalCode: postalCode || user.shippingAddresses[addressIndex].postalCode,
      country: country || user.shippingAddresses[addressIndex].country,
      isDefault: isDefault !== undefined ? isDefault : user.shippingAddresses[addressIndex].isDefault,
      _id: user.shippingAddresses[addressIndex]._id,
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

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const getUsers = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword;

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
        orders: 0
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

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  
  const user = await User.findById(req.user._id);

  if (user) {
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