var zlib = require("zlib")

exports.parse = function(buf, callback, debug) {
  /* Sanity check PNG header. */
  if(buf.readUInt32BE(0) !== 0x89504E47 ||
     buf.readUInt32BE(4) !== 0x0D0A1A0A)
    return callback(new Error("Invalid PNG header."))

  if(debug)
    console.warn("Verified PNG header.")

  /* Sanity check and read IHDR chunk. */
  if(buf.readUInt32BE(8)  !== 13 ||
     buf.readUInt32BE(12) !== 0x49484452)
    return callback(new Error("First PNG chunk is not IHDR."))

  if(buf.readUInt8(26) !== 0)
    return callback(new Error("Unsupported compression method."))

  if(buf.readUInt8(27) !== 0)
    return callback(new Error("Unsupported filter method."))

  if(buf.readUInt8(28) !== 0)
    return callback(new Error("Unsupported interlace method."))

  var depth  = buf.readUInt8(24),
      mode   = buf.readUInt8(25)

  if(depth !== 8 && mode !== 2)
    return callback(new Error("Unsupported mode and depth combination: " + mode + "," + depth + "."))

  var width  = buf.readUInt32BE(16),
      height = buf.readUInt32BE(20),
      i

  if(debug)
    console.warn("PNG is %dx%d, %d-bit, mode %d.", width, height, depth, mode)

  /* Determinte data length. */
  var off, len

  i = 0
  for(off = 33; off < buf.length; off += len + 12) {
    len = buf.readUInt32BE(off)

    if(buf.readUInt32BE(off + 4) === 0x49444154)
      i += len
  }

  if(debug)
    console.warn("Compressed data length is %d bytes.", i)

  /* Read data into a buffer. */
  var data = new Buffer(i)

  i = 0
  for(off = 33; off < buf.length; off += len + 12) {
    len = buf.readUInt32BE(off)

    if(buf.readUInt32BE(off + 4) === 0x49444154) {
      buf.copy(data, i, off + 8, off + 8 + len)
      i += len
    }
  }

  if(i !== data.length)
    return callback(new Error("Somehow missed copying " + (data.length - i) + " bytes."))

  return zlib.inflate(data, function(err, data) {
    if(err)
      return callback(err)

    if(debug)
      console.warn("Inflated data length is %d bytes.", data.length)

    var j      = data.length,
        i      = width * height * 4,
        pixels = new Buffer(i),
        y      = height,
        x

    while(y--) {
      x = width
      while(x--) {
        pixels[--i] = 255
        pixels[--i] = data[--j]
        pixels[--i] = data[--j]
        pixels[--i] = data[--j]
      }

      --j
    }

    if(i !== 0 || j !== 0)
      return callback(new Error("Copy error: extraneous or insufficient data."))

    return callback(null, width, height, pixels)
  })
}
