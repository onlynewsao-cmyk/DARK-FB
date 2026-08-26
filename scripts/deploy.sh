#!/bin/bash

# Facebook Bot - Deployment Script

echo "=========================================="
echo "  Facebook Bot - Deployment Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for git
echo "Checking for git..."
if ! command_exists git; then
    echo "Error: git is not installed"
    exit 1
fi
echo "✓ git found"
echo ""

# Check for node
echo "Checking for node..."
if ! command_exists node; then
    echo "Error: node is not installed"
    exit 1
fi
echo "✓ node found"
echo ""

# Check for npm
echo "Checking for npm..."
if ! command_exists npm; then
    echo "Error: npm is not installed"
    exit 1
fi
echo "✓ npm found"
echo ""

# Check if we have a git remote
echo "Checking git remote..."
if ! git remote | grep -q origin; then
    echo "Warning: No git remote 'origin' found"
    echo "Please add a remote first:"
    echo "  git remote add origin https://github.com/onlynewsao-cmyk/facebook-bot.git"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✓ Git remote found: $(git remote get-url origin)"
fi
echo ""

# Function to display menu
show_menu() {
    echo "Deployment Options:"
    echo "1. Deploy to GitHub (push code)"
    echo "2. Install dependencies"
    echo "3. Start development servers"
    echo "4. Build for production"
    echo "5. Full setup (1 + 2 + 3)"
    echo "6. Exit"
    echo ""
}

# Function to deploy to GitHub
deploy_to_github() {
    echo "Deploying to GitHub..."
    echo ""
    
    # Check if there are changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "Changes detected. Committing..."
        git add .
        read -p "Enter commit message: " commit_message
        git commit -m "$commit_message"
    else
        echo "No changes detected."
    fi
    
    # Push to GitHub
    echo "Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✓ Successfully pushed to GitHub"
    else
        echo "✗ Error pushing to GitHub"
        exit 1
    fi
    echo ""
}

# Function to install dependencies
install_dependencies() {
    echo "Installing dependencies..."
    echo ""
    
    # Root dependencies
    if [ -f "package.json" ]; then
        echo "Installing root dependencies..."
        npm install
        echo "✓ Root dependencies installed"
    fi
    
    # Backend dependencies
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        echo "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
        echo "✓ Backend dependencies installed"
    fi
    
    # Frontend dependencies
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        echo "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        echo "✓ Frontend dependencies installed"
    fi
    echo ""
}

# Function to start development servers
start_dev_servers() {
    echo "Starting development servers..."
    echo ""
    echo "Backend will run on: http://localhost:5000"
    echo "Frontend will run on: http://localhost:3000"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    echo ""
    
    # Check if concurrently is installed
    if ! npm list concurrently >/dev/null 2>&1; then
        echo "Installing concurrently..."
        npm install concurrently
    fi
    
    # Start both servers
    npm run dev
}

# Function to build for production
build_production() {
    echo "Building for production..."
    echo ""
    
    if [ -d "frontend" ]; then
        cd frontend
        npm run build
        cd ..
        echo "✓ Frontend built for production"
    fi
    echo ""
}

# Function to do full setup
full_setup() {
    echo "Running full setup..."
    echo ""
    install_dependencies
    deploy_to_github
    start_dev_servers
}

# Main menu
while true; do
    show_menu
    read -p "Select an option (1-6): " option
    echo ""
    
    case $option in
        1)
            deploy_to_github
            ;;
        2)
            install_dependencies
            ;;
        3)
            start_dev_servers
            ;;
        4)
            build_production
            ;;
        5)
            full_setup
            ;;
        6)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option. Please try again."
            echo ""
            ;;
    esac
done
