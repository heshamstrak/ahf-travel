import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create Account", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return <RegisterForm />;
}
