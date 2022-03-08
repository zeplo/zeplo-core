/**
 * @jest-environment node
 */

import { omit } from 'lodash'
import qs from 'query-string'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { createWorkspace } from '#/util/data'
import waitFor from '#/util/waitFor'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('queue.spec', () => {
  const workspace = 'test-workspace-queue'
  const token = workspace

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('get server info', async () => {
    const res = await queue.get('/')
    expect(res.status).toBe(200)
    // expect(res.data.name).toBe('@zeplo/router')
    // expect(res.data.home).toBe('https://zeplo.io')
  })

  test('queue GET request', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_token=${token}`)
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
    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()

    const respBody = await queue.get(`/requests/${id}/response.body?_token=${token}`)
    expect(respBody.data).toMatchObject({
      url: 'https://postman-echo.com/get',
    })
  })

  test('queue GET request without scheme', async () => {
    const res = await queue.get(`/postman-echo.com/get?_token=${token}`)
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
    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('queue POST request', async () => {
    const res = await queue.post(`/https://postman-echo.com/post?_token=${token}`)
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
      request: { method: 'POST' },
      response: { status: 200 },
    })
    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('queue DELETE request', async () => {
    const res = await queue.delete(`/https://postman-echo.com/delete?_token=${token}`)
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
      request: { method: 'DELETE' },
      response: { status: 200 },
    })
    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('queue PUT request', async () => {
    const res = await queue.put(`/https://postman-echo.com/put?_token=${token}`)
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
      request: { method: 'PUT' },
      response: { status: 200 },
    })
    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('queue PATCH request', async () => {
    const res = await queue.patch(`/https://postman-echo.com/patch?_token=${token}`, {
      x: 1,
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
      request: { method: 'PATCH' },
      response: { status: 200 },
    })
    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  test('queue POST request with url-enconded', async () => {
    const res = await queue.post(`/https://postman-echo.com/post?_token=${token}`,
      qs.stringify({ abc: '1' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
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
      request: { method: 'POST' },
      response: { status: 200 },
    })
    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()

    const resp = await queue.get(`/requests/${id}/response.body?_token=${token}`)
    expect(resp.data).toMatchObject({
      form: { abc: '1' },
      url: 'https://postman-echo.com/post',
    })
  })

  test('queue POST request with multi-part form', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, './avatar.png'))
    const form = new FormData()
    form.append('abc', '1')
    form.append('icon', file)

    const res = await queue.post(`/https://postman-echo.com/post?_token=${token}`,
      form.getBuffer(),
      { headers: form.getHeaders() })
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
      request: { method: 'POST' },
      response: { status: 200 },
    })

    const resp = await queue.get(`/requests/${id}/response.body?_token=${token}`)
    expect(resp.data).toMatchObject({
      files: { undefined: `data:application/octet-stream;base64,${file.toString('base64')}` },
      form: { abc: '1' },
      url: 'https://postman-echo.com/post',
    })
  })

  test('queue POST request with header, params and JSON body', async () => {
    const res = await queue.post(`/https://postman-echo.com/post?x=1&_token=${token}`, { abc: 1 }, {
      params: { y: 2 },
      headers: { 'x-custom-header': '123' },
    })
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: {
        method: 'POST',
        headers: { 'x-custom-header': '123', 'content-type': 'application/json' },
        params: { x: '1', y: '2' },
        hasbody: true,
      },
    })
    expect(qs.parseUrl(req.data.request.url)).toMatchObject({
      url: 'https://postman-echo.com/post',
      query: { x: '1', y: '2' },
    })
    delete req.data.request.url
    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()

    const reqBody = await queue.get(`/requests/${id}/request.body?_token=${token}`)
    expect(reqBody.data).toMatchObject({ abc: 1 })

    const respBody = await queue.get(`/requests/${id}/response.body?_token=${token}`)
    expect(respBody.data).toMatchObject({
      headers: { 'x-custom-header': '123' },
      json: { abc: 1 },
      args: { y: '2', x: '1' },
    })
    expect(qs.parseUrl(respBody.data.url)).toMatchObject({
      url: 'https://postman-echo.com/post',
      query: { x: '1', y: '2' },
    })
  })

  test('queue GET request with error', async () => {
    const res = await queue.get(`/https://postman-echo.com/post?_token=${token}`)
    expect(res.data).toHaveProperty('id')

    const req = await waitFor(
      () => queue.get(`/requests/${res.data.id}?_token=${token}`),
      ({ data }) => data.status === 'ERROR',
    )
    expect(req.data).toMatchObject({
      attempts: 1,
      status: 'ERROR',
      source: 'REQUEST',
      request: { method: 'GET' },
      response: { status: 404 },
    })
    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
  })

  xtest('errors if no token provided', async () => {
    const error = await queue.get('/https://postman-echo.com').catch((err) => err)
    expect(error.response.status).toBe(401)
  })
})
