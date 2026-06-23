// import AdminLayout from "../components/AdminLayout";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "../components/ui/card";
// import DataTable, { Column } from "../components/ui/DataTable";
// import { Badge } from "../components/ui/badge";
// import { Button } from "../components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "../components/ui/dialog";
// import {
//   Store,
//   Trash2,
//   Check,
//   X,
//   MapPin,
//   Clock,
//   Phone,
//   Mail,
//   Globe,
//   Facebook,
//   Instagram,
//   Twitter,
// } from "lucide-react";
// import { useState, useEffect } from "react";
// import { AuthService } from "../lib/auth";
// import { API_CONFIG } from "../lib/api";
// import BulkUploadStores from "./Bulkuploadstores";

// // Define interfaces for API responses
// interface StoreOwner {
//   user: {
//     _id: string;
//     full_name: string;
//     store_name: string;
//     email: string;
//     role: number;
//     dob: string | null;
//     gender: string | null;
//     phone_number: string | null;
//     address: string | null;
//     expertise_level: string | null;
//     profile_image: string | null;
//     subscription: {
//       _id: string;
//       order_id: string;
//       user_id: string;
//       user_name: string;
//       type: string;
//       plan: string;
//       amount: number;
//       status: string;
//       date: string;
//       duration: number;
//       __v: number;
//     } | null;
//     subscription_end_time: string | null;
//     total_promotions: number;
//     used_promotions: number;
//     promotions: any[];
//     verified: boolean;
//     total_scans: number;
//     scans_used: any[];
//     created_at: string;
//     updated_at: string;
//   };
//   store: {
//     _id: string;
//     user_id: string;
//     store_name: string;
//     user_latitude: number | null;
//     user_longitude: number | null;
//     address: string | null;
//     city: string | null;
//     state: string | null;
//     zip_code: string | null;
//     country: string | null;
//     google_maps_link: string | null;
//     website_url: string | null;
//     working_days: string | null;
//     working_time: string | null;
//     phone_number: string | null;
//     store_email: string | null;
//     facebook_link: string | null;
//     instagram_link: string | null;
//     twitter_link: string | null;
//     whatsapp_link: string | null;
//     followers: number;
//     likes: number;
//     verified: boolean;
//     store_image: string | null;
//     ratings: number;
//     rating_count: number;
//     views_count: number;
//     favorited_by: any[];
//     liked_by: any[];
//     followed_by: any[];
//     comments: any[];
//     created_at: string;
//     updated_at: string;
//     __v: number;
//   };
// }

// interface StoreOwnersResponse {
//   success: boolean;
//   data: StoreOwner[];
// }

// interface ActionResponse {
//   message: string;
// }

// // Confirmation Modal Component
// interface ConfirmationModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: () => Promise<void>;
//   title: string;
//   description: string;
//   confirmText: string;
//   isDestructive?: boolean;
// }

