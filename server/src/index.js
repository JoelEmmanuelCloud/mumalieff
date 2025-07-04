require('dotenv').config(); 
const express = require('express'); 
const cors = require('cors'); 
const helmet = require('helmet'); 
const morgan = require('morgan'); 
const { connectDB } = require('./config/db'); 
const { errorHandler, notFound } = require('./middleware/errorMiddleware'); 
 
// Import routes 
const productRoutes = require('./routes/productRoutes'); 
const userRoutes = require('./routes/userRoutes'); 
const orderRoutes = require('./routes/orderRoutes'); 
const uploadRoutes = require('./routes/uploadRoutes'); 
const paymentRoutes = require('./routes/paymentRoutes'); 
const adminRoutes = require('./routes/adminRoutes'); 
const otpRoutes = require('./routes/otpRoutes');  
const cartRoutes = require('./routes/cartRoutes'); 
 
const { startEmailJobs } = require('./jobs/emailJobs'); 
 
// Initialize Express 
const app = express(); 
const PORT = process.env.PORT || 5000; 
 
// Connect to MongoDB 
connectDB(); 
 
// CORS Configuration for Production
const corsOptions = {
  origin: [
    'https://mumalieff.com',
    'https://www.mumalieff.com',
    'https://mumalieff.vercel.app', // Your Vercel URL
    process.env.CLIENT_URL, // Backup from env variable
    'http://localhost:3000' // Keep for development
  ].filter(Boolean), // Remove any undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware 
app.use(cors(corsOptions)); 
app.use(helmet()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
 
// Logging in development mode 
if (process.env.NODE_ENV === 'development') { 
  app.use(morgan('dev')); 
} 
 
// Important: For webhook routes, use raw body parser 
app.use('/api/payments/paystack/webhook', express.raw({ type: 'application/json' })); 
 
// Start email automation jobs 
if (process.env.ENABLE_EMAIL_JOBS === 'true') { 
  startEmailJobs(); 
} 
 
// Welcome route 
app.get('/', (req, res) => { 
  res.send('Mumalieff API is running...'); 
}); 
 
// API routes 
app.use('/api/auth', otpRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/orders', orderRoutes); 
app.use('/api/upload', uploadRoutes); 
app.use('/api/payments', paymentRoutes); 
app.use('/api/admin', adminRoutes); 
app.use('/api/cart', cartRoutes); 
 
// Error handling middleware 
app.use(notFound); 
app.use(errorHandler); 
 
// Route debugging - only in development
if (process.env.NODE_ENV === 'development') {
  app._router.stack.forEach(function(r){ 
    if (r.route && r.route.path){ 
      console.log(`Route: ${Object.keys(r.route.methods)} ${r.route.path}`); 
    } else if (r.name === 'router'){ 
      r.handle.stack.forEach(function(r) { 
        if (r.route && r.route.path){ 
          console.log(`   ${Object.keys(r.route.methods)} /api${r.route.path}`); 
        } 
      }); 
    } 
  }); 
}
 
// Start the server 
app.listen(PORT, () => { 
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`); 
}); 
 
// Handle unhandled promise rejections 
process.on('unhandledRejection', (err) => { 
  console.log(`Error: ${err.message}`); 
  // Close server & exit process 
  process.exit(1); 
});