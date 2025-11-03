export const metadata = { title: 'Numerix Pro', description: 'Numerology & Vastu' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
