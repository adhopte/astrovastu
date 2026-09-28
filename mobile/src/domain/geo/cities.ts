/** Offline fallback gazetteer so kundali creation works even without the geocoding API. */
export interface Place {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

const IN = (name: string, admin1: string, latitude: number, longitude: number): Place => ({ name, admin1, country: "India", latitude, longitude, timezone: "Asia/Kolkata" });

export const CITIES: Place[] = [
  IN("Mumbai", "Maharashtra", 19.076, 72.8777), IN("Pune", "Maharashtra", 18.5204, 73.8567), IN("Nagpur", "Maharashtra", 21.1458, 79.0882),
  IN("Nashik", "Maharashtra", 19.9975, 73.7898), IN("Aurangabad (Chhatrapati Sambhajinagar)", "Maharashtra", 19.8762, 75.3433), IN("Kolhapur", "Maharashtra", 16.705, 74.2433),
  IN("Solapur", "Maharashtra", 17.6599, 75.9064), IN("Thane", "Maharashtra", 19.2183, 72.9781), IN("Amravati", "Maharashtra", 20.9374, 77.7796),
  IN("Nanded", "Maharashtra", 19.1383, 77.321), IN("Sangli", "Maharashtra", 16.8524, 74.5815), IN("Satara", "Maharashtra", 17.6805, 74.0183),
  IN("Ratnagiri", "Maharashtra", 16.9902, 73.312), IN("Jalgaon", "Maharashtra", 21.0077, 75.5626), IN("Ahmednagar (Ahilyanagar)", "Maharashtra", 19.0948, 74.748),
  IN("Latur", "Maharashtra", 18.4088, 76.5604), IN("Akola", "Maharashtra", 20.7002, 77.0082), IN("Nashik Road", "Maharashtra", 19.9504, 73.8347),
  IN("New Delhi", "Delhi", 28.6139, 77.209), IN("Bengaluru", "Karnataka", 12.9716, 77.5946), IN("Chennai", "Tamil Nadu", 13.0827, 80.2707),
  IN("Kolkata", "West Bengal", 22.5726, 88.3639), IN("Hyderabad", "Telangana", 17.385, 78.4867), IN("Ahmedabad", "Gujarat", 23.0225, 72.5714),
  IN("Surat", "Gujarat", 21.1702, 72.8311), IN("Vadodara", "Gujarat", 22.3072, 73.1812), IN("Jaipur", "Rajasthan", 26.9124, 75.7873),
  IN("Udaipur", "Rajasthan", 24.5854, 73.7125), IN("Jodhpur", "Rajasthan", 26.2389, 73.0243), IN("Lucknow", "Uttar Pradesh", 26.8467, 80.9462),
  IN("Kanpur", "Uttar Pradesh", 26.4499, 80.3319), IN("Varanasi", "Uttar Pradesh", 25.3176, 82.9739), IN("Prayagraj", "Uttar Pradesh", 25.4358, 81.8463),
  IN("Ayodhya", "Uttar Pradesh", 26.7922, 82.1998), IN("Mathura", "Uttar Pradesh", 27.4924, 77.6737), IN("Agra", "Uttar Pradesh", 27.1767, 78.0081),
  IN("Haridwar", "Uttarakhand", 29.9457, 78.1642), IN("Rishikesh", "Uttarakhand", 30.0869, 78.2676), IN("Dehradun", "Uttarakhand", 30.3165, 78.0322),
  IN("Bhopal", "Madhya Pradesh", 23.2599, 77.4126), IN("Indore", "Madhya Pradesh", 22.7196, 75.8577), IN("Ujjain", "Madhya Pradesh", 23.1765, 75.7885),
  IN("Gwalior", "Madhya Pradesh", 26.2183, 78.1828), IN("Jabalpur", "Madhya Pradesh", 23.1815, 79.9864), IN("Raipur", "Chhattisgarh", 21.2514, 81.6296),
  IN("Patna", "Bihar", 25.5941, 85.1376), IN("Gaya", "Bihar", 24.7914, 85.0002), IN("Ranchi", "Jharkhand", 23.3441, 85.3096),
  IN("Bhubaneswar", "Odisha", 20.2961, 85.8245), IN("Puri", "Odisha", 19.8135, 85.8312), IN("Guwahati", "Assam", 26.1445, 91.7362),
  IN("Chandigarh", "Chandigarh", 30.7333, 76.7794), IN("Amritsar", "Punjab", 31.634, 74.8723), IN("Ludhiana", "Punjab", 30.901, 75.8573),
  IN("Shimla", "Himachal Pradesh", 31.1048, 77.1734), IN("Jammu", "Jammu and Kashmir", 32.7266, 74.857), IN("Srinagar", "Jammu and Kashmir", 34.0837, 74.7973),
  IN("Goa (Panaji)", "Goa", 15.4909, 73.8278), IN("Mangaluru", "Karnataka", 12.9141, 74.856), IN("Mysuru", "Karnataka", 12.2958, 76.6394),
  IN("Hubballi", "Karnataka", 15.3647, 75.124), IN("Belagavi", "Karnataka", 15.8497, 74.4977), IN("Kochi", "Kerala", 9.9312, 76.2673),
  IN("Thiruvananthapuram", "Kerala", 8.5241, 76.9366), IN("Madurai", "Tamil Nadu", 9.9252, 78.1198), IN("Coimbatore", "Tamil Nadu", 11.0168, 76.9558),
  IN("Tirupati", "Andhra Pradesh", 13.6288, 79.4192), IN("Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185), IN("Vijayawada", "Andhra Pradesh", 16.5062, 80.648),
  { name: "Kathmandu", country: "Nepal", latitude: 27.7172, longitude: 85.324, timezone: "Asia/Kathmandu" },
  { name: "Dubai", country: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708, timezone: "Asia/Dubai" },
  { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, timezone: "Asia/Singapore" },
  { name: "London", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278, timezone: "Europe/London" },
  { name: "New York", admin1: "New York", country: "United States", latitude: 40.7128, longitude: -74.006, timezone: "America/New_York" },
  { name: "San Francisco", admin1: "California", country: "United States", latitude: 37.7749, longitude: -122.4194, timezone: "America/Los_Angeles" },
  { name: "Toronto", admin1: "Ontario", country: "Canada", latitude: 43.6532, longitude: -79.3832, timezone: "America/Toronto" },
  { name: "Sydney", admin1: "New South Wales", country: "Australia", latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney" },
];
