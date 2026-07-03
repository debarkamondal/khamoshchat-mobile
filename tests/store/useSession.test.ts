import useSession from '@/src/store/useSession';

describe('useSession store', () => {
  beforeEach(async () => {
    // Reset state before each test
    await useSession.getState().clearSession();
  });

  it('has default state', () => {
    const state = useSession.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userId).toBeNull();
  });

  it('can set authenticated user', () => {
    useSession.getState().setAuthenticatedUser({
      token: 'test-token',
      userId: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: null,
    });

    const state = useSession.getState();
    expect(state.userId).toBe('test-user-123');
    expect(state.authProvider).toBe('google');
  });

  it('can clear session', async () => {
    useSession.getState().setAuthenticatedUser({
      token: 'test-token',
      userId: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: null,
    });

    let state = useSession.getState();
    expect(state.userId).toBe('test-user-123');

    await useSession.getState().clearSession();

    state = useSession.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userId).toBeNull();
  });
});
