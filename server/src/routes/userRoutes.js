const express = require('express');
const router = express.Router();
const {
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
  changeAdminPassword,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');


router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/change-password').put(protect, changeAdminPassword);

router.route('/shipping')
  .post(protect, addShippingAddress);

router.route('/shipping/:id')
  .put(protect, updateShippingAddress);

router.route('/wishlist')
  .get(protect, getWishlist)
  .post(protect, addToWishlist);

router.route('/wishlist/:productId')
  .delete(protect, removeFromWishlist);


router.route('/')
  .get(protect, admin, getUsers);

router.route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;