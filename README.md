# ⛽ Sandy's Market (Full Stack Platform)

> A full-stack retail management system for Sandy's Market handling online food orders, real-time admin notifications, fuel tank monitoring, gas price management, and multi-channel customer communication.

---

## 🧱 Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-black?logo=shadcnui&logoColor=white&style=for-the-badge)
![React Router](https://img.shields.io/badge/React_Router-6-CA4245?logo=reactrouter&logoColor=white&style=for-the-badge)
![Recharts](https://img.shields.io/badge/Recharts-2-22C55E?logo=chart.js&logoColor=white&style=for-the-badge)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-EF0089?logo=framer&logoColor=white&style=for-the-badge)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-20-5FA04E?logo=nodedotjs&logoColor=white&style=for-the-badge)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white&style=for-the-badge)
![Mongoose](https://img.shields.io/badge/Mongoose-8-880000?logo=mongoose&logoColor=white&style=for-the-badge)
![node-cron](https://img.shields.io/badge/node--cron-Scheduler-orange?logo=clockify&logoColor=white&style=for-the-badge)

### Notifications & Integrations
![Firebase](https://img.shields.io/badge/Firebase_FCM-Push_Notifications-FFCA28?logo=firebase&logoColor=black&style=for-the-badge)
![Resend](https://img.shields.io/badge/Resend-Email-000000?logo=mail.ru&logoColor=white&style=for-the-badge)
![TextBee](https://img.shields.io/badge/TextBee-SMS-22C55E?logo=twilio&logoColor=white&style=for-the-badge)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white&style=for-the-badge)
![AWS S3](https://img.shields.io/badge/AWS_S3-Image_Storage-FF9900?logo=amazons3&logoColor=white&style=for-the-badge)

---

## 📁 Project Structure

```
sandymarket/
├── backend/                    # Node.js + Express API server
│   └── src/
│       ├── index.ts            # App entry point
│       ├── middleware/
│       │   └── auth.ts         # JWT authentication middleware
│       ├── models/
│       │   ├── Order.ts        # Order schema
│       │   ├── User.ts         # User schema
│       │   └── Gasprice.ts     # Gas price schema
│       ├── routes/
│       │   ├── orders.ts       # Order CRUD + status updates
│       │   ├── auth.ts         # Register / login / profile
│       │   ├── fuel.ts         # Fuel status + manual alert trigger
│       │   └── gasprice.ts     # Gas price management
│       ├── services/
│       │   ├── canaryApiService.ts       # Canary API integration (tank data)
│       │   ├── fuelMonitoringService.ts  # Fuel level check + alert dispatch
│       │   ├── notificationService.ts    # FCM push notifications
│       │   ├── resendEmailService.ts     # Email via Resend API
│       │   └── smsService.ts            # SMS via TextBee API
│       ├── jobs/
│       │   └── fuelMonitoringJob.ts     # node-cron scheduler (every 4h)
│       ├── types/
│       │   ├── fuelTypes.ts    # TankInventory, FuelThresholds, LowFuelAlert, etc.
│       │   └── order.ts        # OrderItem, OrderDetails, SendSmsParams, etc.
│       └── config/
│           └── firebase.ts     # Firebase Admin SDK init
│
└── frontend/                   # React + Vite + Tailwind web dashboard
    └── src/
        ├── pages/              # Orders, Fuel, Gas Price, Auth pages
        ├── components/         # shadcn/ui + custom components
        └── hooks/              # React Query data hooks
```

---

## ✨ Features

### 🛒 Order Management
- Customers can place food orders (pickup or door-delivery)
- Coupon code support with pizza-specific discount logic
- Order status tracking: `pending → preparing → ready → delivered`
- Auto-link orders to user accounts by email

### 📧 Multi-Channel Notifications
| Event | Email | Push (FCM) | SMS (TextBee) |
|---|---|---|---|
| New order placed | ✅ Admin + Customer | ✅ Admin | ✅ Admin + Customer |
| Order status update | — | — | ✅ Customer |
| Low fuel alert | ✅ Store emails | ✅ admin1 only | ✅ 8am–8pm ET only |

### ⛽ Fuel Monitoring System
- Integrates with **Canary Compliance API** to fetch live tank inventory
- Monitors 4 tank types: **Regular**, **Premium**, **Diesel**, **REC FUEL**
- Configurable alert thresholds per fuel type via environment variables
- Checks every **4 hours** via cron job (configurable)
- Sends **email + push notification + SMS** when any tank is below threshold
- SMS alerts respect **Detroit business hours (8am–8pm ET)** — no late night texts
- FCM data payload includes `type: "fuel"` for deep-link navigation in the mobile app

### ⛽ Gas Price Management
- Admins can update displayed gas prices via the dashboard

### 🔐 Authentication
- JWT-based auth with role-based access control
- Roles: `user`, `admin`, `admin1`
- `admin1` receives fuel alert push notifications
- `admin` + `admin1` receive order notifications

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/profile` | Get current user profile |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/orders` | Admin | Get all orders |
| GET | `/api/orders/my-orders` | User | Get current user's orders |
| GET | `/api/orders/:id` | User | Get order by ID |
| POST | `/api/orders` | User | Place a new order |
| PATCH | `/api/orders/:id` | Admin | Update order status |

### Fuel
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/fuel/status` | Admin | Get live tank inventory |
| POST | `/api/fuel/test-alert` | Admin | Manually trigger a fuel alert |

### Gas Price
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/gasprice` | Public | Get current gas prices |
| POST | `/api/gasprice` | Admin | Update gas prices |

---

## ⛽ Fuel Alert Flow

```
Every 4 hours (cron)
        │
        ▼
Canary API → Fetch tank levels
        │
        ▼
Compare against thresholds
        │
  Any tanks low?
   ┌────┴────┐
  YES       NO
   │         └──► Log "All tanks OK"
   ▼
┌─────────────────────────────────┐
│  1. Email → STORE_EMAILS        │
│  2. Push → all admin1 users     │
│  3. SMS  → FUEL_ALERT_PHONE     │
│     (only if 8am–8pm Detroit)   │
└─────────────────────────────────┘
```

---

## Gas Buddy Report Emails

Gas Buddy morning/evening price report emails use `GAS_BUDDY_REPORT_EMAILS` when set, and fall back to `STORE_EMAILS` if it is empty.

Use comma-separated addresses for multiple recipients:

```env
GAS_BUDDY_REPORT_EMAILS="owner@example.com,manager@example.com"
```

---

## 📱 Mobile App (FCM Deep Linking)

The backend sends the following FCM data payload with every fuel alert push notification, enabling the mobile app to navigate directly to the Fuel screen:

```json
{
  "type": "fuel",
  "screen": "fuel",
  "isFuelAlert": "true",
  "tankCount": "2",
  "timestamp": "2026-02-18T12:00:00.000Z"
}
```

---

## 🛡️ Role-Based Access

| Feature | `user` | `admin` | `admin1` |
|---|---|---|---|
| Place orders | ✅ | ✅ | ✅ |
| View own orders | ✅ | ✅ | ✅ |
| View all orders | ❌ | ✅ | ✅ |
| Update order status | ❌ | ✅ | ✅ |
| View fuel status | ❌ | ✅ | ✅ |
| Receive order push alerts | ❌ | ✅ | ✅ |
| Receive fuel push alerts | ❌ | ❌ | ✅ |

---

## 📦 Key Dependencies

### Backend
| Package | Purpose |
|---|---|
| `express` | HTTP server framework |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT authentication |
| `node-cron` | Scheduled fuel checks |
| `firebase-admin` | FCM push notifications |
| `resend` | Transactional email |
| `axios` | HTTP client (Canary API, TextBee) |
| `dotenv` | Environment variable management |

### Frontend
| Package | Purpose |
|---|---|
| `react` + `vite` | UI framework + build tool |
| `tailwindcss` + `shadcn/ui` | Styling + component library |
| `react-router-dom` | Client-side routing |
| `recharts` | Data visualization |
| `framer-motion` | Animations |
| `react-hook-form` + `zod` | Form handling + validation |
| `axios` | HTTP client |

---

## 📄 License

Private — Sandy's Market internal use only.
