import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
} from "lucide-react";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";
import { toast } from "../hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawRow {
  store_name: string;
  address: string;
  store_email: string;
  city: string;
  state: string;
  zip_code: string;
  daily_rate_raw: string;
  facebook_link: string;
}

type RowStatus = "pending" | "uploading" | "success" | "error";

interface ParsedRow extends RawRow {
  id: number;
  status: RowStatus;
  error?: string;
}

interface BulkUploadStoresProps {
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

/**
 * Normalize a header key: uppercase + collapse whitespace.
 * This makes matching robust against trailing spaces, double spaces, etc.
 */
function normalizeKey(key: string): string {
  return String(key).toUpperCase().replace(/\s+/g, " ").trim();
}

/**
 * Build a lookup map from normalized header → original key.
 * Called once per parsed sheet so every row lookup is O(1).
 */
function buildHeaderMap(firstRow: Record<string, unknown>): Map<string, string> {
  const map = new Map<string, string>();
  for (const key of Object.keys(firstRow)) {
    map.set(normalizeKey(key), key);
  }
  return map;
}

/**
 * Look up a cell value using a normalized header.
 * Accepts multiple aliases so typos in source files are tolerated.
 */
function getCell(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
  ...aliases: string[]
): string {
  for (const alias of aliases) {
    const originalKey = headerMap.get(normalizeKey(alias));
    if (originalKey !== undefined && row[originalKey] !== undefined && row[originalKey] !== "") {
      return String(row[originalKey]).trim();
    }
  }
  return "";
}

/** Map a raw DAILY RATE string into the daily_rates object expected by the backend */
function parseDailyRates(raw: string): Record<string, string | null> | null {
  if (!raw || typeof raw !== "string") return null;

  const VALID_DAYS = [
    "Friday", "Saturday", "Sunday",
    "Monday", "Tuesday", "Wednesday", "Thursday",
  ];

  const result: Record<string, string | null> = {};

  const lines = raw.split(/\n|\r\n|\r/);
  for (const line of lines) {
    const parts = line.split(/\t|\s{2,}/);
    const day = parts[0]?.trim();
    if (!VALID_DAYS.includes(day)) continue;

    const priceToken = parts.find((p) => /^\$\d+(\.\d+)?$/.test(p.trim()));
    if (!priceToken) {
      result[day] = null;
      continue;
    }
    const num = parseFloat(priceToken.replace("$", "")).toFixed(2);
    result[day] = num;
  }

  return Object.keys(result).length > 0 ? result : null;
}

/** Convert raw xlsx row to ParsedRow using a pre-built header map */
function mapRow(
  raw: Record<string, unknown>,
  headerMap: Map<string, string>,
  index: number,
): ParsedRow {
  return {
    id: index,
    // "STORE NAME" — no known typo variants, but normalize anyway
    store_name: getCell(raw, headerMap, "STORE NAME"),
    // "STORE ADRESS" is the typo in the source file; also accept correct spelling
    address: getCell(raw, headerMap, "STORE ADRESS", "STORE ADDRESS"),
    store_email: getCell(raw, headerMap, "STORE EMAIL", "EMAIL"),
    city: getCell(raw, headerMap, "CITY"),
    state: getCell(raw, headerMap, "STATE"),
    zip_code: getCell(raw, headerMap, "ZIP CODE", "ZIPCODE", "ZIP")
      .replace(/\.0$/, ""), // xlsx sometimes turns 10001 → "10001.0"
    daily_rate_raw: getCell(raw, headerMap, "DAILY RATE", "DAILY RATES"),
    facebook_link: getCell(raw, headerMap, "FACEBOOK PAGE", "FACEBOOK LINK", "FACEBOOK"),
    status: "pending",
  };
}

/** Build the API payload for one row */
function buildPayload(row: ParsedRow) {
  const daily_rates = parseDailyRates(row.daily_rate_raw) ?? undefined;
  return {
    store_name: row.store_name.replace(/\s+/g, ' ').trim() || undefined,
    address: row.address.replace(/\s+/g, ' ').trim() || undefined,
    store_email: row.store_email || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    zip_code: row.zip_code || undefined,
    facebook_link: row.facebook_link || undefined,
    ...(daily_rates ? { daily_rates } : {}),
    verified: false,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BulkUploadStores({ onSuccess }: BulkUploadStoresProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File parsing ────────────────────────────────────────────────────────────
  const parseFile = useCallback((file: File) => {
    setParseError(null);
    setRows([]);
    setPage(0);
    setProgress(0);

    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError("Please upload an .xlsx, .xls, or .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Auto-detect the header row: scan up to the first 5 rows to find
        // whichever one contains "STORE NAME" (handles title/banner rows above headers).
        const REQUIRED = "STORE NAME";
        let headerRowIndex = -1;

        for (let r = 0; r <= 4; r++) {
          const probe: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
            defval: "",
            range: r,
          });
          if (probe.length === 0) continue;
          const probeMap = buildHeaderMap(probe[0]);
          if (probeMap.has(REQUIRED)) {
            headerRowIndex = r;
            break;
          }
        }

        if (headerRowIndex === -1) {
          // Show what row 0 actually had to help with debugging
          const fallback: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 0 });
          const found = fallback.length > 0 ? [...buildHeaderMap(fallback[0]).keys()].join(", ") : "none";
          setParseError(
            `Required column "STORE NAME" not found in the first 5 rows. Columns detected: ${found}. Please use the template format.`,
          );
          return;
        }

        const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
          range: headerRowIndex,
        });

