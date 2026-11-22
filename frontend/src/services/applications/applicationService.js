import { api } from '../../api'

export const applicationService = {
  getAll() {
    return api('/applications')
  },

  getDashboard() {
    return api('/dashboard')
  },

  create(application) {
    return api('/applications', {
      method: 'POST',
      body: JSON.stringify(application)
    })
  },

  updateStatus(id, status, remarks = '') {
    return api(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks })
    })
  }
}
