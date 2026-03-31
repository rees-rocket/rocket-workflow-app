"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getActiveWorkerKey, workerNavItems } from "@/components/worker-nav-config";

export function WorkerTopNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const activeKey = getActiveWorkerKey(pathname);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="admin-top-nav worker-top-nav">
      <div className="admin-top-nav__row">
        <div className="admin-top-nav__brand-block">
          <Link className="admin-top-nav__brand" href="/worker">
            Rocket Ribs Workforce
          </Link>
          <span className="admin-top-nav__tag">Worker Portal</span>
        </div>
        <button
          aria-controls="worker-top-nav-menu"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close worker navigation menu" : "Open worker navigation menu"}
          className="admin-top-nav__menu-button"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <div className={`admin-top-nav__menu${isOpen ? " is-open" : ""}`} id="worker-top-nav-menu">
          <nav aria-label="Worker navigation" className="admin-top-nav__links">
            {workerNavItems.map((item) => {
              const isActive = item.key === activeKey;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`admin-top-nav__link${isActive ? " is-active" : ""}`}
                  href={item.href}
                  key={item.key}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form action="/auth/logout" method="post">
            <button className="admin-top-nav__logout" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
