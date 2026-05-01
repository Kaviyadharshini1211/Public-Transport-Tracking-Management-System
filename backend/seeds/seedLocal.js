const Route = require("../models/Route");
const Vehicle = require("../models/Vehicle");

const seedLocal = async () => {
  console.log("🚌 Seeding ALL Local City Buses...");

  const cityRoutes = [
    // Delhi
    {
      name: "Delhi — Kashmiri Gate ⇄ Nehru Place", origin: "Kashmiri Gate ISBT", destination: "Nehru Place", distanceKm: 18, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "Kashmiri Gate ISBT", lat: 28.6678, lng: 77.2279 },
        { name: "Lal Qila", lat: 28.6562, lng: 77.2410 },
        { name: "ITO", lat: 28.6284, lng: 77.2418 },
        { name: "Pragati Maidan", lat: 28.6189, lng: 77.2496 },
        { name: "Khan Market", lat: 28.6005, lng: 77.2274 },
        { name: "AIIMS", lat: 28.5672, lng: 77.2100 },
        { name: "Nehru Place", lat: 28.5491, lng: 77.2516 }
      ]
    },
    {
      name: "Delhi — Uttam Nagar ⇄ Anand Vihar", origin: "Uttam Nagar", destination: "Anand Vihar", distanceKm: 28, avgSpeedKmph: 22, type: "INTRACITY",
      stops: [
        { name: "Uttam Nagar", lat: 28.6221, lng: 77.0653 },
        { name: "Janakpuri", lat: 28.6219, lng: 77.0878 },
        { name: "Rajouri Garden", lat: 28.6415, lng: 77.1222 },
        { name: "Punjabi Bagh", lat: 28.6619, lng: 77.1326 },
        { name: "ISBT Kashmiri Gate", lat: 28.6678, lng: 77.2279 },
        { name: "Anand Vihar", lat: 28.6502, lng: 77.3027 }
      ]
    },
    {
      name: "Delhi — Connaught Place ⇄ Gurgaon", origin: "Connaught Place", destination: "Gurgaon Bus Stand", distanceKm: 32, avgSpeedKmph: 25, type: "INTRACITY",
      stops: [
        { name: "Connaught Place", lat: 28.6304, lng: 77.2177 },
        { name: "Dhaula Kuan", lat: 28.5918, lng: 77.1615 },
        { name: "Mahipalpur", lat: 28.5493, lng: 77.1264 },
        { name: "IFFCO Chowk", lat: 28.4735, lng: 77.0725 },
        { name: "Gurgaon Bus Stand", lat: 28.4616, lng: 77.0253 }
      ]
    },
    {
      name: "Delhi — Rohini ⇄ Hauz Khas", origin: "Rohini", destination: "Hauz Khas", distanceKm: 25, avgSpeedKmph: 20, type: "INTRACITY",
      stops: [
        { name: "Rohini Sector 11", lat: 28.7306, lng: 77.1130 },
        { name: "Pitampura", lat: 28.6981, lng: 77.1384 },
        { name: "Patel Nagar", lat: 28.6514, lng: 77.1557 },
        { name: "AIIMS", lat: 28.5672, lng: 77.2100 },
        { name: "Hauz Khas", lat: 28.5494, lng: 77.2001 }
      ]
    },
    // Mumbai
    {
      name: "Mumbai — CSMT ⇄ Bandra Station", origin: "CSMT", destination: "Bandra Station", distanceKm: 16, avgSpeedKmph: 15, type: "INTRACITY",
      stops: [
        { name: "CSMT Bus Stop", lat: 18.9398, lng: 72.8355 },
        { name: "Churchgate", lat: 18.9322, lng: 72.8264 },
        { name: "Marine Lines", lat: 18.9440, lng: 72.8239 },
        { name: "Grant Road", lat: 18.9644, lng: 72.8189 },
        { name: "Dadar TT", lat: 19.0178, lng: 72.8436 },
        { name: "Mahim", lat: 19.0375, lng: 72.8406 },
        { name: "Bandra Station", lat: 19.0544, lng: 72.8402 }
      ]
    },
    {
      name: "Mumbai — BKC ⇄ Borivali", origin: "BKC", destination: "Borivali Station", distanceKm: 22, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "BKC", lat: 19.0666, lng: 72.8644 },
        { name: "Santa Cruz", lat: 19.0838, lng: 72.8385 },
        { name: "Andheri East", lat: 19.1136, lng: 72.8697 },
        { name: "Goregaon", lat: 19.1646, lng: 72.8493 },
        { name: "Malad", lat: 19.1860, lng: 72.8486 },
        { name: "Borivali Station", lat: 19.2290, lng: 72.8573 }
      ]
    },
    {
      name: "Mumbai — Colaba ⇄ Dadar", origin: "Colaba", destination: "Dadar", distanceKm: 12, avgSpeedKmph: 12, type: "INTRACITY",
      stops: [
        { name: "Colaba Causeway", lat: 18.9151, lng: 72.8258 },
        { name: "Nariman Point", lat: 18.9256, lng: 72.8242 },
        { name: "Taraporewala Aquarium", lat: 18.9500, lng: 72.8189 },
        { name: "Haji Ali", lat: 18.9830, lng: 72.8089 },
        { name: "Worli Sea Face", lat: 19.0069, lng: 72.8155 },
        { name: "Dadar", lat: 19.0178, lng: 72.8436 }
      ]
    },
    {
      name: "Mumbai — Thane ⇄ Powai", origin: "Thane", destination: "Powai Lake", distanceKm: 14, avgSpeedKmph: 20, type: "INTRACITY",
      stops: [
        { name: "Thane Station", lat: 19.1844, lng: 72.9760 },
        { name: "Mulund", lat: 19.1720, lng: 72.9565 },
        { name: "Bhandup", lat: 19.1438, lng: 72.9324 },
        { name: "Vikhroli", lat: 19.1121, lng: 72.9277 },
        { name: "Powai Lake", lat: 19.1245, lng: 72.9051 }
      ]
    },
    // Bangalore
    {
      name: "Bangalore — Majestic ⇄ Electronic City", origin: "Majestic", destination: "Electronic City", distanceKm: 22, avgSpeedKmph: 20, type: "INTRACITY",
      stops: [
        { name: "Majestic KSRTC", lat: 12.9774, lng: 77.5713 },
        { name: "Town Hall", lat: 12.9659, lng: 77.5855 },
        { name: "Lalbagh", lat: 12.9507, lng: 77.5848 },
        { name: "Jayanagar 4th Block", lat: 12.9302, lng: 77.5833 },
        { name: "BTM Layout", lat: 12.9165, lng: 77.6101 },
        { name: "Silk Board", lat: 12.9174, lng: 77.6228 },
        { name: "Electronic City", lat: 12.8399, lng: 77.6770 }
      ]
    },
    {
      name: "Bangalore — Kempegowda ⇄ Whitefield", origin: "Kempegowda", destination: "Whitefield", distanceKm: 20, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "Kempegowda Bus Station", lat: 12.9771, lng: 77.5703 },
        { name: "MG Road", lat: 12.9738, lng: 77.6119 },
        { name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
        { name: "KR Puram", lat: 13.0035, lng: 77.6914 },
        { name: "Mahadevapura", lat: 12.9906, lng: 77.6872 },
        { name: "Whitefield", lat: 12.9698, lng: 77.7499 }
      ]
    },
    {
      name: "Bangalore — Banashankari ⇄ Hebbal", origin: "Banashankari", destination: "Hebbal", distanceKm: 18, avgSpeedKmph: 20, type: "INTRACITY",
      stops: [
        { name: "Banashankari", lat: 12.9175, lng: 77.5732 },
        { name: "Jayanagar", lat: 12.9302, lng: 77.5833 },
        { name: "Shanthi Nagar", lat: 12.9555, lng: 77.5950 },
        { name: "Shivaji Nagar", lat: 12.9857, lng: 77.6057 },
        { name: "Mekhri Circle", lat: 13.0125, lng: 77.5850 },
        { name: "Hebbal", lat: 13.0354, lng: 77.5988 }
      ]
    },
    {
      name: "Bangalore — Yeshwanthpur ⇄ Koramangala", origin: "Yeshwanthpur", destination: "Koramangala", distanceKm: 16, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "Yeshwanthpur", lat: 13.0238, lng: 77.5501 },
        { name: "Malleshwaram", lat: 13.0031, lng: 77.5643 },
        { name: "Rajajinagar", lat: 12.9902, lng: 77.5525 },
        { name: "Richmond Circle", lat: 12.9634, lng: 77.5975 },
        { name: "Koramangala Forum", lat: 12.9348, lng: 77.6111 }
      ]
    },
    // Chennai
    {
      name: "Chennai — CMBT ⇄ Marina Beach", origin: "CMBT", destination: "Marina Beach", distanceKm: 15, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "CMBT Bus Terminus", lat: 13.0682, lng: 80.2078 },
        { name: "Anna Nagar Tower", lat: 13.0844, lng: 80.2114 },
        { name: "Kilpauk", lat: 13.0825, lng: 80.2443 },
        { name: "Egmore", lat: 13.0784, lng: 80.2590 },
        { name: "Central Station", lat: 13.0827, lng: 80.2707 },
        { name: "Marina Beach", lat: 13.0500, lng: 80.2824 }
      ]
    },
    {
      name: "Chennai — Broadway ⇄ Tambaram", origin: "Broadway", destination: "Tambaram", distanceKm: 28, avgSpeedKmph: 22, type: "INTRACITY",
      stops: [
        { name: "Broadway", lat: 13.0827, lng: 80.2707 },
        { name: "Egmore", lat: 13.0732, lng: 80.2609 },
        { name: "Guindy", lat: 13.0067, lng: 80.2206 },
        { name: "Airport", lat: 12.9822, lng: 80.1636 },
        { name: "Chromepet", lat: 12.9516, lng: 80.1408 },
        { name: "Tambaram", lat: 12.9249, lng: 80.1275 }
      ]
    },
    {
      name: "Chennai — Parrys ⇄ Adyar", origin: "Parrys", destination: "Adyar", distanceKm: 12, avgSpeedKmph: 15, type: "INTRACITY",
      stops: [
        { name: "Parrys", lat: 13.0878, lng: 80.2785 },
        { name: "Triplicane", lat: 13.0588, lng: 80.2756 },
        { name: "Mylapore", lat: 13.0339, lng: 80.2619 },
        { name: "Mandaveli", lat: 13.0242, lng: 80.2589 },
        { name: "Adyar", lat: 13.0067, lng: 80.2573 }
      ]
    },
    {
      name: "Chennai — T Nagar ⇄ Besant Nagar", origin: "T Nagar", destination: "Besant Nagar", distanceKm: 10, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "T Nagar", lat: 13.0418, lng: 80.2341 },
        { name: "Saidapet", lat: 13.0237, lng: 80.2209 },
        { name: "IIT Madras", lat: 12.9915, lng: 80.2337 },
        { name: "Adyar", lat: 13.0067, lng: 80.2573 },
        { name: "Besant Nagar", lat: 13.0003, lng: 80.2667 }
      ]
    },
    // Hyderabad
    {
      name: "Hyderabad — Secunderabad ⇄ Hitech City", origin: "Secunderabad Station", destination: "Hitech City", distanceKm: 18, avgSpeedKmph: 22, type: "INTRACITY",
      stops: [
        { name: "Secunderabad Station", lat: 17.4337, lng: 78.5016 },
        { name: "Begumpet", lat: 17.4435, lng: 78.4611 },
        { name: "Ameerpet", lat: 17.4363, lng: 78.4449 },
        { name: "Jubilee Hills Check Post", lat: 17.4300, lng: 78.4093 },
        { name: "Madhapur", lat: 17.4483, lng: 78.3915 },
        { name: "Hitech City", lat: 17.4435, lng: 78.3772 }
      ]
    },
    {
      name: "Hyderabad — Koti ⇄ Gachibowli", origin: "Koti", destination: "Gachibowli", distanceKm: 19, avgSpeedKmph: 20, type: "INTRACITY",
      stops: [
        { name: "Koti", lat: 17.3850, lng: 78.4867 },
        { name: "Abids", lat: 17.3895, lng: 78.4754 },
        { name: "Lakdikapul", lat: 17.4002, lng: 78.4646 },
        { name: "Mehdipatnam", lat: 17.3916, lng: 78.4308 },
        { name: "Tolichowki", lat: 17.3995, lng: 78.4069 },
        { name: "Gachibowli", lat: 17.4401, lng: 78.3489 }
      ]
    },
    {
      name: "Hyderabad — Charminar ⇄ LB Nagar", origin: "Charminar", destination: "LB Nagar", distanceKm: 12, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "Charminar", lat: 17.3616, lng: 78.4747 },
        { name: "Salar Jung Museum", lat: 17.3714, lng: 78.4800 },
        { name: "Koti", lat: 17.3850, lng: 78.4867 },
        { name: "Dilsukhnagar", lat: 17.3688, lng: 78.5247 },
        { name: "LB Nagar", lat: 17.3457, lng: 78.5522 }
      ]
    },
    // Kolkata
    {
      name: "Kolkata — Salt Lake ⇄ New Town", origin: "Salt Lake Sector V", destination: "New Town", distanceKm: 10, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "Salt Lake Sector V", lat: 22.5760, lng: 88.4326 },
        { name: "Technopolis", lat: 22.5802, lng: 88.4414 },
        { name: "Eco Park", lat: 22.6053, lng: 88.4673 },
        { name: "New Town Bus Stand", lat: 22.5930, lng: 88.4752 }
      ]
    },
    {
      name: "Kolkata — Howrah Station ⇄ Esplanade", origin: "Howrah Station", destination: "Esplanade", distanceKm: 5, avgSpeedKmph: 12, type: "INTRACITY",
      stops: [
        { name: "Howrah Station", lat: 22.5839, lng: 88.3433 },
        { name: "Rabindra Setu", lat: 22.5850, lng: 88.3466 },
        { name: "Burrabazar", lat: 22.5833, lng: 88.3533 },
        { name: "BBD Bagh", lat: 22.5721, lng: 88.3496 },
        { name: "Esplanade", lat: 22.5646, lng: 88.3512 }
      ]
    },
    {
      name: "Kolkata — Sealdah ⇄ Gariahat", origin: "Sealdah", destination: "Gariahat", distanceKm: 7, avgSpeedKmph: 15, type: "INTRACITY",
      stops: [
        { name: "Sealdah", lat: 22.5681, lng: 88.3703 },
        { name: "Park Circus", lat: 22.5393, lng: 88.3653 },
        { name: "Ballygunge", lat: 22.5280, lng: 88.3660 },
        { name: "Gariahat", lat: 22.5173, lng: 88.3660 }
      ]
    },
    {
      name: "Kolkata — Dum Dum ⇄ Jadavpur", origin: "Dum Dum Station", destination: "Jadavpur", distanceKm: 18, avgSpeedKmph: 20, type: "INTRACITY",
      stops: [
        { name: "Dum Dum Station", lat: 22.6224, lng: 88.3963 },
        { name: "Shyambazar", lat: 22.6006, lng: 88.3742 },
        { name: "College Street", lat: 22.5756, lng: 88.3642 },
        { name: "Rabindra Sadan", lat: 22.5429, lng: 88.3458 },
        { name: "Jadavpur", lat: 22.4990, lng: 88.3713 }
      ]
    },
    // Pune
    {
      name: "Pune — Swargate ⇄ Hinjewadi", origin: "Swargate Bus Stand", destination: "Hinjewadi", distanceKm: 22, avgSpeedKmph: 25, type: "INTRACITY",
      stops: [
        { name: "Swargate Bus Stand", lat: 18.5018, lng: 73.8586 },
        { name: "Deccan Gymkhana", lat: 18.5147, lng: 73.8407 },
        { name: "Shivaji Nagar", lat: 18.5310, lng: 73.8550 },
        { name: "Baner", lat: 18.5590, lng: 73.7868 },
        { name: "Hinjewadi Phase 1", lat: 18.5913, lng: 73.7389 }
      ]
    },
    {
      name: "Pune — Pune Station ⇄ Viman Nagar", origin: "Pune Station", destination: "Viman Nagar", distanceKm: 8, avgSpeedKmph: 18, type: "INTRACITY",
      stops: [
        { name: "Pune Station", lat: 18.5283, lng: 73.8744 },
        { name: "Ruby Hall", lat: 18.5303, lng: 73.8817 },
        { name: "Koregaon Park", lat: 18.5372, lng: 73.8968 },
        { name: "Kalyani Nagar", lat: 18.5484, lng: 73.9030 },
        { name: "Viman Nagar", lat: 18.5679, lng: 73.9143 }
      ]
    },
    {
      name: "Pune — Katraj ⇄ Hadapsar", origin: "Katraj", destination: "Hadapsar", distanceKm: 14, avgSpeedKmph: 20, type: "INTRACITY",
      stops: [
        { name: "Katraj", lat: 18.4533, lng: 73.8584 },
        { name: "Dhankawadi", lat: 18.4682, lng: 73.8560 },
        { name: "Camp", lat: 18.5149, lng: 73.8824 },
        { name: "Fatima Nagar", lat: 18.5042, lng: 73.9022 },
        { name: "Hadapsar", lat: 18.5089, lng: 73.9259 }
      ]
    },
    // Chandigarh
    {
      name: "Chandigarh — Sector 17 ⇄ Sector 43 ISBT", origin: "Sector 17 Bus Stand", destination: "Sector 43 ISBT", distanceKm: 8, avgSpeedKmph: 22, type: "INTRACITY",
      stops: [
        { name: "Sector 17 Bus Stand", lat: 30.7414, lng: 76.7784 },
        { name: "Sector 22 Chowk", lat: 30.7280, lng: 76.7784 },
        { name: "Sector 35 Market", lat: 30.7215, lng: 76.7736 },
        { name: "Sector 34A", lat: 30.7180, lng: 76.7780 },
        { name: "Sector 43 Bus Terminal", lat: 30.7082, lng: 76.7923 }
      ]
    },
    {
      name: "Chandigarh — PGI ⇄ Manimajra", origin: "PGI", destination: "Manimajra", distanceKm: 10, avgSpeedKmph: 25, type: "INTRACITY",
      stops: [
        { name: "PGI", lat: 30.7621, lng: 76.7725 },
        { name: "Punjab University", lat: 30.7601, lng: 76.7663 },
        { name: "Sector 15", lat: 30.7483, lng: 76.7766 },
        { name: "Sector 8", lat: 30.7431, lng: 76.7963 },
        { name: "Railway Station", lat: 30.7077, lng: 76.8159 },
        { name: "Manimajra", lat: 30.7137, lng: 76.8458 }
      ]
    },
    {
      name: "Chandigarh — Sector 43 ⇄ IT Park", origin: "Sector 43", destination: "IT Park", distanceKm: 12, avgSpeedKmph: 25, type: "INTRACITY",
      stops: [
        { name: "Sector 43", lat: 30.7082, lng: 76.7923 },
        { name: "Sector 34", lat: 30.7180, lng: 76.7780 },
        { name: "Sector 20", lat: 30.7219, lng: 76.7960 },
        { name: "Sector 26", lat: 30.7302, lng: 76.8105 },
        { name: "IT Park", lat: 30.7281, lng: 76.8375 }
      ]
    },
    {
      name: "Chandigarh — Mohali ⇄ Panchkula", origin: "Mohali Phase 8", destination: "Panchkula", distanceKm: 18, avgSpeedKmph: 28, type: "INTRACITY",
      stops: [
        { name: "Phase 8 Mohali", lat: 30.7027, lng: 76.7118 },
        { name: "Sector 43", lat: 30.7082, lng: 76.7923 },
        { name: "Tribune Chowk", lat: 30.7132, lng: 76.7981 },
        { name: "Transport Light", lat: 30.7121, lng: 76.8049 },
        { name: "Panchkula Bus Stand", lat: 30.6970, lng: 76.8465 }
      ]
    }
  ];

  const createdRoutes = await Route.insertMany(cityRoutes);

  // Generate vehicles dynamically
  let localBuses = [];
  const cityPrefixes = {
    "Delhi": "DL", "Mumbai": "MH", "Pune": "MH", "Chandigarh": "CH", "Bangalore": "KA",
    "Chennai": "TN", "Hyderabad": "TS", "Kolkata": "WB", "Ahmedabad": "GJ"
  };
  const models = ["Tata StarBus Ultra", "Eicher Skyline Pro", "Ashok Leyland Viking", "Volvo B7R City", "JBM Ecolife Electric", "Olectra Electric"];

  cityRoutes.forEach((route, rIdx) => {
      let cityName = route.name.split(" — ")[0];
      let code = cityPrefixes[cityName] || "DL";
      
      // 3 buses per route
      for(let b=1; b<=3; b++) {
          let isTrack = Math.random() > 0.3; // 70% tracking
          let stop = route.stops[Math.floor(Math.random() * route.stops.length)];
          let bLat = stop.lat + (Math.random() - 0.5) * 0.005;
          let bLng = stop.lng + (Math.random() - 0.5) * 0.005;
          
          let dEmail = null;
          // map drivers to the first few buses for each region to ensure testing works
          if (rIdx < 8 && b === 1) {
               dEmail = `ldriver${rIdx+1}@pt.com`;
          }

          localBuses.push({
              regNumber: `${code}${String(rIdx).padStart(2,'0')}Z${String(1000 + b + rIdx*10).substring(1)}`,
              model: models[Math.floor(Math.random() * models.length)],
              capacity: 45 + Math.floor(Math.random() * 20),
              rIdx: rIdx,
              dEmail: dEmail,
              lat: parseFloat(bLat.toFixed(5)),
              lng: parseFloat(bLng.toFixed(5)),
              isTracking: isTrack
          });
      }
  });

  const vehicles = localBuses.map((b) => ({
    regNumber: b.regNumber,
    model: b.model,
    capacity: b.capacity,
    type: "local",
    route: createdRoutes[b.rIdx]._id,
    driverName: b.dEmail || null,
    status: "active",
    isTracking: b.isTracking,
    currentLocation: { lat: b.lat, lng: b.lng },
    lastSeenAt: new Date()
  }));

  await Vehicle.insertMany(vehicles);
  console.log(`✅ ${createdRoutes.length} City routes and ${localBuses.length} public buses seeded.`);
};

module.exports = seedLocal;
