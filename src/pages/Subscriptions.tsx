import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CreditCard, Edit, Settings, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import DataTable, { Column } from "../components/ui/DataTable";
import { useState, useEffect } from "react";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";

// Define interfaces for API responses
interface Subscription {
  subscription_id: string;
  order_id: string;
  user: {
    user_id: string | null;
    full_name: string;
    email: string;
    role: string;
    store_name: string | null;
    total_promotions: number;
    used_promotions: number;
    total_scans: number;
  };
  type: "reseller" | "store_owner";
  plan: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "refunded";
  date: string;
  duration: number;
  payment_method: {
    cardholder_name: string | null;
    expiry_month: string | null;
    expiry_year: string | null;
  };
}

interface SubscriptionsResponse {
  success: boolean;
  data: Subscription[];
}

interface SubscriptionStats {
  totalRevenue: number;
  activeSubscriptions: number;
  pendingPayments: number;
  failedPayments: number;
}

const subscriptionColumns: Column<Subscription>[] = [
  {
    key: "srNo",
    header: "Sr No.",
    sortable: true,
    render: (_, row, index, subscriptions) => {
      const rowIndex =
        subscriptions.findIndex(
          (sub) => sub.subscription_id === row.subscription_id
        ) + 1;
      return rowIndex;
    },
  },
  {
    key: "orderId",
    header: "Order ID",
    searchable: true,
    render: (_, row) => (
      <span className="font-mono text-sm">{row.order_id}</span>
    ),
  },
  {
    key: "userName",
    header: "User Name",
    sortable: true,
    searchable: true,
    render: (_, row, _index, _subscriptions, handleSubscriptionClick) => {
      console.log("Rendering User Name column for:", row.user.full_name); // Debug log
      return (
        <button
          onClick={() => {
            console.log("Clicked subscription for user:", row.user.full_name); // Debug log
            handleSubscriptionClick(row);
          }}
          className="text-left font-medium text-biniq-teal hover:text-biniq-navy cursor-pointer"
        >
          {row.user.full_name || "N/A"}
        </button>
      );
    },
  },
  // New Email column added here
  {
    key: "email",
    header: "Email",
    sortable: true,
    searchable: true,
    render: (_, row) => (
      <span className="text-sm text-muted-foreground">
        {row.user.email || "N/A"}
      </span>
    ),
  },
  {
    key: "userType",
    header: "Type",
    sortable: true,
    render: (_, row) => (
      <Badge variant={row.type === "store_owner" ? "default" : "secondary"}>
        {row.type === "store_owner" ? "Store Owner" : "Reseller"}
      </Badge>
    ),
  },
  {
    key: "paymentMethod",
    header: "Payment Method",
    sortable: true,
    render: (_, row) => {
      const { cardholder_name, expiry_month, expiry_year } = row.payment_method;
      return cardholder_name && expiry_month && expiry_year
        ? `Card (${cardholder_name}, Exp: ${expiry_month}/${expiry_year})`
        : "Card";
    },
  },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    render: (_, row) => (
      <span className="font-medium text-biniq-navy">${row.amount}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (_, row) => (
      <Badge
        variant={
          row.status === "completed"
            ? "default"
            : row.status === "pending"
              ? "secondary"
              : row.status === "failed"
                ? "destructive"
                : "outline"
        }
      >
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
  {
    key: "date",
    header: "Date",
    sortable: true,
    render: (_, row) => new Date(row.date).toLocaleDateString(),
  },
  {
    key: "duration",
    header: "Duration",
    sortable: true,
    render: (_, row) => `${row.duration} days`,
  },
  
  // {
  //   key: "actions",
  //   header: "Actions",
  //   render: () => (
  //     <div className="flex items-center gap-2">
  //       <Button size="sm" variant="outline" title="View Details">
  //         <Eye className="w-4 h-4" />
  //       </Button>
  //     </div>
  //   ),
  // },
];

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });

  // Fetch subscriptions data and compute stats
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const baseUrl = API_CONFIG.BASE_URL;
        const response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.SUBSCRIPTIONS}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SubscriptionsResponse = await response.json();

        if (!data.success) {
          throw new Error("Failed to fetch subscriptions");
        }

        console.log("Fetched subscriptions:", data.data); // Debug log

        // Calculate stats (these don't depend on order)
        const totalRevenue = data.data
          .filter((sub) => sub.status === "completed")
          .reduce((sum, sub) => sum + sub.amount, 0);
        const activeSubscriptions = data.data.filter(
          (sub) => sub.status === "completed"
        ).length;
        const pendingPayments = data.data.filter(
          (sub) => sub.status === "pending"
        ).length;
        const failedPayments = data.data.filter(
          (sub) => sub.status === "failed"
        ).length;

        console.log("Computed stats:", {
          totalRevenue,
          activeSubscriptions,
          pendingPayments,
          failedPayments,
        }); // Debug log

        // Sort subscriptions in LIFO order (newest first) before storing
        const sortedSubscriptions = [...data.data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setSubscriptions(sortedSubscriptions);
        setStats({
          totalRevenue,
          activeSubscriptions,
          pendingPayments,
          failedPayments,
        });
      } catch (err: any) {
        console.error("Error fetching subscriptions:", err);
        setError("Failed to load subscriptions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // Handle subscription click
  const handleSubscriptionClick = (subscription: Subscription) => {
    console.log(
      "Opening details for subscription:",
      subscription.user.full_name
    ); // Debug log
    setSelectedSubscription(subscription);
    setDetailsDialogOpen(true);
  };

  // Pass handleSubscriptionClick to columns selectively
  const columnsWithSetters = subscriptionColumns.map((col) => ({
    ...col,
    render: (value: any, row: Subscription, index?: number) => {
      console.log(
        "Rendering column:",
        col.key,
        "for user:",
        row.user.full_name
      ); // Debug log
      if (col.key === "userName") {
        return col.render(
          value,
          row,
          index,
          subscriptions,
          handleSubscriptionClick
        );
      }
      // For all other columns (including the new email column), pass only the basic parameters
      return col.render(value, row, index, subscriptions);
    },
  }));
  
  const handleDeleteSubscription = async (subscriptionId: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;

      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/api/subscriptions/${subscriptionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete subscription");
      }

      // remove deleted subscription from UI
      setSubscriptions((prev) =>
        prev.filter((sub) => sub.subscription_id !== subscriptionId)
      );

    } catch (error) {
      console.error("Delete subscription error:", error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage subscription plans and payments
          </p>
        </div>
        {/* Subscription Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-biniq-navy">
                    {isLoading
                      ? "Loading..."
                      : `$${stats.totalRevenue.toLocaleString()}`}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-biniq-teal" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Subscriptions
                  </p>
                  <p className="text-2xl font-bold text-biniq-navy">
                    {isLoading ? "Loading..." : stats.activeSubscriptions}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pending Payments
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {isLoading ? "Loading..." : stats.pendingPayments}
                  </p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Failed Payments
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {isLoading ? "Loading..." : stats.failedPayments}
                  </p>
                </div>
                <Badge variant="destructive">Failed</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Recent Subscriptions ({subscriptions.length} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading subscriptions...</div>
            ) : subscriptions.length === 0 ? (
              <div>No subscriptions found.</div>
            ) : (
              <DataTable
                data={subscriptions}
                columns={columnsWithSetters}
                searchPlaceholder="Search subscriptions..."
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subscription Details Modal */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedSubscription?.user.full_name}'s
              subscription
            </DialogDescription>
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    Subscription Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Order ID:</span>{" "}
                      <span className="font-mono">
                        {selectedSubscription.order_id}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">User Name:</span>{" "}
                      {selectedSubscription.user.full_name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedSubscription.user.email}
                    </div>
                    <div>
                      <span className="font-medium">User Type:</span>{" "}
                      <Badge
                        variant={
                          selectedSubscription.type === "store_owner"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedSubscription.type === "store_owner"
                          ? "Store Owner"
                          : "Reseller"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Plan:</span>{" "}
                      <Badge variant="outline">
                        {selectedSubscription.plan}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>{" "}
                      <span className="text-biniq-navy font-semibold">
                        ${selectedSubscription.amount}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge
                        variant={
                          selectedSubscription.status === "completed"
                            ? "default"
                            : selectedSubscription.status === "pending"
                              ? "secondary"
                              : selectedSubscription.status === "failed"
                                ? "destructive"
                                : "outline"
                        }
                      >
                        {selectedSubscription.status.charAt(0).toUpperCase() +
                          selectedSubscription.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(selectedSubscription.date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>{" "}
                      {selectedSubscription.duration} days
                    </div>
                    <div>
                      <span className="font-medium">Payment Method:</span>{" "}
                      {selectedSubscription.payment_method.cardholder_name &&
                      selectedSubscription.payment_method.expiry_month &&
                      selectedSubscription.payment_method.expiry_year
                        ? `Card (${selectedSubscription.payment_method.cardholder_name}, Exp: ${selectedSubscription.payment_method.expiry_month}/${selectedSubscription.payment_method.expiry_year})`
                        : "Card"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="font-medium">User ID:</span>{" "}
                      {selectedSubscription.user.user_id || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Store Name:</span>{" "}
                      {selectedSubscription.user.store_name || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Total Promotions:</span>{" "}
                      {selectedSubscription.user.total_promotions}/
                      {selectedSubscription.user.used_promotions}
                    </div>
                    <div>
                      <span className="font-medium">Total Scans:</span>{" "}
                      {selectedSubscription.user.total_scans}/
                      {selectedSubscription.user.used_promotions}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}