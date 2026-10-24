import { Room, Guest, Reservation, Payment, StaffMember, HotelSettings, Notification } from '../types';

export const INITIAL_ROOMS: Room[] = [
  { id: 'r1', roomNumber: '101', type: 'Standard', floor: 1, capacity: 2, pricePerNight: 3200, status: 'Available', amenities: ['Wi-Fi', 'Air Conditioning', 'TV'], description: 'Comfortable standard room with courtyard view.' },
  { id: 'r2', roomNumber: '102', type: 'Standard', floor: 1, capacity: 2, pricePerNight: 3200, status: 'Occupied', amenities: ['Wi-Fi', 'Air Conditioning', 'TV'], description: 'Comfortable standard room with city view.' },
  { id: 'r3', roomNumber: '103', type: 'Standard', floor: 1, capacity: 2, pricePerNight: 3200, status: 'Reserved', amenities: ['Wi-Fi', 'Air Conditioning', 'TV'], description: 'Standard single-bed room near reception.' },
  { id: 'r4', roomNumber: '201', type: 'Deluxe', floor: 2, capacity: 2, pricePerNight: 5800, status: 'Available', amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Balcony'], description: 'Elegant deluxe room with private balcony.' },
  { id: 'r5', roomNumber: '202', type: 'Deluxe', floor: 2, capacity: 2, pricePerNight: 5800, status: 'Occupied', amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Balcony', 'Mini Bar'], description: 'Deluxe room with king-size bed and skyline view.' },
  { id: 'r6', roomNumber: '203', type: 'Deluxe', floor: 2, capacity: 3, pricePerNight: 6400, status: 'Available', amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Balcony', 'Mini Bar'], description: 'Spacious deluxe triple room with plush interior.' },
  { id: 'r7', roomNumber: '301', type: 'Suite', floor: 3, capacity: 2, pricePerNight: 14500, status: 'Available', amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Balcony', 'Mini Bar'], description: 'Luxurious executive royal suite with sea view.' },
  { id: 'r8', roomNumber: '302', type: 'Suite', floor: 3, capacity: 4, pricePerNight: 16500, status: 'Occupied', amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Balcony', 'Mini Bar'], description: 'Premium presidential suite with separate living room.' },
  { id: 'r9', roomNumber: '303', type: 'Suite', floor: 3, capacity: 2, pricePerNight: 14500, status: 'Maintenance', amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Balcony', 'Mini Bar'], description: 'Junior royal suite currently under scheduled upkeep.' },
  { id: 'r10', roomNumber: '401', type: 'Family', floor: 4, capacity: 4, pricePerNight: 8200, status: 'Available', amenities: ['Wi-Fi', 'Air Conditioning', 'TV'], description: 'Spacious family room with twin bedrooms.' },
  { id: 'r11', roomNumber: '402', type: 'Family', floor: 4, capacity: 5, pricePerNight: 9500, status: 'Occupied', amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Balcony'], description: 'Large family suite with bunk beds and balcony.' },
  { id: 'r12', roomNumber: '403', type: 'Family', floor: 4, capacity: 4, pricePerNight: 8200, status: 'Available', amenities: ['Wi-Fi', 'Air Conditioning', 'TV'], description: 'Comfortable family room with garden view.' },
  { id: 'r13', roomNumber: '104', type: 'Standard', floor: 1, capacity: 2, pricePerNight: 3200, status: 'Available', amenities: ['Wi-Fi', 'Air Conditioning', 'TV'], description: 'Standard room near elevator.' },
  { id: 'r14', roomNumber: '204', type: 'Deluxe', floor: 2, capacity: 2, pricePerNight: 5800, status: 'Reserved', amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Balcony'], description: 'Deluxe corner room with dual balconies.' },
  { id: 'r15', roomNumber: '304', type: 'Suite', floor: 3, capacity: 2, pricePerNight: 15500, status: 'Available', amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Balcony', 'Mini Bar'], description: 'Imperial heritage suite with luxury bath tub.' },
];

export const INITIAL_GUESTS: Guest[] = [
  { id: 'g1', firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.sharma@gmail.com', phone: '+91 98112 45678', country: 'India', address: '45 Barakhamba Road, Connaught Place, New Delhi', notes: 'Prefers high floor quiet room. Vegetarian breakfast.', status: 'VIP', totalBookings: 5, totalSpent: 96000, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'g2', firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@outlook.com', phone: '+91 98250 87654', country: 'India', address: '12 CG Road, Navrangpura, Ahmedabad, Gujarat', notes: 'Jain food preference.', status: 'Active', totalBookings: 2, totalSpent: 28000, createdAt: '2024-02-20T09:00:00Z' },
  { id: 'g3', firstName: 'Rohan', lastName: 'Verma', email: 'rohan.verma@techcorp.in', phone: '+91 98201 23456', country: 'India', address: '88 Bandra Kurla Complex, Mumbai, Maharashtra', notes: 'Corporate business traveler, late check-in.', status: 'Active', totalBookings: 3, totalSpent: 45000, createdAt: '2024-03-05T11:00:00Z' },
  { id: 'g4', firstName: 'Ananya', lastName: 'Iyer', email: 'ananya.iyer@gmail.com', phone: '+91 97400 34567', country: 'India', address: '104 Indiranagar 100ft Road, Bengaluru, Karnataka', notes: 'Celebrating wedding anniversary.', status: 'VIP', totalBookings: 1, totalSpent: 72000, createdAt: '2024-03-18T14:00:00Z' },
  { id: 'g5', firstName: 'Vikram', lastName: 'Malhotra', email: 'vikram.malhotra@yahoo.co.in', phone: '+91 98140 56789', country: 'India', address: 'Sector 9-C, Madhya Marg, Chandigarh', notes: 'Family vacation with children.', status: 'Active', totalBookings: 4, totalSpent: 54000, createdAt: '2024-04-01T08:00:00Z' },
  { id: 'g6', firstName: 'Sneha', lastName: 'Reddy', email: 'sneha.reddy@gmail.com', phone: '+91 98490 67890', country: 'India', address: 'Banjara Hills Road No. 12, Hyderabad, Telangana', notes: 'Early check-in requested.', status: 'Active', totalBookings: 2, totalSpent: 35000, createdAt: '2024-04-12T15:00:00Z' },
  { id: 'g7', firstName: 'Aditya', lastName: 'Mukherjee', email: 'aditya.mukherjee@tcs.com', phone: '+91 98300 78901', country: 'India', address: 'Park Street, Kolkata, West Bengal', notes: 'Conference delegate.', status: 'Active', totalBookings: 1, totalSpent: 24000, createdAt: '2024-05-07T12:00:00Z' },
  { id: 'g8', firstName: 'Pooja', lastName: 'Nair', email: 'pooja.nair@ayurhotels.com', phone: '+91 94470 89012', country: 'India', address: 'Panampilly Nagar, Kochi, Kerala', notes: 'Requires airport pickup assistance.', status: 'VIP', totalBookings: 6, totalSpent: 115000, createdAt: '2024-01-08T10:00:00Z' },
  { id: 'g9', firstName: 'Rahul', lastName: 'Deshmukh', email: 'rahul.deshmukh@gmail.com', phone: '+91 98500 90123', country: 'India', address: 'FC Road, Shivaji Nagar, Pune, Maharashtra', notes: 'GST invoice required under company name.', status: 'Active', totalBookings: 2, totalSpent: 18500, createdAt: '2024-05-20T09:00:00Z' },
  { id: 'g10', firstName: 'Meera', lastName: 'Joshi', email: 'meera.joshi@heritage.in', phone: '+91 94140 12345', country: 'India', address: 'Civil Lines, C-Scheme, Jaipur, Rajasthan', notes: 'Leisure traveler.', status: 'Active', totalBookings: 3, totalSpent: 42000, createdAt: '2024-06-01T11:00:00Z' },
  { id: 'g11', firstName: 'Siddharth', lastName: 'Gupta', email: 'siddharth.gupta@fintech.in', phone: '+91 99190 23456', country: 'India', address: 'Gomti Nagar, Vibhuti Khand, Lucknow, Uttar Pradesh', notes: 'Requires high-speed Wi-Fi setup.', status: 'Active', totalBookings: 1, totalSpent: 22000, createdAt: '2024-06-15T10:00:00Z' },
  { id: 'g12', firstName: 'Kavita', lastName: 'Menon', email: 'kavita.menon@chennaitech.org', phone: '+91 98400 34567', country: 'India', address: 'Anna Nagar West, Chennai, Tamil Nadu', notes: 'Extra bedding for children.', status: 'Active', totalBookings: 2, totalSpent: 38000, createdAt: '2024-07-02T13:00:00Z' },
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res1', bookingId: 'BK-2024-001', guestId: 'g1', guestName: 'Aarav Sharma', guestEmail: 'aarav.sharma@gmail.com', guestPhone: '+91 98112 45678',
    roomId: 'r8', roomNumber: '302', roomType: 'Suite', checkIn: '2026-10-24', checkOut: '2026-10-27', adults: 2, children: 0,
    pricePerNight: 16500, nights: 3, totalAmount: 49500, paymentStatus: 'Paid', bookingStatus: 'Checked In', notes: 'VIP guest, welcome garland & refreshments.', createdAt: '2026-10-20T10:00:00Z'
  },
  {
    id: 'res2', bookingId: 'BK-2024-002', guestId: 'g2', guestName: 'Priya Patel', guestEmail: 'priya.patel@outlook.com', guestPhone: '+91 98250 87654',
    roomId: 'r4', roomNumber: '201', roomType: 'Deluxe', checkIn: '2026-10-24', checkOut: '2026-10-26', adults: 2, children: 0,
    pricePerNight: 5800, nights: 2, totalAmount: 11600, paymentStatus: 'Paid', bookingStatus: 'Confirmed', notes: 'Jain meals requested.', createdAt: '2026-10-18T14:00:00Z'
  },
  {
    id: 'res3', bookingId: 'BK-2024-003', guestId: 'g3', guestName: 'Rohan Verma', guestEmail: 'rohan.verma@techcorp.in', guestPhone: '+91 98201 23456',
    roomId: 'r5', roomNumber: '202', roomType: 'Deluxe', checkIn: '2026-10-22', checkOut: '2026-10-25', adults: 2, children: 1,
    pricePerNight: 5800, nights: 3, totalAmount: 17400, paymentStatus: 'Partial', bookingStatus: 'Checked In', notes: 'Late checkout requested.', createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'res4', bookingId: 'BK-2024-004', guestId: 'g4', guestName: 'Ananya Iyer', guestEmail: 'ananya.iyer@gmail.com', guestPhone: '+91 97400 34567',
    roomId: 'r7', roomNumber: '301', roomType: 'Suite', checkIn: '2026-10-25', checkOut: '2026-10-27', adults: 2, children: 0,
    pricePerNight: 14500, nights: 2, totalAmount: 29000, paymentStatus: 'Unpaid', bookingStatus: 'Confirmed', notes: 'Anniversary cake on arrival.', createdAt: '2026-10-19T11:00:00Z'
  },
  {
    id: 'res5', bookingId: 'BK-2024-005', guestId: 'g5', guestName: 'Vikram Malhotra', guestEmail: 'vikram.malhotra@yahoo.co.in', guestPhone: '+91 98140 56789',
    roomId: 'r11', roomNumber: '402', roomType: 'Family', checkIn: '2026-10-20', checkOut: '2026-10-24', adults: 2, children: 2,
    pricePerNight: 9500, nights: 4, totalAmount: 38000, paymentStatus: 'Paid', bookingStatus: 'Checked In', notes: 'Luggage assistance required.', createdAt: '2026-10-10T08:00:00Z'
  },
  {
    id: 'res6', bookingId: 'BK-2024-006', guestId: 'g6', guestName: 'Sneha Reddy', guestEmail: 'sneha.reddy@gmail.com', guestPhone: '+91 98490 67890',
    roomId: 'r1', roomNumber: '101', roomType: 'Standard', checkIn: '2026-10-26', checkOut: '2026-10-28', adults: 1, children: 0,
    pricePerNight: 3200, nights: 2, totalAmount: 6400, paymentStatus: 'Paid', bookingStatus: 'Confirmed', notes: 'Early morning taxi booking.', createdAt: '2026-10-21T15:00:00Z'
  },
  {
    id: 'res7', bookingId: 'BK-2024-007', guestId: 'g8', guestName: 'Pooja Nair', guestEmail: 'pooja.nair@ayurhotels.com', guestPhone: '+91 94470 89012',
    roomId: 'r15', roomNumber: '304', roomType: 'Suite', checkIn: '2026-10-24', checkOut: '2026-10-30', adults: 2, children: 0,
    pricePerNight: 15500, nights: 6, totalAmount: 93000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', notes: 'VIP guest from Kerala Tourism.', createdAt: '2026-10-12T10:00:00Z'
  },
  {
    id: 'res8', bookingId: 'BK-2024-008', guestId: 'g9', guestName: 'Rahul Deshmukh', guestEmail: 'rahul.deshmukh@gmail.com', guestPhone: '+91 98500 90123',
    roomId: 'r13', roomNumber: '104', roomType: 'Standard', checkIn: '2026-10-18', checkOut: '2026-10-21', adults: 1, children: 0,
    pricePerNight: 3200, nights: 3, totalAmount: 9600, paymentStatus: 'Paid', bookingStatus: 'Checked Out', notes: 'Invoiced with GST.', createdAt: '2026-10-05T09:00:00Z'
  },
  {
    id: 'res9', bookingId: 'BK-2024-009', guestId: 'g10', guestName: 'Meera Joshi', guestEmail: 'meera.joshi@heritage.in', guestPhone: '+91 94140 12345',
    roomId: 'r6', roomNumber: '203', roomType: 'Deluxe', checkIn: '2026-10-27', checkOut: '2026-10-30', adults: 1, children: 0,
    pricePerNight: 6400, nights: 3, totalAmount: 19200, paymentStatus: 'Unpaid', bookingStatus: 'Pending', notes: 'Leisure stay.', createdAt: '2026-10-22T11:00:00Z'
  },
  {
    id: 'res10', bookingId: 'BK-2024-010', guestId: 'g12', guestName: 'Kavita Menon', guestEmail: 'kavita.menon@chennaitech.org', guestPhone: '+91 98400 34567',
    roomId: 'r10', roomNumber: '401', roomType: 'Family', checkIn: '2026-10-28', checkOut: '2026-11-01', adults: 2, children: 2,
    pricePerNight: 8200, nights: 4, totalAmount: 32800, paymentStatus: 'Partial', bookingStatus: 'Confirmed', notes: 'Advance paid, balance on arrival.', createdAt: '2026-10-23T08:00:00Z'
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', paymentId: 'PAY-001', bookingId: 'BK-2024-001', reservationId: 'res1', guestId: 'g1', guestName: 'Aarav Sharma', date: '2026-10-20', method: 'Card', amount: 49500, status: 'Paid', notes: 'Full payment via HDFC Credit Card.' },
  { id: 'p2', paymentId: 'PAY-002', bookingId: 'BK-2024-002', reservationId: 'res2', guestId: 'g2', guestName: 'Priya Patel', date: '2026-10-18', method: 'Bank Transfer', amount: 11600, status: 'Paid', notes: 'NEFT transfer confirmed.' },
  { id: 'p3', paymentId: 'PAY-003', bookingId: 'BK-2024-003', reservationId: 'res3', guestId: 'g3', guestName: 'Rohan Verma', date: '2026-10-15', method: 'Cash', amount: 10000, status: 'Partial', notes: 'Remaining ₹7,400 due on checkout.' },
  { id: 'p4', paymentId: 'PAY-004', bookingId: 'BK-2024-005', reservationId: 'res5', guestId: 'g5', guestName: 'Vikram Malhotra', date: '2026-10-10', method: 'Card', amount: 38000, status: 'Paid', notes: 'UPI payment via Google Pay.' },
  { id: 'p5', paymentId: 'PAY-005', bookingId: 'BK-2024-006', reservationId: 'res6', guestId: 'g6', guestName: 'Sneha Reddy', date: '2026-10-21', method: 'Card', amount: 6400, status: 'Paid', notes: 'Card transaction settled.' },
  { id: 'p6', paymentId: 'PAY-006', bookingId: 'BK-2024-007', reservationId: 'res7', guestId: 'g8', guestName: 'Pooja Nair', date: '2026-10-12', method: 'Bank Transfer', amount: 93000, status: 'Paid', notes: 'RTGS corporate booking payment.' },
  { id: 'p7', paymentId: 'PAY-007', bookingId: 'BK-2024-008', reservationId: 'res8', guestId: 'g9', guestName: 'Rahul Deshmukh', date: '2026-10-21', method: 'Cash', amount: 9600, status: 'Paid', notes: 'Paid on checkout in cash with GST receipt.' },
  { id: 'p8', paymentId: 'PAY-008', bookingId: 'BK-2024-010', reservationId: 'res10', guestId: 'g12', guestName: 'Kavita Menon', date: '2026-10-23', method: 'Card', amount: 15000, status: 'Partial', notes: 'Advance deposit paid via UPI.' },
  { id: 'p9', paymentId: 'PAY-009', bookingId: 'BK-2024-004', reservationId: 'res4', guestId: 'g4', guestName: 'Ananya Iyer', date: '2026-10-19', method: 'Card', amount: 0, status: 'Unpaid', notes: 'Pay at hotel on check-in.' },
  { id: 'p10', paymentId: 'PAY-010', bookingId: 'BK-2023-099', reservationId: 'res_old', guestId: 'g1', guestName: 'Aarav Sharma', date: '2026-09-15', method: 'Card', amount: 18500, status: 'Refunded', notes: 'Refund processed to source account due to trip cancellation.' },
];

export const INITIAL_STAFF: StaffMember[] = [
  { id: 's1', employeeId: 'EMP-001', firstName: 'Rajeshwar', lastName: 'Rao', role: 'Administrator', email: 'rajeshwar.rao@grandstay.in', phone: '+91 98200 11001', joiningDate: '2020-03-15', status: 'Active', department: 'Management' },
  { id: 's2', employeeId: 'EMP-002', firstName: 'Sunita', lastName: 'Kapoor', role: 'Manager', email: 'sunita.kapoor@grandstay.in', phone: '+91 98200 11002', joiningDate: '2021-06-01', status: 'Active', department: 'Operations' },
  { id: 's3', employeeId: 'EMP-003', firstName: 'Amit', lastName: 'Singhania', role: 'Receptionist', email: 'amit.singhania@grandstay.in', phone: '+91 98200 11003', joiningDate: '2022-01-10', status: 'Active', department: 'Front Desk' },
  { id: 's4', employeeId: 'EMP-004', firstName: 'Neha', lastName: 'Chauhan', role: 'Receptionist', email: 'neha.chauhan@grandstay.in', phone: '+91 98200 11004', joiningDate: '2022-04-15', status: 'Active', department: 'Front Desk' },
  { id: 's5', employeeId: 'EMP-005', firstName: 'Ramesh', lastName: 'Kumar', role: 'Housekeeping', email: 'ramesh.kumar@grandstay.in', phone: '+91 98200 11005', joiningDate: '2023-02-20', status: 'Active', department: 'Housekeeping' },
  { id: 's6', employeeId: 'EMP-006', firstName: 'Lakshmi', lastName: 'Devi', role: 'Housekeeping', email: 'lakshmi.devi@grandstay.in', phone: '+91 98200 11006', joiningDate: '2023-05-10', status: 'On Leave', department: 'Housekeeping' },
  { id: 's7', employeeId: 'EMP-007', firstName: 'Manoj', lastName: 'Tiwari', role: 'Maintenance', email: 'manoj.tiwari@grandstay.in', phone: '+91 98200 11007', joiningDate: '2021-11-01', status: 'Active', department: 'Maintenance' },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'reservation', title: 'New Reservation', message: 'Pooja Nair booked Heritage Suite 304 for 6 nights.', timestamp: '2026-10-24T08:30:00Z', read: false },
  { id: 'n2', type: 'checkin', title: 'Upcoming Check-in', message: 'Aarav Sharma is scheduled to check in today (Suite 302).', timestamp: '2026-10-24T08:00:00Z', read: false },
  { id: 'n3', type: 'payment', title: 'Pending Payment', message: 'Ananya Iyer has an outstanding payment of ₹29,000 for booking BK-2024-004.', timestamp: '2026-10-24T07:45:00Z', read: false },
  { id: 'n4', type: 'checkout', title: 'Scheduled Check-out', message: 'Vikram Malhotra (Family Suite 402) is checking out today.', timestamp: '2026-10-24T07:00:00Z', read: true },
  { id: 'n5', type: 'reservation', title: 'New Reservation', message: 'Meera Joshi booked Deluxe 203 for 3 nights.', timestamp: '2026-10-23T16:20:00Z', read: true },
];

export const INITIAL_SETTINGS: HotelSettings = {
  name: 'The GrandStay Palace Hotel',
  address: 'Plot 42, Marine Drive, Nariman Point, Mumbai, Maharashtra 400021',
  email: 'reservations@grandstay.in',
  phone: '+91 (022) 6655 4321',
  currency: 'INR',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  taxPercentage: 18,
  invoiceFooter: 'Thank you for choosing The GrandStay Palace Hotel. Atithi Devo Bhava!',
  notifications: { newReservation: true, checkIn: true, checkOut: true, payment: true },
  appearance: { theme: 'light', sidebarCollapsed: false },
  /*
  googleSheets: {
    enabled: true,
    webAppUrl: 'https://script.google.com/macros/s/AKfycbyicYFflyZ2pmihY4cqGz339zoa1zfXVGYqm775bSeQ106p0n_E4_2CWG4v_tzZ8VHBYg/exec',
    spreadsheetId: '1lC114sOdG_OCAaTQi6sWCkMonWINXdEpkmnfYfqC8tw',
    autoSync: true,
    lastSyncedAt: '',
  },
  */
  supabase: {
    enabled: true,
    url: 'https://ykrwarvqrpxndkgyswiv.supabase.co',
    anonKey: '',
    connectionString: '',
    host: 'db.ykrwarvqrpxndkgyswiv.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    autoSync: true,
    lastSyncedAt: '',
  },
};

export const MONTHLY_REVENUE_DATA = [
  { month: 'Jan', revenue: 2450000, occupancy: 72 },
  { month: 'Feb', revenue: 2180000, occupancy: 68 },
  { month: 'Mar', revenue: 2840000, occupancy: 78 },
  { month: 'Apr', revenue: 2950000, occupancy: 82 },
  { month: 'May', revenue: 3100000, occupancy: 86 },
  { month: 'Jun', revenue: 2750000, occupancy: 75 },
  { month: 'Jul', revenue: 2600000, occupancy: 70 },
  { month: 'Aug', revenue: 2800000, occupancy: 76 },
  { month: 'Sep', revenue: 2980000, occupancy: 81 },
  { month: 'Oct', revenue: 3450000, occupancy: 91 },
  { month: 'Nov', revenue: 3600000, occupancy: 94 },
  { month: 'Dec', revenue: 4200000, occupancy: 98 },
];
