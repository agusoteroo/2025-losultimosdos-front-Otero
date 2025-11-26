import apiService from "./api.service";
import {
  LeaderboardPeriod,
  UserLeaderboardItem,
  SedeLeaderboardItem,
} from "@/types";

class GamificationService {
  private readonly api = apiService;

  async getUserLeaderboard(params: {
    period?: LeaderboardPeriod;
    sedeId?: number;
  }): Promise<UserLeaderboardItem[]> {
    const searchParams = new URLSearchParams();
    if (params.period) searchParams.set("period", params.period);
    if (params.sedeId) searchParams.set("sedeId", String(params.sedeId));

    const query = searchParams.toString();
    const url = query ? `/leaderboard/users?${query}` : `/leaderboard/users`;

    const data = await this.api.get(url);
    return (data.items ?? []) as UserLeaderboardItem[];
  }

  async getSedeLeaderboard(params: {
    period?: LeaderboardPeriod;
  }): Promise<SedeLeaderboardItem[]> {
    const searchParams = new URLSearchParams();
    if (params.period) searchParams.set("period", params.period);

    const query = searchParams.toString();
    const url = query ? `/leaderboard/sedes?${query}` : `/leaderboard/sedes`;

    const data = await this.api.get(url);
    return (data.items ?? []) as SedeLeaderboardItem[];
  }
}

export default new GamificationService();
