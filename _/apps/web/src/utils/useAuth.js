import { useCallback } from 'react';
import { signIn, signOut } from '@hono/auth-js/react';

function useAuth() {
  const callbackUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('callbackUrl')
      : null;

  const signInWithCredentials = useCallback(
    async (options) => {
      return signIn('credentials-signin', {
        email: options.email,
        password: options.password,
        callbackUrl: callbackUrl ?? options.callbackUrl ?? '/dashboard',
        redirect: options.redirect ?? true,
      });
    },
    [callbackUrl]
  );

  const signUpWithCredentials = useCallback(
    async (options) => {
      return signIn('credentials-signup', {
        email: options.email,
        password: options.password,
        name: options.name,
        image: options.image,
        callbackUrl: callbackUrl ?? options.callbackUrl ?? '/dashboard',
        redirect: options.redirect ?? true,
      });
    },
    [callbackUrl]
  );

  const signInWithGoogle = useCallback(
    async (options = {}) => {
      return signIn('google', {
        callbackUrl: callbackUrl ?? options.callbackUrl ?? '/dashboard',
        redirect: options.redirect ?? true,
      });
    },
    [callbackUrl]
  );

  const signOutUser = useCallback(async (options) => {
    return signOut({
      callbackUrl: options?.callbackUrl ?? '/',
      redirect: options?.redirect ?? true,
    });
  }, []);

  return {
    signInWithCredentials,
    signUpWithCredentials,
    signInWithGoogle,
    signOut: signOutUser,
  };
}

export default useAuth;