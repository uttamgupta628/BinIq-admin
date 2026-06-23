import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import DataTable, { Column } from "../components/ui/DataTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Users,
  Trash2,
  Eye,
  TrendingUp,
  Award,
  BookOpen,
  Play,
  Download,
  ExternalLink,
  Plus,
  Edit3,
  DollarSign,
  ShoppingCart,
  Target,
  Calendar,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";
import { toast } from "../hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Reseller {
  user: {
    _id: string;
    full_name: string;
    email: string;
    role: number;
    phone_number: string | null;
    address: string | null;
    profile_image: string | null;
    expertise_level: string | null;
    subscription: {
      type: string;
      start_date: string;
      end_date: string;
    };
    created_at: string;
    status: "active" | "inactive" | "suspended";
    card_information: {
      card_number: string | null;
      cardholder_name: string | null;
      expiry_month: string | null;
      expiry_year: string | null;
      cvc?: string | null; // optional (you should not display this)
    } | null;
  };
}

interface ResellerPerformance {
  resellerId: string;
  resellerName: string;
  salesData: {
    month: string;
    sales: number;
    revenue: number;
    commission: number;
  }[];
  topProducts: {
    productName: string;
    sales: number;
    revenue: number;
    category: string;
  }[];
  metrics: {
    totalSales: number;
    totalRevenue: number;
    totalCommission: number;
    averageOrderValue: number;
    conversionRate: number;
    customerRetention: number;
  };
  targets: {
    monthlySalesTarget: number;
    monthlyRevenueTarget: number;
    actualSales: number;
    actualRevenue: number;
  };
}

interface TrainingResource {
  _id: string;
  title: string;
  description: string;
  type: "video" | "document" | "link" | "course";
  url: string;
  category: string;
  uploadDate: string;
  uploadedBy: string;
  status: "active" | "inactive";
  completions: number;
  rating: number;
}

interface ResellersResponse {
  success: boolean;
  data: Reseller[];
}

