import axios, { AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
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
  } catch (error) {
    console.error('Error getting access token:', error)
    return null
  }
}

export function createAuthedHttp(baseURL = '/api'): AxiosInstance {
  const instance = axios.create({ baseURL, withCredentials: true })
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken()
    if (token) {
      const headers: any = config.headers || {}
      if (typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${token}`)
      } else {
        config.headers = { ...headers, Authorization: `Bearer ${token}` } as any
      }
    }
    return config
  })
  return instance
}


