/**
 * @jest-environment node
 */

import { omit } from 'lodash'
import { createWorkspace } from '#/util/data'
import wait from '#/util/wait'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('interval.spec', () => {
  const workspace = 'test-workspace-interval'
  const token = 'test-token-interval'

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('interval of 1s', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_interval=1&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await wait(3000)

    const req = await queue.get(`/requests/${id}?_token=${token}`)

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      interval: 1,
      request: { method: 'GET' },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()

    const children = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children.data.length).toBeGreaterThanOrEqual(3)
    expect(children.data.length).toBeLessThanOrEqual(6)
    expect(children.data[0]).toMatchObject({
      status: 'PENDING',
      source: 'SCHEDULE',
      trace: id,
    })
    expect(children.data[1].status).not.toBe('PENDING')
  })

  test('interval of 10s', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_interval=8&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await wait(2000)

    const req = await queue.get(`/requests/${id}?_token=${token}`)

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      interval: 8,
      request: { method: 'GET' },
    })

    const children = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children.data.length).toBe(1)
    expect(children.data[0]).toMatchObject({
      status: 'PENDING',
      source: 'SCHEDULE',
      trace: id,
    })

    await wait(8000)

    // TODO: check the start dates
    const children2 = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children2.data.length).toBe(2)
    expect(children2.data[0]).toMatchObject({
      status: 'PENDING',
      source: 'SCHEDULE',
      trace: id,
    })
    expect(children2.data[1]).toMatchObject({
      status: 'SUCCESS',
      source: 'SCHEDULE',
      trace: id,
    })
  })
})
