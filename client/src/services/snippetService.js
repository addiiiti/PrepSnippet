import api from './api';

const snippetService = {
  getAll: async (params = {}) => {
    const response = await api.get('/snippets', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/snippets/${id}`);
    return response.data;
  },

  analyze: async (code, language) => {
    const response = await api.post('/snippets/analyze', { code, language });
    return response.data;
  },

  create: async (snippetData) => {
    const response = await api.post('/snippets', snippetData);
    return response.data;
  },

  update: async (id, snippetData) => {
    const response = await api.put(`/snippets/${id}`, snippetData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/snippets/${id}`);
    return response.data;
  },

  generateInterview: async (id) => {
    const response = await api.post(`/snippets/${id}/interview`);
    return response.data;
  },

  search: async (query) => {
    const response = await api.get('/snippets', { params: { search: query } });
    return response.data;
  },
};

export default snippetService;
