import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, ChevronDown, ChevronUp, BookOpen, Video, FileText, Bell, User } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/TutorialsPage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import UserHeader from '../../components/UserHeader';
import Footer from '../../components/Footer';

function TutorialsPage() {
    const navigate = useNavigate();
    const { isDarkMode, language, toggleTheme, toggleLanguage } = useThemeLanguage();
    const logo = require('../../components/wshLogo.png');
    const t = translations[language];
    const [expandedTutorial, setExpandedTutorial] = useState(null);

    const goTohome = () => {
        navigate('/home'); 
    };

    const goBack = () => {
        navigate('/help');
    };

    const handleLogout = () => {
        console.log('User logged out');
        navigate('/login');
    };

    const goToProfile = () => {
        navigate('/profile'); 
    };

    const goTonotifications = () => {
        navigate('/notifications'); 
    };

    const toggleTutorial = (tutorialId) => {
        setExpandedTutorial(expandedTutorial === tutorialId ? null : tutorialId);
    };

    const playVideo = (videoId) => {
        // Demo video functionality
        alert(t.tutorials?.videoMessage || `Playing video: ${videoId}`);
    };

    // Demo tutorial data
    const tutorials = [
        {
            id: 1,
            title: t.tutorials?.warrantyManagement?.title || "Warranty Management",
            description: t.tutorials?.warrantyManagement?.description || "Learn how to manage your warranties effectively",
            category: "warranty",
            duration: "5 min",
            difficulty: "Beginner",
            steps: [
                {
                    title: t.tutorials?.warrantyManagement?.step1?.title || "Adding a New Warranty",
                    content: t.tutorials?.warrantyManagement?.step1?.content || "Click the 'Add Warranty' button and fill in the required information including warranty name, category, and reminder date.",
                    videoId: "warranty-add"
                },
                {
                    title: t.tutorials?.warrantyManagement?.step2?.title || "Setting Reminders",
                    content: t.tutorials?.warrantyManagement?.step2?.content || "Configure notification settings to receive timely reminders about warranty expirations.",
                    videoId: "warranty-reminders"
                },
                {
                    title: t.tutorials?.warrantyManagement?.step3?.title || "Managing Categories",
                    content: t.tutorials?.warrantyManagement?.step3?.content || "Organize your warranties by categories like Electronics, Appliances, Furniture, etc.",
                    videoId: "warranty-categories"
                }
            ]
        },
        {
            id: 2,
            title: t.tutorials?.subscriptionManagement?.title || "Subscription Management",
            description: t.tutorials?.subscriptionManagement?.description || "Master subscription tracking and renewal management",
            category: "subscription",
            duration: "7 min",
            difficulty: "Intermediate",
            steps: [
                {
                    title: t.tutorials?.subscriptionManagement?.step1?.title || "Adding Subscriptions",
                    content: t.tutorials?.subscriptionManagement?.step1?.content || "Add your subscriptions with details like billing cycle, auto-renewal settings, and pricing information.",
                    videoId: "subscription-add"
                },
                {
                    title: t.tutorials?.subscriptionManagement?.step2?.title || "Auto-Renewal Settings",
                    content: t.tutorials?.subscriptionManagement?.step2?.content || "Configure auto-renewal preferences and set up payment reminders.",
                    videoId: "subscription-renewal"
                },
                {
                    title: t.tutorials?.subscriptionManagement?.step3?.title || "Cost Tracking",
                    content: t.tutorials?.subscriptionManagement?.step3?.content || "Track your monthly and annual subscription costs to manage your budget effectively.",
                    videoId: "subscription-costs"
                }
            ]
        },
        {
            id: 3,
            title: t.tutorials?.homeTasks?.title || "Home Maintenance Tasks",
            description: t.tutorials?.homeTasks?.description || "Learn to schedule and track home maintenance activities",
            category: "home-tasks",
            duration: "6 min",
            difficulty: "Beginner",
            steps: [
                {
                    title: t.tutorials?.homeTasks?.step1?.title || "Creating Tasks",
                    content: t.tutorials?.homeTasks?.step1?.content || "Create new maintenance tasks with priority levels, estimated duration, and cost estimates.",
                    videoId: "tasks-create"
                },
                {
                    title: t.tutorials?.homeTasks?.step2?.title || "Task Scheduling",
                    content: t.tutorials?.homeTasks?.step2?.content || "Schedule tasks with reminders and set up recurring maintenance schedules.",
                    videoId: "tasks-schedule"
                },
                {
                    title: t.tutorials?.homeTasks?.step3?.title || "Progress Tracking",
                    content: t.tutorials?.homeTasks?.step3?.content || "Track task completion status and update progress as you work on maintenance activities.",
                    videoId: "tasks-progress"
                }
            ]
        },
        {
            id: 4,
            title: t.tutorials?.notifications?.title || "Notification System",
            description: t.tutorials?.notifications?.description || "Configure and manage your notification preferences",
            category: "notifications",
            duration: "4 min",
            difficulty: "Beginner",
            steps: [
                {
                    title: t.tutorials?.notifications?.step1?.title || "Notification Settings",
                    content: t.tutorials?.notifications?.step1?.content || "Customize your notification preferences for different types of reminders and alerts.",
                    videoId: "notifications-settings"
                },
                {
                    title: t.tutorials?.notifications?.step2?.title || "Email Notifications",
                    content: t.tutorials?.notifications?.step2?.content || "Set up email notifications for important reminders and system updates.",
                    videoId: "notifications-email"
                }
            ]
        },
        {
            id: 5,
            title: t.tutorials?.profile?.title || "Profile Management",
            description: t.tutorials?.profile?.description || "Manage your account settings and personal information",
            category: "profile",
            duration: "3 min",
            difficulty: "Beginner",
            steps: [
                {
                    title: t.tutorials?.profile?.step1?.title || "Updating Information",
                    content: t.tutorials?.profile?.step1?.content || "Update your personal information, contact details, and account preferences.",
                    videoId: "profile-update"
                },
                {
                    title: t.tutorials?.profile?.step2?.title || "Security Settings",
                    content: t.tutorials?.profile?.step2?.content || "Manage your password, security settings, and privacy preferences.",
                    videoId: "profile-security"
                }
            ]
        }
    ];

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'warranty':
                return <BookOpen />;
            case 'subscription':
                return <Video />;
            case 'home-tasks':
                return <FileText />;
            case 'notifications':
                return <Bell />;
            case 'profile':
                return <User />;
            default:
                return <BookOpen />;
        }
    };

    return (
        <div className="tutorials-container">
            <UserHeader />


            {/* Main Content */}
            <div className="tutorials-content">
                <div className="tutorials-hero">
                    <h1 className="tutorials-title">
                        {t.tutorials?.title || "Tutorials"}
                    </h1>
                    <p className="tutorials-subtitle">
                        {t.tutorials?.subtitle || "Learn how to use the WHS Management System effectively with our step-by-step tutorials"}
                    </p>
                </div>

                <div className="tutorials-grid">
                    {tutorials.map((tutorial) => (
                        <div key={tutorial.id} className="tutorial-card">
                            <div className="tutorial-header" onClick={() => toggleTutorial(tutorial.id)}>
                                <div className="tutorial-info">
                                    <div className="tutorial-icon">
                                        {getCategoryIcon(tutorial.category)}
                                    </div>
                                    <div className="tutorial-details">
                                        <h3 className="tutorial-title">{tutorial.title}</h3>
                                        <p className="tutorial-description">{tutorial.description}</p>
                                        <div className="tutorial-meta">
                                            <span className="tutorial-duration">{tutorial.duration}</span>
                                            <span className="tutorial-difficulty">{tutorial.difficulty}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="expand-button">
                                    {expandedTutorial === tutorial.id ? <ChevronUp /> : <ChevronDown />}
                                </button>
                            </div>

                            {expandedTutorial === tutorial.id && (
                                <div className="tutorial-steps">
                                    {tutorial.steps.map((step, index) => (
                                        <div key={index} className="tutorial-step">
                                            <div className="step-header">
                                                <span className="step-number">{index + 1}</span>
                                                <h4 className="step-title">{step.title}</h4>
                                                <button 
                                                    className="play-button"
                                                    onClick={() => playVideo(step.videoId)}
                                                >
                                                    <Play />
                                                </button>
                                            </div>
                                            <p className="step-content">{step.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Quick Tips Section */}
                <div className="quick-tips-section">
                    <h2 className="tips-title">
                        {t.tutorials?.quickTips?.title || "Quick Tips"}
                    </h2>
                    <div className="tips-grid">
                        <div className="tip-item">
                            <h3>{t.tutorials?.quickTips?.tip1?.title || "Use Categories"}</h3>
                            <p>{t.tutorials?.quickTips?.tip1?.content || "Organize your items using categories for better management and easier searching."}</p>
                        </div>
                        <div className="tip-item">
                            <h3>{t.tutorials?.quickTips?.tip2?.title || "Set Reminders"}</h3>
                            <p>{t.tutorials?.quickTips?.tip2?.content || "Always set reminders for important dates to avoid missing warranty expirations or subscription renewals."}</p>
                        </div>
                        <div className="tip-item">
                            <h3>{t.tutorials?.quickTips?.tip3?.title || "Regular Updates"}</h3>
                            <p>{t.tutorials?.quickTips?.tip3?.content || "Keep your information updated regularly to ensure accurate tracking and notifications."}</p>
                        </div>
                    </div>
                </div>
            </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default TutorialsPage; 