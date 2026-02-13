import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardOverview from "./pages/DashboardOverview";
import SchemaPage from "./pages/SchemaPage";
import AIBuilderPage from "./pages/AIBuilderPage";
import MarketplacePage from "./pages/MarketplacePage";
import PluginsPage from "./pages/PluginsPage";
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
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/dashboard/schema" element={<SchemaPage />} />
          <Route path="/dashboard/ai" element={<AIBuilderPage />} />
          <Route path="/dashboard/ai-integrations" element={<AIIntegrationPage />} />
          <Route path="/dashboard/marketplace" element={<MarketplacePage />} />
          <Route path="/dashboard/installer" element={<InstallerPage />} />
          <Route path="/dashboard/plugins" element={<PluginsPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
