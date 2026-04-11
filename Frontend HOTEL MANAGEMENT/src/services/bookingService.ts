import publicApi from './publicApi';
import { AvailableRoom, PublicReservationRequest, BookingConfirmation } from '../types';

export const bookingService = {
  searchAvailableRooms: async (checkIn: string, checkOut: string, guests: number): Promise<AvailableRoom[]> => {
    const response = await publicApi.get<AvailableRoom[]>('/public/booking/available-rooms', {
      params: { checkIn, checkOut, guests },
    });
    return response.data;
  },

  createReservation: async (data: PublicReservationRequest): Promise<BookingConfirmation> => {
    const response = await publicApi.post<BookingConfirmation>('/public/booking/reserve', data);
    return response.data;
  },
};
