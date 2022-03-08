/**
 * @jest-environment node
 */

import { omit } from 'lodash'
import { createWorkspace } from '#/util/data'
import waitFor from '#/util/waitFor'
import wait from '#/util/wait'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('delayuntil.spec', () => {
  const workspace = `test-workspace-delayuntil-${Date.now()}`
  const token = `test-token-delayuntil-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('add delayed request using _delay_until param', async () => {
    const before = Date.now() / 1000
    const delay = 10
    const res = await queue.get(`/https://postman-echo.com/get?_delay_until=${before + delay}&_token=${token}`)

    expect(res.data).toHaveProperty('id')

    const pending = await queue.get(`/requests/${res.data.id}?_token=${token}`)
    expect(pending.data).toMatchObject({
      status: 'PENDING',
    })
    expect(pending.data.start).toBe(before + delay)

    await wait(delay * 1000)

    const req = await waitFor(
      () => queue.get(`/requests/${res.data.id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      attempts: 1,
      status: 'SUCCESS',
      source: 'REQUEST',
      request: { method: 'GET' },
      response: { headers: { connection: 'close' }, status: 200 },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('add delayed request using X-Delay-Until header', async () => {
    const before = Date.now() / 1000
    const delay = 10
    const res = await queue.get(`/https://postman-echo.com/get?_token=${token}`, {
      headers: { 'X-Zeplo-Delay-Until': before + delay },
    })

    expect(res.data).toHaveProperty('id')

    const pending = await queue.get(`/requests/${res.data.id}?_token=${token}`)
    expect(pending.data).toMatchObject({
      status: 'PENDING',
    })
    expect(pending.data.start).toBe(before + delay)

    await wait(delay * 1000)

    const req = await waitFor(
      () => queue.get(`/requests/${res.data.id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      attempts: 1,
      status: 'SUCCESS',
      source: 'REQUEST',
      request: { method: 'GET' },
      response: { headers: { connection: 'close' }, status: 200 },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })
})
