/**
 * @jest-environment node
 */
import { createWorkspace } from '#/util/data'
import wait from '#/util/wait'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('inactive.schedule.spec', () => {
  const workspace = `test-workspace-inactive-schedule-${Date.now()}`
  const token = `test-token-inactive-schedule-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('interval set as inactive', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_interval=8&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await wait(1000)

    await queue.patch(`/requests/${id}/inactive?_token=${token}`)

    const req = await queue.get(`/requests/${id}?_token=${token}`)

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      interval: 8,
      status: 'INACTIVE',
      request: { method: 'GET' },
    })

    await wait(1000)

    const children = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children.data.length).toBe(1)
    expect(children.data[0]).toMatchObject({
      status: 'INACTIVE',
      source: 'SCHEDULE',
      trace: id,
    })

    await wait(8000)

    const children2 = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children2.data.length).toBe(1)
    expect(children2.data[0]).toMatchObject({
      status: 'INACTIVE',
      source: 'SCHEDULE',
      trace: id,
    })
  })

  test('interval set as inactive and then active', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_interval=5&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await wait(1000)

    await queue.patch(`/requests/${id}/inactive?_token=${token}`)

    await wait(2000)

    await queue.patch(`/requests/${id}/active?_token=${token}`)

    await wait(1000)

    const children2 = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children2.data.length).toBe(2)
    expect(children2.data[0]).toMatchObject({
      status: 'PENDING',
      source: 'SCHEDULE',
      trace: id,
    })
  })

  test('interval child set as inactive', async () => {
    jest.setTimeout(60000)

    const res = await queue.get(`/https://postman-echo.com/get?_interval=8&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await wait(1000)

    const children = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children.data.length).toBe(1)
    expect(children.data[0]).toMatchObject({
      status: 'PENDING',
      source: 'SCHEDULE',
      trace: id,
    })

    await queue.patch(`/requests/${children.data[0].id}/inactive?_token=${token}`)

    await wait(9000)

    const children2 = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children2.data.length).toBe(2)
    expect(children2.data[0]).toMatchObject({
      status: 'PENDING',
      source: 'SCHEDULE',
      trace: id,
    })
    expect(children2.data[1]).toMatchObject({
      status: 'INACTIVE',
      source: 'SCHEDULE',
      trace: id,
    })
  })
})
