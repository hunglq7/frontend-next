import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý thiết bị",
  description: "Phần mềm quản lý thiêt bị",
};

export default function SignIn() {
  return <SignInForm />;
}
