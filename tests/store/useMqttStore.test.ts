import useMqttStore from '@/src/store/useMqttStore';

describe('useMqttStore', () => {
  beforeEach(() => {
    useMqttStore.setState({
      client: undefined,
      isConnected: false,
    });
  });

  it('has default disconnected state', () => {
    const state = useMqttStore.getState();
    expect(state.isConnected).toBe(false);
    expect(state.client).toBeUndefined();
  });

  it('can update connection status', () => {
    useMqttStore.getState().setConnected(true);
    const state = useMqttStore.getState();
    expect(state.isConnected).toBe(true);
  });
});
