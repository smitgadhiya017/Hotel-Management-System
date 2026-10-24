# GrandStay — Luxury Hotel Management System (Frontend)

A commercial-grade, modern Hotel Management System & Operations Dashboard built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. Designed specifically for luxury hotels, boutique resorts, and hospitality managers, featuring realistic Indian hotel operations, **INR (₹)** pricing, and **UPI** payment integrations.

---

## 🌟 Key Features

### 🏨 1. Executive Operations Dashboard
- **Real-Time KPIs**: Total Rooms, Occupancy Rate, Today's Revenue (INR), Active Reservations, Pending Check-Ins/Outs.
- **Revenue Analytics**: Interactive revenue trend charts with monthly/weekly drill-downs and occupancy breakdown.
- **Operational Feeds**: Today's arrivals and departures with direct 1-click status triggers.
- **Room Status Distribution**: Visual gauge of Available, Occupied, Reserved, and Maintenance rooms.

### 🛏️ 2. Room Inventory Management
- **Room Types**: Standard, Deluxe, Family Suites, and Royal Presidential Suites.
- **Dual View Modes**: Interactive Card Grid and detailed Data Table.
- **Real-Time Filtering**: Filter by room status (`Available`, `Occupied`, `Reserved`, `Maintenance`), type, floor, or amenities.
- **Room CRUD**: Add new rooms, adjust tariffs, update amenities, or schedule maintenance.

### 📅 3. Reservation System
- **Booking Pipeline**: Track bookings through `Confirmed`, `Checked In`, `Checked Out`, `Cancelled`, and `Pending`.
- **Automated Pricing**: Auto-computes total tariffs based on room rates, nights, and adult/child capacity.
- **Guest Association**: Search and link returning guests or register new guests directly during reservation.

### 👥 4. Guest Relationship Management (CRM)
- **Guest Profiles**: Complete guest directories with VIP classification and stay history logs.
- **Stay Preferences**: Dietary preferences (e.g. Jain, Vegetarian), floor preferences, airport pickup flags.
- **Guest History Modal**: Review all past and active bookings per guest with expenditure metrics.

### 🚪 5. Front Desk Check-In / Check-Out
- **Dedicated Operational Desk**: Filter by today's arrivals and departures.
- **1-Click Workflow**:
  - **Check-In**: Instantly marks booking as `Checked In` and switches room status to `Occupied`.
  - **Check-Out**: Computes outstanding folio balance, checks out the guest, and flags room for Housekeeping (`Maintenance`).

### 💳 6. Billing & Invoicing
- **Multi-Method Support**: **UPI** (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking (NEFT/RTGS), and Cash.
- **Payment Folios**: Record deposits, partial payments, and full settlements with automatic booking status updates.
- **Printable Invoices**: Built-in modal generator with hotel header, itemized room breakdown, 18% GST tax calculation, and print-ready CSS.

### 👨‍💼 7. Staff Management
- **Role Badging**: Administrator, General Manager, Front Desk Receptionist, Housekeeping, and Maintenance.
- **Shift & Department Logs**: Track departmental assignments, phone/email directories, and leave statuses.

### 📊 8. Reports & Analytics
- **Visual Analytics with Recharts**: Monthly Revenue Bar Charts (in Lakhs), Occupancy Trends, and Room Type Distributions.
- **Data Export**: 1-click CSV report export for offline auditing and accounting.

### ⚙️ 9. Hotel Settings & Customization
- **Hotel Branding**: Configure Hotel Name, Address, Contact details, Check-in/out hours, and Invoice Footers.
- **Currency & Taxation**: Native INR (`₹`) support with customizable GST rates.
- **Local Persistence & Demo Reset**: Complete reactive state backed by `localStorage` with instant reset buttons.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [Vite](https://vite.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Custom Glassmorphism |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Routing** | [React Router v7](https://reactrouter.com/) |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) |
| **Persistence** | Browser `localStorage` (Reactive hooks with zero backend dependency) |

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/smitgadhiya017/Hotel-Management-System.git
cd Hotel-Management-System
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for production
```bash
npm run build
```

---

## 📂 Project Structure

```
Hotel-Management-System/
├── public/                # Static assets & favicons
├── src/
│   ├── assets/            # Images & SVGs
│   ├── components/
│   │   ├── layout/        # Sidebar, Topbar, Main Shell
│   │   └── shared/        # Modals, FormFields, KPI Cards, StatusBadges
│   ├── data/
│   │   └── mockData.ts    # Initial Indian showcase dataset (Rooms, Guests, Staff, Settings)
│   ├── hooks/
│   │   └── useAppData.ts  # Master localStorage persistent state & CRUD hooks
│   ├── lib/
│   │   └── utils.ts       # Currency formatter (INR), Date utilities, CSV exporter
│   ├── pages/
│   │   ├── Dashboard.tsx  # Executive overview & KPIs
│   │   ├── Rooms.tsx      # Room inventory grid & table
│   │   ├── Reservations.tsx # Booking management
│   │   ├── Guests.tsx     # Guest profiles & VIP directory
│   │   ├── CheckInOut.tsx # Front desk arrivals/departures
│   │   ├── Payments.tsx   # Payment logs & invoice printer
│   │   ├── Staff.tsx      # Employee directory
│   │   ├── Reports.tsx    # Recharts analytics & exports
│   │   └── Settings.tsx   # Hotel profile & preferences
│   ├── types/
│   │   └── index.ts       # TypeScript definitions & unions
│   ├── App.tsx            # Route configuration & toaster setup
│   ├── index.css          # Design tokens & Inter font setup
│   └── main.tsx           # Application entrypoint
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