// function ConfirmationModal({
//   isOpen,
//   onClose,
//   onConfirm,
//   title,
//   description,
//   confirmText,
//   isDestructive = false,
// }: ConfirmationModalProps) {
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleConfirm = async () => {
//     setIsSubmitting(true);
//     setError(null);
//     try {
//       await onConfirm();
//       onClose();
//     } catch (err: any) {
//       setError(err.message || "Action failed. Please try again.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>{title}</DialogTitle>
//           <DialogDescription>{description}</DialogDescription>
//         </DialogHeader>
//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">
//             {error}
//           </div>
//         )}
//         <DialogFooter>
//           <Button
//             variant="outline"
//             className="hover:bg-gray-50"
//             onClick={onClose}
//             disabled={isSubmitting}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant={isDestructive ? "destructive" : "default"}
//             onClick={handleConfirm}
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? "Processing..." : confirmText}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// const storeOwnerColumns: Column<StoreOwner>[] = [
//   {
//     key: "id",
//     header: "Sr No.",
//     sortable: true,
//     render: (_, row, index, storeOwners) => {
//       const rowIndex =
//         storeOwners.findIndex((owner) => owner.user._id === row.user._id) + 1;
//       return rowIndex;
//     },
//   },
//   {
//     key: "storeName",
//     header: "Store Name",
//     sortable: true,
//     searchable: true,
//     render: (_, row, _index, _storeOwners, setSelectedStore) => (
//       <button
//         onClick={() => {
//           console.log("Clicked store:", row.user.store_name);
//           setSelectedStore(row);
//         }}
//         className="text-left font-medium text-biniq-teal hover:text-biniq-navy cursor-pointer"
//       >
//         {row.user.store_name || "N/A"}
//       </button>
//     ),
//   },
//   {
//     key: "ownerName",
//     header: "Owner Name",
//     sortable: true,
//     searchable: true,
//     render: (_, row) => row.user.full_name || "N/A",
//   },
//   {
//     key: "address",
//     header: "Address",
//     searchable: true,
//     render: (_, row) => (
//       <div className="max-w-xs truncate" title={row.store.address || "N/A"}>
//         {row.store.address || "N/A"}
//       </div>
//     ),
//   },
//   {
//     key: "phone",
//     header: "Phone",
//     searchable: true,
//     render: (_, row) =>
//       row.store.phone_number || row.user.phone_number || "N/A",
//   },
//   {
//     key: "email",
//     header: "Email",
//     searchable: true,
//     render: (_, row) => row.user.email || row.store.store_email || "N/A",
//   },
//   {
//     key: "premium",
//     header: "Premium User",
//     render: (_, row) => (
//       <div className="space-y-1">
//         <Badge variant={row.user.subscription ? "default" : "secondary"}>
//           {row.user.subscription ? "Yes" : "No"}
//         </Badge>
//         {row.user.subscription && row.user.subscription_end_time && (
//           <div className="text-xs text-muted-foreground">
//             Ends on{" "}
//             {new Date(row.user.subscription_end_time).toLocaleDateString()}
//           </div>
//         )}
//       </div>
//     ),
//   },
//   {
//     key: "promotions",
//     header: "Total Promotions",
//     render: (_, row) => (
//       <div>
//         {row.user.subscription && row.user.total_promotions ? (
//           <span className="font-medium text-biniq-navy">
//             {row.user.used_promotions}/{row.user.total_promotions}
//           </span>
//         ) : (
//           <span className="text-muted-foreground">N/A</span>
//         )}
//       </div>
//     ),
//   },
//   {
//     key: "verified",
//     header: "Verify",
//     sortable: true,
//     render: (_, row, _index, _storeOwners, setActionState) => {
//       const status =
//         row.user.verified || row.store.verified ? "Approved" : "Pending";
//       return (
//         <div className="space-y-2">
//           <Badge
//             variant={
//               status === "Approved"
//                 ? "default"
//                 : status === "Rejected"
//                   ? "destructive"
//                   : "secondary"
//             }
//           >
//             {status}
//           </Badge>
//           {status === "Pending" && (
//             <div className="flex gap-1">
//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={() =>
//                   setActionState({
//                     type: "approve",
//                     userId: row.user._id,
//                     storeName: row.user.store_name,
//                   })
//                 }
//                 className="h-6 px-2"
//               >
//                 <Check className="w-3 h-3 text-green-600" />
//               </Button>
//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={() =>
//                   setActionState({
//                     type: "reject",
//                     userId: row.user._id,
//                     storeName: row.user.store_name,
//                   })
//                 }
//                 className="h-6 px-2"
//               >
//                 <X className="w-3 h-3 text-red-600" />
//               </Button>
//             </div>
//           )}
//         </div>
//       );
//     },
//   },
//   {
//     key: "status",
//     header: "Status",
//     sortable: true,
//     render: (_, row) => (
//       <Badge
//         variant={
//           row.user.subscription?.status === "completed"
//             ? "default"
//             : "secondary"
//         }
//       >
//         {row.user.subscription?.status === "completed" ? "Active" : "Inactive"}
//       </Badge>
//     ),
//   },
//   {
//     key: "actions",
//     header: "Actions",
//     render: (_, row, _index, _storeOwners, setActionState) => (
//       <div className="flex items-center gap-2">
//         <Button
//           size="sm"
//           variant="outline"
//           onClick={() =>
//             setActionState({
//               type: "delete",
//               userId: row.user._id,
//               storeName: row.user.store_name,
//             })
//           }
//         >
//           <Trash2 className="w-4 h-4 text-red-500" />
//         </Button>
//       </div>
//     ),
//   },
// ];

// export default function StoreOwners() {
//   const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([]);
//   const [selectedStore, setSelectedStore] = useState<StoreOwner | null>(null);
//   const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
//   const [actionState, setActionState] = useState<{
//     type: "approve" | "reject" | "delete";
//     userId: string;
//     storeName: string;
//   } | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchStoreOwners = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);

