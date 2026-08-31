const axios = require('axios');
const config = require('./config');

class SiseliClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.siseli.baseUrl,
      timeout: config.siseli.timeout,
      headers: config.siseli.headers
    });
  }

  // Gửi request POST kèm Token
  async post(endpoint, data = {}, token = null) {
    try {
      const headers = { ...config.siseli.headers };
      if (token && !token.startsWith('demo_token')) {
        headers['Access-Token'] = token;
        headers['IOT-Token'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.client.post(endpoint, data, { headers });
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.warn(`[Siseli API POST ${endpoint} Error]:`, error.response?.data || error.message);
      return {
        success: false,
        status: error.response?.status || 500,
        data: error.response?.data || { code: -1, message: error.message }
      };
    }
  }

  // Gửi request GET kèm Token
  async get(endpoint, token = null) {
    try {
      const headers = { ...config.siseli.headers };
      if (token && !token.startsWith('demo_token')) {
        headers['Access-Token'] = token;
        headers['IOT-Token'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.client.get(endpoint, { headers });
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.warn(`[Siseli API GET ${endpoint} Error]:`, error.response?.data || error.message);
      return {
        success: false,
        status: error.response?.status || 500,
        data: error.response?.data || { code: -1, message: error.message }
      };
    }
  }

  // Helper methods cho quản lý khách hàng
  async getSubordinates(token) {
    return this.get('/user/subordinate/list', token);
  }

  async createAccount(token, data) {
    return this.post('/user/create/account', data, token);
  }

  async getUserInfo(token, userId) {
    return this.get(`/user/info?userId=${userId}`, token);
  }

  async updateUserInfo(token, data) {
    return this.post('/user/update/info', data, token);
  }

  async updatePassword(token, data) {
    return this.post('/user/update/authPassword', data, token);
  }

  async deleteAccount(token) {
    return this.post('/user/logout/account', {}, token);
  }

  async addUserToGroup(token, groupId, userId) {
    return this.post('/user/group/add/user', { groupId, userId }, token);
  }
}

module.exports = new SiseliClient();
