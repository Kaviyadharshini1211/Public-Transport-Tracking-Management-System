const Route = require("../models/Route");
const Vehicle = require("../models/Vehicle");

const seedIntercity = async () => {
  console.log("🛣️ Seeding ALL Intercity Data with Return Routes...");

  const baseRoutes = [
    {
      name: "Delhi ⇄ Jaipur", origin: "Delhi", destination: "Jaipur", distanceKm: 275, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
        { name: "Manesar", lat: 28.3546, lng: 76.9397 },
        { name: "Bhiwadi", lat: 28.2090, lng: 76.8606 },
        { name: "Dausa", lat: 26.9, lng: 76.33 },
        { name: "Jaipur Bus Stand", lat: 26.9124, lng: 75.7873 }
      ]
    },
    {
      name: "Delhi ⇄ Agra", origin: "Delhi", destination: "Agra", distanceKm: 233, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
        { name: "Faridabad", lat: 28.4089, lng: 77.3178 },
        { name: "Mathura", lat: 27.4924, lng: 77.6737 },
        { name: "Agra ISBT", lat: 27.1767, lng: 78.0081 }
      ]
    },
    {
      name: "Delhi ⇄ Amritsar", origin: "Delhi", destination: "Amritsar", distanceKm: 455, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
        { name: "Ambala", lat: 30.3752, lng: 76.7821 },
        { name: "Ludhiana", lat: 30.9010, lng: 75.8573 },
        { name: "Jalandhar", lat: 31.3260, lng: 75.5762 },
        { name: "Amritsar Bus Stand", lat: 31.6340, lng: 74.8723 }
      ]
    },
    {
      name: "Delhi ⇄ Chandigarh", origin: "Delhi", destination: "Chandigarh", distanceKm: 250, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
        { name: "Panipat", lat: 29.3909, lng: 76.9635 },
        { name: "Karnal", lat: 29.6857, lng: 76.9905 },
        { name: "Kurukshetra", lat: 29.9695, lng: 76.8226 },
        { name: "Chandigarh ISBT", lat: 30.7333, lng: 76.7794 }
      ]
    },
    {
      name: "Delhi ⇄ Dehradun", origin: "Delhi", destination: "Dehradun", distanceKm: 250, avgSpeedKmph: 50, type: "INTERCITY",
      stops: [
        { name: "Delhi Kashmiri Gate", lat: 28.6670, lng: 77.2280 },
        { name: "Meerut", lat: 28.9845, lng: 77.7064 },
        { name: "Muzaffarnagar", lat: 29.4727, lng: 77.7085 },
        { name: "Roorkee", lat: 29.8543, lng: 77.8880 },
        { name: "Dehradun ISBT", lat: 30.2882, lng: 78.0003 }
      ]
    },
    {
      name: "Delhi ⇄ Haridwar", origin: "Delhi", destination: "Haridwar", distanceKm: 220, avgSpeedKmph: 55, type: "INTERCITY",
      stops: [
        { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
        { name: "Modinagar", lat: 28.8354, lng: 77.5818 },
        { name: "Meerut", lat: 28.9845, lng: 77.7064 },
        { name: "Roorkee", lat: 29.8543, lng: 77.8880 },
        { name: "Haridwar Bus Stand", lat: 29.9457, lng: 78.1642 }
      ]
    },
    {
      name: "Delhi ⇄ Lucknow", origin: "Delhi", destination: "Lucknow", distanceKm: 550, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Delhi ISBT", lat: 28.7041, lng: 77.1025 },
        { name: "Noida", lat: 28.5355, lng: 77.3910 },
        { name: "Agra Expressway Toll", lat: 27.1767, lng: 78.0081 },
        { name: "Kanpur", lat: 26.4499, lng: 80.3319 },
        { name: "Lucknow Alambagh", lat: 26.8467, lng: 80.9462 }
      ]
    },
    {
      name: "Mumbai ⇄ Pune", origin: "Mumbai", destination: "Pune", distanceKm: 150, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Mumbai Dadar", lat: 19.0178, lng: 72.8436 },
        { name: "Navi Mumbai", lat: 19.0330, lng: 73.0297 },
        { name: "Lonavala", lat: 18.7546, lng: 73.4062 },
        { name: "Pune Swargate", lat: 18.5018, lng: 73.8586 }
      ]
    },
    {
      name: "Mumbai ⇄ Nashik", origin: "Mumbai", destination: "Nashik", distanceKm: 165, avgSpeedKmph: 55, type: "INTERCITY",
      stops: [
        { name: "Mumbai Borivali", lat: 19.2290, lng: 72.8573 },
        { name: "Thane", lat: 19.2183, lng: 72.9781 },
        { name: "Kalyan", lat: 19.2403, lng: 73.1305 },
        { name: "Igatpuri", lat: 19.6953, lng: 73.5516 },
        { name: "Nashik CBS", lat: 20.0110, lng: 73.7903 }
      ]
    },
    {
      name: "Mumbai ⇄ Surat", origin: "Mumbai", destination: "Surat", distanceKm: 280, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Mumbai Borivali", lat: 19.2290, lng: 72.8573 },
        { name: "Vapi", lat: 20.3725, lng: 72.9030 },
        { name: "Valsad", lat: 20.5992, lng: 72.9342 },
        { name: "Navsari", lat: 20.9467, lng: 72.9520 },
        { name: "Surat Bus Stand", lat: 21.1702, lng: 72.8311 }
      ]
    },
    {
      name: "Mumbai ⇄ Ahmedabad", origin: "Mumbai", destination: "Ahmedabad", distanceKm: 530, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Mumbai Borivali", lat: 19.2290, lng: 72.8573 },
        { name: "Surat", lat: 21.1702, lng: 72.8311 },
        { name: "Bharuch", lat: 21.7051, lng: 72.9959 },
        { name: "Vadodara", lat: 22.3072, lng: 73.1812 },
        { name: "Ahmedabad Gita Mandir", lat: 23.0135, lng: 72.5898 }
      ]
    },
    {
      name: "Mumbai ⇄ Goa", origin: "Mumbai", destination: "Goa", distanceKm: 590, avgSpeedKmph: 50, type: "INTERCITY",
      stops: [
        { name: "Mumbai Dadar", lat: 19.0178, lng: 72.8436 },
        { name: "Panvel", lat: 18.9894, lng: 73.1175 },
        { name: "Mahad", lat: 18.0827, lng: 73.4215 },
        { name: "Chiplun", lat: 17.5293, lng: 73.5186 },
        { name: "Ratnagiri", lat: 16.9902, lng: 73.3120 },
        { name: "Panaji Kadamba", lat: 15.4909, lng: 73.8278 }
      ]
    },
    {
      name: "Bangalore ⇄ Chennai", origin: "Bangalore", destination: "Chennai", distanceKm: 350, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Bangalore Majestic", lat: 12.9771, lng: 77.5703 },
        { name: "Hosur", lat: 12.7409, lng: 77.8253 },
        { name: "Krishnagiri", lat: 12.5266, lng: 78.2137 },
        { name: "Vellore", lat: 12.9165, lng: 79.1325 },
        { name: "Chennai CMBT", lat: 13.0674, lng: 80.2062 }
      ]
    },
    {
      name: "Bangalore ⇄ Mysore", origin: "Bangalore", destination: "Mysore", distanceKm: 145, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Bangalore Majestic", lat: 12.9771, lng: 77.5703 },
        { name: "Bidadi", lat: 12.7984, lng: 77.3975 },
        { name: "Ramanagara", lat: 12.7150, lng: 77.2813 },
        { name: "Mandya", lat: 12.5239, lng: 76.8950 },
        { name: "Mysore Suburban", lat: 12.2958, lng: 76.6394 }
      ]
    },
    {
      name: "Bangalore ⇄ Hyderabad", origin: "Bangalore", destination: "Hyderabad", distanceKm: 570, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Bangalore Majestic", lat: 12.9771, lng: 77.5703 },
        { name: "Anantapur", lat: 14.6819, lng: 77.6006 },
        { name: "Kurnool", lat: 15.8281, lng: 78.0373 },
        { name: "Mahbubnagar", lat: 16.7431, lng: 78.0076 },
        { name: "Hyderabad MGBS", lat: 17.3780, lng: 78.4812 }
      ]
    },
    {
      name: "Bangalore ⇄ Coimbatore", origin: "Bangalore", destination: "Coimbatore", distanceKm: 360, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Bangalore Majestic", lat: 12.9771, lng: 77.5703 },
        { name: "Dharmapuri", lat: 12.1211, lng: 78.1582 },
        { name: "Salem", lat: 11.6643, lng: 78.1460 },
        { name: "Erode", lat: 11.3410, lng: 77.7172 },
        { name: "Coimbatore Gandhipuram", lat: 11.0168, lng: 76.9558 }
      ]
    },
    {
      name: "Bangalore ⇄ Mangalore", origin: "Bangalore", destination: "Mangalore", distanceKm: 350, avgSpeedKmph: 50, type: "INTERCITY",
      stops: [
        { name: "Bangalore Majestic", lat: 12.9771, lng: 77.5703 },
        { name: "Kunigal", lat: 13.0259, lng: 77.0270 },
        { name: "Hassan", lat: 13.0068, lng: 76.1004 },
        { name: "Sakleshpur", lat: 12.9405, lng: 75.7865 },
        { name: "Mangalore KSRTC", lat: 12.8700, lng: 74.8800 }
      ]
    },
    {
      name: "Chennai ⇄ Madurai", origin: "Chennai", destination: "Madurai", distanceKm: 460, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Chennai CMBT", lat: 13.0674, lng: 80.2062 },
        { name: "Villupuram", lat: 11.9401, lng: 79.4861 },
        { name: "Trichy", lat: 10.7905, lng: 78.7047 },
        { name: "Madurai Mattuthavani", lat: 9.9392, lng: 78.1565 }
      ]
    },
    {
      name: "Chennai ⇄ Trichy", origin: "Chennai", destination: "Trichy", distanceKm: 330, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Chennai CMBT", lat: 13.0674, lng: 80.2062 },
        { name: "Tambaram", lat: 12.9249, lng: 80.1275 },
        { name: "Chengalpattu", lat: 12.6841, lng: 79.9760 },
        { name: "Villupuram", lat: 11.9401, lng: 79.4861 },
        { name: "Trichy Central", lat: 10.7905, lng: 78.7047 }
      ]
    },
    {
      name: "Chennai ⇄ Pondicherry", origin: "Chennai", destination: "Pondicherry", distanceKm: 150, avgSpeedKmph: 55, type: "INTERCITY",
      stops: [
        { name: "Chennai CMBT", lat: 13.0674, lng: 80.2062 },
        { name: "Sholinganallur", lat: 12.9009, lng: 80.2279 },
        { name: "Mahabalipuram", lat: 12.6208, lng: 80.1945 },
        { name: "Kalpakkam", lat: 12.5029, lng: 80.1658 },
        { name: "Pondicherry Bus Stand", lat: 11.9416, lng: 79.8083 }
      ]
    },
    {
      name: "Hyderabad ⇄ Vijayawada", origin: "Hyderabad", destination: "Vijayawada", distanceKm: 275, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Hyderabad MGBS", lat: 17.3780, lng: 78.4812 },
        { name: "Choutuppal", lat: 17.2427, lng: 78.9136 },
        { name: "Suryapet", lat: 17.1361, lng: 79.6263 },
        { name: "Kodad", lat: 16.9892, lng: 79.9634 },
        { name: "Vijayawada PNBS", lat: 16.5062, lng: 80.6480 }
      ]
    },
    {
      name: "Hyderabad ⇄ Warangal", origin: "Hyderabad", destination: "Warangal", distanceKm: 145, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Hyderabad MGBS", lat: 17.3780, lng: 78.4812 },
        { name: "Bhongir", lat: 17.5116, lng: 78.8872 },
        { name: "Jangaon", lat: 17.7208, lng: 79.1603 },
        { name: "Kazipet", lat: 17.9790, lng: 79.5294 },
        { name: "Warangal Bus Stand", lat: 18.0000, lng: 79.5833 }
      ]
    },
    {
      name: "Kolkata ⇄ Durgapur", origin: "Kolkata", destination: "Durgapur", distanceKm: 170, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Kolkata Esplanade", lat: 22.5646, lng: 88.3512 },
        { name: "Dankuni", lat: 22.6865, lng: 88.2917 },
        { name: "Bardhaman", lat: 23.2324, lng: 87.8615 },
        { name: "Panagarh", lat: 23.4475, lng: 87.4223 },
        { name: "Durgapur City Center", lat: 23.5204, lng: 87.3119 }
      ]
    },
    {
      name: "Kolkata ⇄ Bhubaneswar", origin: "Kolkata", destination: "Bhubaneswar", distanceKm: 440, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Kolkata Esplanade", lat: 22.5646, lng: 88.3512 },
        { name: "Kharagpur", lat: 22.3302, lng: 87.3237 },
        { name: "Balasore", lat: 21.4934, lng: 86.9337 },
        { name: "Cuttack", lat: 20.4625, lng: 85.8830 },
        { name: "Bhubaneswar Baramunda", lat: 20.2762, lng: 85.7997 }
      ]
    },
    {
      name: "Kolkata ⇄ Siliguri", origin: "Kolkata", destination: "Siliguri", distanceKm: 580, avgSpeedKmph: 55, type: "INTERCITY",
      stops: [
        { name: "Kolkata Esplanade", lat: 22.5646, lng: 88.3512 },
        { name: "Krishnanagar", lat: 23.4013, lng: 88.5015 },
        { name: "Berhampore", lat: 24.1018, lng: 88.2520 },
        { name: "Malda", lat: 25.0108, lng: 88.1411 },
        { name: "Siliguri Tenzing Norgay", lat: 26.7271, lng: 88.4315 }
      ]
    },
    {
      name: "Pune ⇄ Nagpur", origin: "Pune", destination: "Nagpur", distanceKm: 715, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Pune Swargate", lat: 18.5018, lng: 73.8586 },
        { name: "Ahmednagar", lat: 19.0952, lng: 74.7496 },
        { name: "Aurangabad", lat: 19.8762, lng: 75.3433 },
        { name: "Amravati", lat: 20.9320, lng: 77.7523 },
        { name: "Nagpur Ganeshpeth", lat: 21.1458, lng: 79.0882 }
      ]
    },
    {
      name: "Ahmedabad ⇄ Rajkot", origin: "Ahmedabad", destination: "Rajkot", distanceKm: 215, avgSpeedKmph: 65, type: "INTERCITY",
      stops: [
        { name: "Ahmedabad Gita Mandir", lat: 23.0135, lng: 72.5898 },
        { name: "Sanand", lat: 22.9868, lng: 72.3811 },
        { name: "Viramgam", lat: 23.1189, lng: 72.0360 },
        { name: "Surendranagar", lat: 22.7284, lng: 71.6371 },
        { name: "Rajkot Bus Stand", lat: 22.3039, lng: 70.8022 }
      ]
    },
    {
      name: "Jaipur ⇄ Udaipur", origin: "Jaipur", destination: "Udaipur", distanceKm: 395, avgSpeedKmph: 60, type: "INTERCITY",
      stops: [
        { name: "Jaipur Sindhi Camp", lat: 26.9248, lng: 75.7946 },
        { name: "Ajmer", lat: 26.4499, lng: 74.6399 },
        { name: "Beawar", lat: 26.1039, lng: 74.3218 },
        { name: "Bhilwara", lat: 25.3463, lng: 74.6364 },
        { name: "Udaipur Udiapole", lat: 24.5854, lng: 73.6854 }
      ]
    },
    {
      name: "Jalandhar ⇄ Delhi", origin: "Jalandhar", destination: "Delhi", distanceKm: 375, avgSpeedKmph: 55, type: "INTERCITY",
      stops: [
        { name: "Jalandhar Bus Stand", lat: 31.3260, lng: 75.5762 },
        { name: "Phagwara", lat: 31.2070, lng: 75.7718 },
        { name: "Ludhiana ISBT", lat: 30.9010, lng: 75.8573 },
        { name: "Ambala", lat: 30.3752, lng: 76.7821 },
        { name: "Delhi Kashmiri Gate", lat: 28.6670, lng: 77.2280 }
      ]
    },
    {
      name: "Jalandhar ⇄ Chandigarh", origin: "Jalandhar", destination: "Chandigarh", distanceKm: 150, avgSpeedKmph: 50, type: "INTERCITY",
      stops: [
        { name: "Jalandhar Bus Stand", lat: 31.3260, lng: 75.5762 },
        { name: "Phagwara", lat: 31.2242, lng: 75.7710 },
        { name: "Kharar", lat: 30.7460, lng: 76.6300 },
        { name: "Chandigarh ISBT 43", lat: 30.7333, lng: 76.7794 }
      ]
    }
  ];

  // Generate return routes automatically
  const allRoutes = [];
  baseRoutes.forEach(br => {
    allRoutes.push(br);
    allRoutes.push({
      ...br,
      name: `${br.destination} ⇄ ${br.origin}`,
      origin: br.destination,
      destination: br.origin,
      stops: [...br.stops].reverse()
    });
  });

  const createdRoutes = await Route.insertMany(allRoutes);

  const getStateCode = (city) => {
    const states = {
      "Delhi": "DL", "Mumbai": "MH", "Pune": "MH", "Nashik": "MH", "Surat": "GJ",
      "Ahmedabad": "GJ", "Bangalore": "KA", "Mysore": "KA", "Chennai": "TN",
      "Hyderabad": "TS", "Kolkata": "WB", "Chandigarh": "CH", "Dehradun": "UK",
      "Haridwar": "UK", "Lucknow": "UP", "Agra": "UP", "Amritsar": "PB"
    };
    return states[city] || "DL"; // fallback to DL
  };

  // Seed many more vehicles to ensure coverage
  const vehiclesToCreate = [];
  for (let i = 0; i < createdRoutes.length; i++) {
    const route = createdRoutes[i];
    const stateCode = getStateCode(route.origin);
    
    // Create at least 4 vehicles per route
    for (let j = 1; j <= 4; j++) {
      vehiclesToCreate.push({
        regNumber: `${stateCode}${10 + (i%90)}A${1000 + j + i}`,
        model: j <= 2 ? "Volvo B11R Multi-Axle" : "Tata Starbus AC",
        capacity: j <= 2 ? 50 : 42,
        type: "long-haul",
        route: route._id,
        driverName: `Driver ${i}${j}`,
        status: "active",
        lastSeenAt: new Date()
      });
    }
  }

  await Vehicle.insertMany(vehiclesToCreate);
  console.log(`✅ ${createdRoutes.length} Intercity routes and ${vehiclesToCreate.length} vehicles seeded.`);
};

module.exports = seedIntercity;
