/**
 * @jest-environment node
 */
import { createWorkspace } from '#/util/data'
import wait from '#/util/wait'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('inactive.delay.spec', () => {
  const workspace = `test-workspace-inactive-delay-${Date.now()}`
  const token = `test-token-inactive-delay-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('delay set as inactive', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_delay=8&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await queue.patch(`/requests/${id}/inactive?_token=${token}`)

    const req = await queue.get(`/requests/${id}?_token=${token}`)
    expect(req.data).toMatchObject({
      source: 'REQUEST',
      delay: 8,
      status: 'INACTIVE',
      request: { method: 'GET' },
    })

    await wait(8000)

    const req2 = await queue.get(`/requests/${id}?_token=${token}`)
    expect(req2.data).toMatchObject({
      source: 'REQUEST',
      delay: 8,
      status: 'INACTIVE',
      request: { method: 'GET' },
    })
  })

  test('delay set as inactive and then active', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_delay=8&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await queue.patch(`/requests/${id}/inactive?_token=${token}`)
    await wait(2000)
    await queue.patch(`/requests/${id}/active?_token=${token}`)

    await wait(4000)

    const req2 = await queue.get(`/requests/${id}?_token=${token}`)
    expect(req2.data).toMatchObject({
      source: 'REQUEST',
      delay: 8,
      status: 'PENDING',
      request: { method: 'GET' },
    })

    await wait(6000)

    const req3 = await queue.get(`/requests/${id}?_token=${token}`)
    expect(req3.data).toMatchObject({
      source: 'REQUEST',
      delay: 8,
      status: 'SUCCESS',
      request: { method: 'GET' },
    })
  })
})
