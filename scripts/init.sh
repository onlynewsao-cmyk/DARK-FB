#!/bin/bash

# Facebook Bot - Initialization Script

echo "=========================================="
echo "  Facebook Bot - Project Initialization"
echo "=========================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION < "v18.0.0" ]]; then
    echo "Error: Node.js version >= 18.0.0 is required"
    echo "Current version: $NODE_VERSION"
    exit 1
fi
echo "✓ Node.js version: $NODE_VERSION"
echo ""

# Check npm version
echo "Checking npm version..."
NPM_VERSION=$(npm -v)
echo "✓ npm version: $NPM_VERSION"
echo ""

# Install dependencies
echo "Installing dependencies..."
if [ -f "package.json" ]; then
    npm install
    echo "✓ Root dependencies installed"
else
    echo "Warning: package.json not found in root"
fi

# Install backend dependencies
if [ -d "backend" ]; then
    cd backend
    if [ -f "package.json" ]; then
        npm install
        echo "✓ Backend dependencies installed"
    else
        echo "Warning: backend/package.json not found"
    fi
    cd ..
fi

# Install frontend dependencies
if [ -d "frontend" ]; then
    cd frontend
    if [ -f "package.json" ]; then
        npm install
        echo "✓ Frontend dependencies installed"
    else
        echo "Warning: frontend/package.json not found"
    fi
    cd ..
fi

echo ""
echo "=========================================="
echo "  Setup Environment Variables"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from .env.example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✓ backend/.env created"
        echo ""
        echo "IMPORTANT: Edit backend/.env with your actual values:"
        echo "  - MONGODB_URI"
        echo "  - JWT_SECRET"
        echo "  - FACEBOOK_APP_ID"
        echo "  - FACEBOOK_APP_SECRET"
        echo "  - FACEBOOK_ACCESS_TOKEN"
        echo "  - FACEBOOK_WEBHOOK_VERIFY_TOKEN"
    else
        echo "Warning: backend/.env.example not found"
    fi
else
    echo "✓ backend/.env already exists"
fi

echo ""
echo "=========================================="
echo "  Database Setup"
echo "=========================================="
echo ""

# Check MongoDB connection
echo "Checking MongoDB connection..."
if grep -q "MONGODB_URI" backend/.env; then
    echo "MongoDB URI found in .env"
    echo "Test your connection with:"
    echo "  cd backend && node -e \"require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✓ MongoDB connected')).catch(err => console.error('✗ MongoDB connection failed:', err))\""
else
    echo "Warning: MONGODB_URI not found in .env"
fi

echo ""
echo "=========================================="
echo "  Facebook App Setup"
echo "=========================================="
echo ""
echo "To use this bot, you need to:"
echo "1. Create a Facebook App at https://developers.facebook.com/"
echo "2. Add 'Facebook Login' and 'Pages' products"
echo "3. Get your App ID and App Secret"
echo "4. Generate a long-lived access token"
echo "5. Update backend/.env with these values"
echo ""

echo "=========================================="
echo "  Running the Project"
echo "=========================================="
echo ""
echo "To start the development servers:"
echo "  npm run dev"
echo ""
echo "Or start separately:"
echo "  Backend: npm run start:backend"
echo "  Frontend: npm run start:frontend"
echo ""
echo "Access the dashboard at: http://localhost:3000"
echo "API documentation at: http://localhost:5000/api-docs"
echo ""

echo "=========================================="
echo "  Deployment"
echo "=========================================="
echo ""
echo "To deploy to Render:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub account to Render"
echo "3. Create services using render.yaml"
echo "4. Add environment variables in Render dashboard"
echo ""
echo "Or deploy manually:"
echo "  git push origin main"
echo "  # Then create services in Render dashboard"
echo ""

echo "=========================================="
echo "  Initialization Complete!"
echo "=========================================="