//       const baseUrl = API_CONFIG.BASE_URL;

//       console.log("StoreOwners: Using API URL:", baseUrl);

//       const response = await AuthService.makeAuthenticatedRequest(
//         `${baseUrl}${API_CONFIG.ENDPOINTS.ALL_STORE_OWNERS}`
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data: StoreOwnersResponse = await response.json();

//       if (!data.success) {
//         throw new Error("Failed to fetch store owners");
//       }

//       console.log("Fetched store owners:", data.data);
//       setStoreOwners(data.data);
//     } catch (err: any) {
//       console.error("Error fetching store owners:", err);
//       const errorMessage = err.message.includes("Failed to connect")
//         ? `Cannot connect to API. Using URL: ${API_CONFIG.BASE_URL}. ${err.message}`
//         : "Failed to load store owners. Please try again.";
//       setError(errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStoreOwners();
//   }, []);

//   // Handle approve/reject/delete actions
//   const handleAction = async (
//     action: "approve" | "reject" | "delete",
//     userId: string
//   ) => {
//     const baseUrl = API_CONFIG.BASE_URL;
//     try {
//       let response: Response;
//       if (action === "delete") {
//         response = await AuthService.makeAuthenticatedRequest(
//           `${baseUrl}/users/delete-account=${userId}`,
//           { method: "DELETE" }
//         );
//       } else {
//         response = await AuthService.makeAuthenticatedRequest(
//           `${baseUrl}/users/${action}-store-owner`,
//           {
//             method: "POST",
//             body: JSON.stringify({ user_id: userId }),
//           }
//         );
//       }

//       const data: ActionResponse = await response.json();
//       if (!response.ok) {
//         throw new Error(data.message || `${action} failed`);
//       }

//       if (action === "delete") {
//         setStoreOwners((prev) =>
//           prev.filter((owner) => owner.user._id !== userId)
//         );
//       } else {
//         setStoreOwners((prev) =>
//           prev.map((owner) =>
//             owner.user._id === userId
//               ? {
//                   ...owner,
//                   user: { ...owner.user, verified: action === "approve" },
//                   store: { ...owner.store, verified: action === "approve" },
//                 }
//               : owner
//           )
//         );
//       }
//     } catch (err: any) {
//       throw new Error(err.message || `${action} failed`);
//     }
//   };

//   // Handle store name click
//   const handleStoreClick = (store: StoreOwner) => {
//     console.log("Opening details for store:", store.user.store_name);
//     setSelectedStore(store);
//     setDetailsDialogOpen(true);
//   };

//   // Pass setSelectedStore and setActionState to columns selectively
//   const columnsWithSetters = storeOwnerColumns.map((col) => ({
//     ...col,
//     render: (value: any, row: StoreOwner, index?: number) => {
//       if (col.key === "storeName") {
//         return col.render(value, row, index, storeOwners, handleStoreClick);
//       }
//       if (col.key === "verified" || col.key === "actions") {
//         return col.render(value, row, index, storeOwners, setActionState);
//       }
//       return col.render(value, row, index, storeOwners);
//     },
//   }));

//   return (
//     <AdminLayout>
//       <div className="space-y-6">
//         {/* ── Header ── */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-foreground">Store Owners</h1>
//             <p className="text-muted-foreground">
//               Manage store owners and their subscriptions
//             </p>
//           </div>
//           {/* ── Bulk Upload button lives here ── */}
//           <BulkUploadStores onSuccess={fetchStoreOwners} />
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div
//             className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
//             role="alert"
//           >
//             {error}
//           </div>
//         )}

