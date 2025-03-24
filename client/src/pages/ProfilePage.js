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
  const [name, setName] = useState('');
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
      setName(profileData.name || '');
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
      name,
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
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-semibold mb-6 dark:text-white">My Account</h1>
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'text-primary border-b-2 border-primary dark:text-white dark:border-white'
                  : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'orders'
                  ? 'text-primary border-b-2 border-primary dark:text-white dark:border-white'
                  : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'addresses'
                  ? 'text-primary border-b-2 border-primary dark:text-white dark:border-white'
                  : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Addresses
            </button>
          </div>
          
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-4 dark:text-white">My Profile</h2>
                
                {profileLoading ? (
                  <Loader />
                ) : (
                  <form onSubmit={handleProfileSubmit} className="max-w-lg">
                    {errorMsg && <Message variant="error" className="mb-4">{errorMsg}</Message>}
                    
                    <div className="mb-4">
                      <label htmlFor="name" className="form-label">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="phone" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="password" className="form-label">New Password</label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                        placeholder="Leave blank to keep current password"
                      />
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                        Password must be at least 6 characters
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="form-input"
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={updateProfileMutation.isLoading}
                    >
                      {updateProfileMutation.isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </form>
                )}
              </div>
            )}
            
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold mb-4 dark:text-white">My Orders</h2>
                
                {ordersLoading ? (
                  <Loader />
                ) : ordersData?.orders.length === 0 ? (
                  <Message>
                    You have no orders yet. <Link to="/products" className="text-primary">Go Shopping</Link>
                  </Message>
                ) : (
                  <div className="overflow-x-auto">
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
                )}
              </div>
            )}
            
            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold dark:text-white">My Addresses</h2>
                  {!showAddressForm && (
                    <button
                      onClick={() => {
                        resetAddressForm();
                        setShowAddressForm(true);
                      }}
                      className="btn btn-primary"
                    >
                      Add New Address
                    </button>
                  )}
                </div>
                
                {profileLoading ? (
                  <Loader />
                ) : showAddressForm ? (
                  <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-4 dark:text-white">
                      {editingAddressId ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    
                    <form onSubmit={handleAddressSubmit} className="max-w-lg">
                      <div className="mb-4">
                        <label htmlFor="address" className="form-label">Street Address*</label>
                        <input
                          type="text"
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="city" className="form-label">City*</label>
                        <input
                          type="text"
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="state" className="form-label">State*</label>
                        <input
                          type="text"
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="postalCode" className="form-label">Postal Code*</label>
                        <input
                          type="text"
                          id="postalCode"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="country" className="form-label">Country*</label>
                        <input
                          type="text"
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="mb-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:bg-dark-bg dark:border-gray-600"
                          />
                          <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Set as default address
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          className="btn btn-primary"
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
                          className="btn btn-secondary"
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
                        className={`border rounded-lg p-4 ${
                          addressItem.isDefault 
                            ? 'border-primary dark:border-accent-blue' 
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {addressItem.isDefault && (
                          <div className="inline-block bg-primary text-white text-xs px-2 py-1 rounded mb-2 dark:bg-accent-blue">
                            Default
                          </div>
                        )}
                        
                        <p className="text-gray-900 dark:text-white">{addressItem.address}</p>
                        <p className="text-gray-900 dark:text-white">{addressItem.city}, {addressItem.state} {addressItem.postalCode}</p>
                        <p className="text-gray-900 dark:text-white">{addressItem.country}</p>
                        
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => handleEditAddress(addressItem)}
                            className="text-sm text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue"
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