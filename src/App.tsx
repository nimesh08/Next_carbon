  import { Route, Routes, useLocation } from "react-router-dom";
  import Home from "./pages/Home";
  import TopBanner from "./components/custom/TopBanner";
  import Navbar from "./components/custom/Navbar";
  import { Toaster } from "@/components/ui/sonner";
  import { Dashboard } from "./pages/Dashboard";
  import Login from "./pages/Login";
  import Signup from "./pages/Signup";
  import AllProducts from "./components/custom/dashboard/pages/AllProducts";
  import AuthMiddleware from "./components/custom/auth/AuthMiddleware";
  import PropertyView from "./pages/PropertyView";
  import Portfolio from "./components/custom/dashboard/pages/Portfolio";
  import TokenPortfolio from "./components/custom/dashboard/pages/TokenPortfolio";
  import Pool from "./components/custom/dashboard/pages/Pool";
  import CreditPurchasePage from "./pages/offset";
  import Transaction_History from "./components/custom/dashboard/pages/Transaction_History";
  import ProjectStatus from "./pages/project.status";
  import ForgotPassword from "./pages/forgot-password";
  import { UpdatePasswordForm } from "./pages/update-password";
  import Admin from "./Admin";
  import AdminMiddleware from "./components/custom/auth/AdminMiddleware";
  import Users from "./Admin/allUsers";
  import { ProjectsTable } from "@/components/ProjectsTable"; 
  import CreatePropertyForm from "./Admin/createProperty/createProperty";
import { KycProvider } from "./hooks/KycContext";
import { useAuth } from "./hooks/AuthContext";
import ManageProperty from "./Admin/manageProperty/manage.property";
import MaturityManagement from "./Admin/MaturityManagement";

  function App() {
    const location = useLocation();
    const isDashboardPage = location.pathname.startsWith("/dashboard");
    const isAdminPage = location.pathname.startsWith("/admin");
    const { user } = useAuth();

    return (
      <KycProvider user={user}>
      <div className="min-h-screen overflow-x-hidden relative">
        {/* Conditionally hide TopBanner & Navbar on Dashboard/Admin */}
        {!isDashboardPage && !isAdminPage && <TopBanner />}
        {!isDashboardPage && !isAdminPage && <Navbar />}

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePasswordForm />} />
          <Route path="/property/view/:id" element={<PropertyView />} />
          <Route path="/property/view/:id/status" element={<ProjectStatus />} />

          {/* Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <Dashboard>
                <AllProducts />
              </Dashboard>
            }
          />
          <Route
            path="/dashboard/portfolio"
            element={
              <AuthMiddleware>
                <Dashboard>
                  <Portfolio />
                </Dashboard>
              </AuthMiddleware>
            }
          />
          <Route
            path="/dashboard/history"
            element={
              <AuthMiddleware>
                <Dashboard>
                  <Transaction_History />
                </Dashboard>
              </AuthMiddleware>
            }
          />
          <Route
            path="/offset"
            element={
              <AuthMiddleware>
                <Dashboard>
                  <CreditPurchasePage />
                </Dashboard>
              </AuthMiddleware>
            }
          />
          <Route
            path="/dashboard/tokens"
            element={
              <AuthMiddleware>
                <Dashboard>
                  <TokenPortfolio />
                </Dashboard>
              </AuthMiddleware>
            }
          />
          <Route
            path="/dashboard/pool"
            element={
              <AuthMiddleware>
                <Dashboard>
                  <Pool />
                </Dashboard>
              </AuthMiddleware>
            }
          />

          {/* Admin Routes */}

          <Route
            path="/admin/create"
            element={
              <AdminMiddleware>
                <Admin>
                  <CreatePropertyForm />
                </Admin>
              </AdminMiddleware>
            }
          />

          <Route
            path="/admin/manage"
            element={
              <AdminMiddleware>
                <Admin>
                  <ManageProperty />
                </Admin>
              </AdminMiddleware>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminMiddleware>
                <Admin>
                  <ProjectsTable />
                </Admin>
              </AdminMiddleware>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminMiddleware>
                <Admin>
                  <Users />
                </Admin>
              </AdminMiddleware>
            }
          />
          <Route
            path="/admin/maturity"
            element={
              <AdminMiddleware>
                <Admin>
                  <MaturityManagement />
                </Admin>
              </AdminMiddleware>
            }
          />
        </Routes>

        <Toaster richColors />
      </div>
      </KycProvider>
    );
  }

  export default App;
