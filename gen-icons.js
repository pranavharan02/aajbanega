const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function makePNG(size) {
  const w = size, h = size
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0
    for (let x = 0; x < w; x++) {
      const o = y * (w * 3 + 1) + 1 + x * 3
      raw[o] = 0x2D; raw[o+1] = 0x2A; raw[o+2] = 0x26
    }
  }
  const compressed = zlib.deflateSync(raw)

  function chunk(type, data) {
    const buf = Buffer.alloc(4 + 4 + data.length + 4)
    buf.writeUInt32BE(data.length, 0)
    buf.write(type, 4)
    data.copy(buf, 8)
    const crc = zlib.crc32(buf.subarray(4, 8 + data.length))
    buf.writeUInt32BE(crc >>> 0, 8 + data.length)
    return buf
  }

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(w, 0)
  ihdrData.writeUInt32BE(h, 4)
  ihdrData[8] = 8; ihdrData[9] = 2

  const sig = Buffer.from([137,80,78,71,13,10,26,10])
  return Buffer.concat([sig, chunk('IHDR', ihdrData), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

for (const s of [192, 512]) {
  const png = makePNG(s)
  fs.writeFileSync(path.join(__dirname, 'public', 'icons', `icon-${s}.png`), png)
  console.log(`icon-${s}.png (${png.length} bytes)`)
}
