export type WorkerNavItem = {
  href: string;
  key: string;
  label: string;
};

export const workerNavItems: WorkerNavItem[] = [
  { href: "/worker", key: "dashboard", label: "Dashboard" },
  { href: "/worker/pay", key: "pay", label: "Pay" },
  { href: "/worker/time", key: "time", label: "Time" },
  { href: "/worker/schedule", key: "schedule", label: "Schedule" },
  { href: "/worker/training", key: "training", label: "Training" },
  { href: "/worker/forms", key: "forms", label: "Forms" }
];

export function getActiveWorkerKey(pathname: string) {
  if (pathname === "/worker") return "dashboard";
  if (pathname.startsWith("/worker/pay")) return "pay";
  if (pathname.startsWith("/worker/time")) return "time";
  if (pathname.startsWith("/worker/schedule")) return "schedule";
  if (pathname.startsWith("/worker/training")) return "training";
  if (pathname.startsWith("/worker/forms")) return "forms";

  return null;
}
