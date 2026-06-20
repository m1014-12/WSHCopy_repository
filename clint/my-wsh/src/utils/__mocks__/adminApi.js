exports.__esModule = true;
exports.statisticsApi = {
  getStatistics: jest.fn().mockResolvedValue({
    statistics: {
      users: { total: 5, active: 2 },
      warranties: { total: 3, inPeriod: 1, categories: [] },
      subscriptions: { total: 1, inPeriod: 0 },
      tasks: { total: 4, completed: 2, pending: 2, statusDistribution: [] }
    }
  }),
  getReminderStats: jest.fn().mockResolvedValue({ stats: null })
};
