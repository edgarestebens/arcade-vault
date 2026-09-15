import type { Metadata } from "next";
import { Courier_Prime, JetBrains_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "./components/Nav";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arcade Vault · Portal Retro",
  description: "Portal retro de juegos arcade",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${pressStart.variable} ${jetbrainsMono.variable} ${courierPrime.variable} h-full antialiased`}
    >
      <body>
        <div className="av-bg" aria-hidden="true" />
        <div className="av-noise" aria-hidden="true" />
        <div className="av-app">
          <Providers>
            <Nav />
            <main className="av-main">{children}</main>
            <footer style={{ textAlign: 'center', padding: '24px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-faint)', borderTop: '1px solid var(--line)' }}>
              © 2026 ARCADE VAULT
            </footer>
          </Providers>
        </div>
      </body>
    </html>
  );
}
