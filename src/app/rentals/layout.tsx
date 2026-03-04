import { AuthGuard } from "@/components/auth/auth-guard";

export default function RentalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
