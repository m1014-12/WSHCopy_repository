import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/HomeTasksPage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import UserHeader from '../../components/UserHeader';
import LiveChatButton from '../../components/LiveChatButton';
import Footer from '../../components/Footer';
import api from '../../utils/api';

// Predefined list of main cities in Oman
const LOCATIONS = [
    'Muscat',
    'Salalah',
    'Sohar',
    'Sur',
    'Nizwa',
    'Ibri',
    'Rustaq',
    'Bahla',
    'Buraimi',
    'Khasab',
    'Duqm',
    'Ibra',
    'Barka',
    'Seeb',
    'Muttrah',
    'Quriyat',
    'Al Buraimi',
    'Al Khaburah',
    'Al Suwaiq',
    'Al Mudhaibi',
    'Adam',
    'Bidbid',
    'Izki',
    'Samail',
    'Al Hamra',
    'Other'
];

function HomeMaintenanceTasksPage() {
    const navigate = useNavigate();
    const { isDarkMode, language } = useThemeLanguage();
    const t = translations[language];

    // State management
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [serviceProviders, setServiceProviders] = useState([]);
    const [loadingServiceProviders, setLoadingServiceProviders] = useState(false);
    // API_URL removed as we're using the api utility now

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        location: '',
        reminderDate: '',
        description: '',
        priority: 'medium',
        estimatedDuration: 1,
        cost: 0,
        serviceProviderId: ''
    });

    // Load tasks from server
    useEffect(() => {
        loadTasks();
        loadCategories();
    }, []);

    // Load categories from API
    const loadCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await api.get('/categories/homeTask');
            if (response.data.success) {
                setCategories(response.data.categories);
            } else {
                console.error('Failed to load categories:', response.data.message);
                setCategories([]);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    // Load service providers filtered by category and location
    const loadServiceProviders = async (category, location) => {
        if (!category || !location) {
            setServiceProviders([]);
            return;
        }
        
        try {
            setLoadingServiceProviders(true);
            const response = await api.get('/service-providers', {
                params: { category, location }
            });
            if (response.data.success) {
                setServiceProviders(response.data.serviceProviders);
            } else {
                console.error('Failed to load service providers:', response.data.message);
                setServiceProviders([]);
            }
        } catch (error) {
            console.error('Error loading service providers:', error);
            setServiceProviders([]);
        } finally {
            setLoadingServiceProviders(false);
        }
    };

    const loadTasks = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/getHomeTasks');
            const loadedTasks = response.data.homeTasks || [];
            console.log('Loaded tasks:', loadedTasks);
            
            // Check for overdue tasks and update their status
            const updatedTasks = await checkAndUpdateOverdueTasks(loadedTasks);
            setTasks(updatedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    const checkAndUpdateOverdueTasks = async (tasks) => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const updatedTasks = [...tasks];
        
        for (let i = 0; i < updatedTasks.length; i++) {
            const task = updatedTasks[i];
            const taskDate = task.homeTaskReminderDate || task.reminderDate;
            const isCompleted = task.homeTaskCompleted || task.completed;
            const currentStatus = task.homeTaskStatus || task.status;
            
            if (taskDate && !isCompleted && currentStatus !== 'overdue') {
                // Normalize task date
                let taskDateStr;
                if (typeof taskDate === 'string') {
                    taskDateStr = taskDate.split('T')[0];
                } else {
                    taskDateStr = new Date(taskDate).toISOString().split('T')[0];
                }
                
                // Check if task is overdue
                if (taskDateStr < todayStr) {
                    try {
                        // Update task status to overdue
                        await api.put(`/updateHomeTask/${task._id || task.id}`, {
                            homeTaskName: task.homeTaskName || task.name,
                            homeTaskCategory: task.homeTaskCategory || task.category,
                            homeTaskReminderDate: task.homeTaskReminderDate || task.reminderDate,
                            homeTaskNotification: task.homeTaskNotification || task.notification,
                            homeTaskDescription: task.homeTaskDescription || task.description,
                            homeTaskPriority: task.homeTaskPriority || task.priority,
                            homeTaskEstimatedDuration: task.homeTaskEstimatedDuration || task.estimatedDuration,
                            homeTaskCost: task.homeTaskCost || task.cost,
                            homeTaskStatus: 'overdue',
                            homeTaskCompleted: false
                        });
                        
                        // Update local task status
                        updatedTasks[i] = {
                            ...task,
                            homeTaskStatus: 'overdue',
                            status: 'overdue'
                        };
                        
                        console.log(`Task "${task.homeTaskName || task.name}" marked as overdue`);
                    } catch (error) {
                        console.error('Error updating overdue task:', error);
                    }
                }
            }
        }
        
        return updatedTasks;
    };

    const addTask = async (taskData) => {
        try {
            setIsLoading(true);
            const response = await api.post('/addHomeTask', {
                homeTaskName: taskData.name,
                homeTaskCategory: taskData.category,
                homeTaskReminderDate: taskData.reminderDate,
                homeTaskNotification: taskData.description || '',
                homeTaskDescription: taskData.description || '',
                homeTaskPriority: taskData.priority,
                homeTaskEstimatedDuration: taskData.estimatedDuration,
                homeTaskCost: taskData.cost || 0,
                homeTaskStatus: 'pending',
                homeTaskCompleted: false,
                serviceProviderId: taskData.serviceProviderId || null
            });
            if (response.data.message) {
                alert(t.homeTasksPage.messages.taskAdded);
                loadTasks(); // Reload the list
            }
        } catch (error) {
            console.error('Error adding task:', error);
            alert(t.homeTasksPage.errorAddingTask);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTask = async (taskData, taskId) => {
        try {
            setIsLoading(true);
            const response = await api.put(`/updateHomeTask/${taskId}`, {
                homeTaskName: taskData.name,
                homeTaskCategory: taskData.category,
                homeTaskReminderDate: taskData.reminderDate,
                homeTaskNotification: taskData.description || '',
                homeTaskDescription: taskData.description || '',
                homeTaskPriority: taskData.priority,
                homeTaskEstimatedDuration: taskData.estimatedDuration,
                homeTaskCost: taskData.cost || 0,
                homeTaskStatus: taskData.status || 'pending',
                homeTaskCompleted: taskData.completed || false,
                serviceProviderId: taskData.serviceProviderId || null
            });
            if (response.data.message) {
                alert(t.homeTasksPage.messages.taskUpdated);
                loadTasks(); // Reload the list
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert(t.homeTasksPage.errorUpdatingTask);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            setIsLoading(true);
            const response = await api.delete(`/deleteHomeTask/${taskId}`);
            if (response.data.message) {
                alert(t.homeTasksPage.messages.taskDeleted);
                loadTasks(); // Reload the list
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            alert(t.homeTasksPage.errorDeletingTask);
        } finally {
            setIsLoading(false);
        }
    };

    // Calendar functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        return { daysInMonth, startingDay };
    };

    const getTasksForDate = (date) => {
        // Create date string in YYYY-MM-DD format without timezone conversion
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const filteredTasks = tasks.filter(task => {
            const taskDate = task.homeTaskReminderDate || task.reminderDate;
            if (!taskDate) return false;
            
            // Exclude completed tasks from calendar
            const isCompleted = task.homeTaskCompleted || task.completed;
            if (isCompleted) return false;
            
            // Normalize the task date (handle both string and Date objects)
            let taskDateStr;
            if (typeof taskDate === 'string') {
                // If it's already in YYYY-MM-DD format, use it directly
                if (taskDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    taskDateStr = taskDate;
                } else {
                    // If it has time info, extract just the date part
                    taskDateStr = taskDate.split('T')[0];
                }
            } else {
                // For Date objects, create YYYY-MM-DD string without timezone conversion
                const taskYear = taskDate.getFullYear();
                const taskMonth = String(taskDate.getMonth() + 1).padStart(2, '0');
                const taskDay = String(taskDate.getDate()).padStart(2, '0');
                taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`;
            }
            
            return taskDateStr === dateStr;
        });
        
        if (filteredTasks.length > 0) {
            console.log(`Tasks found for ${dateStr}:`, filteredTasks);
        }
        
        return filteredTasks;
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && 
               currentDate.getMonth() === today.getMonth() && 
               currentDate.getFullYear() === today.getFullYear();
    };

    const hasTaskOnDate = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return getTasksForDate(date).length > 0;
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Task management functions
    const openAddModal = () => {
        setModalType('add');
        setFormData({
            name: '',
            category: '',
            location: '',
            reminderDate: '',
            description: '',
            priority: 'medium',
            estimatedDuration: 1,
            cost: 0,
            serviceProviderId: ''
        });
        setServiceProviders([]);
        setShowModal(true);
    };

    const openEditModal = (task) => {
        // Format dates for HTML date inputs (YYYY-MM-DD)
        const formatDateForInput = (dateValue) => {
            if (!dateValue) return '';
            const date = new Date(dateValue);
            return date.toISOString().split('T')[0];
        };

        setModalType('edit');
        setSelectedTask(task);
        const taskCategory = task.homeTaskCategory || task.category;
        const taskLocation = task.location || '';
        setFormData({
            name: task.homeTaskName || task.name,
            category: taskCategory,
            location: taskLocation,
            reminderDate: formatDateForInput(task.homeTaskReminderDate || task.reminderDate),
            description: task.homeTaskDescription || task.description,
            priority: task.homeTaskPriority || task.priority,
            estimatedDuration: task.homeTaskEstimatedDuration || task.estimatedDuration,
            cost: task.homeTaskCost || task.cost,
            serviceProviderId: task.serviceProviderId || ''
        });
        // Load service providers if category and location are available
        if (taskCategory && taskLocation) {
            loadServiceProviders(taskCategory, taskLocation);
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedTask(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: value
            };
            
            // If category or location changes, reload service providers
            if (name === 'category' || name === 'location') {
                // Reset service provider selection when category or location changes
                updated.serviceProviderId = '';
                
                // Load service providers when both category and location are available
                if (updated.category && updated.location) {
                    loadServiceProviders(updated.category, updated.location);
                } else {
                    setServiceProviders([]);
                }
            }
            
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.category || !formData.reminderDate) {
            alert(t.homeTasksPage.messages.fillRequiredFields);
            return;
        }

        const taskData = {
            ...formData,
            description: formData.description || '',
            cost: parseFloat(formData.cost) || 0,
            estimatedDuration: parseInt(formData.estimatedDuration) || 1
        };

        if (modalType === 'add') {
            await addTask(taskData);
        } else {
            await updateTask(taskData, selectedTask._id || selectedTask.id);
        }
        
        closeModal();
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm(t.homeTasksPage.messages.confirmDelete)) {
            await deleteTask(taskId);
        }
    };

    const toggleTaskStatus = async (task) => {
        const newCompleted = !(task.homeTaskCompleted || task.completed);
        const newStatus = newCompleted ? 'completed' : 'pending';
        
        await updateTask({
            name: task.homeTaskName || task.name,
            category: task.homeTaskCategory || task.category,
            reminderDate: task.homeTaskReminderDate || task.reminderDate,
            description: task.homeTaskDescription || task.description,
            priority: task.homeTaskPriority || task.priority,
            estimatedDuration: task.homeTaskEstimatedDuration || task.estimatedDuration,
            cost: task.homeTaskCost || task.cost,
            status: newStatus,
            completed: newCompleted
        }, task._id || task.id);
    };

    // Calendar rendering
    const renderCalendar = () => {
        const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const arabicMonthNames = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        const days = [];
        const prevMonthDays = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)).daysInMonth;
        
        // Previous month days
        for (let i = startingDay - 1; i >= 0; i--) {
            days.push(<td key={`prev-${i}`} className="other-month">{prevMonthDays - i}</td>);
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const isTodayClass = isToday(day) ? 'today' : '';
            const hasTaskClass = hasTaskOnDate(day) ? 'has-task' : '';
            const className = `${isTodayClass} ${hasTaskClass}`.trim();
            
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayTasks = getTasksForDate(date);
            
            days.push(
                <td 
                    key={day} 
                    className={className}
                    onClick={() => {
                        if (dayTasks.length > 0) {
                            setSelectedTask(dayTasks[0]);
                        }
                    }}
                    style={{ cursor: dayTasks.length > 0 ? 'pointer' : 'default' }}
                    title={dayTasks.length > 0 ? dayTasks.map(t => t.homeTaskName || t.name).join(', ') : ''}
                >
                    {day}
                    {dayTasks.length > 0 && (
                        <div style={{ fontSize: '8px', color: '#007bff', marginTop: '2px' }}>
                            {dayTasks.length} {language === 'ar' ? 'مهمة' : 'task'}
                        </div>
                    )}
                </td>
            );
        }
        
        // Next month days
        const remainingDays = 42 - days.length; // 6 rows * 7 days
        for (let day = 1; day <= remainingDays; day++) {
            days.push(<td key={`next-${day}`} className="other-month">{day}</td>);
        }

        return (
            <div className="calendar-section">
                <div className="calendar-header">
                    <ChevronLeft className="calendar-nav" onClick={prevMonth} />
                    <h3 className="calendar-title">
                        {language === 'ar' 
                            ? `${arabicMonthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                            : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        }
                    </h3>
                    <ChevronRight className="calendar-nav" onClick={nextMonth} />
                </div>
                <table className="calendar-table">
                    <thead>
                        <tr>
                            <th>{language === 'ar' ? 'أحد' : 'Sun'}</th>
                            <th>{language === 'ar' ? 'اثنين' : 'Mon'}</th>
                            <th>{language === 'ar' ? 'ثلاثاء' : 'Tue'}</th>
                            <th>{language === 'ar' ? 'أربعاء' : 'Wed'}</th>
                            <th>{language === 'ar' ? 'خميس' : 'Thu'}</th>
                            <th>{language === 'ar' ? 'جمعة' : 'Fri'}</th>
                            <th>{language === 'ar' ? 'سبت' : 'Sat'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 6 }, (_, row) => (
                            <tr key={row}>
                                {days.slice(row * 7, (row + 1) * 7)}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {selectedTask ? (
                    <p className="calendar-status">
                        {selectedTask.homeTaskName || selectedTask.name} - {t.homeTasksPage.categories[selectedTask.homeTaskCategory || selectedTask.category]}
                    </p>
                ) : (
                    <p className="calendar-status">{t.homeTasksPage.calendar.unfinished}</p>
                )}
            </div>
        );
    };

    return (
        <div className="home-tasks-container" data-theme={isDarkMode ? 'dark' : 'light'} data-language={language}>
            <UserHeader />



            {/* Main Content */}
            <div className="home-tasks-content">
                <h2 className="home-tasks-title">{t.homeTasksPage.title}</h2>

                <div className="tasks-grid">
                    {/* Calendar */}
                    {renderCalendar()}

                    {/* Tasks List */}
                    <div className="tasks-list-section">
                        <h3 className="section-title">
                            {t.homeTasksPage.homeTasksList}
                            <span className="tasks-count">{tasks.length}</span>
                        </h3>
                        <ul className="tasks-list">
                            {tasks.length === 0 ? (
                                <li className="task-item">{t.homeTasksPage.noTasks}</li>
                            ) : (
                                // Sort tasks: pending first, completed last
                                [...tasks].sort((a, b) => {
                                    const aCompleted = a.homeTaskCompleted || a.completed;
                                    const bCompleted = b.homeTaskCompleted || b.completed;
                                    if (aCompleted && !bCompleted) return 1;
                                    if (!aCompleted && bCompleted) return -1;
                                    return 0;
                                }).map(task => {
                                    const isCompleted = task.homeTaskCompleted || task.completed;
                                    const taskStatus = task.homeTaskStatus || task.status;
                                    const isOverdue = taskStatus === 'overdue';
                                    
                                    return (
                                        <li key={task._id || task.id} className={`task-item ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
                                            <div>
                                                <strong>{task.homeTaskName || task.name}</strong>
                                                {isOverdue && <span className="overdue-badge">OVERDUE</span>}
                                                <br />
                                                <small>{t.homeTasksPage.categories[task.homeTaskCategory || task.category]} - {task.homeTaskReminderDate || task.reminderDate}</small>
                                            </div>
                                            <div className="task-actions">
                                                {!isCompleted && (
                                                    <button 
                                                        className="task-action-btn" 
                                                        onClick={() => toggleTaskStatus(task)}
                                                        title={t.homeTasksPage.actions.complete}
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                                {!isCompleted && (
                                                    <button 
                                                        className="task-action-btn" 
                                                        onClick={() => openEditModal(task)}
                                                        title={t.homeTasksPage.actions.edit}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                <button 
                                                    className="task-action-btn" 
                                                    onClick={() => handleDeleteTask(task._id || task.id)}
                                                    title={t.homeTasksPage.actions.delete}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button className="action-btn" onClick={openAddModal}>
                        <Plus className="action-btn-icon" />
                        {t.homeTasksPage.addHomeTask}
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modalType === 'add' ? (
                                    <>
                                        <Plus size={20} />
                                        {t.homeTasksPage.addHomeTask}
                                    </>
                                ) : (
                                    <>
                                        <Edit size={20} />
                                        {t.homeTasksPage.updateHomeTask}
                                    </>
                                )}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>{t.homeTasksPage.form.name} *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={language === 'ar' ? 'أدخل اسم المهمة' : 'Enter task name'}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.homeTasksPage.form.category} *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loadingCategories}
                                >
                                    <option value="">{loadingCategories ? t.homeTasksPage.loadingCategories : t.homeTasksPage.selectCategory}</option>
                                    {categories.length > 0 ? (
                                        categories.map((category) => (
                                            <optgroup key={category.id} label={category.name}>
                                                <option value={category.name}>{category.name}</option>
                                                {category.subcategories && category.subcategories.map((sub) => (
                                                    <option key={sub.id} value={sub.name}>
                                                        ↳ {sub.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))
                                    ) : (
                                        Object.entries(t.homeTasksPage.categories).map(([key, value]) => (
                                            <option key={key} value={key}>{value}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t.homeTasksPage.form.location} *</label>
                                <select
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">{t.homeTasksPage.selectLocation}</option>
                                    {LOCATIONS.map((location) => (
                                        <option key={location} value={location}>
                                            {location}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t.homeTasksPage.form.serviceProvider}</label>
                                <select
                                    name="serviceProviderId"
                                    value={formData.serviceProviderId}
                                    onChange={handleInputChange}
                                    disabled={!formData.category || !formData.location || loadingServiceProviders}
                                >
                                    <option value="">
                                        {!formData.category || !formData.location
                                            ? t.homeTasksPage.selectCategoryAndLocation
                                            : loadingServiceProviders
                                            ? t.homeTasksPage.loadingServiceProviders
                                            : serviceProviders.length === 0
                                            ? t.homeTasksPage.noServiceProvidersAvailable
                                            : t.homeTasksPage.selectServiceProvider}
                                    </option>
                                    {serviceProviders.map((provider) => (
                                        <option key={provider.id} value={provider.id}>
                                            {provider.name} {provider.phone ? `(${provider.phone})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t.homeTasksPage.form.reminderDate} *</label>
                                <input
                                    type="date"
                                    name="reminderDate"
                                    value={formData.reminderDate}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.homeTasksPage.form.description}</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder={language === 'ar' ? 'أدخل الوصف (اختياري)' : 'Enter description (optional)'}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.homeTasksPage.form.estimatedDuration}</label>
                                <input
                                    type="number"
                                    name="estimatedDuration"
                                    value={formData.estimatedDuration}
                                    onChange={handleInputChange}
                                    min="1"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.homeTasksPage.form.cost}</label>
                                <input
                                    type="number"
                                    name="cost"
                                    value={formData.cost}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="action-btn" onClick={closeModal}>
                                    {t.cancel}
                                </button>
                                <button type="submit" className="action-btn">
                                    {modalType === 'add' ? t.add : t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

      {/* Live Chat Button */}
      <LiveChatButton />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default HomeMaintenanceTasksPage;

