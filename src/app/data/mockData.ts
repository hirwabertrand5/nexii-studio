// Mock data for NEXii platform

export interface HousePlan {
  id: string;
  name: string;
  category: string;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  area: number;
  plotSize: string;
  price: number;
  image: string;
  images: string[];
  description: string;
  features: string[];
  filesIncluded: string[];
  style: string;
}

export interface Order {
  id: string;
  planId: string;
  planName: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

export interface CustomRequest {
  id: string;
  customerName: string;
  email: string;
  country: string;
  plotSize: string;
  bedrooms: number;
  budget: string;
  description: string;
  status: 'pending' | 'quoted' | 'accepted' | 'rejected';
  date: string;
  quote?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  registeredDate: string;
  totalPurchases: number;
  status: 'active' | 'disabled';
}

export const housePlans: HousePlan[] = [
  {
    id: '1',
    name: 'Modern African Villa',
    category: 'Modern Villa',
    bedrooms: 4,
    bathrooms: 3,
    floors: 2,
    area: 350,
    plotSize: '20m x 30m',
    price: 45000,
    image: 'modern-villa-african',
    images: ['modern-villa-african', 'modern-villa-african', 'modern-villa-african'],
    description: 'A stunning modern villa designed for African climate with spacious rooms, natural ventilation, and contemporary aesthetics.',
    features: [
      'Open plan living area',
      'Master bedroom with ensuite',
      'Covered outdoor patio',
      'Modern kitchen',
      'Parking for 2 cars',
      'Solar panel ready',
    ],
    filesIncluded: [
      'Architectural Floor Plans (PDF)',
      'AutoCAD Drawings (DWG)',
      'Structural Drawings',
      '3D Renderings',
      'Material Specifications',
      'Bill of Quantities',
    ],
    style: 'African Contemporary',
  },
  {
    id: '2',
    name: 'Compact Bungalow',
    category: 'Bungalow',
    bedrooms: 3,
    bathrooms: 2,
    floors: 1,
    area: 180,
    plotSize: '15m x 20m',
    price: 28000,
    image: 'compact-bungalow',
    images: ['compact-bungalow', 'compact-bungalow', 'compact-bungalow'],
    description: 'Perfect for small plots, this efficient bungalow design maximizes space while maintaining comfort and style.',
    features: [
      'Efficient space utilization',
      'All bedrooms ensuite',
      'Open kitchen and dining',
      'Front porch',
      'Single car garage',
    ],
    filesIncluded: [
      'Architectural Floor Plans (PDF)',
      'AutoCAD Drawings (DWG)',
      'Structural Drawings',
      'Material Specifications',
    ],
    style: 'Contemporary',
  },
  {
    id: '3',
    name: 'Luxury Duplex',
    category: 'Duplex',
    bedrooms: 5,
    bathrooms: 4,
    floors: 2,
    area: 450,
    plotSize: '25m x 30m',
    price: 65000,
    image: 'luxury-duplex',
    images: ['luxury-duplex', 'luxury-duplex', 'luxury-duplex'],
    description: 'An elegant duplex with luxurious finishes, perfect for growing families seeking premium living spaces.',
    features: [
      'Double-height entrance',
      'Study room',
      'Home theater room',
      'Guest bedroom downstairs',
      'Balcony',
      'Double garage',
    ],
    filesIncluded: [
      'Architectural Floor Plans (PDF)',
      'AutoCAD Drawings (DWG)',
      'Structural Drawings',
      '3D Renderings',
      'Material Specifications',
      'Bill of Quantities',
      'Electrical Plans',
      'Plumbing Plans',
    ],
    style: 'Modern',
  },
  {
    id: '4',
    name: 'Small Plot Home',
    category: 'Small Plot Homes',
    bedrooms: 2,
    bathrooms: 2,
    floors: 2,
    area: 120,
    plotSize: '10m x 15m',
    price: 18500,
    image: 'small-plot-home',
    images: ['small-plot-home', 'small-plot-home', 'small-plot-home'],
    description: 'Ideal for urban settings with limited space. Smart design that feels spacious despite compact footprint.',
    features: [
      'Vertical design',
      'Rooftop terrace',
      'Modern finishes',
      'Built-in storage',
    ],
    filesIncluded: [
      'Architectural Floor Plans (PDF)',
      'AutoCAD Drawings (DWG)',
      'Structural Drawings',
    ],
    style: 'Modern',
  },
  {
    id: '5',
    name: 'Contemporary Family Home',
    category: 'African Contemporary',
    bedrooms: 4,
    bathrooms: 3,
    floors: 1,
    area: 280,
    plotSize: '18m x 25m',
    price: 38000,
    image: 'contemporary-family',
    images: ['contemporary-family', 'contemporary-family', 'contemporary-family'],
    description: 'A single-story contemporary design blending African architectural elements with modern comfort.',
    features: [
      'Courtyard design',
      'Natural lighting',
      'Indoor-outdoor flow',
      'Covered veranda',
      'Staff quarters',
    ],
    filesIncluded: [
      'Architectural Floor Plans (PDF)',
      'AutoCAD Drawings (DWG)',
      'Structural Drawings',
      '3D Renderings',
      'Material Specifications',
      'Bill of Quantities',
    ],
    style: 'African Contemporary',
  },
  {
    id: '6',
    name: 'Executive Mansion',
    category: 'Modern Villa',
    bedrooms: 6,
    bathrooms: 5,
    floors: 2,
    area: 580,
    plotSize: '30m x 35m',
    price: 95000,
    image: 'executive-mansion',
    images: ['executive-mansion', 'executive-mansion', 'executive-mansion'],
    description: 'A grand mansion designed for luxury living with premium amenities and spacious layouts.',
    features: [
      'Grand entrance hall',
      'Cinema room',
      'Gym',
      'Wine cellar',
      'Staff quarters',
      'Triple garage',
      'Swimming pool layout',
    ],
    filesIncluded: [
      'Architectural Floor Plans (PDF)',
      'AutoCAD Drawings (DWG)',
      'Structural Drawings',
      '3D Renderings',
      'Material Specifications',
      'Bill of Quantities',
      'Electrical Plans',
      'Plumbing Plans',
      'Landscaping Plans',
    ],
    style: 'Modern',
  },
];

export const orders: Order[] = [
  {
    id: 'ORD001',
    planId: '1',
    planName: 'Modern African Villa',
    customerName: 'Kwame Mensah',
    customerEmail: 'kwame.mensah@email.com',
    amount: 45000,
    paymentMethod: 'Mobile Money',
    status: 'completed',
    date: '2026-03-08',
  },
  {
    id: 'ORD002',
    planId: '2',
    planName: 'Compact Bungalow',
    customerName: 'Amara Okafor',
    customerEmail: 'amara.okafor@email.com',
    amount: 28000,
    paymentMethod: 'Flutterwave',
    status: 'completed',
    date: '2026-03-07',
  },
  {
    id: 'ORD003',
    planId: '3',
    planName: 'Luxury Duplex',
    customerName: 'Tendai Moyo',
    customerEmail: 'tendai.moyo@email.com',
    amount: 65000,
    paymentMethod: 'Bank Transfer',
    status: 'pending',
    date: '2026-03-09',
  },
];

export const customRequests: CustomRequest[] = [
  {
    id: 'REQ001',
    customerName: 'Fatima Hassan',
    email: 'fatima.hassan@email.com',
    country: 'Nigeria',
    plotSize: '20m x 25m',
    bedrooms: 4,
    budget: 'RWF40,000 - RWF50,000',
    description: 'Looking for a modern 4-bedroom home with traditional Nigerian architectural elements.',
    status: 'quoted',
    date: '2026-03-05',
    quote: 47000,
  },
  {
    id: 'REQ002',
    customerName: 'John Kamau',
    email: 'john.kamau@email.com',
    country: 'Kenya',
    plotSize: '15m x 20m',
    bedrooms: 3,
    budget: 'RWF25,000 - RWF35,000',
    description: 'Need a compact design for a small plot in Nairobi. Must include parking.',
    status: 'pending',
    date: '2026-03-08',
  },
  {
    id: 'REQ003',
    customerName: 'Zola Dlamini',
    email: 'zola.dlamini@email.com',
    country: 'South Africa',
    plotSize: '25m x 30m',
    bedrooms: 5,
    budget: 'RWF60,000+',
    description: 'Luxury home with entertainment areas and home office.',
    status: 'accepted',
    date: '2026-03-01',
    quote: 68000,
  },
];

export const users: User[] = [
  {
    id: 'USR001',
    name: 'Kwame Mensah',
    email: 'kwame.mensah@email.com',
    country: 'Ghana',
    registeredDate: '2026-02-15',
    totalPurchases: 1,
    status: 'active',
  },
  {
    id: 'USR002',
    name: 'Amara Okafor',
    email: 'amara.okafor@email.com',
    country: 'Nigeria',
    registeredDate: '2026-02-20',
    totalPurchases: 2,
    status: 'active',
  },
  {
    id: 'USR003',
    name: 'Tendai Moyo',
    email: 'tendai.moyo@email.com',
    country: 'Zimbabwe',
    registeredDate: '2026-03-01',
    totalPurchases: 1,
    status: 'active',
  },
];

export const categories = [
  'All Plans',
  'Bungalow',
  'Duplex',
  'Modern Villa',
  'Small Plot Homes',
  'African Contemporary',
];

export const africanCountries = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'Tanzania',
  'Uganda',
  'Rwanda',
  'Ethiopia',
  'Cameroon',
  'Ivory Coast',
  'Senegal',
  'Zimbabwe',
  'Zambia',
  'Botswana',
  'Namibia',
  'Morocco',
  'Egypt',
  'Algeria',
  'Tunisia',
];
