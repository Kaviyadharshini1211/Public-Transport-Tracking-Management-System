const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// Icon helpers
const { FaBus, FaRobot, FaMapMarkerAlt, FaShieldAlt, FaTicketAlt, FaUsers, FaCog, FaCreditCard, FaChartLine, FaCar } = require("react-icons/fa");
const { MdDashboard, MdNotifications, MdRoute, MdPeople, MdPayment } = require("react-icons/md");

async function iconToBase64Png(IconComponent, color, size = 256) {
    const svg = ReactDOMServer.renderToStaticMarkup(
        React.createElement(IconComponent, { color, size: String(size) })
    );
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    return "image/png;base64," + pngBuffer.toString("base64");
}

// Color Palette - Deep navy + teal + white (transport/tech feel)
const C = {
    navy: "0D1B2A",
    teal: "00C49F",
    tealDark: "009977",
    slate: "1A3A4A",
    slateLight: "1E4D63",
    white: "FFFFFF",
    offWhite: "F0F6FA",
    lightGray: "D6E8F0",
    gold: "FFB703",
    pink: "E63946",
    purple: "7B2FBE",
    green: "2DC653",
    blue: "3A86FF",
    orange: "FB8500",
    textDark: "0D1B2A",
};

// Member color map
const memberColors = {
    "Kaviya": C.teal,
    "Vinod": C.blue,
    "Sagar": C.gold,
    "Dhanush": C.green,
    "Senim": C.pink,
};

