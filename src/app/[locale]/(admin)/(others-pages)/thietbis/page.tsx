import ThietbiManager from "@/components/thiet-bi/ThietbiManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js Thiết b | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Thiết b  page for TailAdmin  Tailwind CSS Admin Dashboard Template",
  // other metadata
};
const thietbisPage = () => {
  return <ThietbiManager />;
};

export default thietbisPage;
