import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Live Support System',
  description: 'Member live support, standalone service.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
