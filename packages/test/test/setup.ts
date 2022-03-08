import dotenv from 'dotenv'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

jest.retryTimes(3)
jest.setTimeout(60000)
