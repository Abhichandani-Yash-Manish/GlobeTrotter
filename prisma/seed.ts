import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import type { City } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

const cities = [
  { name: 'Paris', country: 'France', region: 'Europe', costIndex: 4.2, popularity: 4.9, description: 'The City of Light, known for the Eiffel Tower, Louvre Museum, and world-class cuisine.', latitude: 48.8566, longitude: 2.3522, imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600' },
  { name: 'Tokyo', country: 'Japan', region: 'Asia', costIndex: 3.8, popularity: 4.8, description: 'A vibrant metropolis blending ultramodern with traditional temples and gardens.', latitude: 35.6762, longitude: 139.6503, imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600' },
  { name: 'New York', country: 'United States', region: 'North America', costIndex: 4.5, popularity: 4.9, description: 'The Big Apple — iconic skyline, Broadway, Central Park, and endless energy.', latitude: 40.7128, longitude: -74.0060, imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600' },
  { name: 'London', country: 'United Kingdom', region: 'Europe', costIndex: 4.3, popularity: 4.8, description: 'Historic capital with royal palaces, world-class museums, and vibrant culture.', latitude: 51.5074, longitude: -0.1278, imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600' },
  { name: 'Barcelona', country: 'Spain', region: 'Europe', costIndex: 3.2, popularity: 4.6, description: 'Gaudí architecture, Mediterranean beaches, and legendary nightlife.', latitude: 41.3874, longitude: 2.1686, imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600' },
  { name: 'Rome', country: 'Italy', region: 'Europe', costIndex: 3.5, popularity: 4.7, description: 'The Eternal City — Colosseum, Vatican, ancient ruins, and incredible food.', latitude: 41.9028, longitude: 12.4964, imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600' },
  { name: 'Bali', country: 'Indonesia', region: 'Asia', costIndex: 1.8, popularity: 4.5, description: 'Tropical paradise with stunning temples, rice terraces, and surf beaches.', latitude: -8.3405, longitude: 115.0920, imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600' },
  { name: 'Dubai', country: 'United Arab Emirates', region: 'Middle East', costIndex: 4.0, popularity: 4.6, description: 'Futuristic skyline, luxury shopping, desert adventures, and world records.', latitude: 25.2048, longitude: 55.2708, imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600' },
  { name: 'Sydney', country: 'Australia', region: 'Oceania', costIndex: 4.0, popularity: 4.5, description: 'Stunning harbour, iconic Opera House, beautiful beaches, and laid-back vibes.', latitude: -33.8688, longitude: 151.2093, imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600' },
  { name: 'Bangkok', country: 'Thailand', region: 'Asia', costIndex: 1.5, popularity: 4.5, description: 'Golden temples, vibrant street food, floating markets, and electric nightlife.', latitude: 13.7563, longitude: 100.5018, imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600' },
  { name: 'Istanbul', country: 'Turkey', region: 'Europe', costIndex: 2.2, popularity: 4.4, description: 'Where East meets West — stunning mosques, bustling bazaars, and Bosphorus views.', latitude: 41.0082, longitude: 28.9784, imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600' },
  { name: 'Amsterdam', country: 'Netherlands', region: 'Europe', costIndex: 3.8, popularity: 4.5, description: 'Canals, cycling culture, world-class museums, and colorful tulip fields.', latitude: 52.3676, longitude: 4.9041, imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600' },
  { name: 'Prague', country: 'Czech Republic', region: 'Europe', costIndex: 2.5, popularity: 4.3, description: 'Fairytale architecture, medieval old town, and legendary beer culture.', latitude: 50.0755, longitude: 14.4378, imageUrl: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600' },
  { name: 'Lisbon', country: 'Portugal', region: 'Europe', costIndex: 2.8, popularity: 4.4, description: 'Colorful tiled facades, pastéis de nata, tram rides, and Atlantic sunsets.', latitude: 38.7223, longitude: -9.1393, imageUrl: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600' },
  { name: 'Marrakech', country: 'Morocco', region: 'Africa', costIndex: 1.8, popularity: 4.2, description: 'Sensory overload — souks, riads, spices, and the Atlas Mountains nearby.', latitude: 31.6295, longitude: -7.9811, imageUrl: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600' },
  { name: 'Cape Town', country: 'South Africa', region: 'Africa', costIndex: 2.2, popularity: 4.3, description: 'Table Mountain, stunning coastline, vineyards, and incredible biodiversity.', latitude: -33.9249, longitude: 18.4241, imageUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600' },
  { name: 'Rio de Janeiro', country: 'Brazil', region: 'South America', costIndex: 2.5, popularity: 4.5, description: 'Christ the Redeemer, Copacabana, samba, and Sugarloaf Mountain.', latitude: -22.9068, longitude: -43.1729, imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600' },
  { name: 'Singapore', country: 'Singapore', region: 'Asia', costIndex: 3.8, popularity: 4.4, description: 'Garden city — futuristic architecture, hawker centres, and Marina Bay Sands.', latitude: 1.3521, longitude: 103.8198, imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600' },
  { name: 'Kyoto', country: 'Japan', region: 'Asia', costIndex: 3.5, popularity: 4.6, description: 'Ancient temples, bamboo groves, geisha districts, and stunning autumn colours.', latitude: 35.0116, longitude: 135.7681, imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600' },
  { name: 'Santorini', country: 'Greece', region: 'Europe', costIndex: 3.5, popularity: 4.7, description: 'Iconic white-washed buildings, blue domes, spectacular sunsets over the caldera.', latitude: 36.3932, longitude: 25.4615, imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600' },
  { name: 'Buenos Aires', country: 'Argentina', region: 'South America', costIndex: 1.8, popularity: 4.1, description: 'Tango, steak, colorful La Boca, and passionate football culture.', latitude: -34.6037, longitude: -58.3816, imageUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600' },
  { name: 'Reykjavik', country: 'Iceland', region: 'Europe', costIndex: 4.5, popularity: 4.2, description: 'Northern lights, geysers, hot springs, and otherworldly volcanic landscapes.', latitude: 64.1466, longitude: -21.9426, imageUrl: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=600' },
  { name: 'Cusco', country: 'Peru', region: 'South America', costIndex: 1.5, popularity: 4.3, description: 'Gateway to Machu Picchu, Inca heritage, and stunning Andean landscapes.', latitude: -13.5319, longitude: -71.9675, imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600' },
  { name: 'Seoul', country: 'South Korea', region: 'Asia', costIndex: 3.0, popularity: 4.4, description: 'K-pop culture, ancient palaces, incredible street food, and cutting-edge tech.', latitude: 37.5665, longitude: 126.9780, imageUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600' },
  { name: 'Vienna', country: 'Austria', region: 'Europe', costIndex: 3.5, popularity: 4.3, description: 'Imperial palaces, classical music, coffeehouse culture, and Sachertorte.', latitude: 48.2082, longitude: 16.3738, imageUrl: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600' },
  { name: 'Hanoi', country: 'Vietnam', region: 'Asia', costIndex: 1.2, popularity: 4.1, description: 'Ancient streets, pho culture, French colonial architecture, and Ha Long Bay nearby.', latitude: 21.0278, longitude: 105.8342, imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600' },
  { name: 'Dubrovnik', country: 'Croatia', region: 'Europe', costIndex: 3.0, popularity: 4.4, description: 'Medieval walled city on the Adriatic — the real Kings Landing.', latitude: 42.6507, longitude: 18.0944, imageUrl: 'https://images.unsplash.com/photo-1555990538-1e15c53c0e42?w=600' },
  { name: 'Petra', country: 'Jordan', region: 'Middle East', costIndex: 2.5, popularity: 4.5, description: 'Ancient rose-red city carved into rock — one of the New Seven Wonders.', latitude: 30.3285, longitude: 35.4444, imageUrl: 'https://images.unsplash.com/photo-1579606032821-4e6161c81571?w=600' },
  { name: 'Cairo', country: 'Egypt', region: 'Africa', costIndex: 1.5, popularity: 4.3, description: 'The Great Pyramids, the Sphinx, and thousands of years of civilization.', latitude: 30.0444, longitude: 31.2357, imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=600' },
  { name: 'Mexico City', country: 'Mexico', region: 'North America', costIndex: 1.8, popularity: 4.2, description: 'Ancient Aztec ruins, incredible tacos, vibrant art scene, and Frida Kahlo.', latitude: 19.4326, longitude: -99.1332, imageUrl: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600' },
  { name: 'Vancouver', country: 'Canada', region: 'North America', costIndex: 3.5, popularity: 4.2, description: 'Mountains meet ocean — skiing, hiking, diverse food scene, and Stanley Park.', latitude: 49.2827, longitude: -123.1207, imageUrl: 'https://images.unsplash.com/photo-1559511260-66a68e7e9b97?w=600' },
  { name: 'Jaipur', country: 'India', region: 'Asia', costIndex: 1.2, popularity: 4.1, description: 'The Pink City — majestic forts, vibrant markets, and royal Rajasthani heritage.', latitude: 26.9124, longitude: 75.7873, imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600' },
  { name: 'Florence', country: 'Italy', region: 'Europe', costIndex: 3.2, popularity: 4.5, description: 'Renaissance art capital — the Duomo, Uffizi Gallery, and Tuscan cuisine.', latitude: 43.7696, longitude: 11.2558, imageUrl: 'https://images.unsplash.com/photo-1543429258-6c51e03c9527?w=600' },
  { name: 'Havana', country: 'Cuba', region: 'North America', costIndex: 1.5, popularity: 4.0, description: 'Vintage cars, colorful streets, salsa music, and revolutionary history.', latitude: 23.1136, longitude: -82.3666, imageUrl: 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=600' },
  { name: 'Queenstown', country: 'New Zealand', region: 'Oceania', costIndex: 3.8, popularity: 4.3, description: 'Adventure capital — bungee jumping, skiing, Lord of the Rings landscapes.', latitude: -45.0312, longitude: 168.6626, imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600' },
  { name: 'Zanzibar', country: 'Tanzania', region: 'Africa', costIndex: 1.8, popularity: 3.9, description: 'Spice island with pristine beaches, Stone Town heritage, and turquoise waters.', latitude: -6.1659, longitude: 39.2026, imageUrl: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=600' },
  { name: 'Maldives', country: 'Maldives', region: 'Asia', costIndex: 4.8, popularity: 4.7, description: 'Overwater villas, crystal lagoons, and the ultimate tropical paradise.', latitude: 3.2028, longitude: 73.2207, imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600' },
  { name: 'Budapest', country: 'Hungary', region: 'Europe', costIndex: 2.2, popularity: 4.3, description: 'Thermal baths, ruin bars, stunning Danube views, and grand architecture.', latitude: 47.4979, longitude: 19.0402, imageUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=600' },
  { name: 'Chiang Mai', country: 'Thailand', region: 'Asia', costIndex: 1.2, popularity: 4.2, description: 'Mountain temples, night bazaars, elephant sanctuaries, and Thai cooking classes.', latitude: 18.7883, longitude: 98.9853, imageUrl: 'https://images.unsplash.com/photo-1512553424883-fad5e4647786?w=600' },
  { name: 'Edinburgh', country: 'United Kingdom', region: 'Europe', costIndex: 3.3, popularity: 4.2, description: 'Historic castle, Arthur Seat, whisky tastings, and the Edinburgh Fringe.', latitude: 55.9533, longitude: -3.1883, imageUrl: 'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=600' },
  { name: 'Cartagena', country: 'Colombia', region: 'South America', costIndex: 1.8, popularity: 4.0, description: 'Colonial walled city, Caribbean beaches, colorful streets, and salsa nightlife.', latitude: 10.3910, longitude: -75.5144, imageUrl: 'https://images.unsplash.com/photo-1583997052103-b4a1cb974ce5?w=600' },
  { name: 'Siem Reap', country: 'Cambodia', region: 'Asia', costIndex: 1.0, popularity: 4.3, description: 'Gateway to Angkor Wat — ancient temples, night markets, and Khmer culture.', latitude: 13.3671, longitude: 103.8448, imageUrl: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=600' },
  { name: 'Amalfi Coast', country: 'Italy', region: 'Europe', costIndex: 4.0, popularity: 4.6, description: 'Dramatic cliffside villages, azure waters, limoncello, and Mediterranean charm.', latitude: 40.6340, longitude: 14.6027, imageUrl: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600' },
  { name: 'Nairobi', country: 'Kenya', region: 'Africa', costIndex: 2.0, popularity: 3.8, description: 'Safari gateway city — national park, giraffe centre, and vibrant urban culture.', latitude: -1.2921, longitude: 36.8219, imageUrl: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=600' },
  { name: 'Kathmandu', country: 'Nepal', region: 'Asia', costIndex: 1.0, popularity: 4.0, description: 'Gateway to the Himalayas — ancient temples, prayer flags, and mountain treks.', latitude: 27.7172, longitude: 85.3240, imageUrl: 'https://images.unsplash.com/photo-1558799401-1dcba79834c2?w=600' },
  { name: 'San Francisco', country: 'United States', region: 'North America', costIndex: 4.5, popularity: 4.3, description: 'Golden Gate Bridge, cable cars, Alcatraz, and Silicon Valley innovation.', latitude: 37.7749, longitude: -122.4194, imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600' },
  { name: 'Medellín', country: 'Colombia', region: 'South America', costIndex: 1.5, popularity: 4.0, description: 'City of eternal spring — cable cars, innovative urban design, and nightlife.', latitude: 6.2476, longitude: -75.5658, imageUrl: 'https://images.unsplash.com/photo-1599493758267-c6c884c7071f?w=600' },
  { name: 'Bruges', country: 'Belgium', region: 'Europe', costIndex: 3.0, popularity: 4.1, description: 'Medieval fairy tale — canals, chocolate, Belgian waffles, and cobblestone streets.', latitude: 51.2094, longitude: 3.2247, imageUrl: 'https://images.unsplash.com/photo-1559113202-c916b8e44373?w=600' },
  { name: 'Lhasa', country: 'China', region: 'Asia', costIndex: 2.0, popularity: 3.8, description: 'Roof of the world — Potala Palace, monasteries, and Tibetan Buddhist culture.', latitude: 29.6500, longitude: 91.1000, imageUrl: 'https://images.unsplash.com/photo-1567253508785-4abaeedae04d?w=600' },
  { name: 'Patagonia', country: 'Argentina', region: 'South America', costIndex: 3.0, popularity: 4.2, description: 'Epic glaciers, towering peaks, pristine wilderness, and the end of the world.', latitude: -50.3400, longitude: -72.2648, imageUrl: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=600' },
  { name: 'Ahmedabad', country: 'India', region: 'Asia', costIndex: 1.1, popularity: 4.0, description: 'A UNESCO-listed old city of pol houses, stepwells, textiles, modernist architecture, and Gujarati food traditions.', latitude: 23.0225, longitude: 72.5714, imageUrl: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=600' },
  { name: 'Udaipur', country: 'India', region: 'Asia', costIndex: 1.4, popularity: 4.4, description: 'The lake city pairs Mewar palaces, quiet ghats, miniature painting studios, and Aravalli sunsets.', latitude: 24.5854, longitude: 73.7125, imageUrl: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=600' },
  { name: 'Mumbai', country: 'India', region: 'Asia', costIndex: 2.2, popularity: 4.6, description: 'India’s kinetic coastal metropolis, shaped by Art Deco, cinema, historic markets, sea promenades, and remarkable food.', latitude: 19.0760, longitude: 72.8777, imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600' },
  { name: 'Goa', country: 'India', region: 'Asia', costIndex: 1.8, popularity: 4.6, description: 'A layered Konkan escape of laterite forts, Portuguese churches, village kitchens, mangroves, and long Arabian Sea beaches.', latitude: 15.2993, longitude: 74.1240, imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600' },
  { name: 'Vadodara', country: 'India', region: 'Asia', costIndex: 1.0, popularity: 3.8, description: 'A cultured Gujarat city with Gaekwad-era palaces, museums, university avenues, and easy access to Champaner.', latitude: 22.3072, longitude: 73.1812, imageUrl: 'https://images.unsplash.com/photo-1609948543911-7f01ff385be5?w=600' },
];

type CityActivities = {
  [cityName: string]: Array<{ name: string; description: string; category: string; cost: number; duration: number; imageUrl: string }>;
};

const activitiesByCity: CityActivities = {
  'Paris': [
    { name: 'Eiffel Tower Visit', description: 'Ascend the iconic iron tower for panoramic views of Paris.', category: 'Sightseeing', cost: 25, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=400' },
    { name: 'Louvre Museum', description: 'Explore the world\'s largest art museum, home to the Mona Lisa.', category: 'Culture', cost: 17, duration: 3, imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400' },
    { name: 'Seine River Cruise', description: 'Glide past illuminated monuments on an evening boat cruise.', category: 'Sightseeing', cost: 15, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=400' },
    { name: 'Montmartre Walking Tour', description: 'Wander through the artistic hilltop neighborhood and visit Sacré-Cœur.', category: 'Culture', cost: 0, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=400' },
    { name: 'French Cooking Class', description: 'Learn to prepare classic French dishes with a local chef.', category: 'Food & Drink', cost: 85, duration: 3, imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400' },
  ],
  'Tokyo': [
    { name: 'Shibuya Crossing Experience', description: 'Stand in the world\'s busiest pedestrian crossing.', category: 'Sightseeing', cost: 0, duration: 1, imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400' },
    { name: 'Tsukiji Outer Market Food Tour', description: 'Sample fresh sushi, tamagoyaki, and street snacks.', category: 'Food & Drink', cost: 45, duration: 2.5, imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400' },
    { name: 'Meiji Shrine Visit', description: 'Peaceful Shinto shrine surrounded by an ancient forest.', category: 'Culture', cost: 0, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1583766395091-2eb9994ed094?w=400' },
    { name: 'Akihabara Electronics District', description: 'Explore anime, manga, and cutting-edge tech shops.', category: 'Shopping', cost: 30, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1528164344885-47d68e7b8c74?w=400' },
    { name: 'Tokyo Tower Night View', description: 'See the glittering city from this iconic tower at night.', category: 'Sightseeing', cost: 12, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400' },
  ],
  'New York': [
    { name: 'Statue of Liberty & Ellis Island', description: 'Visit America\'s most iconic monument and immigration museum.', category: 'Sightseeing', cost: 24, duration: 4, imageUrl: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=400' },
    { name: 'Central Park Bike Tour', description: 'Cycle through the city\'s green heart past landmarks and lakes.', category: 'Nature', cost: 35, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400' },
    { name: 'Broadway Show', description: 'Experience a world-class musical or play on Broadway.', category: 'Culture', cost: 120, duration: 2.5, imageUrl: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=400' },
    { name: 'Times Square at Night', description: 'Take in the neon lights and energy of the Crossroads of the World.', category: 'Sightseeing', cost: 0, duration: 1, imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400' },
    { name: 'Top of the Rock', description: 'Observation deck with stunning views of Central Park and the skyline.', category: 'Sightseeing', cost: 40, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400' },
  ],
  'London': [
    { name: 'Tower of London', description: 'Explore 1000 years of history and see the Crown Jewels.', category: 'Culture', cost: 30, duration: 3, imageUrl: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400' },
    { name: 'British Museum', description: 'World-class collection spanning two million years of history.', category: 'Culture', cost: 0, duration: 3, imageUrl: 'https://images.unsplash.com/photo-1590080876063-1e3b85a4a0b8?w=400' },
    { name: 'Thames River Walk', description: 'Stroll along the South Bank past iconic London landmarks.', category: 'Sightseeing', cost: 0, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=400' },
    { name: 'Afternoon Tea Experience', description: 'Classic British afternoon tea with scones and finger sandwiches.', category: 'Food & Drink', cost: 55, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400' },
  ],
  'Barcelona': [
    { name: 'Sagrada Familia Tour', description: 'Gaudí\'s breathtaking unfinished basilica — a UNESCO masterpiece.', category: 'Sightseeing', cost: 26, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1583779457267-d6abb4d0e7af?w=400' },
    { name: 'Park Güell', description: 'Colorful mosaic park with stunning views over Barcelona.', category: 'Sightseeing', cost: 10, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1583779457267-d6abb4d0e7af?w=400' },
    { name: 'La Boqueria Market Tour', description: 'Explore the famous market and sample fresh Catalan specialties.', category: 'Food & Drink', cost: 20, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1583779457267-d6abb4d0e7af?w=400' },
    { name: 'Barceloneta Beach', description: 'Relax on the Mediterranean beach with waterfront dining.', category: 'Nature', cost: 0, duration: 3, imageUrl: 'https://images.unsplash.com/photo-1583779457267-d6abb4d0e7af?w=400' },
  ],
  'Rome': [
    { name: 'Colosseum & Roman Forum', description: 'Walk through ancient Rome\'s most iconic amphitheatre.', category: 'Sightseeing', cost: 18, duration: 3, imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400' },
    { name: 'Vatican Museums & Sistine Chapel', description: 'Marvel at Michelangelo\'s ceiling and vast art collections.', category: 'Culture', cost: 17, duration: 3, imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400' },
    { name: 'Trastevere Food Walk', description: 'Sample authentic Roman cuisine in the charming Trastevere quarter.', category: 'Food & Drink', cost: 40, duration: 2.5, imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400' },
    { name: 'Trevi Fountain & Spanish Steps', description: 'Visit Rome\'s most famous fountain and elegant staircase.', category: 'Sightseeing', cost: 0, duration: 1, imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400' },
  ],
  'Bali': [
    { name: 'Ubud Rice Terrace Trek', description: 'Hike through stunning Tegallalang rice paddies.', category: 'Nature', cost: 15, duration: 3, imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400' },
    { name: 'Uluwatu Temple Sunset', description: 'Watch a traditional Kecak fire dance at sunset cliff temple.', category: 'Culture', cost: 10, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400' },
    { name: 'Surfing Lesson in Kuta', description: 'Catch your first waves with an experienced instructor.', category: 'Adventure', cost: 25, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400' },
    { name: 'Balinese Spa Treatment', description: 'Relax with traditional flower baths and massage rituals.', category: 'Nature', cost: 35, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400' },
  ],
  'Dubai': [
    { name: 'Burj Khalifa Observation', description: 'View the city from the world\'s tallest building at 828m.', category: 'Sightseeing', cost: 45, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400' },
    { name: 'Desert Safari & Dune Bashing', description: 'Thrilling 4x4 ride across sand dunes with BBQ dinner.', category: 'Adventure', cost: 60, duration: 5, imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400' },
    { name: 'Dubai Mall & Aquarium', description: 'Shop at the world\'s largest mall and visit the underwater zoo.', category: 'Shopping', cost: 30, duration: 3, imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400' },
    { name: 'Dhow Cruise Dinner', description: 'Traditional wooden boat dinner cruise along Dubai Marina.', category: 'Food & Drink', cost: 55, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400' },
  ],
  'Sydney': [
    { name: 'Sydney Opera House Tour', description: 'Behind-the-scenes tour of the iconic performing arts centre.', category: 'Culture', cost: 42, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400' },
    { name: 'Bondi to Coogee Coastal Walk', description: 'Scenic cliff-top walk between Sydney\'s famous beaches.', category: 'Nature', cost: 0, duration: 2.5, imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400' },
    { name: 'Harbour Bridge Climb', description: 'Climb to the summit of the Sydney Harbour Bridge.', category: 'Adventure', cost: 175, duration: 3.5, imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400' },
  ],
  'Bangkok': [
    { name: 'Grand Palace & Wat Phra Kaew', description: 'Explore the stunning royal complex and Emerald Buddha.', category: 'Sightseeing', cost: 15, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400' },
    { name: 'Floating Market Trip', description: 'Experience traditional canal-side trading and street food.', category: 'Culture', cost: 20, duration: 4, imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400' },
    { name: 'Street Food Tour', description: 'Taste Bangkok\'s legendary pad thai, mango sticky rice, and more.', category: 'Food & Drink', cost: 25, duration: 3, imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400' },
    { name: 'Khao San Road Night Market', description: 'Experience the vibrant backpacker hub with food and shopping.', category: 'Nightlife', cost: 10, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400' },
  ],
  'Istanbul': [
    { name: 'Hagia Sophia', description: 'Marvel at the magnificent Byzantine cathedral turned mosque.', category: 'Culture', cost: 0, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400' },
    { name: 'Grand Bazaar Shopping', description: 'Get lost in one of the world\'s oldest and largest covered markets.', category: 'Shopping', cost: 20, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400' },
    { name: 'Bosphorus Cruise', description: 'Sail between Europe and Asia on this scenic strait cruise.', category: 'Sightseeing', cost: 15, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400' },
    { name: 'Turkish Bath Experience', description: 'Relax in a traditional hammam with steam and massage.', category: 'Culture', cost: 40, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400' },
  ],
  'Amsterdam': [
    { name: 'Anne Frank House', description: 'Visit the poignant hiding place turned memorial museum.', category: 'Culture', cost: 16, duration: 1.5, imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400' },
    { name: 'Canal Cruise', description: 'Glide through Amsterdam\'s UNESCO-listed canal ring.', category: 'Sightseeing', cost: 18, duration: 1, imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400' },
    { name: 'Van Gogh Museum', description: 'World\'s largest collection of Van Gogh paintings and letters.', category: 'Culture', cost: 20, duration: 2, imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400' },
    { name: 'Bike Tour of the City', description: 'See Amsterdam like a local on a guided bicycle tour.', category: 'Adventure', cost: 30, duration: 2.5, imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400' },
  ],
};

const landmarksByCity: Record<string, readonly string[]> = {
  Paris: ['Musée de l’Orangerie', 'Palais Garnier', 'Le Marais', 'Sainte-Chapelle', 'Canal Saint-Martin', 'Marché des Enfants Rouges'],
  Tokyo: ['Sensō-ji Temple', 'teamLab Borderless', 'Tokyo National Museum', 'Yanaka Ginza', 'Hamarikyu Gardens', 'Kappabashi Street'],
  'New York': ['The Met Cloisters', 'High Line', 'Tenement Museum', 'Brooklyn Bridge Park', 'Whitney Museum', 'Chelsea Market'],
  London: ['Westminster Abbey', 'Tate Modern', 'Borough Market', 'Kew Gardens', 'Churchill War Rooms', 'Greenwich Observatory'],
  Barcelona: ['Casa Batlló', 'Palau de la Música Catalana', 'Montjuïc Castle', 'Picasso Museum', 'Sant Antoni Market', 'Bunkers del Carmel'],
  Rome: ['Pantheon', 'Galleria Borghese', 'Appian Way', 'Capitoline Museums', 'Villa Doria Pamphilj', 'Testaccio Market'],
  Bali: ['Tirta Empul', 'Jatiluwih Rice Terraces', 'Sekumpul Waterfall', 'Tanah Lot', 'Nusa Dua Reef', 'Sidemen Valley'],
  Dubai: ['Al Fahidi Historical District', 'Museum of the Future', 'Dubai Creek Abra', 'Jumeirah Mosque', 'Alserkal Avenue', 'Ras Al Khor Sanctuary'],
  Sydney: ['Royal Botanic Garden', 'Manly Ferry', 'Art Gallery of New South Wales', 'The Rocks', 'Taronga Zoo', 'Barangaroo Reserve'],
  Bangkok: ['Wat Arun', 'Jim Thompson House', 'Talat Noi', 'Museum Siam', 'Benjakitti Forest Park', 'Chinatown Yaowarat'],
  Istanbul: ['Topkapı Palace', 'Basilica Cistern', 'Süleymaniye Mosque', 'Galata Tower', 'Balat Quarter', 'Dolmabahçe Palace'],
  Amsterdam: ['Rijksmuseum', 'Jordaan Quarter', 'Hortus Botanicus', 'NDSM Wharf', 'Rembrandt House', 'Foodhallen'],
  Prague: ['Prague Castle', 'Charles Bridge', 'Jewish Museum', 'Vyšehrad', 'DOX Centre for Contemporary Art', 'Letná Park', 'Strahov Library', 'Klementinum', 'Veletržní Palace'],
  Lisbon: ['Jerónimos Monastery', 'MAAT', 'Alfama', 'São Jorge Castle', 'Time Out Market', 'Miradouro da Senhora do Monte', 'Calouste Gulbenkian Museum', 'Belém Tower', 'LX Factory'],
  Marrakech: ['Bahia Palace', 'Jardin Majorelle', 'Maison de la Photographie', 'Saadian Tombs', 'Le Jardin Secret', 'Agafay Desert Camp', 'Dar El Bacha Museum', 'Madrasa Ben Youssef', 'Musée Yves Saint Laurent'],
  'Cape Town': ['Table Mountain Cableway', 'Robben Island', 'Kirstenbosch Gardens', 'Zeitz MOCAA', 'Boulders Beach', 'Bo-Kaap'],
  'Rio de Janeiro': ['Christ the Redeemer', 'Sugarloaf Cable Car', 'Selarón Steps', 'Museum of Tomorrow', 'Tijuca National Park', 'Ipanema Beach'],
  Singapore: ['Gardens by the Bay', 'National Gallery Singapore', 'Kampong Glam', 'MacRitchie Reservoir', 'Peranakan Museum', 'Tiong Bahru Market'],
  Kyoto: ['Fushimi Inari Taisha', 'Kiyomizu-dera', 'Arashiyama Bamboo Grove', 'Nishiki Market', 'Philosopher’s Path', 'Nijō Castle'],
  Santorini: ['Akrotiri Archaeological Site', 'Oia Castle', 'Ancient Thera', 'Fira to Oia Trail', 'Santo Wines', 'Red Beach'],
  'Buenos Aires': ['Teatro Colón', 'MALBA', 'Recoleta Cemetery', 'San Telmo Market', 'El Ateneo Grand Splendid', 'Reserva Ecológica'],
  Reykjavik: ['Hallgrímskirkja', 'Harpa Concert Hall', 'Perlan', 'Sky Lagoon', 'Árbær Open Air Museum', 'Grótta Lighthouse'],
  Cusco: ['Sacsayhuamán', 'Qorikancha', 'San Pedro Market', 'Inka Museum', 'Tambomachay', 'Pisac Archaeological Park'],
  Seoul: ['Gyeongbokgung Palace', 'Leeum Museum', 'Bukchon Hanok Village', 'Gwangjang Market', 'Namsan Seoul Tower', 'Seoul Forest'],
  Vienna: ['Schönbrunn Palace', 'Belvedere Museum', 'Kunsthistorisches Museum', 'Naschmarkt', 'Prater', 'Austrian National Library'],
  Hanoi: ['Temple of Literature', 'Vietnamese Women’s Museum', 'Hoàn Kiếm Lake', 'Thăng Long Citadel', 'Long Biên Bridge', 'Trúc Bạch Lake'],
  Dubrovnik: ['Dubrovnik City Walls', 'Rector’s Palace', 'Fort Lovrijenac', 'Lokrum Island', 'Mount Srđ Cable Car', 'War Photo Limited'],
  Petra: ['The Treasury', 'The Monastery', 'High Place of Sacrifice', 'Petra by Night', 'Little Petra', 'Royal Tombs'],
  Cairo: ['Giza Pyramids', 'Grand Egyptian Museum', 'National Museum of Egyptian Civilization', 'Al-Azhar Mosque', 'Khan el-Khalili', 'Coptic Cairo'],
  'Mexico City': ['Museo Frida Kahlo', 'National Museum of Anthropology', 'Palacio de Bellas Artes', 'Chapultepec Castle', 'Templo Mayor', 'Casa Luis Barragán'],
  Vancouver: ['Stanley Park Seawall', 'Museum of Anthropology', 'Granville Island', 'Capilano Suspension Bridge', 'Vancouver Art Gallery', 'Grouse Mountain'],
  Jaipur: ['Amber Fort', 'City Palace', 'Hawa Mahal', 'Jantar Mantar', 'Albert Hall Museum', 'Panna Meena ka Kund'],
  Florence: ['Uffizi Gallery', 'Cathedral of Santa Maria del Fiore', 'Accademia Gallery', 'Boboli Gardens', 'Palazzo Vecchio', 'Mercato Centrale'],
  Havana: ['Museo Nacional de Bellas Artes', 'Malecón', 'Fusterlandia', 'Castillo de la Real Fuerza', 'Callejón de Hamel', 'Plaza Vieja'],
  Queenstown: ['Skyline Queenstown', 'Ben Lomond Track', 'Queenstown Gardens', 'Shotover Jet', 'Glenorchy Scenic Road', 'Kiwi Park'],
  Zanzibar: ['Stone Town', 'House of Wonders', 'Jozani Forest', 'Prison Island', 'Darajani Market', 'Forodhani Gardens'],
  Maldives: ['Banana Reef', 'National Museum Maldives', 'Hukuru Miskiy', 'Vaadhoo Bioluminescent Beach', 'Hanifaru Bay', 'Malé Fish Market'],
  Budapest: ['Hungarian Parliament', 'Széchenyi Thermal Bath', 'Fisherman’s Bastion', 'House of Music Hungary', 'Great Market Hall', 'Memento Park'],
  'Chiang Mai': ['Wat Phra That Doi Suthep', 'Wat Chedi Luang', 'Lanna Folklife Museum', 'Bua Tong Waterfalls', 'Jing Jai Market', 'Wiang Kum Kam'],
  Edinburgh: ['Edinburgh Castle', 'National Museum of Scotland', 'Arthur’s Seat', 'Palace of Holyroodhouse', 'Dean Village', 'Camera Obscura'],
  Cartagena: ['Castillo San Felipe de Barajas', 'Palace of Inquisition', 'Getsemaní', 'Rosario Islands', 'La Popa Convent', 'Museo del Oro Zenú'],
  'Siem Reap': ['Angkor Wat', 'Bayon Temple', 'Ta Prohm', 'Banteay Srei', 'Angkor National Museum', 'Tonlé Sap Floating Village'],
  'Amalfi Coast': ['Villa Rufolo', 'Path of the Gods', 'Amalfi Cathedral', 'Villa Cimbrone', 'Fiordo di Furore', 'Paper Museum Amalfi'],
  Nairobi: ['Nairobi National Park', 'Giraffe Centre', 'Karen Blixen Museum', 'Nairobi National Museum', 'Karura Forest', 'Bomas of Kenya'],
  Kathmandu: ['Swayambhunath', 'Boudhanath Stupa', 'Patan Durbar Square', 'Pashupatinath Temple', 'Garden of Dreams', 'Kopan Monastery'],
  'San Francisco': ['Golden Gate Bridge', 'Alcatraz Island', 'de Young Museum', 'Ferry Building', 'Lands End Trail', 'Exploratorium'],
  Medellín: ['Museo de Antioquia', 'Comuna 13 Escalators', 'Jardín Botánico', 'Parque Arví', 'Casa de la Memoria', 'Plaza Botero'],
  Bruges: ['Groeningemuseum', 'Belfry of Bruges', 'Basilica of the Holy Blood', 'Begijnhof', 'Sint-Janshospitaal', 'De Halve Maan Brewery'],
  Lhasa: ['Potala Palace', 'Jokhang Temple', 'Sera Monastery', 'Norbulingka', 'Tibet Museum', 'Drepung Monastery'],
  Patagonia: ['Perito Moreno Glacier', 'Fitz Roy Trail', 'Torres del Paine', 'Laguna de los Tres', 'Tierra del Fuego National Park', 'Cueva de las Manos'],
  Ahmedabad: ['Sabarmati Ashram', 'Adalaj Stepwell', 'Sidi Saiyyed Mosque', 'Calico Museum of Textiles', 'Manek Chowk', 'CEPT Architecture Campus', 'Auto World Vintage Car Museum', 'Hutheesing Jain Temple', 'Conflictorium'],
  Udaipur: ['City Palace Udaipur', 'Lake Pichola Boat Ride', 'Bagore Ki Haveli', 'Sajjangarh Monsoon Palace', 'Ahar Cenotaphs', 'Shilpgram', 'Sajjangarh Biological Park', 'Vintage and Classic Car Museum', 'Saheliyon Ki Bari'],
  Mumbai: ['Chhatrapati Shivaji Maharaj Vastu Sangrahalaya', 'Gateway of India', 'Elephanta Caves', 'Bandra Fort', 'Dr. Bhau Daji Lad Museum', 'Kala Ghoda', 'Mani Bhavan', 'Khotachiwadi', 'Sanjay Gandhi National Park'],
  Goa: ['Basilica of Bom Jesus', 'Reis Magos Fort', 'Fontainhas', 'Salim Ali Bird Sanctuary', 'Cabo de Rama Fort', 'Museum of Goa', 'Chorao Island', 'Mario Miranda Gallery', 'Tambdi Surla Temple'],
  Vadodara: ['Laxmi Vilas Palace', 'Baroda Museum', 'Kirti Mandir', 'EME Temple', 'Sayaji Garden', 'Champaner-Pavagadh Archaeological Park', 'Maharaja Fateh Singh Museum', 'Tambekar Wada', 'Aurobindo Ashram Vadodara'],
};

const showcaseCities = new Set(cities.slice(0, 15).map((city) => city.name).concat(['Ahmedabad', 'Udaipur', 'Mumbai', 'Goa', 'Vadodara']));
const activityCategories = ['Sightseeing', 'Culture', 'Food & Drink', 'Nature', 'Shopping', 'Adventure'] as const;

function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function cityMetadata(city: (typeof cities)[number]) {
  const currencyByCountry: Record<string, string> = {
    India: 'INR', France: 'EUR', Japan: 'JPY', 'United States': 'USD', 'United Kingdom': 'GBP', Spain: 'EUR', Italy: 'EUR',
    Indonesia: 'IDR', Australia: 'AUD', Thailand: 'THB', Canada: 'CAD', Singapore: 'SGD', Argentina: 'ARS', Brazil: 'BRL',
  };
  return {
    ...city,
    slug: slugify(`${city.name}-${city.country}`),
    bestSeason: city.region === 'Europe' ? 'April–June · September–October' : city.region === 'Asia' ? 'October–March' : 'March–May · September–November',
    idealDays: showcaseCities.has(city.name) ? 4 : 3,
    timezone: city.longitude !== null ? `UTC${Math.round(city.longitude / 15) >= 0 ? '+' : ''}${Math.round(city.longitude / 15)}` : null,
    currencyCode: currencyByCountry[city.country] ?? 'USD',
    dailyBudget: Math.round(city.costIndex * 48),
    tags: JSON.stringify([city.region, city.costIndex <= 2 ? 'value' : 'signature', city.popularity >= 4.5 ? 'iconic' : 'curious']),
    imageCredit: 'Unsplash contributor',
    imageSourceUrl: city.imageUrl,
  };
}

function buildActivities(city: (typeof cities)[number]) {
  const existing = activitiesByCity[city.name] ?? [];
  const target = showcaseCities.has(city.name) ? 9 : 6;
  const additions = (landmarksByCity[city.name] ?? []).map((name, index) => ({
    name,
    description: `Spend time at ${name}, a distinctive ${city.name} place selected for its local story, setting, and traveller appeal.`,
    category: activityCategories[index % activityCategories.length],
    cost: Math.max(0, Math.round(city.costIndex * 6 + index * 3)),
    duration: 1.5 + (index % 3) * 0.5,
    imageUrl: city.imageUrl,
  }));
  const unique = [...existing, ...additions].filter((activity, index, all) => all.findIndex((item) => item.name === activity.name) === index);
  return unique.slice(0, target);
}

async function main() {
  console.log('🌍 Seeding GlobeTrotter database...');

  // Clean existing data
  await prisma.routeSegmentCache.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.tripInvite.deleteMany();
  await prisma.tripMember.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.tripActivity.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.savedDestination.deleteMany();
  await prisma.tripStop.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const demoPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@globetrotter.com',
      passwordHash: demoPasswordHash,
      name: 'Alex Traveler',
      role: 'USER',
      avatar: null,
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@globetrotter.com',
      passwordHash: adminPasswordHash,
      name: 'Admin',
      role: 'ADMIN',
      avatar: null,
    },
  });

  console.log('✅ Created demo users');

  // Create cities
  const createdCities: Record<string, City> = {};
  for (const city of cities) {
    const created = await prisma.city.create({ data: cityMetadata(city) });
    createdCities[city.name] = created;
  }
  console.log(`✅ Created ${cities.length} cities`);

  // Create activities
  let activityCount = 0;
  for (const city of cities) {
    const cityActivities = buildActivities(city);
    for (let activityIndex = 0; activityIndex < cityActivities.length; activityIndex++) {
      const activity = cityActivities[activityIndex];
      await prisma.activity.create({
        data: {
          ...activity,
          cityId: createdCities[city.name].id,
          address: `${activity.name}, ${city.name}, ${city.country}`,
          latitude: city.latitude + ((activityIndex % 3) - 1) * 0.008,
          longitude: city.longitude + ((activityIndex % 4) - 1.5) * 0.008,
          accessibility: activityIndex % 3 === 0 ? 'Step-free access information available; confirm with venue.' : 'Contact the venue for current accessibility details.',
          tags: JSON.stringify([activity.category.toLowerCase(), city.name.toLowerCase(), activity.cost === 0 ? 'free' : 'ticketed']),
          imageCredit: 'Unsplash contributor',
          imageSourceUrl: activity.imageUrl,
        },
      });
      activityCount++;
    }
  }
  console.log(`✅ Created ${activityCount} activities`);

  // Create a sample trip for the demo user
  const now = new Date();
  const tripStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const tripEnd = new Date(now.getFullYear(), now.getMonth() + 1, 14);

  const sampleTrip = await prisma.trip.create({
    data: {
      name: `European Adventure ${tripStart.getFullYear()}`,
      description: 'A two-week journey through the most beautiful cities in Europe — from the romance of Paris to the history of Rome.',
      startDate: tripStart,
      endDate: tripEnd,
      budget: 5000,
      isPublic: true,
      publicId: 'demo-europe-trip',
      userId: demoUser.id,
      coverImage: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=800',
    },
  });

  // Add stops
  const parisStop = await prisma.tripStop.create({
    data: {
      tripId: sampleTrip.id,
      cityId: createdCities['Paris'].id,
      startDate: tripStart,
      endDate: new Date(tripStart.getTime() + 4 * 24 * 60 * 60 * 1000),
      order: 0,
      notes: 'Start the trip in the City of Light!',
    },
  });

  const barcelonaStop = await prisma.tripStop.create({
    data: {
      tripId: sampleTrip.id,
      cityId: createdCities['Barcelona'].id,
      startDate: new Date(tripStart.getTime() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(tripStart.getTime() + 8 * 24 * 60 * 60 * 1000),
      order: 1,
      notes: 'Sun, beach, and Gaudí architecture.',
    },
  });

  const romeStop = await prisma.tripStop.create({
    data: {
      tripId: sampleTrip.id,
      cityId: createdCities['Rome'].id,
      startDate: new Date(tripStart.getTime() + 9 * 24 * 60 * 60 * 1000),
      endDate: tripEnd,
      order: 2,
      notes: 'End with ancient history and amazing food.',
    },
  });

  // Add activities to stops
  const parisActivities = await prisma.activity.findMany({
    where: { cityId: createdCities['Paris'].id },
    take: 3,
  });

  for (let i = 0; i < parisActivities.length; i++) {
    await prisma.tripActivity.create({
      data: {
        tripStopId: parisStop.id,
        activityId: parisActivities[i].id,
        date: new Date(tripStart.getTime() + i * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        duration: parisActivities[i].duration,
        cost: parisActivities[i].cost,
        order: i,
      },
    });
  }

  const barcelonaActivities = await prisma.activity.findMany({
    where: { cityId: createdCities['Barcelona'].id },
    take: 2,
  });

  for (let i = 0; i < barcelonaActivities.length; i++) {
    await prisma.tripActivity.create({
      data: {
        tripStopId: barcelonaStop.id,
        activityId: barcelonaActivities[i].id,
        date: new Date(tripStart.getTime() + (5 + i) * 24 * 60 * 60 * 1000),
        startTime: '09:00',
        duration: barcelonaActivities[i].duration,
        cost: barcelonaActivities[i].cost,
        order: i,
      },
    });
  }

  const romeActivities = await prisma.activity.findMany({
    where: { cityId: createdCities['Rome'].id },
    take: 3,
  });

  for (let i = 0; i < romeActivities.length; i++) {
    await prisma.tripActivity.create({
      data: {
        tripStopId: romeStop.id,
        activityId: romeActivities[i].id,
        date: new Date(tripStart.getTime() + (9 + i) * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        duration: romeActivities[i].duration,
        cost: romeActivities[i].cost,
        order: i,
      },
    });
  }

  // Add expenses to sample trip
  const expenseCategories = [
    { category: 'Transport', amount: 450, description: 'Flights and trains', date: tripStart },
    { category: 'Stay', amount: 1200, description: 'Hotels for 14 nights', date: tripStart },
    { category: 'Meals', amount: 600, description: 'Estimated meal budget', date: tripStart },
  ];

  for (const exp of expenseCategories) {
    await prisma.expense.create({
      data: {
        tripId: sampleTrip.id,
        ...exp,
      },
    });
  }

  // Create a second trip
  const asiaStart = new Date(now.getFullYear(), now.getMonth() + 3, 15);
  const asiaEnd = new Date(now.getFullYear(), now.getMonth() + 3, 25);

  await prisma.trip.create({
    data: {
      name: 'Southeast Asia Explorer',
      description: 'Temples, street food, and tropical beaches across Thailand and Bali.',
      startDate: asiaStart,
      endDate: asiaEnd,
      budget: 2500,
      isPublic: false,
      userId: demoUser.id,
      coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    },
  });

  // A locally relevant showcase journey for the demo and judging flow.
  const westStart = new Date(now.getFullYear(), now.getMonth() + 5, 2);
  const westEnd = new Date(now.getFullYear(), now.getMonth() + 5, 10);
  const westernTrip = await prisma.trip.create({
    data: {
      name: 'Western India Design Trail',
      description: 'Stepwells, modernism, palace craft, coastal architecture, and regional food across Gujarat, Rajasthan, and Mumbai.',
      startDate: westStart,
      endDate: westEnd,
      budget: 1800,
      isPublic: true,
      publicId: 'demo-western-india',
      userId: demoUser.id,
      coverImage: createdCities.Ahmedabad.imageUrl,
    },
  });
  const westCities = ['Ahmedabad', 'Udaipur', 'Mumbai'];
  for (let index = 0; index < westCities.length; index++) {
    const cityName = westCities[index];
    const stopStart = new Date(westStart.getTime() + index * 3 * 24 * 60 * 60 * 1000);
    const stopEnd = index === westCities.length - 1 ? westEnd : new Date(stopStart.getTime() + 2 * 24 * 60 * 60 * 1000);
    const stop = await prisma.tripStop.create({
      data: {
        tripId: westernTrip.id,
        cityId: createdCities[cityName].id,
        startDate: stopStart,
        endDate: stopEnd,
        order: index,
        arrivalMode: index === 2 ? 'flight' : 'train',
        arrivalDurationMinutes: index === 0 ? null : index === 1 ? 300 : 85,
        notes: index === 0 ? 'Begin with stepwells, pol houses, and modernist campuses.' : index === 1 ? 'Slow down for lake light and Mewar craft.' : 'Close on the harbour with Art Deco and coastal food.',
      },
    });
    const activities = await prisma.activity.findMany({ where: { cityId: createdCities[cityName].id }, take: 3 });
    for (let activityIndex = 0; activityIndex < activities.length; activityIndex++) {
      await prisma.tripActivity.create({
        data: {
          tripStopId: stop.id,
          activityId: activities[activityIndex].id,
          date: new Date(stopStart.getTime() + activityIndex * 24 * 60 * 60 * 1000),
          startTime: activityIndex === 0 ? '09:00' : '15:00',
          duration: activities[activityIndex].duration,
          cost: activities[activityIndex].cost,
          order: activityIndex,
        },
      });
    }
  }

  // Save some destinations for demo user
  await prisma.savedDestination.createMany({
    data: [
      { userId: demoUser.id, cityId: createdCities['Kyoto'].id },
      { userId: demoUser.id, cityId: createdCities['Santorini'].id },
      { userId: demoUser.id, cityId: createdCities['Maldives'].id },
    ],
  });

  console.log('✅ Created sample trips, activities, and saved destinations');
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Email: demo@globetrotter.com');
  console.log('  Password: password123');
  console.log('');
  console.log('Admin credentials:');
  console.log('  Email: admin@globetrotter.com');
  console.log('  Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
