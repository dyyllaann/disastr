import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppShell from "./components/AppShell";

const MapPage = lazy(() => import("./pages/MapPage"));
const GuidancePage = lazy(() => import("./pages/GuidancePage"));
const OptInPage = lazy(() => import("./pages/OptInPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center" aria-live="polite">
      <span className="text-sm text-gray-500">Loading…</span>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <MapPage />
          </Suspense>
        ),
      },
      {
        path: "guidance",
        element: (
          <Suspense fallback={<PageLoader />}>
            <GuidancePage />
          </Suspense>
        ),
      },
      {
        path: "alerts",
        element: (
          <Suspense fallback={<PageLoader />}>
            <OptInPage />
          </Suspense>
        ),
      },
      {
        path: "report",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReportPage />
          </Suspense>
        ),
      },
      {
        path: "admin",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminPage />
          </Suspense>
        ),
      },
    ],
  },
]);
