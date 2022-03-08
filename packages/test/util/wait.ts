export default function wait (timer: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timer)
  })
}