async function build() {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9";
    pres.title = "Public Transport Tracking & Management System";

    // ─────────────────────────────────────────────
    // SLIDE 1 – TITLE SLIDE
    // ─────────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.navy };

        // Teal accent bar left
        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { color: C.teal } });

        // Bus icon (top right)
        const busIcon = await iconToBase64Png(FaBus, "#00C49F", 300);
        s.addImage({ data: busIcon, x: 8.2, y: 0.5, w: 1.5, h: 1.5 });

        // Title
        s.addText("Public Transport Tracking", {
            x: 0.5, y: 1.0, w: 8.5, h: 0.9,
            fontSize: 40, fontFace: "Calibri", bold: true,
            color: C.white, align: "left"
        });
        s.addText("& Management System", {
            x: 0.5, y: 1.85, w: 8.5, h: 0.9,
            fontSize: 40, fontFace: "Calibri", bold: true,
            color: C.teal, align: "left"
        });

        // Subtitle
        s.addText("AI-Powered · Real-Time Tracking · Smart Ticketing", {
            x: 0.5, y: 2.9, w: 8.5, h: 0.5,
            fontSize: 18, fontFace: "Calibri", italic: true,
            color: C.lightGray, align: "left"
        });

        // Team names pill row
        const members = ["Kaviya", "Vinod", "Sagar", "Dhanush", "Senim"];
        const pillColors = [C.teal, C.blue, C.gold, C.green, C.pink];
        members.forEach((name, i) => {
            const px = 0.5 + i * 1.82;
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
                x: px, y: 4.1, w: 1.65, h: 0.52,
                fill: { color: pillColors[i] }, line: { color: pillColors[i] }, rectRadius: 0.1
            });
            s.addText(name, {
                x: px, y: 4.1, w: 1.65, h: 0.52,
                fontSize: 13, fontFace: "Calibri", bold: true,
                color: C.navy, align: "center", valign: "middle"
            });
        });

        // Institution
        s.addText("Lovely Professional University  |  Academic Project", {
            x: 0.5, y: 4.95, w: 9, h: 0.4,
            fontSize: 11, fontFace: "Calibri",
            color: "667788", align: "left"
        });
    }

    // ─────────────────────────────────────────────
    // SLIDE 2 – PROJECT OVERVIEW
    // ─────────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.offWhite };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.navy }, line: { color: C.navy } });
        s.addText("Project Overview", {
            x: 0.4, y: 0, w: 9, h: 0.9,
            fontSize: 28, fontFace: "Calibri", bold: true, color: C.white, valign: "middle"
        });

        // Left column – what is it
        s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.05, w: 4.3, h: 4.05, fill: { color: C.white }, line: { color: C.lightGray } });
        s.addText("What Is It?", { x: 0.45, y: 1.2, w: 4.0, h: 0.45, fontSize: 17, fontFace: "Calibri", bold: true, color: C.navy });
        s.addText([
            { text: "A full-stack intelligent web platform designed to modernize public transportation operations.", options: { breakLine: true } },
            { text: " ", options: { breakLine: true } },
            { text: "✔ Real-time bus & vehicle tracking", options: { breakLine: true } },
            { text: "✔ AI-driven ETA predictions", options: { breakLine: true } },
            { text: "✔ Digital ticketing & payments", options: { breakLine: true } },
            { text: "✔ Multi-role platform: commuter, driver, admin", options: { breakLine: true } },
            { text: "✔ Works in rural & low-network environments", options: { breakLine: true } },
        ], { x: 0.45, y: 1.7, w: 4.05, h: 3.2, fontSize: 13.5, fontFace: "Calibri", color: C.textDark, paraSpaceAfter: 4 });

        // Right column – key stats / objectives
        s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.05, w: 4.5, h: 4.05, fill: { color: C.slate }, line: { color: C.slate } });
        s.addText("Key Objectives", { x: 5.25, y: 1.2, w: 4.1, h: 0.45, fontSize: 17, fontFace: "Calibri", bold: true, color: C.teal });

        const objectives = [
            ["🚌", "Live bus tracking on maps"],
            ["🤖", "AI-based ETA & crowd prediction"],
            ["🎫", "Digital ticketing via Razorpay"],
            ["📊", "Admin analytics dashboard"],
            ["🔔", "SMS & email delay alerts"],
            ["🛡️", "Secure JWT authentication"],
        ];
        objectives.forEach(([icon, text], i) => {
            const yy = 1.75 + i * 0.55;
            s.addText(icon + "  " + text, {
                x: 5.25, y: yy, w: 4.0, h: 0.45,
                fontSize: 13, fontFace: "Calibri", color: C.offWhite
            });
        });
    }

    // ─────────────────────────────────────────────
    // SLIDE 3 – TECH STACK & AI MODULES
    // ─────────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.navy };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.tealDark }, line: { color: C.tealDark } });
        s.addText("Tech Stack & AI Modules", {
            x: 0.4, y: 0, w: 9, h: 0.85, fontSize: 27, fontFace: "Calibri", bold: true, color: C.white, valign: "middle"
        });

        // Tech stack cards
        const stack = [
            { label: "Frontend", items: "React.js · MUI · Leaflet\nAxios · Socket.IO Client", color: C.blue },
            { label: "Backend", items: "Node.js · Express.js\nMongoDB · JWT · Socket.IO", color: C.teal },
            { label: "AI Service", items: "Python · FastAPI\nScikit-Learn · Groq Llama 3", color: C.purple },
            { label: "DevOps", items: "Docker · Docker Compose\nCI/CD · Cloudinary", color: C.orange },
        ];
        stack.forEach((t, i) => {
            const px = 0.35 + i * 2.35;
            s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.0, w: 2.15, h: 1.8, fill: { color: C.slateLight }, line: { color: t.color } });
            s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.0, w: 2.15, h: 0.38, fill: { color: t.color }, line: { color: t.color } });
            s.addText(t.label, { x: px, y: 1.0, w: 2.15, h: 0.38, fontSize: 13, fontFace: "Calibri", bold: true, color: C.navy, align: "center", valign: "middle" });
            s.addText(t.items, { x: px + 0.08, y: 1.45, w: 2.0, h: 1.2, fontSize: 11.5, fontFace: "Calibri", color: C.lightGray });
        });

        // AI modules table
        s.addText("AI Modules", { x: 0.35, y: 2.95, w: 9, h: 0.4, fontSize: 17, fontFace: "Calibri", bold: true, color: C.teal });

        const aiModules = [
            ["AI Chatbot", "Groq Llama 3", "Natural language queries, route finding, booking bridge"],
            ["ETA Predictor", "Random Forest (Scikit)", "Predicts arrival time from speed, traffic, weather"],
            ["Route Optimizer", "GradientBoosting", "Detects detour needs, suggests alternate waypoints"],
            ["Crowd Predictor", "GradientBoosting", "Predicts density level & passenger count on buses"],
        ];

        const tableData = [
            [
                { text: "Module", options: { bold: true, color: C.navy, fill: { color: C.teal } } },
                { text: "Technology", options: { bold: true, color: C.navy, fill: { color: C.teal } } },
                { text: "Function", options: { bold: true, color: C.navy, fill: { color: C.teal } } },
            ],
            ...aiModules.map(row => row.map(cell => ({ text: cell, options: { color: C.white, fill: { color: "1A3A4A" } } })))
        ];
        s.addTable(tableData, {
            x: 0.35, y: 3.45, w: 9.3, h: 1.8,
            border: { pt: 0.5, color: "2A5570" },
            fontSize: 12, fontFace: "Calibri",
            colW: [2.1, 2.3, 4.9]
        });
    }

    // ─────────────────────────────────────────────
    // SLIDE 4 – KAVIYA
    // ─────────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.offWhite };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.teal }, line: { color: C.teal } });
        s.addText("👑  Kaviya  —  Lead Backend, Auth & AI Ops", {
            x: 0.3, y: 0, w: 9.4, h: 1.0, fontSize: 25, fontFace: "Calibri", bold: true, color: C.navy, valign: "middle"
        });

        const contributions = [
            { icon: "🔐", title: "Security & Identity", desc: "authController, authRoutes, JWT + RBAC middleware, userController & userRoutes — complete multi-role auth lifecycle." },
            { icon: "📡", title: "Real-time Tracking Backend", desc: "localBusController, tripController, all tracking routes — live GPS ingestion & Socket.IO bus position broadcasts." },
            { icon: "💳", title: "Booking & Payment Backend", desc: "bookingController, bookingRoutes, paymentController (Razorpay) — seat locking, fare calculation & webhook handling." },
            { icon: "🐳", title: "Docker & Deployment (Shared)", desc: "Dockerfile for backend service, docker-compose setup, environment config & container networking with Vinod." },
            { icon: "🤖", title: "AI: Crowd Prediction Model", desc: "GradientBoosting classifier + regressor: predicts crowd density (empty→overcrowded) & exact passenger count." },
            { icon: "🗺️", title: "AI: Route Optimization Model", desc: "GradientBoosting model: detects detour need from live traffic & weather data, recommends alternate waypoints." },
        ];

        const col1 = contributions.slice(0, 3);
        const col2 = contributions.slice(3);

        [col1, col2].forEach((col, ci) => {
            col.forEach((item, ri) => {
                const px = ci === 0 ? 0.25 : 5.15;
                const py = 1.15 + ri * 1.42;
                s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 4.6, h: 1.28, fill: { color: C.white }, line: { color: C.lightGray }, shadow: { type: "outer", blur: 4, offset: 2, angle: 135, color: "000000", opacity: 0.08 } });
                s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 0.1, h: 1.28, fill: { color: C.teal }, line: { color: C.teal } });
                s.addText(item.icon + "  " + item.title, { x: px + 0.18, y: py + 0.1, w: 4.3, h: 0.38, fontSize: 13.5, fontFace: "Calibri", bold: true, color: C.navy });
                s.addText(item.desc, { x: px + 0.18, y: py + 0.48, w: 4.3, h: 0.72, fontSize: 11, fontFace: "Calibri", color: "445566" });
            });
        });
    }

    // ─────────────────────────────────────────────
    // SLIDE 5 – VINOD
    // ─────────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.offWhite };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.blue }, line: { color: C.blue } });
        s.addText("👑  Vinod  —  Lead Backend, AI & DevOps", {
            x: 0.3, y: 0, w: 9.4, h: 1.0, fontSize: 25, fontFace: "Calibri", bold: true, color: C.white, valign: "middle"
        });

        const contributions = [
            { icon: "🐳", title: "Docker & CI/CD Infrastructure", desc: "Dockerfiles for backend & AI service, docker-compose orchestration, .env management & CI/CD pipeline (shared with Kaviya)." },
            { icon: "🏗️", title: "System Core & DB Design", desc: "server.js, app.js, db.js, Cloudinary config, OSRM routing proxy — core schemas: Vehicle, Route, User, Trip, Booking." },
            { icon: "⚙️", title: "Automation & Background Jobs", desc: "localBusSimulator, etaEmailJob, etaSmsJob cron jobs + all seeding scripts: runAllSeeds, seedVehicles, seedRoutes, seedUsers." },
            { icon: "🚗", title: "Vehicle & Intercity Route APIs", desc: "vehicleController, vehicleRoutes, intercity routeController — fleet CRUD, status management & route data APIs." },
            { icon: "⏱️", title: "AI: ETA Prediction Model", desc: "Random Forest via FastAPI: predicts bus arrival from distance, speed, weather, traffic density & rush-hour factor." },
            { icon: "📦", title: "AI Core Infrastructure & Chatbot", desc: "ai/main.py, download_models.py, upload_models.py — HuggingFace deployment + chatbotController, Groq Llama 3 chatbot routes." },
        ];

        const col1 = contributions.slice(0, 3);
        const col2 = contributions.slice(3);

        [col1, col2].forEach((col, ci) => {
            col.forEach((item, ri) => {
                const px = ci === 0 ? 0.25 : 5.15;
                const py = 1.15 + ri * 1.42;
                s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 4.6, h: 1.28, fill: { color: C.white }, line: { color: C.lightGray }, shadow: { type: "outer", blur: 4, offset: 2, angle: 135, color: "000000", opacity: 0.08 } });
                s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 0.1, h: 1.28, fill: { color: C.blue }, line: { color: C.blue } });
                s.addText(item.icon + "  " + item.title, { x: px + 0.18, y: py + 0.1, w: 4.3, h: 0.38, fontSize: 13.5, fontFace: "Calibri", bold: true, color: C.navy });
                s.addText(item.desc, { x: px + 0.18, y: py + 0.48, w: 4.3, h: 0.72, fontSize: 11, fontFace: "Calibri", color: "445566" });
            });
        });
    }

    // ─────────────────────────────────────────────
    // SLIDE 6 – SAGAR
    // ─────────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.offWhite };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.gold }, line: { color: C.gold } });
        s.addText("🛠️  Sagar  —  Frontend Architect & Full-Stack Admin", {
            x: 0.3, y: 0, w: 9.4, h: 1.0, fontSize: 24, fontFace: "Calibri", bold: true, color: C.navy, valign: "middle"
        });

        const contributions = [
            { icon: "🗺️", title: "Real-time Tracking Maps", desc: "Track.js, localBusMap.js, MapWeatherOverlay.js — live multi-bus & single-bus Leaflet map UI with weather overlay." },
            { icon: "📊", title: "Dashboard & Notification Backend", desc: "dashboardController, notificationController & routes — system analytics, delay alerts & admin notification APIs." },
            { icon: "🏛️", title: "Admin Portal (Frontend)", desc: "All pages under frontend/src/pages/admin/ — ManageRoutes, ManageVehicles, AdminAssignDriver, Reports UI." },
            { icon: "🔌", title: "Frontend API Layer", desc: "frontend/src/api/ — all Axios API clients, request interceptors, auth token injection & ErrorBoundary.js." },
            { icon: "🧩", title: "Shared UI Components", desc: "SkeletonLoader.js, EmptyState.js, Toast.js, ConfirmDialog.js — reusable cross-feature feedback components." },
        ];

        contributions.forEach((item, i) => {
            const col = i < 3 ? 0 : 1;
            const row = i < 3 ? i : i - 3;
            const px = col === 0 ? 0.25 : 5.15;
            const py = 1.15 + row * 1.42;
            s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 4.6, h: 1.28, fill: { color: C.white }, line: { color: C.lightGray }, shadow: { type: "outer", blur: 4, offset: 2, angle: 135, color: "000000", opacity: 0.08 } });
            s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 0.1, h: 1.28, fill: { color: C.gold }, line: { color: C.gold } });
            s.addText(item.icon + "  " + item.title, { x: px + 0.18, y: py + 0.1, w: 4.3, h: 0.38, fontSize: 13.5, fontFace: "Calibri", bold: true, color: C.navy });
            s.addText(item.desc, { x: px + 0.18, y: py + 0.48, w: 4.3, h: 0.72, fontSize: 11, fontFace: "Calibri", color: "445566" });
        });

        // 5th card spans bottom center
        const item5 = contributions[4];
        // already placed above since index 4 → col=1, row=1
    }

    // ─────────────────────────────────────────────
    // SLIDE 7 – DHANUSH
    // ─────────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.offWhite };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.green }, line: { color: C.green } });
        s.addText("🛠️  Dhanush  —  Frontend Feature Lead", {
            x: 0.3, y: 0, w: 9.4, h: 1.0, fontSize: 25, fontFace: "Calibri", bold: true, color: C.white, valign: "middle"
        });

        const contributions = [
            { icon: "🎫", title: "Booking & Ticket Flow", desc: "Book.js, ConfirmBooking.js, MyBooking.js, BookingHistory.js — end-to-end ticket booking from search to PDF receipt." },
            { icon: "💺", title: "Seat Map & Selection Modals", desc: "SeatMap.js, ConfirmationModal.js — interactive visual bus seat layout with real-time availability & booking confirmation." },
            { icon: "🚌", title: "Vehicle Discovery & Favorites", desc: "Vehicles.js, Favorites.js, VehicleCard.js, BookingAlertToggle.js — browse routes, filter buses & set alert subscriptions." },
            { icon: "🔔", title: "Notifications & Alert Inbox", desc: "Notifications.js, NotificationBadge.js — real-time inbox for delay alerts, booking confirmations & SOS updates." },
            { icon: "🚗", title: "Driver Operations Portal", desc: "frontend/src/pages/driver/ — GPS broadcast toggle, active trip management, driver logs & trip-start/end controls." },
        ];

        const col1 = contributions.slice(0, 3);
        const col2 = contributions.slice(3);
        [col1, col2].forEach((col, ci) => {
            col.forEach((item, ri) => {
                const px = ci === 0 ? 0.25 : 5.15;
                const py = 1.15 + ri * 1.42;
                s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 4.6, h: 1.28, fill: { color: C.white }, line: { color: C.lightGray }, shadow: { type: "outer", blur: 4, offset: 2, angle: 135, color: "000000", opacity: 0.08 } });
                s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 0.1, h: 1.28, fill: { color: C.green }, line: { color: C.green } });
                s.addText(item.icon + "  " + item.title, { x: px + 0.18, y: py + 0.1, w: 4.3, h: 0.38, fontSize: 13.5, fontFace: "Calibri", bold: true, color: C.navy });
                s.addText(item.desc, { x: px + 0.18, y: py + 0.48, w: 4.3, h: 0.72, fontSize: 11, fontFace: "Calibri", color: "445566" });
            });
        });
    }

    // ─────────────────────────────────────────────
    // SLIDE 8 – SENIM
    // ─────────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.offWhite };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.pink }, line: { color: C.pink } });
        s.addText("👑  Senim  —  Frontend Lead", {
            x: 0.3, y: 0, w: 9.4, h: 1.0, fontSize: 25, fontFace: "Calibri", bold: true, color: C.white, valign: "middle"
        });

        const contributions = [
            { icon: "🏠", title: "Core Brand Pages", desc: "Home.js, About.js, Contact.js, NotFound.js — public-facing identity, landing hero, feature highlights & CTAs." },
            { icon: "👤", title: "User Identity Flow", desc: "Profile.js, Settings.js, Auth.js, LoginForm.js & RegisterForm.js — complete account creation & user management journey." },
            { icon: "💳", title: "Payment Page UI", desc: "Payment.js — Razorpay checkout UX, fare breakdown display, order summary & payment success/failure screens." },
            { icon: "🚨", title: "SOS Emergency UI", desc: "SOS trigger button, emergency status page & alert confirmation UI — passenger safety interface connected to SOS backend." },
            { icon: "🎨", title: "Global Design System", desc: "Global CSS tokens, all component-level styles, Navbar.js, Footer.js, LoadingSpinner.js, App.js routing structure." },
        ];

        const col1 = contributions.slice(0, 3);
        const col2 = contributions.slice(3);
        [col1, col2].forEach((col, ci) => {
            col.forEach((item, ri) => {
                const px = ci === 0 ? 0.25 : 5.15;
                const py = 1.15 + ri * 1.42;
                s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 4.6, h: 1.28, fill: { color: C.white }, line: { color: C.lightGray }, shadow: { type: "outer", blur: 4, offset: 2, angle: 135, color: "000000", opacity: 0.08 } });
                s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 0.1, h: 1.28, fill: { color: C.pink }, line: { color: C.pink } });
                s.addText(item.icon + "  " + item.title, { x: px + 0.18, y: py + 0.1, w: 4.3, h: 0.38, fontSize: 13.5, fontFace: "Calibri", bold: true, color: C.navy });
                s.addText(item.desc, { x: px + 0.18, y: py + 0.48, w: 4.3, h: 0.72, fontSize: 11, fontFace: "Calibri", color: "445566" });
            });
        });
    }

    // ─────────────────────────────────────────────
    // SLIDE 9 – SYSTEM ARCHITECTURE / FEATURES SUMMARY
    // ─────────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.navy };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.slateLight }, line: { color: C.slateLight } });
        s.addText("System Architecture — How It All Fits Together", {
            x: 0.3, y: 0, w: 9.4, h: 0.85, fontSize: 24, fontFace: "Calibri", bold: true, color: C.teal, valign: "middle"
        });

        // 3 layer boxes
        const layers = [
            { label: "Frontend Layer", color: C.blue, desc: "React.js SPA · Role-based views for Commuter, Driver & Admin · Leaflet live maps · Responsive design", x: 0.25 },
            { label: "Backend Layer", color: C.teal, desc: "Node.js + Express REST API · Socket.IO real-time · MongoDB · JWT Auth · Razorpay · Twilio · Nodemailer", x: 3.6 },
            { label: "AI Microservice", color: C.purple, desc: "Python FastAPI · Random Forest ETA · GradientBoosting Route & Crowd · Groq Llama 3 Chatbot", x: 6.95 },
        ];

        layers.forEach(l => {
            s.addShape(pres.shapes.RECTANGLE, { x: l.x, y: 1.0, w: 3.0, h: 2.1, fill: { color: C.slateLight }, line: { color: l.color } });
            s.addShape(pres.shapes.RECTANGLE, { x: l.x, y: 1.0, w: 3.0, h: 0.42, fill: { color: l.color }, line: { color: l.color } });
            s.addText(l.label, { x: l.x, y: 1.0, w: 3.0, h: 0.42, fontSize: 13, fontFace: "Calibri", bold: true, color: C.navy, align: "center", valign: "middle" });
            s.addText(l.desc, { x: l.x + 0.1, y: 1.5, w: 2.8, h: 1.5, fontSize: 10.5, fontFace: "Calibri", color: C.lightGray });
        });

        // Arrows between layers (simplified lines)
        s.addShape(pres.shapes.LINE, { x: 3.27, y: 2.05, w: 0.33, h: 0, line: { color: C.teal, width: 2 } });
        s.addShape(pres.shapes.LINE, { x: 6.6, y: 2.05, w: 0.33, h: 0, line: { color: C.purple, width: 2 } });

        // SDG row
        s.addText("United Nations SDGs Addressed:", { x: 0.3, y: 3.3, w: 4, h: 0.38, fontSize: 13, fontFace: "Calibri", bold: true, color: C.teal });
        const sdgs = ["SDG 9  Innovation", "SDG 11  Sustainable Cities", "SDG 7  Clean Energy", "SDG 13  Climate Action"];
        sdgs.forEach((sdg, i) => {
            s.addShape(pres.shapes.RECTANGLE, { x: 0.3 + i * 2.35, y: 3.72, w: 2.15, h: 0.52, fill: { color: "1E4D63" }, line: { color: C.teal } });
            s.addText(sdg, { x: 0.3 + i * 2.35, y: 3.72, w: 2.15, h: 0.52, fontSize: 11, fontFace: "Calibri", color: C.teal, align: "center", valign: "middle" });
        });

        // Tagline
        s.addText('"Digitizing Public Transport — because real-time means real progress."', {
            x: 0.3, y: 4.45, w: 9.4, h: 0.55,
            fontSize: 13.5, fontFace: "Calibri", italic: true, color: C.lightGray, align: "center"
        });
    }

    // ─────────────────────────────────────────────
    // SLIDE 10 – TEAM SUMMARY / THANK YOU
    // ─────────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.navy };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.teal }, line: { color: C.teal } });
        s.addText("Team Contributions at a Glance", {
            x: 0.3, y: 0, w: 9.4, h: 0.85, fontSize: 26, fontFace: "Calibri", bold: true, color: C.navy, valign: "middle"
        });

        const team = [
            { name: "Kaviya", color: C.teal, role: "Lead Backend, Auth & AI Ops", items: ["Auth & JWT/RBAC security", "Real-time tracking backend", "Booking & payment backend", "Docker & deployment (shared)", "AI: Crowd Prediction", "AI: Route Optimization"] },
            { name: "Vinod", color: C.blue, role: "Lead Backend, AI & DevOps", items: ["Docker & CI/CD (shared)", "Core server & DB design", "Automation & cron jobs", "Vehicle & route APIs", "AI: ETA Prediction", "AI: Chatbot + microservice"] },
            { name: "Sagar", color: C.gold, role: "Frontend Architect & Admin", items: ["Live tracking maps", "Dashboard & notif backend", "Admin portal UI", "Frontend API layer", "Shared UI components"] },
            { name: "Dhanush", color: C.green, role: "Frontend Feature Lead", items: ["Booking & ticket flow", "Seat map & modals", "Vehicle discovery", "Notifications inbox", "Driver portal UI"] },
            { name: "Senim", color: C.pink, role: "Frontend Lead", items: ["Brand pages (Home etc)", "User auth page UI", "Payment page UI", "SOS emergency UI", "Global design system"] },
        ];

        team.forEach((m, i) => {
            const px = 0.18 + i * 1.94;
            // Card
            s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.0, w: 1.75, h: 4.3, fill: { color: C.slateLight }, line: { color: m.color } });
            // Name header
            s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.0, w: 1.75, h: 0.52, fill: { color: m.color }, line: { color: m.color } });
            s.addText(m.name, { x: px, y: 1.0, w: 1.75, h: 0.52, fontSize: 14, fontFace: "Calibri", bold: true, color: C.navy, align: "center", valign: "middle" });
            s.addText(m.role, { x: px + 0.05, y: 1.57, w: 1.65, h: 0.55, fontSize: 9.5, fontFace: "Calibri", italic: true, color: m.color, align: "center" });
            m.items.forEach((item, j) => {
                s.addText("• " + item, { x: px + 0.08, y: 2.17 + j * 0.37, w: 1.6, h: 0.34, fontSize: 9.5, fontFace: "Calibri", color: C.lightGray });
            });
        });

        s.addText("Lovely Professional University  •  Academic Project  •  Team of 5", {
            x: 0.3, y: 5.3, w: 9.4, h: 0.22,
            fontSize: 10, fontFace: "Calibri", color: "667788", align: "center"
        });
    }

    // Save
    await pres.writeFile({ fileName: "transport_ppt_v2.pptx" });
    console.log("Done!");
}

build().catch(console.error);