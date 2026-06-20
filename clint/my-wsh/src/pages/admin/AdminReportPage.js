import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { translations } from '../../translations/translations';
import AdminHeader from '../../components/AdminHeader';
import LiveChatButton from '../../components/LiveChatButton';
import { statisticsApi, userApi } from '../../utils/adminApi';
import '../../css/AdminReportPage.css';

function AdminReportPage() {
  const { isDarkMode, language } = useThemeLanguage();
  const { adminData } = useAdmin();
  const t = translations[language];

  // Report state
  const [reportType, setReportType] = useState('userActivity');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [userStatus, setUserStatus] = useState('all');

  // Data state
  const [statistics, setStatistics] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [errorLogs, setErrorLogs] = useState(null);
  const [reminderStats, setReminderStats] = useState(null);
  const [reminderLogs, setReminderLogs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [overdueTasksCount, setOverdueTasksCount] = useState(0);

  useEffect(() => {
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [startDate, endDate]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statsResponse, activityResponse, metricsResponse, logsResponse, reminderStatsResponse, reminderLogsResponse, usersResponse] = await Promise.all([
        statisticsApi.getStatistics(startDate, endDate),
        statisticsApi.getUserActivity(startDate, endDate),
        statisticsApi.getSystemMetrics(),
        statisticsApi.getErrorLogs(),
        statisticsApi.getReminderStats().catch(() => ({ success: false, stats: null })),
        statisticsApi.getReminderLogs().catch(() => ({ success: false, logs: [] })),
        userApi.getUsers().catch(() => ({ success: false, users: [] }))
      ]);

      setStatistics(statsResponse.statistics);
      setUserActivity(activityResponse.activity);
      setSystemMetrics(metricsResponse.metrics);
      setErrorLogs(logsResponse.logs);
      if (reminderStatsResponse.success) {
        setReminderStats(reminderStatsResponse.stats);
      }
      if (reminderLogsResponse.success) {
        setReminderLogs(reminderLogsResponse.logs);
      }
      if (usersResponse.success) {
        setAllUsers(usersResponse.users || []);
      }
      
      // Calculate overdue tasks count (placeholder - would need API call to get actual count)
      if (statsResponse.statistics && statsResponse.statistics.tasks) {
        setOverdueTasksCount(0); // Placeholder
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(t.adminReportPage.failedToLoadData);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const statsResponse = await statisticsApi.getStatistics(startDate, endDate);
      const activityResponse = await statisticsApi.getUserActivity(startDate, endDate);
      
      setReportData({
        type: reportType,
        startDate,
        endDate,
        generatedAt: new Date().toISOString(),
        filters: {
          categories: selectedCategories,
          userStatus,
          advancedFilters: showAdvancedFilters
        },
        data: {
          statistics: statsResponse.statistics,
          activity: activityResponse.activity
        }
      });
    } catch (err) {
      console.error('Error generating report:', err);
      setError(t.adminReportPage.failedToGenerateReport);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get table data based on report type
  const getTableData = () => {
    switch (reportType) {
      case 'userActivity':
        if (!userActivity || !userActivity.users) return { headers: [], rows: [] };
        return {
          headers: [t.adminReportPage.username || 'Username', t.userManagement.email, t.userManagement.status, t.userManagement.registrationDate, t.adminReportPage.recentActivity],
          rows: userActivity.users.map(user => {
            // Format the creation date
            let createdAtDisplay = t.userReportPage.noData;
            if (user.createdAt) {
              try {
                const date = new Date(user.createdAt);
                if (!isNaN(date.getTime())) {
                  createdAtDisplay = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                }
              } catch (e) {
                console.error('Error formatting date:', e);
              }
            }
            
            return [
              user.userName || '',
              user.email || '',
              user.status || t.userManagement.active,
              createdAtDisplay,
              t.adminReportPage.registered
            ];
          })
        };
      
      case 'systemLogs':
        if (!errorLogs) return { headers: [], rows: [] };
        return {
          headers: [t.adminReportPage.timestamp || 'Timestamp', t.adminReportPage.severity || 'Severity', t.adminReportPage.module, t.adminReportPage.message || 'Message'],
          rows: errorLogs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.severity || '',
            log.module || '',
            log.message || ''
          ])
        };
      
      case 'categoryUsage':
        if (!statistics) return { headers: [], rows: [] };
          const warrantyRows = statistics.warranties.categories.map(cat => [
          cat._id || '',
          cat.count || 0,
          t.adminReportPage.warranty,
          ((cat.count / statistics.warranties.total) * 100).toFixed(1) + '%'
        ]);
        const subscriptionRows = statistics.subscriptions.categories.map(cat => [
          cat._id || '',
          cat.count || 0,
          t.adminReportPage.subscription,
          ((cat.count / statistics.subscriptions.total) * 100).toFixed(1) + '%'
        ]);
        return {
          headers: [t.adminReportPage.category || 'Category', t.adminReportPage.numberOfItems || 'Number of Items', t.adminReportPage.type, t.adminReportPage.percentage],
          rows: [...warrantyRows, ...subscriptionRows]
        };
      
      case 'errorTracking':
        if (!errorLogs) return { headers: [], rows: [] };
        return {
          headers: [t.adminReportPage.error, t.adminReportPage.severity, t.adminReportPage.module, t.adminReportPage.timestamp],
          rows: errorLogs.map(error => [
            error.message || '',
            error.severity || '',
            error.module || '',
            new Date(error.timestamp).toLocaleString()
          ])
        };
      
      case 'userEngagement':
        if (!statistics) return { headers: [], rows: [] };
        return {
          headers: [t.adminReportPage.metric, t.adminReportPage.value, t.adminReportPage.percentage, t.adminReportPage.status],
          rows: [
            [t.adminReportPage.totalUsers, statistics.users.total, '100%', t.userManagement.active],
            [t.adminReportPage.activeUsers, statistics.users.active, ((statistics.users.active / statistics.users.total) * 100).toFixed(1) + '%', t.adminReportPage.engaged],
            [t.homeTasksPage.status.completed, statistics.tasks.completed, ((statistics.tasks.completed / statistics.tasks.total) * 100).toFixed(1) + '%', t.adminReportPage.productive],
            [t.homeTasksPage.status.pending, statistics.tasks.pending, ((statistics.tasks.pending / statistics.tasks.total) * 100).toFixed(1) + '%', t.adminReportPage.needsAttention]
          ]
        };
      
      case 'remindersNotifications':
        if (!reminderLogs || !Array.isArray(reminderLogs) || reminderLogs.length === 0) {
          return { headers: [], rows: [] };
        }
        return {
          headers: [t.adminReportPage.user, t.adminReportPage.type, t.adminReportPage.title, t.adminReportPage.status, t.adminReportPage.dateSent, t.adminReportPage.relatedItem],
          rows: reminderLogs.map(log => {
            let dateSentDisplay = t.userReportPage.noData;
            if (log.dateSent) {
              try {
                const date = new Date(log.dateSent);
                if (!isNaN(date.getTime())) {
                  dateSentDisplay = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                }
              } catch (e) {
                console.error('Error formatting date:', e);
              }
            }
            
            return [
              log.userName || log.userEmail || t.userReportPage.noData,
              (log.type || '').charAt(0).toUpperCase() + (log.type || '').slice(1),
              log.title || t.userReportPage.noData,
              log.status || t.userReportPage.noData,
              dateSentDisplay,
              log.relatedItemName || t.userReportPage.noData
            ];
          })
        };
      
      default:
        return { headers: [], rows: [] };
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const tableData = getTableData();
    if (tableData.rows.length === 0) {
      alert(t.adminReportPage.noDataAvailable);
      return;
    }

    const csvContent = [
      tableData.headers.join(','),
      ...tableData.rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportToJSON = () => {
    const tableData = getTableData();
    if (tableData.rows.length === 0) {
      alert(t.adminReportPage.noDataAvailable);
      return;
    }

    const jsonData = {
      reportType,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      filters: {
        categories: selectedCategories,
        userStatus,
        advancedFilters: showAdvancedFilters
      },
      data: tableData.rows.map(row => {
        const obj = {};
        tableData.headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      }),
      statistics: statistics ? {
        users: statistics.users,
        warranties: statistics.warranties,
        subscriptions: statistics.subscriptions,
        tasks: statistics.tasks
      } : null
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${reportType}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (CSV format with .xls extension for Excel compatibility)
  const exportToExcel = () => {
    const tableData = getTableData();
    if (tableData.rows.length === 0) {
      alert(t.adminReportPage.noDataAvailable);
      return;
    }

    // Create TSV (Tab-separated) format which Excel handles well
    const excelContent = [
      tableData.headers.join('\t'),
      ...tableData.rows.map(row => row.map(cell => String(cell).replace(/\t/g, ' ')).join('\t'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${reportType}_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to escape HTML
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Export to PDF
  const exportToPDF = () => {
    const tableData = getTableData();
    if (tableData.rows.length === 0) {
      alert(t.adminReportPage.noDataAvailable);
      return;
    }

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Report - ${escapeHtml(reportType)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #007bff;
              border-bottom: 3px solid #007bff;
              padding-bottom: 10px;
            }
            .report-info {
              margin-bottom: 30px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .report-info p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #007bff;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            @media print {
              body {
                margin: 0;
                padding: 15px;
              }
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(t.adminReportPage.title || 'Admin Report')}</h1>
          <div class="report-info">
            <p><strong>${t.adminReportPage.reportType}</strong> ${escapeHtml(reportType)}</p>
            <p><strong>${t.adminReportPage.startDate}</strong> ${escapeHtml(new Date(startDate).toLocaleDateString())}</p>
            <p><strong>${t.adminReportPage.endDate}</strong> ${escapeHtml(new Date(endDate).toLocaleDateString())}</p>
            <p><strong>${t.adminReportPage.generatedAt}</strong> ${escapeHtml(new Date().toLocaleString())}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${tableData.headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableData.rows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${escapeHtml(String(cell))}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>${t.adminReportPage.generatedBy}</p>
          </div>
        </body>
      </html>
    `;

    // Create a new window and print it as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      alert(t.adminReportPage.pleaseAllowPopups);
    }
  };

  const handleExportReport = () => {
    if (!reportData && !statistics && !userActivity && !errorLogs) {
      alert(t.adminReportPage.pleaseGenerateReport);
      return;
    }

    switch (exportFormat.toLowerCase()) {
      case 'csv':
        exportToCSV();
        break;
      case 'json':
        exportToJSON();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
      default:
        alert(t.adminReportPage.exportFormatNotSupported);
    }
  };

  const renderChart = (type) => {
    const chartColors = isDarkMode ? ['#4dabf7', '#51cf66', '#ffd43b', '#ff6b6b', '#74c0fc'] : ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8'];
    
    if (!statistics) {
      return (
        <div className="chart-container">
          <div className="chart-placeholder">
            <p>{t.adminReportPage.loadingChartData}</p>
          </div>
        </div>
      );
    }
    
    switch (type) {
      case 'categoryDistribution':
        return (
          <div className="chart-container">
            <svg width="100%" height="100%" viewBox="0 0 300 300">
              {statistics.warranties.categories && statistics.warranties.categories.length > 0 ? (
                statistics.warranties.categories.slice(0, 5).map((item, index) => {
                  const total = statistics.warranties.categories.reduce((sum, cat) => sum + cat.count, 0);
                  const percentage = (item.count / total) * 100;
                  const angle = (percentage / 100) * 360;
                  const radius = 80;
                  const x = 150 + radius * Math.cos((index * 72 - 90) * Math.PI / 180);
                  const y = 150 + radius * Math.sin((index * 72 - 90) * Math.PI / 180);
                  
                  return (
                    <g key={index}>
                      <path
                        d={`M 150 150 L ${x} ${y} A ${radius} ${radius} 0 0 1 ${x + radius * Math.cos((index * 72 + angle - 90) * Math.PI / 180)} ${y + radius * Math.sin((index * 72 + angle - 90) * Math.PI / 180)} Z`}
                        fill={chartColors[index % chartColors.length]}
                      />
                      <text
                        x={150 + (radius + 20) * Math.cos((index * 72 + angle/2 - 90) * Math.PI / 180)}
                        y={150 + (radius + 20) * Math.sin((index * 72 + angle/2 - angle/2 - 90) * Math.PI / 180)}
                        textAnchor="middle"
                        fill={isDarkMode ? "#ffffff" : "#333333"}
                        fontSize="12"
                      >
                        {percentage.toFixed(1)}%
                      </text>
                    </g>
                  );
                })
              ) : (
                <text x="150" y="150" textAnchor="middle" fill={isDarkMode ? "#ffffff" : "#333333"}>
                  {t.adminReportPage.noCategoryDataAvailable}
                </text>
              )}
            </svg>
          </div>
        );
      
      case 'systemHealth':
        return (
          <div className="chart-container">
            <svg width="100%" height="100%" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e9ecef"
                strokeWidth="10"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={systemMetrics?.database?.status === 'connected' ? chartColors[1] : chartColors[3]}
                strokeWidth="10"
                strokeDasharray={`${systemMetrics?.database?.status === 'connected' ? 502.4 : 251.2} 502.4`}
                strokeDashoffset="125.6"
                transform="rotate(-90 100 100)"
              />
              <text
                x="100"
                y="100"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="24"
                fontWeight="bold"
                fill={isDarkMode ? "#ffffff" : "#333333"}
              >
                {systemMetrics?.database?.status === 'connected' ? '98%' : '50%'}
              </text>
            </svg>
          </div>
        );
      
      default:
        return (
          <div className="chart-container">
            <div className="chart-placeholder">
              <p>{t.adminReportPage.chartPlaceholder} {type}</p>
            </div>
          </div>
        );
    }
  };

  if (loading && !statistics) {
    return (
      <div 
        className="admin-report-page"
        data-theme={isDarkMode ? 'dark' : 'light'}
        data-language={language}
      >
        <AdminHeader />
        <main className="admin-report-main">
          <div className="report-container">
            <div className="loading-container">
              <h2>{t.adminReportPage.loadingReportData}</h2>
            </div>
          </div>
        </main>
        <LiveChatButton />
      </div>
    );
  }

  return (
    <div 
      className="admin-report-page"
      data-theme={isDarkMode ? 'dark' : 'light'}
      data-language={language}
    >
      <AdminHeader />

      {/* Main Content */}
      <main className="admin-report-main">
        <div className="report-container">
          <h1 className="report-title">{t.adminReportPage.title}</h1>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Report Controls */}
          <div className="report-controls">
            <div className="control-group">
              <label className="control-label">{t.adminReportPage.reportType}</label>
              <select 
                className="control-select"
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="userActivity">{t.adminReportPage.userActivity}</option>
                <option value="systemLogs">{t.adminReportPage.systemLogs}</option>
                <option value="categoryUsage">{t.adminReportPage.categoryUsage}</option>
                <option value="errorTracking">{t.adminReportPage.errorTracking}</option>
                <option value="userEngagement">{t.adminReportPage.userEngagement}</option>
                <option value="remindersNotifications">{t.adminReportPage.remindersNotifications}</option>
              </select>
            </div>
            
            <div className="control-group">
              <label className="control-label">{t.adminReportPage.startDate}</label>
              <input 
                type="date" 
                className="control-input"
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            
            <div className="control-group">
              <label className="control-label">{t.adminReportPage.endDate}</label>
              <input 
                type="date" 
                className="control-input"
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
            
            <div className="control-group">
              <label className="control-label">{t.adminReportPage.filterByUser}</label>
              <select 
                className="control-select"
                value={selectedUserId} 
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">{t.adminReportPage.allUsers}</option>
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username || user.userName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              className="generate-btn" 
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? t.adminReportPage.generating : t.adminReportPage.generateReport}
            </button>
          </div>

          {/* Advanced Filters */}
          <div className="advanced-filters">
            <button 
              className="filter-toggle-btn"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? t.adminReportPage.hideAdvancedFilters : t.adminReportPage.showAdvancedFilters}
            </button>
            
            {showAdvancedFilters && (
              <div className="filter-options">
                <div className="control-group">
                  <label className="control-label">{t.adminReportPage.exportFormat}</label>
                  <select 
                    className="control-select"
                    value={exportFormat} 
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <option value="pdf">{t.adminReportPage.pdf}</option>
                    <option value="excel">{t.adminReportPage.excel}</option>
                    <option value="csv">{t.adminReportPage.csv}</option>
                    <option value="json">{t.adminReportPage.json}</option>
                  </select>
                </div>
                
                <div className="control-group">
                  <label className="control-label">{t.adminReportPage.userStatus}</label>
                  <select 
                    className="control-select"
                    value={userStatus} 
                    onChange={(e) => setUserStatus(e.target.value)}
                  >
                    <option value="all">{t.adminReportPage.allUsers}</option>
                    <option value="active">{t.adminReportPage.activeOnly}</option>
                    <option value="inactive">{t.adminReportPage.inactiveOnly}</option>
                  </select>
                </div>
                
                <button 
                  className="export-btn" 
                  onClick={handleExportReport}
                  disabled={
                    (reportType === 'userActivity' && (!userActivity || !userActivity.users || userActivity.users.length === 0)) ||
                    ((reportType === 'systemLogs' || reportType === 'errorTracking') && (!errorLogs || errorLogs.length === 0)) ||
                    ((reportType === 'categoryUsage' || reportType === 'userEngagement') && !statistics) ||
                    (reportType === 'remindersNotifications' && (!reminderLogs || reminderLogs.length === 0))
                  }
                >
                  {t.adminReportPage.exportReport}
                </button>
              </div>
            )}
          </div>

          {/* Enhanced Statistics Cards */}
          {statistics && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{statistics.users.total}</div>
                <div className="stat-label">{t.adminReportPage.totalUsers}</div>
                <div className="stat-change positive">
                  {statistics.users.inPeriod > 0 ? `+${statistics.users.inPeriod} ${t.adminReportPage.active}` : t.adminReportPage.noNewUsers}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{statistics.users.active}</div>
                <div className="stat-label">{t.adminReportPage.activeUsers}</div>
                <div className="stat-change positive">
                  {((statistics.users.active / statistics.users.total) * 100).toFixed(1)}% {t.adminReportPage.active}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{statistics.warranties.total}</div>
                <div className="stat-label">{t.adminReportPage.totalWarranties}</div>
                <div className="stat-change positive">
                  {statistics.warranties.inPeriod > 0 ? `+${statistics.warranties.inPeriod} ${t.adminReportPage.active}` : t.adminReportPage.noNewWarranties}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{statistics.subscriptions.total}</div>
                <div className="stat-label">{t.adminReportPage.totalSubscriptions}</div>
                <div className="stat-change positive">
                  {statistics.subscriptions.inPeriod > 0 ? `+${statistics.subscriptions.inPeriod} ${t.adminReportPage.active}` : t.adminReportPage.noNewSubscriptions}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{statistics.tasks.total}</div>
                <div className="stat-label">{t.adminReportPage.totalTasks}</div>
                <div className="stat-change positive">
                  {statistics.tasks.completed} {t.adminReportPage.completed} ({((statistics.tasks.completed / statistics.tasks.total) * 100).toFixed(1)}%)
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {systemMetrics?.database?.status === 'connected' ? '98%' : '50%'}
                </div>
                <div className="stat-label">{t.adminReportPage.systemHealth}</div>
                <div className="stat-change positive">
                  {systemMetrics?.database?.status === 'connected' ? t.adminReportPage.systemHealthy : t.adminReportPage.issuesDetected}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{statistics.tasks.pending}</div>
                <div className="stat-label">{t.homeTasksPage.status.pending}</div>
                <div className="stat-change negative">
                  {statistics.tasks.pending > 0 ? `${statistics.tasks.pending} ${t.adminReportPage.pending}` : t.adminReportPage.allTasksCompleted}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{overdueTasksCount}</div>
                <div className="stat-label">{t.homeTasksPage.status.overdue}</div>
                <div className="stat-change negative">
                  {overdueTasksCount > 0 ? `${overdueTasksCount} ${t.adminReportPage.overdue}` : t.adminReportPage.noOverdueTasks}
                </div>
              </div>

            </div>
          )}

          {/* Reminder System Statistics Cards */}
          {reminderStats && (
            <div className="stats-grid reminder-stats-grid">
              <div className="stat-card reminder-stat-card-blue">
                <div className="stat-number">{reminderStats.total || 0}</div>
                <div className="stat-label">{t.adminReportPage.totalRemindersSent}</div>
                <div className="stat-change positive">
                  {reminderStats.recent || 0} {t.adminReportPage.inLast7Days}
                </div>
              </div>
              <div className="stat-card reminder-stat-card-green">
                <div className="stat-number">{reminderStats.sent || 0}</div>
                <div className="stat-label">{t.adminReportPage.successfullySent}</div>
                <div className="stat-change positive">
                  {reminderStats.successRate || 0}% {t.adminReportPage.successRate}
                </div>
              </div>
              <div className="stat-card reminder-stat-card-red">
                <div className="stat-number">{reminderStats.failed || 0}</div>
                <div className="stat-label">{t.adminReportPage.failedReminders}</div>
                <div className="stat-change negative">
                  {reminderStats.total > 0 ? ((reminderStats.failed / reminderStats.total) * 100).toFixed(1) : 0}% {t.adminReportPage.failureRate}
                </div>
              </div>
              <div className="stat-card reminder-stat-card-yellow">
                <div className="stat-number">{reminderStats.byType?.warranty || 0}</div>
                <div className="stat-label">{t.adminReportPage.warrantyReminders}</div>
                <div className="stat-change positive">
                  {t.adminReportPage.warrantyExpirationAlerts}
                </div>
              </div>
              <div className="stat-card reminder-stat-card-light-blue">
                <div className="stat-number">{reminderStats.byType?.subscription || 0}</div>
                <div className="stat-label">{t.adminReportPage.subscriptionReminders}</div>
                <div className="stat-change positive">
                  {t.adminReportPage.subscriptionRenewalAlerts}
                </div>
              </div>
              <div className="stat-card reminder-stat-card-light-red">
                <div className="stat-number">{reminderStats.byType?.maintenance || 0}</div>
                <div className="stat-label">{t.adminReportPage.maintenanceReminders}</div>
                <div className="stat-change positive">
                  {t.adminReportPage.homeMaintenanceAlerts}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Charts Section */}
          <div className="charts-section">
            <div className="chart-card">
              <h3 className="chart-title">{t.adminReportPage.categoryDistribution}</h3>
              {renderChart('categoryDistribution')}
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">{t.adminReportPage.systemHealth}</h3>
              {renderChart('systemHealth')}
            </div>
          </div>

          {/* Enhanced Data Tables */}
          <div className="data-section">
            {reportType === 'userActivity' && userActivity && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.adminReportPage.username}</th>
                    <th>{t.adminReportPage.email}</th>
                    <th>{t.adminReportPage.status}</th>
                    <th>{t.adminReportPage.createdAt}</th>
                    <th>{t.adminReportPage.recentActivity}</th>
                  </tr>
                </thead>
                <tbody>
                  {userActivity.users.map((user, index) => {
                    // Format the creation date
                    let createdAtDisplay = t.userReportPage.noData;
                    if (user.createdAt) {
                      try {
                        const date = new Date(user.createdAt);
                        if (!isNaN(date.getTime())) {
                          createdAtDisplay = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          });
                        }
                      } catch (e) {
                        console.error('Error formatting date:', e);
                      }
                    }
                    
                    return (
                    <tr key={user._id || index}>
                        <td>{user.userName || t.userReportPage.noData}</td>
                        <td>{user.email || t.userReportPage.noData}</td>
                      <td>
                          <span className={`status-badge ${user.status || 'active'}`}>
                            {user.status || t.userManagement.active}
                        </span>
                      </td>
                        <td>{createdAtDisplay}</td>
                      <td>{t.adminReportPage.registered}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            
            {reportType === 'systemLogs' && errorLogs && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.adminReportPage.timestamp}</th>
                    <th>{t.adminReportPage.severity}</th>
                    <th>{t.adminReportPage.module}</th>
                    <th>{t.adminReportPage.message}</th>
                  </tr>
                </thead>
                <tbody>
                  {errorLogs.map((log, index) => (
                    <tr key={index}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <span className={`severity-badge ${log.severity.toLowerCase()}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td>{log.module}</td>
                      <td>{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {reportType === 'categoryUsage' && statistics && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.adminReportPage.category}</th>
                    <th>{t.adminReportPage.numberOfItems}</th>
                    <th>{t.adminReportPage.type}</th>
                    <th>{t.adminReportPage.percentage}</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.warranties.categories.map((category, index) => (
                    <tr key={index}>
                      <td>{category._id}</td>
                      <td>{category.count}</td>
                      <td>{t.adminReportPage.warranty}</td>
                      <td>
                        <span className="positive">
                          {((category.count / statistics.warranties.total) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {statistics.subscriptions.categories.map((category, index) => (
                    <tr key={`sub-${index}`}>
                      <td>{category._id}</td>
                      <td>{category.count}</td>
                      <td>{t.adminReportPage.subscription}</td>
                      <td>
                        <span className="positive">
                          {((category.count / statistics.subscriptions.total) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'errorTracking' && errorLogs && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.adminReportPage.error}</th>
                    <th>{t.adminReportPage.severity}</th>
                    <th>{t.adminReportPage.module}</th>
                    <th>{t.adminReportPage.timestamp}</th>
                  </tr>
                </thead>
                <tbody>
                  {errorLogs.map((error, index) => (
                    <tr key={index}>
                      <td>{error.message}</td>
                      <td>
                        <span className={`severity-badge ${error.severity.toLowerCase()}`}>
                          {error.severity}
                        </span>
                      </td>
                      <td>{error.module}</td>
                      <td>{new Date(error.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'userEngagement' && statistics && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.adminReportPage.metric}</th>
                    <th>{t.adminReportPage.value}</th>
                    <th>{t.adminReportPage.percentage}</th>
                    <th>{t.adminReportPage.status}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t.adminReportPage.totalUsers}</td>
                    <td>{statistics.users.total}</td>
                    <td>100%</td>
                    <td>
                      <span className="positive">{t.userManagement.active}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>{t.adminReportPage.activeUsers}</td>
                    <td>{statistics.users.active}</td>
                    <td>{((statistics.users.active / statistics.users.total) * 100).toFixed(1)}%</td>
                    <td>
                      <span className="positive">{t.adminReportPage.engaged}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>{t.homeTasksPage.status.completed}</td>
                    <td>{statistics.tasks.completed}</td>
                    <td>{((statistics.tasks.completed / statistics.tasks.total) * 100).toFixed(1)}%</td>
                    <td>
                      <span className="positive">{t.adminReportPage.productive}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>{t.homeTasksPage.status.pending}</td>
                    <td>{statistics.tasks.pending}</td>
                    <td>{((statistics.tasks.pending / statistics.tasks.total) * 100).toFixed(1)}%</td>
                    <td>
                      <span className="negative">{t.adminReportPage.needsAttention}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {reportType === 'remindersNotifications' && reminderLogs && reminderLogs.length > 0 && (
              <div>
                <h3 className="reminder-logs-title">
                  {t.adminReportPage.reminderLogs}
                </h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t.adminReportPage.user}</th>
                      <th>{t.adminReportPage.type}</th>
                      <th>{t.adminReportPage.title}</th>
                      <th>{t.adminReportPage.status}</th>
                      <th>{t.adminReportPage.dateSent}</th>
                      <th>{t.adminReportPage.relatedItem}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminderLogs.map((log, index) => {
                      let dateSentDisplay = t.userReportPage.noData;
                      if (log.dateSent) {
                        try {
                          const date = new Date(log.dateSent);
                          if (!isNaN(date.getTime())) {
                            dateSentDisplay = date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          }
                        } catch (e) {
                          console.error('Error formatting date:', e);
                        }
                      }
                      
                      const userName = log.userName || (log.userId && typeof log.userId === 'object' ? log.userId.userName : null) || log.userEmail || t.userReportPage.noData;
                      
                      return (
                        <tr key={log.id || index}>
                          <td>{userName}</td>
                          <td>
                            <span className={`status-badge ${(log.type || '').toLowerCase()}`}>
                              {(log.type || '').charAt(0).toUpperCase() + (log.type || '').slice(1)}
                            </span>
                          </td>
                          <td>{log.title || t.userReportPage.noData}</td>
                          <td>
                            <span className={`severity-badge ${log.status === 'sent' ? 'info' : log.status === 'failed' ? 'error' : 'warning'}`}>
                              {(log.status || t.userReportPage.noData).toUpperCase()}
                            </span>
                          </td>
                          <td>{dateSentDisplay}</td>
                          <td>{log.relatedItemName || t.userReportPage.noData}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {reminderStats && (
                  <div className="reminder-overview-section">
                    <h3 className="reminder-logs-title">
                      {t.adminReportPage.reminderSystemOverview}
                    </h3>
                    <div className="reminder-overview-container">
                      <p className="reminder-overview-text">
                        <strong>{t.adminReportPage.totalRemindersSentLabel}</strong> {reminderStats.total || 0}
                      </p>
                      <p className="reminder-overview-text">
                        <strong>{t.adminReportPage.successRateLabel}</strong> {reminderStats.successRate || 0}%
                      </p>
                      <p className="reminder-overview-text">
                        <strong>{t.adminReportPage.failedRemindersLabel}</strong> {reminderStats.failed || 0}
                      </p>
                      <p className="reminder-overview-text">
                        <strong>{t.adminReportPage.recentActivity}</strong> {reminderStats.recent || 0} {t.adminReportPage.reminders}
                      </p>
                      <div className="reminder-overview-divider">
                        <p className="reminder-overview-subtitle">
                          {t.adminReportPage.remindersByType}
                        </p>
                        <ul className="reminder-overview-list">
                          <li>{t.adminReportPage.warrantyLabel} {reminderStats.byType?.warranty || 0}</li>
                          <li>{t.adminReportPage.subscriptionLabel} {reminderStats.byType?.subscription || 0}</li>
                          <li>{t.adminReportPage.maintenanceLabel} {reminderStats.byType?.maintenance || 0}</li>
                        </ul>
                      </div>
                      <div className="reminder-overview-note">
                        <p className="reminder-overview-note-text">
                          <strong>{t.adminReportPage.note}</strong> {t.adminReportPage.reminderSystemNote}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {reportType === 'remindersNotifications' && (!reminderLogs || reminderLogs.length === 0) && (
              <div className="empty-state">
                <p>{t.adminReportPage.noReminderLogs}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Live Chat Button */}
      <LiveChatButton />
    </div>
  );
}

export default AdminReportPage;