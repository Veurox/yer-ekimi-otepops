import api from './api';
import {
  Room, Staff, Guest, Reservation, MaintenanceRequest,
  RoomServiceOrder, InventoryItem, MenuItem,
  CreateReservationPayload, CheckOutResult,
  Payment, CreatePaymentPayload, ReservationPaymentSummary,
  Invoice, GenerateInvoicePayload,
  DashboardSummary, OccupancyReport, RevenueReport, ReservationStatistics,
  RatePlan, CreateRatePlanPayload, CalculatedRate,
  AuditLog, PagedResult, WalkInPayload,
  GuestProfile, AddPreferencePayload, AddNotePayload,
  DynamicPricingRule, CreateDynamicPricingRulePayload, DynamicPriceResult,
  LoyaltySummary, LoyaltyTransaction, RedeemPointsPayload,
  GuestSurvey, SubmitSurveyPayload, SurveyStats,
  PosTransaction, CreatePosTransactionPayload, RoomChargesSummary,
  HousekeepingTask, CreateHousekeepingTaskPayload, HousekeepingSummary,
} from '../types';

export const hotelService = {
  // Rooms
  getRooms: () => api.get<Room[]>('/Rooms'),
  getRoom: (id: string) => api.get<Room>(`/Rooms/${id}`),
  createRoom: (data: Omit<Room, 'id'>) => api.post<Room>('/Rooms', data),
  updateRoom: (id: string, data: Partial<Room>) => api.put<Room>(`/Rooms/${id}`, data),
  deleteRoom: (id: string) => api.delete(`/Rooms/${id}`),
  completeRoomCleaning: (id: string) => api.post(`/Rooms/${id}/complete-cleaning`),

  // Staff
  getStaff: () => api.get<Staff[]>('/Staff'),
  createStaff: (data: Omit<Staff, 'id'>) => api.post<Staff>('/Staff', data),
  updateStaff: (id: string, data: Partial<Staff>) => api.put<Staff>(`/Staff/${id}`, data),
  deleteStaff: (id: string) => api.delete(`/Staff/${id}`),

  // Guests
  getGuests: () => api.get<Guest[]>('/Guests'),
  createGuest: (data: Omit<Guest, 'id'>) => api.post<Guest>('/Guests', data),
  updateGuest: (id: string, data: Partial<Guest>) => api.put<Guest>(`/Guests/${id}`, data),
  deleteGuest: (id: string) => api.delete(`/Guests/${id}`),

  // Reservations
  getReservations: () => api.get<Reservation[]>('/Reservations'),
  createReservation: (data: CreateReservationPayload) => api.post<Reservation>('/Reservations', data),
  updateReservation: (id: string, data: Partial<Reservation>) => api.put<Reservation>(`/Reservations/${id}`, data),
  deleteReservation: (id: string) => api.delete(`/Reservations/${id}`),
  confirmReservation: (id: string) => api.post<Reservation>(`/Reservations/${id}/confirm`),
  checkInReservation: (id: string) => api.post<Reservation>(`/Reservations/${id}/checkin`),
  checkOutReservation: (id: string, force: boolean = false, reason?: string) =>
    api.post<CheckOutResult>(`/Reservations/${id}/checkout?force=${force}${reason ? '&reason=' + encodeURIComponent(reason) : ''}`),
  cancelReservation: (id: string, reason?: string) =>
    api.post<Reservation>(`/Reservations/${id}/cancel${reason ? '?reason=' + encodeURIComponent(reason) : ''}`),

  // Maintenance
  getMaintenanceRequests: () => api.get<MaintenanceRequest[]>('/Maintenance'),
  createMaintenanceRequest: (data: Omit<MaintenanceRequest, 'id'>) => api.post<MaintenanceRequest>('/Maintenance', data),
  updateMaintenanceRequest: (id: string, data: Partial<MaintenanceRequest>) => api.put<MaintenanceRequest>(`/Maintenance/${id}`, data),
  deleteMaintenanceRequest: (id: string) => api.delete(`/Maintenance/${id}`),

  // Menu
  getMenuItems: () => api.get<MenuItem[]>('/Menu'),
  createMenuItem: (data: Omit<MenuItem, 'id'>) => api.post<MenuItem>('/Menu', data),
  updateMenuItem: (id: string, data: Partial<MenuItem>) => api.put<MenuItem>(`/Menu/${id}`, data),
  deleteMenuItem: (id: string) => api.delete(`/Menu/${id}`),

  // Room Service
  getRoomServiceOrders: () => api.get<RoomServiceOrder[]>('/RoomService'),
  createRoomServiceOrder: (data: Omit<RoomServiceOrder, 'id'>) => api.post<RoomServiceOrder>('/RoomService', data),
  updateRoomServiceOrder: (id: string, data: Partial<RoomServiceOrder>) => api.put<RoomServiceOrder>(`/RoomService/${id}`, data),
  deleteRoomServiceOrder: (id: string) => api.delete(`/RoomService/${id}`),

  // Inventory
  getInventory: () => api.get<InventoryItem[]>('/Inventory'),
  createInventoryItem: (data: Omit<InventoryItem, 'id'>) => api.post<InventoryItem>('/Inventory', data),
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => api.put<InventoryItem>(`/Inventory/${id}`, data),
  deleteInventoryItem: (id: string) => api.delete(`/Inventory/${id}`),

  // Payments
  getPaymentsByReservation: (reservationId: string) => api.get<Payment[]>(`/Payments/reservation/${reservationId}`),
  getPaymentSummary: (reservationId: string) => api.get<ReservationPaymentSummary>(`/Payments/reservation/${reservationId}/summary`),
  addPayment: (data: CreatePaymentPayload) => api.post<Payment>('/Payments', data),
  refundPayment: (paymentId: string, reason?: string) =>
    api.post<Payment>(`/Payments/${paymentId}/refund${reason ? '?reason=' + encodeURIComponent(reason) : ''}`),

  // Invoices
  getInvoices: (fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    return api.get<Invoice[]>(`/Invoices${params.toString() ? '?' + params.toString() : ''}`);
  },
  getInvoiceById: (id: string) => api.get<Invoice>(`/Invoices/${id}`),
  getInvoiceByReservation: (reservationId: string) => api.get<Invoice>(`/Invoices/reservation/${reservationId}`),
  generateInvoice: (data: GenerateInvoicePayload) => api.post<Invoice>('/Invoices/generate', data),
  markInvoicePaid: (id: string) => api.post<Invoice>(`/Invoices/${id}/pay`),
  cancelInvoice: (id: string) => api.post<Invoice>(`/Invoices/${id}/cancel`),

  // Reports
  getDashboardSummary: () => api.get<DashboardSummary>('/Reports/dashboard'),
  getOccupancyReport: (fromDate: string, toDate: string) =>
    api.get<OccupancyReport>(`/Reports/occupancy?fromDate=${fromDate}&toDate=${toDate}`),
  getRevenueReport: (fromDate: string, toDate: string) =>
    api.get<RevenueReport>(`/Reports/revenue?fromDate=${fromDate}&toDate=${toDate}`),
  getReservationStats: (fromDate: string, toDate: string) =>
    api.get<ReservationStatistics>(`/Reports/reservations?fromDate=${fromDate}&toDate=${toDate}`),

  // Rate Plans
  getRatePlans: () => api.get<RatePlan[]>('/RatePlans'),
  getRatePlanById: (id: string) => api.get<RatePlan>(`/RatePlans/${id}`),
  createRatePlan: (data: CreateRatePlanPayload) => api.post<RatePlan>('/RatePlans', data),
  updateRatePlan: (id: string, data: CreateRatePlanPayload) => api.put<RatePlan>(`/RatePlans/${id}`, data),
  deleteRatePlan: (id: string) => api.delete(`/RatePlans/${id}`),
  calculateRate: (roomId: string, checkIn: string, checkOut: string) =>
    api.get<CalculatedRate>(`/RatePlans/calculate?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}`),

  // Audit Log
  getAuditLogs: (params?: { entityName?: string; entityId?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.entityName) q.append('entityName', params.entityName);
    if (params?.entityId) q.append('entityId', params.entityId);
    if (params?.page) q.append('page', String(params.page));
    if (params?.pageSize) q.append('pageSize', String(params.pageSize));
    return api.get<AuditLog[]>(`/Audit${q.toString() ? '?' + q.toString() : ''}`);
  },

  // Paged endpoints
  getReservationsPaged: (params: { page?: number; pageSize?: number; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', String(params.page));
    if (params.pageSize) q.append('pageSize', String(params.pageSize));
    if (params.status) q.append('status', params.status);
    if (params.search) q.append('search', params.search);
    return api.get<PagedResult<Reservation>>(`/Reservations/paged?${q.toString()}`);
  },

  getGuestsPaged: (params: { page?: number; pageSize?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', String(params.page));
    if (params.pageSize) q.append('pageSize', String(params.pageSize));
    if (params.search) q.append('search', params.search);
    return api.get<PagedResult<Guest>>(`/Guests/paged?${q.toString()}`);
  },

  // Walk-in
  walkIn: (data: WalkInPayload) => api.post<Reservation>('/Reservations/walkin', data),

  // ─── Faz 3: Guest CRM ────────────────────────────────────────────────────
  getGuestProfile: (guestId: string) => api.get<GuestProfile>(`/GuestCrm/${guestId}/profile`),
  addGuestPreference: (guestId: string, data: AddPreferencePayload) =>
    api.post(`/GuestCrm/${guestId}/preferences`, data),
  deleteGuestPreference: (prefId: string) => api.delete(`/GuestCrm/preferences/${prefId}`),
  addGuestNote: (guestId: string, data: AddNotePayload) =>
    api.post(`/GuestCrm/${guestId}/notes`, data),
  deleteGuestNote: (noteId: string) => api.delete(`/GuestCrm/notes/${noteId}`),
  recalculateGuestStats: (guestId: string) =>
    api.post(`/GuestCrm/${guestId}/recalculate`, {}),

  // ─── Faz 3: Dinamik Fiyatlandırma ────────────────────────────────────────
  getDynamicPricingRules: () => api.get<DynamicPricingRule[]>('/DynamicPricing'),
  createDynamicPricingRule: (data: CreateDynamicPricingRulePayload) =>
    api.post<DynamicPricingRule>('/DynamicPricing', data),
  updateDynamicPricingRule: (id: string, data: CreateDynamicPricingRulePayload) =>
    api.put<DynamicPricingRule>(`/DynamicPricing/${id}`, data),
  deleteDynamicPricingRule: (id: string) => api.delete(`/DynamicPricing/${id}`),
  calculateDynamicPrice: (roomId: string, checkIn: string) =>
    api.get<DynamicPriceResult>(`/DynamicPricing/calculate?roomId=${roomId}&checkIn=${checkIn}`),

  // ─── Faz 3: Sadakat Programı ─────────────────────────────────────────────
  getLoyaltySummary: (guestId: string) => api.get<LoyaltySummary>(`/Loyalty/${guestId}/summary`),
  getLoyaltyTransactions: (guestId: string) =>
    api.get<LoyaltyTransaction[]>(`/Loyalty/${guestId}/transactions`),
  earnLoyaltyPoints: (data: { guestId: string; reservationId: string; amountSpent: number }) =>
    api.post('/Loyalty/earn', data),
  redeemLoyaltyPoints: (data: RedeemPointsPayload) => api.post('/Loyalty/redeem', data),

  // ─── Faz 3: Anket ────────────────────────────────────────────────────────
  submitSurvey: (data: SubmitSurveyPayload) => api.post<GuestSurvey>('/Surveys', data),
  getSurveys: (page = 1, pageSize = 20) =>
    api.get<GuestSurvey[]>(`/Surveys?page=${page}&pageSize=${pageSize}`),
  getSurveyStats: () => api.get<SurveyStats>('/Surveys/stats'),
  getSurveysByGuest: (guestId: string) =>
    api.get<GuestSurvey[]>(`/Surveys/guest/${guestId}`),

  // ─── Faz 4: POS ──────────────────────────────────────────────────────────
  getPosTransactions: (reservationId?: string) =>
    api.get<PosTransaction[]>(`/pos${reservationId ? `?reservationId=${reservationId}` : ''}`),
  createPosTransaction: (data: CreatePosTransactionPayload) =>
    api.post<PosTransaction>('/pos', data),
  chargeToRoom: (transactionId: string) =>
    api.post<PosTransaction>(`/pos/${transactionId}/charge-to-room`),
  getRoomCharges: (reservationId: string) =>
    api.get<RoomChargesSummary>(`/pos/room-charges/${reservationId}`),
  cancelPosTransaction: (transactionId: string) =>
    api.delete<PosTransaction>(`/pos/${transactionId}`),

  // ─── Faz 4: Housekeeping ─────────────────────────────────────────────────
  getHousekeepingTasks: (params?: { date?: string; roomId?: string; assignedToId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.date) q.append('date', params.date);
    if (params?.roomId) q.append('roomId', params.roomId);
    if (params?.assignedToId) q.append('assignedToId', params.assignedToId);
    if (params?.status) q.append('status', params.status);
    return api.get<HousekeepingTask[]>(`/housekeeping${q.toString() ? '?' + q.toString() : ''}`);
  },
  createHousekeepingTask: (data: CreateHousekeepingTaskPayload) =>
    api.post<HousekeepingTask>('/housekeeping', data),
  updateHousekeepingStatus: (taskId: string, status: string) =>
    api.patch<HousekeepingTask>(`/housekeeping/${taskId}/status`, { status }),
  assignHousekeepingStaff: (taskId: string, staffId: string) =>
    api.patch<HousekeepingTask>(`/housekeeping/${taskId}/assign`, { staffId }),
  getHousekeepingSummary: () =>
    api.get<HousekeepingSummary>('/housekeeping/summary'),
};
