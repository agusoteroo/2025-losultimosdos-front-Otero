type TokenGetter = () => Promise<string | null>;

interface ValidationDetail {
  path: string;
  message: string;
}

export class ApiValidationError extends Error {
  public details: ValidationDetail[];
  public status?: number;
  public payload?: Record<string, any>;

  constructor(
    details: ValidationDetail[],
    status?: number,
    payload?: Record<string, any>
  ) {
    super("Validation failed " + status);
    this.details = details;
    this.status = status;
    this.payload = payload;
  }
}

export class ApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL;
  private tokenGetter: TokenGetter | null = null;

  setTokenGetter(getter: TokenGetter): void {
    this.tokenGetter = getter;
  }

  private async getAuthToken(): Promise<string> {
    if (this.tokenGetter) {
      const token = await this.tokenGetter();
      if (token) return token;
    }

    throw new Error("No authentication token available");
  }

  async post<T = any>(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<T> {
    const authToken = await this.getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + authToken,
    };

    const response = await fetch(this.baseUrl + endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      headers,
    });
    if (response.status >= 500) {
      console.log(response.body, response.status);
      throw new Error("Server error");
    } else if (response.status >= 400) {
      const payload = await response.json();
      const { details } = payload;
      throw new ApiValidationError(details, response.status, payload);
    }
    const data = await response.json();
    return data;
  }

  async get<T = any>(endpoint: string): Promise<T> {
    const authToken = await this.getAuthToken();
    const headers = {
      Authorization: "Bearer " + authToken,
    };
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    const response = await fetch(`${this.baseUrl}${normalizedEndpoint}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    if (response.status >= 500) {
      console.log(response.body, response.status);
      throw new Error("Server error");
    } else if (response.status >= 400) {
      const payload = await response.json();
      const { details } = payload;
      throw new ApiValidationError(details, response.status, payload);
    }
    const data = await response.json();
    return data;
  }

  async put<T = any>(
    endpoint: string,
    body: Record<string, unknown>,
    additionalHeaders?: Record<string, string>
  ): Promise<T> {
    const authToken = await this.getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + authToken,
      "ngrok-skip-browser-warning": "1",
      ...additionalHeaders,
    };

    const response = await fetch(this.baseUrl + endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      headers,
    });

    if (response.status >= 500) {
      console.log(response.body, response.status);
      throw new Error("Server error");
    } else if (response.status >= 400) {
      const payload = await response.json();
      const { error, details } = payload;
      console.log("error", error, details);
      throw new ApiValidationError(details, response.status, payload);
    }
    const data = await response.json();
    return data;
  }

  async delete(endpoint: string) {
    const authToken = await this.getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + authToken,
      "ngrok-skip-browser-warning": "1",
    };
    const response = await fetch(this.baseUrl + endpoint, {
      method: "DELETE",
      headers,
    });
    if (response.status >= 500) {
      console.log(response.body, response.status);
      throw new Error("Server error");
    } else if (response.status >= 400) {
      const payload = await response.json();
      const { details } = payload;
      throw new ApiValidationError(details, response.status, payload);
    }
    return response;
  }
}

const apiService = new ApiService();
export default apiService;
