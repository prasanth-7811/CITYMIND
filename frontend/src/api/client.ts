import axios from 'axios'

// FastAPI (simulation, map, dashboard) via Vite proxy
const api = axios.create({ baseURL: '/api' })

// Node.js/Express server (MongoDB CRUD for reports)
const nodeApi = axios.create({ baseURL: 'http://localhost:3001/api' })

export const getDashboard = () => api.get('/dashboard').then(r => r.data)
export const getCityMap   = () => api.get('/city').then(r => r.data)
export const getRoads     = () => api.get('/roads').then(r => r.data)
export const runSimulation = (data: any) => api.post('/simulate', data).then(r => r.data)
export const applyRecommendation = (simulation_id: number) =>
  api.post('/apply-recommendation', { simulation_id }).then(r => r.data)

// Reports — MongoDB via Node.js
export const getReports   = () => nodeApi.get('/reports').then(r => r.data)
export const createReport = (data: any) => nodeApi.post('/reports', data).then(r => r.data)
export const updateReport = (id: string, data: any) => nodeApi.put(`/reports/${id}`, data).then(r => r.data)
export const deleteReport = (id: string) => nodeApi.delete(`/reports/${id}`).then(r => r.data)
export const resolveReport = (id: string) =>
  nodeApi.patch(`/reports/${id}/status`, { status: 'resolved' }).then(r => r.data)

export default api
