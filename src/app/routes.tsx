import { createBrowserRouter } from "react-router";
import RootLayout from "./layouts/RootLayout";
import BuyerLayout from "./layouts/BuyerLayout";
import AdminLayout from "./layouts/AdminLayout";

// Public Pages
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import PlanDetails from "./pages/PlanDetails";
import CustomDesignRequest from "./pages/CustomDesignRequest";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";

// Buyer Dashboard Pages
import BuyerDashboard from "./pages/buyer/Dashboard";
import PurchasedPlans from "./pages/buyer/PurchasedPlans";
import CustomRequests from "./pages/buyer/CustomRequests";
import BuyerProfile from "./pages/buyer/Profile";

// Admin Dashboard Pages
import AdminDashboard from "./pages/admin/Dashboard";
import ManagePlans from "./pages/admin/ManagePlans";
import AddPlan from "./pages/admin/AddPlan";
import OrdersManagement from "./pages/admin/OrdersManagement";
import AdminCustomRequests from "./pages/admin/CustomRequests";
import UsersManagement from "./pages/admin/UsersManagement";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "catalog", Component: Catalog },
      { path: "plan/:id", Component: PlanDetails },
      { path: "custom-design", Component: CustomDesignRequest },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "checkout/:id", Component: Checkout },
    ],
  },
  {
    path: "/dashboard",
    Component: BuyerLayout,
    children: [
      { index: true, Component: BuyerDashboard },
      { path: "purchased", Component: PurchasedPlans },
      { path: "custom-requests", Component: CustomRequests },
      { path: "profile", Component: BuyerProfile },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "plans", Component: ManagePlans },
      { path: "plans/add", Component: AddPlan },
      { path: "orders", Component: OrdersManagement },
      { path: "custom-requests", Component: AdminCustomRequests },
      { path: "users", Component: UsersManagement },
    ],
  },
]);
