import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { Auth0ContextInterface, User } from '@auth0/auth0-react'

let auth0: Auth0ContextInterface<User> | null = null

export function bindAuth0(ctx: Auth0ContextInterface<User>) {
  auth0 = ctx
}

export async function getAccessToken(): Promise<string | null> {
  if (!auth0) return null
  try {
    const token = await auth0.getAccessTokenSilently()
    return token
  } catch {
    return null
  }
}

export function createAuthedHttp(baseURL = '/api'): AxiosInstance {
  const instance = axios.create({ baseURL, withCredentials: true })
  instance.interceptors.request.use(async (config: AxiosRequestConfig) => {
    const token = await getAccessToken()
    if (token) {
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
    }
    return config
  })
  return instance
}


