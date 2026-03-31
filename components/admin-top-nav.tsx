"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { adminNavItems, getActiveAdminKey } from "@/components/admin-nav-config";

export function AdminTopNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const activeKey = getActiveAdminKey(pathname);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="admin-top-nav">
      <div className="admin-top-nav__row">
        <div className="admin-top-nav__brand-block">
          <Link className="admin-top-nav__brand" href="/admin">
            Rocket Ribs Workforce
          </Link>
          <span className="admin-top-nav__tag">Admin Portal</span>
        </div>
        <button
          aria-controls="admin-top-nav-menu"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close admin navigation menu" : "Open admin navigation menu"}
          className="admin-top-nav__menu-button"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <div className={`admin-top-nav__menu${isOpen ? " is-open" : ""}`} id="admin-top-nav-menu">
          <nav aria-label="Admin navigation" className="admin-top-nav__links">
            {adminNavItems.map((item) => {
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
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
