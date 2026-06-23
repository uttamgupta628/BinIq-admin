import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DatePickerWithRange } from "../components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
  ScatterChart,
  Scatter,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
  Calendar,
  Users,
  Store,
  DollarSign,
  Star,
} from "lucide-react";

interface AnalyticsData {
  userMetrics: any[];
  revenueMetrics: any[];
  engagementMetrics: any[];
  geographicData: any[];
  performanceData: any[];
  userGrowth: any[];
  revenueGrowth: any[];
}

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userMetrics: [],
    userGrowth: [],
    revenueMetrics: [],
    engagementMetrics: [],
    geographicData: [],
    performanceData: [],
    revenueGrowth: [],
  });

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line");
  const [selectedMetric, setSelectedMetric] = useState<string>("newUsers");
  const [userCounts, setUserCounts] = useState({
    total_users: 0,
    resellers: 0,
    store_owners: 0,
    monthly_stats: {
      current_month_users: 0,
      previous_month_users: 0,
      percentage_change: 0,
    },
  });
  const [stats, setStats] = useState({
    revenue: {
      totalRevenue: 0,
      monthlyIncreasePercentage: 0,
    },
    quickStats: {
      premiumUsers: {
        count: 0,
        percentage: 0,
      },
      averageRating: 0,
      pendingReplies: 0,
      activeSubscriptions: 0,
      newUsersToday: 0,
    },
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = API_CONFIG.BASE_URL;
      const fromDate = dateRange.from.toISOString();
      const toDate = dateRange.to.toISOString();

      // Fetch comprehensive analytics data
      const [
        userCountRes,
        revenueRes,
        quickStatsRes,
        analyticsRes,
        revenueAnalyticsRes,
        conversionRes,
      ] = await Promise.all([
        AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.ALL_USERS}`,
        ),
        AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.STATS.REVENUE}`,
        ),
        AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.STATS.QUICK_STATS}`,
        ),
        AuthService.makeAuthenticatedRequest(
          `${baseUrl}/api/users/user-analytics?from=${fromDate}&to=${toDate}`,
        ),
        AuthService.makeAuthenticatedRequest(
          `${baseUrl}/api/subscriptions/revenue-analytics`,
        ),
        AuthService.makeAuthenticatedRequest(
          `${baseUrl}/api/stats/conversionRate`,
        ),
        // AuthService.makeAuthenticatedRequest(
        //   `${baseUrl}${API_CONFIG.ENDPOINTS.ANALYTICS.USER_GROWTH}?from=${fromDate}&to=${toDate}`,
        // ),
        // AuthService.makeAuthenticatedRequest(
        //   `${baseUrl}${API_CONFIG.ENDPOINTS.ANALYTICS.REVENUE_BREAKDOWN}?from=${fromDate}&to=${toDate}`,
        // ),
        // AuthService.makeAuthenticatedRequest(
        //   `${baseUrl}/api/analytics/engagement?from=${fromDate}&to=${toDate}`,
        // ),
        // AuthService.makeAuthenticatedRequest(
        //   `${baseUrl}/api/analytics/geographic?from=${fromDate}&to=${toDate}`,
        // ),
        // AuthService.makeAuthenticatedRequest(
        //   `${baseUrl}/api/analytics/performance?from=${fromDate}&to=${toDate}`,
        // ),
      ]);

      // Check responses
      // const responses = [
      //   userMetricsRes,
      //   revenueMetricsRes,
      //   engagementRes,
      //   geoDataRes,
      //   performanceRes,
      // ];
      // const failedResponse = responses.find((res) => !res.ok);
      // if (failedResponse) {
      //   throw new Error(`HTTP error! status: ${failedResponse.status}`);
      // }

      // // Parse data
      // const userData = await userMetricsRes.json();
      // const revenueData = await revenueMetricsRes.json();
      // const engagementData = await engagementRes.json();
      // const geoData = await geoDataRes.json();
      // const performanceData = await performanceRes.json();
      const userCountData = await userCountRes.json();
      const revenueData = await revenueRes.json();
      const quickStatsData = await quickStatsRes.json();
      const analyticsResponse = await analyticsRes.json();
      const revenueAnalyticsData = await revenueAnalyticsRes.json();
      const conversionData = await conversionRes.json();

      setAnalyticsData({
        userMetrics: analyticsResponse.data.userMetrics || [],
        userGrowth: analyticsResponse.data.userGrowth || [],
        revenueMetrics: revenueAnalyticsData.data.revenueByCategory || [],
        revenueGrowth: revenueAnalyticsData.data.revenueGrowth || [],
        engagementMetrics: [
          {
            metric: "Active Users",
            value: userCountData.data.total_users,
            change: userCountData.data.monthly_stats.percentage_change,
          },
          {
            metric: "Conversion Rate",
            value: conversionData.data.conversionRate,
            change: 0,
          },
        ],
        geographicData: generateMockGeographicData(),
        performanceData: generateMockPerformanceData(),
      });
      setUserCounts(
        userCountData.data || {
          total_users: 0,
          resellers: 0,
          store_owners: 0,
          monthly_stats: {
            current_month_users: 0,
            previous_month_users: 0,
            percentage_change: 0,
          },
        },
      );
      setStats({
        revenue: revenueData.data,
        quickStats: {
          ...quickStatsData.data,
          premiumUsers: {
            count: conversionData.data.paidUsers,
            percentage: conversionData.data.conversionRate,
          },
        },
      });
    } catch (err: any) {
      console.error("Error fetching analytics data:", err);
      setError("Failed to load analytics data. Using demo data.");

      // Load mock data for demo
      // setAnalyticsData({
      //   userMetrics: generateMockUserMetrics(),
      //   revenueMetrics: generateMockRevenueMetrics(),
      //   engagementMetrics: generateMockEngagementMetrics(),
      //   geographicData: generateMockGeographicData(),
      //   performanceData: generateMockPerformanceData(),
      // });
    } finally {
      setIsLoading(false);
    }
  };
  const percentage = userCounts.monthly_stats.percentage_change;
  const isPositive = percentage >= 0;

  // Mock data generators
  const generateMockUserMetrics = () => [
    { date: "2024-01-01", newUsers: 45, activeUsers: 320, retention: 78 },
    { date: "2024-01-02", newUsers: 52, activeUsers: 345, retention: 82 },
    { date: "2024-01-03", newUsers: 38, activeUsers: 298, retention: 75 },
    { date: "2024-01-04", newUsers: 67, activeUsers: 412, retention: 85 },
    { date: "2024-01-05", newUsers: 71, activeUsers: 456, retention: 88 },
    { date: "2024-01-06", newUsers: 59, activeUsers: 398, retention: 80 },
    { date: "2024-01-07", newUsers: 63, activeUsers: 425, retention: 83 },
  ];

  const generateMockRevenueMetrics = () => [
    { category: "Premium Subscriptions", revenue: 25000, growth: 15.2 },
    { category: "Partnership Fees", revenue: 12000, growth: 8.7 },
    { category: "Advertisement", revenue: 8500, growth: 22.1 },
    { category: "Commission", revenue: 15500, growth: 11.4 },
    { category: "API Access", revenue: 5000, growth: 35.6 },
  ];

  const generateMockEngagementMetrics = () => [
    { metric: "Daily Active Users", value: 0, change: 0 },
    // { metric: "Session Duration", value: 8.5, change: 5.2 },
    // { metric: "Page Views", value: 15600, change: 18.9 },
    // { metric: "Bounce Rate", value: 32.1, change: -8.4 },
    { metric: "Conversion Rate", value: 0, change: 0 },
  ];

  const generateMockGeographicData = () => [
    { region: "North America", users: 1250, revenue: 45000 },
    { region: "Europe", users: 980, revenue: 35000 },
    { region: "Asia Pacific", users: 650, revenue: 22000 },
    { region: "Latin America", users: 420, revenue: 15000 },
    { region: "Middle East", users: 280, revenue: 12000 },
    { region: "Africa", users: 180, revenue: 8000 },
  ];

  const generateMockPerformanceData = () => [
    { name: "API Response Time", value: 125, target: 100, status: "warning" },
    { name: "Uptime", value: 99.8, target: 99.5, status: "good" },
    { name: "Error Rate", value: 0.2, target: 0.5, status: "good" },
    { name: "Database Performance", value: 89, target: 85, status: "good" },
    { name: "CDN Performance", value: 95, target: 90, status: "good" },
  ];

  const exportData = async (format: "csv" | "excel") => {
    try {
      const response = await AuthService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}/api/export/analytics?format=${format}&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`,
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const extension = format === "excel" ? "xlsx" : "csv";

      link.download = `analytics_report_${
        new Date().toISOString().split("T")[0]
      }.${extension}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      // toast({
      //   title: "Export Successful",
      //   description: `Analytics exported as ${extension.toUpperCase()}`,
      // });
    } catch (err) {
      console.error("Error exporting analytics:", err);

      // toast({
      //   title: "Export Failed",
      //   description: "Unable to export analytics data.",
      //   variant: "destructive",
      // });
    }
  };

  const renderChart = (data: any[], dataKey: string) => {
    const commonProps = {
      width: "100%",
      height: 300,
      data,
    };

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey={dataKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="#8884d8"
                fill="#8884d8"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground">
              Deep insights and performance metrics for your platform
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Button variant="outline" onClick={() => exportData("csv")}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => exportData("excel")}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-orange-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Chart Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Chart Type:</span>
                <Select
                  value={chartType}
                  onValueChange={(value: any) => setChartType(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Metric:</span>
                <Select
                  value={selectedMetric}
                  onValueChange={setSelectedMetric}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newUsers">New Users</SelectItem>
                    <SelectItem value="activeUsers">Active Users</SelectItem>
                    <SelectItem value="retention">Retention Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            {/* <TabsTrigger value="performance">Performance</TabsTrigger> */}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold">
                        {userCounts.total_users.toLocaleString()}
                      </p>
                      <p
                        className={`text-xs ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {percentage}% from last month
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
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold">
                        ${stats.revenue.totalRevenue.toLocaleString()}
                      </p>

                      {/* <p
                        className={`text-xs ${
                          stats.revenue.monthlyIncreasePercentage >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stats.revenue.monthlyIncreasePercentage >= 0
                          ? "+"
                          : ""}
                        {stats.revenue.monthlyIncreasePercentage}% from last
                        month
                      </p> */}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Conversion Rate
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.quickStats.premiumUsers.percentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.quickStats.premiumUsers.count} premium users
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Avg Rating
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.quickStats.averageRating}
                      </p>
                      <p className="text-xs text-green-600">
                        +0.2 from last month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Metrics Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart(analyticsData.userMetrics, selectedMetric)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>

                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.geographicData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.revenueMetrics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, revenue }) =>
                          `${category}: $${revenue.toLocaleString()}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                        name="category"
                      >
                        {analyticsData.revenueMetrics.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${index * 45}, 70%, 60%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Growth </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.revenueGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.engagementMetrics.map((metric, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {metric.metric}
                      </p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      {metric.change !== 0 && (
                      <p
                        className={`text-xs ${metric.change > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {metric.change > 0 ? "+" : ""}
                        {metric.change}% from last period
                      </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.performanceData.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">{item.name}</p>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            item.status === "good"
                              ? "bg-green-500"
                              : item.status === "warning"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Current</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Target</span>
                          <span>{item.target}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent> */}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
