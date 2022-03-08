/**
 * @jest-environment node
 */

import { omit } from 'lodash'
import { createWorkspace } from '#/util/data'
import waitFor from '#/util/waitFor'
import queue from '#/util/queue'

jest.setTimeout(60000)

describe('step.spec', () => {
  const workspace = 'test-workspace-steps'
  const token = workspace

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('single step request', async () => {
    const res = await queue.post(`/step?_token=${token}`, [{
      url: 'https://postman-echo.com/post',
    }])

    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: { method: 'POST' },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()

    const children2 = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children2.data.length).toBe(1)
    expect(children2.data[0]).toMatchObject({
      status: 'SUCCESS',
      source: 'STEP',
      trace: id,
    })
  })

  test('two step request with dependency', async () => {
    const res = await queue.post(`/step?_token=${token}`, [{
      url: 'https://postman-echo.com/post?_step=A',
    }, {
      url: 'https://postman-echo.com/post?_requires=A',
    }])

    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: { method: 'POST' },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()

    const children2 = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children2.data.length).toBe(2)
    expect(children2.data[0]).toMatchObject({
      status: 'SUCCESS',
      source: 'STEP',
      trace: id,
    })
    expect(children2.data[1]).toMatchObject({
      status: 'SUCCESS',
      source: 'STEP',
      trace: id,
    })
  })

  test('multi step request with double dependency', async () => {
    const res = await queue.post(`/step?_token=${token}`, [{
      url: 'https://postman-echo.com/post?_step=A',
    }, {
      url: 'https://postman-echo.com/post?_requires=A',
    }, {
      url: 'https://postman-echo.com/post?_requires=A&_step=B',
    }, {
      url: 'https://postman-echo.com/post?_requires=A&_step=C',
    }, {
      url: 'https://postman-echo.com/post?_requires=C&_step=D',
    }, {
      url: 'https://postman-echo.com/post?_requires=D,B',
    }])

    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const req = await waitFor(
      () => queue.get(`/requests/${id}?_token=${token}`),
      ({ data }) => data.status === 'SUCCESS',
    )

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      request: { method: 'POST' },
    })

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()

    const children2 = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children2.data.length).toBe(6)
    expect(children2.data[0]).toMatchObject({
      status: 'SUCCESS',
      source: 'STEP',
      trace: id,
    })
    expect(children2.data[1]).toMatchObject({
      status: 'SUCCESS',
      source: 'STEP',
      trace: id,
    })
  })

  test('error all steps have requires', async () => {
    const res = await queue.post(`/step?_token=${token}`, [{
      url: 'https://postman-echo.com/post?_requires=B',
    }]).catch((err) => err.response)
    expect(res.status).toBe(400)
    expect(res.data).toMatchObject({
      error: { message: 'At least one step must have no requires parameter, as that is the starting step' },
    })
  })

  test('error missing required step name', async () => {
    const res = await queue.post(`/step?_token=${token}`, [{
      url: 'https://postman-echo.com/post?_step=A',
    }, {
      url: 'https://postman-echo.com/post?_requires=B',
    }]).catch((err) => err.response)
    expect(res.status).toBe(400)
    expect(res.data).toMatchObject({
      error: { message: 'Step is required by another step, but not provided' },
    })
  })

  test('error cylical dependencies - step calls itself', async () => {
    const res = await queue.post(`/step?_token=${token}`, [{
      url: 'https://postman-echo.com/post',
    }, {
      url: 'https://postman-echo.com/post?_step=A&_requires=A',
    }]).catch((err) => err.response)
    expect(res.status).toBe(400)
    expect(res.data).toMatchObject({
      error: { message: 'Cyclical dependencies in steps (e.g. a -> b -> a)' },
    })
  })

  test('error cylical dependencies - multi step cycle', async () => {
    const res = await queue.post(`/step?_token=${token}`, [{
      url: 'https://postman-echo.com/post?_step=0',
    }, {
      url: 'https://postman-echo.com/post?_step=A&_requires=B,0',
    }, {
      url: 'https://postman-echo.com/post?_step=B&_requires=C',
    }, {
      url: 'https://postman-echo.com/post?_step=C&_requires=A',
    }]).catch((err) => err.response)
    expect(res.status).toBe(400)
    expect(res.data).toMatchObject({
      error: { message: 'Cyclical dependencies in steps (e.g. a -> b -> a)' },
    })
  })
})
