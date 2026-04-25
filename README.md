# 🚍 Public Transport Tracking & Management System

## 📘 Overview

The **Public Transport Tracking & Management System** is a full-stack intelligent web platform designed to modernize and digitize public transportation operations.

It enables **real-time tracking of buses and vehicles**, **AI-driven ETA predictions**, **automated fare collection**, **route optimization**, and **citizen engagement** through an intuitive interface for passengers, drivers, and administrators.

This system aims to bring **transparency, efficiency, and convenience** to rural and urban transport authorities while leveraging **AI and cloud technologies** for scalability.

---

## 🎯 Objectives

- Provide **real-time bus and route tracking** with accurate ETA predictions
- Enable **digital ticketing, payments, and booking** through a unified web interface
- Assist **transport authorities** in route planning, vehicle allocation, and analytics
- Improve **citizen convenience and safety** using location-aware systems
- Create a **sustainable and inclusive** transport ecosystem, scalable to rural regions

---

## 🧩 System Modules

| **Module** | **Description** |
|-------------|----------------|
| **User & Authentication** | Login/Signup for commuters, drivers, and admins with JWT-based authentication |
| **Live Tracking** | Real-time vehicle tracking via GPS location updates from driver interface |
| **Route Management** | CRUD operations for routes, stops, and vehicle scheduling |
| **Ticket Booking & Payment** | Online ticket purchase, fare calculation, digital receipts, and payment gateway integration |
| **Driver Interface** | Web-based interface for drivers to mark attendance, update route status, and send live updates |
| **Admin Dashboard** | Centralized dashboard for managing routes, vehicles, analytics, and performance reports |
| **Analytics & Reports** | Predictive analytics for route demand, passenger density, and operational efficiency |
| **AI-Powered ETA Prediction** | Uses ML models to estimate arrival times based on traffic, weather, and distance |
| **Crowd Density Monitoring** | AI-based analysis for crowd estimation at bus stops (future-ready) |
| **Notification & Alerts** | SMS/email push alerts for route delays, cancellations, and upcoming buses |

---

## 💡 Novelty & Uniqueness

- **AI-driven predictive transport**: ETA and crowd models trained on local data
- **Offline-first capability**: Works seamlessly in low-connectivity areas
- **Multi-role system**: Unified platform for commuters, drivers, and administrators
- **Eco & rural-ready**: Designed to work in low-resource environments
- **Anomaly detection**: Identifies irregular routes or delays automatically
- **Web-based simplicity**: No app installation required, accessible from any device

---

## 🔍 Difference from Existing Systems

| **Old System** | **New System (Proposed)** |
|----------------|---------------------------|
| Manual scheduling and no real-time visibility | Real-time GPS tracking and live route maps |
| Physical tickets and manual fare collection | Digital ticket booking and contactless payments |
| Poor communication between driver and passengers | Instant alerts, route changes, and delay notifications |
| No analytics for route optimization | AI-driven analytics and route efficiency reports |
| Urban-centric solutions only | Designed to work in **rural and low-network regions** |

---

## 🚀 Key Features

- 🔹 Real-time vehicle location tracking (Google Maps integration)
- 🔹 Interactive route planning and optimization
- 🔹 Online ticket booking and fare payment
- 🔹 Admin control panel with live analytics
- 🔹 AI-based ETA prediction engine
- 🔹 Push notifications and SMS/email alerts
- 🔹 Secure authentication (JWT & Role-based Access)
- 🔹 Driver web interface for updates and route reporting
- 🔹 Offline mode for low-connectivity zones
- 🔹 Sustainable & scalable architecture

---

## ⚙️ Tech Stack

**Frontend (Web):** React.js, Material UI (MUI), Axios, Leaflet, Socket.IO Client

**Backend (API):** Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.IO

**Services:** Nodemailer (Email), Twilio (SMS), Razorpay (Payments)

**DevOps:** Docker

