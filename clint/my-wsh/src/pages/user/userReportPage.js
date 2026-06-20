import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import UserHeader from '../../components/UserHeader';
import LiveChatButton from '../../components/LiveChatButton';
import Footer from '../../components/Footer';
import api from '../../utils/api';
import '../../css/UserReportPage.css';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

function UserReportPage() {
    const navigate = useNavigate();
  const { isDarkMode, language } = useThemeLanguage();
  const t = translations[language];

  // State for report data
  const [reportData, setReportData] = useState({
    warranties: [],
    subscriptions: [],
    tasks: [],
    userStats: {
      totalWarranties: 0,
      totalSubscriptions: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      expiringSoon: 0,
      overdueTasks: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load report data
  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        navigate('/login');
        return;
      }

      // Load all user data
      const [warrantiesResponse, subscriptionsResponse, tasksResponse] = await Promise.all([
        api.get('/getWarranty'),
        api.get('/getSubscriptions'),
        api.get('/getHomeTasks')
      ]);

      const warranties = warrantiesResponse.data.warranty || [];
      const subscriptions = subscriptionsResponse.data.subscriptions || [];
      const tasks = tasksResponse.data.homeTasks || [];

      // Calculate statistics
      const completedTasks = tasks.filter(task => task.homeTaskCompleted).length;
      const pendingTasks = tasks.filter(task => !task.homeTaskCompleted).length;
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const fiveDaysFromNow = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
      const expiringSoon = warranties.filter(warranty => {
        const expiryDate = new Date(warranty.warrantyExpirationDate);
        return expiryDate >= now && expiryDate <= fiveDaysFromNow;
      }).length;
      
      // Calculate overdue tasks
      const overdueTasks = tasks.filter(task => {
        if (task.homeTaskCompleted) return false;
        const reminderDate = new Date(task.homeTaskReminderDate);
        reminderDate.setHours(0, 0, 0, 0);
        return reminderDate < now;
      }).length;

      setReportData({
        warranties,
        subscriptions,
        tasks,
        userStats: {
          totalWarranties: warranties.length,
          totalSubscriptions: subscriptions.length,
          totalTasks: tasks.length,
          completedTasks,
          pendingTasks,
          expiringSoon,
          overdueTasks
        }
      });

    } catch (error) {
      console.error('Error loading report data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    generatePDFReport();
  };

  const generatePDFReport = () => {
    const { userStats, warranties, subscriptions, tasks } = reportData;
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    const categoryStats = getCategoryStats();

    // Create new PDF document
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(t.userReportPage.title, 105, yPosition, { align: 'center' });
    yPosition += 10;

    // Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.userReportPage.generatedOn}: ${currentDate} ${t.userReportPage.at} ${currentTime}`, 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Overview Statistics Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(t.userReportPage.overviewStatistics, 14, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Statistics table
    const statsData = [
      [t.userReportPage.totalWarranties, userStats.totalWarranties.toString()],
      [t.userReportPage.totalSubscriptions, userStats.totalSubscriptions.toString()],
      [t.userReportPage.totalTasks, userStats.totalTasks.toString()],
      [t.userReportPage.completedTasks, userStats.completedTasks.toString()],
      [t.userReportPage.pendingTasks, userStats.pendingTasks.toString()],
      [t.userReportPage.expiringSoon, userStats.expiringSoon.toString()],
      [t.userReportPage.overdueTasks, userStats.overdueTasks.toString()]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [[t.userReportPage.metric, t.userReportPage.value]],
      body: statsData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Category Breakdown Section
    if (Object.keys(categoryStats.warrantyCategories).length > 0 || 
        Object.keys(categoryStats.subscriptionCategories).length > 0 || 
        Object.keys(categoryStats.taskCategories).length > 0) {
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(t.userReportPage.categoryBreakdown, 14, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Warranty Categories
      if (Object.keys(categoryStats.warrantyCategories).length > 0) {
        const warrantyCatData = Object.entries(categoryStats.warrantyCategories).map(([cat, count]) => [cat, count.toString()]);
        autoTable(doc, {
          startY: yPosition,
          head: [[t.userReportPage.warrantyCategories, t.userReportPage.count]],
          body: warrantyCatData,
          theme: 'striped',
          headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Subscription Categories
      if (Object.keys(categoryStats.subscriptionCategories).length > 0) {
        const subscriptionCatData = Object.entries(categoryStats.subscriptionCategories).map(([cat, count]) => [cat, count.toString()]);
        autoTable(doc, {
          startY: yPosition,
          head: [[t.userReportPage.subscriptionCategories, t.userReportPage.count]],
          body: subscriptionCatData,
          theme: 'striped',
          headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 }
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Task Categories
      if (Object.keys(categoryStats.taskCategories).length > 0) {
        const taskCatData = Object.entries(categoryStats.taskCategories).map(([cat, count]) => [cat, count.toString()]);
        autoTable(doc, {
          startY: yPosition,
          head: [[t.userReportPage.taskCategories, t.userReportPage.count]],
          body: taskCatData,
          theme: 'striped',
          headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }
    }

    // Detailed Information Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(t.userReportPage.detailedInformation, 14, yPosition);
    yPosition += 8;

    // Warranties Table
    if (warranties.length > 0) {
      const warrantyData = warranties.map(w => [
        w.warrantyName || 'N/A',
        w.warrantyCategory || 'N/A',
        new Date(w.warrantyExpirationDate).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [[t.userReportPage.warrantyName, t.userReportPage.category, t.userReportPage.expirationDate]],
        body: warrantyData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 50 },
          2: { cellWidth: 50 }
        }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Subscriptions Table
    if (subscriptions.length > 0) {
      const subscriptionData = subscriptions.map(s => [
        s.subscriptionName || 'N/A',
        s.subscriptionCategory || 'N/A',
        `$${s.subscriptionPrice || '0'}`,
        new Date(s.subscriptionRenewalDate).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [[t.userReportPage.subscriptionName, t.userReportPage.category, t.userReportPage.price, t.userReportPage.renewalDate]],
        body: subscriptionData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 50 }
        }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Tasks Table
    if (tasks.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const taskData = tasks.map(task => {
        let status = task.homeTaskCompleted ? t.userReportPage.completed : t.userReportPage.pending;
        if (!task.homeTaskCompleted) {
          const reminderDate = new Date(task.homeTaskReminderDate);
          reminderDate.setHours(0, 0, 0, 0);
          if (reminderDate < now) {
            status = t.userReportPage.overdue;
          }
        }
        return [
          task.homeTaskName || t.userReportPage.noData,
          task.homeTaskCategory || t.userReportPage.noData,
          status,
          task.homeTaskPriority || t.userReportPage.noData
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [[t.userReportPage.taskName, t.userReportPage.category, t.userReportPage.status, t.userReportPage.priority]],
        body: taskData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 }
        }
      });
    }

    // Save the PDF
    const fileName = `user-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getCategoryStats = () => {
    const { warranties, subscriptions, tasks } = reportData;
    
    const warrantyCategories = {};
    warranties.forEach(w => {
      warrantyCategories[w.warrantyCategory] = (warrantyCategories[w.warrantyCategory] || 0) + 1;
    });

    const subscriptionCategories = {};
    subscriptions.forEach(s => {
      subscriptionCategories[s.subscriptionCategory] = (subscriptionCategories[s.subscriptionCategory] || 0) + 1;
    });

    const taskCategories = {};
    tasks.forEach(t => {
      taskCategories[t.homeTaskCategory] = (taskCategories[t.homeTaskCategory] || 0) + 1;
    });

    return { warrantyCategories, subscriptionCategories, taskCategories };
  };

  if (isLoading) {
    return (
      <div className={`user-report-page ${isDarkMode ? 'dark' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <UserHeader />
        <main className="report-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t.userReportPage.loadingReport}</p>
          </div>
        </main>
      </div>
    );
  }

  const { userStats } = reportData;
  const categoryStats = getCategoryStats();

  return (
    <div className={`user-report-page ${isDarkMode ? 'dark' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <UserHeader />

      <main className="report-main">
        {/* Header */}
        <div className="report-header">
          <h1 className="report-title">
            <span className="title-icon">📊</span>
            {t.userReportPage.title}
          </h1>
          <div className="report-actions">
            <button 
              className="export-btn"
              onClick={handleExportReport}
            >
              <Download className="btn-icon" />
              {t.userReportPage.exportReport}
            </button>
          </div>
        </div>

        {/* Overview Statistics */}
        <div className="stats-section">
          <h2 className="section-title">
            <span className="section-icon">📈</span>
            {t.userReportPage.overviewStatistics}
          </h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🛡️</div>
              <div className="stat-content">
                <div className="stat-number">{userStats.totalWarranties}</div>
                <div className="stat-label">{t.userReportPage.totalWarranties}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💳</div>
              <div className="stat-content">
                <div className="stat-number">{userStats.totalSubscriptions}</div>
                <div className="stat-label">{t.userReportPage.totalSubscriptions}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔧</div>
              <div className="stat-content">
                <div className="stat-number">{userStats.totalTasks}</div>
                <div className="stat-label">{t.userReportPage.totalTasks}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{userStats.completedTasks}</div>
                <div className="stat-label">{t.userReportPage.completedTasks}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-number">{userStats.pendingTasks}</div>
                <div className="stat-label">{t.userReportPage.pendingTasks}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <div className="stat-number">{userStats.expiringSoon}</div>
                <div className="stat-label">{t.userReportPage.expiringSoon}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚨</div>
              <div className="stat-content">
                <div className="stat-number">{userStats.overdueTasks}</div>
                <div className="stat-label">{t.userReportPage.overdueTasks}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="category-section">
          <h2 className="section-title">
            <span className="section-icon">📋</span>
            {t.userReportPage.categoryBreakdown}
          </h2>
          <div className="category-grid">
            <div className="category-card">
              <h3>{t.userReportPage.warrantyCategories}</h3>
              <div className="category-list">
                {Object.entries(categoryStats.warrantyCategories).map(([category, count]) => (
                  <div key={category} className="category-item">
                    <span className="category-name">{category}</span>
                    <span className="category-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="category-card">
              <h3>{t.userReportPage.subscriptionCategories}</h3>
              <div className="category-list">
                {Object.entries(categoryStats.subscriptionCategories).map(([category, count]) => (
                  <div key={category} className="category-item">
                    <span className="category-name">{category}</span>
                    <span className="category-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="category-card">
              <h3>{t.userReportPage.taskCategories}</h3>
              <div className="category-list">
                {Object.entries(categoryStats.taskCategories).map(([category, count]) => (
                  <div key={category} className="category-item">
                    <span className="category-name">{category}</span>
                    <span className="category-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>

        {/* Detailed Lists */}
        <div className="details-section">
          <h2 className="section-title">
            <span className="section-icon">📝</span>
            {t.userReportPage.detailedInformation}
          </h2>
          <div className="details-grid">
            <div className="details-card">
              <h3>{t.userReportPage.warranties}</h3>
              <div className="details-list">
                {reportData.warranties.map(warranty => (
                  <div key={warranty._id} className="detail-item">
                    <div className="detail-name">{warranty.warrantyName}</div>
                    <div className="detail-info">
                      <span className="detail-category">{warranty.warrantyCategory}</span>
                      <span className="detail-date">{t.userReportPage.expires}: {new Date(warranty.warrantyExpirationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="details-card">
              <h3>{t.userReportPage.subscriptions}</h3>
              <div className="details-list">
                {reportData.subscriptions.map(subscription => (
                  <div key={subscription._id} className="detail-item">
                    <div className="detail-name">{subscription.subscriptionName}</div>
                    <div className="detail-info">
                      <span className="detail-category">{subscription.subscriptionCategory}</span>
                      <span className="detail-price">${subscription.subscriptionPrice}</span>
                      <span className="detail-date">{t.userReportPage.renewal}: {new Date(subscription.subscriptionRenewalDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="details-card">
              <h3>{t.userReportPage.tasks}</h3>
              <div className="details-list">
                {reportData.tasks.map(task => {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  let status = task.homeTaskCompleted ? t.userReportPage.completed : t.userReportPage.pending;
                  let statusClass = task.homeTaskCompleted ? 'completed' : 'pending';
                  if (!task.homeTaskCompleted) {
                    const reminderDate = new Date(task.homeTaskReminderDate);
                    reminderDate.setHours(0, 0, 0, 0);
                    if (reminderDate < now) {
                      status = t.userReportPage.overdue;
                      statusClass = 'overdue';
                    }
                  }
                  return (
                    <div key={task._id} className="detail-item">
                      <div className="detail-name">{task.homeTaskName}</div>
                      <div className="detail-info">
                        <span className="detail-category">{task.homeTaskCategory}</span>
                        <span className={`detail-status ${statusClass}`}>
                          {status}
                        </span>
                        <span className="detail-priority">{task.homeTaskPriority}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
      </div>
      </main>
    
      <LiveChatButton />
    <Footer />
  </div>
  );
}

export default UserReportPage;