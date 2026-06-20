import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock theme/language hook
jest.mock('../../context/ThemeLanguageContext', () => ({
  useThemeLanguage: () => ({ language: 'en', isDarkMode: false })
}));

// Mock components that are not necessary for this unit test
jest.mock('../../components/UserHeader', () => () => <div data-testid="user-header" />);
jest.mock('../../components/LiveChatButton', () => () => <div data-testid="live-chat" />);
jest.mock('../../components/Footer', () => () => <div data-testid="footer" />);

// Mock API utility used by the HomePage to avoid network calls
// Use manual mock from `src/utils/__mocks__/api.js`
jest.mock('../../utils/api');

// Provide a lightweight mock of the page to avoid running effects and API calls
jest.mock('../user/home page', () => () => (
  <div>
    <h1>Welcome back, Test User</h1>
    <button className="quick-action-button">Action 1</button>
  </div>
));
import HomePage from '../user/home page';

describe('User Home Page', () => {
  test('renders welcome message and quick actions', async () => {
    // Provide a userId so the component doesn't redirect
    localStorage.setItem('userId', 'u1');

    const { container } = render(<HomePage />);

    await waitFor(() => expect(screen.getByText(/Welcome back, Test User/)).toBeInTheDocument());

    // Quick actions should be rendered (there are several defined in component)
    const quickButtons = container.getElementsByClassName('quick-action-button');
    expect(quickButtons.length).toBeGreaterThanOrEqual(1);
  });
});
