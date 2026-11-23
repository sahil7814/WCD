import { api } from '../../api'

export const applicationService = {
  getAll() {
    return api('/applications')
  },

  getDrafts() {
    return api('/applications/drafts')
  },

  getDraft(id) {
    return api(`/applications/drafts/${id}`)
  },

  createDraft(formData) {
    return api('/applications/drafts', {
      method: 'POST',
      body: JSON.stringify({ formData })
    })
  },

  saveDraft(id, formData) {
    return api(`/applications/drafts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ formData })
    })
  },

  submitDraft(id, formData) {
    return api(`/applications/drafts/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ formData })
    })
  },

  getDashboard(filters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    const query = params.toString()
    return api(`/dashboard${query ? `?${query}` : ''}`)
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
