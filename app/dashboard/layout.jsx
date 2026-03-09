// app/dashboard/layout.jsx
import Sidebar from '@/components/dashboard/sidebar/Sidebar';
import RoleGuard from '@/components/auth/RoleGuard';
import Footer from '@/components/layouts/Footer';
import Header from '@/components/layouts/Header';
import GlobalAddVariantModal from '@/components/vendor/GlobalAddVariantModal';

export const metadata = {
  title: 'Dashboard - arcmat',
  description: 'Manage your projects and boards',
};

export default function DashboardLayout({ children }) {
  return (
    <RoleGuard allowedRoles={['brand', 'professional', 'customer', 'architect', 'admin', 'retailer']}>
      <div className="flex flex-col min-h-screen bg-white">
        {/* Header: Explicitly set variant to 'dashboard' */}
        <Header variant="dashboard" />

        {/* Main Content Area */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
            <div className="flex-1">
              {children}
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />
        <GlobalAddVariantModal />
      </div>
    </RoleGuard>
  );
}