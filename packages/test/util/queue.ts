import axios from 'axios'

const {
  QUEUE_URL = 'http://localhost:5008',
} = process.env

export default axios.create({
  baseURL: QUEUE_URL,
  timeout: 5000,
})

export function createQueue (token: string) {
  return axios.create({
    baseURL: QUEUE_URL,
    timeout: 5000,
    params: {
      _token: token,
    },
  })
}
