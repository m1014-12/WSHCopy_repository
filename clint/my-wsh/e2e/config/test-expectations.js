// Test expectations that match your app's actual behavior
export const EXPECTED_MESSAGES = {
  // Login messages
  loginFailed: 'Login failed.',
  loginFailedDetails: 'Login failed. Please enter the correct email and password',
  fillAllFields: 'Please fill in all fields.',
  
  // Registration messages
  registrationDone: 'Registration done.',
  registrationFailed: 'Registration failed.',
  usernameMax: 'Username must not exceed 20 characters',
  emailValid: 'Please enter a valid email address',
  phoneValid: 'Phone number must start with 9 or 7 and be exactly 8 digits',
  passwordInvalid: 'Password does not meet all requirements',
  passwordsNoMatch: 'Passwords do not match',
  fillAll: 'Please fill in all fields.',
  
  // Password reset messages
  passwordUpdated: 'Password successfully updated',
  somethingWrong: 'Something went wrong, please check your password',
  passwordMismatch: 'Passwords do not match',
  
  // Forgot password messages
  resetLinkSent: 'Password reset link sent to your email',
  errorMessage: 'An error occurred. Please try again.',
  
  // Page titles
  welcome: 'Welcome',
  login: 'Login',
  registration: 'Registration',
  resetPassword: 'Reset Password',
  forgotPassword: 'Forgot Password'
};

export const FORM_SELECTORS = {
  // Login form
  email: '#email',
  password: '#password',
  submitButton: 'button[type="submit"]',
  loginButton: 'button[type="submit"]',
  
  // Admin login form
  accessName: '#accessName',
  adminPassword: '#adminPassword',
  adminKey: '#adminKey',
  
  // Registration form
  username: '#username',
  phoneNumber: '#phoneNumber',
  confirmPassword: '#confirmPassword',
  
  // Password reset form
  newPassword: '#password',
  confirmNewPassword: '#confirmPassword'
};

export const NAVIGATION_LINKS = {
  forgotPassword: 'a[href="/forgot-password"]',
  register: 'a[href="/registration"]',
  login: 'a[href="/login"]'
};

export const VALIDATION_MESSAGES = {
  // Password requirements
  minLength: 'At least 8 characters',
  maxLength: 'Not more than 20 characters',
  upperCase: 'At least 1 uppercase letter',
  lowerCase: 'At least 1 lowercase letter',
  number: 'At least 1 number',
  specialChar: 'At least 1 special character'
};
