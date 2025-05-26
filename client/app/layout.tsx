// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { AuthProvider } from "./contexts/AuthContext";
import { BackendProvider } from "./contexts/BackendContext";
import { Notifications } from "@mantine/notifications";

export const metadata = {
  title: "Backend challenge",
  description: "Same client but different backend servers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <BackendProvider>
            <AuthProvider>{children}</AuthProvider>
          </BackendProvider>
          <Notifications />
        </MantineProvider>
      </body>
    </html>
  );
}
