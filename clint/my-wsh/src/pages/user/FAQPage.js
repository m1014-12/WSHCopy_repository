import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/FAQPage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import UserHeader from '../../components/UserHeader';
import Footer from '../../components/Footer';

function FAQPage() {
    const navigate = useNavigate();
    const { isDarkMode, language, toggleTheme, toggleLanguage } = useThemeLanguage();
    const logo = require('../../components/wshLogo.png');
    const t = translations[language];
    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    const toggleFAQ = (faqId) => {
        setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
    };

    // Demo FAQ data
    const faqs = [
        {
            id: 1,
            category: "general",
            question: t.faq?.general?.q1 || "What is WHS Management System?",
            answer: t.faq?.general?.a1 || "WHS Management System is a comprehensive platform that helps you manage warranties, subscriptions, and home maintenance tasks in one centralized location. It provides reminders, tracking, and organization tools to simplify your life."
        },
        {
            id: 2,
            category: "general",
            question: t.faq?.general?.q2 || "How do I get started with the system?",
            answer: t.faq?.general?.a2 || "Getting started is easy! Simply create an account, log in, and begin adding your warranties, subscriptions, and home maintenance tasks. The system will guide you through the process with helpful tutorials."
        },
        {
            id: 3,
            category: "warranty",
            question: t.faq?.warranty?.q1 || "How do I add a new warranty?",
            answer: t.faq?.warranty?.a1 || "To add a new warranty, go to the Warranty Management section, click 'Add Warranty', and fill in the required information including warranty name, category, expiration date, and any additional details."
        },
        {
            id: 4,
            category: "warranty",
            question: t.faq?.warranty?.q2 || "Can I set reminders for warranty expirations?",
            answer: t.faq?.warranty?.a2 || "Yes! When adding or editing a warranty, you can set reminder dates. The system will notify you before your warranty expires so you can take appropriate action."
        },
        {
            id: 5,
            category: "warranty",
            question: t.faq?.warranty?.q3 || "How do I organize my warranties?",
            answer: t.faq?.warranty?.a3 || "You can organize warranties by categories such as Electronics, Appliances, Furniture, Vehicles, and more. This helps you quickly find and manage related warranties."
        },
        {
            id: 6,
            category: "subscription",
            question: t.faq?.subscription?.q1 || "How do I track my subscriptions?",
            answer: t.faq?.subscription?.a1 || "Add your subscriptions with details like billing cycle, renewal dates, and costs. The system will track your total monthly and annual subscription expenses."
        },
        {
            id: 7,
            category: "subscription",
            question: t.faq?.subscription?.q2 || "Can I set up auto-renewal reminders?",
            answer: t.faq?.subscription?.a2 || "Yes, you can configure auto-renewal settings and receive reminders before subscriptions renew. This helps you decide whether to continue or cancel subscriptions."
        },
        {
            id: 8,
            category: "subscription",
            question: t.faq?.subscription?.q3 || "How do I manage subscription costs?",
            answer: t.faq?.subscription?.a3 || "The system provides cost tracking features that show your total subscription expenses. You can view monthly and annual summaries to better manage your budget."
        },
        {
            id: 9,
            category: "home-tasks",
            question: t.faq?.homeTasks?.q1 || "How do I create home maintenance tasks?",
            answer: t.faq?.homeTasks?.a1 || "Go to the Home Maintenance Tasks section, click 'Add Task', and provide details like task name, category, priority, estimated duration, and reminder dates."
        },
        {
            id: 10,
            category: "home-tasks",
            question: t.faq?.homeTasks?.q2 || "Can I set recurring maintenance schedules?",
            answer: t.faq?.homeTasks?.a2 || "Yes, you can set up recurring maintenance schedules for regular tasks like cleaning, inspections, or seasonal maintenance activities."
        },
        {
            id: 11,
            category: "home-tasks",
            question: t.faq?.homeTasks?.q3 || "How do I track task completion?",
            answer: t.faq?.homeTasks?.a3 || "You can mark tasks as completed, in progress, or pending. The system tracks your progress and provides completion statistics."
        },
        {
            id: 12,
            category: "notifications",
            question: t.faq?.notifications?.q1 || "How do I manage my notifications?",
            answer: t.faq?.notifications?.a1 || "Go to the Notifications section to view all your alerts. You can customize notification preferences in your profile settings."
        },
        {
            id: 13,
            category: "notifications",
            question: t.faq?.notifications?.q2 || "Can I receive email notifications?",
            answer: t.faq?.notifications?.a2 || "Yes, you can enable email notifications for important reminders like warranty expirations, subscription renewals, and task deadlines."
        },
        {
            id: 14,
            category: "account",
            question: t.faq?.account?.q1 || "How do I update my profile information?",
            answer: t.faq?.account?.a1 || "Go to your Profile section to update personal information, contact details, and account preferences. Changes are saved automatically."
        },
        {
            id: 15,
            category: "account",
            question: t.faq?.account?.q2 || "Is my data secure?",
            answer: t.faq?.account?.a2 || "Yes, we take data security seriously. Your information is encrypted and stored securely. We never share your personal data with third parties."
        },
        {
            id: 16,
            category: "account",
            question: t.faq?.account?.q3 || "How do I reset my password?",
            answer: t.faq?.account?.a3 || "If you forget your password, use the 'Forgot Password' feature on the login page. You'll receive an email with instructions to reset your password."
        }
    ];

    const categories = [
        { id: 'all', name: t.faq?.categories?.all || 'All Questions' },
        { id: 'general', name: t.faq?.categories?.general || 'General' },
        { id: 'warranty', name: t.faq?.categories?.warranty || 'Warranty' },
        { id: 'subscription', name: t.faq?.categories?.subscription || 'Subscription' },
        { id: 'home-tasks', name: t.faq?.categories?.homeTasks || 'Home Tasks' },
        { id: 'notifications', name: t.faq?.categories?.notifications || 'Notifications' },
        { id: 'account', name: t.faq?.categories?.account || 'Account' }
    ];

    const [selectedCategory, setSelectedCategory] = useState('all');

    const filteredFAQs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'general':
                return <HelpCircle />;
            case 'warranty':
                return <HelpCircle />;
            case 'subscription':
                return <HelpCircle />;
            case 'home-tasks':
                return <HelpCircle />;
            case 'notifications':
                return <HelpCircle />;
            case 'account':
                return <HelpCircle />;
            default:
                return <HelpCircle />;
        }
    };

    return (
        <div className="faq-container">
            <UserHeader />

            {/* Main Content */}
            <div className="faq-content">
                <div className="faq-hero">
                    <h1 className="faq-title">
                        {t.faq?.title || "Frequently Asked Questions"}
                    </h1>
                    <p className="faq-subtitle">
                        {t.faq?.subtitle || "Find answers to common questions about the WHS Management System"}
                    </p>
                </div>

                {/* Search and Filter Section */}
                <div className="faq-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder={t.faq?.searchPlaceholder || "Search questions..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="category-filter">
                        {categories.map(category => (
                            <button
                                key={category.id}
                                className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FAQ List */}
                <div className="faq-list">
                    {filteredFAQs.length > 0 ? (
                        filteredFAQs.map((faq) => (
                            <div key={faq.id} className="faq-item">
                                <div className="faq-question" onClick={() => toggleFAQ(faq.id)}>
                                    <div className="faq-question-content">
                                        <div className="faq-icon">
                                            {getCategoryIcon(faq.category)}
                                        </div>
                                        <h3 className="faq-question-text">{faq.question}</h3>
                                    </div>
                                    <button className="expand-button">
                                        {expandedFAQ === faq.id ? <ChevronUp /> : <ChevronDown />}
                                    </button>
                                </div>
                                {expandedFAQ === faq.id && (
                                    <div className="faq-answer">
                                        <p>{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="no-results">
                            <HelpCircle className="no-results-icon" />
                            <h3>{t.faq?.noResults?.title || "No questions found"}</h3>
                            <p>{t.faq?.noResults?.message || "Try adjusting your search terms or category filter"}</p>
                        </div>
                    )}
                </div>

                {/* Contact Support Section */}
                <div className="contact-support">
                    <h2 className="contact-title">
                        {t.faq?.contact?.title || "Still need help?"}
                    </h2>
                    <p className="contact-message">
                        {t.faq?.contact?.message || "Can't find the answer you're looking for? Our support team is here to help."}
                    </p>
                    <div className="contact-options">
                        <div className="contact-option">
                            <h3>{t.faq?.contact?.email?.title || "Email Support"}</h3>
                            <p>{t.faq?.contact?.email?.description || "Send us an email and we'll get back to you within 24 hours"}</p>
                            <span className="contact-detail">support@whs.com</span>
                        </div>
                        <div className="contact-option">
                            <h3>{t.faq?.contact?.liveChat?.title || "Live Chat"}</h3>
                            <p>{t.faq?.contact?.liveChat?.description || "Chat with our support team in real-time"}</p>
                            <span className="contact-detail">{t.faq?.contact?.liveChat?.availability || "Available 24/7"}</span>
                        </div>
                    </div>
                </div>
            </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default FAQPage; 