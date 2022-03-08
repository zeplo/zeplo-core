/**
 * @jest-environment node
 */

import { omit } from 'lodash'
import { createWorkspace } from '#/util/data'
import waitFor from '#/util/waitFor'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('noconflict.spec', () => {
  const workspace = `test-workspace-noconflict-${Date.now()}`
  const token = `test-token-noconflict-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('queue with noconflict ignores query params', async () => {
    const res = await queue.get('/https://postman-echo.com/get?_retry=3&_delay=600', {
      headers: { 'X-Zeplo-Token': token, 'X-Zeplo-No-Conflict': 1 },
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
    })

    expect(req.data.retry).not.toBeDefined()
    expect(req.data.delay).not.toBeDefined()

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })
})
