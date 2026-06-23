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
import { HelpCircle, Plus, Edit, Trash2, Eye } from "lucide-react";
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

interface FAQ {
  _id: string;
  srNo: number;
  question: string;
  answer: string;
  targetAudience: "Store Owners" | "Resellers" | "Both";
  createdDate: string;
  updatedDate: string;
  status: "Active" | "Draft" | "Archived";
  views: number;
}

interface FAQResponse {
  _id: string;
  question: string;
  answer: string;
  type: number | null;
  created_at: string;
  updated_at: string;
  __v: number;
}

interface FAQStats {
  totalFAQs: number;
}

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    type: "" as "2" | "3",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FAQStats>({ totalFAQs: 0 });

  // Fetch FAQs
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        console.log("Starting FAQ fetch..."); // Debug log
        setIsLoading(true);
        setError(null);

        const baseUrl = API_CONFIG.BASE_URL;
        const response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.FAQS}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: FAQResponse[] = await response.json();

        console.log("Fetched FAQs:", data); // Debug log

        const mappedFAQs: FAQ[] = data.map((faq, index) => ({
          _id: faq._id,
          srNo: index + 1,
          question: faq.question,
          answer: faq.answer,
          targetAudience: faq.type === 3 ? "Store Owners" : "Resellers",
          createdDate: new Date(faq.created_at).toLocaleDateString(),
          updatedDate: new Date(faq.updated_at).toLocaleDateString(),
          status: "Active",
          views: 0,
        }));

        console.log("Mapped FAQs:", mappedFAQs); // Debug log
        setFaqs(mappedFAQs);
        setStats({ totalFAQs: mappedFAQs.length });
        console.log("Computed stats:", { totalFAQs: mappedFAQs.length }); // Debug log
      } catch (err: any) {
        console.error("Error fetching FAQs:", err.message); // Debug log
        setError(`Failed to load FAQs: ${err.message}`);
      } finally {
        setIsLoading(false);
        console.log("Fetch FAQs completed, isLoading:", false); // Debug log
      }
    };

    fetchFAQs();
  }, []);

  // Handle View Details
  const handleViewDetails = (faq: FAQ) => {
    console.log("Opening details for FAQ:", faq.question); // Debug log
    setSelectedFAQ(faq);
    setViewDialogOpen(true);
  };

  // Handle Add/Edit FAQ
  const handleAddEdit = (faq?: FAQ) => {
    console.log(
      "Opening add/edit modal, edit mode:",
      !!faq,
      "FAQ:",
      faq?.question
    ); // Debug log
    if (faq) {
      setIsEditMode(true);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        type: faq.targetAudience === "Store Owners" ? "3" : "2",
      });
      setSelectedFAQ(faq);
    } else {
      setIsEditMode(false);
      setFormData({ question: "", answer: "", type: "" });
      setSelectedFAQ(null);
    }
    setAddEditDialogOpen(true);
  };

  const handleSubmitFAQ = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      setError("Question and Answer are required.");
      console.log("Validation failed: Question or Answer empty"); // Debug log
      return;
    }

    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const payload = {
        question: formData.question,
        answer: formData.answer,
        type: Number(formData.type),
      };

      console.log("Submitting FAQ payload:", payload, "Edit mode:", isEditMode); // Debug log
      let response;
      if (isEditMode && selectedFAQ) {
        response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}/faqs/${selectedFAQ._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, faq_id: selectedFAQ._id }),
          }
        );
      } else {
        response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}/faqs`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      const result = await response.json();
      console.log(
        isEditMode ? "Edit FAQ response:" : "Add FAQ response:",
        result
      ); // Debug log

      if (result.message.includes("successfully")) {
        const newFAQ: FAQ = {
          _id: result.faq._id,
          srNo: isEditMode ? selectedFAQ!.srNo : faqs.length + 1,
          question: result.faq.question,
          answer: result.faq.answer,
          targetAudience: result.faq.type === 3 ? "Store Owners" : "Resellers",

          createdDate: new Date(result.faq.created_at).toLocaleDateString(),
          updatedDate: new Date(result.faq.updated_at).toLocaleDateString(),
          status: "Active",
          views: isEditMode ? selectedFAQ!.views : 0,
        };

        setFaqs((prev) =>
          isEditMode
            ? prev.map((faq) => (faq._id === newFAQ._id ? newFAQ : faq))
            : [...prev, newFAQ]
        );
        setStats((prev) => ({
          totalFAQs: isEditMode ? prev.totalFAQs : prev.totalFAQs + 1,
        }));
      }

      setAddEditDialogOpen(false);
      setFormData({ question: "", answer: "", type: "" });
      setSelectedFAQ(null);
    } catch (err: any) {
      console.error("Error saving FAQ:", err.message); // Debug log
      setError(
        `Failed to ${isEditMode ? "update" : "add"} FAQ: ${err.message}`
      );
    }
  };

  // Handle Delete FAQ
  const handleDelete = (faq: FAQ) => {
    console.log("Opening delete confirmation for FAQ:", faq.question); // Debug log
    setSelectedFAQ(faq);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFAQ) return;

    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/faqs/${selectedFAQ._id}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      console.log("Delete FAQ response:", result); // Debug log

      if (result.message === "FAQ deleted successfully") {
        setFaqs((prev) => prev.filter((faq) => faq._id !== selectedFAQ._id));
        setStats((prev) => ({ totalFAQs: prev.totalFAQs - 1 }));
      }

      setDeleteDialogOpen(false);
      setSelectedFAQ(null);
    } catch (err: any) {
      console.error("Error deleting FAQ:", err.message); // Debug log
      setError(`Failed to delete FAQ: ${err.message}`);
    }
  };

  const faqColumns: Column<FAQ>[] = [
    {
      key: "srNo",
      header: "Sr No.",
      sortable: true,
      render: (_, row) => {
        console.log("Rendering Sr No. for:", row.question); // Debug log
        return row.srNo;
      },
    },
    {
      key: "question",
      header: "Question",
      sortable: true,
      searchable: true,
      render: (_, row) => {
        console.log("Rendering Question for:", row.question); // Debug log
        return (
          <div className="max-w-sm truncate font-medium" title={row.question}>
            {row.question}
          </div>
        );
      },
    },
    {
      key: "targetAudience",
      header: "Target Audience",
      sortable: true,
      render: (_, row) => {
        console.log("Rendering Target Audience for:", row.question); // Debug log
        return (
          <Badge
            variant={
              row.targetAudience === "Store Owners"
                ? "default"
                : row.targetAudience === "Resellers"
                  ? "secondary"
                  : "outline"
            }
          >
            {row.targetAudience}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (_, row) => {
        console.log("Rendering Status for:", row.question); // Debug log
        return (
          <Badge
            variant={
              row.status === "Active"
                ? "default"
                : row.status === "Draft"
                  ? "secondary"
                  : "outline"
            }
          >
            {row.status}
          </Badge>
        );
      },
    },
    {
      key: "updatedDate",
      header: "Last Updated",
      sortable: true,
      render: (_, row) => {
        console.log("Rendering Updated Date for:", row.question); // Debug log
        return row.updatedDate;
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => {
        console.log("Rendering Actions for:", row.question); // Debug log
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewDetails(row)}
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddEdit(row)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(row)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <ErrorBoundary>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">FAQ</h1>
              <p className="text-muted-foreground">
                Manage frequently asked questions
              </p>
            </div>
            <Button
              className="bg-biniq-teal hover:bg-biniq-teal/90"
              onClick={() => handleAddEdit()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-100 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {/* FAQ Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total FAQs</p>
                    <p className="text-2xl font-bold text-biniq-navy">
                      {isLoading ? "Loading..." : stats.totalFAQs}
                    </p>
                  </div>
                  <HelpCircle className="h-8 w-8 text-biniq-teal" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                FAQ Management ({faqs.length} total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading FAQs...</div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : faqs.length === 0 ? (
                <div>No FAQs found.</div>
              ) : (
                <DataTable
                  data={faqs}
                  columns={faqColumns}
                  searchPlaceholder="Search FAQs..."
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* View Details Modal */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>FAQ Details</DialogTitle>
              <DialogDescription>
                Complete information for "{selectedFAQ?.question || "N/A"}"
              </DialogDescription>
            </DialogHeader>

            {selectedFAQ && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <HelpCircle className="h-5 w-5" />
                      FAQ Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <span className="font-medium">FAQ ID:</span>{" "}
                        {selectedFAQ._id}
                      </div>
                      <div>
                        <span className="font-medium">Question:</span>{" "}
                        {selectedFAQ.question}
                      </div>
                      <div>
                        <span className="font-medium">Answer:</span>{" "}
                        <p className="text-sm text-muted-foreground">
                          {selectedFAQ.answer}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Target Audience:</span>{" "}
                        <Badge
                          variant={
                            selectedFAQ.targetAudience === "Store Owners"
                              ? "default"
                              : selectedFAQ.targetAudience === "Resellers"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {selectedFAQ.targetAudience}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        <Badge
                          variant={
                            selectedFAQ.status === "Active"
                              ? "default"
                              : selectedFAQ.status === "Draft"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {selectedFAQ.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Created Date:</span>{" "}
                        {selectedFAQ.createdDate}
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span>{" "}
                        {selectedFAQ.updatedDate}
                      </div>
                      <div>
                        <span className="font-medium">Views:</span>{" "}
                        {selectedFAQ.views}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add/Edit Modal */}
        <Dialog open={addEditDialogOpen} onOpenChange={setAddEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update the FAQ details below."
                  : "Enter the details for the new FAQ."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="question" className="text-sm font-medium">
                  Question
                </label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="Enter FAQ question"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="answer" className="text-sm font-medium">
                  Answer
                </label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  placeholder="Enter FAQ answer"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Target Audience
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    console.log("Selected Target Audience:", value); // Debug log
                    setFormData({ ...formData, type: value });
                  }}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Resellers</SelectItem>
                    <SelectItem value="3">Store Owners</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFAQ}
                disabled={!formData.question.trim() || !formData.answer.trim()}
                className="bg-biniq-teal hover:bg-biniq-teal/90"
              >
                {isEditMode ? "Update FAQ" : "Add FAQ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete FAQ</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the FAQ "
                {selectedFAQ?.question || "N/A"}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ErrorBoundary>
  );
}
// import AdminLayout from "../components/AdminLayout";
// import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
// import DataTable, { Column } from "../components/ui/DataTable";
// import { Badge } from "../components/ui/badge";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import { Textarea } from "../components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "../components/ui/dialog";
// import { HelpCircle, Plus, Edit, Trash2, Eye } from "lucide-react";
// import { useState, useEffect, Component, ReactNode } from "react";
// import { AuthService } from "../lib/auth";

// // Error Boundary Component
// class ErrorBoundary extends Component<
//   { children: ReactNode },
//   { hasError: boolean; error: string | null }
// > {
//   state = { hasError: false, error: null };

//   static getDerivedStateFromError(error: Error) {
//     return { hasError: true, error: error.message };
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="p-4 text-red-600">
//           <h2>Error: {this.state.error}</h2>
//           <p>Please check the console for details and refresh the page.</p>
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// interface FAQ {
//   _id: string;
//   srNo: number;
//   question: string;
//   answer: string;
//   targetAudience: "Store Owners" | "Resellers" | "Both";
//   createdDate: string;
//   updatedDate: string;
//   status: "Active" | "Draft" | "Archived";
//   views: number;
// }

// interface FAQResponse {
//   _id: string;
//   question: string;
//   answer: string;
//   type: number | null;
//   created_at: string;
//   updated_at: string;
//   __v: number;
// }

// interface FAQStats {
//   totalFAQs: number;
// }

// export default function FAQ() {
//   const [faqs, setFaqs] = useState<FAQ[]>([]);
//   const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
//   const [viewDialogOpen, setViewDialogOpen] = useState(false);
//   const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [formData, setFormData] = useState({
//     question: "",
//     answer: "",
//     type: "" as "2" | "3" | "",
//   });
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [stats, setStats] = useState<FAQStats>({ totalFAQs: 0 });

//   // Fetch FAQs
//   useEffect(() => {
//     const fetchFAQs = async () => {
//       try {
//         console.log("Starting FAQ fetch..."); // Debug log
//         setIsLoading(true);
//         setError(null);

//         const baseUrl =
//           import.meta.env.VITE_API_URL || "https://bin-iq-backend.vercel.app/api";
//         const response = await AuthService.makeAuthenticatedRequest(
//           `${baseUrl}/faqs`,
//         );
//         const data: FAQResponse[] = await response.json();

//         console.log("Fetched FAQs:", data); // Debug log

//         const mappedFAQs: FAQ[] = data.map((faq, index) => ({
//           _id: faq._id,
//           srNo: index + 1,
//           question: faq.question,
//           answer: faq.answer,
//           targetAudience:
//             faq.type === 3
//               ? "Store Owners"
//               : faq.type === 2
//                 ? "Resellers"
//                 : "Both",
//           createdDate: new Date(faq.created_at).toLocaleDateString(),
//           updatedDate: new Date(faq.updated_at).toLocaleDateString(),
//           status: "Active",
//           views: 0,
//         }));

//         console.log("Mapped FAQs:", mappedFAQs); // Debug log
//         setFaqs(mappedFAQs);
//         setStats({ totalFAQs: mappedFAQs.length });
//         console.log("Computed stats:", { totalFAQs: mappedFAQs.length }); // Debug log
//       } catch (err: any) {
//         console.error("Error fetching FAQs:", err.message); // Debug log
//         setError(`Failed to load FAQs: ${err.message}`);
//       } finally {
//         setIsLoading(false);
//         console.log("Fetch FAQs completed, isLoading:", false); // Debug log
//       }
//     };

//     fetchFAQs();
//   }, []);

//   // Handle View Details
//   const handleViewDetails = (faq: FAQ) => {
//     console.log("Opening details for FAQ:", faq.question); // Debug log
//     setSelectedFAQ(faq);
//     setViewDialogOpen(true);
//   };

//   // Handle Add/Edit FAQ
//   const handleAddEdit = (faq?: FAQ) => {
//     console.log(
//       "Opening add/edit modal, edit mode:",
//       !!faq,
//       "FAQ:",
//       faq?.question,
//     ); // Debug log
//     if (faq) {
//       setIsEditMode(true);
//       setFormData({
//         question: faq.question,
//         answer: faq.answer,
//         type:
//           faq.targetAudience === "Store Owners"
//             ? "3"
//             : faq.targetAudience === "Resellers"
//               ? "2"
//               : "",
//       });
//       setSelectedFAQ(faq);
//     } else {
//       setIsEditMode(false);
//       setFormData({ question: "", answer: "", type: "" });
//       setSelectedFAQ(null);
//     }
//     setAddEditDialogOpen(true);
//   };

//   const handleSubmitFAQ = async () => {
//     if (!formData.question.trim() || !formData.answer.trim()) {
//       setError("Question and Answer are required.");
//       console.log("Validation failed: Question or Answer empty"); // Debug log
//       return;
//     }

//     try {
//       const baseUrl =
//         import.meta.env.VITE_API_URL || "https://bin-iq-backend.vercel.app/api";
//       const payload = {
//         question: formData.question,
//         answer: formData.answer,
//         type: formData.type ? Number(formData.type) : null,
//       };

//       console.log("Submitting FAQ payload:", payload, "Edit mode:", isEditMode); // Debug log
//       let response;
//       if (isEditMode && selectedFAQ) {
//         response = await AuthService.makeAuthenticatedRequest(
//           `${baseUrl}/faqs/${selectedFAQ._id}`,
//           {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ ...payload, faq_id: selectedFAQ._id }),
//           },
//         );
//       } else {
//         response = await AuthService.makeAuthenticatedRequest(
//           `${baseUrl}/faqs`,
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(payload),
//           },
//         );
//       }

//       const result = await response.json();
//       console.log(
//         isEditMode ? "Edit FAQ response:" : "Add FAQ response:",
//         result,
//       ); // Debug log

//       if (result.message.includes("successfully")) {
//         const newFAQ: FAQ = {
//           _id: result.faq._id,
//           srNo: isEditMode ? selectedFAQ!.srNo : faqs.length + 1,
//           question: result.faq.question,
//           answer: result.faq.answer,
//           targetAudience:
//             result.faq.type === 3
//               ? "Store Owners"
//               : result.faq.type === 2
//                 ? "Resellers"
//                 : "Both",
//           createdDate: new Date(result.faq.created_at).toLocaleDateString(),
//           updatedDate: new Date(result.faq.updated_at).toLocaleDateString(),
//           status: "Active",
//           views: isEditMode ? selectedFAQ!.views : 0,
//         };

//         setFaqs((prev) =>
//           isEditMode
//             ? prev.map((faq) => (faq._id === newFAQ._id ? newFAQ : faq))
//             : [...prev, newFAQ],
//         );
//         setStats((prev) => ({
//           totalFAQs: isEditMode ? prev.totalFAQs : prev.totalFAQs + 1,
//         }));
//       }

//       setAddEditDialogOpen(false);
//       setFormData({ question: "", answer: "", type: "" });
//       setSelectedFAQ(null);
//     } catch (err: any) {
//       console.error("Error saving FAQ:", err.message); // Debug log
//       setError(
//         `Failed to ${isEditMode ? "update" : "add"} FAQ: ${err.message}`,
//       );
//     }
//   };

//   // Handle Delete FAQ
//   const handleDelete = (faq: FAQ) => {
//     console.log("Opening delete confirmation for FAQ:", faq.question); // Debug log
//     setSelectedFAQ(faq);
//     setDeleteDialogOpen(true);
//   };

//   const handleConfirmDelete = async () => {
//     if (!selectedFAQ) return;

//     try {
//       const baseUrl =
//         import.meta.env.VITE_API_URL || "https://bin-iq-backend.vercel.app/api";
//       const response = await AuthService.makeAuthenticatedRequest(
//         `${baseUrl}/faqs/${selectedFAQ._id}`,
//         { method: "DELETE" },
//       );
//       const result = await response.json();

//       console.log("Delete FAQ response:", result); // Debug log

//       if (result.message === "FAQ deleted successfully") {
//         setFaqs((prev) => prev.filter((faq) => faq._id !== selectedFAQ._id));
//         setStats((prev) => ({ totalFAQs: prev.totalFAQs - 1 }));
//       }

//       setDeleteDialogOpen(false);
//       setSelectedFAQ(null);
//     } catch (err: any) {
//       console.error("Error deleting FAQ:", err.message); // Debug log
//       setError(`Failed to delete FAQ: ${err.message}`);
//     }
//   };

//   const faqColumns: Column<FAQ>[] = [
//     {
//       key: "srNo",
//       header: "Sr No.",
//       sortable: true,
//       render: (_, row) => {
//         console.log("Rendering Sr No. for:", row.question); // Debug log
//         return row.srNo;
//       },
//     },
//     {
//       key: "question",
//       header: "Question",
//       sortable: true,
//       searchable: true,
//       render: (_, row) => {
//         console.log("Rendering Question for:", row.question); // Debug log
//         return (
//           <div className="max-w-sm truncate font-medium" title={row.question}>
//             {row.question}
//           </div>
//         );
//       },
//     },
//     {
//       key: "targetAudience",
//       header: "Target Audience",
//       sortable: true,
//       render: (_, row) => {
//         console.log("Rendering Target Audience for:", row.question); // Debug log
//         return (
//           <Badge
//             variant={
//               row.targetAudience === "Store Owners"
//                 ? "default"
//                 : row.targetAudience === "Resellers"
//                   ? "secondary"
//                   : "outline"
//             }
//           >
//             {row.targetAudience}
//           </Badge>
//         );
//       },
//     },
//     {
//       key: "status",
//       header: "Status",
//       sortable: true,
//       render: (_, row) => {
//         console.log("Rendering Status for:", row.question); // Debug log
//         return (
//           <Badge
//             variant={
//               row.status === "Active"
//                 ? "default"
//                 : row.status === "Draft"
//                   ? "secondary"
//                   : "outline"
//             }
//           >
//             {row.status}
//           </Badge>
//         );
//       },
//     },
//     {
//       key: "updatedDate",
//       header: "Last Updated",
//       sortable: true,
//       render: (_, row) => {
//         console.log("Rendering Updated Date for:", row.question); // Debug log
//         return row.updatedDate;
//       },
//     },
//     {
//       key: "actions",
//       header: "Actions",
//       render: (_, row) => {
//         console.log("Rendering Actions for:", row.question); // Debug log
//         return (
//           <div className="flex items-center gap-2">
//             <Button
//               size="sm"
//               variant="outline"
//               onClick={() => handleViewDetails(row)}
//               title="View"
//             >
//               <Eye className="w-4 h-4" />
//             </Button>
//             <Button
//               size="sm"
//               variant="outline"
//               onClick={() => handleAddEdit(row)}
//               title="Edit"
//             >
//               <Edit className="w-4 h-4" />
//             </Button>
//             <Button
//               size="sm"
//               variant="outline"
//               onClick={() => handleDelete(row)}
//               title="Delete"
//             >
//               <Trash2 className="w-4 h-4 text-red-500" />
//             </Button>
//           </div>
//         );
//       },
//     },
//   ];

//   return (
//     <ErrorBoundary>
//       <AdminLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-foreground">FAQ</h1>
//               <p className="text-muted-foreground">
//                 Manage frequently asked questions
//               </p>
//             </div>
//             <Button
//               className="bg-biniq-teal hover:bg-biniq-teal/90"
//               onClick={() => handleAddEdit()}
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Add FAQ
//             </Button>
//           </div>

//           {/* Error Display */}
//           {error && (
//             <div className="p-4 bg-red-100 text-red-600 rounded-md">
//               {error}
//             </div>
//           )}

//           {/* FAQ Stats */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <Card>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-muted-foreground">Total FAQs</p>
//                     <p className="text-2xl font-bold text-biniq-navy">
//                       {isLoading ? "Loading..." : stats.totalFAQs}
//                     </p>
//                   </div>
//                   <HelpCircle className="h-8 w-8 text-biniq-teal" />
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <HelpCircle className="h-5 w-5" />
//                 FAQ Management ({faqs.length} total)
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {isLoading ? (
//                 <div>Loading FAQs...</div>
//               ) : error ? (
//                 <div className="text-red-600">{error}</div>
//               ) : faqs.length === 0 ? (
//                 <div>No FAQs found.</div>
//               ) : (
//                 <DataTable
//                   data={faqs}
//                   columns={faqColumns}
//                   searchPlaceholder="Search FAQs..."
//                   pageSize={10}
//                 />
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* View Details Modal */}
//         <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
//           <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>FAQ Details</DialogTitle>
//               <DialogDescription>
//                 Complete information for "{selectedFAQ?.question || "N/A"}"
//               </DialogDescription>
//             </DialogHeader>

//             {selectedFAQ && (
//               <div className="space-y-6">
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2 text-lg">
//                       <HelpCircle className="h-5 w-5" />
//                       FAQ Information
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="grid grid-cols-1 gap-4 text-sm">
//                       <div>
//                         <span className="font-medium">FAQ ID:</span>{" "}
//                         {selectedFAQ._id}
//                       </div>
//                       <div>
//                         <span className="font-medium">Question:</span>{" "}
//                         {selectedFAQ.question}
//                       </div>
//                       <div>
//                         <span className="font-medium">Answer:</span>{" "}
//                         <p className="text-sm text-muted-foreground">
//                           {selectedFAQ.answer}
//                         </p>
//                       </div>
//                       <div>
//                         <span className="font-medium">Target Audience:</span>{" "}
//                         <Badge
//                           variant={
//                             selectedFAQ.targetAudience === "Store Owners"
//                               ? "default"
//                               : selectedFAQ.targetAudience === "Resellers"
//                                 ? "secondary"
//                                 : "outline"
//                           }
//                         >
//                           {selectedFAQ.targetAudience}
//                         </Badge>
//                       </div>
//                       <div>
//                         <span className="font-medium">Status:</span>{" "}
//                         <Badge
//                           variant={
//                             selectedFAQ.status === "Active"
//                               ? "default"
//                               : selectedFAQ.status === "Draft"
//                                 ? "secondary"
//                                 : "outline"
//                           }
//                         >
//                           {selectedFAQ.status}
//                         </Badge>
//                       </div>
//                       <div>
//                         <span className="font-medium">Created Date:</span>{" "}
//                         {selectedFAQ.createdDate}
//                       </div>
//                       <div>
//                         <span className="font-medium">Last Updated:</span>{" "}
//                         {selectedFAQ.updatedDate}
//                       </div>
//                       <div>
//                         <span className="font-medium">Views:</span>{" "}
//                         {selectedFAQ.views}
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//             )}
//           </DialogContent>
//         </Dialog>

//         {/* Add/Edit Modal */}
//         <Dialog open={addEditDialogOpen} onOpenChange={setAddEditDialogOpen}>
//           <DialogContent className="sm:max-w-[600px]">
//             <DialogHeader>
//               <DialogTitle>{isEditMode ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
//               <DialogDescription>
//                 {isEditMode
//                   ? "Update the FAQ details below."
//                   : "Enter the details for the new FAQ."}
//               </DialogDescription>
//             </DialogHeader>

//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <label htmlFor="question" className="text-sm font-medium">
//                   Question
//                 </label>
//                 <Input
//                   id="question"
//                   value={formData.question}
//                   onChange={(e) =>
//                     setFormData({ ...formData, question: e.target.value })
//                   }
//                   placeholder="Enter FAQ question"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <label htmlFor="answer" className="text-sm font-medium">
//                   Answer
//                 </label>
//                 <Textarea
//                   id="answer"
//                   value={formData.answer}
//                   onChange={(e) =>
//                     setFormData({ ...formData, answer: e.target.value })
//                   }
//                   placeholder="Enter FAQ answer"
//                   rows={4}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <label htmlFor="type" className="text-sm font-medium">
//                   Target Audience
//                 </label>
//                 <Select
//                   value={formData.type}
//                   onValueChange={(value) =>
//                     setFormData({ ...formData, type: value })
//                   }
//                 >
//                   <SelectTrigger id="type">
//                     <SelectValue placeholder="Select target audience" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="">Both</SelectItem>
//                     <SelectItem value="2">Resellers</SelectItem>
//                     <SelectItem value="3">Store Owners</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             <DialogFooter>
//               <Button
//                 variant="outline"
//                 onClick={() => setAddEditDialogOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleSubmitFAQ}
//                 disabled={!formData.question.trim() || !formData.answer.trim()}
//                 className="bg-biniq-teal hover:bg-biniq-teal/90"
//               >
//                 {isEditMode ? "Update FAQ" : "Add FAQ"}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Delete Confirmation Modal */}
//         <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//           <DialogContent className="sm:max-w-[425px]">
//             <DialogHeader>
//               <DialogTitle>Delete FAQ</DialogTitle>
//               <DialogDescription>
//                 Are you sure you want to delete the FAQ "
//                 {selectedFAQ?.question || "N/A"}"? This action cannot be undone.
//               </DialogDescription>
//             </DialogHeader>
//             <DialogFooter>
//               <Button
//                 variant="outline"
//                 onClick={() => setDeleteDialogOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 variant="destructive"
//                 onClick={handleConfirmDelete}
//                 className="bg-red-600 hover:bg-red-700"
//               >
//                 Delete
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </AdminLayout>
//     </ErrorBoundary>
//   );
// }
