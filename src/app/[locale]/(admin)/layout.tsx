"use client";

import { useSidebar } from "@/context/SidebarContext";
import QueryProvider from "@/context/QueryProvider";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { Toaster } from "sonner";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <QueryProvider>
      <div className="min-h-screen xl:flex">
        <Toaster richColors style={{ zIndex: 100000 }} />
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`max-w-full min-w-0 flex-1 overflow-x-hidden transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          {/* Header */}
          <AppHeader />
          {/* Page Content */}
          <div className="mx-auto max-w-(--breakpoint-2xl) min-w-0 overflow-x-hidden p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}
