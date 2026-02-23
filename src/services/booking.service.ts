import apiService from "./api.service";
import {
  AdminBookingStatusUpdateResponse,
  ClassBooking,
  BookingStatus,
  NoShowPolicy,
} from "@/types";

class BookingService {
  async getMyBookings(sedeId: number): Promise<ClassBooking[]> {
    const data = await apiService.get(`/user/bookings?sedeId=${sedeId}`);
    if (Array.isArray(data)) {
      return data as ClassBooking[];
    }

    return (
      data.bookings ??
      data.classes ??
      data.items ??
      data.data?.bookings ??
      data.data?.classes ??
      data.data?.items ??
      []
    ) as ClassBooking[];
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

  async leaveWaitlist(classId: number): Promise<void> {
    await apiService.delete(`/user/bookings/waitlist/${classId}`);
  }

  async getMyWaitlists(sedeId?: number): Promise<ClassBooking[]> {
    const query = typeof sedeId === "number" ? `?sedeId=${sedeId}` : "";
    const data = await apiService.get(`/user/bookings/waitlist${query}`);
    return (data.bookings ?? data.items ?? []) as ClassBooking[];
  }

  async updateStatus(
    bookingId: number,
    status: BookingStatus
  ): Promise<AdminBookingStatusUpdateResponse> {
    const data = await apiService.put<AdminBookingStatusUpdateResponse>(
      `/admin/bookings/${bookingId}/status`,
      { status }
    );
    return data;
  }

  async getClassBookings(classId: number, status?: BookingStatus): Promise<ClassBooking[]> {
    const query = status ? `?status=${status}` : "";
    const data = await apiService.get(`/admin/class/${classId}/bookings${query}`);
    return (data.bookings ?? []) as ClassBooking[];
  }
}

export default new BookingService();
