import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Send, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/FeedbackPage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import UserHeader from '../../components/UserHeader';
import Footer from '../../components/Footer';

function FeedbackPage() {
    const navigate = useNavigate();
    const { isDarkMode, language, toggleTheme, toggleLanguage } = useThemeLanguage();
    const logo = require('../../components/wshLogo.png');
    const t = translations[language];
    
    const [rating, setRating] = useState(0);
    const [feedbackType, setFeedbackType] = useState('general');
    const [feedbackText, setFeedbackText] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

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

    const handleStarClick = (starRating) => {
        setRating(starRating);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
            // Reset form
            setRating(0);
            setFeedbackType('general');
            setFeedbackText('');
            setEmail('');
        }, 2000);
    };

    const handleNewFeedback = () => {
        setSubmitted(false);
    };

    const feedbackTypes = [
        { id: 'general', name: t.feedback?.types?.general || 'General Feedback' },
        { id: 'bug', name: t.feedback?.types?.bug || 'Bug Report' },
        { id: 'feature', name: t.feedback?.types?.feature || 'Feature Request' },
        { id: 'improvement', name: t.feedback?.types?.improvement || 'Improvement Suggestion' },
        { id: 'complaint', name: t.feedback?.types?.complaint || 'Complaint' }
    ];

    const renderStars = () => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`star-button ${star <= rating ? 'filled' : ''}`}
                        onClick={() => handleStarClick(star)}
                        aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                    >
                        <Star size={30} />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="feedback-container">
            <UserHeader />

            {/* Main Content */}
            <div className="feedback-content">
                {!submitted ? (
                    <>
                        <div className="feedback-hero">
                            <h1 className="feedback-title">
                                {t.feedback?.title || "Feedback & Review"}
                            </h1>
                            <p className="feedback-subtitle">
                                {t.feedback?.subtitle || "We value your opinion! Help us improve by sharing your feedback and rating our system."}
                            </p>
                        </div>

                        <div className="feedback-form-container">
                            <form onSubmit={handleSubmit} className="feedback-form">
                                {/* Rating Section */}
                                <div className="form-section">
                                    <h2 className="section-title">
                                        {t.feedback?.rating?.title || "Rate your experience"}
                                    </h2>
                                    <p className="section-description">
                                        {t.feedback?.rating?.description || "How would you rate your overall experience with WHS Management System?"}
                                    </p>
                                    {renderStars()}
                                    {rating > 0 && (
                                        <p className="rating-text">
                                            {rating === 1 && (t.feedback?.rating?.poor || "Poor")}
                                            {rating === 2 && (t.feedback?.rating?.fair || "Fair")}
                                            {rating === 3 && (t.feedback?.rating?.good || "Good")}
                                            {rating === 4 && (t.feedback?.rating?.veryGood || "Very Good")}
                                            {rating === 5 && (t.feedback?.rating?.excellent || "Excellent")}
                                        </p>
                                    )}
                                </div>

                                {/* Feedback Type Section */}
                                <div className="form-section">
                                    <h2 className="section-title">
                                        {t.feedback?.type?.title || "Feedback Type"}
                                    </h2>
                                    <div className="feedback-type-grid">
                                        {feedbackTypes.map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                className={`type-button ${feedbackType === type.id ? 'active' : ''}`}
                                                onClick={() => setFeedbackType(type.id)}
                                            >
                                                {type.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Feedback Text Section */}
                                <div className="form-section">
                                    <h2 className="section-title">
                                        {t.feedback?.message?.title || "Your Feedback"}
                                    </h2>
                                    <p className="section-description">
                                        {t.feedback?.message?.description || "Please share your thoughts, suggestions, or report any issues you've encountered."}
                                    </p>
                                    <textarea
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder={t.feedback?.message?.placeholder || "Tell us about your experience..."}
                                        className="feedback-textarea"
                                        rows="6"
                                        required
                                    />
                                </div>

                                {/* Email Section */}
                                <div className="form-section">
                                    <h2 className="section-title">
                                        {t.feedback?.email?.title || "Contact Information (Optional)"}
                                    </h2>
                                    <p className="section-description">
                                        {t.feedback?.email?.description || "If you'd like us to follow up on your feedback, please provide your email address."}
                                    </p>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t.feedback?.email?.placeholder || "your.email@example.com"}
                                        className="email-input"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="form-section">
                                    <button
                                        type="submit"
                                        className="submit-button"
                                        disabled={isSubmitting || !feedbackText.trim()}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="loading-spinner"></div>
                                                {t.feedback?.submitting || "Submitting..."}
                                            </>
                                        ) : (
                                            <>
                                                <Send size={20} />
                                                {t.feedback?.submit || "Submit Feedback"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Quick Feedback Section */}
                        <div className="quick-feedback-section">
                            <h2 className="quick-feedback-title">
                                {t.feedback?.quickFeedback?.title || "Quick Feedback"}
                            </h2>
                            <p className="quick-feedback-description">
                                {t.feedback?.quickFeedback?.description || "Don't have time for a detailed review? Give us a quick thumbs up or down!"}
                            </p>
                            <div className="quick-feedback-buttons">
                                <button className="quick-button positive">
                                    <ThumbsUp size={24} />
                                    <span>{t.feedback?.quickFeedback?.positive || "I like it!"}</span>
                                </button>
                                <button className="quick-button negative">
                                    <ThumbsDown size={24} />
                                    <span>{t.feedback?.quickFeedback?.negative || "Needs improvement"}</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Success Message */
                    <div className="success-message">
                        <div className="success-icon">
                            <MessageSquare size={80} />
                        </div>
                        <h1 className="success-title">
                            {t.feedback?.success?.title || "Thank You!"}
                        </h1>
                        <p className="success-description">
                            {t.feedback?.success?.description || "Your feedback has been submitted successfully. We appreciate you taking the time to help us improve!"}
                        </p>
                        <div className="success-actions">
                            <button className="new-feedback-button" onClick={handleNewFeedback}>
                                {t.feedback?.success?.newFeedback || "Submit Another Feedback"}
                            </button>
                            <button className="back-home-button" onClick={goTohome}>
                                {t.feedback?.success?.backHome || "Back to Home"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <Footer />
        </div>
    );
}

export default FeedbackPage; 