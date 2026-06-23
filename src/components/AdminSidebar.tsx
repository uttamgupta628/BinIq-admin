import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  MapPin,
  MessageSquare,
  HelpCircle,
  Settings,
  ClipboardList,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ScanLine,
  TrendingUp,
  Handshake,
  FileText,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Scans", href: "/scans", icon: ScanLine },
  { title: "Store Owners", href: "/store-owners", icon: Store },
  { title: "Store Claims", href: "/store-claims", icon: FileText },
  { title: "Resellers", href: "/resellers", icon: Users },
  { title: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { title: "Locations", href: "/locations", icon: MapPin },
  { title: "Feedback", href: "/feedback", icon: MessageSquare },
  { title: "FAQ", href: "/faq", icon: HelpCircle },
  { title: "Analytics", href: "/analytics", icon: TrendingUp },
  { title: "Marketing", href: "/marketing", icon: Handshake },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Profile", href: "/profile", icon: User },
];

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const { logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn.builder.io/api/v1/assets/0b806350f02b4342b9c7f755ac336bc3/logo-f5188a?format=webp&width=800"
            alt="binIQ"
            className="w-8 h-8"
          />
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">binIQ</h2>
            <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {sidebarItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                onClick={closeMobile}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur"
        onClick={toggleMobile}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:w-64 bg-sidebar border-r border-sidebar-border",
          className
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 w-64 h-full bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}