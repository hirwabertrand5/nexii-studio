import { createBrowserRouter } from "react-router";
import RootLayout from "./layouts/RootLayout";
import BuyerLayout from "./layouts/BuyerLayout";
import AdminLayout from "./layouts/AdminLayout";
import { AdminOnlyRoute, BuyerOnlyRoute } from "@/shared/auth/ProtectedRoute";

// Public Pages
import HomePage from "@/features/public/pages/HomePage";
import CatalogPage from "@/features/public/pages/CatalogPage";
import PlanDetailsPage from "@/features/public/pages/PlanDetailsPage";
import CustomDesignRequestPage from "@/features/public/pages/CustomDesignRequestPage";
import CheckoutPage from "@/features/public/pages/CheckoutPage";

// Auth Pages
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import AdminLoginPage from "@/features/auth/pages/AdminLoginPage";

// Buyer Dashboard Pages
import BuyerDashboardPage from "@/features/buyer/pages/BuyerDashboardPage";
import PurchasedPlansPage from "@/features/buyer/pages/PurchasedPlansPage";
import BuyerCustomRequestsPage from "@/features/buyer/pages/BuyerCustomRequestsPage";
import BuyerProfilePage from "@/features/buyer/pages/BuyerProfilePage";

// Admin Dashboard Pages
import AdminDashboardPage from "@/features/admin/pages/AdminDashboardPage";
import ManagePlansPage from "@/features/admin/pages/ManagePlansPage";
import AddPlanPage from "@/features/admin/pages/AddPlanPage";
import EditPlanPage from "@/features/admin/pages/EditPlanPage";
import OrdersManagementPage from "@/features/admin/pages/OrdersManagementPage";
import OrderDetailsPage from "@/features/admin/pages/OrderDetailsPage";
import AdminCustomRequestsPage from "@/features/admin/pages/AdminCustomRequestsPage";
import CustomRequestDetailsPage from "@/features/admin/pages/CustomRequestDetailsPage";
import UsersManagementPage from "@/features/admin/pages/UsersManagementPage";

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
