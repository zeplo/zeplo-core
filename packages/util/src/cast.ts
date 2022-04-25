import _ from 'lodash'

export function toNumber (likeNumber: any) {
  const num = _.toNumber(likeNumber)
  if (Number.isNaN(num)) return undefined
  return num
}