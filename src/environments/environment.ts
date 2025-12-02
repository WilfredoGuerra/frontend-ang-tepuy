export const environment = {
  production: false,
  baseUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000',
  // baseUrl: 'http://161.196.42.67:3000/api',
  // wsUrl: 'http://161.196.42.67:3000',
  inactivity: {
    // timeout: 30000,       // 30 SEGUNDOS (30000 ms)
    // warningTime: 5000,    // 5 SEGUNDOS (5000 ms)
    timeout: 30 * 60 * 1000,    // 30 MINUTOS
    warningTime: 5 * 60 * 1000, // 5 MINUTOS
  },
};
