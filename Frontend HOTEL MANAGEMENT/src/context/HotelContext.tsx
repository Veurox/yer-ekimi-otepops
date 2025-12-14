import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  Room,
  Staff,
  Guest,
  Reservation,
  MaintenanceRequest,
  MenuItem,
  RoomServiceOrder,
  InventoryItem,
  CreateReservationPayload,
} from '../types';
import { hotelService } from '../services/hotelService';
import { useAuth } from './AuthContext';

interface HotelContextType {
  // Rooms
  rooms: Room[];
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  completeRoomCleaning: (id: string) => Promise<void>;

  // Staff
  staff: Staff[];
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, staff: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;

  // Guests
  guests: Guest[];
  addGuest: (guest: Omit<Guest, 'id'>) => void;
  updateGuest: (id: string, guest: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;

  // Reservations
  reservations: Reservation[];
  addReservation: (reservation: CreateReservationPayload) => Promise<void>;
  updateReservation: (id: string, reservation: Partial<Reservation>) => void;
  deleteReservation: (id: string) => void;
  checkInReservation: (id: string) => Promise<void>;
  checkOutReservation: (id: string, force?: boolean) => Promise<void>;

  // Maintenance
  maintenanceRequests: MaintenanceRequest[];
  addMaintenanceRequest: (request: Omit<MaintenanceRequest, 'id'>) => void;
  updateMaintenanceRequest: (id: string, request: Partial<MaintenanceRequest>) => void;
  deleteMaintenanceRequest: (id: string) => void;

  // Menu
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;

  // Room Service Orders
  roomServiceOrders: RoomServiceOrder[];
  addRoomServiceOrder: (order: Omit<RoomServiceOrder, 'id'>) => void;
  updateRoomServiceOrder: (id: string, order: Partial<RoomServiceOrder>) => void;

  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const HotelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [roomServiceOrders, setRoomServiceOrders] = useState<RoomServiceOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // API'den veri çekme
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          hotelService.getRooms(),
          hotelService.getStaff(),
          hotelService.getGuests(),
          hotelService.getReservations(),
          hotelService.getMaintenanceRequests(),
          hotelService.getRoomServiceOrders(),
          hotelService.getInventory(),
          hotelService.getMenuItems()
        ]);

        const [
          roomsRes, staffRes, guestsRes, reservationsRes,
          maintenanceRes, ordersRes, inventoryRes, menuRes
        ] = results;

        if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data);
        else console.error('Rooms fetch failed', roomsRes.reason);

        if (staffRes.status === 'fulfilled') setStaff(staffRes.value.data);
        else console.error('Staff fetch failed', staffRes.reason);

        // ... (other handlers remain same)

        if (guestsRes.status === 'fulfilled') setGuests(guestsRes.value.data);
        else console.error('Guests fetch failed', guestsRes.reason);

        if (reservationsRes.status === 'fulfilled') setReservations(reservationsRes.value.data);
        else console.error('Reservations fetch failed', reservationsRes.reason);

        if (maintenanceRes.status === 'fulfilled') setMaintenanceRequests(maintenanceRes.value.data);
        else console.error('Maintenance fetch failed', maintenanceRes.reason);

        if (ordersRes.status === 'fulfilled') setRoomServiceOrders(ordersRes.value.data);
        else console.error('RoomService fetch failed', ordersRes.reason);

        if (inventoryRes.status === 'fulfilled') setInventory(inventoryRes.value.data);
        else console.error('Inventory fetch failed', inventoryRes.reason);

        if (menuRes.status === 'fulfilled') setMenuItems(menuRes.value.data);
        else console.error('Menu fetch failed', menuRes.reason);

      } catch (error) {
        console.error('Critical error during data load:', error);
      }
    };
    loadData();
  }, [isAuthenticated]);

  // Room functions
  const addRoom = async (room: Omit<Room, 'id'>) => {
    try {
      const response = await hotelService.createRoom(room);
      setRooms(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding room:', error);
      alert('Oda eklenirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const completeRoomCleaning = async (id: string) => {
    try {
      await hotelService.completeRoomCleaning(id);
      const response = await hotelService.getRooms();
      setRooms(response.data);
    } catch (error) {
      console.error('Error completing room cleaning:', error);
      alert('Oda temizliği tamamlanırken hata oluştu.');
    }
  };

  const updateRoom = async (id: string, room: Partial<Room>) => {
    try {
      // Get current room to merge with updates
      const currentRoom = rooms.find(r => r.id === id);
      if (!currentRoom) {
        console.error('Room not found');
        return;
      }

      // Merge current data with updates and ensure id is included
      const updatedData = {
        ...currentRoom,
        ...room,
        id: id
      };

      const response = await hotelService.updateRoom(id, updatedData);
      setRooms(prev => prev.map(r => r.id === id ? response.data : r));
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Oda güncellenirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      await hotelService.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Oda silinirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Staff functions
  const addStaff = async (staffMember: Omit<Staff, 'id'>) => {
    try {
      const response = await hotelService.createStaff(staffMember);
      setStaff(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding staff:', error);
      setStaff(prev => [...prev, { ...staffMember, id: Date.now().toString() }]);
    }
  };

  const updateStaff = async (id: string, staffMember: Partial<Staff>) => {
    try {
      // Get current staff to merge with updates
      const currentStaff = staff.find(s => s.id === id);
      if (!currentStaff) {
        console.error('Staff not found');
        return;
      }

      // Merge current data with updates and ensure id is included
      const updatedData = {
        ...currentStaff,
        ...staffMember,
        id: id
      };

      const response = await hotelService.updateStaff(id, updatedData);
      setStaff(prev => prev.map(s => s.id === id ? response.data : s));
    } catch (error) {
      console.error('Error updating staff:', error);
      setStaff(prev => prev.map(s => s.id === id ? { ...s, ...staffMember } : s));
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      await hotelService.deleteStaff(id);
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Personel silinirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Guest functions
  const addGuest = async (guest: Omit<Guest, 'id'>) => {
    try {
      const response = await hotelService.createGuest(guest);
      setGuests(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding guest:', error);
      setGuests(prev => [...prev, { ...guest, id: Date.now().toString() }]);
    }
  };

  const updateGuest = async (id: string, guest: Partial<Guest>) => {
    try {
      const currentGuest = guests.find(g => g.id === id);
      if (!currentGuest) {
        console.error('Guest not found');
        return;
      }
      const updatedData = { ...currentGuest, ...guest, id };
      const response = await hotelService.updateGuest(id, updatedData);
      setGuests(prev => prev.map(g => g.id === id ? response.data : g));
    } catch (error) {
      console.error('Error updating guest:', error);
      alert('Misafir güncellenirken hata oluştu.');
    }
  };

  const deleteGuest = async (id: string) => {
    try {
      await hotelService.deleteGuest(id);
      setGuests(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting guest:', error);
      alert('Misafir silinirken hata oluştu.');
    }
  };

  // Reservation functions
  const addReservation = async (reservation: CreateReservationPayload) => {
    try {
      const response = await hotelService.createReservation(reservation);
      setReservations(prev => [...prev, response.data]);
      // Refresh related data
      const roomsRes = await hotelService.getRooms();
      setRooms(roomsRes.data);
      const guestsRes = await hotelService.getGuests();
      setGuests(guestsRes.data);
    } catch (error: any) {
      console.error('Error adding reservation:', error);
      const errorMsg = error.response?.data?.Errors?.join('\n') || error.response?.data?.message || 'Rezervasyon eklenirken hata oluştu.';
      alert(errorMsg);
    }
  };

  const checkInReservation = async (id: string) => {
    try {
      const response = await hotelService.checkInReservation(id);
      setReservations(prev => prev.map(r => r.id === id ? response.data : r));
      // Refresh related data
      const roomsRes = await hotelService.getRooms();
      setRooms(roomsRes.data);
      const guestsRes = await hotelService.getGuests();
      setGuests(guestsRes.data);
    } catch (error: any) {
      console.error('Error checking in:', error);
      alert(error.response?.data?.message || 'Check-in sırasında hata oluştu.');
    }
  };

  const checkOutReservation = async (id: string, force: boolean = false) => {
    try {
      const response = await hotelService.checkOutReservation(id, force);
      if (!response.data.success && response.data.requiresPayment) {
        const confirm = window.confirm(`${response.data.message}\nÖdemeyi onaylayıp çıkışı zorlamak istiyor musunuz?`);
        if (confirm) {
          await checkOutReservation(id, true);
        }
        return;
      }

      // Refresh data
      const resList = await hotelService.getReservations();
      setReservations(resList.data);

      const roomsRes = await hotelService.getRooms();
      setRooms(roomsRes.data);

      const guestsRes = await hotelService.getGuests();
      setGuests(guestsRes.data);

      alert('Check-out işlemi başarılı.');
    } catch (error: any) {
      console.error('Error checking out:', error);
      alert(error.response?.data?.message || 'Check-out sırasında hata oluştu.');
    }
  };

  const updateReservation = async (id: string, reservation: Partial<Reservation>) => {
    try {
      const current = reservations.find(r => r.id === id);
      if (!current) return;
      const updatedData = { ...current, ...reservation, id };
      const response = await hotelService.updateReservation(id, updatedData);
      setReservations(prev => prev.map(r => r.id === id ? response.data : r));
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Rezervasyon güncellenirken hata oluştu.');
    }
  };

  const deleteReservation = async (id: string) => {
    try {
      await hotelService.deleteReservation(id);
      setReservations(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Rezervasyon silinirken hata oluştu.');
    }
  };

  // Maintenance functions
  const addMaintenanceRequest = async (request: Omit<MaintenanceRequest, 'id'>) => {
    try {
      const response = await hotelService.createMaintenanceRequest(request);
      setMaintenanceRequests(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding maintenance request:', error);
      setMaintenanceRequests(prev => [...prev, { ...request, id: Date.now().toString() }]);
    }
  };

  const updateMaintenanceRequest = async (id: string, request: Partial<MaintenanceRequest>) => {
    try {
      const current = maintenanceRequests.find(r => r.id === id);
      if (!current) return;
      const updatedData = { ...current, ...request, id };
      const response = await hotelService.updateMaintenanceRequest(id, updatedData);
      setMaintenanceRequests(prev => prev.map(r => r.id === id ? response.data : r));
    } catch (error) {
      console.error('Error updating maintenance request:', error);
      alert('Bakım talebi güncellenirken hata oluştu.');
    }
  };

  const deleteMaintenanceRequest = async (id: string) => {
    try {
      await hotelService.deleteMaintenanceRequest(id);
      setMaintenanceRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting maintenance request:', error);
      alert('Bakım talebi silinirken hata oluştu.');
    }
  };

  // Menu functions
  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const response = await hotelService.createMenuItem(item);
      setMenuItems(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding menu item:', error);
      setMenuItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
    }
  };

  const updateMenuItem = async (id: string, item: Partial<MenuItem>) => {
    try {
      const current = menuItems.find(i => i.id === id);
      if (!current) return;
      const updatedData = { ...current, ...item, id };
      const response = await hotelService.updateMenuItem(id, updatedData);
      setMenuItems(prev => prev.map(i => i.id === id ? response.data : i));
    } catch (error) {
      console.error('Error updating menu item:', error);
      alert('Menü öğesi güncellenirken hata oluştu.');
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await hotelService.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Menü öğesi silinirken hata oluştu.');
    }
  };

  // Room Service functions
  const addRoomServiceOrder = async (order: Omit<RoomServiceOrder, 'id'>) => {
    try {
      const response = await hotelService.createRoomServiceOrder(order);
      setRoomServiceOrders(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding room service order:', error);
      setRoomServiceOrders(prev => [...prev, { ...order, id: Date.now().toString() }]);
    }
  };

  const updateRoomServiceOrder = async (id: string, order: Partial<RoomServiceOrder>) => {
    try {
      const current = roomServiceOrders.find(o => o.id === id);
      if (!current) return;
      const updatedData = { ...current, ...order, id };
      const response = await hotelService.updateRoomServiceOrder(id, updatedData);
      setRoomServiceOrders(prev => prev.map(o => o.id === id ? response.data : o));
    } catch (error) {
      console.error('Error updating room service order:', error);
      alert('Oda servisi siparişi güncellenirken hata oluştu.');
    }
  };

  // Inventory functions
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      const response = await hotelService.createInventoryItem(item);
      setInventory(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding inventory item:', error);
      setInventory(prev => [...prev, { ...item, id: Date.now().toString() }]);
    }
  };

  const updateInventoryItem = async (id: string, item: Partial<InventoryItem>) => {
    try {
      const current = inventory.find(i => i.id === id);
      if (!current) return;
      const updatedData = { ...current, ...item, id };
      const response = await hotelService.updateInventoryItem(id, updatedData);
      setInventory(prev => prev.map(i => i.id === id ? response.data : i));
    } catch (error) {
      console.error('Error updating inventory item:', error);
      alert('Envanter öğesi güncellenirken hata oluştu.');
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await hotelService.deleteInventoryItem(id);
      setInventory(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      alert('Envanter öğesi silinirken hata oluştu.');
    }
  };

  return (
    <HotelContext.Provider
      value={{
        rooms, addRoom, updateRoom, deleteRoom, completeRoomCleaning,
        staff, addStaff, updateStaff, deleteStaff,
        guests, addGuest, updateGuest, deleteGuest,
        reservations, addReservation, updateReservation, deleteReservation, checkInReservation, checkOutReservation,
        maintenanceRequests, addMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest,
        menuItems, addMenuItem, updateMenuItem, deleteMenuItem,
        roomServiceOrders, addRoomServiceOrder, updateRoomServiceOrder,
        inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within HotelProvider');
  }
  return context;
};
