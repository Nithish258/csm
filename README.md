# ColdChain OS ❄️

**The Next-Generation Operating System for Enterprise Cold Storage & Logistics.**

ColdChain OS is a premium, SaaS-ready Warehouse Management System (WMS) designed specifically for cold storage facilities. It combines high-performance node telemetry with intuitive logistics automation to streamline warehouse operations.

![Project Preview](https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000)

## 🚀 Key Features

- **Hierarchical Location Management**: Manage chambers, floors, and blocks with real-time occupancy distribution (Empty/Partial/Full).
- **Intelligent Shipment Routing**: Automated stock commitment for incoming shipments and client-balance validation for outgoing orders.
- **Analytical Report Engine**: Professional-grade audit logs and historical tracking with hierarchical date filtering (Year/Month/Day).
- **Real-time Telemetry**: Live synchronization with Firebase Firestore for instant data across all operator nodes.
- **Multilingual Support**: Full internationalization support for English, Telugu, and Hindi.
- **Premium UI/UX**: State-of-the-art interface with Glassmorphism, OLED Dark Mode, and high-contrast Light Mode.

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Lucide Icons, Framer Motion
- **Backend**: Firebase (Auth, Firestore)
- **State Management**: Zustand
- **Internationalization**: i18next

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm / yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Nithish258/csm.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the root and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔐 Security
ColdChain OS uses AES-256 equivalent encryption for data at rest and utilizes Firebase's security rules to ensure tenant-scoped data isolation.

## 📄 License
This project is proprietary and for enterprise use. See the license agreement for more details.

---
Built with ❤️ for modern logistics.
