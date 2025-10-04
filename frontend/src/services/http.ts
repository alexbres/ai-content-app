import axios from 'axios'
import { createAuthedHttp } from './auth'
import { ZodError } from 'zod'

export const http = axios.create({ baseURL: '/api', withCredentials: true })
export const authedHttp = createAuthedHttp('/api')

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const resp = error?.response
    if (resp?.data?.error) {
      // standardize
      return Promise.reject(new Error(resp.data.error))
    }
    if (error instanceof ZodError) {
      return Promise.reject(new Error('ValidationError'))
    }
    return Promise.reject(error)
  }
)


