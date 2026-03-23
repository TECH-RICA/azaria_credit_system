import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import AdminOverview from './AdminOverview';
import AdminManagers from './AdminManagers';
import AdminOfficers from './AdminOfficers';
import AdminCustomers from './AdminCustomers';
import AdminAccounts from './AdminAccounts';
import AdminAuditLogs from './AdminAuditLogs';
import AdminDeactivations from './AdminDeactivations';
import AdminLoans from './AdminLoans';
import AdminSettings from './AdminSettings';
import BranchManagement from './BranchManagement';
import CustomerCommunicator from './CustomerCommunicator';
import OfficialCommunicator from './OfficialCommunicator';
import ProfileSettings from '../pages/ProfileSettings';
import SuperAdminPage from './SuperAdminPage';
import SecurityLogsPage from './SecurityLogsPage';
import SecurityThreatsPage from './SecurityThreatsPage';
import OwnerAuditPage from './owner/OwnerAuditPage';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

const AdminDashboard = () => {
  const location = useLocation();
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();

  const effectiveRole = activeRole || user?.role;
  const isOwner = user?.is_owner || effectiveRole === 'OWNER';
  const isSuperAdmin = user?.is_super_admin || effectiveRole === 'SUPER_ADMIN';
  const isAdmin = effectiveRole === 'ADMIN';
  const isAnyAdmin = isOwner || isSuperAdmin || isAdmin;

  // Helper for role-protected routes
  const RoleRoute = ({ children, allowed }) => {
    if (allowed) return children;
    return <Navigate to="/admin/dashboard" replace />;
  };

  const getTitle = () => {
    if (location.pathname.includes('/managers')) return 'Manager Management';
    if (location.pathname.includes('/finance-officers')) return 'Finance Officer Management';
    if (location.pathname.includes('/field-officers')) return 'Field Officer Management';
    if (location.pathname.includes('/customers')) return 'Customer Database';
    if (location.pathname.includes('/loans')) return 'Loan Portfolio';
    if (location.pathname.includes('/accounts')) return 'Admin Accounts Management';
    if (location.pathname.includes('/deactivations')) return 'Security & Deactivation Requests';
    if (location.pathname.includes('/branches')) return 'Branch Network Management';
    if (location.pathname.includes('/audit')) return 'System Audit Trail';
    if (location.pathname.includes('/customer-communicator')) return 'Customer Communication';
    if (location.pathname.includes('/official-communicator')) return 'Official Communication';
    if (location.pathname.includes('/super-admins')) return 'Super Admin Console';
    if (location.pathname.includes('/security-threats')) return 'Real-time Security Threat Intel';
    if (location.pathname.includes('/security-logs')) return 'Security & Compliance';
    if (location.pathname.includes('/owner-audit')) return 'Owner Audit Trail';
    if (location.pathname.includes('/settings')) return 'System Financial Settings';
    if (location.pathname.includes('/profile')) return 'Account Profile';
    
    // Dynamic Role Title
    if (isOwner) return 'Owner High-Command Dashboard';
    if (isSuperAdmin) return 'Super Admin Command Center';
    return 'Administrator Control Panel';
  };

  return (
    <Layout title={getTitle()}>
      <div className="space-y-6">
        <nav className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          {[
            { to: '/admin/dashboard', label: 'Overview' },
            { to: '/admin/customers', label: 'Customers' },
            { to: '/admin/loans', label: 'Loans' },
            { to: '/admin/customer-communicator', label: 'Customer Comms' },
            { to: '/admin/official-communicator', label: 'Official Comms' },
          ].map(tab => (
            <Link
              key={tab.to}
              to={tab.to}
              className={clsx(
                "text-sm font-medium pb-2 border-b-2 transition-colors whitespace-nowrap",
                location.pathname === tab.to 
                  ? "border-primary-600 text-primary-600" 
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="dashboard" element={<AdminOverview />} />
          
          <Route path="super-admins" element={
            <RoleRoute allowed={isOwner}>
              <SuperAdminPage />
            </RoleRoute>
          } />
          
          <Route path="security-threats" element={
            <RoleRoute allowed={isOwner || isSuperAdmin}>
              <SecurityThreatsPage />
            </RoleRoute>
          } />
          
          <Route path="accounts" element={
            <RoleRoute allowed={isOwner || isSuperAdmin}>
              <AdminAccounts />
            </RoleRoute>
          } />

          <Route path="settings" element={
            <RoleRoute allowed={isAnyAdmin}>
              <AdminSettings />
            </RoleRoute>
          } />

          <Route path="managers" element={
            <RoleRoute allowed={isAnyAdmin}>
              <AdminManagers />
            </RoleRoute>
          } />

          <Route path="finance-officers" element={
            <RoleRoute allowed={isOwner || isSuperAdmin}>
              <AdminOfficers role="FINANCIAL_OFFICER" />
            </RoleRoute>
          } />

          <Route path="field-officers" element={
            <RoleRoute allowed={isAnyAdmin}>
              <AdminOfficers role="FIELD_OFFICER" />
            </RoleRoute>
          } />
          
          <Route path="audit" element={
            <RoleRoute allowed={isAnyAdmin}>
              <AdminAuditLogs />
            </RoleRoute>
          } />

          <Route path="security-logs" element={
            <RoleRoute allowed={isOwner || isSuperAdmin}>
              <SecurityLogsPage />
            </RoleRoute>
          } />

          <Route path="owner-audit" element={
            <RoleRoute allowed={isOwner}>
              <OwnerAuditPage />
            </RoleRoute>
          } />

          <Route path="customers" element={<AdminCustomers />} />
          <Route path="loans" element={<AdminLoans />} />
          <Route path="deactivations" element={<AdminDeactivations />} />
          <Route path="branches" element={<BranchManagement />} />
          <Route path="customer-communicator" element={<CustomerCommunicator />} />
          <Route path="official-communicator" element={<OfficialCommunicator />} />
          <Route path="profile" element={<ProfileSettings />} />
        </Routes>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
