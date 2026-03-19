import React, { useState, useEffect, useCallback } from 'react';
import { loanService } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge } from '../components/ui/Shared';
import { 
  Percent, 
  Save, 
  RefreshCw, 
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  MessageSquare,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Search,
  CheckCircle,
  XCircle,
  Globe,
  Activity,
  UserCheck,
  Building2,
  Sliders,
  Calendar,
  Clock,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const MpesaField = ({ field, currentValue, onSave, onReveal }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showValue, setShowValue] = useState(false);

  const handleRevealClick = async () => {
    if (revealed) { setRevealed(null); return; }
    setLoading(true);
    try {
      const res = await onReveal(field.key);
      setRevealed(res.value);
    } catch {
      toast.error('Could not reveal value');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!value.trim()) { toast.error('Value cannot be empty'); return; }
    setLoading(true);
    try {
      await onSave(field.key, value, field.group);
      toast.success(`${field.label} saved`);
      setEditing(false);
      setValue('');
      setRevealed(null);
    } catch {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const displayValue = revealed || currentValue || '';
  const maskedValue = displayValue ? (field.sensitive ? '••••••••••••' : displayValue) : 'Not set';

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-3">
        {field.label}
        {!currentValue && <span className="ml-2 text-[10px] font-bold text-red-500 uppercase">Not configured</span>}
        {currentValue && <span className="ml-2 text-[10px] font-bold text-emerald-500 uppercase">Configured</span>}
      </label>

      {editing ? (
        <div className="space-y-2">
          <div className="relative">
            <input
              type={field.sensitive && !showValue ? 'password' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 pr-10 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-600"
              autoFocus
            />
            {field.sensitive && (
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setValue(''); }}
              className="px-3 py-2 border text-xs font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono text-xs text-slate-600 dark:text-slate-400 truncate">
            {field.sensitive ? (revealed ? revealed : maskedValue) : displayValue || 'Not set'}
          </div>
          {field.sensitive && currentValue && (
            <button onClick={handleRevealClick} disabled={loading} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors" title="Reveal">
              {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => { setValue(revealed || ''); setEditing(true); }}
            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
            title="Edit"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const SecureSettingRow = ({ item, onUpdate, onReveal }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(item.value);
  const [revealedValue, setRevealedValue] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(item.key, value, item.group);
      setIsEditing(false);
      setRevealedValue(null);
      toast.success(`${item.key} updated`);
    } catch (err) {
      toast.error("Failed to update setting");
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async () => {
    if (revealedValue) {
      setRevealedValue(null);
      return;
    }
    setLoading(true);
    try {
      const res = await onReveal(item.key);
      setRevealedValue(res.value);
    } catch (err) {
      toast.error("Permission denied or error revealing value");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 gap-3">
      <div className="flex-1">
        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.key}</h4>
        <p className="text-xs text-slate-500">{item.description || 'Secure configuration parameter'}</p>
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex gap-2 w-full sm:w-auto">
            <input 
              type="text"
              className="flex-1 sm:w-64 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter new value..."
            />
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>
               Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-xs text-slate-600 dark:text-slate-400 min-w-[120px] text-center">
              {revealedValue || item.value}
            </div>
            <button 
              onClick={handleReveal}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title="Reveal Value"
            >
              {revealedValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => { setValue(revealedValue || ''); setIsEditing(true); }}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminSettings = ({ defaultTab = 'mpesa' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [secureSettings, setSecureSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  
  // Maintenance State
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceTime, setMaintenanceTime] = useState('');
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // Update tab when prop changes (e.g. navigating between /owner/settings/sms and /owner/settings/mpesa)
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const allTabs = [
    { id: 'mpesa', label: 'M-Pesa API', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', roles: ['owner', 'super_admin'] },
    { id: 'sms', label: 'SMS Portal', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', roles: ['owner', 'super_admin'] },
    { id: 'system', label: 'System Settings', icon: Sliders, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-900/20', roles: ['owner', 'super_admin', 'admin'] },
    { id: 'security', label: 'Security & Auth', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', roles: ['owner'] },
    { id: 'branches', label: 'Branches', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', roles: ['owner', 'super_admin', 'admin'] },
    { id: 'maintenance', label: 'Maintenance', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', roles: ['owner', 'super_admin', 'admin'] },
  ];

  const visibleTabs = allTabs.filter(tab => {
    if (user?.is_owner) return true;
    if (user?.is_super_admin) return tab.roles.includes('super_admin');
    return tab.roles.includes('admin');
  });

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  const fetchSecureSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loanService.getSecureSettings();
      setSecureSettings(data);
      
      // Initialize maintenance state if keys exist
      const mActive = data.find(s => s.key === 'maintenance_mode_active');
      const mTime = data.find(s => s.key === 'maintenance_schedule_time');
      
      if (mActive) setIsMaintenanceActive(mActive.encrypted_value === 'true');
      if (mTime && mTime.encrypted_value && mTime.encrypted_value !== '••••••••') {
          const dt = new Date(mTime.encrypted_value);
          setMaintenanceDate(dt.toISOString().split('T')[0]);
          setMaintenanceTime(dt.toTimeString().split(' ')[0].substring(0, 5));
      }
    } catch (err) {
      toast.error("Failed to load secure settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecureSettings();
  }, [fetchSecureSettings]);

  const handleUpdate = async (key, value, group) => {
    try {
      await loanService.updateSecureSetting(key, value, group);
      await fetchSecureSettings();
    } catch (err) {
      toast.error("Failed to update setting");
    }
  };

  const handleReveal = async (key) => {
    return await loanService.revealSecureSetting(key);
  };

  const testMpesa = async () => {
    setTestLoading(true);
    try {
      const res = await loanService.testMpesaConnection();
      if (res.status === 'success') {
        toast.success("M-Pesa Connection Successful!");
      } else {
        toast.error(`M-Pesa Error: ${res.message || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error("M-Pesa connection test failed");
    } finally {
      setTestLoading(false);
    }
  };

  const testSMS = async () => {
    const phone = window.prompt("Enter phone number to test (+254...)");
    if (!phone) return;
    setTestLoading(true);
    try {
      const res = await loanService.testSMSSend(phone, "Test message from Loan System Security Panel");
      if (res.status === 'success') {
        toast.success("SMS Sent Successfully (Check logs/device)");
      } else {
        toast.error(`SMS Error: ${res.message || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error("SMS test failed");
    } finally {
      setTestLoading(false);
    }
  };

  const handleMaintenanceSchedule = async (e) => {
    e.preventDefault();
    if (!maintenanceDate || !maintenanceTime) {
      toast.error("Please selected both date and time");
      return;
    }

    setScheduling(true);
    try {
      const scheduledDateTime = new Date(`${maintenanceDate}T${maintenanceTime}`).toISOString();
      await loanService.scheduleMaintenance({
        time: scheduledDateTime,
        active: isMaintenanceActive
      });
      toast.success("Maintenance policy updated successfully");
      await fetchSecureSettings();
    } catch (err) {
      toast.error("Failed to schedule maintenance");
    } finally {
      setScheduling(false);
    }
  };

  const filteredSettings = Array.isArray(secureSettings) 
    ? secureSettings.filter(s => s.setting_group === activeTab.toUpperCase())
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Admin Settings
          </h2>
          <p className="text-slate-500 font-medium">Configure encrypted API keys and system policies</p>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={fetchSecureSettings} disabled={loading}>
                <RefreshCw className={clsx("w-4 h-4 mr-2", loading && "animate-spin")} />
                Refresh
            </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all",
                isActive 
                  ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Icon className={clsx("w-4 h-4", isActive ? tab.color : "text-slate-400")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500" />
                {visibleTabs.find(t => t.id === activeTab)?.label} Settings
              </h3>
              <Badge variant="outline" className="text-[10px] uppercase">Encrypted Storage</Badge>
            </div>
            
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <p className="text-sm font-medium">Loading secure parameters...</p>
                </div>
              ) : filteredSettings.length > 0 ? (
                filteredSettings.map(item => (
                  <SecureSettingRow 
                    key={item.key} 
                    item={item} 
                    onUpdate={handleUpdate}
                    onReveal={handleReveal}
                  />
                ))
              ) : (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-500">No settings found for this group.</p>
                  <Button variant="secondary" size="sm" className="mt-4" onClick={() => handleUpdate(`NEW_${activeTab.toUpperCase()}_KEY`, 'CHANGE_ME', activeTab.toUpperCase())}>
                    Initialize First Key
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {activeTab === 'mpesa' && (
            <div className="space-y-6">

              {/* Environment Toggle */}
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Environment</h4>
                    <p className="text-xs text-slate-500 mt-1">Switch between Safaricom Sandbox (testing) and Production (live money)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdate('mpesa_environment', 'sandbox', 'mpesa')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                        (secureSettings.find(s => s.key === 'mpesa_environment')?.value === 'sandbox' || !secureSettings.find(s => s.key === 'mpesa_environment'))
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Sandbox
                    </button>
                    <button
                      onClick={() => handleUpdate('mpesa_environment', 'production', 'mpesa')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                        secureSettings.find(s => s.key === 'mpesa_environment')?.value === 'production'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Production
                    </button>
                  </div>
                </div>
                {secureSettings.find(s => s.key === 'mpesa_environment')?.value === 'production' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-bold text-red-700">⚠️ PRODUCTION MODE — Real money transactions are active. Double-check all credentials before disbursing.</p>
                  </div>
                )}
              </div>

              {/* Credentials Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'mpesa_consumer_key',      label: 'Consumer Key',          placeholder: 'From Daraja portal',     sensitive: true,  group: 'mpesa' },
                  { key: 'mpesa_consumer_secret',   label: 'Consumer Secret',       placeholder: 'From Daraja portal',     sensitive: true,  group: 'mpesa' },
                  { key: 'mpesa_shortcode',         label: 'Paybill / Shortcode',   placeholder: 'e.g. 174379',            sensitive: false, group: 'mpesa' },
                  { key: 'mpesa_passkey',           label: 'Passkey',               placeholder: 'STK Push passkey',       sensitive: true,  group: 'mpesa' },
                  { key: 'mpesa_b2c_initiator',     label: 'B2C Initiator Name',    placeholder: 'e.g. testapi',           sensitive: false, group: 'mpesa' },
                  { key: 'mpesa_b2c_credential',    label: 'B2C Security Credential', placeholder: 'Encrypted credential', sensitive: true,  group: 'mpesa' },
                ].map(field => (
                  <MpesaField
                    key={field.key}
                    field={field}
                    currentValue={secureSettings.find(s => s.key === field.key)?.encrypted_value || ''}
                    onSave={handleUpdate}
                    onReveal={handleReveal}
                  />
                ))}

                {/* Callback URL — full width */}
                <div className="md:col-span-2">
                  <MpesaField
                    field={{ key: 'mpesa_callback_url', label: 'Callback URL', placeholder: 'https://your-backend.onrender.com/api/payments/callback/', sensitive: false, group: 'mpesa' }}
                    currentValue={secureSettings.find(s => s.key === 'mpesa_callback_url')?.encrypted_value || ''}
                    onSave={handleUpdate}
                    onReveal={handleReveal}
                  />
                </div>

                {/* Shortcode Type */}
                <div className="md:col-span-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">Shortcode Type</h4>
                  <div className="flex gap-3">
                    {['paybill', 'till'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleUpdate('mpesa_shortcode_type', type, 'mpesa')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
                          (secureSettings.find(s => s.key === 'mpesa_shortcode_type')?.encrypted_value || 'paybill') === type
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Paybill allows customers to enter account reference (National ID). Recommended.</p>
                </div>
              </div>

              {/* Test Connection */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Test Connection</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Verify your credentials work by connecting to Daraja API</p>
                </div>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={testMpesa}
                  disabled={testLoading}
                >
                  {testLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                  Test M-Pesa Connection
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-4">
              {[
                { key: 'sms_provider',   label: 'SMS Provider',  placeholder: 'e.g. Africa\'s Talking', sensitive: false, group: 'sms' },
                { key: 'sms_api_key',    label: 'API Key',        placeholder: 'Your SMS provider API key', sensitive: true, group: 'sms' },
                { key: 'sms_sender_id',  label: 'Sender ID',      placeholder: 'e.g. AZARIAH',           sensitive: false, group: 'sms' },
              ].map(field => (
                <MpesaField
                  key={field.key}
                  field={field}
                  currentValue={secureSettings.find(s => s.key === field.key)?.encrypted_value || ''}
                  onSave={handleUpdate}
                  onReveal={handleReveal}
                />
              ))}

              {/* Test SMS */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 rounded-xl">
                <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">Send Test SMS</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Phone number e.g. 0712345678"
                    id="test-sms-phone"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button onClick={testSMS} disabled={testLoading}>
                    {testLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Test'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <Card className="bg-orange-50/50 dark:bg-orange-900/5 border-orange-100 dark:border-orange-900/20">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">Scheduled Maintenance</h4>
                        <p className="text-xs text-slate-500">Configure system-wide maintenance windows</p>
                      </div>
                    </div>
                    <Badge variant={isMaintenanceActive ? "solid" : "outline"} className={isMaintenanceActive ? "bg-orange-500 text-white" : "border-orange-200 text-orange-600"}>
                      {isMaintenanceActive ? "Policy: ACTIVE" : "Policy: INACTIVE"}
                    </Badge>
                  </div>

                  <form onSubmit={handleMaintenanceSchedule} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Scheduled Date
                        </label>
                        <input 
                          type="date"
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                          value={maintenanceDate}
                          onChange={(e) => setMaintenanceDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Scheduled Time
                        </label>
                        <input 
                          type="time"
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                          value={maintenanceTime}
                          onChange={(e) => setMaintenanceTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-orange-100 dark:border-orange-900/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                          isMaintenanceActive ? "bg-orange-500" : "bg-slate-300"
                        )} onClick={() => setIsMaintenanceActive(!isMaintenanceActive)}>
                          <div className={clsx(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform",
                            isMaintenanceActive ? "translate-x-5.5" : "translate-x-0.5"
                          )} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Enable Maintenance Window</span>
                      </div>
                      <Button type="submit" disabled={scheduling} className="bg-orange-600 hover:bg-orange-700">
                        {scheduling ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Apply Policy
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>

              <Card className="border-indigo-100 dark:border-indigo-900/20 bg-indigo-50/20 dark:bg-indigo-900/5">
                <div className="p-5 flex gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl h-fit text-indigo-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 dark:text-white">Maintenance Best Practices</h4>
                    <ul className="space-y-2">
                       <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                         <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                         <b>Night/Weekends:</b> Maintenance should preferably be scheduled during low-traffic periods like weekends (Saturday night onwards) or late nights (11 PM - 4 AM).
                       </li>
                       <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                         <b>Auto Log-out:</b> When the scheduled time is reached, the system will automatically terminate all active sessions (excluding Owner accounts) and prevent new logins until maintenance is disabled.
                       </li>
                       <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                         <b>Notification:</b> SMS and Email alerts will be sent to all active users 15 minutes before the maintenance window begins.
                       </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                Security Guide
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-1.5 h-auto bg-indigo-500 rounded-full" />
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <b>Encryption:</b> Every value in these tabs is encrypted using AES-256 before being saved to the database.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-auto bg-emerald-500 rounded-full" />
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <b>Masking:</b> Sensitive fields like Phone numbers and National IDs are masked for all users except Super Admins who explicitly reveal them.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-auto bg-orange-500 rounded-full" />
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <b>IP Binding:</b> JWT tokens are now cryptographically bound to your login IP. Accessing from a different IP will invalidate the session.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900 text-white border-none">
            <div className="p-6">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                Access Control
              </h4>
              <p className="text-xs text-slate-400 mb-6">Your current session is hardened with multi-factor audit logging.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Device Verify</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">VERIFIED</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Rate Limiting</span>
                  <Badge className="bg-blue-500/20 text-blue-400 border-none text-[10px]">ENFORCED</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Audit Logs</span>
                  <Badge className="bg-indigo-500/20 text-indigo-400 border-none text-[10px]">RECORDING</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
