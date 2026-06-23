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
import { Label } from "../components/ui/label";
import {
  Settings as SettingsIcon,
  Plus,
  Edit,
  Trash2,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";

interface ApiKey {
  srNo: number;
  keyName: string;
  keyType: string;
  description: string;
  status: "Active" | "Inactive" | "Expired";
  lastUsed: string;
  createdDate: string;
  expiryDate: string;
  usage: string;
}

const mockApiKeys: ApiKey[] = [
  {
    srNo: 1,
    keyName: "Google Maps API",
    keyType: "Maps Service",
    description: "Used for location services and map display",
    status: "Active",
    lastUsed: "2024-01-15",
    createdDate: "2023-12-01",
    expiryDate: "2024-12-01",
    usage: "245/1000 requests",
  },
  {
    srNo: 2,
    keyName: "Google Vision API",
    keyType: "AI/ML Service",
    description: "Image recognition and text extraction",
    status: "Active",
    lastUsed: "2024-01-14",
    createdDate: "2023-12-01",
    expiryDate: "2024-12-01",
    usage: "89/500 requests",
  },
  {
    srNo: 3,
    keyName: "AWS S3 Storage",
    keyType: "Storage Service",
    description: "File storage and content delivery",
    status: "Active",
    lastUsed: "2024-01-15",
    createdDate: "2023-11-15",
    expiryDate: "2024-11-15",
    usage: "2.3GB/10GB",
  },
  {
    srNo: 4,
    keyName: "SendGrid Email API",
    keyType: "Email Service",
    description: "Transactional email delivery",
    status: "Active",
    lastUsed: "2024-01-15",
    createdDate: "2023-12-01",
    expiryDate: "2024-12-01",
    usage: "1,245/5,000 emails",
  },
  {
    srNo: 5,
    keyName: "Razorpay Payment Gateway",
    keyType: "Payment Service",
    description: "Payment processing and gateway",
    status: "Active",
    lastUsed: "2024-01-15",
    createdDate: "2023-11-01",
    expiryDate: "2024-11-01",
    usage: "₹2,45,680 processed",
  },
  {
    srNo: 6,
    keyName: "Twilio SMS API",
    keyType: "SMS Service",
    description: "SMS notifications and OTP delivery",
    status: "Inactive",
    lastUsed: "2024-01-10",
    createdDate: "2023-12-01",
    expiryDate: "2024-12-01",
    usage: "456/2,000 SMS",
  },
  {
    srNo: 7,
    keyName: "Firebase Analytics",
    keyType: "Analytics Service",
    description: "App analytics and user tracking",
    status: "Expired",
    lastUsed: "2023-12-30",
    createdDate: "2023-06-01",
    expiryDate: "2023-12-31",
    usage: "N/A",
  },
];

export default function Settings() {
  const [showApiKey, setShowApiKey] = useState<{ [key: number]: boolean }>({});

  const toggleApiKeyVisibility = (srNo: number) => {
    setShowApiKey((prev) => ({
      ...prev,
      [srNo]: !prev[srNo],
    }));
  };

  const apiKeyColumns: Column<ApiKey>[] = [
    {
      key: "srNo",
      header: "Sr No.",
      sortable: true,
    },
    {
      key: "keyName",
      header: "API Key Name",
      sortable: true,
      searchable: true,
      render: (value) => <div className="font-medium">{value}</div>,
    },
    {
      key: "keyType",
      header: "Type",
      sortable: true,
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "description",
      header: "Description",
      searchable: true,
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value) => (
        <Badge
          variant={
            value === "Active"
              ? "default"
              : value === "Inactive"
                ? "secondary"
                : "destructive"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (value) => <span className="text-sm font-mono">{value}</span>,
    },
    {
      key: "expiryDate",
      header: "Expires",
      sortable: true,
    },
    {
      key: "srNo",
      header: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleApiKeyVisibility(row.srNo)}
            title="Toggle Key Visibility"
          >
            {showApiKey[row.srNo] ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button size="sm" variant="outline" title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" title="Delete">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage system settings and API keys
            </p>
          </div>
          <Button className="bg-biniq-teal hover:bg-biniq-teal/90">
            <Plus className="w-4 h-4 mr-2" />
            Add API Key
          </Button>
        </div>

        {/* API Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total API Keys
                  </p>
                  <p className="text-2xl font-bold text-biniq-navy">
                    {mockApiKeys.length}
                  </p>
                </div>
                <Key className="h-8 w-8 text-biniq-teal" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Keys</p>
                  <p className="text-2xl font-bold text-green-600">
                    {mockApiKeys.filter((k) => k.status === "Active").length}
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
                  <p className="text-sm text-muted-foreground">Inactive Keys</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {mockApiKeys.filter((k) => k.status === "Inactive").length}
                  </p>
                </div>
                <Badge variant="secondary">Inactive</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expired Keys</p>
                  <p className="text-2xl font-bold text-red-600">
                    {mockApiKeys.filter((k) => k.status === "Expired").length}
                  </p>
                </div>
                <Badge variant="destructive">Expired</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Keys Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys Management ({mockApiKeys.length} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={mockApiKeys}
              columns={apiKeyColumns}
              searchPlaceholder="Search API keys..."
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* System Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-name">Application Name</Label>
                <Input
                  id="app-name"
                  defaultValue="binIQ Admin Panel"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  defaultValue="admin@biniq.com"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  defaultValue="support@biniq.com"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                <Input
                  id="max-file-size"
                  type="number"
                  defaultValue="10"
                  className="w-full"
                />
              </div>
              <Button className="w-full bg-biniq-teal hover:bg-biniq-teal/90">
                Save General Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Business Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-commission">
                  Default Commission Rate (%)
                </Label>
                <Input
                  id="default-commission"
                  type="number"
                  defaultValue="5"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-payout">Minimum Payout Amount (₹)</Label>
                <Input
                  id="min-payout"
                  type="number"
                  defaultValue="500"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timeout">
                  Session Timeout (minutes)
                </Label>
                <Input
                  id="session-timeout"
                  type="number"
                  defaultValue="30"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Backup Frequency</Label>
                <Input
                  id="backup-frequency"
                  defaultValue="Daily"
                  className="w-full"
                />
              </div>
              <Button className="w-full bg-biniq-teal hover:bg-biniq-teal/90">
                Save Business Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
