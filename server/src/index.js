require('dotenv').config(); 
const express = require('express'); 
const cors = require('cors'); 
const helmet = require('helmet'); 
const morgan = require('morgan'); 
const { connectDB } = require('./config/db'); 
const { errorHandler, notFound } = require('./middleware/errorMiddleware'); 

const productRoutes = require('./routes/productRoutes'); 
const userRoutes = require('./routes/userRoutes'); 
const orderRoutes = require('./routes/orderRoutes'); 
const uploadRoutes = require('./routes/uploadRoutes'); 
const paymentRoutes = require('./routes/paymentRoutes'); 
const adminRoutes = require('./routes/adminRoutes'); 
const otpRoutes = require('./routes/otpRoutes');  
const cartRoutes = require('./routes/cartRoutes'); 

const { startEmailJobs } = require('./jobs/emailJobs'); 

const app = express(); 
const PORT = process.env.PORT || 5000; 

connectDB(); 

const corsOptions = {
  origin: [
    'https://mumalieff.com',
    'https://www.mumalieff.com',
    'https://mumalieff.vercel.app',
    process.env.CLIENT_URL,
    'http://localhost:3000'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions)); 
app.use(helmet()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

if (process.env.NODE_ENV === 'development') { 
  app.use(morgan('dev')); 
} 

app.use('/api/payments/paystack/webhook', express.raw({ type: 'application/json' })); 

if (process.env.ENABLE_EMAIL_JOBS === 'true') { 
  startEmailJobs(); 
} 

app.get('/', (req, res) => { 
  res.send('Mumalieff API is running...'); 
}); 

app.use('/api/auth', otpRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/orders', orderRoutes); 
app.use('/api/upload', uploadRoutes); 
app.use('/api/payments', paymentRoutes); 
app.use('/api/admin', adminRoutes); 
app.use('/api/cart', cartRoutes); 

app.use(notFound); 
app.use(errorHandler); 

app.listen(PORT, () => { 
  if (process.env.NODE_ENV === 'development') {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  }
}); 

process.on('unhandledRejection', (err) => { 
  process.exit(1); 
});