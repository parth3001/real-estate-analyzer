import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { analysisHandlers } from './handlers/analysis'
import { userHandlers } from './handlers/user'

// This configures a request mocking server with the given request handlers.
export const server = setupServer(
  ...authHandlers,
  ...analysisHandlers,
  ...userHandlers
)