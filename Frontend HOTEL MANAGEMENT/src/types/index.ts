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

// ─── Payment Types ────────────────────────────────────────────────────────────
export type PaymentStatus = 'Pending' | 'Completed' | 'PartiallyPaid' | 'Refunded' | 'Failed';
export type PaymentMethod = 'Cash' | 'CreditCard' | 'DebitCard' | 'BankTransfer' | 'Online';
export type PaymentType = 'Reservation' | 'RoomService' | 'Deposit' | 'Refund' | 'AdditionalCharge';

export interface Payment {
  id: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  type: PaymentType;
  referenceNumber?: string;
  notes?: string;
  paidAt: string;
  createdAt: string;
}

export interface CreatePaymentPayload {
  reservationId: string;
  amount: number;
  method: string;
  type?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface ReservationPaymentSummary {
  reservationId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isPaid: boolean;
  payments: Payment[];
}

// ─── Invoice Types ────────────────────────────────────────────────────────────
export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Cancelled';

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serviceDate: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  guestEmail?: string;
  billingAddress?: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount: number;
  roomCharges: number;
  roomServiceCharges: number;
  otherCharges: number;
  discount: number;
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  notes?: string;
  issuedAt: string;
  paidAt?: string;
  createdAt: string;
  lineItems: InvoiceLineItem[];
}

export interface GenerateInvoicePayload {
  reservationId: string;
  discount?: number;
  notes?: string;
  billingAddress?: string;
}

// ─── Reporting Types ──────────────────────────────────────────────────────────
export interface DashboardSummary {
  date: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  pendingReservations: number;
  todayRevenue: number;
  monthRevenue: number;
  monthRevPAR: number;
  monthADR: number;
}

export interface DailyOccupancy {
  date: string;
  occupiedRooms: number;
  totalRooms: number;
  occupancyRate: number;
}

export interface OccupancyReport {
  fromDate: string;
  toDate: string;
  totalRooms: number;
  occupiedNights: number;
  totalNights: number;
  occupancyRate: number;
  dailyBreakdown: DailyOccupancy[];
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  checkIns: number;
  checkOuts: number;
}

export interface RevenueByRoomType {
  roomType: string;
  revenue: number;
  nights: number;
  occupancyRate: number;
}

export interface RevenueReport {
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  roomRevenue: number;
  roomServiceRevenue: number;
  adr: number;
  revPAR: number;
  dailyBreakdown: DailyRevenue[];
  byRoomType: RevenueByRoomType[];
}

export interface ReservationStatistics {
  fromDate: string;
  toDate: string;
  totalReservations: number;
  pendingCount: number;
  confirmedCount: number;
  checkedInCount: number;
  checkedOutCount: number;
  cancelledCount: number;
  cancellationRate: number;
  averageStayDuration: number;
  topPaymentMethods: { name: string; count: number; percentage: number }[];
}

// ─── Rate Plan Types ──────────────────────────────────────────────────────────
export interface RatePlanRoomTypeOverride {
  id: string;
  roomType?: string;
  fixedPricePerNight?: number;
  additionalAdjustment?: number;
}

export interface RatePlan {
  id: string;
  name: string;
  description: string;
  adjustmentType: 'Percentage' | 'FixedAmount';
  adjustmentValue: number;
  isActive: boolean;
  priority: number;
  validFrom?: string;
  validTo?: string;
  applicableDays: number[];
  createdAt: string;
  roomTypeRates: RatePlanRoomTypeOverride[];
}

export interface CreateRatePlanPayload {
  name: string;
  description: string;
  adjustmentType: 'Percentage' | 'FixedAmount';
  adjustmentValue: number;
  isActive: boolean;
  priority: number;
  validFrom?: string;
  validTo?: string;
  applicableDays: number[];
  roomTypeRates: Omit<RatePlanRoomTypeOverride, 'id'>[];
}

// ─── Audit Log Types ──────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  entityName: string;
  entityId: string;
  action: string;
  changedBy?: string;
  oldValues?: string;
  newValues?: string;
  notes?: string;
  timestamp: string;
}

// ─── Paged Result ─────────────────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Walk-in Payload ──────────────────────────────────────────────────────────
export interface WalkInPayload {
  roomId: string;
  checkOutDate: string;
  numberOfGuests: number;
  paidAmount: number;
  paymentMethod: string;
  specialRequests?: string;
  guestName: string;
  guestPhone: string;
  guestIdNumber: string;
  guestEmail?: string;
  guestAddress?: string;
}

// ─── Faz 3: Guest CRM ────────────────────────────────────────────────────────
export interface GuestPreference {
  id: string;
  category: string;
  key: string;
  value: string;
  notes?: string;
  createdAt: string;
}

export interface GuestNote {
  id: string;
  note: string;
  addedBy?: string;
  isImportant: boolean;
  createdAt: string;
}

