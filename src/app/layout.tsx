import type { Metadata } from 'next';
import './globals.css';
import MuiProvider from '@/theme/MuiProvider';

export const metadata: Metadata = {
  title: 'MAOP — Multi-Agent Orchestration Platform',
  description:
    'Setup, visualize, and monitor AI agents interacting in real-time with 3D visualization.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  );
}
