/**
 * @jest-environment node
 */

import { omit } from 'lodash'
import { createWorkspace } from '#/util/data'
import waitFor from '#/util/waitFor'
import wait from '#/util/wait'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('retry.spec', () => {
  const workspace = `test-workspace-retry-${Date.now()}`
  const token = `test-token-retry-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('retry GET request * 3 with initial success - using _retry param', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_retry=${3}&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await queue.get(`/requests/${id}?_token=${token}`)

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      retry: { max: 3, backoff: 'FIXED', time: 1 },
      request: { method: 'GET' },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('retry GET request with FIXED 8 second backoff', async () => {
    const res = await queue.post(`/https://postman-echo.com/get?_retry=1|fixed|8&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await wait(4000)

    const before = await queue.get(`/requests/${id}?_token=${token}`)
    expect(before.data.attempts).toBe(1)

    await wait(6000)

    const after = await queue.get(`/requests/${id}?_token=${token}`)
    expect(before.data.attempts).toBe(1)

    expect(after.data).toMatchObject({
      attempts: 2,
      source: 'REQUEST',
      retry: { max: 1, backoff: 'FIXED', time: 8 },
    })
  })

  test('retry GET request with EXPONENTIAL 2 second backoff', async () => {
    const res = await queue.post(`/https://postman-echo.com/get?_retry=2|exponential|2&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await wait(3000)

    const before = await queue.get(`/requests/${id}?_token=${token}`)
    expect(before.data.attempts).toBe(2)

    await wait(5000)

    const after = await queue.get(`/requests/${id}?_token=${token}`)
    expect(after.data.attempts).toBe(3)

    expect(after.data).toMatchObject({
      attempts: 3,
      source: 'REQUEST',
      retry: { max: 2, backoff: 'EXPONENTIAL', time: 2 },
    })
  })

  test('retry GET request with IMMEDIATE', async () => {
    const res = await queue.post(`/https://postman-echo.com/get?_retry=1|IMMEDIATE&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await wait(3000)

    const req = await queue.get(`/requests/${id}?_token=${token}`)

    expect(req.data).toMatchObject({
      attempts: 2,
      source: 'REQUEST',
      retry: { max: 1, backoff: 'IMMEDIATE' },
    })
  })

  test('retry GET request * 3 with initial success - using X-Zeplo-Retry param', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_token=${token}`, {
      headers: { 'X-Zeplo-Retry': 3 },
    })
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await queue.get(`/requests/${id}?_token=${token}`)

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      retry: { max: 3, backoff: 'FIXED', time: 1 },
      request: { method: 'GET' },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('retry GET request * 3 with 404 error', async () => {
    const res = await queue.get(`/https://postman-echo.com/post?_retry=${3}&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    await wait(4000)

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.attempts >= 4,
    )

    expect(req.data).toMatchObject({
      status: 'ERROR',
      source: 'REQUEST',
      attempts: 4,
      retry: { max: 3, backoff: 'FIXED', time: 1 },
      request: { method: 'GET' },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()

    const children = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children.data.length).toBe(3)
    expect(children.data[0]).toMatchObject({
      status: 'ERROR',
      trace: id,
    })
  })

  test('retry with invalid param should default to 1 - AZ chars', async () => {
    const res = await queue.get(`/https://postman-echo.com/post?_retry=abc123asd&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.attempts >= 2,
    )

    expect(req.data).toMatchObject({
      attempts: 2,
      status: 'ERROR',
      source: 'REQUEST',
      retry: { max: 1, backoff: 'FIXED', time: 1 },
    })
  })

  test('retry GET request with unknown backoff approrach uses default', async () => {
    const res = await queue.post(`/https://postman-echo.com/get?_retry=1|unknown&_token|asdasd&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await queue.get(`/requests/${id}?_token=${token}`)

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      retry: { max: 1, backoff: 'FIXED', time: 1 },
    })
  })

  test('retry GET request with lowercase backoff', async () => {
    const res = await queue.post(`/https://postman-echo.com/get?_retry=1|fixed|2&_token|asdasd&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await queue.get(`/requests/${id}?_token=${token}`)

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      retry: { max: 1, backoff: 'FIXED', time: 2 },
    })
  })

  test('retry with too many params', async () => {
    const res = await queue.get(`/https://postman-echo.com/post?_retry=1|FIXED|1|another&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.attempts >= 2,
    )

    expect(req.data).toMatchObject({
      attempts: 2,
      status: 'ERROR',
      source: 'REQUEST',
      retry: { max: 1, backoff: 'FIXED', time: 1 },
    })
  })
})
