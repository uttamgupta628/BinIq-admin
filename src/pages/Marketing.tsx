import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import DataTable from "../components/ui/DataTable";
import { toast } from "../hooks/use-toast";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Gift,
  Calendar,
  Crown,
  Plus,
  Search,
  Download,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AssignedSubscription {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: "reseller" | "store_owner";
  plan: string;
  order_id: string;
  amount: number;
  status: string;          // original API status
  date: string;            // start date
  duration: number;        // duration in days (from API)
  subscription_end_time: string; // may be empty or invalid
}

interface UserOption {
  _id: string;
  full_name: string;
  email: string;
  role: "reseller" | "store_owner";
  role_number: number;
  subscription: string | null;
  subscription_end_time: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const hasActiveSub = (u: UserOption): boolean => {
  if (!u.subscription || !u.subscription_end_time) return false;
  return new Date(u.subscription_end_time) > new Date();
};

const formatAmount = (amount: number) =>
  `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const STORE_OWNER_PLANS = [
  { value: "store_verification", label: "Store Verification — $1,997/yr" },
];

const RESELLER_PLANS = [
  { value: "tier1", label: "Tier 1" },
  { value: "tier2", label: "Tier 2" },
  { value: "tier3", label: "Tier 3" },
];

// Get reliable end date: try subscription_end_time first, then compute from date + duration
const getEndDate = (sub: AssignedSubscription): Date | null => {
  // Try subscription_end_time
  if (sub.subscription_end_time) {
    const d = new Date(sub.subscription_end_time);
    if (!isNaN(d.getTime())) return d;
  }
  // Fallback to date + duration
  if (sub.date && sub.duration) {
    const start = new Date(sub.date);
    if (!isNaN(start.getTime())) {
      return new Date(start.getTime() + sub.duration * 24 * 60 * 60 * 1000);
    }
  }
  return null;
};

// ── CSV Export ────────────────────────────────────────────────────────────────
const downloadCSV = (data: AssignedSubscription[], filename: string) => {
  if (!data.length) {
    toast({ title: "No data", description: "No records to export." });
    return;
  }

  // Define CSV headers
  const headers = [
    "User Name",
    "Email",
    "Role",
    "Plan",
    "Amount",
    "Order ID",
    "Assigned Date",
    "Expires",
    "Status",
  ];

  // Map data to rows
  const rows = data.map((sub) => {
    const endDate = getEndDate(sub);
    const now = new Date();
    let statusDisplay = "Expired";
    if (endDate && endDate > now) {
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      statusDisplay = daysLeft <= 7 ? "Expiring Soon" : "Active";
    }

    return [
      sub.user_name,
      sub.user_email,
      sub.user_role === "store_owner" ? "Store Owner" : "Reseller",
      sub.plan === "store_verification"
        ? "Store Verification"
        : sub.plan === "tier1"
        ? "Tier 1"
        : sub.plan === "tier2"
        ? "Tier 2"
        : sub.plan === "tier3"
        ? "Tier 3"
        : sub.plan,
      formatAmount(sub.amount),
      sub.order_id,
      sub.date ? new Date(sub.date).toLocaleDateString() : "N/A",
      endDate ? endDate.toLocaleDateString() : "N/A",
      statusDisplay,
    ];
  });

  // Build CSV string
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === "string" && cell.includes(",")
            ? `"${cell}"`
            : cell
        )
        .join(",")
    ),
  ].join("\n");

  // Create download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Marketing() {
  const [subscriptions, setSubscriptions] = useState<AssignedSubscription[]>(
    [],
  );
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Form
  const [assignForm, setAssignForm] = useState({
    userId: "",
    planType: "",
    durationDays: "365",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Derived: only users WITHOUT an active subscription ────────────────────
  const eligibleUsers = allUsers.filter((u) => !hasActiveSub(u));

  const selectedUser =
    allUsers.find((u) => u._id === assignForm.userId) ?? null;
  const planOptions =
    selectedUser?.role_number === 3 ? STORE_OWNER_PLANS : RESELLER_PLANS;

  // Reset plan when user changes
  const handleUserChange = (userId: string) => {
    setAssignForm((prev) => ({ ...prev, userId, planType: "" }));
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: "user_name",
      header: "User",
      searchable: true,
      render: (value: string, row: AssignedSubscription) => (
        <div className="space-y-1">
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{row.user_email}</div>
          <Badge
            variant={row.user_role === "store_owner" ? "default" : "secondary"}
          >
            {row.user_role?.replace("_", " ")}
          </Badge>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (value: string) => (
        <Badge variant="outline">
          <Crown className="w-3 h-3 mr-1" />
          {value === "store_verification"
            ? "Store Verification"
            : value === "tier1"
              ? "Tier 1"
              : value === "tier2"
                ? "Tier 2"
                : value === "tier3"
                  ? "Tier 3"
                  : value}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (value: number) => (
        <span className="font-medium">{formatAmount(value)}</span>
      ),
    },
    {
      key: "order_id",
      header: "Order ID",
      render: (value: string) => (
        <span className="text-xs text-muted-foreground font-mono">{value}</span>
      ),
    },
    {
      key: "date",
      header: "Assigned",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {value ? new Date(value).toLocaleDateString() : "N/A"}
        </div>
      ),
    },
    {
      key: "expires",
      header: "Expires",
      sortable: true,
      render: (_: any, row: AssignedSubscription) => {
        const endDate = getEndDate(row);
        if (!endDate) return <span className="text-muted-foreground">N/A</span>;
        const now = new Date();
        const isExpired = endDate <= now;
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = !isExpired && daysLeft <= 7;
        return (
          <div
            className={`flex items-center gap-1 text-sm ${
              isExpired
                ? "text-red-600"
                : isExpiringSoon
                  ? "text-yellow-600"
                  : "text-muted-foreground"
            }`}
          >
            <Calendar className="w-4 h-4" />
            {endDate.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (_: any, row: AssignedSubscription) => {
        const endDate = getEndDate(row);
        const now = new Date();
        let statusDisplay: { label: string; icon: any; variant: "default" | "secondary" | "destructive" } = {
          label: "Expired",
          icon: XCircle,
          variant: "destructive",
        };
        if (endDate && endDate > now) {
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 7) {
            statusDisplay = { label: "Expiring Soon", icon: Clock, variant: "secondary" };
          } else {
            statusDisplay = { label: "Active", icon: CheckCircle, variant: "default" };
          }
        }
        const { label, icon: Icon, variant } = statusDisplay;
        return (
          <Badge variant={variant}>
            <Icon className="w-3 h-3 mr-1" />
            {label}
          </Badge>
        );
      },
    },
  ];

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const base = API_CONFIG.BASE_URL;

      const [subsRes, storeOwnersRes, resellersRes] = await Promise.all([
        AuthService.makeAuthenticatedRequest(
          `${base}${API_CONFIG.ENDPOINTS.SUBSCRIPTIONS}`,
        ),
        AuthService.makeAuthenticatedRequest(
          `${base}${API_CONFIG.ENDPOINTS.ALL_STORE_OWNERS}`,
        ),
        AuthService.makeAuthenticatedRequest(
          `${base}${API_CONFIG.ENDPOINTS.ALL_RESELLERS}`,
        ),
      ]);

      // ── Users ──────────────────────────────────────────────────────────────
      const storeOwnersData = await storeOwnersRes.json();
      const resellersData = await resellersRes.json();

      const storeOwners: UserOption[] = (storeOwnersData.data || []).map(
        (item: any) => ({
          _id: item.user._id,
          full_name: item.user.full_name,
          email: item.user.email,
          role: "store_owner",
          role_number: 3,
          subscription: item.user.subscription ?? null,
          subscription_end_time: item.user.subscription_end_time ?? null,
        }),
      );

      const resellers: UserOption[] = (resellersData.data || []).map(
        (item: any) => ({
          _id: item.user._id,
          full_name: item.user.full_name,
          email: item.user.email,
          role: "reseller",
          role_number: 2,
          subscription: item.user.subscription ?? null,
          subscription_end_time: item.user.subscription_end_time ?? null,
        }),
      );

      setAllUsers([...storeOwners, ...resellers]);

      // ── Subscriptions ──────────────────────────────────────────────────────
      if (subsRes.ok) {
        const subsData = await subsRes.json();

        const mapped: AssignedSubscription[] = (subsData.data || []).map(
          (item: any) => ({
            _id: item.subscription_id,
            user_id: item.user?.user_id,
            user_name: item.user?.full_name ?? "Unknown",
            user_email: item.user?.email ?? "",
            user_role: item.user?.role ?? "unknown",
            plan: item.plan ?? item.type,
            order_id: item.order_id ?? "—",
            amount: item.amount ?? 0,
            status: item.status,
            date: item.date,
            duration: item.duration ?? 0, // capture duration from API
            subscription_end_time: item.user?.subscription_end_time ?? "",
          })
        );

        // Sort subscriptions in LIFO order (newest first) before storing
        const sortedSubscriptions = mapped.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setSubscriptions(sortedSubscriptions);
      } else {
        setSubscriptions([]);
      }
    } catch (err) {
      console.error("Error fetching marketing data:", err);
      setError("Failed to load data. Check your connection.");
      setSubscriptions([]);
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Assign ─────────────────────────────────────────────────────────────────
  const handleAssignSubscription = async () => {
    if (!assignForm.userId) {
      toast({
        title: "Error",
        description: "Please select a user.",
        variant: "destructive",
      });
      return;
    }
    if (!assignForm.planType) {
      toast({
        title: "Error",
        description: "Please select a plan.",
        variant: "destructive",
      });
      return;
    }
    if (!assignForm.durationDays || parseInt(assignForm.durationDays) < 1) {
      toast({
        title: "Error",
        description: "Duration must be at least 1 day.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await AuthService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSIGN_PARTNERSHIP_PLAN}`,
        {
          method: "POST",
          body: JSON.stringify({
            userId: assignForm.userId,
            planType: assignForm.planType,
            durationDays: parseInt(assignForm.durationDays),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      toast({
        title: "Plan Assigned ✓",
        description: data.message || "Subscription assigned successfully.",
      });

      setAssignDialogOpen(false);
      setAssignForm({
        userId: "",
        planType: "",
        durationDays: "365",
        notes: "",
      });
      fetchData();
    } catch (err: any) {
      console.error("Assign error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to assign plan.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Filtered subscriptions ─────────────────────────────────────────────────
  const filteredSubscriptions = subscriptions.filter((s) => {
    const matchesSearch =
      s.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.order_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const endDate = getEndDate(s);
    const now = new Date();
    let derivedStatus = "expired";
    if (endDate && endDate > now) {
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      derivedStatus = daysLeft <= 7 ? "expiring_soon" : "active";
    }

    const matchesStatus =
      statusFilter === "all" || derivedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => {
      const endDate = getEndDate(s);
      return endDate ? endDate > new Date() && (endDate.getTime() - new Date().getTime()) > 7 * 24 * 60 * 60 * 1000 : false;
    }).length,
    expiringSoon: subscriptions.filter((s) => {
      const endDate = getEndDate(s);
      if (!endDate) return false;
      const now = new Date();
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return endDate > now && daysLeft <= 7;
    }).length,
    expired: subscriptions.filter((s) => {
      const endDate = getEndDate(s);
      return endDate ? endDate <= new Date() : true;
    }).length,
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading marketing data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Marketing & Partnerships</h1>
            <p className="text-muted-foreground">
              Assign subscription plans to store owners and resellers
            </p>
          </div>
          <Button onClick={() => setAssignDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Assign Plan
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-orange-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Plans</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Expired</p>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="subscriptions">Assigned Plans</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-6">
            {/* Eligible users info */}
            <Card className="border-blue-100 bg-blue-50">
              <CardContent className="p-4">
                <p className="text-blue-700 text-sm">
                  <strong>
                    {eligibleUsers.length} user
                    {eligibleUsers.length !== 1 ? "s" : ""}
                  </strong>{" "}
                  eligible for plan assignment (
                  {eligibleUsers.filter((u) => u.role_number === 3).length}{" "}
                  store owners,{" "}
                  {eligibleUsers.filter((u) => u.role_number === 2).length}{" "}
                  resellers). Users with active subscriptions are hidden from
                  the assignment form.
                </p>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, order ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() =>
                      downloadCSV(
                        filteredSubscriptions,
                        `subscriptions_${new Date().toISOString().slice(0, 10)}.csv`
                      )
                    }
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Assigned Plans ({filteredSubscriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={filteredSubscriptions}
                  columns={columns}
                  searchable={true}
                  sortable={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Campaign management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Marketing analytics coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Assign Plan Dialog ── */}
        <Dialog
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open)
              setAssignForm({
                userId: "",
                planType: "",
                durationDays: "365",
                notes: "",
              });
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Subscription Plan</DialogTitle>
              <DialogDescription>
                Assign a verified subscription plan to a store owner or
                reseller. Only users without an active plan are shown below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* User selector — only shows users WITHOUT active subscription */}
              <div className="space-y-1.5">
                <Label>Select User</Label>
                <Select
                  value={assignForm.userId}
                  onValueChange={handleUserChange}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        eligibleUsers.length === 0
                          ? "No eligible users"
                          : "Choose a user without active plan"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Store Owners group */}
                    {eligibleUsers.filter((u) => u.role_number === 3).length >
                      0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Store Owners
                        </div>
                        {eligibleUsers
                          .filter((u) => u.role_number === 3)
                          .map((u) => (
                            <SelectItem key={u._id} value={u._id}>
                              {u.full_name} — {u.email}
                            </SelectItem>
                          ))}
                      </>
                    )}
                    {/* Resellers group */}
                    {eligibleUsers.filter((u) => u.role_number === 2).length >
                      0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">
                          Resellers
                        </div>
                        {eligibleUsers
                          .filter((u) => u.role_number === 2)
                          .map((u) => (
                            <SelectItem key={u._id} value={u._id}>
                              {u.full_name} — {u.email}
                            </SelectItem>
                          ))}
                      </>
                    )}
                    {eligibleUsers.length === 0 && (
                      <div className="px-2 py-3 text-sm text-center text-muted-foreground">
                        All users have active subscriptions
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedUser && (
                  <p className="text-xs text-muted-foreground">
                    Role:{" "}
                    <strong>
                      {selectedUser.role === "store_owner"
                        ? "Store Owner"
                        : "Reseller"}
                    </strong>
                  </p>
                )}
              </div>

              {/* Plan selector — options change based on selected user's role */}
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select
                  value={assignForm.planType}
                  onValueChange={(v) =>
                    setAssignForm((prev) => ({ ...prev, planType: v }))
                  }
                  disabled={!assignForm.userId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        assignForm.userId
                          ? "Choose a plan"
                          : "Select user first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Show price hint for store verification */}
                {assignForm.planType === "store_verification" && (
                  <p className="text-xs text-muted-foreground">
                    Fixed price: <strong>$1,997</strong>
                  </p>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label>Duration (Days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="3650"
                  value={assignForm.durationDays}
                  onChange={(e) =>
                    setAssignForm((prev) => ({
                      ...prev,
                      durationDays: e.target.value,
                    }))
                  }
                  placeholder="365"
                />
                <p className="text-xs text-muted-foreground">
                  Expires:{" "}
                  {assignForm.durationDays
                    ? new Date(
                        Date.now() +
                          parseInt(assignForm.durationDays) * 86400000,
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignSubscription}
                disabled={
                  isSubmitting || !assignForm.userId || !assignForm.planType
                }
              >
                {isSubmitting ? "Assigning..." : "Assign Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}