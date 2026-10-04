import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ThietbiManager from "@/components/thiet-bi/ThietbiManager";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Thiết b | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Thiết b  page for TailAdmin  Tailwind CSS Admin Dashboard Template",
  // other metadata
};
const thietbisPage = () => {
  return (
    <div>
      <PageBreadcrumb pageTitle="Thiết bị" />
      <div className="space-y-6">
        <ComponentCard title="Cập nhật thiết bị">
          <ThietbiManager />
        </ComponentCard>
      </div>
    </div>
  );
};

export default thietbisPage;