        if (json.length === 0) {
          setParseError("The file appears to be empty.");
          return;
        }

        // Build a normalized header map from the detected header row
        const headerMap = buildHeaderMap(json[0]);

        const parsed = json
          .map((r, i) => mapRow(r, headerMap, i))
          .filter((r) => r.store_name !== ""); // skip blank rows

        if (parsed.length === 0) {
          setParseError("No valid store rows found in the file.");
          return;
        }

        setRows(parsed);
      } catch (err) {
        setParseError("Failed to parse file. Make sure it is a valid spreadsheet.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile],
  );

  // ── Upload ──────────────────────────────────────────────────────────────────
  // The backend expects ONE request: POST /stores/bulk-create { stores: [...] }
  // It returns 207 with { created: [{store_name, store_id}], failed: [{store_name, reason}] }
  const handleUpload = async () => {
    if (rows.length === 0 || uploading) return;

    setUploading(true);
    setProgress(0);
    setRows((prev) => prev.map((r) => ({ ...r, status: "uploading", error: undefined })));

    const baseUrl = API_CONFIG.BASE_URL;
    const bulkPath = API_CONFIG.ENDPOINTS.BULK_CREATE_STORES ?? "/stores/bulk-create";
    const endpoint = `${baseUrl}${bulkPath}`;

    try {
      const res = await AuthService.makeAuthenticatedRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ stores: rows.map(buildPayload) }),
      });

      // Backend returns 207 Multi-Status with created/failed arrays
      const data = await res.json().catch(() => ({}));

      if (!res.ok && res.status !== 207) {
        // Whole request failed (auth error, server crash, etc.)
        setRows((prev) => prev.map((r) => ({
          ...r,
          status: "error",
          error: data?.message ?? `HTTP ${res.status}`,
        })));
        toast({
          title: "Upload failed",
          description: data?.message ?? `Server returned ${res.status}`,
          variant: "destructive",
        });
        return;
      }

      // Build lookup sets from backend response
      const createdNames = new Set<string>(
        (data.created ?? []).map((c: any) => c.store_name)
      );
      const failedMap = new Map<string, string>(
        (data.failed ?? []).map((f: any) => [f.store_name, f.reason])
      );

      setRows((prev) => prev.map((r) => {
        if (createdNames.has(r.store_name)) {
          return { ...r, status: "success" };
        }
        if (failedMap.has(r.store_name)) {
          return { ...r, status: "error", error: failedMap.get(r.store_name) };
        }
        // Fallback — shouldn't happen
        return { ...r, status: "error", error: "Unknown" };
      }));

      setProgress(100);

      const successCount = data.created?.length ?? 0;
      const errorCount = data.failed?.length ?? 0;

      toast({
        title: "Bulk upload complete",
        description: `${successCount} stores created, ${errorCount} failed.`,
        variant: errorCount > 0 && successCount === 0 ? "destructive" : "default",
      });

      if (successCount > 0) onSuccess?.();

    } catch (err: any) {
      setRows((prev) => prev.map((r) => ({
        ...r,
        status: "error",
        error: err?.message ?? "Network error",
      })));
      toast({
        title: "Upload failed",
        description: err?.message ?? "Network error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // ── Download template ────────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["STORE NAME", "STORE ADRESS", "STORE EMAIL", "CITY", "STATE", "ZIP CODE", "DAILY RATE", "FACEBOOK PAGE"],
      [
        "Example Store",
        "123 Main St",
        "store@email.com",
        "New York",
        "NY",
        "10001",
        "Friday\t$25\t10 am – 7 pm\nSaturday\t$10\t10 am – 5 pm",
        "https://facebook.com/example",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stores");
    XLSX.writeFile(wb, "bulk_store_template.xlsx");
  };

  // ── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    success: rows.filter((r) => r.status === "success").length,
    error: rows.filter((r) => r.status === "error").length,
  };

  const canUpload = rows.length > 0 && !uploading;

  // ── Reset on close ───────────────────────────────────────────────────────────
  const handleClose = (v: boolean) => {
    if (uploading) return;
    if (!v) {
      setRows([]);
      setParseError(null);
      setProgress(0);
      setPage(0);
    }
    setOpen(v);
  };

  // ── Status badge helper ──────────────────────────────────────────────────────
  const StatusBadge = ({ status, error }: { status: RowStatus; error?: string }) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "uploading":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Uploading
          </Badge>
        );
      case "success":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="w-3 h-3" /> Created
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" title={error} className="gap-1 cursor-help">
            <XCircle className="w-3 h-3" /> Failed
          </Badge>
        );
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="w-4 h-4 mr-2" />
        Bulk Upload Stores
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Bulk Upload Stores
            </DialogTitle>
            <DialogDescription>
              Upload an Excel / CSV file to create multiple stores at once.
              Stores will be created as <strong>unverified</strong> — store
              owners can claim and verify them later.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {rows.length === 0 && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                  ${isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30"
                  }
                `}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Drop your file here, or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports .xlsx, .xls, .csv
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) parseFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            )}

            {parseError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {rows.length === 0 && !parseError && (
              <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
                <span>Not sure about the format?</span>
                <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-1">
                  <Download className="w-4 h-4" />
                  Download template
                </Button>
              </div>
            )}

            {rows.length > 0 && (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium">{stats.total} stores loaded</span>
                {stats.success > 0 && (
                  <Badge variant="default" className="bg-green-600">
                    {stats.success} created
                  </Badge>
                )}
                {stats.error > 0 && (
                  <Badge variant="destructive">{stats.error} failed</Badge>
                )}
                {stats.pending > 0 && uploading && (
                  <Badge variant="secondary">{stats.pending} pending</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-muted-foreground"
                  disabled={uploading}
                  onClick={() => {
                    setRows([]);
                    setParseError(null);
                    setProgress(0);
                    setPage(0);
                  }}
                >
                  Clear
                </Button>
              </div>
            )}

            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {rows.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground w-8">#</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[160px]">Store Name</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[180px]">Address</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">City</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">State</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Zip</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[160px]">Email</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Pricing</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={`border-t transition-colors ${
                            row.status === "error"
                              ? "bg-red-50"
                              : row.status === "success"
                              ? "bg-green-50"
                              : idx % 2 === 0
                              ? "bg-background"
                              : "bg-muted/20"
                          }`}
                        >
                          <td className="px-3 py-2 text-muted-foreground">
                            {page * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="px-3 py-2 font-medium">{row.store_name || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate" title={row.address}>
                            {row.address || "—"}
                          </td>
                          <td className="px-3 py-2">{row.city || "—"}</td>
                          <td className="px-3 py-2">{row.state || "—"}</td>
                          <td className="px-3 py-2">{row.zip_code || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground max-w-[180px] truncate" title={row.store_email}>
                            {row.store_email || "—"}
                          </td>
                          <td className="px-3 py-2">
                            {row.daily_rate_raw ? (
                              <Badge variant="outline" className="text-xs">Has rates</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge status={row.status} error={row.error} />
                            {row.error && (
                              <p className="text-xs text-red-600 mt-0.5 max-w-[140px]">{row.error}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-sm">
                    <span className="text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="mr-auto gap-1"
              disabled={uploading}
            >
              <Download className="w-4 h-4" />
              Template
            </Button>

            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={uploading}
            >
              {stats.success > 0 ? "Close" : "Cancel"}
            </Button>

            <Button
              onClick={handleUpload}
              disabled={!canUpload}
              className="gap-1 min-w-[140px]"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading {progress}%
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {rows.length > 0 ? `${rows.length} Stores` : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}