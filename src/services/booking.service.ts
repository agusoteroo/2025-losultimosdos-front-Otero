import apiService from "./api.service";
import { ClassBooking, BookingStatus, NoShowPolicy } from "@/types";

class BookingService {
  async getMyBookings(sedeId: number): Promise<ClassBooking[]> {
    const data = await apiService.get(`/user/bookings?sedeId=${sedeId}`);
    return (data.bookings ?? []) as ClassBooking[];
  }

  async getNoShowPolicy(): Promise<NoShowPolicy | null> {
    const data = await apiService.get(`/user/bookings/no-show-policy`);
    return (data.policy ?? null) as NoShowPolicy | null;
  }

  async checkIn(bookingId: number): Promise<ClassBooking> {
    const data = await apiService.post(`/user/bookings/${bookingId}/check-in`, {});
    return data.booking as ClassBooking;
  }

  async joinWaitlist(classId: number): Promise<ClassBooking> {
    const data = await apiService.post(`/user/bookings/waitlist`, { classId });
    return data.booking as ClassBooking;
  }

  async updateStatus(bookingId: number, status: BookingStatus): Promise<ClassBooking> {
    const data = await apiService.put(`/admin/bookings/${bookingId}/status`, { status });
    return data.booking as ClassBooking;
  }

  async getClassBookings(classId: number): Promise<ClassBooking[]> {
    const data = await apiService.get(`/admin/class/${classId}/bookings`);
    return (data.bookings ?? []) as ClassBooking[];
  }
}

export default new BookingService();