export interface GuestProfile {
  guestId: string;
  name: string;
  email?: string;
  phone?: string;
  totalStays: number;
  totalSpent: number;
  loyaltyPoints: number;
  vipLevel?: string;
  preferences: GuestPreference[];
  notes: GuestNote[];
  recentRoomTypes: string[];
}

export interface AddPreferencePayload {
  category: string;
  key: string;
  value: string;
  notes?: string;
}

export interface AddNotePayload {
  note: string;
  isImportant: boolean;
}

// ─── Faz 3: Dinamik Fiyatlandırma ────────────────────────────────────────────
export interface DynamicPricingRule {
  id: string;
  name: string;
  trigger: 'OccupancyBased' | 'DaysBefore' | 'SeasonBased';
  thresholdValue: number;
  adjustmentPercent: number;
  isActive: boolean;
  priority: number;
}

export interface CreateDynamicPricingRulePayload {
  name: string;
  trigger: 'OccupancyBased' | 'DaysBefore' | 'SeasonBased';
  thresholdValue: number;
  adjustmentPercent: number;
  isActive: boolean;
  priority: number;
}

export interface DynamicPriceResult {
  basePrice: number;
  adjustedPrice: number;
  appliedRules: string[];
  totalAdjustmentPercent: number;
}

// ─── Faz 3: Sadakat Programı ─────────────────────────────────────────────────
export interface LoyaltyTransaction {
  id: string;
  points: number;
  transactionType: 'Earned' | 'Redeemed' | 'Expired' | 'Bonus';
  description: string;
  reservationId?: string;
  createdAt: string;
}

export interface LoyaltySummary {
  guestId: string;
  guestName: string;
  totalPoints: number;
  vipLevel: string;
  recentTransactions: LoyaltyTransaction[];
}

export interface RedeemPointsPayload {
  guestId: string;
  points: number;
  description: string;
}

// ─── Faz 3: Anket ────────────────────────────────────────────────────────────
export interface GuestSurvey {
  id: string;
  guestId: string;
  reservationId: string;
  overallRating: number;
  roomCleanliness: number;
  staffFriendliness: number;
  foodQuality: number;
  valueForMoney: number;
  comments?: string;
  wouldRecommend: boolean;
  submittedAt: string;
}

export interface SubmitSurveyPayload {
  guestId: string;
  reservationId: string;
  overallRating: number;
  roomCleanliness: number;
  staffFriendliness: number;
  foodQuality: number;
  valueForMoney: number;
  comments?: string;
  wouldRecommend: boolean;
}

export interface SurveyStats {
  averageOverall: number;
  averageRoomCleanliness: number;
  averageStaffFriendliness: number;
  averageFoodQuality: number;
  averageValueForMoney: number;
  totalSurveys: number;
  recommendationRate: number;
}

export interface CalculatedRate {
  roomId: string;
  roomNumber: string;
  roomType: string;
  basePrice: number;
  finalPricePerNight: number;
  nightCount: number;
  totalPrice: number;
  appliedRatePlan?: string;
  discountAmount: number;
}

// Public Booking Types
export interface AvailableRoom {
  id: string;
  number: string;
  type: string;
  floor: number;
  capacity: number;
  features: string[];
  basePrice: number;
  finalPricePerNight: number;
  nightCount: number;
  totalPrice: number;
  appliedRules: string[];
}

export interface PublicReservationRequest {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests: string;
  primaryGuestName: string;
  primaryGuestEmail: string;
  primaryGuestPhone: string;
  primaryGuestIdNumber: string;
  primaryGuestAddress: string;
  additionalGuests: { name: string; idNumber: string; phone: string; email: string; address: string }[];
}

export interface BookingConfirmation {
  reservationId: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount: number;
  totalAmount: number;
  guestName: string;
  status: string;
}

// ─── Faz 4: POS ──────────────────────────────────────────────────────────────
export interface PosTransaction {
  id: string;
  reservationId: string;
  guestId: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  createdBy: string;
  createdAt: string;
  chargedAt?: string;
  paymentId?: string;
}

export interface CreatePosTransactionPayload {
  reservationId: string;
  description: string;
  amount: number;
  category: string;
  createdBy: string;
}

export interface RoomChargesSummary {
  reservationId: string;
  guestName: string;
  roomNumber: string;
  charges: PosTransaction[];
  totalCharges: number;
  reservationAmount: number;
  grandTotal: number;
}

// ─── Faz 4: Housekeeping ─────────────────────────────────────────────────────
export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  taskType: string;
  status: string;
  priority: number;
  assignedToId?: string;
  assignedToName?: string;
  notes: string;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CreateHousekeepingTaskPayload {
  roomId: string;
  taskType: string;
  priority: number;
  assignedToId?: string;
  notes: string;
  scheduledDate: string;
}

export interface HousekeepingSummary {
  pending: number;
  inProgress: number;
  completed: number;
  skipped: number;
  total: number;
}
