import "./globals.css";
import { DM_Sans } from "next/font/google";
import Splash from "../components/Splash";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata = { title: "KIRA", manifest: "/manifest.webmanifest" };
export const viewport = { themeColor: "#f9f9f9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <Splash />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
      </body>
    </html>
  );
}
