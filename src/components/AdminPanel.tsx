import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Key, 
  Plus, 
  Download, 
  Search, 
  Filter,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Mail,
  Copy,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit2,
  Eye,
  FileText,
  Activity,
  EyeOff,
  UserCheck,
  UserX,
  RefreshCw,
  Zap
} from 'lucide-react';
import { englishToPersianNumbers, formatPersianDate, formatPersianDateTime } from '../utils/dateHelpers';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Customer {
  id: string;
  activationCode: string;
  licenseType: 'admin' | 'trial';
  email?: string;
  purchaseInfo?: any;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  lastActivity?: string;
}

interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

interface CustomerLog {
  id: string;
  customerId: string;
  customerEmail: string;
  action: string;
  details: string;
  timestamp: string;
  systemInfo?: any;
}

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [customerLogs, setCustomerLogs] = useState<CustomerLog[]>([]);
  const [currentView, setCurrentView] = useState<'customers' | 'admin-logs' | 'customer-logs'>('customers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedCustomerForSettings, setSelectedCustomerForSettings] = useState<Customer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordCustomer, setPasswordCustomer] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  const [newCustomer, setNewCustomer] = useState({
    licenseType: 'admin' as 'admin' | 'trial',
    email: '',
    customerName: '',
    organization: '',
    phone: '',
    notes: ''
  });

  const [customerSettings, setCustomerSettings] = useState({
    licenseType: 'admin' as 'admin' | 'trial',
    email: '',
    customerName: '',
    organization: '',
    phone: '',
    notes: '',
    isActive: true,
    newActivationCode: ''
  });

  useEffect(() => {
    loadCustomers();
    loadLogs();
  }, []);

  const loadCustomers = () => {
    try {
      const savedCustomers = localStorage.getItem('admin_customers');
      if (savedCustomers) {
        setCustomers(JSON.parse(savedCustomers));
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadLogs = () => {
    try {
      const savedAdminLogs = localStorage.getItem('admin_logs');
      const savedCustomerLogs = localStorage.getItem('customer_logs');
      
      if (savedAdminLogs) {
        setAdminLogs(JSON.parse(savedAdminLogs));
      }
      if (savedCustomerLogs) {
        setCustomerLogs(JSON.parse(savedCustomerLogs));
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const saveCustomers = (updatedCustomers: Customer[]) => {
    try {
      localStorage.setItem('admin_customers', JSON.stringify(updatedCustomers));
      setCustomers(updatedCustomers);
    } catch (error) {
      console.error('Error saving customers:', error);
    }
  };

  const addAdminLog = (action: string, target: string, details: string) => {
    const newLog: AdminLog = {
      id: Date.now().toString(),
      adminId: 'superadmin',
      action,
      target,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: 'Admin Panel'
    };

    const updatedLogs = [...adminLogs, newLog];
    setAdminLogs(updatedLogs);
    localStorage.setItem('admin_logs', JSON.stringify(updatedLogs));
  };

  const generateActivationCode = (licenseType: 'admin' | 'trial'): string => {
    const prefix = licenseType === 'admin' ? 'HESA-ADMIN' : 'HESA-TRIAL';
    const year = new Date().getFullYear();
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${year}-${randomPart.substring(0, 3)}${timestamp}`;
  };

  const addCustomer = () => {
    if (!newCustomer.email || !newCustomer.customerName) {
      showMessage('لطفاً ایمیل و نام مشتری را وارد کنید', 'error');
      return;
    }

    const activationCode = generateActivationCode(newCustomer.licenseType);
    
    let expiresAt: string | undefined;
    if (newCustomer.licenseType === 'trial') {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      expiresAt = expiry.toISOString();
    }

    const customer: Customer = {
      id: Date.now().toString(),
      activationCode,
      licenseType: newCustomer.licenseType,
      email: newCustomer.email,
      purchaseInfo: {
        customerName: newCustomer.customerName,
        organization: newCustomer.organization,
        phone: newCustomer.phone,
        notes: newCustomer.notes
      },
      createdAt: new Date().toISOString(),
      expiresAt,
      isActive: true,
      isUsed: false
    };

    const updatedCustomers = [...customers, customer];
    saveCustomers(updatedCustomers);
    
    addAdminLog('CREATE', 'CUSTOMER', `مشتری جدید اضافه شد: ${newCustomer.customerName} (${newCustomer.email}) - کد: ${activationCode}`);
    
    setNewCustomer({
      licenseType: 'admin',
      email: '',
      customerName: '',
      organization: '',
      phone: '',
      notes: ''
    });
    setShowAddModal(false);
    showMessage('مشتری جدید با موفقیت اضافه شد', 'success');
  };

  const openCustomerSettings = (customer: Customer) => {
    setSelectedCustomerForSettings(customer);
    setCustomerSettings({
      licenseType: customer.licenseType,
      email: customer.email || '',
      customerName: customer.purchaseInfo?.customerName || '',
      organization: customer.purchaseInfo?.organization || '',
      phone: customer.purchaseInfo?.phone || '',
      notes: customer.purchaseInfo?.notes || '',
      isActive: customer.isActive,
      newActivationCode: ''
    });
    setShowSettingsModal(true);
  };

  const updateCustomerSettings = () => {
    if (!selectedCustomerForSettings) return;

    const updatedCustomer: Customer = {
      ...selectedCustomerForSettings,
      licenseType: customerSettings.licenseType,
      email: customerSettings.email,
      isActive: customerSettings.isActive,
      purchaseInfo: {
        ...selectedCustomerForSettings.purchaseInfo,
        customerName: customerSettings.customerName,
        organization: customerSettings.organization,
        phone: customerSettings.phone,
        notes: customerSettings.notes
      }
    };

    // اگر کد فعال‌سازی جدید وارد شده باشد
    if (customerSettings.newActivationCode.trim()) {
      updatedCustomer.activationCode = customerSettings.newActivationCode.trim().toUpperCase();
      addAdminLog('UPDATE', 'ACTIVATION_CODE', `کد فعال‌سازی مشتری ${customerSettings.customerName} تغییر کرد: ${updatedCustomer.activationCode}`);
    }

    // اگر نوع مجوز تغییر کرده باشد
    if (selectedCustomerForSettings.licenseType !== customerSettings.licenseType) {
      if (customerSettings.licenseType === 'trial') {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        updatedCustomer.expiresAt = expiry.toISOString();
      } else {
        updatedCustomer.expiresAt = undefined;
      }
      addAdminLog('UPDATE', 'LICENSE_TYPE', `نوع مجوز مشتری ${customerSettings.customerName} تغییر کرد: ${customerSettings.licenseType}`);
    }

    const updatedCustomers = customers.map(c => 
      c.id === selectedCustomerForSettings.id ? updatedCustomer : c
    );
    
    saveCustomers(updatedCustomers);
    addAdminLog('UPDATE', 'CUSTOMER', `اطلاعات مشتری ${customerSettings.customerName} بروزرسانی شد`);
    
    setShowSettingsModal(false);
    setSelectedCustomerForSettings(null);
    showMessage('تنظیمات مشتری با موفقیت بروزرسانی شد', 'success');
  };

  const generateNewActivationCode = () => {
    if (!selectedCustomerForSettings) return;
    
    const newCode = generateActivationCode(customerSettings.licenseType);
    setCustomerSettings({
      ...customerSettings,
      newActivationCode: newCode
    });
    
    showMessage('کد فعال‌سازی جدید تولید شد', 'success');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showMessage('کد کپی شد', 'success');
    });
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const deleteCustomer = (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (confirm(`آیا از حذف مشتری ${customer?.purchaseInfo?.customerName || 'نامشخص'} اطمینان دارید؟`)) {
      const updatedCustomers = customers.filter(c => c.id !== id);
      saveCustomers(updatedCustomers);
      addAdminLog('DELETE', 'CUSTOMER', `مشتری حذف شد: ${customer?.purchaseInfo?.customerName || 'نامشخص'}`);
      showMessage('مشتری حذف شد', 'success');
    }
  };

  const toggleCustomerStatus = (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    const updatedCustomers = customers.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    saveCustomers(updatedCustomers);
    
    const action = customer.isActive ? 'غیرفعال' : 'فعال';
    addAdminLog('UPDATE', 'STATUS', `وضعیت مشتری ${customer.purchaseInfo?.customerName || 'نامشخص'} ${action} شد`);
    showMessage(`وضعیت مشتری ${action} شد`, 'success');
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    if (currentView === 'customers') {
      const ws = workbook.addWorksheet('مشتریان');
      ws.views = [{ rightToLeft: true }];
      
      const headers = ['نام مشتری', 'ایمیل', 'کد فعال‌سازی', 'نوع مجوز', 'وضعیت', 'تاریخ ایجاد', 'تاریخ انقضا', 'استفاده شده'];
      const headerRow = ws.addRow(headers);
      
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
      });
      
      filteredCustomers.forEach(customer => {
        const row = ws.addRow([
          customer.purchaseInfo?.customerName || 'نامشخص',
          customer.email || '-',
          customer.activationCode,
          customer.licenseType === 'admin' ? 'مدیریت' : 'آزمایشی',
          customer.isActive ? 'فعال' : 'غیرفعال',
          formatPersianDate(new Date(customer.createdAt)),
          customer.expiresAt ? formatPersianDate(new Date(customer.expiresAt)) : 'نامحدود',
          customer.isUsed ? 'بله' : 'خیر'
        ]);
        
        row.eachCell((cell) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
        });
      });
      
      ws.columns = [
        { width: 25 }, { width: 30 }, { width: 25 }, { width: 15 },
        { width: 15 }, { width: 20 }, { width: 20 }, { width: 15 }
      ];
    } else if (currentView === 'admin-logs') {
      const ws = workbook.addWorksheet('لاگ مدیریت');
      ws.views = [{ rightToLeft: true }];
      
      const headers = ['تاریخ و زمان', 'عملیات', 'هدف', 'جزئیات'];
      const headerRow = ws.addRow(headers);
      
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
      });
      
      adminLogs.forEach(log => {
        const row = ws.addRow([
          formatPersianDateTime(new Date(log.timestamp)),
          log.action,
          log.target,
          log.details
        ]);
        
        row.eachCell((cell) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
        });
      });
      
      ws.columns = [
        { width: 25 }, { width: 15 }, { width: 15 }, { width: 50 }
      ];
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer]);
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = currentView === 'customers' ? `مشتریان-${timestamp}.xlsx` : `لاگ-مدیریت-${timestamp}.xlsx`;
    saveAs(blob, fileName);
    
    addAdminLog('EXPORT', currentView.toUpperCase(), `خروجی Excel گرفته شد: ${fileName}`);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm || 
      customer.activationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.purchaseInfo?.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || customer.licenseType === filterType;
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && customer.isActive) ||
      (filterStatus === 'inactive' && !customer.isActive) ||
      (filterStatus === 'used' && customer.isUsed) ||
      (filterStatus === 'unused' && !customer.isUsed);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.isActive).length,
    used: customers.filter(c => c.isUsed).length,
    admin: customers.filter(c => c.licenseType === 'admin').length,
    trial: customers.filter(c => c.licenseType === 'trial').length
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ direction: 'rtl' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 ml-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">پنل مدیریت کل</h1>
                <p className="text-sm text-gray-600">سیستم مدیریت مرخصی حسا</p>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('customers')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentView === 'customers' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                مشتریان
              </button>
              <button
                onClick={() => setCurrentView('admin-logs')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentView === 'admin-logs' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                لاگ مدیریت
              </button>
              <button
                onClick={() => setCurrentView('customer-logs')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  currentView === 'customer-logs' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                لاگ مشتریان
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                خروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 rounded-lg p-4 flex items-center gap-3 ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <p className={messageType === 'success' ? 'text-green-600' : 'text-red-600'}>
              {message}
            </p>
          </div>
        )}

        {/* Customers View */}
        {currentView === 'customers' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-sm font-medium text-gray-600">کل مشتریان</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {englishToPersianNumbers(stats.total.toString())}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-sm font-medium text-gray-600">فعال</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {englishToPersianNumbers(stats.active.toString())}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Key className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-sm font-medium text-gray-600">استفاده شده</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {englishToPersianNumbers(stats.used.toString())}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Shield className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-sm font-medium text-gray-600">مدیریت</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {englishToPersianNumbers(stats.admin.toString())}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-sm font-medium text-gray-600">آزمایشی</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {englishToPersianNumbers(stats.trial.toString())}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  افزودن مشتری جدید
                </button>
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  خروجی Excel
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">جستجو</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="نام، ایمیل یا کد..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع مجوز</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">همه</option>
                    <option value="admin">مدیریت</option>
                    <option value="trial">آزمایشی</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">همه</option>
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                    <option value="used">استفاده شده</option>
                    <option value="unused">استفاده نشده</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('');
                      setFilterStatus('');
                    }}
                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    پاک کردن فیلترها
                  </button>
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  لیست مشتریان ({englishToPersianNumbers(filteredCustomers.length.toString())} نفر)
                </h3>
              </div>
              
              {filteredCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          مشتری
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          کد فعال‌سازی
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          نوع مجوز
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          وضعیت
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          تاریخ ایجاد
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          عملیات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="mr-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.purchaseInfo?.customerName || 'نامشخص'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {customer.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {customer.activationCode}
                              </code>
                              <button
                                onClick={() => copyToClipboard(customer.activationCode)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              customer.licenseType === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {customer.licenseType === 'admin' ? 'مدیریت' : 'آزمایشی'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                customer.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {customer.isActive ? 'فعال' : 'غیرفعال'}
                              </span>
                              {customer.isUsed && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  استفاده شده
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPersianDate(new Date(customer.createdAt))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowDetailsModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="مشاهده جزئیات"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openCustomerSettings(customer)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="تنظیمات"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleCustomerStatus(customer.id)}
                                className={`p-1 ${customer.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                title={customer.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                              >
                                {customer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => deleteCustomer(customer.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">مشتری یافت نشد</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || filterType || filterStatus ? 'نتیجه‌ای برای فیلترهای انتخاب شده یافت نشد.' : 'هنوز مشتری اضافه نشده است.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Admin Logs View */}
        {currentView === 'admin-logs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                لاگ‌های مدیریت ({englishToPersianNumbers(adminLogs.length.toString())} مورد)
              </h3>
              <button
                onClick={exportToExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                خروجی Excel
              </button>
            </div>
            
            {adminLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاریخ و زمان
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        عملیات
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        هدف
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        جزئیات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adminLogs.slice().reverse().map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPersianDateTime(new Date(log.timestamp))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                            log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                            log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.target}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">لاگی یافت نشد</h3>
                <p className="mt-1 text-sm text-gray-500">
                  هنوز فعالیت مدیریتی ثبت نشده است.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Customer Logs View */}
        {currentView === 'customer-logs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                لاگ‌های مشتریان ({englishToPersianNumbers(customerLogs.length.toString())} مورد)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                فعالیت‌های انجام شده توسط مشتریان در سیستم‌های خودشان
              </p>
            </div>
            
            {customerLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاریخ و زمان
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        مشتری
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        عملیات
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        جزئیات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerLogs.slice().reverse().map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPersianDateTime(new Date(log.timestamp))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.customerEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">لاگی یافت نشد</h3>
                <p className="mt-1 text-sm text-gray-500">
                  هنوز فعالیت مشتری ثبت نشده است.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">افزودن مشتری جدید</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نوع مجوز
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="admin"
                      checked={newCustomer.licenseType === 'admin'}
                      onChange={(e) => setNewCustomer({ ...newCustomer, licenseType: e.target.value as 'admin' | 'trial' })}
                      className="form-radio text-blue-600"
                    />
                    <span className="mr-2">مدیریت (نامحدود)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="trial"
                      checked={newCustomer.licenseType === 'trial'}
                      onChange={(e) => setNewCustomer({ ...newCustomer, licenseType: e.target.value as 'admin' | 'trial' })}
                      className="form-radio text-blue-600"
                    />
                    <span className="mr-2">آزمایشی (۳۰ روز)</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نام مشتری *
                </label>
                <input
                  type="text"
                  value={newCustomer.customerName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, customerName: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ایمیل *
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  سازمان
                </label>
                <input
                  type="text"
                  value={newCustomer.organization}
                  onChange={(e) => setNewCustomer({ ...newCustomer, organization: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  شماره تماس
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  یادداشت
                </label>
                <textarea
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  rows={3}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={addCustomer}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                افزودن مشتری
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Settings Modal */}
      {showSettingsModal && selectedCustomerForSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">تنظیمات مشتری</h3>
              <p className="text-sm text-gray-600">
                {selectedCustomerForSettings.purchaseInfo?.customerName || 'نامشخص'}
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* اطلاعات اصلی */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">اطلاعات اصلی</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نام مشتری
                    </label>
                    <input
                      type="text"
                      value={customerSettings.customerName}
                      onChange={(e) => setCustomerSettings({ ...customerSettings, customerName: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      value={customerSettings.email}
                      onChange={(e) => setCustomerSettings({ ...customerSettings, email: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      سازمان
                    </label>
                    <input
                      type="text"
                      value={customerSettings.organization}
                      onChange={(e) => setCustomerSettings({ ...customerSettings, organization: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      شماره تماس
                    </label>
                    <input
                      type="tel"
                      value={customerSettings.phone}
                      onChange={(e) => setCustomerSettings({ ...customerSettings, phone: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    یادداشت
                  </label>
                  <textarea
                    value={customerSettings.notes}
                    onChange={(e) => setCustomerSettings({ ...customerSettings, notes: e.target.value })}
                    rows={3}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* تنظیمات مجوز */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">تنظیمات مجوز</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع مجوز
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="admin"
                          checked={customerSettings.licenseType === 'admin'}
                          onChange={(e) => setCustomerSettings({ ...customerSettings, licenseType: e.target.value as 'admin' | 'trial' })}
                          className="form-radio text-blue-600"
                        />
                        <span className="mr-2">مدیریت (نامحدود)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="trial"
                          checked={customerSettings.licenseType === 'trial'}
                          onChange={(e) => setCustomerSettings({ ...customerSettings, licenseType: e.target.value as 'admin' | 'trial' })}
                          className="form-radio text-blue-600"
                        />
                        <span className="mr-2">آزمایشی (۳۰ روز)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customerSettings.isActive}
                        onChange={(e) => setCustomerSettings({ ...customerSettings, isActive: e.target.checked })}
                        className="form-checkbox text-blue-600"
                      />
                      <span className="mr-2 text-sm font-medium text-gray-700">مشتری فعال است</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* مدیریت کد فعال‌سازی */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">مدیریت کد فعال‌سازی</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      کد فعال‌سازی فعلی
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-sm">
                        {selectedCustomerForSettings.activationCode}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedCustomerForSettings.activationCode)}
                        className="text-blue-600 hover:text-blue-800 p-2"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      کد فعال‌سازی جدید (اختیاری)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customerSettings.newActivationCode}
                        onChange={(e) => setCustomerSettings({ ...customerSettings, newActivationCode: e.target.value })}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="کد جدید را وارد کنید یا تولید کنید"
                      />
                      <button
                        onClick={generateNewActivationCode}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        تولید
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      اگر کد جدید وارد کنید، کد قبلی جایگزین خواهد شد
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={updateCustomerSettings}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                بروزرسانی تنظیمات
              </button>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setSelectedCustomerForSettings(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">جزئیات مشتری</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">اطلاعات مشتری</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">نام:</span>
                      <span className="font-medium">{selectedCustomer.purchaseInfo?.customerName || 'نامشخص'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ایمیل:</span>
                      <span className="font-medium">{selectedCustomer.email || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">سازمان:</span>
                      <span className="font-medium">{selectedCustomer.purchaseInfo?.organization || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تلفن:</span>
                      <span className="font-medium">{selectedCustomer.purchaseInfo?.phone || '-'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">اطلاعات مجوز</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">کد فعال‌سازی:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {selectedCustomer.activationCode}
                        </code>
                        <button
                          onClick={() => copyToClipboard(selectedCustomer.activationCode)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleManageCustomerPassword(customer)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="مدیریت رمز عبور"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">نوع مجوز:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedCustomer.licenseType === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {selectedCustomer.licenseType === 'admin' ? 'مدیریت' : 'آزمایشی'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">وضعیت:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedCustomer.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCustomer.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاریخ ایجاد:</span>
                      <span className="font-medium">{formatPersianDate(new Date(selectedCustomer.createdAt))}</span>
                    </div>
                    {selectedCustomer.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاریخ انقضا:</span>
                        <span className="font-medium">{formatPersianDate(new Date(selectedCustomer.expiresAt))}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedCustomer.purchaseInfo?.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">یادداشت</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-800">{selectedCustomer.purchaseInfo.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;