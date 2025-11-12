import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import Spinner from './components/Spinner'; // Import Spinner
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import NewVisitPage from './pages/NewVisitPage';
import ReportsPage from './pages/ReportsPage';
import ProductStockReportPage from './pages/ProductStockReportPage'; // 1. Import halaman baru
import SalesPerformanceReportPage from './pages/SalesPerformanceReportPage'; // 1. Import halaman baru
import RouteReportPage from './pages/RouteReportPage';
import ReceiptPage from './pages/ReceiptPage';
import AddCustomerPage from './pages/AddCustomerPage';
import EditCustomerPage from './pages/EditCustomerPage';
import LoginPage from './pages/LoginPage'; // Import Login Page
import RegisterPage from './pages/RegisterPage'; // Import Register Page
import ProfilePage from './pages/ProfilePage'; // Import Profile Page
import EditProductPage from './pages/EditProductPage'; // 1. Import halaman edit produk
import AddProductPage from './pages/AddProductPage'; // 1. Import halaman tambah produk
import ProductsPage from './pages/ProductsPage'; // 1. Import halaman produk
import VisitDetailPage from './pages/VisitDetailPage';
import AddUserPage from './pages/AddUserPage'; // 1. Import halaman baru
import EditUserPage from './pages/EditUserPage'; // 1. Import halaman baru
import UserManagementPage from './pages/UserManagementPage'; // 1. Import halaman baru
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // NEW
import ResetPasswordPage from './pages/ResetPasswordPage'; // NEW
import AdminSettingsPage from './pages/AdminSettingsPage'; // NEW: Import settings page
import setupAxiosInterceptors from './utils/axiosInterceptor'; // NEW: Import interceptor

// Komponen untuk menangani logika logout dan setup interceptor
const InterceptorSetup = () => {
  const { logout } = useAuth(); // Gunakan fungsi logout dari context

  const handleLogout = () => {
    logout();
  };

  setupAxiosInterceptors(handleLogout);
  return null; // Komponen ini tidak me-render apapun
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <InterceptorSetup />
          <Toaster position="top-center" reverseOrder={false} />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
            <Route path="/customers/edit/:customerId" element={<ProtectedRoute><EditCustomerPage /></ProtectedRoute>} />
            <Route path="/customers/new" element={<ProtectedRoute><AddCustomerPage /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
            <Route path="/products/new" element={<ProtectedRoute><AddProductPage /></ProtectedRoute>} />
            <Route path="/products/edit/:productId" element={<ProtectedRoute><EditProductPage /></ProtectedRoute>} />
            <Route path="/receipt/:visitId" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
            <Route path="/new-visit" element={<ProtectedRoute><NewVisitPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/reports/route" element={<ProtectedRoute><RouteReportPage /></ProtectedRoute>} />
            <Route path="/reports/sales-performance" element={<ProtectedRoute><SalesPerformanceReportPage /></ProtectedRoute>} />
            <Route path="/reports/product-stock" element={<ProtectedRoute><ProductStockReportPage /></ProtectedRoute>} />
            <Route path="/visit/:customerId" element={<ProtectedRoute><VisitDetailPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
            <Route path="/users/new" element={<ProtectedRoute><AddUserPage /></ProtectedRoute>} />
            <Route path="/users/edit/:userId" element={<ProtectedRoute><EditUserPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AdminSettingsPage /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

// Simple Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <Spinner />; // Atau komponen loading lainnya
  }
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default App;