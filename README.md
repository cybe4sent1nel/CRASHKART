<div align="center">
  <img src="public/logo.bmp" alt="CrashKart Logo" width="120" height="120">
  
  # 🛒 CrashKart
  
  ### Your Ultimate Gadget Shopping Destination
  
  *A feature-rich, modern e-commerce platform built for the tech-savvy generation*
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.19.1-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  
  **Designed & Developed by [Fahad Khan](https://github.com/cybe4sent1nel) (cybe4sent1nel)**
  
  [Demo](https://crashkart.vercel.app) • [Admin Panel](https://crashkart.vercel.app/admin/login) • [Report Bug](https://github.com/cybe4sent1nel/crashkart/issues) • [Request Feature](https://github.com/cybe4sent1nel/crashkart/issues)
</div>

---

## 🎯 About CrashKart

CrashKart isn't just another e-commerce platform—it's a complete shopping ecosystem designed specifically for electronics and gadget enthusiasts. Built from the ground up with modern web technologies, it combines blazing-fast performance with an intuitive user experience that makes online shopping genuinely enjoyable.

What started as a vision to simplify tech shopping has evolved into a full-featured marketplace with everything from AI-powered support to real-time notifications, all wrapped in a beautiful, responsive interface that works seamlessly across devices.

### 🌟 Why CrashKart?

- **Lightning Fast**: Built with Next.js 15 and Turbopack for instant page loads
- **Smart Shopping**: AI-powered recommendations and search
- **Secure Payments**: Multiple payment gateways with PCI compliance
- **Real-time Updates**: Live order tracking and instant notifications
- **Gamified Experience**: Earn CrashCash rewards with every purchase
- **24/7 AI Support**: Meet Inquirae, your intelligent shopping assistant
- **Fully Responsive**: Pixel-perfect on mobile, tablet, and desktop

---

## ✨ Core Features

### 🛍️ **Shopping Experience**
- **Smart Product Catalog** - Advanced filtering, sorting, and search with fuzzy matching
- **Flash Sales & Deals** - Time-limited offers with countdown timers
- **Recently Viewed** - Track and revisit products you've browsed
- **Product Recommendations** - AI-powered suggestions based on browsing history
- **Quick Checkout** - Streamlined buy-now flow for single products
- **Guest Checkout** - Shop without creating an account

### 💳 **Payment & Wallet**
- **Multiple Payment Methods** - Cashfree, Stripe, and Cash on Delivery
- **CrashCash Wallet** - Earn rewards (₹10-240) on every purchase
- **Secure Transactions** - PCI-DSS compliant payment processing
- **Failed Payment Recovery** - Retry failed payments seamlessly
- **Order Discounts** - Apply CrashCash at checkout for instant savings

### 📦 **Order Management**
- **Real-time Order Tracking** - Live status updates with animated Lottie icons
- **Order History** - Complete transaction history with detailed breakdowns
- **Cancellation Support** - Cancel orders before shipment with instant refunds
- **Return & Refund** - Full return flow tracking: Return Accepted → Picked Up → Refund Completed
- **Multi-product Tracking** - Track multiple orders simultaneously with separate shipment IDs
- **Animated Status Updates** - Beautiful animations for each order status (processing, shipped, delivered, return, refund, cancelled)
- **Invoice Generation** - Download/print order invoices with one click
- **Payment Status Toggle** - Admin can toggle payment status (Paid/Pending) with one click
- **Pay Now Option** - Users can pay for pending orders directly from My Orders page

### 🤖 **AI-Powered Support (Inquirae)**
- **Intelligent Chatbot** - Context-aware responses using Llama 3.2
- **Order Assistance** - Get help with specific orders in real-time
- **Complaint Management** - Raise tickets and track resolution status
- **File Attachments** - Upload images/videos via ImageKit
- **Conversation Memory** - Persistent chat history across sessions
- **Ticket Generation** - Automatic ticket creation with tracking links
- **24/7 Availability** - Get support anytime, anywhere

### 🔐 **Authentication & Security**
- **Multi-auth System** - Email, Google OAuth, Phone OTP
- **JWT Sessions** - Secure token-based authentication
- **Email Verification** - Verify email addresses for account security
- **Phone Verification** - SMS OTP verification via Twilio
- **Password Recovery** - Secure password reset flow
- **Session Management** - Auto-logout and session persistence

### 📱 **Notifications & Alerts**
- **Real-time Notifications** - Bell icon with unread count
- **Order Updates** - Status change alerts (placed, shipped, delivered)
- **Payment Confirmations** - Instant payment success/failure notifications
- **WhatsApp Notifications** - Order updates via Twilio WhatsApp
- **Email Notifications** - Detailed order receipts and updates
- **Stock Alerts** - Get notified when out-of-stock items return

### 🎨 **User Experience**
- **Dark Mode** - System-aware theme switching with localStorage persistence
- **Offline Support** - Graceful offline detection with retry mechanisms
- **Loading States** - Skeleton loaders and progress indicators
- **Toast Notifications** - Non-intrusive feedback for user actions
- **Responsive Design** - Mobile-first approach with fluid layouts
- **Accessibility** - WCAG compliant with keyboard navigation
- **Lottie Animations** - Smooth, engaging animations for all order statuses
- **Interactive Tracking** - Expandable tracking timeline with visual progress indicators

### 🏪 **Seller Dashboard** (Admin)
- **Product Management** - Add, edit, delete products with bulk operations
- **Order Processing** - Manage orders, update statuses (including return/refund flows), handle cancellations
- **Payment Management** - Toggle payment status (Paid/Pending) with one click
- **Inventory Control** - Track stock levels with low-stock alerts
- **Sales Analytics** - Revenue reports and sales trends
- **Customer Management** - View customer data and order history
- **Return & Refund Handling** - Process returns, pickups, and refunds seamlessly
- **Store Settings** - Configure shipping, returns, and business details
- **Admin Authentication** - Secure login at `/admin/login` (Production: https://crashkart.vercel.app/admin/login | Local: http://localhost:3000/admin/login)

### 🎁 **Gamification & Rewards**
- **CrashCash System** - Virtual currency earned on purchases
- **Random Rewards** - Variable reward amounts (₹10-240) per order
- **Scratch Cards** - Google Pay-style scratch-and-win interface
- **Wallet Balance** - Check balance and transaction history
- **Reward Tracking** - View total earned and redeemed amounts

### 🔍 **Advanced Features**
- **Fuzzy Search** - Typo-tolerant product search
- **Product Ratings** - Star ratings with review system
- **Address Management** - Save multiple addresses with default selection
- **Cart Persistence** - Cart saved across sessions via localStorage
- **Recently Viewed History** - Browse history tracking
- **Cookie Consent** - GDPR-compliant cookie management
- **Feedback System** - In-app feedback collection

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 15.5.7 (App Router + Turbopack)
- **UI Library**: React 19
- **Styling**: TailwindCSS 3.4 + styled-components
- **State Management**: Redux Toolkit + React Context
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

### **Backend**
- **Runtime**: Node.js
- **API**: Next.js API Routes (REST)
- **Database**: MongoDB (Atlas)
- **ORM**: Prisma 6.19.1
- **Authentication**: NextAuth.js + JWT

### **External Services**
- **Payments**: Cashfree, Stripe
- **File Storage**: ImageKit
- **SMS/WhatsApp**: Twilio
- **Email**: Nodemailer
- **AI Chatbot**: OpenRouter (Llama 3.2-3b-instruct)
- **OAuth**: Google OAuth 2.0

### **DevOps & Tools**
- **Version Control**: Git
- **Package Manager**: npm
- **Code Quality**: ESLint
- **Deployment**: Vercel (recommended)

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cybe4sent1nel/crashkart.git
   cd crashkart
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory and add the following variables:

   ```env
   # ============================================
   # DATABASE (MongoDB)
   # ============================================
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/crashkart?retryWrites=true&w=majority

   # ============================================
   # APPLICATION
   # ============================================
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_CURRENCY_SYMBOL=₹

   # ============================================
   # DEMO MODE (Set to false for production)
   # ============================================
   DEMO_MODE=false

   # ============================================
   # STRIPE PAYMENT
   # ============================================
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

   # ============================================
   # GOOGLE OAUTH
   # ============================================
   GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxx

   # ============================================
   # JWT & NEXTAUTH
   # ============================================
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   NEXTAUTH_SECRET=your-nextauth-secret-key-min-32-chars
   NEXTAUTH_URL=http://localhost:3000

   # ============================================
   # EMAIL SERVICE
   # ============================================
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # ============================================
   # WHATSAPP NOTIFICATIONS (Twilio)
   # ============================================
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   TWILIO_PHONE_NUMBER=+1234567890

   # ============================================
   # AI CHATBOT (OpenRouter)
   # ============================================
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
   NEXT_PUBLIC_CHATBOT_API_KEY=xxxxxxxxxxxxx
   OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free

   # ============================================
   # IMAGEKIT (File Storage)
   # ============================================
   NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxx
   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
   IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxx

   # ============================================
   # CASHFREE (Payment Gateway)
   # ============================================
   CASHFREE_APP_ID=xxxxxxxxxxxxx
   CASHFREE_SECRET_KEY=xxxxxxxxxxxxx
   NEXT_PUBLIC_CASHFREE_ENV=sandbox  # Use 'production' for live

   # ============================================
   # DEVELOPER INFO
   # ============================================
   NEXT_PUBLIC_DEVELOPER_NAME=Fahad Khan (cybe4sent1nel)
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### 🔧 Environment Variables Guide

<details>
<summary><b>Database Configuration</b></summary>

- `DATABASE_URL`: MongoDB connection string
  - For local: `mongodb://localhost:27017/crashkart`
  - For Atlas: Get from MongoDB Atlas dashboard
</details>

<details>
<summary><b>Payment Gateways</b></summary>

**Stripe**
- Sign up at [stripe.com](https://stripe.com)
- Get keys from Dashboard → Developers → API keys
- Use test keys for development (starts with `pk_test_` and `sk_test_`)

**Cashfree**
- Sign up at [cashfree.com](https://www.cashfree.com)
- Get credentials from Dashboard → Developers
- Use sandbox mode for testing
</details>

<details>
<summary><b>Google OAuth</b></summary>

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - Your production domain
</details>

<details>
<summary><b>Email Service</b></summary>

**Gmail Setup**
1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password
4. Use this password in `EMAIL_PASS`
</details>

<details>
<summary><b>Twilio (WhatsApp & SMS)</b></summary>

1. Sign up at [twilio.com](https://www.twilio.com)
2. Get Account SID and Auth Token from Console
3. For WhatsApp:
   - Use Twilio's sandbox: `whatsapp:+14155238886`
   - Join sandbox by sending "join <sandbox-name>" to the number
4. For SMS: Get a Twilio phone number
</details>

<details>
<summary><b>OpenRouter (AI Chatbot)</b></summary>

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Get API key from Settings
3. Choose a free model: `meta-llama/llama-3.2-3b-instruct:free`
4. Add credits or use free tier
</details>

<details>
<summary><b>ImageKit (File Storage)</b></summary>

1. Sign up at [imagekit.io](https://imagekit.io)
2. Get keys from Dashboard → Developer Options
3. Copy URL endpoint, public key, and private key
4. Used for product images and support file uploads
</details>

---

## 📁 Project Structure

```
crashkart/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (shop, products, etc.)
│   │   ├── checkout/             # Checkout flow
│   │   ├── complaints/[id]/      # Complaint tracking page
│   │   ├── support/              # AI support chat
│   │   └── ...
│   ├── admin/                    # Admin dashboard
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── orders/               # Order management
│   │   ├── payments/             # Payment processing
│   │   ├── support/              # Support chat & tickets
│   │   └── ...
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── AuroraBackground.jsx      # Animated backgrounds
│   ├── ChatbotEnhanced.jsx       # Floating support button
│   ├── Navbar.jsx                # Navigation bar
│   ├── NoddingOrange.jsx         # Animated mascot
│   └── ...
├── lib/                          # Utility functions
│   ├── auth.js                   # NextAuth configuration
│   ├── prisma.js                 # Prisma client
│   └── ...
├── prisma/                       # Database schema
│   └── schema.prisma             # Prisma schema
├── public/                       # Static assets
│   ├── logo.bmp                  # App logo
│   └── ...
├── scripts/                      # Utility scripts
├── .env                          # Environment variables
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
└── package.json                  # Dependencies
```

---

## 🎮 Usage

### For Customers

1. **Browse Products** - Explore categories, search, and filter products
2. **Add to Cart** - Add items and manage cart
3. **Checkout** - Complete purchase with preferred payment method
4. **Track Orders** - Monitor order status in real-time
5. **Earn CrashCash** - Scratch cards after order placement
6. **Get Support** - Chat with Inquirae for instant help

### For Admin

1. **Access Admin Panel** 
   - **Production**: https://crashkart.vercel.app/admin/login
   - **Local Development**: http://localhost:3000/admin/login
2. **Manage Products** - Add/edit/delete products
3. **Process Orders** - Update order statuses (including return/refund flows)
4. **Toggle Payment Status** - Click payment badge to mark orders as Paid/Pending
5. **View Analytics** - Check sales reports
6. **Handle Support** - Review and resolve tickets
7. **Process Returns** - Manage return requests and issue refunds

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License. See `LICENSE` file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing framework
- **Vercel** - For seamless deployment
- **MongoDB** - For reliable database hosting
- **Prisma** - For the excellent ORM
- **OpenRouter** - For AI model access
- **All Contributors** - For their valuable input

---

## 📧 Contact

**Fahad Khan (cybe4sent1nel)**
- GitHub: [@cybe4sent1nel](https://github.com/cybe4sent1nel)
- Email: fahadkhanxyz8816@gmail.com
- LinkedIn: [Fahad Khan](https://www.linkedin.com/in/fahad-cybersecurity-ai/)

---

<div align="center">
  
  ### ⭐ Star this repo if you find it helpful!
  
  **Made with ❤️ by [Fahad Khan](https://github.com/cybe4sent1nel)**
  
  *CrashKart - Where Shopping Meets Innovation*
  
</div>
