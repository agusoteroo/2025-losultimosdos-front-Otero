// src/services/badge.service.ts
import apiService from "./api.service";
import { UserBadgeStatus } from "@/types";

class BadgeService {
  async getUserBadges(token: string | null): Promise<UserBadgeStatus[]> {
    if (!token) throw new Error("No auth token");
    const data = await apiService.get("/user/badges", token);
    return (data.items ?? []) as UserBadgeStatus[];
  }

  // NUEVO: llama al endpoint que evalúa y devuelve los nuevos
  async evaluateBadges(token: string | null): Promise<UserBadgeStatus[]> {
    if (!token) throw new Error("No auth token");
    const data = await apiService.post("/user/badges/evaluate", {}, token);
    return (data.items ?? []) as UserBadgeStatus[];
  }
}

export default new BadgeService();
