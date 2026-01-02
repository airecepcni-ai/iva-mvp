import * as React from 'react';
import { useSession } from '@hono/auth-js/react';

const EMPTY_USER = {
  id: '',
  email: '',
  name: '',
};

const useUser = () => {
  const session = useSession();

  const user = React.useMemo(() => {
    const u = session?.data?.user;
    if (!u) return EMPTY_USER;
    return {
      id: u.id ?? '',
      email: u.email ?? '',
      name: u.name ?? '',
    };
  }, [session?.data?.user]);

  const refetchUser = React.useCallback(() => {
    // SessionProvider handles refetching; keep this for backwards compatibility.
  }, []);

  return {
    user,
    data: user,
    loading: session?.status === 'loading',
    refetch: refetchUser,
  };
};

export { useUser };

export default useUser;