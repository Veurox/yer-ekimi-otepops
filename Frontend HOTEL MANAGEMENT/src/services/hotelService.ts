import api from './api';
import {
  Room, Staff, Guest, Reservation, MaintenanceRequest,
  RoomServiceOrder, InventoryItem, MenuItem,
  CreateReservationPayload, CheckOutResult
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
  checkInReservation: (id: string) => api.post<Reservation>(`/Reservations/${id}/checkin`),
  checkOutReservation: (id: string, force: boolean = false) => api.post<CheckOutResult>(`/Reservations/${id}/checkout?force=${force}`),

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
};
