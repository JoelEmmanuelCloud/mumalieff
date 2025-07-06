import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { getProductById, updateProduct } from '../../services/productService';
import { uploadImage, deleteImage } from '../../services/uploadService';
import Loader from '../../components/common/Loader';
import Message from '../../components/common/Message';

const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState(0);
  const [material, setMaterial] = useState('');
  const [images, setImages] = useState([]);
  const [allowCustomization, setAllowCustomization] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [salePrice, setSalePrice] = useState(0);
  
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [newSize, setNewSize] = useState({ name: '', inStock: true });
  const [newColor, setNewColor] = useState({ name: '', colorCode: '#000000', inStock: true });
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const { data: product, isLoading, error } = useQuery(
    ['product', id],
    () => getProductById(id),
    {
      onSuccess: (data) => {
        setName(data.name);
        setPrice(data.price);
        setDescription(data.description);
        setCategory(data.category);
        setCountInStock(data.countInStock);
        setMaterial(data.material || '');
        setImages(data.images || []);
        setSizes(data.sizes || []);
        setColors(data.colors || []);
        setAllowCustomization(data.allowCustomization || false);
        setFeatured(data.featured || false);
        setIsSale(data.isSale || false);
        setSalePrice(data.salePrice || 0);
      },
    }
  );
  
  const updateProductMutation = useMutation(
    (productData) => updateProduct(id, productData),
    {
      onSuccess: () => {
        toast.success('Product updated successfully');
        navigate('/admin/products');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update product');
      },
    }
  );
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isSale && salePrice >= price) {
      toast.error('Sale price must be less than regular price');
      return;
    }
    
    if (images.length === 0) {
      toast.error('Please add at least one product image');
      return;
    }
    
    if (sizes.length === 0) {
      toast.error('Please add at least one size option');
      return;
    }
    
    if (colors.length === 0) {
      toast.error('Please add at least one color option');
      return;
    }
    
    updateProductMutation.mutate({
      name,
      price,
      description,
      category,
      countInStock,
      material,
      images,
      sizes,
      colors,
      allowCustomization,
      featured,
      isSale,
      salePrice: isSale ? salePrice : null,
    });
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    setUploading(true);
    setUploadError('');
    
    try {
      const data = await uploadImage(file, 'product');
      
      setImages([...images, { url: data.url, publicId: data.publicId }]);
      toast.success('Image uploaded successfully');
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to upload image');
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  
  const handleImageDelete = async (publicId, index) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        if (publicId) {
          await deleteImage(publicId);
        }
        
        const updatedImages = [...images];
        updatedImages.splice(index, 1);
        setImages(updatedImages);
        
        toast.success('Image deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete image');
      }
    }
  };
  
  const handleAddSize = () => {
    if (!newSize.name) {
      toast.error('Please enter a size name');
      return;
    }
    
    if (sizes.some((size) => size.name === newSize.name)) {
      toast.error('Size already exists');
      return;
    }
    
    setSizes([...sizes, { ...newSize }]);
    setNewSize({ name: '', inStock: true });
  };
  
  const handleRemoveSize = (index) => {
    const updatedSizes = [...sizes];
    updatedSizes.splice(index, 1);
    setSizes(updatedSizes);
  };
  
  const handleAddColor = () => {
    if (!newColor.name || !newColor.colorCode) {
      toast.error('Please enter color name and select a color code');
      return;
    }
    
    if (colors.some((color) => color.name === newColor.name)) {
      toast.error('Color already exists');
      return;
    }
    
    setColors([...colors, { ...newColor }]);
    setNewColor({ name: '', colorCode: '#000000', inStock: true });
  };
  
  const handleRemoveColor = (index) => {
    const updatedColors = [...colors];
    updatedColors.splice(index, 1);
    setColors(updatedColors);
  };
  
  if (isLoading) return <Loader />;
  if (error) return <Message variant="error">{error.response?.data?.message || 'Error loading product'}</Message>;
  if (!product) return <Message>Product not found</Message>;
  
  return (
    <div>
      <button
        onClick={() => navigate('/admin/products')}
        className="flex items-center text-primary mb-6 hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Products
      </button>
      
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-semibold dark:text-white">Edit Product</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-medium mb-4 dark:text-white">Basic Information</h2>
              
              <div className="mb-4">
                <label htmlFor="name" className="form-label">Name</label>
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
                <label htmlFor="price" className="form-label">Price (₦)</label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="category" className="form-label">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Wear Your Conviction">Wear Your Conviction</option>
                  <option value="Customize Your Prints">Customize Your Prints</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  className="form-input"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label htmlFor="material" className="form-label">Material</label>
                <input
                  type="text"
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="form-input"
                  placeholder="e.g., 100% Cotton"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="countInStock" className="form-label">Count In Stock</label>
                <input
                  type="number"
                  id="countInStock"
                  value={countInStock}
                  onChange={(e) => setCountInStock(Number(e.target.value))}
                  min="0"
                  className="form-input"
                  required
                />
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium mb-4 dark:text-white">Options & Features</h2>
              
              <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="isSale"
                    checked={isSale}
                    onChange={(e) => setIsSale(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:border-gray-600"
                  />
                  <label htmlFor="isSale" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    On Sale
                  </label>
                </div>
                
                {isSale && (
                  <div className="ml-6 mt-2">
                    <label htmlFor="salePrice" className="form-label">Sale Price (₦)</label>
                    <input
                      type="number"
                      id="salePrice"
                      value={salePrice}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="form-input"
                      required={isSale}
                    />
                    {price > 0 && salePrice > 0 && (
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                        Discount: {Math.round(((price - salePrice) / price) * 100)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mb-4 space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:border-gray-600"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Featured Product
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowCustomization"
                    checked={allowCustomization}
                    onChange={(e) => setAllowCustomization(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:border-gray-600"
                  />
                  <label htmlFor="allowCustomization" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allow Customization
                  </label>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 dark:text-white">Product Images</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Product ${index + 1}`}
                        className="h-24 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(image.publicId, index)}
                        className="absolute top-1 right-1 bg-error text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  <label className="h-24 w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Add Image</span>
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                      disabled={uploading}
                    />
                  </label>
                </div>
                
                {uploading && <Loader size="small" />}
                {uploadError && <p className="text-error text-sm">{uploadError}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload high-quality images (at least 800x800px). First image will be used as the main product image.
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 dark:text-white">Sizes</h3>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {sizes.map((size, index) => (
                    <div key={index} className="flex items-center bg-gray-100 dark:bg-dark-bg px-3 py-1 rounded-md">
                      <span className={`mr-2 ${size.inStock ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                        {size.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        className="text-gray-500 hover:text-error dark:text-gray-400 dark:hover:text-error-light"
                        aria-label={`Remove ${size.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newSize.name}
                    onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                    className="form-input py-1 px-2 w-20"
                    placeholder="Size"
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="newSizeInStock"
                      checked={newSize.inStock}
                      onChange={(e) => setNewSize({ ...newSize, inStock: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:border-gray-600"
                    />
                    <label htmlFor="newSizeInStock" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      In Stock
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-light"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 dark:text-white">Colors</h3>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {colors.map((color, index) => (
                    <div key={index} className="flex items-center bg-gray-100 dark:bg-dark-bg px-3 py-1 rounded-md">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: color.colorCode }}
                      ></div>
                      <span className={`mr-2 ${color.inStock ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                        {color.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(index)}
                        className="text-gray-500 hover:text-error dark:text-gray-400 dark:hover:text-error-light"
                        aria-label={`Remove ${color.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newColor.name}
                    onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                    className="form-input py-1 px-2 w-24"
                    placeholder="Color"
                  />
                  <input
                    type="color"
                    value={newColor.colorCode}
                    onChange={(e) => setNewColor({ ...newColor, colorCode: e.target.value })}
                    className="h-8 w-8 p-0 border border-gray-300 rounded"
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="newColorInStock"
                      checked={newColor.inStock}
                      onChange={(e) => setNewColor({ ...newColor, inStock: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:border-gray-600"
                    />
                    <label htmlFor="newColorInStock" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      In Stock
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-light"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateProductMutation.isLoading}
            >
              {updateProductMutation.isLoading ? <Loader size="small" /> : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditPage;