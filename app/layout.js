export const metadata = {
  title: "Aarohi Veg Restaurant | AI Review Generator",
  description: "Share your experience at Aarohi Veg Restaurant, Daryaganj, New Delhi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=Jost:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f4e8c8" }}>
        {children}
      </body>
    </html>
  );
}
