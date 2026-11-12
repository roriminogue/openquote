import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Suspense, useEffect } from "react";
import { Navigate, Outlet, ScrollRestoration, createBrowserRouter, useNavigate, useRouteError } from "react-router";
import ClientPage from "@/app/clients/[id]/page";
import ClientsPage from "@/app/clients/page";
import EstimatePage from "@/app/estimates/[id]/page";
import EditEstimatePage from "@/app/estimates/[id]/edit/page";
import NewEstimatePage from "@/app/estimates/new/page";
import EstimatesPage from "@/app/estimates/page";
import OnboardingPage from "@/app/onboarding/page";
import ProjectPage from "@/app/projects/[id]/page";
import ProjectsPage from "@/app/projects/page";
import AccountPage from "@/app/settings/account/page";
import AiSettingsPage from "@/app/settings/ai/page";
import BusinessPage from "@/app/settings/business/page";
import SettingsLayout from "@/app/settings/layout";
import RatesPage from "@/app/settings/rates/page";
import { AppShell } from "@/components/app-shell";
import { getMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { NotFoundError, RedirectError, registerNavigator } from "@/lib/navigation";

// Every screen in the app. Paths are the same as the web version's, so links inside the screens didn't change.

function Root() {
  const navigate = useNavigate();
  useEffect(() => {
    registerNavigator((to, opts) => void navigate(to, opts));
    return () => registerNavigator(null);
  }, [navigate]);
  return (
    <>
      <ScrollRestoration />
      <Suspense>
        <Outlet />
      </Suspense>
    </>
  );
}

/** The signed-in frame. Before the business is set up, everything goes to onboarding. */
function SignedIn() {
  const member = useQuery("member", getMember);
  if (!member) return <Navigate to="/onboarding" replace />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export function NotFound() {
  return (
    <div className="flex max-w-md flex-col gap-3 pt-6">
      <Heading level={1}>Not found</Heading>
      <Text as="p" color="secondary">
        It may have been deleted.
      </Text>
      <div className="mt-2">
        <Button label="Go to estimates" variant="secondary" href="/estimates" />
      </div>
    </div>
  );
}

function RouteError() {
  const error = useRouteError();
  if (error instanceof RedirectError) return <Navigate to={error.to} replace />;
  if (error instanceof NotFoundError) return <NotFound />;
  console.error(error);
  return (
    <div className="flex max-w-md flex-col gap-3 pt-6">
      <Heading level={1}>Something went wrong</Heading>
      <Text as="p" color="secondary">
        {error instanceof Error ? error.message : "This screen couldn't load."} Your data is safe.
      </Text>
      <div className="mt-2">
        <Button label="Try again" variant="secondary" onClick={() => location.reload()} />
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <Navigate to="/estimates" replace /> },
      { path: "/onboarding", element: <OnboardingPage /> },
      {
        element: <SignedIn />,
        children: [
          {
            errorElement: <RouteError />,
            children: [
              { path: "/estimates", element: <EstimatesPage /> },
              { path: "/estimates/new", element: <NewEstimatePage /> },
              { path: "/estimates/:id", element: <EstimatePage /> },
              { path: "/estimates/:id/edit", element: <EditEstimatePage /> },
              { path: "/projects", element: <ProjectsPage /> },
              { path: "/projects/:id", element: <ProjectPage /> },
              { path: "/clients", element: <ClientsPage /> },
              { path: "/clients/:id", element: <ClientPage /> },
              {
                path: "/settings",
                element: <SettingsLayout />,
                children: [
                  { index: true, element: <Navigate to="/settings/business" replace /> },
                  { path: "business", element: <BusinessPage /> },
                  { path: "rates", element: <RatesPage /> },
                  { path: "ai", element: <AiSettingsPage /> },
                  { path: "account", element: <AccountPage /> },
                ],
              },
              { path: "*", element: <NotFound /> },
            ],
          },
        ],
      },
    ],
  },
]);
