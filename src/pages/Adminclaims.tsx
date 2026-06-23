import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
} from "../components/ui/card";
import DataTable, { Column } from "../components/ui/DataTable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Tabs,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Check,
  X,
  Eye,
  Mail,
  Phone,
  Store,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  AlertTriangle,
  ShieldCheck,
  Building2,
  MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AuthService } from "../lib/auth";
import { API_CONFIG, buildApiUrl } from "../lib/api";
import { toast } from "../hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreClaim {
  _id: string;
  store_id: string | null;
  full_name: string;
  email: string;
  phone_number: string;
  business_name: string | null;
  store_address: string | null;
  licence_1: string;
  licence_2: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  setup_completed: boolean;
  created_at: string;
  store?: {
    _id: string;
    store_name: string;
    address: string;
    city: string;
    state: string;
  } | null;
}

interface ClaimsResponse {
  claims: StoreClaim[];
  total: number;
  page: number;
  pages: number;
}

// ─── Data Match Helpers ───────────────────────────────────────────────────────

type MatchLevel = "match" | "mismatch" | "missing";

interface FieldComparison {
  label: string;
  adminValue: string;
  claimValue: string;
  match: MatchLevel;
}

/**
 * Normalize a string for loose comparison:
 * lowercase, collapse whitespace, strip punctuation.
 */
function normalize(val: string | null | undefined): string {
  return (val ?? "")
    .toLowerCase()
    .replace(/[.,\-#]/g, " ")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, " ")
    .trim();
}

function compareField(
  label: string,
  adminVal: string | null | undefined,
  claimVal: string | null | undefined,
): FieldComparison {
  const a = normalize(adminVal);
  const c = normalize(claimVal);
  let match: MatchLevel;

  if (!a && !c) match = "missing";
  else if (!a || !c) match = "mismatch";
  else if (a === c) match = "match";
  // partial: one contains the other (e.g. "123 main st" vs "123 main street new york")
  else if (a.includes(c) || c.includes(a)) match = "match";
  else match = "mismatch";

  return {
    label,
    adminValue: adminVal || "—",
    claimValue: claimVal || "—",
    match,
  };
}

function buildComparisons(claim: StoreClaim): FieldComparison[] | null {
  if (!claim.store) return null; // new store, nothing to compare

  const adminFullAddress = [
    claim.store.address,
    claim.store.city,
    claim.store.state,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    compareField("Store Name", claim.store.store_name, claim.business_name),
    compareField("Address", adminFullAddress, claim.store_address),
  ];
}

function overallMatchStatus(
  comparisons: FieldComparison[],
): "all_match" | "partial" | "mismatch" {
  const mismatches = comparisons.filter((c) => c.match === "mismatch").length;
  const matches = comparisons.filter((c) => c.match === "match").length;
  if (mismatches === 0) return "all_match";
  if (matches > 0) return "partial";
  return "mismatch";
}

// ─── Match Badge ──────────────────────────────────────────────────────────────

const MatchBadge = ({ match }: { match: MatchLevel }) => {
  if (match === "match")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Match
      </span>
    );
  if (match === "mismatch")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Mismatch
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      — Missing
    </span>
  );
};

// ─── Data Match Panel ─────────────────────────────────────────────────────────

