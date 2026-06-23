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
  MapPin,
  Eye,
  Check,
  X,
  Clock,
  Filter,
  Search,
  Map,
  Store,
  User,
  Calendar,
  Phone,
  Mail,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";
import { toast } from "../hooks/use-toast";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";

interface Location {
  _id: string;
  name: string;
  type: "store" | "reseller" | "warehouse" | "office";
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  verification: {
    status: "verified" | "pending" | "rejected" | "unverified";
    verifiedBy?: string;
    verifiedDate?: string;
    notes?: string;
    documents: {
      businessLicense?: string;
      addressProof?: string;
      photos?: string[];
    };
  };
  operatingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  contact: {
    website?: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface LocationsResponse {
  success: boolean;
  data: Location[];
}

export default function LocationsEnhanced() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");

  // Verification form state
  const [verificationNotes, setVerificationNotes] = useState("");
  const mapContainerStyle = {
    width: "100%",
    height: "100%",
  };

  const center = {
    lat: 20.5937,
    lng: 78.9629,
  };
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const generateMockLocations = (): Location[] => [
    {
      _id: "1",
      name: "Smith's Electronics Store",
      type: "store",
      address: {
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
      },
      coordinates: {
        latitude: 40.7128,
        longitude: -74.006,
      },
      owner: {
        id: "user1",
        name: "John Smith",
        email: "john@smithelectronics.com",
        phone: "+1234567890",
      },
      verification: {
        status: "verified",
        verifiedBy: "Admin User",
        verifiedDate: "2024-01-20",
        notes: "Business license and address verified",
        documents: {
          businessLicense: "license_001.pdf",
          addressProof: "address_proof_001.pdf",
          photos: ["store_front.jpg", "interior.jpg"],
        },
      },
      operatingHours: {
        monday: { open: "09:00", close: "18:00" },
        tuesday: { open: "09:00", close: "18:00" },
        wednesday: { open: "09:00", close: "18:00" },
        thursday: { open: "09:00", close: "18:00" },
        friday: { open: "09:00", close: "20:00" },
        saturday: { open: "10:00", close: "16:00" },
        sunday: { open: "12:00", close: "16:00" },
      },
      contact: {
        website: "https://smithelectronics.com",
        description: "Your trusted electronics store for over 10 years",
      },
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
      isActive: true,
    },
    {
      _id: "2",
      name: "Green Valley Market",
      type: "store",
      address: {
        street: "456 Oak Avenue",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90210",
        country: "USA",
      },
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437,
      },
      owner: {
        id: "user2",
        name: "Sarah Johnson",
        email: "sarah@greenvalley.com",
        phone: "+1987654321",
      },
      verification: {
        status: "pending",
        notes: "Awaiting address verification documents",
        documents: {
          businessLicense: "license_002.pdf",
          photos: ["store_front_2.jpg"],
        },
      },
      operatingHours: {
        monday: { open: "08:00", close: "19:00" },
        tuesday: { open: "08:00", close: "19:00" },
        wednesday: { open: "08:00", close: "19:00" },
        thursday: { open: "08:00", close: "19:00" },
        friday: { open: "08:00", close: "20:00" },
        saturday: { open: "09:00", close: "18:00" },
        sunday: { open: "10:00", close: "17:00" },
      },
      contact: {
        description: "Fresh organic produce and groceries",
      },
      createdAt: "2024-02-01",
      updatedAt: "2024-02-05",
      isActive: true,
    },
    {
      _id: "3",
      name: "Tech Solutions Hub",
      type: "reseller",
      address: {
        street: "789 Tech Boulevard",
        city: "Austin",
        state: "TX",
        zipCode: "73301",
        country: "USA",
      },
      coordinates: {
        latitude: 30.2672,
        longitude: -97.7431,
      },
      owner: {
        id: "user3",
        name: "Mike Chen",
        email: "mike@techsolutions.com",
        phone: "+1555123456",
      },
      verification: {
        status: "rejected",
        verifiedBy: "Admin User",
        verifiedDate: "2024-01-25",
        notes: "Invalid business license provided",
        documents: {
          businessLicense: "invalid_license.pdf",
        },
      },
      operatingHours: {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: { open: "Closed", close: "Closed" },
        sunday: { open: "Closed", close: "Closed" },
      },
      contact: {
        website: "https://techsolutions.com",
        description: "IT consulting and technology solutions",
      },
      createdAt: "2024-01-20",
      updatedAt: "2024-01-25",
      isActive: false,
    },
  ];

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    filterLocations();
  }, [locations, searchQuery, typeFilter, statusFilter, verificationFilter]);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = API_CONFIG.BASE_URL;

      const [storeRes, resellerRes] = await Promise.all([
        AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.ALL_STORE_OWNERS}`,
        ),
        AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.ALL_RESELLERS}`,
        ),
      ]);
      const addressRes = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/api/users/locationDetails`,
      );

      const addressData = await addressRes.json();

      const storeData = await storeRes.json();
      const resellerData = await resellerRes.json();

      const storeLocations: Location[] = storeData.data.map((item: any) => ({
        _id: item.user._id,

        name: item.store?.store_name || item.user.store_name || "Store",

        type: "store",

        address: {
          street: item.store?.address || item.user.address || "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },

        coordinates: {
          latitude: item.store?.user_latitude || 0,
          longitude: item.store?.user_longitude || 0,
        },

        owner: {
          id: item.user._id,
          name: item.user.full_name,
          email: item.user.email,
          phone: item.user.phone_number,
        },

        verification: {
          status:
            item.user.status === "approved"
              ? "verified"
              : item.user.status === "rejected"
                ? "rejected"
                : "pending",
          notes: "",
          documents: {
            businessLicense: null,
            addressProof: null,
            photos: [],
          },
        },

        operatingHours: {
          monday: { open: "09:00", close: "18:00" },
          tuesday: { open: "09:00", close: "18:00" },
          wednesday: { open: "09:00", close: "18:00" },
          thursday: { open: "09:00", close: "18:00" },
          friday: { open: "09:00", close: "18:00" },
          saturday: { open: "Closed", close: "Closed" },
          sunday: { open: "Closed", close: "Closed" },
        },

        contact: {
          description: "",
        },

        createdAt: item.user.created_at,
        updatedAt: item.user.updated_at,

        isActive: item.user.status === "approved",
      }));

      const resellerLocations: Location[] = resellerData.data.map(
        (item: any) => ({
          _id: item.user._id,

          name: item.user.full_name,

          type: "reseller",

          address: {
            street: item.store?.address || item.user.address || "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },

          coordinates: {
            latitude: 0,
            longitude: 0,
          },

          owner: {
            id: item.user._id,
            name: item.user.full_name,
            email: item.user.email,
            phone: item.user.phone_number,
          },

          verification: {
            status:
              item.user.status === "approved"
                ? "verified"
                : item.user.status === "rejected"
                  ? "rejected"
                  : "pending",
            notes: "",
            documents: {
              businessLicense: null,
              addressProof: null,
              photos: [],
            },
          },

          operatingHours: {
            monday: { open: "09:00", close: "18:00" },
            tuesday: { open: "09:00", close: "18:00" },
            wednesday: { open: "09:00", close: "18:00" },
            thursday: { open: "09:00", close: "18:00" },
            friday: { open: "09:00", close: "18:00" },
            saturday: { open: "Closed", close: "Closed" },
            sunday: { open: "Closed", close: "Closed" },
          },

          contact: {
            description: "",
          },

          createdAt: item.user.created_at,
          updatedAt: item.user.updated_at,

          isActive: item.user.status === "approved",
        }),
      );

      const addressLocations: Location[] = await Promise.all(
        addressData.data.map(async (item: any) => {
          const coords = await geocodeAddress(item.address);

          if (!coords) return null;

          return {
            _id: item.user_id,
            name: item.address,
            type: "store",

            address: {
              street: item.address,
              city: "",
              state: "",
              zipCode: "",
              country: "",
            },

            coordinates: {
              latitude: coords.lat,
              longitude: coords.lng,
            },

            owner: {
              id: item.user_id,
              name: "",
              email: "",
            },

            verification: {
              status:
                item.status === "approved"
                  ? "verified"
                  : item.status === "rejected"
                    ? "rejected"
                    : "pending",
              notes: "",
              documents: {
                photos: [],
              },
            },

            operatingHours: {
              monday: { open: "Closed", close: "Closed" },
              tuesday: { open: "Closed", close: "Closed" },
              wednesday: { open: "Closed", close: "Closed" },
              thursday: { open: "Closed", close: "Closed" },
              friday: { open: "Closed", close: "Closed" },
              saturday: { open: "Closed", close: "Closed" },
              sunday: { open: "Closed", close: "Closed" },
            },

            contact: {},

            createdAt: "",
            updatedAt: "",

            isActive: item.status === "approved",
          };
        }),
      );

      const validAddressLocations = addressLocations.filter(
        Boolean,
      ) as Location[];

      setLocations([
        ...storeLocations,
        ...resellerLocations,
        ...validAddressLocations,
      ]);
    } catch (err) {
      console.error("Error fetching locations:", err);
      setError("Failed to load locations.");
    } finally {
      setIsLoading(false);
    }
  };

  const filterLocations = () => {
    let filtered = [...locations];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (location) =>
          location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.owner.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          location.address.city
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          location.address.state
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((location) => location.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((location) =>
        statusFilter === "active" ? location.isActive : !location.isActive,
      );
    }

    // Verification filter
    if (verificationFilter !== "all") {
      filtered = filtered.filter(
        (location) => location.verification.status === verificationFilter,
      );
    }

    setFilteredLocations(filtered);
  };

  const handleVerificationAction = async (
    locationId: string,
    action: "verify" | "reject",
  ) => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.LOCATIONS_VERIFICATION}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            locationId,
            action,
            notes: verificationNotes,
          }),
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Location ${action === "verify" ? "verified" : "rejected"} successfully.`,
        });
        setVerificationDialogOpen(false);
        setVerificationNotes("");
        fetchLocations();
      } else {
        throw new Error(`Failed to ${action} location`);
      }
    } catch (err: any) {
      console.error(`Error ${action}ing location:`, err);
      toast({
        title: "Error",
        description: `Failed to ${action} location.`,
        variant: "destructive",
      });
    }
  };

  const locationsColumns: Column<Location>[] = [
    {
      key: "name",
      header: "Location",
      sortable: true,
      searchable: true,
      render: (_, location) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              location.verification.status === "verified"
                ? "bg-green-500"
                : location.verification.status === "pending"
                  ? "bg-yellow-500"
                  : location.verification.status === "rejected"
                    ? "bg-red-500"
                    : "bg-gray-400"
            }`}
          />
          <div>
            <p className="font-medium">{location.name}</p>
            {/* <p className="text-sm text-muted-foreground">
              {location.address.city}, {location.address.state}
            </p> */}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (_, location) => (
        <Badge
          variant={
            location.type === "store"
              ? "default"
              : location.type === "reseller"
                ? "secondary"
                : "outline"
          }
        >
          {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
        </Badge>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (_, location) => (
        <div className="space-y-1">
          <p className="font-medium">{location.owner.name}</p>
          <div className="flex items-center gap-1">
            <Mail className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {location.owner.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "address",
      header: "Location",
      render: (_, location) => 
        {const address = location.address?.street?.trim();

    return (
      <div className="max-w-xs">
        <p className="text-sm text-muted-foreground">
          {address ? address : "No location provided"}
        </p>
      </div>
    );
    },
  },
    {
      key: "verification",
      header: "Verification",
      render: (_, location) => (
        <div className="space-y-1">
          <Badge
            variant={
              location.verification.status === "verified"
                ? "default"
                : location.verification.status === "pending"
                  ? "secondary"
                  : location.verification.status === "rejected"
                    ? "destructive"
                    : "outline"
            }
          >
            {location.verification.status === "verified" && (
              <ShieldCheck className="w-3 h-3 mr-1" />
            )}
            {location.verification.status === "pending" && (
              <Clock className="w-3 h-3 mr-1" />
            )}
            {location.verification.status === "rejected" && (
              <AlertTriangle className="w-3 h-3 mr-1" />
            )}
            {location.verification.status.charAt(0).toUpperCase() +
              location.verification.status.slice(1)}
          </Badge>
          {location.verification.verifiedDate && (
            <p className="text-xs text-muted-foreground">
              {new Date(
                location.verification.verifiedDate,
              ).toLocaleDateString()}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_, location) => (
        <Badge variant={location.isActive ? "default" : "secondary"}>
          {location.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, location) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedLocation(location);
              setDetailsDialogOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {location.verification.status === "pending" && (
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
                    <AlertDialogTitle>Verify Location</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to verify {location.name}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setSelectedLocation(location);
                        setVerificationDialogOpen(true);
                      }}
                    >
                      Verify
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
                    <AlertDialogTitle>Reject Location</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject {location.name}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setSelectedLocation(location);
                        setVerificationDialogOpen(true);
                      }}
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      ),
    },
  ];

  const stats = {
    total: locations.length,
    verified: locations.filter((l) => l.verification.status === "verified")
      .length,
    pending: locations.filter((l) => l.verification.status === "pending")
      .length,
    rejected: locations.filter((l) => l.verification.status === "rejected")
      .length,
    stores: locations.filter((l) => l.type === "store").length,
    resellers: locations.filter((l) => l.type === "reseller").length,
  };
  const geocodeAddress = async (address: string) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=${apiKey}`,
      );

      const data = await res.json();

      if (data.results.length > 0) {
        const location = data.results[0].geometry.location;

        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      return null;
    } catch (error) {
      console.error("Geocode error:", error);
      return null;
    }
  };
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading locations...</p>
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
          <h1 className="text-3xl font-bold text-foreground">
            Locations Management
          </h1>
          <p className="text-muted-foreground">
            Manage and verify business locations with integrated mapping
          </p>
        </div>

        {error && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-orange-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Locations List</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Verified</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.verified}
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
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.rejected}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Stores</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.stores}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Resellers</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {stats.resellers}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="store">Stores</SelectItem>
                      <SelectItem value="reseller">Resellers</SelectItem>
                      <SelectItem value="warehouse">Warehouses</SelectItem>
                      <SelectItem value="office">Offices</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={verificationFilter}
                    onValueChange={setVerificationFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Verification Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Active Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Locations Table */}
            <Card>
              <CardHeader>
                <CardTitle>Locations ({filteredLocations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={filteredLocations}
                  columns={locationsColumns}
                  searchable={true}
                  sortable={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            {/* Map View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Interactive Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                  {!isLoaded ? (
                    <div className="flex items-center justify-center h-full">
                      Loading Map...
                    </div>
                  ) : (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      zoom={5}
                      center={center}
                    >
                      {filteredLocations.map((location) => {
                        const lat = Number(location.coordinates.latitude);
                        const lng = Number(location.coordinates.longitude);

                        if (!lat || !lng) return null;

                        return (
                          <Marker
                            key={location._id}
                            position={{ lat, lng }}
                            onClick={() => setSelectedLocation(location)}
                          />
                        );
                      })}

                      {/* return (
                          <Marker
                            key={location._id}
                            position={{ lat, lng }}
                            onClick={() => {
                              setSelectedLocation(location);
                              setDetailsDialogOpen(true);
                            }}
                          />
                        );
                      })} */}
                    </GoogleMap>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Map Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Navigation className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold">{locations.length}</p>
                    <p className="text-sm text-muted-foreground">
                      Total Locations
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <ShieldCheck className="w-8 h-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold">
                      {Math.round((stats.verified / stats.total) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Verification Rate
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">
                      Pending Review
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Location Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedLocation?.name}</DialogTitle>
              <DialogDescription>
                Location details and verification information
              </DialogDescription>
            </DialogHeader>

            {selectedLocation && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="font-medium">Name:</span>{" "}
                        {selectedLocation.name}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>{" "}
                        <Badge variant="outline">{selectedLocation.type}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        <Badge
                          variant={
                            selectedLocation.isActive ? "default" : "secondary"
                          }
                        >
                          {selectedLocation.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{" "}
                        {new Date(
                          selectedLocation.createdAt,
                        ).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Owner Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="font-medium">Name:</span>{" "}
                        {selectedLocation.owner.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedLocation.owner.email}</span>
                      </div>
                      {selectedLocation.owner.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedLocation.owner.phone}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Address and Coordinates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Address & Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Address</h4>
                        <div className="space-y-1 text-sm">
                          <p>{selectedLocation.address.street}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Coordinates</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            Latitude: {selectedLocation.coordinates.latitude}
                          </p>
                          <p>
                            Longitude: {selectedLocation.coordinates.longitude}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Verification Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <Badge
                          variant={
                            selectedLocation.verification.status === "verified"
                              ? "default"
                              : selectedLocation.verification.status ===
                                  "pending"
                                ? "secondary"
                                : selectedLocation.verification.status ===
                                    "rejected"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {selectedLocation.verification.status
                            .charAt(0)
                            .toUpperCase() +
                            selectedLocation.verification.status.slice(1)}
                        </Badge>
                      </div>

                      {selectedLocation.verification.verifiedBy && (
                        <div>
                          <span className="font-medium">Verified by:</span>{" "}
                          {selectedLocation.verification.verifiedBy}
                        </div>
                      )}

                      {selectedLocation.verification.verifiedDate && (
                        <div>
                          <span className="font-medium">Verified on:</span>{" "}
                          {new Date(
                            selectedLocation.verification.verifiedDate,
                          ).toLocaleDateString()}
                        </div>
                      )}

                      {selectedLocation.verification.notes && (
                        <div>
                          <span className="font-medium">Notes:</span>
                          <p className="mt-1 p-2 bg-muted rounded text-sm">
                            {selectedLocation.verification.notes}
                          </p>
                        </div>
                      )}

                      {/* Documents */}
                      {(selectedLocation.verification.documents
                        ?.businessLicense ||
                        selectedLocation.verification.documents?.addressProof ||
                        selectedLocation.verification.documents?.photos) && (
                        <div>
                          <span className="font-medium">Documents:</span>
                          <div className="mt-2 space-y-2">
                            {selectedLocation.verification.documents
                              .businessLicense && (
                              <div className="flex items-center gap-2 text-sm">
                                <Badge variant="outline">
                                  Business License
                                </Badge>
                                <span>
                                  {
                                    selectedLocation.verification.documents
                                      .businessLicense
                                  }
                                </span>
                              </div>
                            )}
                            {selectedLocation.verification.documents
                              .addressProof && (
                              <div className="flex items-center gap-2 text-sm">
                                <Badge variant="outline">Address Proof</Badge>
                                <span>
                                  {
                                    selectedLocation.verification.documents
                                      .addressProof
                                  }
                                </span>
                              </div>
                            )}
                            {selectedLocation.verification.documents.photos && (
                              <div className="flex items-center gap-2 text-sm">
                                <Badge variant="outline">Photos</Badge>
                                <span>
                                  {
                                    selectedLocation.verification.documents
                                      .photos.length
                                  }{" "}
                                  file(s)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Operating Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Operating Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {Object.entries(selectedLocation.operatingHours).map(
                        ([day, hours]) => (
                          <div key={day} className="flex justify-between">
                            <span className="font-medium capitalize">
                              {day}:
                            </span>
                            <span>
                              {hours.open === "Closed"
                                ? "Closed"
                                : `${hours.open} - ${hours.close}`}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                {(selectedLocation.contact.website ||
                  selectedLocation.contact.description) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedLocation.contact.website && (
                        <div>
                          <span className="font-medium">Website:</span>{" "}
                          <a
                            href={selectedLocation.contact.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedLocation.contact.website}
                          </a>
                        </div>
                      )}
                      {selectedLocation.contact.description && (
                        <div>
                          <span className="font-medium">Description:</span>
                          <p className="mt-1">
                            {selectedLocation.contact.description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Verification Dialog */}
        <Dialog
          open={verificationDialogOpen}
          onOpenChange={setVerificationDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Location Verification</DialogTitle>
              <DialogDescription>
                Add verification notes for {selectedLocation?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Verification Notes
                </label>
                <Textarea
                  placeholder="Add notes about the verification decision..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setVerificationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  selectedLocation &&
                  handleVerificationAction(selectedLocation._id, "reject")
                }
              >
                Reject
              </Button>
              <Button
                onClick={() =>
                  selectedLocation &&
                  handleVerificationAction(selectedLocation._id, "verify")
                }
              >
                Verify
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
