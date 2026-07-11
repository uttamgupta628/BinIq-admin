import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import DataTable, { type Column } from "../components/ui/DataTable";
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
  Store,
  Trash2,
  Check,
  X,
  MapPin,
  Clock,
  Phone,
  Mail,
  Eye,
  FileText,
  RotateCcw,
  Heart,
  MousePointer,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";
import { toast } from "../hooks/use-toast";
import BulkUploadStores from "./Bulkuploadstores";

// Enhanced interfaces
interface StoreOwner {
  user: {
    _id: string;
    full_name: string;
    store_name: string;
    email: string;
    role: number;
    phone_number: string | null;
    address: string | null;
    profile_image: string | null;
    subscription: {
      type: string;
      start_date: string;
      end_date: string;
    };
    created_at: string;
    status: "pending" | "approved" | "rejected";
  };
}

interface StoreContent {
  _id: string;
  storeId: string;
  storeName: string;
  images: {
    url: string;
    description: string;
    uploadDate: string;
    status: "pending" | "approved" | "rejected";
    moderatorNotes?: string;
  }[];
  descriptions: {
    title: string;
    content: string;
    uploadDate: string;
    status: "pending" | "approved" | "rejected";
    moderatorNotes?: string;
  }[];
  pricing: {
    items: {
      name: string;
      price: number;
      currency: string;
      description: string;
    }[];
    lastUpdated: string;
    status: "pending" | "approved" | "rejected";
    moderatorNotes?: string;
  };
  engagement: {
    views: number;
    likes: number;
    clicks: number;
    lastMonth: {
      views: number;
      likes: number;
      clicks: number;
    };
  };
  versions: {
    id: string;
    timestamp: string;
    changes: string;
    moderator: string;
  }[];
}

interface StoreOwnersResponse {
  success: boolean;
  data: StoreOwner[];
}

// ✅ NEW — raw Store documents (what bulk upload creates). These are
// separate from StoreOwner/User accounts above — bulk-uploaded stores get
// user_id: "unassigned" and have no owner account at all, so they never
// show up in the "Store Owners" table.
interface StoreRecord {
  _id: string;
  store_name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  user_latitude?: number | null;
  user_longitude?: number | null;
  verified?: boolean;
  views_count?: number;
  likes?: number;
  followers?: number;
  user_id?: string;
}