const DataMatchPanel = ({ claim }: { claim: StoreClaim }) => {
  const comparisons = buildComparisons(claim);

  // New store — no admin data to compare
  if (!comparisons) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold text-sm text-blue-800">
            New Store Registration
          </h4>
        </div>
        <p className="text-sm text-blue-700">
          This claimant is registering a <strong>brand new store</strong> — not
          claiming an existing admin-uploaded listing. There is no existing
          record to compare against.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
          <div>
            <span className="text-blue-600 font-medium">Business Name</span>
            <p className="mt-0.5 text-blue-900">{claim.business_name || "—"}</p>
          </div>
          <div>
            <span className="text-blue-600 font-medium">Store Address</span>
            <p className="mt-0.5 text-blue-900">{claim.store_address || "—"}</p>
          </div>
        </div>
      </div>
    );
  }

  const overall = overallMatchStatus(comparisons);

  const overallConfig = {
    all_match: {
      icon: <ShieldCheck className="w-4 h-4 text-green-600" />,
      label: "All fields match",
      className: "border-green-200 bg-green-50",
      titleClass: "text-green-800",
      descClass: "text-green-700",
      desc: "The store owner's submitted details match our records. This claim looks legitimate.",
    },
    partial: {
      icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
      label: "Partial match",
      className: "border-yellow-200 bg-yellow-50",
      titleClass: "text-yellow-800",
      descClass: "text-yellow-700",
      desc: "Some fields match but others differ. Review mismatches carefully before approving.",
    },
    mismatch: {
      icon: <XCircle className="w-4 h-4 text-red-600" />,
      label: "Data mismatch",
      className: "border-red-200 bg-red-50",
      titleClass: "text-red-800",
      descClass: "text-red-700",
      desc: "The submitted details do not match our records. Verify documents carefully.",
    },
  }[overall];

  return (
    <div className={`rounded-lg border p-4 space-y-4 ${overallConfig.className}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {overallConfig.icon}
          <h4 className={`font-semibold text-sm ${overallConfig.titleClass}`}>
            Store Data Comparison — {overallConfig.label}
          </h4>
        </div>
      </div>
      <p className={`text-xs ${overallConfig.descClass}`}>
        {overallConfig.desc}
      </p>

      {/* Comparison table */}
      <div className="rounded-lg border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[120px]">
                Field
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  Admin Record
                </div>
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-purple-500" />
                  Claimed By Owner
                </div>
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[100px]">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c, i) => (
              <tr
                key={c.label}
                className={`border-t ${
                  c.match === "mismatch"
                    ? "bg-red-50"
                    : c.match === "match"
                    ? "bg-green-50/50"
                    : ""
                }`}
              >
                <td className="px-3 py-2.5 font-medium text-muted-foreground">
                  {c.label}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={
                      c.match === "mismatch" ? "text-red-700 font-medium" : ""
                    }
                  >
                    {c.adminValue}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={
                      c.match === "mismatch" ? "text-red-700 font-medium" : ""
                    }
                  >
                    {c.claimValue}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <MatchBadge match={c.match} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Comparison is case-insensitive and ignores punctuation differences.
      </p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminClaims() {
  const [claims, setClaims] = useState<StoreClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [selectedClaim, setSelectedClaim] = useState<StoreClaim | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [claimToReject, setClaimToReject] = useState<StoreClaim | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const stats = {
    all: claims.length,
    pending: claims.filter((c) => c.status === "pending").length,
    approved: claims.filter((c) => c.status === "approved").length,
    rejected: claims.filter((c) => c.status === "rejected").length,
  };

  const filteredClaims =
    activeTab === "all" ? claims : claims.filter((c) => c.status === activeTab);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      const response = await AuthService.makeAuthenticatedRequest(
        buildApiUrl(API_CONFIG.ENDPOINTS.CLAIMS_ALL),
      );
      if (!response.ok) throw new Error("Failed to fetch claims");
      const data: ClaimsResponse = await response.json();
      setClaims(data.claims || []);
    } catch (err) {
      console.error("Error fetching claims:", err);
      toast({
        title: "Error",
        description: "Failed to load claims.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Approve ──────────────────────────────────────────────────────────────────
  const handleApprove = async (claim: StoreClaim) => {
    setActionLoading(claim._id);
    try {
      const response = await AuthService.makeAuthenticatedRequest(
        buildApiUrl(
          API_CONFIG.ENDPOINTS.CLAIMS_APPROVE.replace(":claim_id", claim._id),
        ),
        {
          method: "PUT",
          body: JSON.stringify({ admin_note: "Claim approved by admin." }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to approve");
      }

      setClaims((prev) =>
        prev.map((c) =>
          c._id === claim._id
            ? { ...c, status: "approved", reviewed_at: new Date().toISOString() }
            : c,
        ),
      );

      toast({
        title: "Claim Approved",
        description: `${claim.full_name} has been approved. A confirmation email has been sent.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to approve claim.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject ───────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!claimToReject || !rejectReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please enter a rejection reason.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(claimToReject._id);
    setRejectDialogOpen(false);

    try {
      const response = await AuthService.makeAuthenticatedRequest(
        buildApiUrl(
          API_CONFIG.ENDPOINTS.CLAIMS_REJECT.replace(
            ":claim_id",
            claimToReject._id,
          ),
        ),
        {
          method: "PUT",
          body: JSON.stringify({ reason: rejectReason.trim() }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to reject");
      }

      setClaims((prev) =>
        prev.map((c) =>
          c._id === claimToReject._id
            ? {
                ...c,
                status: "rejected",
                admin_note: rejectReason,
                reviewed_at: new Date().toISOString(),
              }
            : c,
        ),
      );

      toast({
        title: "Claim Rejected",
        description: `${claimToReject.full_name}'s claim has been rejected. They have been notified by email.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reject claim.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setClaimToReject(null);
      setRejectReason("");
    }
  };

  // ── Status badge ─────────────────────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: StoreClaim["status"] }) => {
    if (status === "approved")
      return (
        <Badge className="gap-1 bg-green-600 text-white">
          <CheckCircle2 className="w-3 h-3" /> Approved
        </Badge>
      );
    if (status === "rejected")
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" /> Rejected
        </Badge>
      );
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="w-3 h-3" /> Pending
      </Badge>
    );
  };

  // ── Match indicator for the table ─────────────────────────────────────────────
  const TableMatchIndicator = ({ claim }: { claim: StoreClaim }) => {
    if (!claim.store) {
      return (
        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
          New store
        </span>
      );
    }
    const comparisons = buildComparisons(claim);
    if (!comparisons) return null;
    const overall = overallMatchStatus(comparisons);
    if (overall === "all_match")
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Data match
        </span>
      );
    if (overall === "partial")
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" /> Partial match
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Mismatch
      </span>
    );
  };

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns: Column<StoreClaim>[] = [
    {
      key: "full_name",
      header: "Claimant",
      sortable: true,
      searchable: true,
      render: (_, claim) => (
        <div>
          <p className="font-medium">{claim.full_name}</p>
          <p className="text-xs text-muted-foreground">
            {claim.business_name || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      searchable: true,
      render: (_, claim) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Mail className="w-3 h-3 text-muted-foreground" />
            {claim.email}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="w-3 h-3" />
            {claim.phone_number}
          </div>
        </div>
      ),
    },
    {
      key: "store",
      header: "Store",
      render: (_, claim) =>
        claim.store ? (
          <div>
            <p className="text-sm font-medium">{claim.store.store_name}</p>
            <p className="text-xs text-muted-foreground">
              {[claim.store.city, claim.store.state].filter(Boolean).join(", ")}
            </p>
            {claim.store_address && (
              <p
                className="text-xs text-muted-foreground truncate max-w-[180px]"
                title={claim.store_address}
              >
                {claim.store_address}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            New store
          </span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (_, claim) => (
        <div className="space-y-1">
          <StatusBadge status={claim.status} />
          {claim.status === "pending" && (
            <TableMatchIndicator claim={claim} />
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      sortable: true,
      render: (_, claim) => (
        <span className="text-sm text-muted-foreground">
          {new Date(claim.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, claim) => (
        <div className="flex items-center gap-2">
          {/* View details */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedClaim(claim);
              setDetailsOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {/* Approve — only for pending */}
          {claim.status === "pending" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    disabled={actionLoading === claim._id}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Claim</AlertDialogTitle>
                    <AlertDialogDescription>
                      Approve <strong>{claim.full_name}</strong>'s claim for{" "}
                      <strong>{claim.business_name || "their store"}</strong>?
                      <br />
                      <br />
                      They will receive a confirmation email and can log in
                      immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleApprove(claim)}>
                      Approve & Notify
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Reject */}
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={actionLoading === claim._id}
                onClick={() => {
                  setClaimToReject(claim);
                  setRejectReason("");
                  setRejectDialogOpen(true);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading claims...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Store Claims</h1>
            <p className="text-muted-foreground">
              Review and approve store ownership claims from store owners
            </p>
          </div>
          <Button variant="outline" onClick={fetchClaims} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab("all")}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.all}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab("pending")}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab("approved")}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.approved}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab("rejected")}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500" />
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

        {/* ── Table with tabs ── */}
        <Card>
          <CardHeader>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            >
              <TabsList>
                <TabsTrigger value="pending">
                  Pending
                  {stats.pending > 0 && (
                    <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {stats.pending}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {filteredClaims.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">
                  No {activeTab === "all" ? "" : activeTab} claims
                </p>
                <p className="text-sm mt-1">
                  {activeTab === "pending"
                    ? "No store claims are waiting for review."
                    : `No ${activeTab} claims to display.`}
                </p>
              </div>
            ) : (
              <DataTable
                data={filteredClaims}
                columns={columns}
                searchable
                sortable
              />
            )}
          </CardContent>
        </Card>

        {/* ── Claim Details Dialog ── */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Claim Details
              </DialogTitle>
              <DialogDescription>
                Full claim information, submitted documents, and data verification
              </DialogDescription>
            </DialogHeader>

            {selectedClaim && (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedClaim.status} />
                  {selectedClaim.reviewed_at && (
                    <span className="text-xs text-muted-foreground">
                      Reviewed{" "}
                      {new Date(selectedClaim.reviewed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* ── Data Match Panel ── */}
                <DataMatchPanel claim={selectedClaim} />

                {/* Claimant Info */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Claimant Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Full Name
                      </span>
                      <p className="mt-0.5">{selectedClaim.full_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Email
                      </span>
                      <p className="mt-0.5">{selectedClaim.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Phone
                      </span>
                      <p className="mt-0.5">{selectedClaim.phone_number}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Business Name
                      </span>
                      <p className="mt-0.5">
                        {selectedClaim.business_name || "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-muted-foreground">
                        Store Address (as provided by owner)
                      </span>
                      <p className="mt-0.5 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                        {selectedClaim.store_address || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Submitted
                      </span>
                      <p className="mt-0.5">
                        {new Date(selectedClaim.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Setup Completed
                      </span>
                      <p className="mt-0.5">
                        {selectedClaim.setup_completed ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin-uploaded Store Info */}
                {selectedClaim.store && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      Admin-Uploaded Store Record
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Store Name
                        </span>
                        <p className="mt-0.5">
                          {selectedClaim.store.store_name}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Location
                        </span>
                        <p className="mt-0.5">
                          {[selectedClaim.store.city, selectedClaim.store.state]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-muted-foreground">
                          Address
                        </span>
                        <p className="mt-0.5 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                          {selectedClaim.store.address || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Verification Documents
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Document 1</p>
                      <a
                        href={selectedClaim.licence_1}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={selectedClaim.licence_1}
                          alt="Licence 1"
                          className="w-full h-40 object-cover rounded-lg border hover:opacity-90 transition-opacity cursor-pointer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <p className="text-xs text-blue-600 mt-1 truncate hover:underline">
                          View full image ↗
                        </p>
                      </a>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Document 2</p>
                      <a
                        href={selectedClaim.licence_2}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={selectedClaim.licence_2}
                          alt="Licence 2"
                          className="w-full h-40 object-cover rounded-lg border hover:opacity-90 transition-opacity cursor-pointer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <p className="text-xs text-blue-600 mt-1 truncate hover:underline">
                          View full image ↗
                        </p>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Admin note / rejection reason */}
                {selectedClaim.admin_note && (
                  <div
                    className={`rounded-lg p-4 text-sm ${
                      selectedClaim.status === "rejected"
                        ? "bg-red-50 border border-red-200 text-red-700"
                        : "bg-green-50 border border-green-200 text-green-700"
                    }`}
                  >
                    <p className="font-medium mb-1">
                      {selectedClaim.status === "rejected"
                        ? "Rejection Reason"
                        : "Admin Note"}
                    </p>
                    <p>{selectedClaim.admin_note}</p>
                  </div>
                )}

                {/* Action buttons inside details dialog */}
                {selectedClaim.status === "pending" && (
                  <div className="flex gap-3 pt-2 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4" />
                          Approve Claim
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve Claim</AlertDialogTitle>
                          <AlertDialogDescription>
                            Approve <strong>{selectedClaim.full_name}</strong>'s
                            claim? They will receive a confirmation email and can
                            log in immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              handleApprove(selectedClaim);
                              setDetailsOpen(false);
                            }}
                          >
                            Approve & Notify
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setClaimToReject(selectedClaim);
                        setRejectReason("");
                        setDetailsOpen(false);
                        setRejectDialogOpen(true);
                      }}
                    >
                      <X className="w-4 h-4" />
                      Reject Claim
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Reject Reason Dialog ── */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Reject Claim
              </DialogTitle>
              <DialogDescription>
                Provide a reason for rejection.{" "}
                <strong>{claimToReject?.full_name}</strong> will be notified by
                email with this reason.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Textarea
                placeholder="e.g. Documents are unclear or expired. Please resubmit with valid documents."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This message will be sent directly to the claimant.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setClaimToReject(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!rejectReason.trim()}
                onClick={handleReject}
              >
                Reject & Notify
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}