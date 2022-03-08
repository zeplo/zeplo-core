/**
 * @jest-environment node
 */

import { omit } from 'lodash'
import { createWorkspace } from '#/util/data'
import waitFor from '#/util/waitFor'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('environment.spec', () => {
  const workspace = `test-workspace-env-${Date.now()}`
  const token = `test-token-env-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('queue with _env attribute', async () => {
    const res = await queue.get('/https://postman-echo.com/get?_retry=3&_env=production', {
      headers: { 'X-Zeplo-Token': token },
    })
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )
    expect(req.data).toMatchObject({
      attempts: 1,
      status: 'SUCCESS',
      source: 'REQUEST',
      request: { method: 'GET' },
      response: { status: 200 },
      env: 'production',
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })
})
