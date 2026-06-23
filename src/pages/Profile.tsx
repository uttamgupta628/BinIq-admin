import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit,
  Camera,
  Settings,
  Clock,
  EyeOff,
  Eye,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { API_CONFIG } from "../lib/api";
import { AuthService } from "../lib/auth";

interface AdminProfile {
  _id: string;
  full_name: string;
  email: string;
  role: number;
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  // ── Profile state ──────────────────────────────────────────────
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Password state ─────────────────────────────────────────────
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // ── Fetch profile on mount ─────────────────────────────────────
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);

      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/api/users/profile`,
        { method: "GET" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      setProfile(data);
      setEditName(data.full_name || "");
      setEditEmail(data.email || "");
    } catch (err: any) {
      console.error("Fetch profile error:", err);
      setProfileError(err.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Save profile changes ───────────────────────────────────────
  const handleSaveChanges = async () => {
    try {
      if (!editName.trim()) {
        setSaveError("Full name cannot be empty");
        return;
      }

      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/api/users/profile`,
        {
          method: "PUT",
          body: JSON.stringify({
            full_name: editName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Update local state with new data
      if (data.user) {
        setProfile(data.user);
        setEditName(data.user.full_name || "");
        setEditEmail(data.user.email || "");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save profile error:", err);
      setSaveError(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChanges = () => {
    if (profile) {
      setEditName(profile.full_name || "");
      setEditEmail(profile.email || "");
    }
    setSaveError(null);
    setSaveSuccess(false);
  };

  // ── Change password ────────────────────────────────────────────
  const handleChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordError("All fields are required");
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters");
        return;
      }

      setIsChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(false);

      const baseUrl = API_CONFIG.BASE_URL;
      const response = await AuthService.makeAuthenticatedRequest(
        `${baseUrl}/api/users/admin-change-password`,
        {
          method: "PATCH",
          body: JSON.stringify({
            old_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      console.error("Change password error:", err);
      setPasswordError(err.message || "Something went wrong");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  // ── Helpers ────────────────────────────────────────────────────
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">
            Manage your admin profile settings
          </p>
        </div>

        {/* Loading state */}
        {profileLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading profile…</span>
          </div>
        )}

        {/* Error state */}
        {profileError && !profileLoading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 text-center text-red-600">
              <p>{profileError}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchProfile}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main content */}
        {!profileLoading && !profileError && profile && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Overview */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src="" alt={profile.full_name} />
                        <AvatarFallback className="text-lg bg-biniq-teal text-white">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-lg mt-4">
                      {profile.full_name}
                    </h3>
                    <Badge className="mt-2 bg-biniq-teal">Super Admin</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined {formatDate(profile.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Updated {formatDateTime(profile.updated_at)}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-biniq-teal hover:bg-biniq-teal/90">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Profile Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editEmail}
                          disabled
                          className="w-full opacity-60 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          value="Super Admin"
                          disabled
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {saveError && (
                    <p className="mt-4 text-sm text-red-500">{saveError}</p>
                  )}
                  {saveSuccess && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Profile updated successfully!
                    </div>
                  )}

                  <div className="mt-6 flex gap-4">
                    <Button
                      className="bg-biniq-teal hover:bg-biniq-teal/90"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleResetChanges}>
                      Reset Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>

              <CardContent>
                {passwordError && (
                  <div className="text-red-500 text-sm mb-4">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-sm mb-4">
                    <CheckCircle className="h-4 w-4" />
                    Password changed successfully!
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Current Password */}
                  <div>
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showCurrentPassword ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showNewPassword ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirmPassword ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-4">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="bg-biniq-teal hover:bg-biniq-teal/90"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancelPassword}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}