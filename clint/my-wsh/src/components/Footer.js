import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { translations } from '../translations/translations';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Heart } from 'lucide-react';

function Footer() {
  const { isDarkMode, language } = useThemeLanguage();
  const t = translations[language];
  const logo = require('./wshLogo.png');

  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Facebook className="social-icon" />, href: '#', label: 'Facebook' },
    { icon: <Twitter className="social-icon" />, href: '#', label: 'Twitter' },
    { icon: <Instagram className="social-icon" />, href: '#', label: 'Instagram' },
  ];

  const quickLinks = [
    { to: '/home', label: t.footer.home },
    { to: '/warranty', label: t.footer.warranty },
    { to: '/subscription', label: t.footer.subscription },
    { to: '/home-tasks', label: t.footer.maintenance },
    { to: '/search', label: t.footer.search },
    { to: '/profile', label: t.footer.profile },
  ];

  const supportLinks = [
    { to: '/help', label: t.footer.helpSupport },
    { to: '/about-us', label: t.footer.aboutUs },
    { to: '/faq', label: t.footer.faq },
    { to: '/feedback', label: t.footer.feedback },
    { to: '/tutorials', label: t.footer.tutorials },
  ];

  const contactInfo = [
    { icon: <Mail className="contact-icon" />, text: 'infowsh@gmail.com', type: 'email' },
    { icon: <Phone className="contact-icon" />, text: '98765432', type: 'phone' },
  ];

  return (
    <footer className={`footer ${isDarkMode ? 'dark' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="footer-container">
        {/* Footer Top Section */}
        <div className="footer-top">
          <div className="footer-section">
            {/* Company Info */}
            <div className="company-info">
              <div className="footer-logo">
                <img src={logo} alt="WSH Logo" className="logo" />
                <span className="company-name">WSH</span>
              </div>
              <p className="company-description">
                {t.footer.companyDescription}
              </p>
              <div className="social-links">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.href} 
                    className="social-link"
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">{t.footer.quickLinks}</h3>
            <ul className="footer-links">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.to} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="footer-section">
            <h3 className="footer-title">{t.footer.support}</h3>
            <ul className="footer-links">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.to} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">{t.footer.contact}</h3>
            <div className="contact-info">
              {contactInfo.map((contact, index) => (
                <div key={index} className="contact-item">
                  {contact.icon}
                  <span className="contact-text">{contact.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <span>© {currentYear} WSH. {t.footer.allRightsReserved}</span>
            </div>
            <div className="footer-bottom-links">
              <Link to="/privacy" className="bottom-link">
                {t.footer.privacyPolicy}
              </Link>
              <Link to="/terms" className="bottom-link">
                {t.footer.termsOfService}
              </Link>
              <Link to="/cookies" className="bottom-link">
                {t.footer.cookiePolicy}
              </Link>
            </div>
          </div>
          <div className="footer-heart">
            <span>{t.footer.madeWith}</span>
            <Heart className="heart-icon" />
            <span>{t.footer.forYou}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
