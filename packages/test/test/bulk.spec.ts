/**
 * @jest-environment node
 */
import qs from 'query-string'
import { omit } from 'lodash'
import { createWorkspace } from '#/util/data'
import waitFor from '#/util/waitFor'
import queue from '#/util/queue'

jest.setTimeout(30000)

describe('bulk.spec', () => {
  const workspace = `test-workspace-bulk-${Date.now()}`
  const token = `test-token-bulk-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('single bulk request with URL only', async () => {
    const res = await queue.post(`/bulk?_token=${token}`, [{
      url: 'https://postman-echo.com/post',
    }])
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toHaveProperty('id')
    const id = res.data[0].id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: { method: 'POST' },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('single bulk request with URL without scheme', async () => {
    const res = await queue.post(`/bulk?_token=${token}`, [{
      url: 'postman-echo.com/post',
    }])
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toHaveProperty('id')
    const id = res.data[0].id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: { method: 'POST' },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('bulk request with GET method', async () => {
    const res = await queue.post(`/bulk?_token=${token}`, [{
      url: 'https://postman-echo.com/get',
      method: 'GET',
    }])
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toHaveProperty('id')
    const id = res.data[0].id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: { method: 'GET' },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('bulk request with query param on URL', async () => {
    const res = await queue.post(`/bulk?_token=${token}`, [{
      url: 'https://postman-echo.com/post?x=1',
    }])
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toHaveProperty('id')
    const id = res.data[0].id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: {
        method: 'POST',
        params: { x: '1' },
        url: 'https://postman-echo.com/post?x=1',
      },
    })
    expect(omit(req.data.request, ['start'])).toMatchSnapshot()

    const resp = await queue.get(`/requests/${id}/response.body?_token=${token}`)
    expect(resp.data).toMatchObject({
      args: { x: '1' },
      url: 'https://postman-echo.com/post?x=1',
    })
  })

  test('bulk request with query param in body', async () => {
    const res = await queue.post(`/bulk?_token=${token}`, [{
      url: 'https://postman-echo.com/post',
      params: { x: '1' },
    }])
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toHaveProperty('id')
    const id = res.data[0].id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: {
        method: 'POST',
        params: { x: '1' },
        url: 'https://postman-echo.com/post?x=1',
      },
    })
    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()

    const resp = await queue.get(`/requests/${id}/response.body?_token=${token}`)
    expect(resp.data).toMatchObject({
      args: { x: '1' },
      url: 'https://postman-echo.com/post?x=1',
    })
  })

  test('bulk request with header param', async () => {
    const res = await queue.post(`/bulk?_token=${token}`, [{
      url: 'https://postman-echo.com/post',
      headers: { 'x-custom-header': '123' },
    }])
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toHaveProperty('id')
    const id = res.data[0].id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: {
        method: 'POST',
        headers: { 'x-custom-header': '123' },
        url: 'https://postman-echo.com/post',
      },
    })
    expect(omit(req.data.request, ['start'])).toMatchSnapshot()

    const resp = await queue.get(`/requests/${id}/response.body?_token=${token}`)
    expect(resp.data).toMatchObject({
      headers: { 'x-custom-header': '123' },
      url: 'https://postman-echo.com/post',
    })
  })

  test('bulk request with json body', async () => {
    const res = await queue.post(`/bulk?_token=${token}`, [{
      url: 'https://postman-echo.com/post',
      body: { abc: 1 },
    }])
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toHaveProperty('id')
    const id = res.data[0].id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        url: 'https://postman-echo.com/post',
      },
    })
    expect(omit(req.data.request, ['start'])).toMatchSnapshot()

    const resp = await queue.get(`/requests/${id}/response.body?_token=${token}`)
    expect(resp.data).toMatchObject({
      headers: { 'content-type': 'application/json' },
      url: 'https://postman-echo.com/post',
      data: { abc: 1 },
      json: { abc: 1 },
    })
  })

  test('bulk request with text body', async () => {
    const res = await queue.post(`/bulk?_token=${token}`, [{
      url: 'https://postman-echo.com/post',
      body: 'helloworld',
    }])
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toHaveProperty('id')
    const id = res.data[0].id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        url: 'https://postman-echo.com/post',
      },
    })
    expect(omit(req.data.request, ['start'])).toMatchSnapshot()

    const resp = await queue.get(`/requests/${id}/response.body?_token=${token}`)
    expect(resp.data).toMatchObject({
      headers: { 'content-type': 'text/plain' },
      url: 'https://postman-echo.com/post',
      data: 'helloworld',
    })
  })

  test('bulk request with header, params and body', async () => {
    const res = await queue.post(`/bulk?_token=${token}`, [{
      url: 'https://postman-echo.com/post?y=2',
      params: { x: 1 },
      body: { abc: 1 },
      headers: { 'x-custom-header': '123' },
    }])
    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toHaveProperty('id')
    const id = res.data[0].id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: {
        method: 'POST',
        headers: { 'x-custom-header': '123', 'content-type': 'application/json' },
        params: { x: 1, y: '2' },
        hasbody: true,
      },
    })
    expect(qs.parseUrl(req.data.request.url)).toMatchObject({
      url: 'https://postman-echo.com/post',
      query: { x: '1', y: '2' },
    })
    delete req.data.request.url
    expect(omit(req.data.request, ['start'])).toMatchSnapshot()

    const reqBody = await queue.get(`/requests/${id}/request.body?_token=${token}`)
    expect(reqBody.data).toMatchObject({ abc: 1 })

    const respBody = await queue.get(`/requests/${id}/response.body?_token=${token}`)
    expect(respBody.data).toMatchObject({
      headers: { 'x-custom-header': '123' },
      json: { abc: 1 },
      args: { x: '1', y: '2' },
    })
    expect(qs.parseUrl(respBody.data.url)).toMatchObject({
      url: 'https://postman-echo.com/post',
      query: { x: '1', y: '2' },
    })
  })

  test('bulk request with 2 urls', async () => {
    const res = await queue.post(`/bulk?_token=${token}`, [{
      url: 'https://postman-echo.com/post',
    }, {
      url: 'https://postman-echo.com/post',
    }])
    expect(res.data).toHaveLength(2)
    expect(res.data[0]).toHaveProperty('id')
    const id1 = res.data[0].id
    const id2 = res.data[1].id

    const req1 = await waitFor(
      () => queue.get(`/requests/${id1}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    const req2 = await waitFor(
      () => queue.get(`/requests/${id2}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req1.data).toMatchObject({
      source: 'REQUEST',
      request: { method: 'POST' },
    })
    expect(omit(req1.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()

    expect(req2.data).toMatchObject({
      source: 'REQUEST',
      request: { method: 'POST' },
    })
    expect(omit(req2.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })
})
