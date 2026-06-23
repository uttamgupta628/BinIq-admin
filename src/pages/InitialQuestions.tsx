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
import { ClipboardList, Plus, Edit, Trash2, Eye } from "lucide-react";

interface Question {
  srNo: number;
  question: string;
  questionType: "Multiple Choice" | "Single Choice" | "Text" | "Rating";
  options: string[];
  isRequired: boolean;
  order: number;
  category: string;
  status: "Active" | "Draft" | "Archived";
  createdDate: string;
  updatedDate: string;
}

const mockQuestions: Question[] = [
  {
    srNo: 1,
    question: "What type of business are you primarily involved in?",
    questionType: "Single Choice",
    options: [
      "Retail Chain",
      "Online Store",
      "Wholesale",
      "Local Store",
      "Distribution",
      "E-commerce",
      "Other",
    ],
    isRequired: true,
    order: 1,
    category: "Business Type",
    status: "Active",
    createdDate: "2024-01-01",
    updatedDate: "2024-01-05",
  },
  {
    srNo: 2,
    question: "How many years of experience do you have in business?",
    questionType: "Single Choice",
    options: [
      "Less than 1 year",
      "1-2 years",
      "2-3 years",
      "3-5 years",
      "5-10 years",
      "10+ years",
    ],
    isRequired: true,
    order: 2,
    category: "Experience",
    status: "Active",
    createdDate: "2024-01-01",
    updatedDate: "2024-01-03",
  },
  {
    srNo: 3,
    question:
      "Which product categories are you most interested in? (Select all that apply)",
    questionType: "Multiple Choice",
    options: [
      "Electronics",
      "Fashion & Apparel",
      "Home & Garden",
      "Health & Beauty",
      "Sports & Fitness",
      "Books & Media",
      "Food & Beverage",
      "Auto Parts",
      "Jewelry",
      "Software",
    ],
    isRequired: true,
    order: 3,
    category: "Product Interest",
    status: "Active",
    createdDate: "2024-01-01",
    updatedDate: "2024-01-08",
  },
  {
    srNo: 4,
    question: "What is your expected monthly sales volume?",
    questionType: "Single Choice",
    options: [
      "Less than ₹50,000",
      "₹50,000 - ₹1,00,000",
      "₹1,00,000 - ₹5,00,000",
      "₹5,00,000 - ₹10,00,000",
      "₹10,00,000+",
    ],
    isRequired: false,
    order: 4,
    category: "Sales Volume",
    status: "Active",
    createdDate: "2024-01-02",
    updatedDate: "2024-01-10",
  },
  {
    srNo: 5,
    question: "Do you currently use any business management software?",
    questionType: "Single Choice",
    options: [
      "Yes, ERP system",
      "Yes, CRM software",
      "Yes, inventory management",
      "Yes, accounting software",
      "No, manual processes",
      "Other",
    ],
    isRequired: false,
    order: 5,
    category: "Technology Usage",
    status: "Active",
    createdDate: "2024-01-02",
    updatedDate: "2024-01-07",
  },
  {
    srNo: 6,
    question: "How did you hear about binIQ?",
    questionType: "Single Choice",
    options: [
      "Google Search",
      "Social Media",
      "Referral from friend",
      "Advertisement",
      "Trade show/Event",
      "Business partner",
      "Other",
    ],
    isRequired: false,
    order: 6,
    category: "Marketing",
    status: "Draft",
    createdDate: "2024-01-03",
    updatedDate: "2024-01-12",
  },
  {
    srNo: 7,
    question:
      "Rate the importance of the following features for your business (1-5 scale)",
    questionType: "Rating",
    options: [
      "Inventory Management",
      "Sales Analytics",
      "Customer Management",
      "Payment Processing",
      "Mobile Access",
    ],
    isRequired: false,
    order: 7,
    category: "Feature Importance",
    status: "Active",
    createdDate: "2024-01-04",
    updatedDate: "2024-01-11",
  },
];

const questionColumns: Column<Question>[] = [
  {
    key: "order",
    header: "Order",
    sortable: true,
  },
  {
    key: "question",
    header: "Question",
    sortable: true,
    searchable: true,
    render: (value) => (
      <div className="max-w-sm truncate font-medium" title={value}>
        {value}
      </div>
    ),
  },
  {
    key: "questionType",
    header: "Type",
    sortable: true,
    render: (value) => <Badge variant="outline">{value}</Badge>,
  },
  {
    key: "category",
    header: "Category",
    sortable: true,
    render: (value) => <Badge variant="secondary">{value}</Badge>,
  },
  {
    key: "options",
    header: "Options",
    render: (value) => (
      <span className="text-sm text-muted-foreground">
        {value.length} options
      </span>
    ),
  },
  {
    key: "isRequired",
    header: "Required",
    render: (value) => (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "Yes" : "No"}
      </Badge>
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
            : value === "Draft"
              ? "secondary"
              : "outline"
        }
      >
        {value}
      </Badge>
    ),
  },
  {
    key: "updatedDate",
    header: "Last Updated",
    sortable: true,
  },
  {
    key: "srNo",
    header: "Actions",
    render: () => (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" title="View Options">
          <Eye className="w-4 h-4" />
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

export default function InitialQuestions() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Initial Questions
            </h1>
            <p className="text-muted-foreground">
              Manage questions asked to resellers during registration
            </p>
          </div>
          <Button className="bg-biniq-teal hover:bg-biniq-teal/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        {/* Question Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Questions
                  </p>
                  <p className="text-2xl font-bold text-biniq-navy">
                    {mockQuestions.length}
                  </p>
                </div>
                <ClipboardList className="h-8 w-8 text-biniq-teal" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Questions
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {mockQuestions.filter((q) => q.status === "Active").length}
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
                    Required Questions
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {mockQuestions.filter((q) => q.isRequired).length}
                  </p>
                </div>
                <Badge variant="destructive">Required</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Draft Questions
                  </p>
                  <p className="text-2xl font-bold text-gray-600">
                    {mockQuestions.filter((q) => q.status === "Draft").length}
                  </p>
                </div>
                <Badge variant="secondary">Draft</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Questions Management ({mockQuestions.length} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={mockQuestions}
              columns={questionColumns}
              searchPlaceholder="Search questions..."
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* Sample Question Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Question Preview Example</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">
                  What type of business are you primarily involved in?
                  <span className="text-red-500 ml-1">*</span>
                </h4>
                <div className="space-y-2">
                  {[
                    "Retail Chain",
                    "Online Store",
                    "Wholesale",
                    "Local Store",
                    "Other",
                  ].map((option, index) => (
                    <label key={index} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="business-type"
                        className="text-biniq-teal"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This is how questions appear to resellers during registration.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