export default function StoreOwnersEnhanced() {
  const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreOwner | null>(null);
  const [storeContent, setStoreContent] = useState<StoreContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [addStoreDialogOpen, setAddStoreDialogOpen] = useState(false);

  const [newStoreOwner, setNewStoreOwner] = useState({
    full_name: "",
    store_name: "",
    email: "",
    password: "",
    phone_number: "",
    address: "",
    expertise_level: "",
  });

  // ✅ NEW — All Stores state
  const [allStores, setAllStores] = useState<StoreRecord[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);

  const generateMockStoreOwners = (): StoreOwner[] => [
    {
      user: {
        _id: "1",
        full_name: "John Smith",
        store_name: "Smith's Electronics",
        email: "john@smithelectronics.com",
        role: 2,
        phone_number: "+1234567890",
        address: "123 Main St, New York, NY",
        profile_image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        subscription: {
          type: "Premium",
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
        created_at: "2024-01-15",
        status: "approved",
      },
    },
    {
      user: {
        _id: "2",
        full_name: "Sarah Johnson",
        store_name: "Green Valley Market",
        email: "sarah@greenvalley.com",
        role: 2,
        phone_number: "+1987654321",
        address: "456 Oak Ave, California, CA",
        profile_image:
          "https://images.unsplash.com/photo-1494790108755-2616b612e47c?w=150",
        subscription: {
          type: "Basic",
          start_date: "2024-02-01",
          end_date: "2024-08-01",
        },
        created_at: "2024-02-10",
        status: "pending",
      },
    },
  ];

  const generateMockStoreContent = (storeId: string): StoreContent => ({
    _id: storeId,
    storeId,
    storeName: "Smith's Electronics",
    images: [
      {
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
        description: "Store front view",
        uploadDate: "2024-01-20",
        status: "approved",
      },
      {
        url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
        description: "Product showcase",
        uploadDate: "2024-01-22",
        status: "pending",
        moderatorNotes: "Please ensure product images meet quality standards",
      },
    ],
    descriptions: [
      {
        title: "Welcome to Smith's Electronics",
        content:
          "Your one-stop shop for all electronic needs. We offer quality products with excellent customer service.",
        uploadDate: "2024-01-20",
        status: "approved",
      },
      {
        title: "New Product Launch",
        content:
          "Exciting new gadgets now available! Visit our store for the latest technology.",
        uploadDate: "2024-01-25",
        status: "pending",
        moderatorNotes: "Content approved, needs minor formatting adjustments",
      },
    ],
    pricing: {
      items: [
        {
          name: "Smartphone",
          price: 599,
          currency: "USD",
          description: "Latest model smartphone",
        },
        {
          name: "Laptop",
          price: 999,
          currency: "USD",
          description: "High-performance laptop",
        },
        {
          name: "Headphones",
          price: 199,
          currency: "USD",
          description: "Noise-canceling headphones",
        },
      ],
      lastUpdated: "2024-01-20",
      status: "approved",
    },
    engagement: {
      views: 1250,
      likes: 89,
      clicks: 156,
      lastMonth: {
        views: 980,
        likes: 67,
        clicks: 123,
      },
    },
    versions: [
      {
        id: "v1",
        timestamp: "2024-01-20T10:00:00Z",
        changes: "Initial store setup and content approval",
        moderator: "Admin User",
      },
      {
        id: "v2",
        timestamp: "2024-01-25T14:30:00Z",
        changes: "Updated product descriptions and pricing",
        moderator: "Content Moderator",
      },
    ],
  });

  useEffect(() => {
    fetchStoreOwners();
    fetchAllStores();
  }, []);

  const fetchStoreOwners = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.ALL_STORE_OWNERS}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StoreOwnersResponse = await response.json();
      setStoreOwners(data.data || generateMockStoreOwners());
    } catch (err: any) {
      console.error("Error fetching store owners:", err);
      setError("Failed to load store owners. Using demo data.");
      setStoreOwners(generateMockStoreOwners());
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW — fetch every raw Store document (includes bulk-uploaded stores
  // that have no owner account, as well as owner-created ones).
  const fetchAllStores = async () => {
    try {
      setIsLoadingStores(true);
      setStoresError(null);

      const baseUrl = API_CONFIG.BASE_URL;
      const allStoresPath = API_CONFIG.ENDPOINTS.GET_ALL_STORES ?? "/stores/all";
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${allStoresPath}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const list: StoreRecord[] = Array.isArray(data) ? data : data?.stores ?? data?.data ?? [];
      setAllStores(list);
    } catch (err: any) {
      console.error("Error fetching stores:", err);
      setStoresError("Failed to load stores.");
      setAllStores([]);
    } finally {
      setIsLoadingStores(false);
    }
  };

  const fetchStoreContent = async (storeId: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.STORE_CONTENT.replace(":id", storeId)}`,
      );

      if (response.ok) {
        const data = await response.json();
        setStoreContent(data.data || generateMockStoreContent(storeId));
      } else {
        setStoreContent(generateMockStoreContent(storeId));
      }
    } catch (err) {
      setStoreContent(generateMockStoreContent(storeId));
    }
  };

  const handleAction = async (
    action: "delete" | "approve" | "reject",
    userId: string,
  ) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      let response;

      if (action === "delete") {
        response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.DELETE_ACCOUNT}`,
          {
            method: "DELETE",
            body: JSON.stringify({ user_id: userId }),
          },
        );
      } else {
        const endpoint =
          action === "approve"
            ? API_CONFIG.ENDPOINTS.APPROVE_STORE_OWNER
            : API_CONFIG.ENDPOINTS.REJECT_STORE_OWNER;

        response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}${endpoint}`,
          {
            method: "POST",
            body: JSON.stringify({ user_id: userId }),
          },
        );
      }

      if (response.ok) {
        toast({
          title: "Success",
          description: `Store owner ${action}d successfully.`,
        });
        if (action === "delete") {
          setStoreOwners((prev) => prev.filter((so) => so.user._id !== userId));
        } else {
          setStoreOwners((prev) =>
            prev.map((so) =>
              so.user._id === userId
                ? {
                    ...so,
                    user: {
                      ...so.user,
                      status:
                        action === "approve"
                          ? "approved"
                          : action === "reject"
                            ? "rejected"
                            : so.user.status,
                    },
                  }
                : so,
            ),
          );
        }
      } else {
        throw new Error(`Failed to ${action} store owner`);
      }
    } catch (err: any) {
      console.error(`Error ${action}ing store owner:`, err);
      toast({
        title: "Error",
        description: `Failed to ${action} store owner.`,
        variant: "destructive",
      });
    }
  };

  // ✅ NEW — delete a single store record
  const handleDeleteStore = async (storeId: string) => {
    setDeletingStoreId(storeId);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const deleteStorePath = API_CONFIG.ENDPOINTS.DELETE_STORE
        ? API_CONFIG.ENDPOINTS.DELETE_STORE.replace(":id", storeId)
        : `/stores/${storeId}`;

      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${deleteStorePath}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete store");
      }

      setAllStores((prev) => prev.filter((s) => s._id !== storeId));
      toast({ title: "Success", description: "Store deleted successfully." });
    } catch (err: any) {
      console.error("Error deleting store:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete store.",
        variant: "destructive",
      });
    } finally {
      setDeletingStoreId(null);
    }
  };

  // ✅ NEW — delete every store at once. Requires the person to type the
  // exact confirmation phrase (matches the backend's own confirmation
  // requirement) since this wipes the whole Store collection and can't
  // be undone.
  const handleDeleteAllStores = async () => {
    if (deleteAllConfirmText !== "DELETE ALL STORES") return;

    setIsDeletingAll(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const allStoresPath = API_CONFIG.ENDPOINTS.DELETE_ALL_STORES ?? "/stores/all";

const response = await AuthService.makeAuthenticatedRequest(
  `${baseUrl}${allStoresPath}`,
  {
    method: "DELETE",
    body: JSON.stringify({ confirm: "DELETE ALL STORES" }),
  },
);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete all stores");
      }

      setAllStores([]);
      setDeleteAllDialogOpen(false);
      setDeleteAllConfirmText("");
      toast({
        title: "All stores deleted",
        description: data.message ?? `Deleted ${data.deletedCount ?? 0} stores.`,
      });
    } catch (err: any) {
      console.error("Error deleting all stores:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete all stores.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleExport = async (format: "csv" | "excel") => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/api/export/store-owners?format=${format}`,
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        format === "excel" ? "store_owners.xlsx" : "store_owners.csv";
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

  const handleContentAction = async (
    contentType: string,
    action: "approve" | "reject",
  ) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.STORE_CONTENT_APPROVE.replace(":id", selectedStore?.user._id || "")}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            contentType,
            action,
            notes: moderatorNotes,
          }),
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Content ${action}d successfully.`,
        });
        if (selectedStore) {
          fetchStoreContent(selectedStore.user._id);
        }
      } else {
        throw new Error(`Failed to ${action} content`);
      }
    } catch (err: any) {
      console.error(`Error ${action}ing content:`, err);
      toast({
        title: "Error",
        description: `Failed to ${action} content.`,
        variant: "destructive",
      });
    }
  };

  const handleRollback = async (versionId: string) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.STORE_CONTENT_ROLLBACK.replace(":id", selectedStore?.user._id || "")}`,
        {
          method: "POST",
          body: JSON.stringify({ versionId }),
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Content rolled back successfully.",
        });
        if (selectedStore) {
          fetchStoreContent(selectedStore.user._id);
        }
      } else {
        throw new Error("Failed to rollback content");
      }
    } catch (err: any) {
      console.error("Error rolling back content:", err);
      toast({
        title: "Error",
        description: "Failed to rollback content.",
        variant: "destructive",
      });
    }
  };

  const handleCreateStoreOwner = async () => {
    try {
      if (
        !newStoreOwner.full_name ||
        !newStoreOwner.email ||
        !newStoreOwner.password ||
        !newStoreOwner.store_name
      ) {
        toast({
          title: "Missing fields",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }
      const baseUrl = API_CONFIG.BASE_URL;

      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.CREATE_STORE_OWNER}`,
        {
          method: "POST",
          body: JSON.stringify(newStoreOwner),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create store owner");
      }

      toast({
        title: "Success",
        description: "Store owner created successfully",
      });

      setAddStoreDialogOpen(false);
      setNewStoreOwner({
        full_name: "",
        store_name: "",
        email: "",
        password: "",
        phone_number: "",
        address: "",
        expertise_level: "",
      });

      fetchStoreOwners();
    } catch (err: any) {
      console.error("Error creating store owner:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create store owner",
        variant: "destructive",
      });
    }
  };

  const storeOwnersColumns: Column<StoreOwner>[] = [
    {
      key: "store_name",
      header: "Store Name",
      sortable: true,
      searchable: true,
      render: (_, storeOwner) => (
        <div>
          <p className="font-medium">{storeOwner.user.store_name}</p>
          <p className="text-sm text-muted-foreground">
            {storeOwner.user.full_name}
          </p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      searchable: true,
      render: (_, storeOwner) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{storeOwner.user.email}</span>
          </div>
          {storeOwner.user.phone_number && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{storeOwner.user.phone_number}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "subscription",
      header: "Subscription",
      render: (_, storeOwner) => {
        const subscription = storeOwner?.user?.subscription;
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
      render: (_, storeOwner) => {
        const status = storeOwner?.user?.status ?? "pending";
        return (
          <Badge
            variant={
              status === "approved"
                ? "default"
                : status === "rejected"
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
      render: (_, storeOwner) =>
        new Date(storeOwner.user.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, storeOwner) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStore(storeOwner);
              setDetailsDialogOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStore(storeOwner);
              fetchStoreContent(storeOwner.user._id);
              setContentDialogOpen(true);
            }}
          >
            <FileText className="w-4 h-4" />
          </Button>

          {storeOwner.user.status === "pending" && (
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
                    <AlertDialogTitle>Approve Store Owner</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve{" "}
                      {storeOwner.user.store_name}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleAction("approve", storeOwner.user._id)
                      }
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
                    <AlertDialogTitle>Reject Store Owner</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject{" "}
                      {storeOwner.user.store_name}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        handleAction("reject", storeOwner.user._id)
                      }
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Store Owner</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {storeOwner.user.store_name}?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleAction("delete", storeOwner.user._id)}
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

  // ✅ NEW — columns for the raw "All Stores" table
  const allStoresColumns: Column<StoreRecord>[] = [
    {
      key: "store_name",
      header: "Store Name",
      sortable: true,
      searchable: true,
      render: (_, store) => (
        <div>
          <p className="font-medium">{store.store_name}</p>
          {!store.user_id || store.user_id === "unassigned" ? (
            <p className="text-xs text-muted-foreground">No owner (bulk-uploaded)</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      searchable: true,
      render: (_, store) => (
        <div className="flex items-start gap-1">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm">
            {[store.address, store.city, store.state, store.zip_code].filter(Boolean).join(", ") || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "coordinates",
      header: "On Map",
      render: (_, store) =>
        store.user_latitude && store.user_longitude ? (
          <Badge variant="default" className="bg-green-600">Located</Badge>
        ) : (
          <Badge variant="destructive">Not located</Badge>
        ),
    },
    {
      key: "verified",
      header: "Verified",
      render: (_, store) =>
        store.verified ? (
          <Badge variant="default">Verified</Badge>
        ) : (
          <Badge variant="secondary">Unverified</Badge>
        ),
    },
    {
      key: "stats",
      header: "Stats",
      render: (_, store) => (
        <span className="text-sm text-muted-foreground">
          {store.views_count ?? 0} views · {store.likes ?? 0} likes
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, store) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600"
              disabled={deletingStoreId === store._id}
            >
              {deletingStoreId === store._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Store</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{store.store_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteStore(store._id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ];

  const stats = {
    total: storeOwners.length,
    approved: storeOwners.filter((so) => so.user.status === "approved").length,
    pending: storeOwners.filter((so) => so.user.status === "pending").length,
    rejected: storeOwners.filter((so) => so.user.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading store owners...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Store Owners Management
            </h1>
            <p className="text-muted-foreground">
              Manage store owners, approve applications, and moderate content
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => setAddStoreDialogOpen(true)}>
              <Store className="w-4 h-4 mr-2" />
              Add Store Owner
            </Button>
            <BulkUploadStores
              onSuccess={() => {
                fetchStoreOwners();
                fetchAllStores();
              }}
            />
            <Button variant="outline" onClick={() => handleExport("csv")}>
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("excel")}>
              Export Excel
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-orange-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Stores</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
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
                  <p className="text-2xl font-bold text-green-600">
                    {stats.approved}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
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
                  <p className="text-2xl font-bold text-red-600">
                    {stats.rejected}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Owners Table */}
        <Card>
          <CardHeader>
            <CardTitle>Store Owners ({storeOwners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={storeOwners}
              columns={storeOwnersColumns}
              searchable={true}
              sortable={true}
            />
          </CardContent>
        </Card>

        {/* ✅ NEW — All Stores Table (raw Store documents, including bulk-uploaded ones) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle>All Stores ({allStores.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchAllStores} disabled={isLoadingStores}>
                  {isLoadingStores ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteAllDialogOpen(true)}
                  disabled={allStores.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Stores
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {storesError && (
              <p className="text-orange-600 text-sm mb-4">{storesError}</p>
            )}
            {isLoadingStores ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading stores...
              </div>
            ) : (
              <DataTable
                data={allStores}
                columns={allStoresColumns}
                searchable={true}
                sortable={true}
              />
            )}
          </CardContent>
        </Card>

        {/* ✅ NEW — Delete All Stores confirmation (type-to-confirm, since this
            is irreversible and has no per-item undo the way single deletes do) */}
        <Dialog open={deleteAllDialogOpen} onOpenChange={(v) => {
          if (isDeletingAll) return;
          setDeleteAllDialogOpen(v);
          if (!v) setDeleteAllConfirmText("");
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Delete All Stores
              </DialogTitle>
              <DialogDescription>
                This will permanently delete <strong>all {allStores.length.toLocaleString()} stores</strong> in
                the database, including bulk-uploaded ones. This cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <code className="bg-muted px-1 rounded">DELETE ALL STORES</code> to confirm
              </label>
              <Input
                value={deleteAllConfirmText}
                onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                placeholder="DELETE ALL STORES"
                disabled={isDeletingAll}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteAllDialogOpen(false);
                  setDeleteAllConfirmText("");
                }}
                disabled={isDeletingAll}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAllStores}
                disabled={deleteAllConfirmText !== "DELETE ALL STORES" || isDeletingAll}
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete All Stores"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Store Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Store Owner Details</DialogTitle>
            </DialogHeader>
            {selectedStore && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedStore.user.store_name}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedStore.user.full_name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedStore.user.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedStore.user.phone_number || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>{" "}
                    {selectedStore.user.address || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Joined:</span>{" "}
                    {new Date(
                      selectedStore.user.created_at,
                    ).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <Badge
                      variant={
                        selectedStore.user.status === "approved"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedStore.user.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Subscription:</span>{" "}
                    <Badge variant="outline">
                      {selectedStore.user.subscription?.type ||
                        "No Subscription"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Content Moderation Dialog */}
        <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Content Moderation - {selectedStore?.user.store_name}
              </DialogTitle>
            </DialogHeader>

            {storeContent && (
              <Tabs defaultValue="images" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="descriptions">Descriptions</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="images" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {storeContent.images.map((image, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <img
                            src={image.url}
                            alt={image.description}
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                          <div className="space-y-2">
                            <p className="font-medium">{image.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded:{" "}
                              {new Date(image.uploadDate).toLocaleDateString()}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={
                                  image.status === "approved"
                                    ? "default"
                                    : image.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {image.status}
                              </Badge>
                              {image.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleContentAction("image", "approve")
                                    }
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleContentAction("image", "reject")
                                    }
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            {image.moderatorNotes && (
                              <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                                Note: {image.moderatorNotes}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="descriptions" className="space-y-4">
                  {storeContent.descriptions.map((desc, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{desc.title}</h4>
                            <Badge
                              variant={
                                desc.status === "approved"
                                  ? "default"
                                  : desc.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {desc.status}
                            </Badge>
                          </div>
                          <p className="text-sm">{desc.content}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated:{" "}
                            {new Date(desc.uploadDate).toLocaleDateString()}
                          </p>
                          {desc.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleContentAction("description", "approve")
                                }
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleContentAction("description", "reject")
                                }
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {desc.moderatorNotes && (
                            <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                              Note: {desc.moderatorNotes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Pricing Information</CardTitle>
                        <Badge
                          variant={
                            storeContent.pricing.status === "approved"
                              ? "default"
                              : storeContent.pricing.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {storeContent.pricing.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {storeContent.pricing.items.map((item, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <h5 className="font-medium">{item.name}</h5>
                              <p className="text-lg font-bold text-green-600">
                                ${item.price} {item.currency}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Last updated:{" "}
                          {new Date(
                            storeContent.pricing.lastUpdated,
                          ).toLocaleDateString()}
                        </p>

                        {storeContent.pricing.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                handleContentAction("pricing", "approve")
                              }
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve Pricing
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                handleContentAction("pricing", "reject")
                              }
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject Pricing
                            </Button>
                          </div>
                        )}

                        {storeContent.pricing.moderatorNotes && (
                          <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                            Note: {storeContent.pricing.moderatorNotes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Views
                            </p>
                            <p className="text-2xl font-bold">
                              {storeContent.engagement.views}
                            </p>
                            <p className="text-xs text-green-600">
                              +
                              {storeContent.engagement.views -
                                storeContent.engagement.lastMonth.views}{" "}
                              from last month
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <Heart className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Likes
                            </p>
                            <p className="text-2xl font-bold">
                              {storeContent.engagement.likes}
                            </p>
                            <p className="text-xs text-green-600">
                              +
                              {storeContent.engagement.likes -
                                storeContent.engagement.lastMonth.likes}{" "}
                              from last month
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <MousePointer className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Clicks
                            </p>
                            <p className="text-2xl font-bold">
                              {storeContent.engagement.clicks}
                            </p>
                            <p className="text-xs text-green-600">
                              +
                              {storeContent.engagement.clicks -
                                storeContent.engagement.lastMonth.clicks}{" "}
                              from last month
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Version History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Version History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {storeContent.versions.map((version) => (
                          <div
                            key={version.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                Version {version.id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {version.changes}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(version.timestamp).toLocaleString()}{" "}
                                by {version.moderator}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRollback(version.id)}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Rollback
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium">Moderator Notes</label>
              <Textarea
                placeholder="Add notes for this moderation action..."
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                rows={3}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Store Owner Dialog */}
        <Dialog open={addStoreDialogOpen} onOpenChange={setAddStoreDialogOpen}>
          <DialogContent className="max-w-xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Store Owner</DialogTitle>
              <DialogDescription>
                Enter the details to create a new store owner.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="Enter full name"
                  value={newStoreOwner.full_name}
                  onChange={(e) =>
                    setNewStoreOwner((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Store Name</label>
                <Input
                  placeholder="Enter store name"
                  value={newStoreOwner.store_name}
                  onChange={(e) =>
                    setNewStoreOwner((prev) => ({
                      ...prev,
                      store_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={newStoreOwner.email}
                  onChange={(e) =>
                    setNewStoreOwner((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={newStoreOwner.password}
                  onChange={(e) =>
                    setNewStoreOwner((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="Enter phone number"
                  value={newStoreOwner.phone_number}
                  onChange={(e) =>
                    setNewStoreOwner((prev) => ({
                      ...prev,
                      phone_number: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <Textarea
                  placeholder="Enter address"
                  value={newStoreOwner.address}
                  onChange={(e) =>
                    setNewStoreOwner((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Expertise Level</label>
                <Select
                  value={newStoreOwner.expertise_level}
                  onValueChange={(value) =>
                    setNewStoreOwner((prev) => ({
                      ...prev,
                      expertise_level: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expertise level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddStoreDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateStoreOwner}>
                Create Store Owner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}