export type AdminNavItem = {
  href: string;
  key: string;
  label: string;
};

export const adminNavItems: AdminNavItem[] = [
  { href: "/admin", key: "dashboard", label: "Dashboard" },
  { href: "/admin/workers", key: "workers", label: "Workers" },
  { href: "/admin/time", key: "time", label: "Time" },
  { href: "/admin/pay", key: "pay", label: "Pay" },
  { href: "/admin/pay/reports", key: "reports", label: "Reports" },
  { href: "/admin/training", key: "training", label: "Training" },
  { href: "/admin/forms", key: "forms", label: "Forms" },
  { href: "/admin/schedule", key: "schedule", label: "Schedule" }
];

export function getActiveAdminKey(pathname: string) {
  if (pathname === "/admin") return "dashboard";
  if (pathname.startsWith("/admin/workers")) return "workers";
  if (pathname.startsWith("/admin/time")) return "time";
  if (pathname.startsWith("/admin/pay/reports")) return "reports";
  if (pathname.startsWith("/admin/pay/batches")) return "pay";
  if (pathname.startsWith("/admin/pay")) return "pay";
  if (pathname.startsWith("/admin/training")) return "training";
  if (pathname.startsWith("/admin/forms")) return "forms";
  if (pathname.startsWith("/admin/schedule")) return "schedule";

  return null;
}
