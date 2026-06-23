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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Users, Trash2, Phone, Mail, MapPin, User, Scan } from "lucide-react";
import { useState, useEffect } from "react";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";

// Define interfaces for API responses
interface Reseller {
  user: {
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
    subscription: {
      _id: string;
      order_id: string;
      user_id: string;
      user_name: string;
      type: string;
      plan: string;
      amount: number;
      status: string;
      date: string;
      duration: number;
      __v: number;
    } | null;
    subscription_end_time: string | null;
    total_promotions: number;
    used_promotions: number;
    promotions: any[];
    verified: boolean;
    total_scans: number;
    scans_used: any[];
    created_at: string;
    updated_at: string;
  };
}

interface ResellersResponse {
  success: boolean;
  data: Reseller[];
}

interface ActionResponse {
  message: string;
}

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText: string;
  isDestructive?: boolean;
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  isDestructive = false,
}: ConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Action failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            className="hover:bg-gray-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const resellerColumns: Column<Reseller>[] = [
  {
    key: "srNo",
    header: "Sr No.",
    sortable: true,
    render: (_, row, index, resellers) => {
      const rowIndex =
        resellers.findIndex((reseller) => reseller.user._id === row.user._id) +
        1;
      return rowIndex;
    },
  },
  {
    key: "fullName",
    header: "Full Name",
    sortable: true,
    searchable: true,
    render: (_, row, _index, _resellers, handleResellerClick) => {
      console.log("Rendering Full Name column for:", row.user.full_name); // Debug log
      return (
        <button
          onClick={() => {
            console.log("Clicked reseller:", row.user.full_name); // Debug log
            handleResellerClick(row);
          }}
          className="text-left font-medium text-biniq-teal hover:text-biniq-navy cursor-pointer"
        >
          {row.user.full_name || "N/A"}
        </button>
      );
    },
  },
  {
    key: "phone",
    header: "Phone",
    searchable: true,
    render: (_, row) => row.user.phone_number || "N/A",
  },
  {
    key: "address",
    header: "Address",
    searchable: true,
    render: (_, row) => (
      <div className="max-w-xs truncate" title={row.user.address || "N/A"}>
        {row.user.address || "N/A"}
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    searchable: true,
    render: (_, row) => row.user.email || "N/A",
  },
  {
    key: "isPremium",
    header: "Premium User",
    render: (_, row) => (
      <div className="space-y-1">
        <Badge variant={row.user.subscription ? "default" : "secondary"}>
          {row.user.subscription ? "Yes" : "No"}
        </Badge>
        {row.user.subscription && row.user.subscription_end_time && (
          <div className="text-xs text-muted-foreground">
            Ends on{" "}
            {new Date(row.user.subscription_end_time).toLocaleDateString()}
          </div>
        )}
      </div>
    ),
  },
  {
    key: "totalScans",
    header: "Total Scans",
    render: (_, row) => (
      <div>
        {row.user.subscription && row.user.total_scans ? (
          <span className="font-medium text-biniq-navy">
            {row.user.scans_used.length}/{row.user.total_scans}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (_, row) => (
      <Badge
        variant={
          row.user.subscription?.status === "completed"
            ? "default"
            : "secondary"
        }
      >
        {row.user.subscription?.status === "completed" ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    render: (_, row, _index, _resellers, setActionState) => (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            console.log("Delete clicked for reseller:", row.user.full_name); // Debug log
            setActionState({
              type: "delete",
              userId: row.user._id,
              fullName: row.user.full_name,
            });
          }}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    ),
  },
];

export default function Resellers() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(
    null
  );
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionState, setActionState] = useState<{
    type: "delete";
    userId: string;
    fullName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch resellers data
  useEffect(() => {
    const fetchResellers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const baseUrl = API_CONFIG.BASE_URL;
        console.log('Resellers: Using API URL:', baseUrl); // Debug log
        const response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.ALL_RESELLERS}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ResellersResponse = await response.json();

        if (!data.success) {
          throw new Error("Failed to fetch resellers");
        }

        console.log("Fetched resellers:", data.data); // Debug log
        setResellers(data.data);
      } catch (err: any) {
        console.error("Error fetching resellers:", err);
        setError("Failed to load resellers. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResellers();
  }, []);

  // Handle delete action
  const handleAction = async (action: "delete", userId: string) => {
    const baseUrl = API_CONFIG.BASE_URL;
    try {
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/users/delete-account?user_id=${userId}`,
        { method: "DELETE" }
      );

      const data: ActionResponse = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      // Optimistically update resellers state
      setResellers((prev) =>
        prev.filter((reseller) => reseller.user._id !== userId)
      );
    } catch (err: any) {
      throw new Error(err.message || "Delete failed");
    }
  };

  // Handle reseller click
  const handleResellerClick = (reseller: Reseller) => {
    console.log("Opening details for reseller:", reseller.user.full_name); // Debug log
    setSelectedReseller(reseller);
    setDetailsDialogOpen(true);
  };

  // Pass handleResellerClick and setActionState to columns selectively
  const columnsWithSetters = resellerColumns.map((col) => ({
    ...col,
    render: (value: any, row: Reseller, index?: number) => {
      console.log(
        "Rendering column:",
        col.key,
        "for reseller:",
        row.user.full_name
      ); // Debug log
      if (col.key === "fullName") {
        return col.render(value, row, index, resellers, handleResellerClick);
      }
      if (col.key === "actions") {
        return col.render(value, row, index, resellers, setActionState);
      }
      return col.render(value, row, index, resellers);
    },
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Resellers</h1>
            <p className="text-muted-foreground">
              Manage resellers and their preferences
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resellers Management ({resellers.length} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading resellers...</div>
            ) : resellers.length === 0 ? (
              <div>No resellers found.</div>
            ) : (
              <DataTable
                data={resellers}
                columns={columnsWithSetters}
                searchPlaceholder="Search resellers..."
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reseller Details Modal */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reseller Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedReseller?.user.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedReseller && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedReseller.user.full_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{selectedReseller.user.phone_number || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedReseller.user.email}</span>
                    </div>
                    <div>
                      <span className="font-medium">Premium User:</span>{" "}
                      <Badge
                        variant={
                          selectedReseller.user.subscription
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedReseller.user.subscription ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge
                        variant={
                          selectedReseller.user.subscription?.status ===
                          "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedReseller.user.subscription?.status ===
                        "completed"
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </div>
                    {selectedReseller.user.subscription &&
                      selectedReseller.user.total_scans > 0 && (
                        <div className="flex items-center gap-2">
                          <Scan className="h-4 w-4" />
                          <span className="font-medium">Scans:</span>{" "}
                          <span className="text-biniq-navy font-semibold">
                            {selectedReseller.user.scans_used.length}/
                            {selectedReseller.user.total_scans}
                          </span>
                        </div>
                      )}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Address:</span>{" "}
                      {selectedReseller.user.address || "N/A"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Answers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Initial Questions Answers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Expertise Level:</span>
                      <div className="mt-1">
                        <Badge variant="outline">
                          {selectedReseller.user.expertise_level || "N/A"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Registration Date:</span>
                      <div className="mt-1">
                        <Badge variant="outline">
                          {new Date(
                            selectedReseller.user.created_at
                          ).toLocaleDateString() || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      {actionState && (
        <ConfirmationModal
          isOpen={!!actionState}
          onClose={() => setActionState(null)}
          onConfirm={() => handleAction(actionState.type, actionState.userId)}
          title={`Delete ${actionState.fullName}`}
          description={`Are you sure you want to delete ${actionState.fullName}? This action cannot be undone.`}
          confirmText="Delete"
          isDestructive={true}
        />
      )}
    </AdminLayout>
  );
}
