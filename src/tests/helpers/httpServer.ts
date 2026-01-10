import type { Server } from 'http';
import { utils } from '../../utils/utils';

type TestServer = {
  baseUrl: string;
  close: () => Promise<void>;
};

export async function startTestServer(): Promise<TestServer> {
  // Try to silence dotenv logs in tests (dotenv supports this flag)
  process.env.DOTENV_CONFIG_QUIET ??= 'true';

  const { default: app } = await import('../../app');

  const server: Server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));

  const address = server.address();
  if (!address || utils.isString(address)) throw new Error('Unexpected server address');

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}
