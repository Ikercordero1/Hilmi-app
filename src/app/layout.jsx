// app/layout.jsx
import { Vollkorn } from "next/font/google";
import "./globals.css";


export const vollkorn = Vollkorn({
  subsets: ["latin"],
  variable: "--font-vollkorn",
  weight: ["400", "700"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={vollkorn.variable}
        style={{ fontFamily: "var(--font-vollkorn)" }}
      >
       
        {children}
      </body>
    </html>
  );
}
