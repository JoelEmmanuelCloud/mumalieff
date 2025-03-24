import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getUserProfile } from '../services/authService';
import { useCart } from '../context/CartContext';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const ShippingPage = () => {
  const navigate = useNavigate();
  const { shippingAddress, saveShippingAddress } = useCart();
  
  // Form state
  const [address, setAddress] = useState(shippingAddress.address || '');
  const [city, setCity] = useState(shippingAddress.city || '');
  const [state, setState] = useState(shippingAddress.state || '');
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
  const [country, setCountry] = useState(shippingAddress.country || 'Nigeria');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  // Fetch user profile to get saved addresses
  const { data: userData, isLoading } = useQuery('userProfile', getUserProfile);
  
  // Pre-fill form with default address if available
  useEffect(() => {
    if (userData && userData.shippingAddresses) {
      const defaultAddress = userData.shippingAddresses.find(addr => addr.isDefault);
      
      if (defaultAddress && !shippingAddress.address) {
        setAddress(defaultAddress.address);
        setCity(defaultAddress.city);
        setState(defaultAddress.state);
        setPostalCode(defaultAddress.postalCode);
        setCountry(defaultAddress.country);
        setSelectedAddressId(defaultAddress._id);
      }
    }
  }, [userData, shippingAddress]);
  
  // Handle saved address selection
  const handleAddressSelect = (addressId) => {
    const selectedAddress = userData.shippingAddresses.find(addr => addr._id === addressId);
    
    if (selectedAddress) {
      setAddress(selectedAddress.address);
      setCity(selectedAddress.city);
      setState(selectedAddress.state);
      setPostalCode(selectedAddress.postalCode);
      setCountry(selectedAddress.country);
      setSelectedAddressId(addressId);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    saveShippingAddress({
      address,
      city,
      state,
      postalCode,
      country,
    });
    
    navigate('/payment');
  };
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          {/* Checkout Steps */}
          <div className="flex justify-between mb-8">
            <div className="w-1/3 text-center">
              <div className="relative">
                <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center font-medium mx-auto">
                  1
                </div>
                <p className="mt-2 text-sm font-medium text-primary dark:text-white">Shipping</p>
              </div>
            </div>
            <div className="w-1/3 text-center">
              <div className="relative">
                <div className="h-8 w-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-medium mx-auto dark:bg-gray-700 dark:text-gray-300">
                  2
                </div>
                <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">Payment</p>
              </div>
            </div>
            <div className="w-1/3 text-center">
              <div className="relative">
                <div className="h-8 w-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-medium mx-auto dark:bg-gray-700 dark:text-gray-300">
                  3
                </div>
                <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">Place Order</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-semibold mb-6 dark:text-white">Shipping Address</h1>
            
            {isLoading ? (
              <Loader />
            ) : (
              <>
                {/* Saved Addresses */}
                {userData?.shippingAddresses && userData.shippingAddresses.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium mb-3 dark:text-white">Saved Addresses</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userData.shippingAddresses.map((addr) => (
                        <div
                          key={addr._id}
                          onClick={() => handleAddressSelect(addr._id)}
                          className={`border rounded-lg p-4 cursor-pointer transition ${
                            selectedAddressId === addr._id
                              ? 'border-primary bg-primary/5 dark:border-accent-blue dark:bg-accent-blue/10'
                              : 'border-gray-200 hover:border-primary dark:border-gray-700 dark:hover:border-accent-blue'
                          }`}
                        >
                          {addr.isDefault && (
                            <div className="inline-block bg-primary text-white text-xs px-2 py-1 rounded mb-2 dark:bg-accent-blue">
                              Default
                            </div>
                          )}
                          <p className="text-gray-900 dark:text-white">{addr.address}</p>
                          <p className="text-gray-900 dark:text-white">{addr.city}, {addr.state} {addr.postalCode}</p>
                          <p className="text-gray-900 dark:text-white">{addr.country}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Shipping Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="address" className="form-label">Address</label>
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
                    <label htmlFor="city" className="form-label">City</label>
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
                    <label htmlFor="state" className="form-label">State</label>
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
                    <label htmlFor="postalCode" className="form-label">Postal Code</label>
                    <input
                      type="text"
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="country" className="form-label">Country</label>
                    <input
                      type="text"
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-primary py-3 w-full">
                    Continue to Payment
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPage;