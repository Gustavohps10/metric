import '@testing-library/jest-dom'

import { server } from './mocks/server'

// MSW lifecycle
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
