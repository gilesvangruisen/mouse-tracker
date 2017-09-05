import chunk from 'chunk'

export default function largestTriangleThreeBuckets (data, threshold = 1) {
  const bucketCount = threshold - 2
  const chunkSize = (data.length - 2) / (threshold - 2)
  const dataPoints = data.map((y, x) => ({ x, y }))

  const buckets = chunk(dataPoints, chunkSize)

  // console.log(approximateBuckets(dataPoints, 50))
  // console.log(data)
  // console.log(buckets)

  return buckets.reduce((accum, bucket, x, buckets) => {
    if (x === 0) {
      return [...accum, bucket[0]]
    } else if (x === buckets.length - 1) {
      return [...accum, bucket[bucket.length - 1]]
    } else {
      const a = accum[accum.length - 1]
      const c = {
        x: average(buckets[x + 1].map(b => b.x)),
        y: average(buckets[x + 1].map(b => b.y))
      }

      const ratedPoints = bucket.map(b => ({
        x: b.x,
        y: b.y,
        significance: triangleArea(a, b, c)
      }))

      const sortedPoints = ratedPoints.sort((a, b) =>
        (a.significance - b.significance)
      )
      const selection = sortedPoints[sortedPoints.length - 1]

      return [...accum, selection]
    }
  }, [])
  .map(v => v.y)
}

function average (nums) {
  return nums.reduce((a, b) => (a + b), 0) / nums.length
}

function triangleArea (a, b, c) {
  const abc = a.x * (b.y - c.y)
  const bca = b.x * (c.y - a.y)
  const cab = c.x * (a.y - b.y)

  return Math.abs((abc + bca + cab) / 2)
}
