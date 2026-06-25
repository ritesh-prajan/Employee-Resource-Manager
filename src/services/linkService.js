/**
 * @file linkService.js
 * @description Service layer for the Links (Knowledge) API — /api/v1/links
 */

import { api } from './api';

const BASE = '/links';

const linkService = {
  /**
   * Get all links (paginated & filterable).
   * @param {Object} params - Query parameters
   * @param {string}  [params.filename]  - case-insensitive partial match
   * @param {number}  [params.createdBy] - exact match creator User ID
   * @param {string}  [params.createdAt] - exact match date YYYY-MM-DD
   * @param {number}  [params.page=0]
   * @param {number}  [params.size=10]
   * @param {string}  [params.sortBy='createdAt']
   * @param {string}  [params.sortDir='desc']
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.filename)  query.set('filename',  params.filename);
    if (params.createdBy) query.set('createdBy', params.createdBy);
    if (params.createdAt) query.set('createdAt', params.createdAt);
    query.set('page',    String(params.page    ?? 0));
    query.set('size',    String(params.size    ?? 10));
    query.set('sortBy',  params.sortBy  || 'createdAt');
    query.set('sortDir', params.sortDir || 'desc');

    return api.get(`${BASE}?${query.toString()}`);
  },

  /** Get a single link by ID */
  async getById(id) {
    return api.get(`${BASE}/${id}`);
  },

  /** Create a new link */
  async create(data) {
    return api.post(BASE, data);
  },

  /** Update an existing link */
  async update(id, data) {
    return api.put(`${BASE}/${id}`, data);
  },

  /** Delete a link */
  async delete(id) {
    return api.delete(`${BASE}/${id}`);
  },
};

export default linkService;
