/**
 * @jest-environment node
 */
import { createWorkspace } from '#/util/data'
import waitFor from '#/util/waitFor'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('invalid.spec', () => {
  const workspace = `test-workspace-invalid-${Date.now()}`
  const token = `test-token-invalid-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('error invalid cron format - too many items', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_cron=* * * * * *&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'ERROR',
    )
    expect(req.data).toMatchObject({
      attempts: 1,
      status: 'ERROR',
      message: 'Invalid CRON format',
      source: 'REQUEST',
    })
  })

  test('error invalid cron format - too few items', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_cron=* * * *&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'ERROR',
    )
    expect(req.data).toMatchObject({
      attempts: 1,
      status: 'ERROR',
      message: 'Invalid CRON format',
      source: 'REQUEST',
    })
  })

  test('error invalid cron format - out of range', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_cron=* * 100 * *&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'ERROR',
    )
    expect(req.data).toMatchObject({
      attempts: 1,
      status: 'ERROR',
      message: 'Invalid CRON format',
      source: 'REQUEST',
    })
  })

  test('error invalid interval - <1', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_interval=0.1&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'ERROR',
    )
    expect(req.data).toMatchObject({
      attempts: 1,
      status: 'ERROR',
      message: 'Interval exceeds minimum interval of < 1s',
      source: 'REQUEST',
    })
  })

  test('ignore invalid number for delay param', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_delay=NaN&_token=${token}`)
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
    })
  })

  test('error non-existant URL', async () => {
    const res = await queue.get(`/https://domain-does-not-exist.com/get?_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'ERROR',
    )
    expect(req.data).toMatchObject({
      attempts: 1,
      status: 'ERROR',
      message: 'getaddrinfo ENOTFOUND domain-does-not-exist.com',
      source: 'REQUEST',
    })
  })

  test.todo('request timeout') // TODO: should this be in its own section?
})