**Maps & APIs:** Leaflet / OpenStreetMap (Nominatim Geocoding)

---

## 🧠 AI Integration

| **AI Module** | **Function** |
|----------------|--------------|
| ETA Predictor | Predicts bus arrival times using ML regression models based on traffic & weather data |
| Route Optimizer | Uses graph algorithms (Dijkstra / A*) to recommend efficient routes |
| Crowd Density Detector | Uses image processing and YOLO-based models for real-time crowd analysis |
| Anomaly Detector | Identifies unusual route or delay patterns for admin alerts |

---

## 📊 Expected Outcomes

- Transparent and reliable public transport management
- Increased commuter trust via accurate live updates
- Reduced fuel wastage and idle time through route optimization
- Improved revenue collection via digital payments
- Better safety and accountability for passengers and authorities
- Future scalability to integrate EV fleets and smart city systems

---

## 🔐 Roles & Access

| **Role** | **Access** |
|-----------|------------|
| **Admin** | Manage routes, buses, and drivers; access analytics |
| **Driver** | Update trip status, share GPS location via web interface |
| **Commuter** | View routes, track vehicles, book and pay |
| **Authority** | Monitor reports, audit performance |

---

## 📦 Project Structure

```
public-transport-system/
│
├── backend/               # Express.js API + MongoDB
│   ├── config/            # Database and passport configuration
│   ├── controllers/       # Route handler logic
│   ├── middleware/        # Auth and access control
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API route definitions
│   ├── services/          # Email and SMS services
│   ├── jobs/              # Cron jobs and simulators
│   ├── seeds/             # Database seed scripts
│   └── utils/             # Helper utilities
│
├── frontend/              # React.js web app
│   ├── public/            # Static assets and index.html
│   └── src/               # React components, pages, and styles
│
└── README.md              # Project documentation
```

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16+)
- MongoDB (v5+)
- Python (v3.9+)
- Docker & Docker Compose

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your MongoDB URI and JWT secret in .env
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### AI Microservice Setup

```bash
cd ai_microservice
pip install -r requirements.txt
uvicorn main:app --reload
```

### Docker Setup (Recommended)

```bash
# Run entire application with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🐳 Docker Configuration

The project includes Docker support for easy deployment:

- **Backend Container**: Node.js API server
- **Frontend Container**: React.js application
- **MongoDB Container**: Database service
- **AI Microservice Container**: Python FastAPI server

All services are orchestrated using Docker Compose for seamless deployment.

---

## 🌍 Sustainable Development Goals (SDGs)

- **SDG 9:** Industry, Innovation and Infrastructure
- **SDG 11:** Sustainable Cities and Communities
- **SDG 7:** Affordable and Clean Energy
- **SDG 8:** Decent Work and Economic Growth
- **SDG 13:** Climate Action

---

## 🔮 Future Scope

- Integration with **electric bus scheduling** systems
- Voice-based route assistant for visually impaired users
- Blockchain-based ticket verification
- Predictive maintenance of vehicles using historical data
- Expansion into **smart-city unified mobility platforms**
- Mobile application development for enhanced accessibility

---

## 📸 Screenshots

*Add your application screenshots here*

```
[Login Screen]  [Dashboard]  [Live Tracking]  [Ticket Booking]
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Contributors


- **Team Members:** [To be added]
- **Faculty Guide:** [To be added]
- **Institution:** Lovely Professional University (LPU)

---

## 📧 Contact

For queries and collaboration:


- **Project Demo:** [Demo Link]

---

## 📜 License

This project is developed for academic and research purposes under the MIT License.

---

## 🙏 Acknowledgments

- Faculty mentors at Lovely Professional University
- Open-source community for libraries and frameworks
- Transport authorities for domain insights
- Team members for their dedication and hard work

---

> 🚦 **"Digitizing Public Transport — because real-time means real progress."**

---

**⭐ If you find this project useful, please consider giving it a star on GitHub!**