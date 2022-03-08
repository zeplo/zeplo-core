import wait from './wait'

export default async function waitFor (
  fn: () => Promise<any>,
  waitForFn: (res: any) => Promise<boolean>|boolean,
  timer = 300,
): Promise<any> {
  const res = await fn()
  const ready = await waitForFn(res)
  // console.log(res.data)
  if (ready) return res
  await wait(timer)
  return waitFor(fn, waitForFn, timer)
}
