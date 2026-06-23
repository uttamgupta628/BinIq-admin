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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Bell, Plus, Eye } from "lucide-react";
import { useState, useEffect, Component, ReactNode } from "react";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600">
          <h2>Error: {this.state.error}</h2>
          <p>Please check the console for details and refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Notification {
  _id: string;
  srNo: number;
  title: string;
  content: string;
  targetAudience: "All Users" | "Store Owners" | "Resellers" | "Premium Users";
  type: "Info" | "Warning" | "Success" | "Error" | "Promotion";
  status: "Draft" | "Scheduled" | "Sent" | "Archived";
  scheduledDate?: string;
  sentDate?: string;
  readCount: number;
  totalRecipients: number;
  createdDate: string;
}

interface NotificationResponse {
  _id: string;
  user_id: string;
  heading: string;
  content: string;
  type?: "reseller" | "store_owner" | "all";
  read: boolean;
  created_at: string;
  __v: number;
}

interface NotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  draftNotifications: number;
  avgReadRate: number;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "all" as "all" | "reseller" | "store_owner",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<NotificationStats>({
    totalNotifications: 0,
    sentNotifications: 0,
    draftNotifications: 0,
    avgReadRate: 0,
  });

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        console.log("Starting notifications fetch..."); // Debug log
        setIsLoading(true);
        setError(null);

        const baseUrl = API_CONFIG.BASE_URL;
        const response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.NOTIFICATIONS}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: NotificationResponse[] = await response.json();

        console.log("Fetched Notifications:", data); // Debug log

        const mappedNotifications: Notification[] = data.map(
          (notification, index) => ({
            _id: notification._id,
            srNo: index + 1,
            title: notification.heading,
            content: notification.content,
            targetAudience:
              notification.type === "store_owner"
                ? "Store Owners"
                : notification.type === "reseller"
                  ? "Resellers"
                  : "All Users",
            type: "Info", // Default, as API doesn't provide type like UI expects
            status: notification.read ? "Sent" : "Draft", // Approximate based on read status
            scheduledDate: undefined,
            sentDate: notification.read
              ? new Date(notification.created_at).toLocaleDateString()
              : undefined,
            readCount: notification.read ? 1 : 0,
            totalRecipients: 1, // Default, as user_id suggests per-user notifications
            createdDate: new Date(notification.created_at).toLocaleDateString(),
          }),
        );

        console.log("Mapped Notifications:", mappedNotifications); // Debug log

        const totalNotifications = mappedNotifications.length;
        const sentNotifications = mappedNotifications.filter(
          (n) => n.status === "Sent",
        ).length;
        const draftNotifications = mappedNotifications.filter(
          (n) => n.status === "Draft",
        ).length;
        const avgReadRate = totalNotifications
          ? Math.round(
              mappedNotifications.reduce(
                (acc, n) => acc + (n.readCount / n.totalRecipients) * 100,
                0,
              ) / totalNotifications,
            )
          : 0;

        setNotifications(mappedNotifications);
        setStats({
          totalNotifications,
          sentNotifications,
          draftNotifications,
          avgReadRate,
        });
        console.log("Computed stats:", {
          totalNotifications,
          sentNotifications,
          draftNotifications,
          avgReadRate,
        }); // Debug log
      } catch (err: any) {
        console.error("Error fetching notifications:", err.message); // Debug log
        setError(`Failed to load notifications: ${err.message}`);
      } finally {
        setIsLoading(false);
        console.log("Fetch notifications completed, isLoading:", false); // Debug log
      }
    };

    fetchNotifications();
  }, []);

  // Handle Add Notification
  const handleAddNotification = () => {
    console.log("Opening add notification modal"); // Debug log
    setFormData({ title: "", content: "", type: "all" });
    setAddDialogOpen(true);
  };

  const handleSubmitNotification = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and Content are required.");
      console.log("Validation failed: Title or Content empty"); // Debug log
      return;
    }

    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const payload = {
        heading: formData.title,
        content: formData.content,
        type: formData.type,
      };

      console.log("Submitting notification payload:", payload); // Debug log
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.NOTIFICATIONS}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();
      console.log("Add notification response:", result); // Debug log

      if (result.message === "Notification created successfully") {
        const newNotification: Notification = {
          _id: result.notification_id,
          srNo: notifications.length + 1,
          title: formData.title,
          content: formData.content,
          targetAudience:
            formData.type === "store_owner"
              ? "Store Owners"
              : formData.type === "reseller"
                ? "Resellers"
                : "All Users",
          type: "Info",
          status: "Draft",
          scheduledDate: undefined,
          sentDate: undefined,
          readCount: 0,
          totalRecipients: 1,
          createdDate: new Date().toLocaleDateString(),
        };

        setNotifications((prev) => [...prev, newNotification]);
        setStats((prev) => ({
          ...prev,
          totalNotifications: prev.totalNotifications + 1,
          draftNotifications: prev.draftNotifications + 1,
        }));
      }

      setAddDialogOpen(false);
      setFormData({ title: "", content: "", type: "all" });
    } catch (err: any) {
      console.error("Error adding notification:", err.message); // Debug log
      setError(`Failed to add notification: ${err.message}`);
    }
  };

  const notificationColumns: Column<Notification>[] = [
    {
      key: "srNo",
      header: "Sr No.",
      sortable: true,
      render: (_, row) => {
        console.log("Rendering Sr No. for:", row.title); // Debug log
        return row.srNo;
      },
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      searchable: true,
      render: (_, row) => {
        console.log("Rendering Title for:", row.title); // Debug log
        return (
          <div className="max-w-sm truncate font-medium" title={row.title}>
            {row.title}
          </div>
        );
      },
    },
    {
      key: "content",
      header: "Content",
      sortable: true,
      searchable: true,
      render: (_, row) => {
        console.log("Rendering Content for:", row.title); // Debug log
        return (
          <div className="max-w-sm truncate font-medium" title={row.content}>
            {row.content}
          </div>
        );
      },
    },
    {
      key: "targetAudience",
      header: "Target Audience",
      sortable: true,
      render: (_, row) => {
        console.log("Rendering Target Audience for:", row.title); // Debug log
        return <Badge variant="outline">{row.targetAudience}</Badge>;
      },
    },
    {
      key: "createdDate",
      header: "Created",
      sortable: true,
      render: (_, row) => {
        console.log("Rendering Created Date for:", row.title); // Debug log
        return row.createdDate;
      },
    },
  ];

  return (
    <ErrorBoundary>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Notifications
              </h1>
              <p className="text-muted-foreground">
                Manage system notifications and announcements
              </p>
            </div>
            <Button
              className="bg-biniq-teal hover:bg-biniq-teal/90"
              onClick={handleAddNotification}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Notification
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-100 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {/* Notification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Notifications
                    </p>
                    <p className="text-2xl font-bold text-biniq-navy">
                      {isLoading ? "Loading..." : stats.totalNotifications}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-biniq-teal" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications Management ({notifications.length} total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading notifications...</div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : notifications.length === 0 ? (
                <div>No notifications found.</div>
              ) : (
                <DataTable
                  data={notifications}
                  columns={notificationColumns}
                  searchPlaceholder="Search notifications..."
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>

          {/* Add Notification Modal */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Notification</DialogTitle>
                <DialogDescription>
                  Enter the details for the new notification.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter notification title"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Content
                  </label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Enter notification content"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Target User
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      console.log("Selected Target User:", value); // Debug log
                      setFormData({ ...formData, type: value });
                    }}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select target user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="reseller">Resellers</SelectItem>
                      <SelectItem value="store_owner">Store Owners</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitNotification}
                  disabled={!formData.title.trim() || !formData.content.trim()}
                  className="bg-biniq-teal hover:bg-biniq-teal/90"
                >
                  Add Notification
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ErrorBoundary>
  );
}
