import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useRef } from "react";

import { ClerkProvider, useUser } from "@clerk/tanstack-react-start";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";
import Crosshair from "#/components/Crosshair";
import Navbar from "#/components/Navbar";

interface MyRouterContext {
  queryClient: QueryClient;
}

const posthogProjectToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

if (typeof window !== "undefined") {
  if (!posthogProjectToken) {
    if (import.meta.env.DEV) {
      throw new Error(
        "VITE_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
      );
    }
  } else if (!posthogHost) {
    if (import.meta.env.DEV) {
      throw new Error(
        "VITE_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_PUBLIC_POSTHOG_HOST is configured",
      );
    }
  } else {
    posthog.init(posthogProjectToken, {
      api_host: posthogHost,
      defaults: "2025-05-24",
      capture_exceptions: true,
    });
  }
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Skild - The Registry for Agentic Intelligence",
      },
      {
        name: "description",
        content:
          "Discover, publish, and operate reusable agent capabilities from a route-driven workspace.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere dark">
        <PostHogProvider client={posthog}>
          <ClerkProvider>
            <PostHogIdentify>{children}</PostHogIdentify>
          </ClerkProvider>
        </PostHogProvider>
        <Scripts />
      </body>
    </html>
  );
}

function PostHogIdentify({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      if (identifiedUserId.current === user.id) return;

      if (identifiedUserId.current) {
        posthog.reset();
      }

      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? undefined,
      });
      identifiedUserId.current = user.id;
      return;
    }

    if (identifiedUserId.current) {
      posthog.reset();
      identifiedUserId.current = null;
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <>
      <div id="root-layout">
        <header>
          <div className="frame">
            <Navbar />
            <Crosshair />
            <Crosshair />
          </div>
        </header>

        <main>
          <div className="frame">{children}</div>
        </main>
      </div>

      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  );
}
