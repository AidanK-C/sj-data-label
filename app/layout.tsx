import { ClerkProvider } from '@clerk/nextjs';
import './globals.css'; // Import Tailwind CSS

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="min-h-full antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}