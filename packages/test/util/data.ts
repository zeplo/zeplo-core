import axios from 'axios'
import queue from './queue'

const {
  API_URL = 'http://localhost:5002',
  API_ADMIN_TOKEN,
} = process.env

export async function createWorkspace (workspace: string, token: string) {
  if (process.env.CLI_MODE === '1') {
    await queue.post('/requests/reset?hard=1')
    return async () => {
    }
  }

  await axios.post(`${API_URL}/admin/test/create_workspace?token=${API_ADMIN_TOKEN}`, {
    workspace,
    token,
  })

  return async () => {
    await axios.post(`${API_URL}/admin/test/reset_workspace?token=${API_ADMIN_TOKEN}`, {
      workspace,
      token,
    })
  }
}
