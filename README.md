# Mumalieff E-commerce Deployment Guide

This guide will walk you through setting up and deploying the Mumalieff e-commerce application. The application consists of a React frontend and a Node.js/Express backend with MongoDB as the database.

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Git
- MongoDB Atlas account
- Cloudinary account (for image uploads)
- Paystack account (for payments)
- Vercel account (for frontend deployment)
- Railway or Render account (for backend deployment)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd mumalieff
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Set Up Environment Variables

Create the necessary environment files:

- `.env` in the server directory
- `.env.development` and `.env.production` in the client directory

Follow the templates provided in the project structure.

### 4. Set Up MongoDB Atlas

1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster
3. Set up a database user with read/write privileges
4. Whitelist your IP address or use 0.0.0.0/0 for development
5. Get your MongoDB connection string and add it to the server `.env` file

### 5. Set Up Cloudinary

1. Create a Cloudinary account if you don't have one
2. Navigate to the Dashboard to get your cloud name, API key, and API secret
3. Add these credentials to the server `.env` file

### 6. Set Up Paystack

1. Create a Paystack account if you don't have one
2. Get your test/live API keys from the Dashboard
3. Add the secret key to the server `.env` file and the public key to the client `.env` files

### 7. Start Development Servers

From the root directory:

```bash
# Start both client and server in development mode
npm run dev

# Or start them individually
npm run client
npm run server
```

The client will run on http://localhost:3000 and the server on http://localhost:5000.

## Production Deployment

### 1. Deploy Backend to Railway

1. Create a Railway account if you don't have one
2. Install the Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

3. Login to Railway:
   ```bash
   railway login
   ```

4. Initialize a new project (from the server directory):
   ```bash
   cd server
   railway init
   ```

5. Set up environment variables in the Railway dashboard:
   - Go to your project > Settings > Environment Variables
   - Add all variables from your server `.env` file

6. Deploy the backend:
   ```bash
   railway up
   ```

7. Get your deployed API URL from the Railway dashboard and update the `REACT_APP_API_URL` in your client's `.env.production` file.

### 2. Deploy Frontend to Vercel

1. Create a Vercel account if you don't have one
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy the frontend (from the client directory):
   ```bash
   cd client
   vercel
   ```

5. Follow the prompts to set up your project.

6. For subsequent deployments, use:
   ```bash
   vercel --prod
   ```

7. Set up environment variables in the Vercel dashboard:
   - Go to your project > Settings > Environment Variables
   - Add all variables from your client's `.env.production` file

### 3. Set Up Domain (Optional)

1. Purchase a domain from Porkbun, Namecheap, or your preferred registrar
2. Configure DNS settings to point to your Vercel deployment
3. Set up SSL certificates (Vercel handles this automatically)

## Testing Your Deployment

### Testing the API

1. Ensure your API endpoints are accessible:
   ```bash
   curl https://your-api-url.railway.app/api/products
   ```

2. Test user authentication and other protected routes

### Testing the Frontend

1. Navigate to your deployed website
2. Test user flows:
   - Registration and login
   - Browsing products
   - Adding items to cart
   - Checkout process with Paystack
   - Account management features

## Automatic Deployments

### GitHub Integration

1. Connect your repository to Vercel and Railway for automatic deployments
2. Set up CI/CD pipelines: