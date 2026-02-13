import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardOverview from "./pages/DashboardOverview";
import SchemaPage from "./pages/SchemaPage";
import AIBuilderPage from "./pages/AIBuilderPage";
import MarketplacePage from "./pages/MarketplacePage";

import InstallerPage from "./pages/InstallerPage";
import SettingsPage from "./pages/SettingsPage";
import AIIntegrationPage from "./pages/AIIntegrationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BrandingProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
              <Route path="/dashboard/schema" element={<ProtectedRoute><SchemaPage /></ProtectedRoute>} />
              <Route path="/dashboard/ai" element={<ProtectedRoute><AIBuilderPage /></ProtectedRoute>} />
              <Route path="/dashboard/ai-integrations" element={<ProtectedRoute><AIIntegrationPage /></ProtectedRoute>} />
              <Route path="/dashboard/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
              <Route path="/dashboard/installer" element={<ProtectedRoute><InstallerPage /></ProtectedRoute>} />
              
              <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrandingProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
