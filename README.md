# Sandy's Market

A comprehensive digital platform for a gas station and pizza place, featuring a customer web portal, admin dashboard, and mobile applications.

## Overview

Sandy's Market is a full-stack application that allows customers to view gas prices, place food orders online, and track their orders. The platform includes an admin interface for managing orders, updating gas prices, and monitoring business operations.

## Tech Stack

### Frontend (Web)
- **React 18** with TypeScript
- **Vite** for build tooling
- **Radix UI** for accessible components
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons

### Backend (API)
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Firebase Admin SDK** for push notifications
- **JWT** for authentication
- **Nodemailer** for email notifications

### Mobile Applications
- **Admin Android App**: React Native (in development)
- **Customer App**: Planned for future development

### Infrastructure
- **Frontend**: Deployed on web hosting
- **Backend**: Node.js server with API endpoints
- **Database**: MongoDB Atlas cloud database
- **Push Notifications**: Firebase Cloud Messaging (FCM)

## Features

### Customer Features
- **Gas Price Display**: Real-time gas prices for Regular, Mid-Grade, Premium, and Diesel
- **Online Food Ordering**: Browse menu and place orders for pickup
- **Order Tracking**: View order status and history
- **User Registration/Login**: Account management with order history
- **Email Confirmations**: Automated order confirmation emails

### Admin Features
- **Order Management**: View, update, and track all customer orders
- **Gas Price Updates**: Real-time gas price management
- **Push Notifications**: Send notifications to customer devices
- **Dashboard Analytics**: Order statistics and business insights
- **User Management**: View registered customers

### Technical Features
- **Real-time Updates**: Live order status updates
- **Mobile-Responsive**: Optimized for all device sizes
- **Push Notifications**: Firebase-powered customer notifications
- **Email Integration**: Automated customer and admin notifications
- **Secure Authentication**: JWT-based user sessions
- **Data Validation**: Comprehensive input validation and error handling

## Project Structure

```
sandymarket/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── api/            # API service functions
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets and images
├── backend/                 # Node.js API server
│   └── src/
│       ├── routes/         # API route handlers
│       ├── models/         # MongoDB schemas
│       ├── middleware/     # Express middleware
│       ├── services/       # Business logic services
│       └── config/         # Configuration files
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `PATCH /api/auth/fcm-token` - Update FCM token

### Orders
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/my-orders` - Get user's orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order status (admin)

### Gas Prices
- `GET /api/gasprice` - Get current gas prices
- `PATCH /api/gasprice` - Update gas prices (admin)

## Mobile Applications

### Admin Android App (React Native)
The admin mobile application is currently in development using React Native, providing:
- Real-time order notifications
- Quick order status updates
- Mobile gas price management
- Push notification management

**Tech Stack:**
- React Native
- TypeScript
- React Navigation
- Firebase SDK
- Async Storage

## Architecture

The application follows a modern full-stack architecture:

- **Frontend**: Single-page application (SPA) built with React and TypeScript
- **Backend**: RESTful API server with Express.js and MongoDB
- **Mobile**: React Native for cross-platform mobile development
- **Real-time Communication**: Firebase Cloud Messaging for push notifications
- **Authentication**: JWT-based authentication with secure token management
- **Database**: MongoDB with Mongoose for object modeling
- **Email Service**: Nodemailer for transactional emails

## Business Value

Sandy's Market digitizes operations for a traditional gas station and pizza business:

- **Increased Efficiency**: Online ordering reduces phone-based orders
- **Customer Convenience**: Real-time gas prices and order tracking
- **Admin Control**: Centralized management of prices and orders
- **Mobile Accessibility**: Admin app enables management on-the-go
- **Automated Communications**: Email confirmations and push notifications
- **Data Insights**: Order analytics and customer behavior tracking

---

**Sandy's Market** - Serving the community with quality food and fuel ⛽🍕