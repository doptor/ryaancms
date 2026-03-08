import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardOverview from "./pages/DashboardOverview";
import AIBuilderPage from "./pages/AIBuilderPage";
import MarketplacePage from "./pages/MarketplacePage";
import PluginDetailPage from "./pages/PluginDetailPage";

import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import DocumentationPage from "./pages/DocumentationPage";
import MenuBuilderPage from "./pages/MenuBuilderPage";
import BuildAnalyticsPage from "./pages/BuildAnalyticsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import PreviewPage from "./pages/PreviewPage";
import PluginApprovalsPage from "./pages/PluginApprovalsPage";
import FinanceDashboardPage from "./pages/FinanceDashboardPage";
import DeveloperKeysPage from "./pages/DeveloperKeysPage";
import AccountingSRSPage from "./pages/AccountingSRSPage";
import AccountingDashboardPage from "./pages/accounting/AccountingDashboardPage";
import ChartOfAccountsPage from "./pages/accounting/ChartOfAccountsPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isOnline, isSyncing, pendingCount } = useOnlineStatus();
  return (
    <>
      <OfflineIndicator isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingCount} />
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/docs" element={<DocumentationPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
        <Route path="/dashboard/ai" element={<ProtectedRoute><AIBuilderPage /></ProtectedRoute>} />
        <Route path="/dashboard/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
        <Route path="/dashboard/marketplace/:slug" element={<ProtectedRoute><PluginDetailPage /></ProtectedRoute>} />
        <Route path="/dashboard/installer" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/dashboard/menus" element={<ProtectedRoute><MenuBuilderPage /></ProtectedRoute>} />
        <Route path="/dashboard/analytics" element={<ProtectedRoute><BuildAnalyticsPage /></ProtectedRoute>} />
        <Route path="/dashboard/approvals" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
        <Route path="/dashboard/plugin-approvals" element={<ProtectedRoute><PluginApprovalsPage /></ProtectedRoute>} />
        <Route path="/dashboard/finance" element={<ProtectedRoute><FinanceDashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/developer-keys" element={<ProtectedRoute><DeveloperKeysPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting-srs" element={<ProtectedRoute><AccountingSRSPage /></ProtectedRoute>} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BrandingProvider>
            <AppContent />
          </BrandingProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
