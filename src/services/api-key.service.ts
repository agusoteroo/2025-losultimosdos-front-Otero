import { ApiKey } from "@/types";
import apiService from "./api.service";

const API_KEY_ENDPOINT = "/api-keys";

class ApiKeyService {
  async generateApiKey(): Promise<ApiKey> {
    try {
      const response = await apiService.post<ApiKey>(API_KEY_ENDPOINT, {});
      return response;
    } catch (error) {
      console.error("Error generating API key:", error);
      throw error;
    }
  }

  async getApiKey(): Promise<ApiKey | null> {
    try {
      const response = await apiService.get(API_KEY_ENDPOINT);
      return response;
    } catch (error) {
      console.error("Error fetching API key:", error);
      throw error;
    }
  }

  async regenerateApiKey(keyId: string): Promise<ApiKey> {
    try {
      const response = await apiService.put<ApiKey>(
        `${API_KEY_ENDPOINT}/${keyId}/regenerate`,
        {} as Record<string, unknown>
      );
      return response;
    } catch (error) {
      console.error("Error regenerating API key:", error);
      throw error;
    }
  }

  async toggleApiKeyStatus(keyId: string, isActive: boolean): Promise<ApiKey> {
    try {
      const response = await apiService.put<ApiKey>(
        `${API_KEY_ENDPOINT}/${keyId}`,
        { isActive }
      );
      return response;
    } catch (error) {
      console.error("Error toggling API key status:", error);
      throw error;
    }
  }

  async deleteApiKey(keyId: string): Promise<void> {
    try {
      await apiService.delete(`${API_KEY_ENDPOINT}/${keyId}`);
    } catch (error) {
      console.error("Error deleting API key:", error);
      throw error;
    }
  }
}

const apiKeyService = new ApiKeyService();
export default apiKeyService;