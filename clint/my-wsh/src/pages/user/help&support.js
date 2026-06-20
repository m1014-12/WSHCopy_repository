import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/HelpSupportPage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import UserHeader from '../../components/UserHeader';
import Footer from '../../components/Footer';

function HelpSupportPage() {
    const navigate = useNavigate();
    const { isDarkMode, language, toggleTheme, toggleLanguage } = useThemeLanguage();
    const logo = require('../../components/wshLogo.png');
    const t = translations[language];

    const goTohome = () => {
        navigate('/home'); 
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

    const goToAboutUs = () => {
        navigate('/about-us');
    };

    const goToTutorials = () => {
        navigate('/tutorials');
    };

    const goToFAQ = () => {
        navigate('/faq');
    };

    const goToFeedback = () => {
        navigate('/feedback');
    };

    return (
        <div className="help-support-container">
            <UserHeader />

            {/* Help & Support Content */}
            <div className="help-support-content">
                <h2 className="help-support-title">
                    {t.helpSupport?.title || "How may we help you?"}
                </h2>

                {/* About Us */}
                <div className="help-menu-item" onClick={goToAboutUs}>
                    <span>{t.helpSupport?.aboutUs || "About Us"}</span>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* Tutorials */}
                <div className="help-menu-item" onClick={goToTutorials}>
                    <span>{t.helpSupport?.tutorials || "Tutorials"}</span>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* FAQ */}
                <div className="help-menu-item" onClick={goToFAQ}>
                    <span>{t.helpSupport?.faq || "Frequently Asked Questions"}</span>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* Feedback and Review */}
                <div className="help-menu-item" onClick={goToFeedback}>
                    <span>{t.helpSupport?.feedback || "Feedback and Review"}</span>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
            
            {/* Footer */}
            <Footer />
        </div>
    );
}

export default HelpSupportPage;