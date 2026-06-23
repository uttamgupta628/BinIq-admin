import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import DataTable from "../components/ui/DataTable";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
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
import { Textarea } from "../components/ui/textarea";
import { toast } from "../hooks/use-toast";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";
import AdminLayout from "../components/AdminLayout";
import {
  Eye,
  Edit3,
  Check,
  X,
  Download,
  History,
  FileImage,
  Calendar,
  User,
  Tag,
  DollarSign,
} from "lucide-react";

interface ScanItem {
  _id: string;
  imageUrl: string;
  itemName: string;
  category: string;
  price?: number;
  submittedBy: {
    userId: string;
    name: string;
    role: "store-owner" | "reseller";
  };
  dateSubmitted: string;
  status: "pending" | "approved" | "rejected";
  description?: string;
  accuracy?: number;
}

interface ScanAudit {
  _id: string;
  action: string;
  adminId: string;
  adminName: string;
  timestamp: string;
  details: string;
}

export default function Scans() {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [filteredScans, setFilteredScans] = useState<ScanItem[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanItem | null>(null);
  const [scanAudit, setScanAudit] = useState<ScanAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalScans, setTotalScans] = useState<number>(0);
  // Modal states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Edit form states
  const [editForm, setEditForm] = useState({
    itemName: "",
    category: "",
    price: "",
    description: "",
  });

  // Table columns
  const columns = [
    {
      key: "imageUrl",
      header: "Image",
      render: (value: string) => (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={value || "/placeholder-image.png"}
            alt="Scan"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-image.png";
            }}
          />
        </div>
      ),
    },
    {
      key: "itemName",
      header: "Item Name",
      searchable: true,
      render: (value: string) => (
        <div className="font-medium">{value || "Unknown Item"}</div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (value: string) => (
        <Badge variant="outline">{value || "Uncategorized"}</Badge>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (value: number) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          {value ? `$${value.toFixed(2)}` : "N/A"}
        </div>
      ),
    },
    {
      key: "submittedBy",
      header: "Submitted By",
      render: (value: ScanItem["submittedBy"]) => (
        <div className="space-y-1">
          <div className="font-medium">{value?.name || "Unknown User"}</div>
          <Badge
            variant={value?.role === "store-owner" ? "default" : "secondary"}
          >
            {value?.role ? value.role.replace("-", " ") : "Unknown"}
          </Badge>
        </div>
      ),
    },
    {
      key: "dateSubmitted",
      header: "Date Submitted",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {value ? new Date(value).toLocaleDateString() : "N/A"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        <Badge
          variant={
            value === "approved"
              ? "default"
              : value === "rejected"
                ? "destructive"
                : "secondary"
          }
        >
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, scan: ScanItem) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(scan)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditScan(scan)}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          {scan.status === "pending" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Scan</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve this scan? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleStatusChange(scan._id, "approved")}
                    >
                      Approve
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600">
                    <X className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Scan</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this scan? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleStatusChange(scan._id, "rejected")}
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewAudit(scan)}
          >
            <History className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Fetch scans data
  useEffect(() => {
    fetchScans();
  }, []);

  // Filter scans based on current filters
  useEffect(() => {
    let filtered = [...scans];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((scan) => scan.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(
        (scan) => scan.submittedBy?.role === roleFilter,
      );
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (scan) =>
          scan.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          scan.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          scan.submittedBy?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(
        (scan) => new Date(scan.dateSubmitted) >= new Date(dateRange.from),
      );
    }
    if (dateRange.to) {
      filtered = filtered.filter(
        (scan) => new Date(scan.dateSubmitted) <= new Date(dateRange.to),
      );
    }

    setFilteredScans(filtered);
  }, [scans, statusFilter, roleFilter, searchQuery, dateRange]);

  const fetchScans = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await AuthService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ALL_SCANS}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      setScans(data.data || []);
      setTotalUsers(data.total_users || 0);
      setTotalScans(data.total_scans_across_all_users || 0);
    } catch (err: any) {
      console.error("Error fetching scans:", err);
      setError("Failed to load scans. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (scan: ScanItem) => {
    setSelectedScan(scan);
    setDetailsDialogOpen(true);
  };

  const handleEditScan = (scan: ScanItem) => {
    setSelectedScan(scan);
    setEditForm({
      itemName: scan.itemName || "",
      category: scan.category || "",
      price: scan.price?.toString() || "",
      description: scan.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleViewAudit = async (scan: ScanItem) => {
    try {
      setSelectedScan(scan);
      const response = await AuthService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCAN_AUDIT.replace(":id", scan._id)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setScanAudit(data.data || []);
      setAuditDialogOpen(true);
    } catch (err: any) {
      console.error("Error fetching audit history:", err);
      toast({
        title: "Error",
        description: "Failed to load audit history.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    scanId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      const response = await AuthService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCAN_APPROVE_REJECT.replace(":id", scanId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: `Scan ${status} successfully.`,
      });

      fetchScans(); // Refresh the list
    } catch (err: any) {
      console.error("Error updating scan status:", err);
      toast({
        title: "Error",
        description: "Failed to update scan status.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateScan = async () => {
    if (!selectedScan) return;

    try {
      const response = await AuthService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCAN_UPDATE.replace(":id", selectedScan._id)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            itemName: editForm.itemName,
            category: editForm.category,
            price: editForm.price ? parseFloat(editForm.price) : null,
            description: editForm.description,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: "Scan updated successfully.",
      });

      setEditDialogOpen(false);
      fetchScans(); // Refresh the list
    } catch (err: any) {
      console.error("Error updating scan:", err);
      toast({
        title: "Error",
        description: "Failed to update scan.",
        variant: "destructive",
      });
    }
  };

  const handleExportScans = async (format: "csv" | "excel") => {
    try {
      const selectedIds = filteredScans.map((scan) => scan._id);
      const response = await AuthService.makeAuthenticatedRequest(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCAN_EXPORT}?format=${format}&ids=${selectedIds.join(",")}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `scans_export.${format === "csv" ? "csv" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Scans exported as ${format.toUpperCase()} successfully.`,
      });
    } catch (err: any) {
      console.error("Error exporting scans:", err);
      toast({
        title: "Error",
        description: "Failed to export scans.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading scans...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Scans Management</h1>
            <p className="text-muted-foreground">
              Manage and moderate user-submitted scans
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleExportScans("csv")}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportScans("excel")}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <FileImage className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Scans</p>
                  <p className="text-2xl font-bold">{totalScans}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">
                    {scans.filter((s) => s.status === "approved").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">
                    {scans.filter((s) => s.status === "rejected").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {scans.filter((s) => s.status === "pending").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Search scans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="User Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="store-owner">Store Owner</SelectItem>
                  <SelectItem value="reseller">Reseller</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="From Date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
              />

              <Input
                type="date"
                placeholder="To Date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Scans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Scans ({filteredScans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredScans}
              columns={columns}
              searchable={true}
              sortable={true}
            />
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Scan Details</DialogTitle>
            </DialogHeader>
            {selectedScan && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <img
                      src={selectedScan.imageUrl || "/placeholder-image.png"}
                      alt="Scan"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-image.png";
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Item Name</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedScan.itemName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedScan.category || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Price</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedScan.price
                          ? `$${selectedScan.price.toFixed(2)}`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Submitted By
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {selectedScan.submittedBy?.name} (
                        {selectedScan.submittedBy?.role?.replace("-", " ")})
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Date Submitted
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedScan.dateSubmitted).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Badge
                        className="ml-2"
                        variant={
                          selectedScan.status === "approved"
                            ? "default"
                            : selectedScan.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {selectedScan.status.charAt(0).toUpperCase() +
                          selectedScan.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
                {selectedScan.description && (
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedScan.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Scan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Item Name</label>
                <Input
                  value={editForm.itemName}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      itemName: e.target.value,
                    }))
                  }
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateScan}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Audit History Dialog */}
        <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Audit History</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scanAudit.length > 0 ? (
                scanAudit.map((audit) => (
                  <div key={audit._id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{audit.action}</p>
                        <p className="text-sm text-muted-foreground">
                          by {audit.adminName}
                        </p>
                        {audit.details && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {audit.details}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(audit.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">
                  No audit history available
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
