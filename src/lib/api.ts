/**
 * API Configuration for binIQ Backend Integration
 * BASE_URL always ends in /api — all ENDPOINTS are relative paths without /api prefix
 */
export const API_CONFIG = {
  BASE_URL: (() => {
    if (window.location.hostname === "localhost") {
      return "https://biniq-backend-nh29.onrender.com/api";
    }
    return "https://biniq-backend-nh29.onrender.com/api"; 
  })(),
  ENDPOINTS: {
    // Authentication
    LOGIN: "/users/login",
    // Users & Store Owners
    ALL_STORE_OWNERS: "/users/all-details-store-owner",
    ALL_RESELLERS: "/users/all-details-resellar",
    DELETE_ACCOUNT: "/users/delete-account",
    APPROVE_STORE_OWNER: "/users/approve-store-owner",
    REJECT_STORE_OWNER: "/users/reject-store-owner",
    ALL_USERS: "/users/user-count",
    USER_METRICS: "/users/user-metrics",
    CHANGE_PASSWORD: "/users/change-password",
    CREATE_STORE_OWNER: "/users/create-store-owner",
    USER_ANALYTICS: "/users/user-analytics",
    // Feedback
    FEEDBACK: "/users/feedback",
    FEEDBACK_REPLY: "/users/feedback/reply",
    FEEDBACK_TRENDS: "/users/feedback/trends",
    // Subscriptions
    SUBSCRIPTIONS: "/subscriptions/all",
    // FAQ
    FAQS: "/faqs",
    // Notifications
    NOTIFICATIONS: "/notifications",
    // Stores
    CREATE_STORE: "/stores",
    BULK_CREATE_STORES: "/stores/bulk-create",
    GET_ALL_STORES: "/stores",
    DELETE_STORE: "/stores/:id",
    DELETE_ALL_STORES: "/stores/all",
    // Store Claims
    CLAIMS_ALL: "/admin/claims",
    CLAIMS_APPROVE: "/admin/claims/:claim_id/approve",
    CLAIMS_REJECT: "/admin/claims/:claim_id/reject",
    // Scans Management
    SCANS: "/scans",
    SCAN_BY_ID: "/scans/:id",
    SCAN_UPDATE: "/scans/:id",
    SCAN_APPROVE_REJECT: "/scans/:id/status",
    SCAN_EXPORT: "/scans/export",
    SCAN_AUDIT: "/scans/:id/audit",
    ALL_SCANS: "/users/all-scans",
    // Store Content Moderation
    STORE_CONTENT: "/stores/:id/content",
    STORE_CONTENT_APPROVE: "/stores/:id/content/approve",
    STORE_CONTENT_ROLLBACK: "/stores/:id/content/rollback",
    STORE_ANALYTICS: "/stores/:id/analytics",
    // Analytics & Trends
    ANALYTICS: {
      STORE_RESELLER_TRENDS: "/analytics/trends",
      REVENUE_BREAKDOWN: "/analytics/revenue-breakdown",
      SENTIMENT_TRENDS: "/analytics/sentiment",
      GOALS_PROGRESS: "/analytics/goals",
    },
    // Reseller Performance
    RESELLER_PERFORMANCE: "/resellers/:id/performance",
    RESELLER_RESOURCES: "/resellers/resources",
    // Feedback Analytics
    FEEDBACK_STATS: "/feedback/stats",
    FEEDBACK_SENTIMENT: "/feedback/sentiment",
    // Locations
    LOCATIONS: "/locations",
    LOCATIONS_VERIFICATION: "/locations/verification",
    // Trending
    TRENDING: "/trending",
    // Partnership Subscriptions
    PARTNERSHIP_SUBSCRIPTIONS: "/partnership-subscriptions",
    ASSIGN_PARTNERSHIP_PLAN: "/subscriptions/admin-assign",
    // Stats
    STATS: {
      PAID_USERS: "/stats/paid-users",
      STORE_OWNERS: "/stats/store-owners",
      RESELLERS: "/stats/resellers",
      REVENUE: "/stats/revenue",
      QUICK_STATS: "/stats/quick-stats",
      RECENT_ACTIVITY: "/stats/recent-activity",
      USER_GROWTH: "/stats/user-growth-trend",
    },
  },
};

export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
}
