import "./globals.css";

export const metadata = {
  title: "Mini CRM",
  description: "Frontend-only CRM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}