/**
 * @jest-environment node
 */
import moment from 'moment'
import { omit } from 'lodash'
import { createWorkspace } from '#/util/data'
import queue from '#/util/queue'
import wait from '#/util/wait'

jest.setTimeout(70000)

describe('cron.spec', () => {
  const workspace = `test-workspace-cron-${Date.now()}`
  const token = `test-token-cron-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test('cron * * * * *', async () => {
    const res = await queue.get(`/https://postman-echo.com/get?_cron=* * * * *&_token=${token}`)
    expect(res.data).toHaveProperty('id')
    const id = res.data.id

    const now = moment()
    const beforeStart = moment().startOf('minute').add(1, 'minute')
    const req = await queue.get(`/requests/${res.data.id}?_token=${token}`)

    await wait(1000)

    expect(req.data).toMatchObject({
      source: 'REQUEST',
      cron: [['*', '*', '*', '*', '*']],
      request: { method: 'GET' },
    })

    const children = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children.data.length).toBe(1)
    expect(children.data[0]).toMatchObject({
      status: 'PENDING',
      source: 'SCHEDULE',
      trace: id,
    })
    const childStart = children.data[0].start
    const afterStart = moment().startOf('minute').add(1, 'minute')
    expect(childStart === beforeStart.unix() || childStart === afterStart.unix()).toBe(true)

    expect(omit(req.data.request, ['start', 'headers.content-length'])).toMatchSnapshot()
    const waittime = Math.max(beforeStart.valueOf() - now.valueOf(), 0) + 1000
    await wait(waittime)

    const children2 = await queue.get(`/requests?_token=${token}&filters={"trace": "${id}" }`)
    expect(children2.data.length).toBe(2)
    expect(children2.data[0]).toMatchObject({
      status: 'PENDING',
      source: 'SCHEDULE',
      trace: id,
    })
    expect(children2.data[1]).toMatchObject({
      source: 'SCHEDULE',
      trace: id,
    })
    expect(children2.data[1].status).not.toBe('PENDING')
  })
})
