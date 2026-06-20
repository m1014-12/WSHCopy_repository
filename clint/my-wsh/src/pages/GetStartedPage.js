import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/Get_started_Page(CSS).css';
import { Moon } from 'lucide-react';

function GetStarted() {
  const logo = require('../components/wshLogo.png');
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  // Texts for both languages
  const texts = {
    en: {
      title: 'WHS Management System',
      quote: 'The best investment you can make is in yourself',
      getStarted: 'Get Started',
      featuresTitle: 'WHS Management System is designed to assist users in managing different aspects of their lives. It includes the following features:',
      warranty: 'Warranty Management: Users can upload and store warranty documents, add product details and images, and receive expiration alerts.',
      subscription: 'Subscription Management: Users can track various subscriptions, store payment details, and receive reminders before renewal dates.',
      maintenance: 'Home Maintenance Schedule: Users can schedule and track home maintenance tasks such as plumbing, electrical work, and routine inspections.',
      search: 'Search Feature: Users can quickly find stored documents and information using a smart search system that supports text input and voice commands.',
      description: 'It offers secure document storage, a user-friendly interface, and categorized data organization, automated reminders and notifications, and efficient subscription management. All designed to simplify your workflow and maximize your profits and making sure to have a smooth management web application.',
      language: 'العربية',
    },
    ar: {
      title: 'نظام إدارة WHS',
      quote: 'أفضل استثمار يمكنك القيام به هو في نفسك',
      getStarted: 'ابدأ الآن',
      featuresTitle: 'تم تصميم نظام إدارة WHS لمساعدة المستخدمين في إدارة جوانب مختلفة من حياتهم. ويشمل الميزات التالية:',
      warranty: 'إدارة الضمان: يمكن للمستخدمين تحميل وتخزين مستندات الضمان، إضافة تفاصيل المنتجات والصور، وتلقي تنبيهات انتهاء الصلاحية.',
      subscription: 'إدارة الاشتراكات: يمكن للمستخدمين تتبع الاشتراكات المختلفة، وتخزين تفاصيل الدفع، وتلقي تذكيرات قبل تواريخ التجديد.',
      maintenance: 'جدولة صيانة المنزل: يمكن للمستخدمين جدولة وتتبع مهام صيانة المنزل مثل السباكة، الأعمال الكهربائية، والفحوصات الدورية.',
      search: 'ميزة البحث: يمكن للمستخدمين العثور بسرعة على المستندات والمعلومات المخزنة باستخدام نظام بحث ذكي يدعم الإدخال النصي والأوامر الصوتية.',
      description: 'يوفر تخزينًا آمنًا للمستندات، وواجهة سهلة الاستخدام، وتنظيمًا مصنفًا للبيانات، وتذكيرات وإشعارات تلقائية، وإدارة فعالة للاشتراكات. كل ذلك مصمم لتبسيط سير عملك وتعظيم أرباحك وضمان تجربة إدارة سلسة.',
      language: 'English',
    },
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className={`get-started-root ${theme}-theme ${language}-lang`} dir={dir}>
      <header className="get-started-header">
        <div className="logo-container">
          <img src={logo} alt="WHS Logo" className="wsh-logo" />
        </div>
        <nav className="get-started-nav">
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            <Moon />
          </button>
          <button className="lang-btn" onClick={toggleLanguage}>
            {texts[language].language}
          </button>
        </nav>
      </header>

      <section className="hero">
        <h1>{texts[language].title}</h1>
        <p>{texts[language].quote}</p>
        <Link to="/login">
          <button className="get-started-btn">{texts[language].getStarted}</button>
        </Link>
      </section>

      <section className="features">
        <h2>{texts[language].featuresTitle}</h2>
        <ul>
          <li><strong>{texts[language].warranty}</strong></li>
          <li><strong>{texts[language].subscription}</strong></li>
          <li><strong>{texts[language].maintenance}</strong></li>
          <li><strong>{texts[language].search}</strong></li>
        </ul>
        <p className="description">{texts[language].description}</p>
      </section>
  </div>
  );
}

export default GetStarted;
