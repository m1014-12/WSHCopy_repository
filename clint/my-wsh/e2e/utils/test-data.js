// Test data for E2E tests
const testUsers = {
  validUser: {
    email: 'testuser@example.com',
    password: 'Password123!',
    username: 'testuser',
    phoneNumber: '97123456'
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
    username: 'invaliduser',
    phoneNumber: '123456'
  },
  adminUser: {
    accessName: 'testadmin',
    password: 'AdminPass123!',
    adminKey: 'adminkey123'
  }
};

const testUrls = {
  login: '/login',
  registration: '/registration',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password/123/token123',
  home: '/home',
  adminHome: '/admin-home'
};

const validationMessages = {
  fillAllFields: 'Please fill in all fields',
  emailValid: 'Please enter a valid email',
  passwordInvalid: 'Password does not meet requirements',
  passwordsNoMatch: 'Passwords do not match',
  phoneValid: 'Please enter a valid phone number',
  usernameMax: 'Username cannot exceed 20 characters'
};

module.exports = {
  testUsers,
  testUrls,
  validationMessages
};
