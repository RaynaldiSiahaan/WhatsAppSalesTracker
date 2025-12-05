process.env.DB_PASSWORD = 'test';
process.env.JWT_SECRET = 'test';

// Mock uuid globally to avoid ESM issues and provide deterministic values
jest.mock('uuid', () => ({
  v4: () => '00000000-0000-0000-0000-000000000000',
}));
