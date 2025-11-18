import { Auth0Provider, AppState, useAuth0 } from '@auth0/auth0-react'
import { ReactNode, useCallback, useEffect } from 'react'
import { bindAuth0 } from '../services/auth'

type Props = {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN as string
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined
  
  const onRedirectCallback = useCallback((appState?: AppState) => {
    const targetUrl = appState?.returnTo || window.location.pathname
    window.history.replaceState({}, document.title, targetUrl)
  }, [])

  if (!domain || !clientId) {
    if (import.meta.env.DEV) console.warn('Auth0 env vars are missing. Auth disabled.')
    return children as any
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin + '/',
        audience: audience || undefined,
        scope: 'openid profile email offline_access',
      }}
      cacheLocation="memory"
      useRefreshTokens={false}
      onRedirectCallback={onRedirectCallback}
    >
      <AuthBinder />
      {children}
    </Auth0Provider>
  )
}

function AuthBinder() {
  const ctx = useAuth0()
  useEffect(() => {
    bindAuth0(ctx)
  }, [ctx])
  return null
}


