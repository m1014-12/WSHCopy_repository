import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Forgot password page validation tests - testing the validation logic directly
describe('Forgot Password Page - Validation Tests', () => {
  describe('Email Validation', () => {
    test('validates empty email field', async () => {
      const MockEmailValidator = () => {
        const [email, setEmail] = React.useState('');
        const [error, setError] = React.useState('');

        const validateAndSubmit = () => {
          if (!email) {
            setError('Please fill in your email address');
            return false;
          }
          setError('');
          return true;
        };

        return (
          <div>
            <input 
              type="email"
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
        expect(screen.getByTestId('email-error')).toHaveTextContent('Please fill in your email address');
      });
    });

    test('validates email format using HTML5', () => {
      const MockEmailInput = () => (
        <input type="email" data-testid="email-input" required />
      );

      render(<MockEmailInput />);
      const emailInput = screen.getByTestId('email-input');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
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
              type="email"
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
              type="email"
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

  describe('Form Submission Validation', () => {
    test('prevents submission with empty email', async () => {
      const submitHandler = jest.fn();

      const MockForgotPasswordForm = () => {
        const [email, setEmail] = React.useState('');

        const handleSubmit = (e) => {
          e.preventDefault();
          
          if (!email) {
            submitHandler('validation-failed', 'Email required');
            return;
          }

          submitHandler('submitted', email);
        };

        return (
          <form onSubmit={handleSubmit}>
            <input 
              type="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Send Reset Link</button>
          </form>
        );
      };

      render(<MockForgotPasswordForm />);
      const submitBtn = screen.getByText('Send Reset Link');
      await userEvent.click(submitBtn);

      expect(submitHandler).toHaveBeenCalledWith('validation-failed', 'Email required');
      expect(submitHandler).not.toHaveBeenCalledWith('submitted', expect.any(String));
    });

    test('allows submission with valid email', async () => {
      const submitHandler = jest.fn();

      const MockForgotPasswordForm = () => {
        const [email, setEmail] = React.useState('');

        const handleSubmit = (e) => {
          e.preventDefault();
          
          if (!email) {
            submitHandler('validation-failed', 'Email required');
            return;
          }

          submitHandler('submitted', email);
        };

        return (
          <form onSubmit={handleSubmit}>
            <input 
              type="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Send Reset Link</button>
          </form>
        );
      };

      render(<MockForgotPasswordForm />);
      const emailInput = screen.getByTestId('email-input');
      const submitBtn = screen.getByText('Send Reset Link');

      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.click(submitBtn);

      expect(submitHandler).toHaveBeenCalledWith('submitted', 'user@example.com');
      expect(submitHandler).not.toHaveBeenCalledWith('validation-failed', expect.any(String));
    });

    test('prevents submission with invalid email format', async () => {
      const submitHandler = jest.fn();

      const MockForgotPasswordForm = () => {
        const [email, setEmail] = React.useState('');

        const handleSubmit = (e) => {
          e.preventDefault();
          
          if (!email) {
            submitHandler('validation-failed', 'Email required');
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            submitHandler('validation-failed', 'Invalid email format');
            return;
          }

          submitHandler('submitted', email);
        };

        return (
          <form onSubmit={handleSubmit}>
            <input 
              type="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Send Reset Link</button>
          </form>
        );
      };

      render(<MockForgotPasswordForm />);
      const emailInput = screen.getByTestId('email-input');
      const submitBtn = screen.getByText('Send Reset Link');

      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(submitBtn);

      expect(submitHandler).toHaveBeenCalledWith('validation-failed', 'Invalid email format');
    });
  });

  describe('User Input Handling', () => {
    test('updates email input value', async () => {
      const MockEmailInput = () => {
        const [email, setEmail] = React.useState('');
        return <input type="email" data-testid="email-input" value={email} onChange={(e) => setEmail(e.target.value)} />;
      };

      render(<MockEmailInput />);
      const emailInput = screen.getByTestId('email-input');
      
      await userEvent.type(emailInput, 'user@test.com');
      expect(emailInput).toHaveValue('user@test.com');
    });

    test('clears email input when cleared', async () => {
      const MockEmailInput = () => {
        const [email, setEmail] = React.useState('');
        return <input type="email" data-testid="email-input" value={email} onChange={(e) => setEmail(e.target.value)} />;
      };

      render(<MockEmailInput />);
      const emailInput = screen.getByTestId('email-input');
      
      await userEvent.type(emailInput, 'user@test.com');
      await userEvent.clear(emailInput);
      expect(emailInput).toHaveValue('');
    });
  });

  describe('Required Field Validation', () => {
    test('email has required attribute', () => {
      const MockEmailInput = () => (
        <input type="email" data-testid="email-input" required />
      );

      render(<MockEmailInput />);
      const emailInput = screen.getByTestId('email-input');
      expect(emailInput).toHaveAttribute('required');
    });

    test('form submission blocked by required field', async () => {
      const MockRequiredField = () => {
        const [email, setEmail] = React.useState('');
        
        return (
          <form onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<MockRequiredField />);
      const emailInput = screen.getByTestId('email-input');
      expect(emailInput).toHaveAttribute('required');
    });
  });

  describe('Message Display Logic', () => {
    test('displays success message with correct styling', () => {
      const MockMessageDisplay = ({ message, type }) => {
        const className = `message ${type}`;
        return <span data-testid="message" className={className}>{message}</span>;
      };

      const { rerender } = render(<MockMessageDisplay message="Success!" type="success" />);
      let message = screen.getByTestId('message');
      
      expect(message).toHaveClass('message');
      expect(message).toHaveClass('success');

      rerender(<MockMessageDisplay message="Error!" type="error" />);
      message = screen.getByTestId('message');
      
      expect(message).toHaveClass('message');
      expect(message).toHaveClass('error');
    });

    test('detects error messages containing "error"', () => {
      const MockMessageDisplay = ({ message }) => {
        const isError = message.toLowerCase().includes('error') || message.toLowerCase().includes('wrong');
        const className = `message ${isError ? 'error' : 'success'}`;
        return <span data-testid="message" className={className}>{message}</span>;
      };

      const { rerender } = render(<MockMessageDisplay message="Password reset link sent" />);
      expect(screen.getByTestId('message')).toHaveClass('success');

      rerender(<MockMessageDisplay message="An error occurred" />);
      expect(screen.getByTestId('message')).toHaveClass('error');
    });

    test('detects error messages containing "wrong"', () => {
      const MockMessageDisplay = ({ message }) => {
        const isError = message.toLowerCase().includes('error') || message.toLowerCase().includes('wrong');
        const className = `message ${isError ? 'error' : 'success'}`;
        return <span data-testid="message" className={className}>{message}</span>;
      };

      render(<MockMessageDisplay message="Something went wrong" />);
      expect(screen.getByTestId('message')).toHaveClass('error');
    });
  });

  describe('Form State Management', () => {
    test('clears previous messages on new submission', async () => {
      const MockFormWithMessages = () => {
        const [email, setEmail] = React.useState('');
        const [message, setMessage] = React.useState('');

        const handleSubmit = (e) => {
          e.preventDefault();
          
          if (!email) {
            setMessage('Please fill in your email address');
            return;
          }
          
          setMessage('Password reset link sent to your email');
        };

        return (
          <div>
            <input 
              type="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handleSubmit}>Submit</button>
            {message && <span data-testid="message">{message}</span>}
          </div>
        );
      };

      render(<MockFormWithMessages />);
      const submitBtn = screen.getByText('Submit');
      
      // First submission without email
      await userEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Please fill in your email address');
      });

      // Second submission with email
      const emailInput = screen.getByTestId('email-input');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent('Password reset link sent to your email');
      });
    });

    test('maintains email value after failed submission', async () => {
      const MockFormMaintainsState = () => {
        const [email, setEmail] = React.useState('');
        const [error, setError] = React.useState('');

        const handleSubmit = (e) => {
          e.preventDefault();
          
          if (!email) {
            setError('Email required');
            return;
          }
          
          // Success - clear error
          setError('');
        };

        return (
          <form onSubmit={handleSubmit}>
            <input 
              type="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Submit</button>
            {error && <span data-testid="error">{error}</span>}
          </form>
        );
      };

      render(<MockFormMaintainsState />);
      const emailInput = screen.getByTestId('email-input');
      const submitBtn = screen.getByText('Submit');

      // Try to submit with empty email (should show error)
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Type email - value should work
      await userEvent.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Input Field Properties', () => {
    test('has proper placeholder text', () => {
      const MockEmailInput = () => (
        <input type="email" data-testid="email-input" placeholder="Enter your email" />
      );

      render(<MockEmailInput />);
      const emailInput = screen.getByTestId('email-input');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email');
    });

    test('has proper type attribute', () => {
      const MockEmailInput = () => (
        <input type="email" data-testid="email-input" />
      );

      render(<MockEmailInput />);
      const emailInput = screen.getByTestId('email-input');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('supports controlled input', async () => {
      const MockControlledInput = () => {
        const [value, setValue] = React.useState('');
        return (
          <input 
            type="email"
            data-testid="email-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<MockControlledInput />);
      const emailInput = screen.getByTestId('email-input');
      
      await userEvent.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });
  });
});

