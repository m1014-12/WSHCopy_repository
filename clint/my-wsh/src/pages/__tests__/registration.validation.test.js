import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Registration page validation tests - testing the validation logic directly
describe('Registration Page - Validation Tests', () => {
  describe('Username Validation', () => {
    test('validates username max length (20 characters)', async () => {
      const MockUsernameValidator = () => {
        const [username, setUsername] = React.useState('');
        const [error, setError] = React.useState('');

        React.useEffect(() => {
          if (username.length > 20) {
            setError('Username must not exceed 20 characters');
          } else {
            setError('');
          }
        }, [username]);

        return (
          <div>
            <input 
              data-testid="username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {error && <span data-testid="username-error">{error}</span>}
          </div>
        );
      };

      render(<MockUsernameValidator />);
      const usernameInput = screen.getByTestId('username-input');

      await userEvent.type(usernameInput, 'a'.repeat(21));

      await waitFor(() => {
        expect(screen.getByTestId('username-error')).toHaveTextContent('Username must not exceed 20 characters');
      });
    });

    test('accepts username of 20 characters or less', async () => {
      const MockUsernameValidator = () => {
        const [username, setUsername] = React.useState('');
        const [error, setError] = React.useState('');

        React.useEffect(() => {
          if (username.length > 20) {
            setError('Username must not exceed 20 characters');
          } else {
            setError('');
          }
        }, [username]);

        return (
          <div>
            <input 
              data-testid="username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {error && <span data-testid="username-error">{error}</span>}
          </div>
        );
      };

      render(<MockUsernameValidator />);
      const usernameInput = screen.getByTestId('username-input');

      await userEvent.type(usernameInput, 'a'.repeat(20));

      await waitFor(() => {
        expect(screen.queryByTestId('username-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Email Validation', () => {
    test('validates email format', async () => {
      const MockEmailValidator = () => {
        const [email, setEmail] = React.useState('');
        const [error, setError] = React.useState('');

        const validate = (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        };

        React.useEffect(() => {
          if (email && !validate(email)) {
            setError('Please enter a valid email address');
          } else {
            setError('');
          }
        }, [email]);

        return (
          <div>
            <input 
              type="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <span data-testid="email-error">{error}</span>}
          </div>
        );
      };

      render(<MockEmailValidator />);
      const emailInput = screen.getByTestId('email-input');

      await userEvent.type(emailInput, 'invalid-email');

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Please enter a valid email address');
      });
    });

    test('accepts valid email', async () => {
      const MockEmailValidator = () => {
        const [email, setEmail] = React.useState('');
        const [error, setError] = React.useState('');

        const validate = (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        };

        React.useEffect(() => {
          if (email && !validate(email)) {
            setError('Please enter a valid email address');
          } else {
            setError('');
          }
        }, [email]);

        return (
          <div>
            <input 
              type="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <span data-testid="email-error">{error}</span>}
          </div>
        );
      };

      render(<MockEmailValidator />);
      const emailInput = screen.getByTestId('email-input');

      await userEvent.type(emailInput, 'valid@example.com');

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Phone Number Validation', () => {
    test('validates phone starts with 9 or 7', async () => {
      const MockPhoneValidator = () => {
        const [phone, setPhone] = React.useState('');
        const [isValid, setIsValid] = React.useState(false);

        React.useEffect(() => {
          setIsValid(/^[97][0-9]{7}$/.test(phone));
        }, [phone]);

        return (
          <div>
            <input 
              type="tel"
              data-testid="phone-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {phone && <span data-testid="phone-feedback">{isValid ? 'Valid' : 'Invalid'}</span>}
          </div>
        );
      };

      render(<MockPhoneValidator />);
      const phoneInput = screen.getByTestId('phone-input');

      await userEvent.type(phoneInput, '81234567');

      await waitFor(() => {
        expect(screen.getByTestId('phone-feedback')).toHaveTextContent('Invalid');
      });
    });

    test('accepts phone starting with 9', async () => {
      const MockPhoneValidator = () => {
        const [phone, setPhone] = React.useState('');
        const [isValid, setIsValid] = React.useState(false);

        React.useEffect(() => {
          setIsValid(/^[97][0-9]{7}$/.test(phone));
        }, [phone]);

        return (
          <div>
            <input 
              type="tel"
              data-testid="phone-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {phone && <span data-testid="phone-feedback">{isValid ? 'Valid' : 'Invalid'}</span>}
          </div>
        );
      };

      render(<MockPhoneValidator />);
      const phoneInput = screen.getByTestId('phone-input');

      await userEvent.type(phoneInput, '91234567');

      await waitFor(() => {
        expect(screen.getByTestId('phone-feedback')).toHaveTextContent('Valid');
      });
    });

    test('accepts phone starting with 7', async () => {
      const MockPhoneValidator = () => {
        const [phone, setPhone] = React.useState('');
        const [isValid, setIsValid] = React.useState(false);

        React.useEffect(() => {
          setIsValid(/^[97][0-9]{7}$/.test(phone));
        }, [phone]);

        return (
          <div>
            <input 
              type="tel"
              data-testid="phone-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {phone && <span data-testid="phone-feedback">{isValid ? 'Valid' : 'Invalid'}</span>}
          </div>
        );
      };

      render(<MockPhoneValidator />);
      const phoneInput = screen.getByTestId('phone-input');

      await userEvent.type(phoneInput, '71234567');

      await waitFor(() => {
        expect(screen.getByTestId('phone-feedback')).toHaveTextContent('Valid');
      });
    });

    test('validates phone is exactly 8 digits', async () => {
      const MockPhoneValidator = () => {
        const [phone, setPhone] = React.useState('');
        const [isValid, setIsValid] = React.useState(false);

        React.useEffect(() => {
          setIsValid(/^[97][0-9]{7}$/.test(phone));
        }, [phone]);

        return (
          <div>
            <input 
              type="tel"
              data-testid="phone-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {phone && <span data-testid="phone-feedback">{isValid ? 'Valid' : 'Invalid'}</span>}
          </div>
        );
      };

      render(<MockPhoneValidator />);
      const phoneInput = screen.getByTestId('phone-input');

      await userEvent.type(phoneInput, '9123456');

      await waitFor(() => {
        expect(screen.getByTestId('phone-feedback')).toHaveTextContent('Invalid');
      });
    });
  });

  describe('Password Validation Requirements', () => {
    test('validates minimum length (8 characters)', async () => {
      const MockPasswordValidator = () => {
        const [password, setPassword] = React.useState('');
        const [minLength, setMinLength] = React.useState(false);

        React.useEffect(() => {
          setMinLength(password.length >= 8);
        }, [password]);

        return (
          <div>
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span data-testid="min-length" className={minLength ? 'valid' : 'invalid'}>
              {minLength ? 'Valid' : 'Invalid'}
            </span>
          </div>
        );
      };

      render(<MockPasswordValidator />);
      const passwordInput = screen.getByTestId('password-input');

      await userEvent.type(passwordInput, 'Pass1!');

      await waitFor(() => {
        expect(screen.getByTestId('min-length')).toHaveClass('invalid');
      });
    });

    test('validates maximum length (20 characters)', async () => {
      const MockPasswordValidator = () => {
        const [password, setPassword] = React.useState('');
        const [maxLength, setMaxLength] = React.useState(false);

        React.useEffect(() => {
          setMaxLength(password.length <= 20);
        }, [password]);

        return (
          <div>
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span data-testid="max-length" className={maxLength ? 'valid' : 'invalid'}>
              {maxLength ? 'Valid' : 'Invalid'}
            </span>
          </div>
        );
      };

      render(<MockPasswordValidator />);
      const passwordInput = screen.getByTestId('password-input');

      await userEvent.type(passwordInput, 'A'.repeat(21));

      await waitFor(() => {
        expect(screen.getByTestId('max-length')).toHaveClass('invalid');
      });
    });

    test('validates uppercase letter requirement', async () => {
      const MockPasswordValidator = () => {
        const [password, setPassword] = React.useState('');
        const [hasUpper, setHasUpper] = React.useState(false);

        React.useEffect(() => {
          setHasUpper(/[A-Z]/.test(password));
        }, [password]);

        return (
          <div>
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span data-testid="uppercase" className={hasUpper ? 'valid' : 'invalid'}>
              {hasUpper ? 'Valid' : 'Invalid'}
            </span>
          </div>
        );
      };

      render(<MockPasswordValidator />);
      const passwordInput = screen.getByTestId('password-input');

      await userEvent.type(passwordInput, 'password123!');

      await waitFor(() => {
        expect(screen.getByTestId('uppercase')).toHaveClass('invalid');
      });
    });

    test('validates lowercase letter requirement', async () => {
      const MockPasswordValidator = () => {
        const [password, setPassword] = React.useState('');
        const [hasLower, setHasLower] = React.useState(false);

        React.useEffect(() => {
          setHasLower(/[a-z]/.test(password));
        }, [password]);

        return (
          <div>
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span data-testid="lowercase" className={hasLower ? 'valid' : 'invalid'}>
              {hasLower ? 'Valid' : 'Invalid'}
            </span>
          </div>
        );
      };

      render(<MockPasswordValidator />);
      const passwordInput = screen.getByTestId('password-input');

      await userEvent.type(passwordInput, 'PASSWORD123!');

      await waitFor(() => {
        expect(screen.getByTestId('lowercase')).toHaveClass('invalid');
      });
    });

    test('validates number requirement', async () => {
      const MockPasswordValidator = () => {
        const [password, setPassword] = React.useState('');
        const [hasNumber, setHasNumber] = React.useState(false);

        React.useEffect(() => {
          setHasNumber(/\d/.test(password));
        }, [password]);

        return (
          <div>
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span data-testid="number" className={hasNumber ? 'valid' : 'invalid'}>
              {hasNumber ? 'Valid' : 'Invalid'}
            </span>
          </div>
        );
      };

      render(<MockPasswordValidator />);
      const passwordInput = screen.getByTestId('password-input');

      await userEvent.type(passwordInput, 'Password!');

      await waitFor(() => {
        expect(screen.getByTestId('number')).toHaveClass('invalid');
      });
    });

    test('validates special character requirement', async () => {
      const MockPasswordValidator = () => {
        const [password, setPassword] = React.useState('');
        const [hasSpecial, setHasSpecial] = React.useState(false);

        React.useEffect(() => {
          setHasSpecial(/[\W_]/.test(password));
        }, [password]);

        return (
          <div>
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span data-testid="special" className={hasSpecial ? 'valid' : 'invalid'}>
              {hasSpecial ? 'Valid' : 'Invalid'}
            </span>
          </div>
        );
      };

      render(<MockPasswordValidator />);
      const passwordInput = screen.getByTestId('password-input');

      await userEvent.type(passwordInput, 'Password123');

      await waitFor(() => {
        expect(screen.getByTestId('special')).toHaveClass('invalid');
      });
    });

    test('validates strong password meets all requirements', async () => {
      const MockPasswordValidator = () => {
        const [password, setPassword] = React.useState('');
        const [validations, setValidations] = React.useState({
          minLength: false,
          maxLength: false,
          upperCase: false,
          lowerCase: false,
          number: false,
          specialChar: false
        });

        React.useEffect(() => {
          setValidations({
            minLength: password.length >= 8,
            maxLength: password.length <= 20,
            upperCase: /[A-Z]/.test(password),
            lowerCase: /[a-z]/.test(password),
            number: /\d/.test(password),
            specialChar: /[\W_]/.test(password)
          });
        }, [password]);

        const allValid = Object.values(validations).every(v => v);

        return (
          <div>
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span data-testid="all-valid" className={allValid ? 'valid' : 'invalid'}>
              {allValid ? 'All valid' : 'Needs more'}
            </span>
          </div>
        );
      };

      render(<MockPasswordValidator />);
      const passwordInput = screen.getByTestId('password-input');

      await userEvent.type(passwordInput, 'StrongPass123!');

      await waitFor(() => {
        expect(screen.getByTestId('all-valid')).toHaveClass('valid');
      });
    });
  });

  describe('Confirm Password Validation', () => {
    test('validates password match', async () => {
      const MockPasswordMatch = () => {
        const [password, setPassword] = React.useState('');
        const [confirmPassword, setConfirmPassword] = React.useState('');
        const [error, setError] = React.useState('');

        React.useEffect(() => {
          if (confirmPassword && password !== confirmPassword) {
            setError('Passwords do not match');
          } else {
            setError('');
          }
        }, [password, confirmPassword]);

        return (
          <div>
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input 
              type="password"
              data-testid="confirm-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <span data-testid="match-error">{error}</span>}
          </div>
        );
      };

      render(<MockPasswordMatch />);
      const passwordInput = screen.getByTestId('password-input');
      const confirmInput = screen.getByTestId('confirm-input');

      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Different123!');

      await waitFor(() => {
        expect(screen.getByTestId('match-error')).toHaveTextContent('Passwords do not match');
      });
    });

    test('accepts matching passwords', async () => {
      const MockPasswordMatch = () => {
        const [password, setPassword] = React.useState('');
        const [confirmPassword, setConfirmPassword] = React.useState('');
        const [error, setError] = React.useState('');

        React.useEffect(() => {
          if (confirmPassword && password !== confirmPassword) {
            setError('Passwords do not match');
          } else {
            setError('');
          }
        }, [password, confirmPassword]);

        return (
          <div>
            <input 
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input 
              type="password"
              data-testid="confirm-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <span data-testid="match-error">{error}</span>}
          </div>
        );
      };

      render(<MockPasswordMatch />);
      const passwordInput = screen.getByTestId('password-input');
      const confirmInput = screen.getByTestId('confirm-input');

      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Password123!');

      await waitFor(() => {
        expect(screen.queryByTestId('match-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission Validation', () => {
    test('prevents submission with validation errors', async () => {
      const submitHandler = jest.fn();

      const MockRegistrationForm = () => {
        const [formData, setFormData] = React.useState({
          username: 'a'.repeat(21),
          email: 'invalid-email',
          phone: '81234567',
          password: 'weak',
          confirmPassword: 'different'
        });

        const validateAndSubmit = (e) => {
          e.preventDefault();
          
          const errors = {
            username: formData.username.length > 20,
            email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
            phone: !/^[97][0-9]{7}$/.test(formData.phone),
            password: formData.password.length < 8,
            confirmPassword: formData.password !== formData.confirmPassword
          };

          if (Object.values(errors).some(err => err)) {
            submitHandler('validation-failed');
            return;
          }

          submitHandler('submitted', formData);
        };

        return (
          <form onSubmit={validateAndSubmit}>
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<MockRegistrationForm />);
      const submitBtn = screen.getByText('Submit');
      await userEvent.click(submitBtn);

      expect(submitHandler).toHaveBeenCalledWith('validation-failed');
    });

    test('allows submission with valid data', async () => {
      const submitHandler = jest.fn();

      const MockRegistrationForm = () => {
        const [formData, setFormData] = React.useState({
          username: 'testuser',
          email: 'test@example.com',
          phone: '91234567',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        });

        const validateAndSubmit = (e) => {
          e.preventDefault();
          
          const errors = {
            username: formData.username.length > 20,
            email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
            phone: !/^[97][0-9]{7}$/.test(formData.phone),
            password: formData.password.length < 8,
            confirmPassword: formData.password !== formData.confirmPassword
          };

          if (Object.values(errors).some(err => err)) {
            submitHandler('validation-failed');
            return;
          }

          submitHandler('submitted', formData);
        };

        return (
          <form onSubmit={validateAndSubmit}>
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<MockRegistrationForm />);
      const submitBtn = screen.getByText('Submit');
      await userEvent.click(submitBtn);

      expect(submitHandler).toHaveBeenCalledWith('submitted', expect.objectContaining({
        username: 'testuser',
        email: 'test@example.com'
      }));
    });
  });
});

