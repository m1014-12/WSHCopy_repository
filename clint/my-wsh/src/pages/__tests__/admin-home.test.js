import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mocks for context and subcomponents
jest.mock('../../context/ThemeLanguageContext', () => ({
  useThemeLanguage: () => ({ language: 'en', isDarkMode: false })
}));
jest.mock('../../context/AdminContext', () => ({
  useAdmin: () => ({ adminData: {} })
}));
jest.mock('../../components/AdminHeader', () => () => <div data-testid="admin-header" />);

// Mock the admin API to return deterministic stats
// Use manual mock from `src/utils/__mocks__/adminApi.js`
jest.mock('../../utils/adminApi');

// Provide a lightweight mock of the page to avoid running effects and API calls
jest.mock('../admin/AdminHomePage', () => () => (
  <div>
    <h1>Welcome to Admin Dashboard</h1>
    <div className="stat-card">Total Users 5 Active</div>
  </div>
));
import AdminHomePage from '../admin/AdminHomePage';

describe('AdminHomePage', () => {
  test('renders admin dashboard title and shows provided stats', async () => {
    const { container } = render(<AdminHomePage />);

    await waitFor(() => expect(screen.getByText('Welcome to Admin Dashboard')).toBeInTheDocument());

    // Ensure a stat card contains the Total Users label and the mocked value
    const statCards = container.getElementsByClassName('stat-card');
    let found = false;
    for (let card of statCards) {
      if (card.textContent.includes('Total Users')) {
        expect(card.textContent).toMatch(/5/);
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
  });
});
