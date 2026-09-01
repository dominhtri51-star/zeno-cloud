module.exports = {
  port: process.env.PORT || 4000,
  siseli: {
    baseUrl: process.env.SISELI_BASE_URL || 'https://bha-solar.pages.dev/api',
    directCloudUrl: 'https://solar.siseli.com/apis',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Time-Zone': process.env.SISELI_TIMEZONE || 'Asia/Ho_Chi_Minh',
      'Accept-Language': process.env.SISELI_LANGUAGE || 'vi',
      'X-Helios-Provider': 'sunwise'
    }
  }
};
