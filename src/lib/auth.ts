import { API_CONFIG } from "./api";

interface UserDetails {
  _id: string;
  full_name: string;
  store_name: string | null;
  email: string;
  role: number;
  dob: string | null;
  gender: string | null;
  phone_number: string | null;
  address: string | null;
  expertise_level: string | null;
  profile_image: string | null;
  subscription: string;
  subscription_start: string | null;
  subscription_end: string | null;
  card_information: {
    card_number: string | null;
    cardholder_name: string | null;
    expiry_month: string | null;
    expiry_year: string | null;
    cvc: string | null;
    _id: string;
  };
  created_at: string;
  updated_at: string;
  __v: number;
}

interface LoginResponse {
  token: string;
  user_details: UserDetails;
}

interface LoginRequest {
  email: string;
  password: string;
}

export class AuthService {
  private static readonly TOKEN_KEY = "biniq_admin_token";
  private static readonly USER_KEY = "biniq_admin_user";

  // Single source of truth — reads from api.ts, no more hardcoded URL here
  private static get API_BASE_URL(): string {
    return API_CONFIG.BASE_URL;
  }

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...credentials,
          role: 1, // 1 = Admin
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Full error response:", errorData);
        throw new Error(errorData.message || "Login failed");
      }

      const data: LoginResponse = await response.json();

      this.setToken(data.token);
      this.setUser(data.user_details);

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setUser(user: UserDetails): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): UserDetails | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    if (!token || !user) return false;
    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  static async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    try {
      const headers = {
        ...this.getAuthHeaders(),
        ...options.headers,
      };

      console.log("Making request to:", url);
      console.log("Using API base URL:", this.API_BASE_URL);

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        this.logout();
        window.location.href = "/login";
      }

      return response;
    } catch (error) {
      console.error("Request failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to connect to API at ${url}. Error: ${errorMessage}`);
    }
  }
}

export type { UserDetails, LoginResponse, LoginRequest };