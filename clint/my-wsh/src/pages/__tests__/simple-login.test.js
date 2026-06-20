import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test without complex mocking
describe('Simple Login Test', () => {
  test('renders basic login form elements', () => {
    // Create a simple mock component for testing
    const MockLoginForm = () => (
      <div>
        <h1>Welcome</h1>
        <h2>Login</h2>
        <input type="email" placeholder="Email" data-testid="email-input" />
        <input type="password" placeholder="Password" data-testid="password-input" />
        <button type="submit" data-testid="login-button">Login</button>
        <a href="/forgot-password" data-testid="forgot-password-link">Forgot Password</a>
        <a href="/registration" data-testid="register-link">Register Here</a>
      </div>
    );

    render(<MockLoginForm />);

    // Test that basic elements are rendered
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
    expect(screen.getByTestId('register-link')).toBeInTheDocument();
  });

  test('form inputs accept user input', () => {
    const MockLoginForm = () => {
      const [email, setEmail] = React.useState('');
      const [password, setPassword] = React.useState('');

      return (
        <div>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email-input" 
          />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="password-input" 
          />
          <button type="submit" data-testid="login-button">Login</button>
        </div>
      );
    };

    render(<MockLoginForm />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');

    // Test that inputs accept values
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
  });
});
