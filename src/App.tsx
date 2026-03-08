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
import IncomeListPage from "./pages/accounting/IncomeListPage";
import ExpenseListPage from "./pages/accounting/ExpenseListPage";
import InvoiceListPage from "./pages/accounting/InvoiceListPage";
import PaymentListPage from "./pages/accounting/PaymentListPage";
import ProfitLossPage from "./pages/accounting/ProfitLossPage";
import BalanceSheetPage from "./pages/accounting/BalanceSheetPage";
import CashFlowPage from "./pages/accounting/CashFlowPage";
import VendorListPage from "./pages/accounting/VendorListPage";
import CustomerListPage from "./pages/accounting/CustomerListPage";
import CRMDashboardPage from "./pages/crm/CRMDashboardPage";
import CRMLeadsPage from "./pages/crm/CRMLeadsPage";
import CRMContactsPage from "./pages/crm/CRMContactsPage";
import CRMCompaniesPage from "./pages/crm/CRMCompaniesPage";
import CRMDealsPage from "./pages/crm/CRMDealsPage";
import CRMActivitiesPage from "./pages/crm/CRMActivitiesPage";
import CRMCampaignsPage from "./pages/crm/CRMCampaignsPage";
import CRMTicketsPage from "./pages/crm/CRMTicketsPage";
import CRMReportsPage from "./pages/crm/CRMReportsPage";
import CRMPipelinePage from "./pages/crm/CRMPipelinePage";
import CRMAIAssistantPage from "./pages/crm/CRMAIAssistantPage";
import CRMEmailsPage from "./pages/crm/CRMEmailsPage";
import HRDashboardPage from "./pages/hr/HRDashboardPage";
import HREmployeesPage from "./pages/hr/HREmployeesPage";
import HRDepartmentsPage from "./pages/hr/HRDepartmentsPage";
import HRAttendancePage from "./pages/hr/HRAttendancePage";
import HRLeavePage from "./pages/hr/HRLeavePage";
import HRHolidaysPage from "./pages/hr/HRHolidaysPage";
import HRPayrollPage from "./pages/hr/HRPayrollPage";
import HRRecruitmentPage from "./pages/hr/HRRecruitmentPage";
import HRApplicantsPage from "./pages/hr/HRApplicantsPage";
import HRPerformancePage from "./pages/hr/HRPerformancePage";
import HRTrainingPage from "./pages/hr/HRTrainingPage";
import HRShiftsPage from "./pages/hr/HRShiftsPage";
import HROnboardingPage from "./pages/hr/HROnboardingPage";
import CommDashboardPage from "./pages/comm/CommDashboardPage";
import CommContactsPage from "./pages/comm/CommContactsPage";
import CommCallsPage from "./pages/comm/CommCallsPage";
import CommWhatsAppPage from "./pages/comm/CommWhatsAppPage";
import CommCampaignsPage from "./pages/comm/CommCampaignsPage";
import CommScriptsPage from "./pages/comm/CommScriptsPage";
import CommCallCenterPage from "./pages/comm/CommCallCenterPage";
import CommAgentsPage from "./pages/comm/CommAgentsPage";
import CommReportsPage from "./pages/comm/CommReportsPage";
import CommSettingsPage from "./pages/comm/CommSettingsPage";
import CommIVRPage from "./pages/comm/CommIVRPage";
import CommNotificationsPage from "./pages/comm/CommNotificationsPage";
import EducaDashboardPage from "./pages/educa/EducaDashboardPage";
import EducaStudentsPage from "./pages/educa/EducaStudentsPage";
import EducaAgentsPage from "./pages/educa/EducaAgentsPage";
import EducaCounsellorsPage from "./pages/educa/EducaCounsellorsPage";
import EducaUniversitiesPage from "./pages/educa/EducaUniversitiesPage";
import EducaCoursesPage from "./pages/educa/EducaCoursesPage";
import EducaApplicationsPage from "./pages/educa/EducaApplicationsPage";
import EducaVisaPage from "./pages/educa/EducaVisaPage";
import EducaCommissionsPage from "./pages/educa/EducaCommissionsPage";
import EducaScholarshipsPage from "./pages/educa/EducaScholarshipsPage";
import EducaLeadsPage from "./pages/educa/EducaLeadsPage";
import EducaReportsPage from "./pages/educa/EducaReportsPage";
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
        <Route path="/dashboard/accounting" element={<ProtectedRoute><AccountingDashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting/accounts" element={<ProtectedRoute><ChartOfAccountsPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting/income" element={<ProtectedRoute><IncomeListPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting/expenses" element={<ProtectedRoute><ExpenseListPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting/invoices" element={<ProtectedRoute><InvoiceListPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting/payments" element={<ProtectedRoute><PaymentListPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting/profit-loss" element={<ProtectedRoute><ProfitLossPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting/balance-sheet" element={<ProtectedRoute><BalanceSheetPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting/cash-flow" element={<ProtectedRoute><CashFlowPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting/vendors" element={<ProtectedRoute><VendorListPage /></ProtectedRoute>} />
        <Route path="/dashboard/accounting/customers" element={<ProtectedRoute><CustomerListPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm" element={<ProtectedRoute><CRMDashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/leads" element={<ProtectedRoute><CRMLeadsPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/contacts" element={<ProtectedRoute><CRMContactsPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/companies" element={<ProtectedRoute><CRMCompaniesPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/deals" element={<ProtectedRoute><CRMDealsPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/activities" element={<ProtectedRoute><CRMActivitiesPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/campaigns" element={<ProtectedRoute><CRMCampaignsPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/tickets" element={<ProtectedRoute><CRMTicketsPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/reports" element={<ProtectedRoute><CRMReportsPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/pipeline" element={<ProtectedRoute><CRMPipelinePage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/ai-assistant" element={<ProtectedRoute><CRMAIAssistantPage /></ProtectedRoute>} />
        <Route path="/dashboard/crm/emails" element={<ProtectedRoute><CRMEmailsPage /></ProtectedRoute>} />
        <Route path="/dashboard/hr" element={<ProtectedRoute><HRDashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/employees" element={<ProtectedRoute><HREmployeesPage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/departments" element={<ProtectedRoute><HRDepartmentsPage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/attendance" element={<ProtectedRoute><HRAttendancePage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/leave" element={<ProtectedRoute><HRLeavePage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/holidays" element={<ProtectedRoute><HRHolidaysPage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/payroll" element={<ProtectedRoute><HRPayrollPage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/recruitment" element={<ProtectedRoute><HRRecruitmentPage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/applicants" element={<ProtectedRoute><HRApplicantsPage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/performance" element={<ProtectedRoute><HRPerformancePage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/training" element={<ProtectedRoute><HRTrainingPage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/shifts" element={<ProtectedRoute><HRShiftsPage /></ProtectedRoute>} />
        <Route path="/dashboard/hr/onboarding" element={<ProtectedRoute><HROnboardingPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm" element={<ProtectedRoute><CommDashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/contacts" element={<ProtectedRoute><CommContactsPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/calls" element={<ProtectedRoute><CommCallsPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/whatsapp" element={<ProtectedRoute><CommWhatsAppPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/campaigns" element={<ProtectedRoute><CommCampaignsPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/scripts" element={<ProtectedRoute><CommScriptsPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/call-center" element={<ProtectedRoute><CommCallCenterPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/agents" element={<ProtectedRoute><CommAgentsPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/reports" element={<ProtectedRoute><CommReportsPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/settings" element={<ProtectedRoute><CommSettingsPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/ivr" element={<ProtectedRoute><CommIVRPage /></ProtectedRoute>} />
        <Route path="/dashboard/comm/notifications" element={<ProtectedRoute><CommNotificationsPage /></ProtectedRoute>} />
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
