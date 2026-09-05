import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getDashboard = () => api.get('/dashboard').then(r => r.data)
export const getCityMap = () => api.get('/city').then(r => r.data)
export const getRoads = () => api.get('/roads').then(r => r.data)
export const getReports = () => api.get('/reports').then(r => r.data)
export const createReport = (data: any) => api.post('/reports', data).then(r => r.data)
export const runSimulation = (data: any) => api.post('/simulate', data).then(r => r.data)
export const applyRecommendation = (simulation_id: number) =>
  api.post('/apply-recommendation', { simulation_id }).then(r => r.data)

export default api
