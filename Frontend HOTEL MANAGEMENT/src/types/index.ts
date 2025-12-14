// Room Types
export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
export type RoomType = 'single' | 'double' | 'suite' | 'deluxe';

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  price: number;
  status: RoomStatus;
  floor: number;
  capacity: number;
  features: string[];
  currentGuest?: string;
}

// Staff Types
export type StaffRole = 'manager' | 'receptionist' | 'housekeeping' | 'maintenance' | 'room-service' | 'customer';
export type ShiftType = 'morning' | 'afternoon' | 'night';

export interface Staff {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: StaffRole;
  shift: ShiftType;
  salary: number;
  hireDate: string;
  isActive: boolean;
}

// Guest Types
export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  address: string;
  reservationId?: string;
  isPrimaryGuest: boolean;
  isActive: boolean;
  // Legacy fields kept for display if needed, but should come from Reservation
  checkInDate?: string;
  checkOutDate?: string;
  roomId?: string;
  totalSpent: number;
  visits: number;
}

// Reservation Types
export type ReservationStatus = 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';

export interface AdditionalGuest {
  name: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
}

export interface CreateReservationPayload {
  roomId: string;
  checkInDate: string; // ISO string
  checkOutDate: string; // ISO string
  numberOfGuests: number;
  totalAmount: number;
  paidAmount?: number;
  paymentMethod: string;
  specialRequests?: string;
  primaryGuestName: string;
  primaryGuestEmail: string;
  primaryGuestPhone: string;
  primaryGuestIdNumber: string;
  primaryGuestAddress: string;
  additionalGuests: AdditionalGuest[];
}

export interface Reservation {
  id: string;
  guestId: string; // Primary Guest ID
  roomId: string; // Room ID
  checkInDate: string;
  checkOutDate: string;
  actualCheckOutDate?: string;
  numberOfGuests: number;
  totalPrice: number; // Legacy, use totalAmount
  totalAmount: number;
  paidAmount: number;
  isPaid: boolean;
  paymentDate?: string;
  paymentMethod: string;
  status: ReservationStatus;
  specialRequests?: string;
  createdAt: string;
  updatedAt?: string;
  guests: Guest[];
}

export interface CheckOutResult {
  success: boolean;
  message: string;
  requiresPayment: boolean;
  remainingAmount: number;
}

// Maintenance Types
export type MaintenanceStatus = 'pending' | 'in-progress' | 'completed';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MaintenanceRequest {
  id: string;
  roomId: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedBy: string;
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
}

// Room Service Types
export type OrderStatus = 'pending' | 'preparing' | 'delivered' | 'cancelled';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
  image?: string;
}

export interface RoomServiceOrder {
  id: string;
  roomId: string;
  items: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }[];
  totalPrice: number;
  status: OrderStatus;
  orderedAt: string;
  deliveredAt?: string;
}

// Inventory Types
export type InventoryCategory = 'cleaning' | 'food' | 'beverages' | 'toiletries' | 'linens' | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minQuantity: number;
  pricePerUnit: number;
  supplier?: string;
  lastRestocked?: string;
}

// User/Auth Types
export interface User {
  id: string;
  userName: string;
  email: string;
  role: StaffRole;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  isActive: boolean;
  themePreference: string;
  roomNumber?: string; // Müşteriler için oda numarası
}

export interface LoginCredentials {
  userName: string;
  password: string;
}

// Calendar/Timeline Types
export interface CalendarEvent {
  id: string;
  roomId: string;
  guestName: string;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
}

// AI Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Theme Types
export type ThemeMode = 'light' | 'dark';
