import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { getUserProfile, updateUserProfile, addShippingAddress, updateShippingAddress } from '../services/authService';
import { getMyOrders } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [isDefault, setIsDefault] = useState(false);
  
  // Fetch user profile
  const { 
    data: profileData, 
    isLoading: profileLoading, 
    refetch: refetchProfile 
  } = useQuery('userProfile', getUserProfile);
  
  // Fetch orders
  const { 
    data: ordersData, 
    isLoading: ordersLoading 
  } = useQuery('myOrders', () => getMyOrders());
  
  // Update profile mutation
  const updateProfileMutation = useMutation(updateUserProfile, {
    onSuccess: (data) => {
      // Update auth context
      updateProfile(data);
      refetchProfile();
      toast.success('Profile updated successfully');
      // Clear password fields
      setPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      setErrorMsg(error.response?.data?.message || 'Failed to update profile');
    },
  });
  
  // Add shipping address mutation
  const addAddressMutation = useMutation(addShippingAddress, {
    onSuccess: () => {
      toast.success('Address added successfully');
      refetchProfile();
      resetAddressForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add address');
    },
  });
  
  // Update shipping address mutation
  const updateAddressMutation = useMutation(
    ({ id, addressData }) => updateShippingAddress(id, addressData),
    {
      onSuccess: () => {
        toast.success('Address updated successfully');
        refetchProfile();
        resetAddressForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update address');
      },
    }
  );
  
  // Set initial form values
  useEffect(() => {
    if (profileData) {
      setFirstName(profileData.firstName || '');
      setLastName(profileData.lastName || '');
      setEmail(profileData.email || '');
      setPhone(profileData.phone || '');
    }
  }, [profileData]);
  
  // Reset address form
  const resetAddressForm = () => {
    setAddress('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('Nigeria');
    setIsDefault(false);
    setEditingAddressId(null);
    setShowAddressForm(false);
  };
  
  // Handle edit address
  const handleEditAddress = (addressItem) => {
    setAddress(addressItem.address);
    setCity(addressItem.city);
    setState(addressItem.state);
    setPostalCode(addressItem.postalCode);
    setCountry(addressItem.country);
    setIsDefault(addressItem.isDefault);
    setEditingAddressId(addressItem._id);
    setShowAddressForm(true);
  };
  
  // Handle profile submit
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    
    const userData = {
      firstName,
      lastName,
      email,
      phone,
    };
    
    if (password) {
      userData.password = password;
    }
    
    updateProfileMutation.mutate(userData);
  };
  
  // Handle address submit
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    
    const addressData = {
      address,
      city,
      state,
      postalCode,
      country,
      isDefault,
    };
    
    if (editingAddressId) {
      updateAddressMutation.mutate({ id: editingAddressId, addressData });
    } else {
      addAddressMutation.mutate(addressData);
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-6 sm:py-8">
      <div className="container-custom">
        <h1 className="mobile-title font-semibold mb-4 sm:mb-6 dark:text-white">My Account</h1>
        
        <div className="card overflow-hidden">
          {/* Mobile Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-shrink-0 px-4 sm:px-6 py-3 mobile-text font-medium whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'text-primary border-b-2 border-primary dark:text-white dark:border-white'
                  : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-shrink-0 px-4 sm:px-6 py-3 mobile-text font-medium whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'text-primary border-b-2 border-primary dark:text-white dark:border-white'
                  : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex-shrink-0 px-4 sm:px-6 py-3 mobile-text font-medium whitespace-nowrap ${
                activeTab === 'addresses'
                  ? 'text-primary border-b-2 border-primary dark:text-white dark:border-white'
                  : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Addresses
            </button>
          </div>
          
          <div className="mobile-spacing">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="mobile-title font-semibold mb-4 dark:text-white">My Profile</h2>
                
                {profileLoading ? (
                  <Loader />
                ) : (
                  <form onSubmit={handleProfileSubmit} className="max-w-lg">
                    {errorMsg && <Message variant="error" className="mb-4">{errorMsg}</Message>}
                    
                    <div className="mobile-form-group">
                      <label htmlFor="firstName" className="form-label">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mobile-form-input"
                        required
                      />
                    </div>
                    
                    <div className="mobile-form-group">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mobile-form-input"
                        required
                      />
                    </div>
                    
                    <div className="mobile-form-group">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mobile-form-input"
                        required
                      />
                    </div>
                    
                    <div className="mobile-form-group">
                      <label htmlFor="phone" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mobile-form-input"
                      />
                    </div>
                    
                    <div className="mobile-form-group">
                      <label htmlFor="password" className="form-label">New Password</label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mobile-form-input"
                        placeholder="Leave blank to keep current password"
                      />
                      <p className="mobile-text-xs text-gray-500 mt-1 dark:text-gray-400">
                        Password must be at least 6 characters
                      </p>
                    </div>
                    
                    <div className="mobile-form-group">
                      <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mobile-form-input"
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="mobile-btn-primary"
                      disabled={updateProfileMutation.isLoading}
                    >
                      {updateProfileMutation.isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </form>
                )}
              </div>
            )}
            
            {/* Orders Tab - Mobile Optimized */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="mobile-title font-semibold mb-4 dark:text-white">My Orders</h2>
                
                {ordersLoading ? (
                  <Loader />
                ) : ordersData?.orders.length === 0 ? (
                  <Message>
                    You have no orders yet. <Link to="/products" className="text-primary">Go Shopping</Link>
                  </Message>
                ) : (
                  <div>
                    {/* Mobile Order Cards */}
                    <div className="block sm:hidden space-y-4">
                      {ordersData?.orders.map((order) => (
                        <div key={order._id} className="mobile-order-card">
                          <div className="mobile-order-header">
                            <div>
                              <div className="mobile-order-id">Order ID</div>
                              <div className="mobile-order-id-value">
                                {order._id.substring(0, 10)}...
                              </div>
                            </div>
                            <div className="mobile-order-total">
                              <div className="mobile-order-total-label">Total</div>
                              <div className="mobile-order-total-value">
                                ₦{order.totalPrice.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mobile-order-meta">
                            <div className="mobile-order-date">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <span className={`mobile-order-status ${
                              order.status === 'Delivered'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                                : order.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="mobile-order-actions">
                            <div className="flex items-center space-x-2">
                              {order.isPaid ? (
                                <span className="mobile-payment-status bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                                  Paid
                                </span>
                              ) : (
                                <span className="mobile-payment-status bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">
                                  Not Paid
                                </span>
                              )}
                            </div>
                            <Link
                              to={`/order/${order._id}`}
                              className="mobile-text text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue font-medium"
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-dark-bg">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                              ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                              Paid
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-card dark:divide-gray-700">
                          {ordersData?.orders.map((order) => (
                            <tr key={order._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                {order._id.substring(0, 10)}...
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                ₦{order.totalPrice.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {order.isPaid ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-light text-success">
                                    Paid on {new Date(order.paidAt).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-error-light text-error">
                                    Not Paid
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.status === 'Delivered'
                                    ? 'bg-success-light text-success'
                                    : order.status === 'Cancelled'
                                    ? 'bg-error-light text-error'
                                    : 'bg-warning-light text-warning'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                  to={`/order/${order._id}`}
                                  className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue"
                                >
                                  Details
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Pagination - implement if needed */}
                      {ordersData?.pages > 1 && (
                        <div className="flex justify-center mt-6">
                          <p className="text-gray-500 dark:text-gray-400">Pagination will be implemented here</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h2 className="mobile-title font-semibold dark:text-white">My Addresses</h2>
                  {!showAddressForm && (
                    <button
                      onClick={() => {
                        resetAddressForm();
                        setShowAddressForm(true);
                      }}
                      className="mobile-btn-primary sm:btn sm:btn-primary"
                    >
                      Add New Address
                    </button>
                  )}
                </div>
                
                {profileLoading ? (
                  <Loader />
                ) : showAddressForm ? (
                  <div className="bg-gray-50 dark:bg-dark-bg mobile-spacing rounded-lg mb-6">
                    <h3 className="mobile-title font-medium mb-4 dark:text-white">
                      {editingAddressId ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    
                    <form onSubmit={handleAddressSubmit} className="max-w-lg">
                      <div className="mobile-form-group">
                        <label htmlFor="address" className="form-label">Street Address*</label>
                        <input
                          type="text"
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="mobile-form-input"
                          required
                        />
                      </div>
                      
                      <div className="mobile-form-group">
                        <label htmlFor="city" className="form-label">City*</label>
                        <input
                          type="text"
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="mobile-form-input"
                          required
                        />
                      </div>
                      
                      <div className="mobile-form-group">
                        <label htmlFor="state" className="form-label">State*</label>
                        <input
                          type="text"
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="mobile-form-input"
                          required
                        />
                      </div>
                      
                      <div className="mobile-form-group">
                        <label htmlFor="postalCode" className="form-label">Postal Code*</label>
                        <input
                          type="text"
                          id="postalCode"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="mobile-form-input"
                          required
                        />
                      </div>
                      
                      <div className="mobile-form-group">
                        <label htmlFor="country" className="form-label">Country*</label>
                        <input
                          type="text"
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="mobile-form-input"
                          required
                        />
                      </div>
                      
                      <div className="mobile-form-group">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:bg-dark-bg dark:border-gray-600"
                          />
                          <label htmlFor="isDefault" className="ml-2 block mobile-text text-gray-700 dark:text-gray-300">
                            Set as default address
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                          type="submit"
                          className="mobile-btn-primary sm:btn sm:btn-primary"
                          disabled={addAddressMutation.isLoading || updateAddressMutation.isLoading}
                        >
                          {addAddressMutation.isLoading || updateAddressMutation.isLoading
                            ? 'Saving...'
                            : editingAddressId
                            ? 'Update Address'
                            : 'Add Address'}
                        </button>
                        <button
                          type="button"
                          onClick={resetAddressForm}
                          className="mobile-btn-secondary sm:btn sm:btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : profileData?.shippingAddresses?.length === 0 ? (
                  <Message>
                    You have no saved addresses. Add a new address to make checkout faster.
                  </Message>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileData?.shippingAddresses?.map((addressItem) => (
                      <div 
                        key={addressItem._id} 
                        className={`border rounded-lg mobile-spacing ${
                          addressItem.isDefault 
                            ? 'border-primary dark:border-accent-blue' 
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {addressItem.isDefault && (
                          <div className="inline-block bg-primary text-white mobile-text-xs px-2 py-1 rounded mb-2 dark:bg-accent-blue">
                            Default
                          </div>
                        )}
                        
                        <p className="mobile-text text-gray-900 dark:text-white">{addressItem.address}</p>
                        <p className="mobile-text text-gray-900 dark:text-white">{addressItem.city}, {addressItem.state} {addressItem.postalCode}</p>
                        <p className="mobile-text text-gray-900 dark:text-white">{addressItem.country}</p>
                        
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => handleEditAddress(addressItem)}
                            className="mobile-text text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue font-medium"
                          >
                            Edit
                          </button>
                          {/* Delete functionality can be added later */}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;