//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Store className="h-5 w-5" />
//               Store Owners Management ({storeOwners.length} total)
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             {isLoading ? (
//               <div>Loading store owners...</div>
//             ) : storeOwners.length === 0 ? (
//               <div>No store owners found.</div>
//             ) : (
//               <DataTable
//                 data={storeOwners}
//                 columns={columnsWithSetters}
//                 searchPlaceholder="Search store owners..."
//                 pageSize={10}
//               />
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Store Details Modal */}
//       <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
//         <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Store Details</DialogTitle>
//             <DialogDescription>
//               Complete information about {selectedStore?.user.store_name}
//             </DialogDescription>
//           </DialogHeader>

//           {selectedStore && (
//             <div className="space-y-6">
//               {/* Store Image and Basic Info */}
//               <div className="flex flex-col md:flex-row gap-6">
//                 <div className="md:w-1/3">
//                   <img
//                     src={
//                       selectedStore.store.store_image ||
//                       "https://via.placeholder.com/400"
//                     }
//                     alt={selectedStore.user.store_name}
//                     className="w-full h-48 object-cover rounded-lg"
//                   />
//                 </div>
//                 <div className="md:w-2/3 space-y-3">
//                   <h3 className="text-xl font-semibold">
//                     {selectedStore.user.store_name}
//                   </h3>
//                   <div className="grid grid-cols-2 gap-3 text-sm">
//                     <div>
//                       <span className="font-medium">Owner:</span>{" "}
//                       {selectedStore.user.full_name}
//                     </div>
//                     <div>
//                       <span className="font-medium">Status:</span>{" "}
//                       <Badge
//                         variant={
//                           selectedStore.user.subscription?.status === "completed"
//                             ? "default"
//                             : "secondary"
//                         }
//                       >
//                         {selectedStore.user.subscription?.status === "completed"
//                           ? "Active"
//                           : "Inactive"}
//                       </Badge>
//                     </div>
//                     <div>
//                       <span className="font-medium">Premium:</span>{" "}
//                       <Badge
//                         variant={
//                           selectedStore.user.subscription ? "default" : "secondary"
//                         }
//                       >
//                         {selectedStore.user.subscription ? "Yes" : "No"}
//                       </Badge>
//                     </div>
//                     <div>
//                       <span className="font-medium">Verification:</span>{" "}
//                       <Badge
//                         variant={
//                           selectedStore.user.verified || selectedStore.store.verified
//                             ? "default"
//                             : "secondary"
//                         }
//                       >
//                         {selectedStore.user.verified || selectedStore.store.verified
//                           ? "Approved"
//                           : "Pending"}
//                       </Badge>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Address Details */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2 text-lg">
//                     <MapPin className="h-5 w-5" />
//                     Address Details
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div>
//                       <span className="font-medium">Address:</span>{" "}
//                       {selectedStore.store.address || "N/A"}
//                     </div>
//                     <div>
//                       <span className="font-medium">City:</span>{" "}
//                       {selectedStore.store.city || "N/A"}
//                     </div>
//                     <div>
//                       <span className="font-medium">State:</span>{" "}
//                       {selectedStore.store.state || "N/A"}
//                     </div>
//                     <div>
//                       <span className="font-medium">Zipcode:</span>{" "}
//                       {selectedStore.store.zip_code || "N/A"}
//                     </div>
//                     <div>
//                       <span className="font-medium">Country:</span>{" "}
//                       {selectedStore.store.country || "N/A"}
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Business Details */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2 text-lg">
//                     <Clock className="h-5 w-5" />
//                     Business Details
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div>
//                       <span className="font-medium">Working Days:</span>{" "}
//                       {selectedStore.store.working_days || "N/A"}
//                     </div>
//                     <div>
//                       <span className="font-medium">Timings:</span>{" "}
//                       {selectedStore.store.working_time || "N/A"}
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Phone className="h-4 w-4" />
//                       <span>
//                         {selectedStore.store.phone_number ||
//                           selectedStore.user.phone_number ||
//                           "N/A"}
//                       </span>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Mail className="h-4 w-4" />
//                       <span>
//                         {selectedStore.store.store_email ||
//                           selectedStore.user.email}
//                       </span>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Links */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg">Links</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-3">
//                     {selectedStore.store.website_url && (
//                       <div className="flex items-center gap-2 text-sm">
//                         <Globe className="h-4 w-4" />
//                         <a
//                           href={selectedStore.store.website_url}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-biniq-teal hover:text-biniq-navy"
//                         >
//                           Website
//                         </a>
//                       </div>
//                     )}
//                     {selectedStore.store.google_maps_link && (
//                       <div className="flex items-center gap-2 text-sm">
//                         <MapPin className="h-4 w-4" />
//                         <a
//                           href={selectedStore.store.google_maps_link}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-biniq-teal hover:text-biniq-navy"
//                         >
//                           Google Maps
//                         </a>
//                       </div>
//                     )}
//                     {selectedStore.store.facebook_link && (
//                       <div className="flex items-center gap-2 text-sm">
//                         <Facebook className="h-4 w-4" />
//                         <a
//                           href={selectedStore.store.facebook_link}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-biniq-teal hover:text-biniq-navy"
//                         >
//                           Facebook
//                         </a>
//                       </div>
//                     )}
//                     {selectedStore.store.instagram_link && (
//                       <div className="flex items-center gap-2 text-sm">
//                         <Instagram className="h-4 w-4" />
//                         <a
//                           href={selectedStore.store.instagram_link}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-biniq-teal hover:text-biniq-navy"
//                         >
//                           Instagram
//                         </a>
//                       </div>
//                     )}
//                     {selectedStore.store.twitter_link && (
//                       <div className="flex items-center gap-2 text-sm">
//                         <Twitter className="h-4 w-4" />
//                         <a
//                           href={selectedStore.store.twitter_link}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-biniq-teal hover:text-biniq-navy"
//                         >
//                           Twitter
//                         </a>
//                       </div>
//                     )}
//                     {selectedStore.store.whatsapp_link && (
//                       <div className="flex items-center gap-2 text-sm">
//                         <svg className="h-4 w-4" viewBox="0 0 24 24">
//                           <path
//                             fill="currentColor"
//                             d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.33.27 2.59.75 3.72L2 21.15l5.62-.88c1.13.48 2.39.74 3.67.74 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.18c-1.15 0-2.27-.23-3.33-.67l-.24-.09-3.34.52.53-3.29-.09-.25c-.44-1.07-.67-2.23-.67-3.47 0-4.57 3.72-8.29 8.29-8.29s8.29 3.72 8.29 8.29-3.72 8.29-8.29 8.29zm4.98-6.12c-.28-.14-1.65-.82-1.91-.91-.26-.09-.45-.14-.64.14-.19.28-.73.91-.91.91-.18.09-.36 0-.55-.14-.64-.36-1.2-.82-1.69-1.32-.37-.37-.58-.77-.86-1.24-.28-.46-.05-.73.14-.96.18-.23.41-.55.55-.73.14-.18.18-.32.09-.55-.09-.23-.82-1.97-1.14-2.7-.31-.73-.64-.64-.91-.64-.18 0-.37 0-.55 0-.46 0-1.2.14-1.83.91-.64.78-.64 1.83-.05 2.7.59.87 1.2 1.74 1.83 2.42 2.7 2.97 5.28 4.01 6.79 4.51.64.18 1.14.09 1.51-.18.37-.27.73-.64 1.01-.96.28-.32.55-.27.73-.55.18-.28.18-.55.09-.73-.09-.18-.41-.46-.73-.64z"
//                           />
//                         </svg>
//                         <a
//                           href={selectedStore.store.whatsapp_link}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-biniq-teal hover:text-biniq-navy"
//                         >
//                           WhatsApp
//                         </a>
//                       </div>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Promotion Details */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg">Promotion Details</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-sm">
//                     {selectedStore.user.promotions.length > 0
//                       ? selectedStore.user.promotions.join(", ")
//                       : "No promotions available"}
//                   </p>
//                   {selectedStore.user.subscription && (
//                     <div className="mt-3">
//                       <span className="font-medium">Total Promotions Used:</span>{" "}
//                       <span className="text-biniq-navy font-semibold">
//                         {selectedStore.user.used_promotions}/
//                         {selectedStore.user.total_promotions}
//                       </span>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Confirmation Modals */}
//       {actionState && (
//         <ConfirmationModal
//           isOpen={!!actionState}
//           onClose={() => setActionState(null)}
//           onConfirm={() => handleAction(actionState.type, actionState.userId)}
//           title={
//             actionState.type === "approve"
//               ? `Approve ${actionState.storeName}`
//               : actionState.type === "reject"
//                 ? `Reject ${actionState.storeName}`
//                 : `Delete ${actionState.storeName}`
//           }
//           description={
//             actionState.type === "approve"
//               ? `Are you sure you want to approve ${actionState.storeName}? This will grant them verified status.`
//               : actionState.type === "reject"
//                 ? `Are you sure you want to reject ${actionState.storeName}? This will deny their verified status.`
//                 : `Are you sure you want to delete ${actionState.storeName}? This action cannot be undone.`
//           }
//           confirmText={
//             actionState.type === "approve"
//               ? "Approve"
//               : actionState.type === "reject"
//                 ? "Reject"
//                 : "Delete"
//           }
//           isDestructive={actionState.type === "delete"}
//         />
//       )}
//     </AdminLayout>
//   );
// }