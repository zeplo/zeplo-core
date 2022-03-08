/**
 * @jest-environment node
 */
import { createWorkspace } from '#/util/data'

jest.setTimeout(60000)

describe('pause.spec', () => {
  const workspace = `test-workspace-pause-${Date.now()}`
  const token = `test-token-pause-${Date.now()}`

  let cleanup: () => Promise<void>
  beforeAll(async () => {
    cleanup = await createWorkspace(workspace, token)
  })
  afterAll(() => cleanup())

  test.todo('pause schedule')
  test.todo('play schedule')
  test.todo('pause globally')
})
