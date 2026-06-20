import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Target, Award, Heart } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/AboutUsPage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import UserHeader from '../../components/UserHeader';
import Footer from '../../components/Footer';

function AboutUsPage() {
    const navigate = useNavigate();
    const { isDarkMode, language, toggleTheme, toggleLanguage } = useThemeLanguage();
    const logo = require('../../components/wshLogo.png');
    const t = translations[language];

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

    return (
        <div className="about-us-container">
            <UserHeader />

            {/* Main Content */}
            <div className="about-us-content">
                <div className="about-us-hero">
                    <h1 className="about-us-title">
                        {t.aboutUs?.title || "About WHS Management System"}
                    </h1>
                    <p className="about-us-subtitle">
                        {t.aboutUs?.subtitle || "Empowering users to manage their warranties, subscriptions, and home maintenance tasks efficiently"}
                    </p>
                </div>

                <div className="about-us-sections">
                    {/* Mission Section */}
                    <section className="about-section">
                        <div className="section-icon">
                            <Target />
                        </div>
                        <h2 className="section-title">
                            {t.aboutUs?.mission?.title || "Our Mission"}
                        </h2>
                        <p className="section-content">
                            {t.aboutUs?.mission?.content || "To provide a comprehensive and user-friendly platform that helps individuals and families manage their warranties, subscriptions, and home maintenance tasks in one centralized location. We believe in simplifying life's administrative tasks so you can focus on what matters most."}
                        </p>
                    </section>

                    {/* Vision Section */}
                    <section className="about-section">
                        <div className="section-icon">
                            <Award />
                        </div>
                        <h2 className="section-title">
                            {t.aboutUs?.vision?.title || "Our Vision"}
                        </h2>
                        <p className="section-content">
                            {t.aboutUs?.vision?.content || "To become the leading platform for personal asset and subscription management, helping millions of users worldwide organize their digital and physical assets efficiently while saving time and money."}
                        </p>
                    </section>

                    {/* Values Section */}
                    <section className="about-section">
                        <div className="section-icon">
                            <Heart />
                        </div>
                        <h2 className="section-title">
                            {t.aboutUs?.values?.title || "Our Values"}
                        </h2>
                        <div className="values-grid">
                            <div className="value-item">
                                <h3>{t.aboutUs?.values?.simplicity?.title || "Simplicity"}</h3>
                                <p>{t.aboutUs?.values?.simplicity?.content || "We believe in making complex tasks simple and intuitive."}</p>
                            </div>
                            <div className="value-item">
                                <h3>{t.aboutUs?.values?.reliability?.title || "Reliability"}</h3>
                                <p>{t.aboutUs?.values?.reliability?.content || "Your data is secure and your information is always accessible."}</p>
                            </div>
                            <div className="value-item">
                                <h3>{t.aboutUs?.values?.innovation?.title || "Innovation"}</h3>
                                <p>{t.aboutUs?.values?.innovation?.content || "We continuously improve our platform with cutting-edge technology."}</p>
                            </div>
                            <div className="value-item">
                                <h3>{t.aboutUs?.values?.userFocus?.title || "User Focus"}</h3>
                                <p>{t.aboutUs?.values?.userFocus?.content || "Every feature is designed with our users' needs in mind."}</p>
                            </div>
                        </div>
                    </section>

                    {/* Team Section */}
                    <section className="about-section">
                        <div className="section-icon">
                            <Users />
                        </div>
                        <h2 className="section-title">
                            {t.aboutUs?.team?.title || "Our Team"}
                        </h2>
                        <p className="section-content">
                            {t.aboutUs?.team?.content || "We are a dedicated team of developers, designers, and support specialists committed to creating the best user experience. Our diverse backgrounds and expertise allow us to build a platform that serves users from all walks of life."}
                        </p>
                        <div className="team-stats">
                            <div className="stat-item">
                                <span className="stat-number">5+</span>
                                <span className="stat-label">{t.aboutUs?.team?.years || "Years Experience"}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">10+</span>
                                <span className="stat-label">{t.aboutUs?.team?.members || "Team Members"}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">1000+</span>
                                <span className="stat-label">{t.aboutUs?.team?.users || "Happy Users"}</span>
                            </div>
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section className="about-section">
                        <h2 className="section-title">
                            {t.aboutUs?.contact?.title || "Get in Touch"}
                        </h2>
                        <p className="section-content">
                            {t.aboutUs?.contact?.content || "Have questions or suggestions? We'd love to hear from you. Reach out to our support team for assistance."}
                        </p>
                        <div className="contact-info">
                            <div className="contact-item">
                                <strong>{t.aboutUs?.contact?.email || "Email:"}</strong>
                                <span>support@whs.com</span>
                            </div>
                            <div className="contact-item">
                                <strong>{t.aboutUs?.contact?.phone || "Phone:"}</strong>
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="contact-item">
                                <strong>{t.aboutUs?.contact?.hours || "Support Hours:"}</strong>
                                <span>{t.aboutUs?.contact?.hoursValue || "24/7"}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default AboutUsPage; 