export const environment = {
  production: false,
  baseUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000',
  // baseUrl: 'http://161.196.42.224:3000/api',
  // baseUrl: 'http://161.196.42.67:3000/api',
  inactivity: {
    // timeout: 30000,       // 30 SEGUNDOS (30000 ms)
    // warningTime: 5000,    // 5 SEGUNDOS (5000 ms)
    timeout: 30 * 60 * 1000, // 30 MINUTOS (1,800,000 ms)
    warningTime: 5 * 60 * 1000, // 5 MINUTOS (300,000 ms)
  },
};