export default function ResellersEnhanced() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(
    null,
  );
  const [resellerPerformance, setResellerPerformance] =
    useState<ResellerPerformance | null>(null);
  const [trainingResources, setTrainingResources] = useState<
    TrainingResource[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false);

  // Form states for adding resources
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    type: "video" as const,
    url: "",
    category: "",
  });

  const generateMockResellers = (): Reseller[] => [
    {
      user: {
        _id: "1",
        full_name: "Alice Johnson",
        email: "alice@example.com",
        role: 3,
        phone_number: "+1234567890",
        address: "123 Main St, Boston, MA",
        profile_image:
          "https://images.unsplash.com/photo-1494790108755-2616b612e47c?w=150",
        expertise_level: "Advanced",
        subscription: {
          type: "Premium",
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
        created_at: "2024-01-15",
        status: "active",
      },
    },
    {
      user: {
        _id: "2",
        full_name: "Bob Wilson",
        email: "bob@example.com",
        role: 3,
        phone_number: "+1987654321",
        address: "456 Oak Ave, Seattle, WA",
        profile_image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        expertise_level: "Intermediate",
        subscription: {
          type: "Basic",
          start_date: "2024-02-01",
          end_date: "2024-08-01",
        },
        created_at: "2024-02-10",
        status: "active",
      },
    },
  ];

  const generateMockPerformance = (
    resellerId: string,
  ): ResellerPerformance => ({
    resellerId,
    resellerName: "Alice Johnson",
    salesData: [
      { month: "Jan", sales: 45, revenue: 12500, commission: 1250 },
      { month: "Feb", sales: 52, revenue: 14800, commission: 1480 },
      { month: "Mar", sales: 38, revenue: 11200, commission: 1120 },
      { month: "Apr", sales: 67, revenue: 18900, commission: 1890 },
      { month: "May", sales: 71, revenue: 20100, commission: 2010 },
      { month: "Jun", sales: 59, revenue: 16800, commission: 1680 },
    ],
    topProducts: [
      {
        productName: "Smartphone Pro",
        sales: 25,
        revenue: 12500,
        category: "Electronics",
      },
      {
        productName: "Wireless Headphones",
        sales: 18,
        revenue: 3600,
        category: "Audio",
      },
      {
        productName: "Smart Watch",
        sales: 15,
        revenue: 4500,
        category: "Wearables",
      },
      {
        productName: "Laptop Stand",
        sales: 12,
        revenue: 960,
        category: "Accessories",
      },
      {
        productName: "USB-C Hub",
        sales: 10,
        revenue: 500,
        category: "Accessories",
      },
    ],
    metrics: {
      totalSales: 332,
      totalRevenue: 94300,
      totalCommission: 9430,
      averageOrderValue: 284,
      conversionRate: 12.5,
      customerRetention: 78,
    },
    targets: {
      monthlySalesTarget: 60,
      monthlyRevenueTarget: 18000,
      actualSales: 59,
      actualRevenue: 16800,
    },
  });

  const generateMockTrainingResources = (): TrainingResource[] => [
    {
      _id: "1",
      title: "Sales Fundamentals",
      description:
        "Learn the basics of effective selling techniques and customer engagement",
      type: "video",
      url: "https://example.com/video1",
      category: "Sales",
      uploadDate: "2024-01-15",
      uploadedBy: "Training Team",
      status: "active",
      completions: 45,
      rating: 4.8,
    },
    {
      _id: "2",
      title: "Product Knowledge Guide",
      description: "Comprehensive guide to all products in our catalog",
      type: "document",
      url: "https://example.com/doc1.pdf",
      category: "Product Knowledge",
      uploadDate: "2024-01-20",
      uploadedBy: "Product Team",
      status: "active",
      completions: 32,
      rating: 4.6,
    },
    {
      _id: "3",
      title: "Customer Service Excellence",
      description: "Advanced customer service techniques and best practices",
      type: "course",
      url: "https://example.com/course1",
      category: "Customer Service",
      uploadDate: "2024-02-01",
      uploadedBy: "HR Team",
      status: "active",
      completions: 28,
      rating: 4.9,
    },
  ];

  useEffect(() => {
    fetchResellers();
    fetchTrainingResources();
  }, []);

  const fetchResellers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.ALL_RESELLERS}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ResellersResponse = await response.json();
      setResellers(data.data || generateMockResellers());
    } catch (err: any) {
      console.error("Error fetching resellers:", err);
      setError("Failed to load resellers. Using demo data.");
      setResellers(generateMockResellers());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrainingResources = async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.RESELLER_RESOURCES}`,
      );

      if (response.ok) {
        const data = await response.json();
        setTrainingResources(data.data || generateMockTrainingResources());
      } else {
        setTrainingResources(generateMockTrainingResources());
      }
    } catch (err) {
      setTrainingResources(generateMockTrainingResources());
    }
  };

  const fetchResellerPerformance = async (resellerId: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.RESELLER_PERFORMANCE.replace(":id", resellerId)}`,
      );

      if (response.ok) {
        const data = await response.json();
        setResellerPerformance(
          data.data || generateMockPerformance(resellerId),
        );
      } else {
        setResellerPerformance(generateMockPerformance(resellerId));
      }
    } catch (err) {
      setResellerPerformance(generateMockPerformance(resellerId));
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.DELETE_ACCOUNT}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Reseller ${action}d successfully.`,
        });
        fetchResellers();
      } else {
        throw new Error(`Failed to ${action} reseller`);
      }
    } catch (err: any) {
      console.error(`Error ${action}ing reseller:`, err);
      toast({
        title: "Error",
        description: `Failed to ${action} reseller.`,
        variant: "destructive",
      });
    }
  };

  const handleAddResource = async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.RESELLER_RESOURCES}`,
        {
          method: "POST",
          body: JSON.stringify(resourceForm),
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Training resource added successfully.",
        });
        setAddResourceDialogOpen(false);
        setResourceForm({
          title: "",
          description: "",
          type: "video",
          url: "",
          category: "",
        });
        fetchTrainingResources();
      } else {
        throw new Error("Failed to add resource");
      }
    } catch (err: any) {
      console.error("Error adding resource:", err);
      toast({
        title: "Error",
        description: "Failed to add training resource.",
        variant: "destructive",
      });
    }
  };
  const handleExport = async (format: "csv" | "excel") => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/api/export/resellers?format=${format}`,
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "excel" ? "resellers.xlsx" : "resellers.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Exported as ${format.toUpperCase()} successfully.`,
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Error",
        description: "Export failed.",
        variant: "destructive",
      });
    }
  };

  const resellersColumns: Column<Reseller>[] = [
    {
      key: "full_name",
      header: "Reseller",
      sortable: true,
      searchable: true,
      render: (_, reseller) => (
        <div className="flex items-center gap-3">
          {/* <img
            src={reseller.user.profile_image || "/placeholder-user.png"}
            alt={reseller.user.full_name}
            className="w-10 h-10 rounded-full object-cover"
            // onError={(e) => {
            //   const target = e.target as HTMLImageElement;
            //   target.src = "/placeholder-user.png";
            // }}
          /> */}
          <div>
            <p className="font-medium">{reseller.user.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {reseller.user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (_, reseller) => (
        <div className="space-y-1">
          {reseller.user.phone_number && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{reseller.user.phone_number}</span>
            </div>
          )}
          {reseller.user.address && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{reseller.user.address}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "expertise_level",
      header: "Expertise Level",
      render: (_, reseller) => (
        <Badge
          variant={
            reseller.user.expertise_level === "Advanced"
              ? "default"
              : reseller.user.expertise_level === "Intermediate"
                ? "secondary"
                : "outline"
          }
        >
          {reseller.user.expertise_level || "Beginner"}
        </Badge>
      ),
    },
    {
      key: "subscription",
      header: "Subscription",
      render: (_, reseller) => {
        const subscription = reseller?.user?.subscription;

        const type =
          subscription && typeof subscription === "object"
            ? subscription.type
            : null;

        return (
          <Badge variant={type === "Premium" ? "default" : "secondary"}>
            {type || "No Subscription"}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (_, reseller) => {
        const status = reseller?.user?.status ?? "inactive";

        return (
          <Badge
            variant={
              status === "active"
                ? "default"
                : status === "suspended"
                  ? "destructive"
                  : "secondary"
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      header: "Joined",
      sortable: true,
      render: (_, reseller) =>
        new Date(reseller.user.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, reseller) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedReseller(reseller);
              setDetailsDialogOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedReseller(reseller);
              fetchResellerPerformance(reseller.user._id);
              setPerformanceDialogOpen(true);
            }}
          >
            <TrendingUp className="w-4 h-4" />
          </Button> */}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Reseller</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {reseller.user.full_name}?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(reseller.user._id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  const trainingResourcesColumns: Column<TrainingResource>[] = [
    {
      key: "title",
      header: "Title",
      searchable: true,
      render: (_, resource) => (
        <div className="flex items-center gap-2">
          {resource.type === "video" && (
            <Play className="w-4 h-4 text-blue-600" />
          )}
          {resource.type === "document" && (
            <BookOpen className="w-4 h-4 text-green-600" />
          )}
          {resource.type === "link" && (
            <ExternalLink className="w-4 h-4 text-purple-600" />
          )}
          {resource.type === "course" && (
            <Award className="w-4 h-4 text-orange-600" />
          )}
          <div>
            <p className="font-medium">{resource.title}</p>
            <p className="text-sm text-muted-foreground">
              {resource.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (_, resource) => (
        <Badge variant="outline">{resource.category}</Badge>
      ),
    },
    {
      key: "completions",
      header: "Completions",
      render: (_, resource) => (
        <div className="text-center">
          <p className="font-medium">{resource.completions}</p>
          <p className="text-xs text-muted-foreground">users</p>
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (_, resource) => (
        <div className="flex items-center gap-1">
          <span className="font-medium">{resource.rating}</span>
          <span className="text-yellow-500">★</span>
        </div>
      ),
    },
    {
      key: "uploadDate",
      header: "Added",
      render: (_, resource) =>
        new Date(resource.uploadDate).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Status",
      render: (_, resource) => (
        <Badge variant={resource.status === "active" ? "default" : "secondary"}>
          {resource.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, resource) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(resource.url, "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const stats = {
    total: resellers.length,
    active: resellers.filter((r) => r.user.status === "active").length,
    inactive: resellers.filter((r) => r.user.status === "inactive").length,
    suspended: resellers.filter((r) => r.user.status === "suspended").length,
  };

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading resellers...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
        <div className="flex items-center justify-between">
          <div>

          <h1 className="text-3xl font-bold text-foreground">
            Resellers Management
          </h1>
          <p className="text-muted-foreground">
            Manage resellers, track performance, and provide training resources
          </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleExport("csv")}>
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("excel")}>
              Export Excel
            </Button>
          </div>
        </div>
        </div>

        {error && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-orange-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="training">Training & Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Resellers
                      </p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.active}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Inactive</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {stats.inactive}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Suspended</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.suspended}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resellers Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Resellers ({resellers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={resellers}
                  columns={resellersColumns}
                  searchable={true}
                  sortable={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on any reseller in the overview tab to view detailed
                  performance metrics
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a reseller from the Overview tab to view their
                    performance metrics
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            {/* Training Resources Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Training Resources</h2>
                <p className="text-sm text-muted-foreground">
                  Manage training materials and resources for resellers
                </p>
              </div>
              <Button onClick={() => setAddResourceDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </div>

            {/* Resources Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Available Resources ({trainingResources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={trainingResources}
                  columns={trainingResourcesColumns}
                  searchable={true}
                  sortable={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reseller Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reseller Details</DialogTitle>
            </DialogHeader>
            {selectedReseller && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedReseller.user.profile_image ||
                      "/placeholder-user.png"
                    }
                    alt={selectedReseller.user.full_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedReseller.user.full_name}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedReseller.user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedReseller.user.phone_number || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>{" "}
                    {selectedReseller.user.address || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Expertise Level:</span>{" "}
                    {selectedReseller.user.expertise_level || "Beginner"}
                  </div>
                  <div>
                    <span className="font-medium">Joined:</span>{" "}
                    {new Date(
                      selectedReseller.user.created_at,
                    ).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <Badge
                      variant={
                        selectedReseller.user.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedReseller.user.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Subscription:</span>{" "}
                    <Badge variant="outline">
                      {selectedReseller?.user?.subscription?.type ||
                        "No Subscription"}
                    </Badge>
                  </div>
                  {selectedReseller.user.card_information?.card_number && (
                    <div className="col-span-2 mt-4 border-t pt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Card Information
                      </h4>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Cardholder:</span>{" "}
                          {
                            selectedReseller.user.card_information
                              .cardholder_name
                          }
                        </div>

                        <div>
                          <span className="font-medium">Card Number:</span> ****
                          **** ****{" "}
                          {selectedReseller.user.card_information.card_number.slice(
                            -4,
                          )}
                        </div>

                        <div>
                          <span className="font-medium">Expiry:</span>{" "}
                          {selectedReseller.user.card_information.expiry_month}/
                          {selectedReseller.user.card_information.expiry_year}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Performance Dialog */}
        <Dialog
          open={performanceDialogOpen}
          onOpenChange={setPerformanceDialogOpen}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Performance Dashboard - {selectedReseller?.user.full_name}
              </DialogTitle>
            </DialogHeader>

            {resellerPerformance && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {resellerPerformance.metrics.totalSales}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total Sales
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          $
                          {resellerPerformance.metrics.totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          $
                          {resellerPerformance.metrics.totalCommission.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Commission
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          ${resellerPerformance.metrics.averageOrderValue}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Avg Order
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {resellerPerformance.metrics.conversionRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Conversion
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-600">
                          {resellerPerformance.metrics.customerRetention}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Retention
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sales Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={resellerPerformance.salesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#8884d8"
                            name="Sales"
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#82ca9d"
                            name="Revenue"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top Products */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={resellerPerformance.topProducts}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="productName" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="sales" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Targets Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Targets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Sales Target</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {resellerPerformance.targets.actualSales} /{" "}
                              {resellerPerformance.targets.monthlySalesTarget}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((resellerPerformance.targets.actualSales / resellerPerformance.targets.monthlySalesTarget) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(
                              (resellerPerformance.targets.actualSales /
                                resellerPerformance.targets
                                  .monthlySalesTarget) *
                                100,
                            )}
                            % of target achieved
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Revenue Target</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              $
                              {resellerPerformance.targets.actualRevenue.toLocaleString()}{" "}
                              / $
                              {resellerPerformance.targets.monthlyRevenueTarget.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((resellerPerformance.targets.actualRevenue / resellerPerformance.targets.monthlyRevenueTarget) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(
                              (resellerPerformance.targets.actualRevenue /
                                resellerPerformance.targets
                                  .monthlyRevenueTarget) *
                                100,
                            )}
                            % of target achieved
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Resource Dialog */}
        <Dialog
          open={addResourceDialogOpen}
          onOpenChange={setAddResourceDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Training Resource</DialogTitle>
              <DialogDescription>
                Create a new training resource for resellers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={resourceForm.title}
                  onChange={(e) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter resource title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={resourceForm.description}
                  onChange={(e) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter resource description"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={resourceForm.type}
                  onValueChange={(value: any) =>
                    setResourceForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  value={resourceForm.url}
                  onChange={(e) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      url: e.target.value,
                    }))
                  }
                  placeholder="Enter resource URL"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={resourceForm.category}
                  onChange={(e) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  placeholder="Enter category (e.g., Sales, Product Knowledge)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddResourceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddResource}>Add Resource</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
