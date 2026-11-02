import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const PLACEHOLDER_KEY = !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('*');
const hasLibrary = window.supabase && typeof window.supabase.createClient === 'function';

function createLocalDemoClient() {
  const SESSION_KEY = 'taplink-demo-session';
  const readSession = () => {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (session?.id === 'demo-user') {
      session.id = '00000000-0000-4000-8000-000000000001';
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return session;
  };
  const saveSession = (email) => {
    const sessionUser = { id: '00000000-0000-4000-8000-000000000001', email, user_metadata: { email } };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  };

  const emptyQuery = {
    select() { return this; },
    eq() { return this; },
    order() { return this; },
    single() { return Promise.resolve({ data: null, error: null }); },
    insert() { return Promise.resolve({ data: null, error: null }); },
    update() { return this; },
    delete() { return Promise.resolve({ data: null, error: null }); },
    then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); }
  };

  return {
    auth: {
      async getUser() { return { data: { user: readSession() }, error: null }; },
      async getSession() { return { data: { session: readSession() ? {} : null }, error: null }; },
      async signInWithPassword({ email }) { return { data: { user: saveSession(email) }, error: null }; },
      async signUp({ email }) { return { data: { user: saveSession(email), session: {} }, error: null }; },
      async signOut() { localStorage.removeItem(SESSION_KEY); return { error: null }; }
    },
    from() { return { ...emptyQuery }; },
    storage: { from() { return { upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }; } }
  };
}

let client = null;
if (!PLACEHOLDER_KEY && hasLibrary) {
  try {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.warn('Supabase configuration is invalid. Using local demo sign-in.', error);
  }
}

if (!client) {
  console.warn('Supabase credentials are not configured. Using local demo sign-in.');
  client = createLocalDemoClient();
} else {
  const originalAuth = client.auth;
  const localSessionKey = 'taplink-demo-session';
  const getLocalSession = () => {
    const session = JSON.parse(localStorage.getItem(localSessionKey) || 'null');
    if (session?.id === 'demo-user') {
      session.id = '00000000-0000-4000-8000-000000000001';
      localStorage.setItem(localSessionKey, JSON.stringify(session));
    }
    return session;
  };
  client.auth = new Proxy(originalAuth, {
    get(auth, property) {
      if (property === 'getUser') {
        return async () => {
          const localUser = getLocalSession();
          return localUser
            ? { data: { user: localUser }, error: null }
            : auth.getUser();
        };
      }
      if (property === 'getSession') {
        return async () => {
          const localUser = getLocalSession();
          return localUser
            ? { data: { session: { user: localUser } }, error: null }
            : auth.getSession();
        };
      }
      if (property === 'signOut') {
        return async () => {
          localStorage.removeItem(localSessionKey);
          return auth.signOut();
        };
      }
      const value = Reflect.get(auth, property, auth);
      return typeof value === 'function' ? value.bind(auth) : value;
    }
  });
}

export const supabase = client;
export const usingLocalDemoAuth = false;
