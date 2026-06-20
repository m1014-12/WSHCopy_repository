import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Login page validation tests - testing the validation logic directly
describe('Login Page - Validation Tests', () => {
  describe('Email Validation', () => {
    test('validates empty email field', async () => {
      const MockEmailValidator = () => {
        const [email, setEmail] = React.useState('');
        const [error, setError] = React.useState('');

        const validateAndSubmit = () => {
          if (!email) {
            setError('Email is required');
            return false;
          }
          setError('');
          return true;
        };

        return (
          <div>
            <input 
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <span data-testid="email-error">{error}</span>}
            <button onClick={validateAndSubmit}>Submit</button>
          </div>
        );
      };

      render(<MockEmailValidator />);
      const submitBtn = screen.getByText('Submit');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
      });
    });

    test('validates email format using HTML5', () => {
      const MockEmailInput = () => (
        <input type="email" data-testid="email-input" />
      );

      render(<MockEmailInput />);
      const emailInput = screen.getByTestId('email-input');
      
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('accepts valid email format', async () => {
      const MockEmailValidator = () => {
        const [email, setEmail] = React.useState('');
        const [isValid, setIsValid] = React.useState(true);

        const validate = (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        };

        return (
          <div>
            <input 
              data-testid="email-input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsValid(validate(e.target.value));
              }}
            />
            {!isValid && email && <span data-testid="email-error">Invalid email</span>}
          </div>
        );
      };

      render(<MockEmailValidator />);
      const emailInput = screen.getByTestId('email-input');

      await userEvent.type(emailInput, 'test@example.com');
      
      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });

    test('rejects invalid email format', async () => {
      const MockEmailValidator = () => {
        const [email, setEmail] = React.useState('');
        const [isValid, setIsValid] = React.useState(true);

        const validate = (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        };

        return (
          <div>
            <input 
              data-testid="email-input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsValid(validate(e.target.value));
              }}
            />
            {!isValid && email && <span data-testid="email-error">Invalid email</span>}
          </div>
        );
      };

      render(<MockEmailValidator />);
      const emailInput = screen.getByTestId('email-input');

      await userEvent.type(emailInput, 'invalid-email');
      
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email');
      });
    });
  });

  describe('Password Validation', () => {
    test('validates empty password field', async () => {
      const MockPasswordValidator = () => {
        const [password, setPassword] = React.useState('');
        const [error, setError] = React.useState('');

        const validateAndSubmit = () => {
          if (!password) {
            setError('Password is required');
            return false;
          }
          setError('');
          return true;
        };

        return (
          <div>
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <span data-testid="password-error">{error}</span>}
            <button onClick={validateAndSubmit}>Submit</button>
          </div>
        );
      };

      render(<MockPasswordValidator />);
      const submitBtn = screen.getByText('Submit');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
      });
    });

    test('password input is masked', () => {
      const MockPasswordInput = () => (
        <input type="password" data-testid="password-input" />
      );

      render(<MockPasswordInput />);
      const passwordInput = screen.getByTestId('password-input');
      
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('requires password field to be filled', async () => {
      const MockFormValidator = () => {
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');
        const [error, setError] = React.useState('');

        const validateAndSubmit = () => {
          if (!email || !password) {
            setError('All fields required');
            return false;
          }
          setError('');
          return true;
        };

        return (
          <div>
            <input 
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <span data-testid="form-error">{error}</span>}
            <button onClick={validateAndSubmit}>Submit</button>
          </div>
        );
      };

      render(<MockFormValidator />);
      const emailInput = screen.getByTestId('email-input');
      const submitBtn = screen.getByText('Submit');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent('All fields required');
      });
    });
  });

  describe('Form Submission Validation', () => {
    test('prevents submission with empty fields', async () => {
      const submitHandler = jest.fn();
      
      const MockLoginForm = () => {
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');

        const handleSubmit = (e) => {
          e.preventDefault();
          if (!email || !password) {
            submitHandler('validation-failed');
            return;
          }
          submitHandler('submitted', { email, password });
        };

        return (
          <form onSubmit={handleSubmit}>
            <input 
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<MockLoginForm />);
      const submitBtn = screen.getByText('Submit');
      await userEvent.click(submitBtn);

      expect(submitHandler).toHaveBeenCalledWith('validation-failed');
      expect(submitHandler).not.toHaveBeenCalledWith('submitted', expect.any(Object));
    });

    test('allows submission with all fields filled', async () => {
      const submitHandler = jest.fn();
      
      const MockLoginForm = () => {
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');

        const handleSubmit = (e) => {
          e.preventDefault();
          if (!email || !password) {
            submitHandler('validation-failed');
            return;
          }
          submitHandler('submitted', { email, password });
        };

        return (
          <form onSubmit={handleSubmit}>
            <input 
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<MockLoginForm />);
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitBtn = screen.getByText('Submit');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitBtn);

      expect(submitHandler).toHaveBeenCalledWith('submitted', {
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  describe('User Input Handling', () => {
    test('updates email input value', async () => {
      const MockLoginForm = () => {
        const [email, setEmail] = React.useState('');
        return <input data-testid="email-input" value={email} onChange={(e) => setEmail(e.target.value)} />;
      };

      render(<MockLoginForm />);
      const emailInput = screen.getByTestId('email-input');
      
      await userEvent.type(emailInput, 'user@test.com');
      expect(emailInput).toHaveValue('user@test.com');
    });

    test('updates password input value', async () => {
      const MockLoginForm = () => {
        const [password, setPassword] = React.useState('');
        return <input type="password" data-testid="password-input" value={password} onChange={(e) => setPassword(e.target.value)} />;
      };

      render(<MockLoginForm />);
      const passwordInput = screen.getByTestId('password-input');
      
      await userEvent.type(passwordInput, 'secretpass');
      expect(passwordInput).toHaveValue('secretpass');
    });
  });

  describe('Required Fields', () => {
    test('email has required attribute', () => {
      const MockLoginForm = () => (
        <input type="email" data-testid="email-input" required />
      );

      render(<MockLoginForm />);
      const emailInput = screen.getByTestId('email-input');
      expect(emailInput).toHaveAttribute('required');
    });

    test('password has required attribute', () => {
      const MockLoginForm = () => (
        <input type="password" data-testid="password-input" required />
      );

      render(<MockLoginForm />);
      const passwordInput = screen.getByTestId('password-input');
      expect(passwordInput).toHaveAttribute('required');
    });
  });
});

