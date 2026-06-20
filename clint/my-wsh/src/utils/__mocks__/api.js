exports.__esModule = true;
exports.default = {
  get: jest.fn((url) => {
    if (url && url.startsWith('/profile')) {
      return Promise.resolve({ data: { success: true, user: { userName: 'Test User' } } });
    }
    if (url === '/getWarranty') {
      return Promise.resolve({ data: { warranty: [] } });
    }
    if (url === '/getSubscriptions') {
      return Promise.resolve({ data: { subscriptions: [] } });
    }
    if (url === '/getHomeTasks') {
      return Promise.resolve({ data: { homeTasks: [] } });
    }
    return Promise.resolve({ data: {} });
  })
};
