import { Suspense, lazy, type ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import RootLayout from "./layouts/RootLayout";
import BuyerLayout from "./layouts/BuyerLayout";
import AdminLayout from "./layouts/AdminLayout";
import { AdminOnlyRoute, BuyerOnlyRoute } from "@/shared/auth/ProtectedRoute";

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
    <div className="text-sm">Loading...</div>
  </div>
);

function withSuspense<T extends ComponentType<any>>(importer: () => Promise<{ default: T }>) {
  const LazyComponent = lazy(importer);

  return function LazyRouteComponent(props: any) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Public Pages
const HomePage = withSuspense(() => import("@/features/public/pages/HomePage"));
const CatalogPage = withSuspense(() => import("@/features/public/pages/CatalogPage"));
const PlanDetailsPage = withSuspense(() => import("@/features/public/pages/PlanDetailsPage"));
const CustomDesignRequestPage = withSuspense(() => import("@/features/public/pages/CustomDesignRequestPage"));
const CheckoutPage = withSuspense(() => import("@/features/public/pages/CheckoutPage"));
const PaymentStatusPage = withSuspense(() => import("@/features/public/pages/PaymentStatusPage"));

// Auth Pages
const LoginPage = withSuspense(() => import("@/features/auth/pages/LoginPage"));
const RegisterPage = withSuspense(() => import("@/features/auth/pages/RegisterPage"));
const AdminLoginPage = withSuspense(() => import("@/features/auth/pages/AdminLoginPage"));

// Buyer Dashboard Pages
const BuyerDashboardPage = withSuspense(() => import("@/features/buyer/pages/BuyerDashboardPage"));
const PurchasedPlansPage = withSuspense(() => import("@/features/buyer/pages/PurchasedPlansPage"));
const BuyerCustomRequestsPage = withSuspense(() => import("@/features/buyer/pages/BuyerCustomRequestsPage"));
const BuyerProfilePage = withSuspense(() => import("@/features/buyer/pages/BuyerProfilePage"));

// Admin Dashboard Pages
const AdminDashboardPage = withSuspense(() => import("@/features/admin/pages/AdminDashboardPage"));
const ManagePlansPage = withSuspense(() => import("@/features/admin/pages/ManagePlansPage"));
const AddPlanPage = withSuspense(() => import("@/features/admin/pages/AddPlanPage"));
const EditPlanPage = withSuspense(() => import("@/features/admin/pages/EditPlanPage"));
const OrdersManagementPage = withSuspense(() => import("@/features/admin/pages/OrdersManagementPage"));
const OrderDetailsPage = withSuspense(() => import("@/features/admin/pages/OrderDetailsPage"));
const AdminCustomRequestsPage = withSuspense(() => import("@/features/admin/pages/AdminCustomRequestsPage"));
const CustomRequestDetailsPage = withSuspense(() => import("@/features/admin/pages/CustomRequestDetailsPage"));
const UsersManagementPage = withSuspense(() => import("@/features/admin/pages/UsersManagementPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "catalog", Component: CatalogPage },
      { path: "plan/:id", Component: PlanDetailsPage },
      { path: "custom-design", Component: CustomDesignRequestPage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "admin/login", Component: AdminLoginPage },
      { path: "checkout/:id", Component: CheckoutPage },
      { path: "payment/success", Component: PaymentStatusPage },
      { path: "payment/cancel", Component: PaymentStatusPage },
    ],
  },
  {
    path: "/dashboard",
    Component: BuyerOnlyRoute,
    children: [
      {
        Component: BuyerLayout,
        children: [
          { index: true, Component: BuyerDashboardPage },
          { path: "purchased", Component: PurchasedPlansPage },
          { path: "custom-requests", Component: BuyerCustomRequestsPage },
          { path: "profile", Component: BuyerProfilePage },
        ],
      },
    ]
  },
  {
    path: "/admin",
    Component: AdminOnlyRoute,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboardPage },
          { path: "plans", Component: ManagePlansPage },
          { path: "plans/add", Component: AddPlanPage },
          { path: "plans/:id/edit", Component: EditPlanPage },
          { path: "orders", Component: OrdersManagementPage },
          { path: "orders/:id", Component: OrderDetailsPage },
          { path: "custom-requests", Component: AdminCustomRequestsPage },
          { path: "custom-requests/:id", Component: CustomRequestDetailsPage },
          { path: "users", Component: UsersManagementPage },
        ],
      },
    ]
  },
]);
