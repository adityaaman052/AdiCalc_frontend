import type { Metadata } from "next";
import "./globals.css";
import { MantineProvider } from "@mantine/core";

export const metadata: Metadata = {
  title: "Canvas Drawing App",
  description: "A simple canvas-based drawing application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
