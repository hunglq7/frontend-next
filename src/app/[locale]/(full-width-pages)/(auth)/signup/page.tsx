import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý thiết bị",
  description: "Phần mềm quản lý thiêt bị",
};

export default function SignUp() {
  return <SignUpForm />;
}
