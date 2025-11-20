#!/bin/bash

# 🚀 E-HADIR FELCRA - Quick Deployment Script
# This script helps you deploy the E-HADIR system quickly

echo "========================================="
echo "  E-HADIR FELCRA - Deployment Script"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) detected${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found!${NC}"
    echo ""
    echo "Creating .env.local template..."
    cat > .env.local << 'EOF'
# Google Service Account
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=suratmasukkeluar@surat-masuk-dan-keluar.iam.gserviceaccount.com
GOOGLE_SHEET_ID=1sNxZCmzulKpv8BQu0-6P2mC1wX33RZfCYRGSV4h6A0U

# Admin
NEXT_PUBLIC_ADMIN_PASSWORD=onearekeamall
EOF
    echo -e "${GREEN}✅ .env.local template created${NC}"
    echo -e "${YELLOW}⚠️  Please update .env.local with your credentials before continuing!${NC}"
    echo ""
    read -p "Press Enter once you've updated .env.local..."
fi

echo ""
echo "========================================="
echo "  Installing Dependencies"
echo "========================================="
echo ""

npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo "========================================="
echo "  Testing Configuration"
echo "========================================="
echo ""

# Test if .env.local has the required variables
if grep -q "YOUR_PRIVATE_KEY_HERE" .env.local 2>/dev/null; then
    echo -e "${RED}❌ .env.local still contains template values!${NC}"
    echo "Please update .env.local with real credentials."
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration looks good${NC}"
echo ""

# Ask user what they want to do
echo "========================================="
echo "  What would you like to do?"
echo "========================================="
echo ""
echo "1) Start development server (npm run dev)"
echo "2) Build for production (npm run build)"
echo "3) Deploy to Vercel"
echo "4) Deploy to Netlify"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "Starting development server..."
        npm run dev
        ;;
    2)
        echo ""
        echo "Building for production..."
        npm run build
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Build successful!${NC}"
            echo "Run 'npm start' to test the production build locally"
        else
            echo -e "${RED}❌ Build failed!${NC}"
            exit 1
        fi
        ;;
    3)
        echo ""
        echo "Deploying to Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "Vercel CLI not found. Installing..."
            npm install -g vercel
        fi
        echo ""
        echo -e "${YELLOW}⚠️  Remember to add environment variables in Vercel dashboard!${NC}"
        echo ""
        vercel
        ;;
    4)
        echo ""
        echo "Deploying to Netlify..."
        if ! command -v netlify &> /dev/null; then
            echo "Netlify CLI not found. Installing..."
            npm install -g netlify-cli
        fi
        echo ""
        echo -e "${YELLOW}⚠️  Remember to add environment variables in Netlify dashboard!${NC}"
        echo ""
        netlify deploy
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo -e "${GREEN}✅ All done!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure your Google Spreadsheet is shared with:"
echo "   suratmasukkeluar@surat-masuk-dan-keluar.iam.gserviceaccount.com"
echo ""
echo "2. Add environment variables to your hosting platform:"
echo "   - GOOGLE_PRIVATE_KEY"
echo "   - GOOGLE_CLIENT_EMAIL"
echo "   - GOOGLE_SHEET_ID"
echo "   - NEXT_PUBLIC_ADMIN_PASSWORD"
echo ""
echo "3. Test your deployment!"
echo ""
echo "For help, refer to README.md"
echo ""
