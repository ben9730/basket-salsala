import type { Metadata, Viewport } from 'next';
import { Heebo, Varela_Round } from 'next/font/google';
import './globals.css';

// Body — Heebo (Hebrew + Latin). Reference uses Nunito Sans, but it has
// no Hebrew subset; Heebo is the closest clean-sans Hebrew equivalent.
const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

// Display — Varela Round (Hebrew + Latin), matches reference rounded headings.
const varelaRound = Varela_Round({
  subsets: ['hebrew', 'latin'],
  variable: '--font-varela-round',
  weight: '400',
  display: 'swap',
});

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || 'Salsala';

export const metadata: Metadata = {
  title: businessName,
  description: `הזמנות מ${businessName}`,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f0f7ff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${varelaRound.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
