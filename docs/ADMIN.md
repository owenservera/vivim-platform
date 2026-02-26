# <img src="https://img.icons8.com/color/48/000000/administrator-male.png" width="40" align="left" /> VIVIM Admin Panel

### Platform Management & Monitoring Dashboard

[« Back to Main Repository](../README.md) | [« Back to Documentation Index](./README.md)

---

## 📖 Table of Contents

- [✨ Overview](#-overview)
- [🎯 Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [🏗️ Architecture](#️-architecture)
- [📊 Dashboard Views](#-dashboard-views)
- [🔧 Configuration](#-configuration)
- [🤝 Contributing](#-contributing)

---

## ✨ Overview

The **VIVIM Admin Panel** is a comprehensive management dashboard for monitoring and administering the VIVIM platform. Built with React and Vite, it provides real-time insights into system health, user management, and platform analytics.

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| TypeScript | 5.9.x | Type Safety |
| TailwindCSS | 4.x | Styling |
| Vite | 6.x | Build Tool |
| TanStack Query | 5.x | Data Fetching |
| Recharts | 2.x | Data Visualization |
| Zustand | 5.x | State Management |

---

## 🎯 Features

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **System Dashboard** | Real-time system health monitoring | ✅ Stable |
| **User Management** | View, search, and manage users | ✅ Stable |
| **Analytics** | Platform usage statistics and trends | 🚧 Beta |
| **Content Moderation** | Review and moderate user content | 🚧 Beta |
| **System Logs** | View and search system logs | ✅ Stable |
| **Configuration** | Platform-wide settings | 🚧 Beta |
| **Network Status** | P2P network visualization | 📝 Planned |
| **Audit Trail** | Administrative action logging | 📝 Planned |

### Admin Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full access to all features |
| **Moderator** | Content moderation, user management |
| **Analyst** | Read-only analytics and reports |
| **Operator** | System operations, no user data access |

---

## 📦 Installation

```bash
# Navigate to admin-panel directory
cd admin-panel

# Install dependencies
bun install
```

### Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.90.21",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router-dom": "^7.13.0",
    "recharts": "^2.15.0",
    "tailwindcss": "^4.1.18",
    "zustand": "^5.0.11"
  }
}
```

---

## 🚀 Quick Start

### Development

```bash
# Start development server
bun run dev

# Server runs at http://localhost:5174
```

### Build

```bash
# Production build
bun run build

# Preview production build
bun run preview
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Admin Panel Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Pages Layer                           │   │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │   │
│  │  │Dashboard│ │  Users   │ │Analytics│ │   Settings   │  │   │
│  │  └─────────┘ └──────────┘ └─────────┘ └──────────────┘  │   │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │   │
│  │  │ Content │ │   Logs   │ │ Network │ │    Audit     │  │   │
│  │  └─────────┘ └──────────┘ └─────────┘ └──────────────┘  │   │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                 Components Layer                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │   Charts    │  │    Data     │  │    Navigation   │   │ │
│  │  │ Components  │  │   Tables    │  │   Components    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                   API Layer                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │   Admin     │  │    User     │  │     System      │   │ │
│  │  │    API      │  │    API      │ │     API         │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Dashboard Views

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    System Overview                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐ │
│  │   Users     │  │  Content    │  │   Memory    │  │  API   │ │
│  │   12,453    │  │   89,234    │  │   245,678   │  │  99.9% │ │
│  │   +12%      │  │   +5%       │  │   +18%      │  │  OK    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              API Requests (Last 24 Hours)                │   │
│  │  ████▄▄▄▄████████▄▄▄████████████▄▄▄███████████          │   │
│  │  0    6    12   18   0    6    12   18   0              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │   System Health     │  │      Recent Activities          │  │
│  │  ● Database: OK     │  │  • New user registered          │  │
│  │  ● Redis: OK        │  │  • Content flagged for review   │  │
│  │  ● P2P Network: OK  │  │  • System backup completed      │  │
│  │  ● Storage: 67%     │  │  • API rate limit increased     │  │
│  └─────────────────────┘  └─────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### User Management

| Feature | Description |
|---------|-------------|
| **User List** | Paginated table with search and filters |
| **User Details** | Complete user profile and activity |
| **Bulk Actions** | Select and perform actions on multiple users |
| **Export** | Export user data in CSV/JSON format |

### Analytics Dashboard

| Chart | Description |
|-------|-------------|
| **User Growth** | New users over time |
| **Content Volume** | Content creation trends |
| **API Usage** | Request volume and latency |
| **Geographic Distribution** | Users by region |
| **Device Breakdown** | Desktop vs Mobile vs Tablet |

---

## 🔧 Configuration

### Environment Variables

```bash
# Admin Panel
VITE_ADMIN_API_URL=http://localhost:3333
VITE_ADMIN_WS_URL=ws://localhost:3333

# Authentication
VITE_ADMIN_JWT_SECRET=your-admin-secret
VITE_ADMIN_SESSION_TIMEOUT=3600

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_USER_MANAGEMENT=true
VITE_ENABLE_CONTENT_MODERATION=true
```

### Admin Routes

```typescript
// Route configuration
const adminRoutes = [
  {
    path: '/',
    component: Dashboard,
    permission: 'admin:read'
  },
  {
    path: '/users',
    component: UserManagement,
    permission: 'users:manage'
  },
  {
    path: '/analytics',
    component: Analytics,
    permission: 'analytics:read'
  },
  {
    path: '/content',
    component: ContentModeration,
    permission: 'content:moderate'
  },
  {
    path: '/logs',
    component: SystemLogs,
    permission: 'logs:read'
  },
  {
    path: '/settings',
    component: Settings,
    permission: 'settings:manage'
  }
]
```

---

## 📁 Project Structure

```
admin-panel/
├── src/
│   ├── pages/                 # Page components
│   │   ├── Dashboard.tsx
│   │   ├── UserManagement.tsx
│   │   ├── Analytics.tsx
│   │   ├── ContentModeration.tsx
│   │   ├── SystemLogs.tsx
│   │   └── Settings.tsx
│   │
│   ├── components/            # Reusable components
│   │   ├── charts/
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   └── PieChart.tsx
│   │   ├── tables/
│   │   │   ├── DataTable.tsx
│   │   │   └── UserTable.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   │
│   ├── stores/                # Zustand stores
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useUsers.ts
│   │   └── useAnalytics.ts
│   │
│   ├── lib/                   # Utilities
│   │   ├── api.ts
│   │   └── utils.ts
│   │
│   └── App.tsx                # Main app component
│
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🤝 Contributing

### Development Setup

```bash
# Clone and navigate
cd admin-panel

# Install dependencies
bun install

# Start development
bun run dev
```

### Code Style

```bash
# Lint
bun run lint

# Format
bun run format

# Type check
bun run typecheck
```

---

## 📜 License

MIT License - see [LICENSE](../LICENSE) for details.

---

<div align="center">

**Built with ❤️ by the VIVIM Team**

[⬆ Back to top](#vivim-admin-panel) | [🏠 Back to Main Repo](../README.md) | [📚 Back to Docs](./README.md)

</div>
