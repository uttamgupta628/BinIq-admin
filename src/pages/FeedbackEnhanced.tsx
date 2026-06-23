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
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  MessageSquare,
  Star,
  Reply,
  Eye,
  TrendingUp,
  PieChart,
  BarChart3,
  Smile,
  Meh,
  Frown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AuthService } from "../lib/auth";
import { API_CONFIG } from "../lib/api";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface FeedbackItem {
  _id: string;
  rating: number;
  username: string;
  userType: "Store Owner" | "Reseller";
  message: string;
  email: string;
  date: string;
  replied: boolean;
  reply: string;
  user_id?: string;
  sentiment?: "positive" | "neutral" | "negative";
  sentimentScore?: number;
}

interface FeedbackResponse {
  _id: string;
  rating: number;
  user_name: string;
  type: "store_owner" | "reseller";
  suggestion: string;
  user_email: string;
  created_at: string;
  status: string;
  reply?: string;
  user_id: string;
}

interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  pendingReplies: number;
  repliedCount: number;
}

interface SentimentStats {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentTrend {
  month: string;
  positive: number;
  neutral: number;
  negative: number;
  averageRating: number;
}

export default function FeedbackEnhanced() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(
    null,
  );
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [sentimentStats, setSentimentStats] = useState<SentimentStats>({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [stats, setStats] = useState<FeedbackStats>({
    totalFeedback: 0,
    averageRating: 0,
    pendingReplies: 0,
    repliedCount: 0,
  });

  // Helper functions for sentiment analysis
  const analyzeSentiment = (
    text: string,
    rating: number,
  ): { label: "positive" | "neutral" | "negative"; score: number } => {
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "amazing",
      "love",
      "perfect",
      "fantastic",
      "wonderful",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "hate",
      "worst",
      "horrible",
      "disappointing",
      "useless",
    ];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter((word) =>
      lowerText.includes(word),
    ).length;
    const negativeCount = negativeWords.filter((word) =>
      lowerText.includes(word),
    ).length;

    let sentiment: "positive" | "neutral" | "negative";
    let score: number;

    if (rating >= 4 || positiveCount > negativeCount) {
      sentiment = "positive";
      score = rating >= 4 ? rating / 5 : 0.7;
    } else if (rating <= 2 || negativeCount > positiveCount) {
      sentiment = "negative";
      score = rating <= 2 ? (5 - rating) / 5 : 0.7;
    } else {
      sentiment = "neutral";
      score = 0.5;
    }

    return { label: sentiment, score };
  };

  const calculateSentimentStats = (
    feedbacks: FeedbackItem[],
  ): SentimentStats => {
    const total = feedbacks.length;
    if (total === 0) return { positive: 0, neutral: 0, negative: 0 };

    const positive = feedbacks.filter((f) => f.sentiment === "positive").length;
    const negative = feedbacks.filter((f) => f.sentiment === "negative").length;
    const neutral = total - positive - negative;

    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100),
    };
  };

  const generateMockTrends = (): SentimentTrend[] => [
    {
      month: "Jan",
      positive: 65,
      neutral: 25,
      negative: 10,
      averageRating: 4.2,
    },
    {
      month: "Feb",
      positive: 70,
      neutral: 22,
      negative: 8,
      averageRating: 4.3,
    },
    {
      month: "Mar",
      positive: 68,
      neutral: 24,
      negative: 8,
      averageRating: 4.1,
    },
    {
      month: "Apr",
      positive: 75,
      neutral: 20,
      negative: 5,
      averageRating: 4.5,
    },
    {
      month: "May",
      positive: 72,
      neutral: 23,
      negative: 5,
      averageRating: 4.4,
    },
    {
      month: "Jun",
      positive: 78,
      neutral: 18,
      negative: 4,
      averageRating: 4.6,
    },
  ];

  const generateMockFeedbacks = (): FeedbackItem[] => [
    {
      _id: "1",
      rating: 5,
      username: "John Doe",
      userType: "Store Owner",
      message: "Excellent service! The platform is amazing and easy to use.",
      email: "john@example.com",
      date: "2024-01-20",
      replied: true,
      reply: "Thank you for your feedback!",
      sentiment: "positive",
      sentimentScore: 0.9,
    },
    {
      _id: "2",
      rating: 2,
      username: "Jane Smith",
      userType: "Reseller",
      message: "The app is confusing and has too many bugs.",
      email: "jane@example.com",
      date: "2024-01-19",
      replied: false,
      reply: "",
      sentiment: "negative",
      sentimentScore: 0.8,
    },
  ];

  // Fetch feedback data
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const baseUrl = API_CONFIG.BASE_URL;
        const response = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.FEEDBACK}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: FeedbackResponse[] = await response.json();

        // Map API data to FeedbackItem with sentiment analysis
        const mappedFeedbacks: FeedbackItem[] = data.map((fb, index) => {
          const sentiment = analyzeSentiment(fb.suggestion, fb.rating);
          return {
            _id: fb._id,
            rating: fb.rating,
            username: fb.user_name,
            userType: fb.type === "store_owner" ? "Store Owner" : "Reseller",
            message: fb.suggestion,
            email: fb.user_email,
            date: new Date(fb.created_at).toLocaleDateString(),
            replied: fb.status === "replied",
            reply: fb.reply || "",
            user_id: fb.user_id,
            sentiment: sentiment.label,
            sentimentScore: sentiment.score,
          };
        });

        // Calculate stats
        const totalFeedback = mappedFeedbacks.length;
        const averageRating =
          totalFeedback > 0
            ? Number(
                (
                  mappedFeedbacks.reduce((sum, f) => sum + f.rating, 0) /
                  totalFeedback
                ).toFixed(1),
              )
            : 0;
        const pendingReplies = mappedFeedbacks.filter((f) => !f.replied).length;
        const repliedCount = mappedFeedbacks.filter((f) => f.replied).length;

        setFeedbacks(mappedFeedbacks);
        setStats({
          totalFeedback,
          averageRating,
          pendingReplies,
          repliedCount,
        });
        setSentimentStats(calculateSentimentStats(mappedFeedbacks));
        const trendResponse = await AuthService.makeAuthenticatedRequest(
          `${baseUrl}${API_CONFIG.ENDPOINTS.FEEDBACK_TRENDS}`,
        );

        if (trendResponse.ok) {
          const trendData = await trendResponse.json();
          setSentimentTrends(trendData.data);
        }
      } catch (err: any) {
        console.error("Error fetching feedbacks:", err);
        setError("Failed to load feedbacks. Using demo data.");

        // Use mock data for demo
        const mockFeedbacks = generateMockFeedbacks();
        setFeedbacks(mockFeedbacks);
        setStats({
          totalFeedback: mockFeedbacks.length,
          averageRating: 3.5,
          pendingReplies: 1,
          repliedCount: 1,
        });
        setSentimentStats(calculateSentimentStats(mockFeedbacks));
        setSentimentTrends(generateMockTrends());
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleReply = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setReplyDialogOpen(true);
  };

  const handleViewDetails = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setDetailsDialogOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedFeedback || !replyMessage.trim()) return;

    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}${API_CONFIG.ENDPOINTS.FEEDBACK_REPLY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feedback_id: selectedFeedback._id,
            reply: replyMessage,
          }),
        },
      );

      if (response.ok) {
        setFeedbacks((prev) =>
          prev.map((fb) =>
            fb._id === selectedFeedback._id
              ? { ...fb, replied: true, reply: replyMessage }
              : fb,
          ),
        );
        setStats((prev) => ({
          ...prev,
          pendingReplies: prev.pendingReplies - 1,
          repliedCount: prev.repliedCount + 1,
        }));
      }
    } catch (err: any) {
      console.error("Error sending reply:", err);
      setError("Failed to send reply. Please try again.");
    }

    setReplyDialogOpen(false);
    setReplyMessage("");
    setSelectedFeedback(null);
  };

  const feedbackColumns: Column<FeedbackItem>[] = [
    {
      key: "username",
      header: "Username",
      sortable: true,
      searchable: true,
      render: (_, row) => row.username || "N/A",
    },
    {
      key: "userType",
      header: "User Type",
      render: (_, row) => (
        <Badge
          variant={row.userType === "Store Owner" ? "default" : "secondary"}
        >
          {row.userType}
        </Badge>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{row.rating}/5</span>
        </div>
      ),
    },
    {
      key: "message",
      header: "Message",
      searchable: true,
      render: (_, row) => (
        <div className="max-w-xs truncate" title={row.message}>
          {row.message || "N/A"}
        </div>
      ),
    },
    {
      key: "sentiment",
      header: "Sentiment",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.sentiment === "positive" ? (
            <Smile className="w-4 h-4 text-green-600" />
          ) : row.sentiment === "negative" ? (
            <Frown className="w-4 h-4 text-red-600" />
          ) : (
            <Meh className="w-4 h-4 text-yellow-600" />
          )}
          <Badge
            variant={
              row.sentiment === "positive"
                ? "default"
                : row.sentiment === "negative"
                  ? "destructive"
                  : "secondary"
            }
          >
            {row.sentiment
              ? row.sentiment.charAt(0).toUpperCase() + row.sentiment.slice(1)
              : "Unknown"}
          </Badge>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (_, row) => row.date,
    },
    {
      key: "replied",
      header: "Status",
      render: (_, row) => (
        <Badge variant={row.replied ? "default" : "destructive"}>
          {row.replied ? "Replied" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetails(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={row.replied}
            onClick={() => handleReply(row)}
          >
            <Reply className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const sentimentChartData = [
    { name: "Positive", value: sentimentStats.positive, color: "#22c55e" },
    { name: "Neutral", value: sentimentStats.neutral, color: "#eab308" },
    { name: "Negative", value: sentimentStats.negative, color: "#ef4444" },
  ];

  const COLORS = ["#22c55e", "#eab308", "#ef4444"];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading feedback...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Feedback & Sentiment Analysis
          </h1>
          <p className="text-muted-foreground">
            Manage customer feedback, replies, and analyze sentiment trends
          </p>
        </div>

        {error && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-orange-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
            <TabsTrigger value="manage">Manage Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Feedback
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.totalFeedback}
                      </p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Average Rating
                      </p>
                      <div className="flex items-center gap-1">
                        <p className="text-2xl font-bold">
                          {stats.averageRating}
                        </p>
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                    <Star className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Pending Replies
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.pendingReplies}
                      </p>
                    </div>
                    <Reply className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Replied</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.repliedCount}
                      </p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Sentiment Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Sentiment Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={sentimentChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Rating Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={sentimentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="averageRating"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            {/* Sentiment Analysis Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={sentimentChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader>
                  <CardTitle>Sentiment Trends Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sentimentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="positive" fill="#22c55e" name="Positive" />
                      <Bar dataKey="neutral" fill="#eab308" name="Neutral" />
                      <Bar dataKey="negative" fill="#ef4444" name="Negative" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card> */}
            </div>

            {/* Sentiment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Smile className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Positive Feedback
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {sentimentStats.positive}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Meh className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Neutral Feedback
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {sentimentStats.neutral}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Frown className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Negative Feedback
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {sentimentStats.negative}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            {/* Feedback Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={feedbacks}
                  columns={feedbackColumns}
                  searchable={true}
                  sortable={true}
                  customActions={[handleViewDetails]}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reply Dialog */}
        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Reply to Feedback</DialogTitle>
              <DialogDescription>
                Replying to feedback from {selectedFeedback?.username} (
                {selectedFeedback?.email})
              </DialogDescription>
            </DialogHeader>

            {selectedFeedback && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {selectedFeedback.rating}/5
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedFeedback.message}
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="reply-message"
                    className="text-sm font-medium"
                  >
                    Your Reply
                  </label>
                  <Textarea
                    id="reply-message"
                    placeholder="Type your reply here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReplyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                Send Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Feedback Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedFeedback?.username}'s feedback
              </DialogDescription>
            </DialogHeader>

            {selectedFeedback && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="h-5 w-5" />
                      Feedback Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Username:</span>{" "}
                        {selectedFeedback.username || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">User Type:</span>{" "}
                        {selectedFeedback.userType}
                      </div>
                      <div>
                        <span className="font-medium">Rating:</span>{" "}
                        {selectedFeedback.rating}/5
                      </div>
                      <div>
                        <span className="font-medium">Message:</span>
                        <p className="mt-1 p-2 bg-muted rounded">
                          {selectedFeedback.message}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Sentiment:</span>{" "}
                        <Badge
                          variant={
                            selectedFeedback.sentiment === "positive"
                              ? "default"
                              : selectedFeedback.sentiment === "negative"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {selectedFeedback.sentiment?.charAt(0).toUpperCase() +
                            selectedFeedback.sentiment?.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>{" "}
                        {selectedFeedback.email || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        {selectedFeedback.date}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        <Badge
                          variant={
                            selectedFeedback.replied ? "default" : "destructive"
                          }
                        >
                          {selectedFeedback.replied ? "Replied" : "Pending"}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Reply:</span>{" "}
                        {selectedFeedback.reply || "No reply yet"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
