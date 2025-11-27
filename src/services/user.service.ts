import apiService from "./api.service";
import { User } from "@/types";

class UserService {
  private readonly apiService = apiService;

  async getUser(userId: string) {
    const data = await this.apiService.get(`/admin/users/${userId}`);
    const userData = data.user as User;

    return userData;
  }

  async getAllUsers() {
    const data = await this.apiService.get("/admin/users");

    return data.users as User[];
  }

  async getAllUsersBySede(sedeId: number) {
    const data = await this.apiService.get(`/admin/users?sedeId=${sedeId}`);
    return data.users as User[];
  }

  async updateUserRole(userId: string, role: string) {
    await this.apiService.put(`/admin/users/${userId}/role`, { role });
    return true;
  }

  async updateUserPlan(userId: string, plan: "basic" | "premium") {
    await this.apiService.put(`/admin/users/${userId}/plan`, { plan });
    return true;
  }

  async updateUserSede(userId: string, sedeId: number) {
    try {
      await this.apiService.put(`/admin/users/${userId}/sede`, { sedeId });
    } catch (error: any) {
      if (error.status === 400) {
        throw new Error(
          "El usuario tiene clases o rutinas asociadas a esta sede"
        );
      } else {
        throw new Error("Error al actualizar la sede del usuario");
      }
    }
    return true;
  }
}

export default new UserService();
