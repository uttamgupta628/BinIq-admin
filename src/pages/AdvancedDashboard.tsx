import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Store,
  CreditCard,
  TrendingUp,
  Target,
  Activity,
  MessageSquare,
  Calendar,
  DollarSign,
  UserCheck,
  ShoppingCart,
  Award,
} from "lucide-react";

// Interface definitions
interface UserGrowthData {
  month: string;
  paidUsers: number;
  storeOwners: number;
  resellers: number;
}

interface RevenueBreakdown {
  category: string;
  amount: number;
  color: string;
}

interface SentimentData {
  month: string;
  positive: number;
  neutral: number;
  negative: number;
}

interface GoalsProgress {
  userGoal: number;
  userActual: number;
  revenueGoal: number;
  revenueActual: number;
}

interface TrendingItem {
  id: string;
  name: string;
  type: "store" | "reseller";
  engagementScore: number;
  profilePicture?: string;
  sales?: number;
  views?: number;
}

interface ActivityItem {
  id: string;
  type: "sign-up" | "purchase" | "feedback" | "upgrade";
  user: string;
  timestamp: string;
  details: string;
}

export default function AdvancedDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<string>("all");

  // Data states
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown[]>(
    [],
  );
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [goalsProgress, setGoalsProgress] = useState<GoalsProgress>({
    userGoal: 1000,
    userActual: 0,
    revenueGoal: 50000,
    revenueActual: 0,
  });
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [filteredActivity, setFilteredActivity] = useState<ActivityItem[]>([]);
  const [userCounts, setUserCounts] = useState({
    total_users: 0,
    resellers: 0,
    store_owners: 0,
  });
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    monthlyIncreasePercentage: 0,
  });
  // Quick stats
  const [quickStats, setQuickStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    avgSentiment: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Filter recent activity based on selected filter
    if (activityFilter === "all") {
      setFilteredActivity(recentActivity);
    } else {
      setFilteredActivity(
        recentActivity.filter((item) => item.type === activityFilter),
      );
    }
  }, [recentActivity, activityFilter]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = API_CONFIG.BASE_URL;

      // Helper function to safely fetch data with fallback
      const safeApiCall = async (url: string, fallback: any) => {
        try {
          const response = await AuthService.makeAuthenticatedRequest(url);
          if (response.ok) {
            const data = await response.json();
            return data.data || fallback;
          }
          // Silently return fallback for expected 404s
          return fallback;
        } catch (error) {
          // Don't log network errors as they're expected when APIs don't exist
          if (!error.message.includes("Failed to fetch")) {
            console.warn(
              `API call failed for ${url}, using fallback data:`,
              error,
            );
          }
          return fallback;
        }
      };

      // Fetch data with individual error handling and fallbacks
      const [
        userGrowthData,
        trendsData,
        revenueData,
        sentimentData,
        goalsData,
        trendingData,
        quickStatsData,
        activityData,
        userCountData,
        revenueStatsData,
      ] = await Promise.all([
        safeApiCall(`${baseUrl}${API_CONFIG.ENDPOINTS.STATS.USER_GROWTH}`, []),
        safeApiCall(
          `${baseUrl}${API_CONFIG.ENDPOINTS.ANALYTICS.STORE_RESELLER_TRENDS}`,
          [],
        ),
        safeApiCall(
          `${baseUrl}${API_CONFIG.ENDPOINTS.ANALYTICS.REVENUE_BREAKDOWN}`,
          generateMockRevenueBreakdown(),
        ),
        safeApiCall(
          `${baseUrl}${API_CONFIG.ENDPOINTS.ANALYTICS.SENTIMENT_TRENDS}`,
          generateMockSentimentData(),
        ),
        safeApiCall(
          `${baseUrl}${API_CONFIG.ENDPOINTS.ANALYTICS.GOALS_PROGRESS}`,
          {
            userGoal: 1000,
            userActual: 756,
            revenueGoal: 50000,
            revenueActual: 42500,
          },
        ),
        safeApiCall(`${baseUrl}/api/stores/topPerformers`, []),
        safeApiCall(`${baseUrl}${API_CONFIG.ENDPOINTS.STATS.QUICK_STATS}`, {
          totalUsers: 2456,
          totalRevenue: 125000,
          monthlyGrowth: 12.5,
          avgSentiment: 4.2,
        }),
        safeApiCall(
          `${baseUrl}${API_CONFIG.ENDPOINTS.STATS.RECENT_ACTIVITY}`,
          generateMockActivity(),
        ),
        safeApiCall(`${baseUrl}${API_CONFIG.ENDPOINTS.ALL_USERS}`, {
          total_users: 0,
          resellers: 0,
          store_owners: 0,
        }),
        safeApiCall(`${baseUrl}${API_CONFIG.ENDPOINTS.STATS.REVENUE}`, {
          totalRevenue: 0,
          monthlyIncreasePercentage: 0,
        }),
      ]);

      // Set data (all will have fallbacks)
      setUserGrowthData(userGrowthData?.trend || []);

      setQuickStats((prev) => ({
        ...prev,
        monthlyGrowth: userGrowthData?.growthRate || 0,
      }));
      setRevenueBreakdown(revenueData);
      setSentimentData(sentimentData);
      setGoalsProgress({
        userGoal: goalsData.userGoal || 1000,
        userActual: userCountData.total_users || 0,
        revenueGoal: goalsData.revenueGoal || 50000,
        revenueActual: revenueStatsData.totalRevenue || 0,
      });
      const mappedStores =
        trendingData?.map((store: any) => ({
          id: store._id,
          name: store.store_name,
          type: "store",
          engagementScore: store.popularity_score || 0,
          views: store.views_count || 0,
          followers: store.followers || 0, // using followers instead of views
        })) || [];

      setTrendingItems(mappedStores);
      setRecentActivity(activityData);
      setQuickStats({
        totalUsers: userCountData.total_users || 0,
        totalRevenue: revenueStatsData.totalRevenue || 0,
        monthlyGrowth: userCountData.monthly_stats?.percentage_change || 0,
        avgSentiment: quickStatsData.averageRating || 0,
      });
      setUserCounts(userCountData);
      // setUserCounts(userCountData);

      setQuickStats((prev) => ({
        ...prev,
        totalUsers: userCountData.total_users,
        monthlyGrowth: userCountData.monthly_stats?.percentage_change || 0,
      }));
      setRevenueStats(revenueStatsData);

      setQuickStats((prev) => ({
        ...prev,
        totalRevenue: revenueStatsData.totalRevenue,
      }));

      // Show a subtle info message that we're using demo data
      setError(
        "API endpoints are not yet implemented. Displaying demo data for preview purposes.",
      );
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Using demo data.");

      // Load mock data for demo
      setUserGrowthData(generateMockUserGrowth());
      setRevenueBreakdown(generateMockRevenueBreakdown());
      setSentimentData(generateMockSentimentData());
      setGoalsProgress({
        userGoal: 1000,
        userActual: 756,
        revenueGoal: 50000,
        revenueActual: 42500,
      });
      setTrendingItems(generateMockTrending());
      setRecentActivity(generateMockActivity());
      setQuickStats({
        totalUsers: 2456,
        totalRevenue: 125000,
        monthlyGrowth: 12.5,
        avgSentiment: 4.2,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data generators for demo purposes
  const generateMockUserGrowth = (): UserGrowthData[] => [
    { month: "Jan", paidUsers: 120, storeOwners: 45, resellers: 75 },
    { month: "Feb", paidUsers: 150, storeOwners: 52, resellers: 98 },
    { month: "Mar", paidUsers: 180, storeOwners: 61, resellers: 119 },
    { month: "Apr", paidUsers: 220, storeOwners: 74, resellers: 146 },
    { month: "May", paidUsers: 280, storeOwners: 89, resellers: 191 },
    { month: "Jun", paidUsers: 340, storeOwners: 105, resellers: 235 },
  ];

  const generateMockRevenueBreakdown = (): RevenueBreakdown[] => [
    { category: "Subscriptions", amount: 45000, color: "#8884d8" },
    { category: "Premium Features", amount: 25000, color: "#82ca9d" },
    { category: "Partnership", amount: 15000, color: "#ffc658" },
    { category: "Advertisement", amount: 8000, color: "#ff7300" },
    { category: "Other", amount: 7000, color: "#8dd1e1" },
  ];

  const generateMockSentimentData = (): SentimentData[] => [
    { month: "Jan", positive: 65, neutral: 25, negative: 10 },
    { month: "Feb", positive: 70, neutral: 22, negative: 8 },
    { month: "Mar", positive: 68, neutral: 24, negative: 8 },
    { month: "Apr", positive: 75, neutral: 20, negative: 5 },
    { month: "May", positive: 72, neutral: 23, negative: 5 },
    { month: "Jun", positive: 78, neutral: 18, negative: 4 },
  ];

  const generateMockTrending = (): TrendingItem[] => [
    {
      id: "1",
      name: "Green Valley Market",
      type: "store",
      engagementScore: 95,
      sales: 1250,
      views: 5600,
    },
    {
      id: "2",
      name: "John's Electronics",
      type: "store",
      engagementScore: 89,
      sales: 980,
      views: 4200,
    },
    {
      id: "3",
      name: "Sarah Johnson",
      type: "reseller",
      engagementScore: 87,
      sales: 750,
      views: 3800,
    },
    {
      id: "4",
      name: "Tech Solutions Hub",
      type: "store",
      engagementScore: 84,
      sales: 680,
      views: 3200,
    },
    {
      id: "5",
      name: "Mike Chen",
      type: "reseller",
      engagementScore: 82,
      sales: 620,
      views: 2900,
    },
  ];

  const generateMockActivity = (): ActivityItem[] => [
    {
      id: "1",
      type: "sign-up",
      user: "Alice Smith",
      timestamp: "2024-01-20T10:30:00Z",
      details: "New store owner registered",
    },
    {
      id: "2",
      type: "purchase",
      user: "Bob Wilson",
      timestamp: "2024-01-20T09:15:00Z",
      details: "Premium subscription purchased",
    },
    {
      id: "3",
      type: "feedback",
      user: "Carol Brown",
      timestamp: "2024-01-20T08:45:00Z",
      details: "5-star rating submitted",
    },
    {
      id: "4",
      type: "upgrade",
      user: "David Lee",
      timestamp: "2024-01-19T16:20:00Z",
      details: "Upgraded to annual plan",
    },
    {
      id: "5",
      type: "sign-up",
      user: "Eva Davis",
      timestamp: "2024-01-19T14:10:00Z",
      details: "New reseller registered",
    },
  ];

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights and performance metrics
            </p>
          </div>
          <Button variant="outline" onClick={fetchDashboardData}>
            Refresh Data
          </Button>
        </div>

        {/* Info Display */}
        {/* {error && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-600">
                    <strong>Demo Mode:</strong> {error}
                  </p>
                </div>
              </CardContent>
            </Card>
          )} */}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">
                    {(userCounts?.total_users || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">
                    +{userCounts?.monthly_stats?.percentage_change || 0}% this
                    month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${(revenueStats?.totalRevenue || 0).toLocaleString()}
                  </p>
                  <p
                    className={`text-xs ${
                      (revenueStats?.monthlyIncreasePercentage || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {revenueStats?.monthlyIncreasePercentage >= 0 ? "+" : ""}
                    {revenueStats?.monthlyIncreasePercentage || 0}% this month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                  <p className="text-2xl font-bold">
                    {quickStats.monthlyGrowth || 0}%
                  </p>
                  <p className="text-xs text-green-600">Monthly increase</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Sentiment</p>
                  <p className="text-2xl font-bold">
                    {quickStats?.avgSentiment || 0}/5
                  </p>
                  <p className="text-xs text-green-600">User satisfaction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                User Acquisition Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {goalsProgress?.userActual || 0} /{" "}
                    {goalsProgress?.userGoal || 0}
                  </span>
                </div>
                <Progress
                  value={
                    goalsProgress?.userActual && goalsProgress?.userGoal
                      ? (goalsProgress.userActual / goalsProgress.userGoal) *
                        100
                      : 0
                  }
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  {goalsProgress?.userActual && goalsProgress?.userGoal
                    ? Math.round(
                        (goalsProgress.userActual / goalsProgress.userGoal) *
                          100,
                      )
                    : 0}
                  % of monthly goal achieved
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    ${(goalsProgress?.revenueActual || 0).toLocaleString()} / $
                    {(goalsProgress?.revenueGoal || 0).toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={
                    goalsProgress?.revenueActual && goalsProgress?.revenueGoal
                      ? (goalsProgress.revenueActual /
                          goalsProgress.revenueGoal) *
                        100
                      : 0
                  }
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  {goalsProgress?.revenueActual && goalsProgress?.revenueGoal
                    ? Math.round(
                        (goalsProgress.revenueActual /
                          goalsProgress.revenueGoal) *
                          100,
                      )
                    : 0}
                  % of monthly goal achieved
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="paidUsers"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="storeOwners"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="resellers"
                    stroke="#ffc658"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `$${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card> */}

          {/* Sentiment Trends */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Feedback Sentiment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="positive"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                  />
                  <Area
                    type="monotone"
                    dataKey="neutral"
                    stackId="1"
                    stroke="#ffc658"
                    fill="#ffc658"
                  />
                  <Area
                    type="monotone"
                    dataKey="negative"
                    stackId="1"
                    stroke="#ff7300"
                    fill="#ff7300"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card> */}

          {/* Enhanced Trending Stores & Resellers Widget */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Top Performers This Month
                </div>
                <Badge
                  variant="outline"
                  className="bg-gradient-to-r from-purple-50 to-pink-50"
                >
                  Live Rankings
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-md ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200"
                        : index === 1
                          ? "bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200"
                          : index === 2
                            ? "bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200"
                            : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0
                            ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                            : index === 1
                              ? "bg-gradient-to-r from-gray-400 to-slate-500"
                              : index === 2
                                ? "bg-gradient-to-r from-orange-400 to-red-500"
                                : "bg-gradient-to-r from-purple-400 to-pink-400"
                        }`}
                      >
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              item.type === "store" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.type === "store" ? "🏪 Store" : "👤 Reseller"}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-600">
                              {item.engagementScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-sm font-bold text-green-600">
                            {item.views || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Views
                          </span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-sm font-medium text-blue-600">
                            {item.followers || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Followers
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats for Trending */}
              {/* <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">
                      {
                        trendingItems.filter((item) => item.type === "store")
                          .length
                      }
                    </p>
                    <p className="text-xs text-blue-600">Top Stores</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">
                      {
                        trendingItems.filter((item) => item.type === "reseller")
                          .length
                      }
                    </p>
                    <p className="text-xs text-purple-600">Top Resellers</p>
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="w-5 h-5 text-blue-600" />
                Store Champion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendingItems.filter((item) => item.type === "store")[0] && (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {
                        trendingItems.filter((item) => item.type === "store")[0]
                          ?.name
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Leading Store This Month
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-sm font-semibold text-blue-600">
                        {trendingItems.filter(
                          (item) => item.type === "store",
                        )[0]?.sales || 0}
                      </p>
                      <p className="text-xs text-blue-600">Sales</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-sm font-semibold text-green-600">
                        {trendingItems.filter(
                          (item) => item.type === "store",
                        )[0]?.engagementScore || 0}
                      </p>
                      <p className="text-xs text-green-600">Score</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card> */}
        </div>

        {/* Trending Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Store Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="w-5 h-5 text-blue-600" />
                Store Champion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendingItems.filter((item) => item.type === "store")[0] && (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {
                        trendingItems.filter((item) => item.type === "store")[0]
                          ?.name
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Leading Store This Month
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-sm font-semibold text-blue-600">
                        {trendingItems.filter(
                          (item) => item.type === "store",
                        )[0]?.views || 0}
                      </p>
                      <p className="text-xs text-blue-600">Views</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-sm font-semibold text-green-600">
                        {trendingItems.filter(
                          (item) => item.type === "store",
                        )[0]?.engagementScore || 0}
                      </p>
                      <p className="text-xs text-green-600">Score</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Reseller Performance */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-purple-600" />
                Reseller Champion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendingItems.filter((item) => item.type === "reseller")[0] && (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🌟</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {
                        trendingItems.filter(
                          (item) => item.type === "reseller",
                        )[0]?.name
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Top Reseller This Month
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-purple-50 p-2 rounded">
                      <p className="text-sm font-semibold text-purple-600">
                        {trendingItems.filter(
                          (item) => item.type === "reseller",
                        )[0]?.sales || 0}
                      </p>
                      <p className="text-xs text-purple-600">Sales</p>
                    </div>
                    <div className="bg-pink-50 p-2 rounded">
                      <p className="text-sm font-semibold text-pink-600">
                        {trendingItems.filter(
                          (item) => item.type === "reseller",
                        )[0]?.engagementScore || 0}
                      </p>
                      <p className="text-xs text-pink-600">Score</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card> */}

          {/* Monthly Achievements */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-yellow-600" />
                Monthly Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-sm font-medium">Highest Engagement</p>
                    <p className="text-xs text-muted-foreground">
                      {trendingItems[0]?.name} - Score:{" "}
                      {trendingItems[0]?.engagementScore}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                  <span className="text-lg">💰</span>
                  <div>
                    <p className="text-sm font-medium">Most Sales</p>
                    <p className="text-xs text-muted-foreground">
                      {
                        trendingItems.reduce((prev, curr) =>
                          (prev.sales || 0) > (curr.sales || 0) ? prev : curr,
                        ).name
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                  <span className="text-lg">👁️</span>
                  <div>
                    <p className="text-sm font-medium">Most Viewed</p>
                    <p className="text-xs text-muted-foreground">
                      {
                        trendingItems.reduce((prev, curr) =>
                          (prev.views || 0) > (curr.views || 0) ? prev : curr,
                        ).name
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Recent Activity */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </div>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="sign-up">Sign-ups</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="upgrade">Upgrades</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "sign-up"
                          ? "bg-blue-500"
                          : activity.type === "purchase"
                            ? "bg-green-500"
                            : activity.type === "feedback"
                              ? "bg-yellow-500"
                              : "bg-purple-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.details}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{new Date(activity.timestamp).toLocaleDateString()}</p>
                    <p>{new Date(activity.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </AdminLayout>
  );
}
