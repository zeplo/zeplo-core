/**
 * @jest-environment node
 */

import { omit } from 'lodash'
import { createWorkspace } from '#/util/data'
import waitFor from '#/util/waitFor'
import wait from '#/util/wait'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('delay.spec', () => {
  const workspace = `test-workspace-delay-${Date.now()}`
  const token = `test-token-delay-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('add delayed request using _delay param', async () => {
    const before = Date.now() / 1000
    const delay = 10
    const res = await queue.get(`/https://postman-echo.com/get?_delay=${delay}&_token=${token}`)
    const after = Date.now() / 1000

    expect(res.data).toHaveProperty('id')

    const pending = await queue.get(`/requests/${res.data.id}?_token=${token}`)
    expect(pending.data).toMatchObject({
      status: 'PENDING',
    })
    expect(pending.data.start).toBeGreaterThan(before + delay)
    expect(pending.data.start).toBeLessThan(after + delay + 1)

    // Can take 5 seconds for log to flush!
    // await wait(6000)

    // const pending2 = await queue.get(`/requests?_token=${token}`)
    // expect(pending2.data[0]).toMatchObject({
    //   status: 'PENDING',
    // })

    await wait(10000)

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

  test('add delayed request using X-Zeplo-Delay header', async () => {
    const before = Date.now() / 1000
    const delay = 10
    const res = await queue.get(`/https://postman-echo.com/get?_token=${token}`, {
      headers: { 'X-Zeplo-Delay': delay },
    })
    const after = Date.now() / 1000

    expect(res.data).toHaveProperty('id')

    const pending = await queue.get(`/requests/${res.data.id}?_token=${token}`)
    expect(pending.data).toMatchObject({
      status: 'PENDING',
    })
    expect(pending.data.start).toBeGreaterThan(before + delay - 1)
    expect(pending.data.start).toBeLessThan(after + delay + 1)

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
