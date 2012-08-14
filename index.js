var zlib = require("zlib")

function ImageData(width, height, data) {
  this.width  = width
  this.height = height
  this.data   = data
}

/* FIXME: Some pixel retrieval methods might be handy! */

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

  var depth = buf.readUInt8(24)
  if(depth !== 8)
    return callback(new Error("Unsupported bit depth: " + depth + "."))

  if(buf.readUInt8(26) !== 0)
    return callback(new Error("Unsupported compression method."))

  if(buf.readUInt8(27) !== 0)
    return callback(new Error("Unsupported filter method."))

  if(buf.readUInt8(28) !== 0)
    return callback(new Error("Unsupported interlace method."))

  var width  = buf.readUInt32BE(16),
      height = buf.readUInt32BE(20),
      mode   = buf.readUInt8(25),
      i

  if(debug)
    console.warn(
      "PNG is %dx%d, %d-bit, color type %d.",
      width,
      height,
      depth,
      mode
    )

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

    var pixels = new Buffer(width * height * 4),
        i = 0,
        j = 0,
        x, y, filter, r, g, b, a

    for(y = 0; y !== height; ++y) {
      filter = data[j++]

      r = 0
      g = 0
      b = 0
      a = 0

      for(x = 0; x !== width; ++x) {
        switch(mode) {
          case 0:
            switch(filter) {
              case 0:
                r = data[j++]
                break

              case 1:
                r = (data[j++] + r) % 256
                break

              default:
                return callback(new Error("Unsupported scanline filter: " + filter + "."))
            }
            g = r
            b = r
            a = 255
            break

          case 2:
            switch(filter) {
              case 0:
                r = data[j++]
                g = data[j++]
                b = data[j++]
                break

              case 1:
                r = (data[j++] + r) % 256
                g = (data[j++] + g) % 256
                b = (data[j++] + b) % 256
                break

              default:
                return callback(new Error("Unsupported scanline filter: " + filter + "."))
            }
            a = 255
            break

          case 6:
            switch(filter) {
              case 0:
                r = data[j++]
                g = data[j++]
                b = data[j++]
                a = data[j++]
                break

              case 1:
                r = (data[j++] + r) % 256
                g = (data[j++] + g) % 256
                b = (data[j++] + b) % 256
                a = (data[j++] + a) % 256
                break

              default:
                return callback(new Error("Unsupported scanline filter: " + filter + "."))
            }
            break

          default:
            return callback(new Error("Unsupported color type: " + mode + "."))
        }

        pixels[i++] = r
        pixels[i++] = g
        pixels[i++] = b
        pixels[i++] = a
      }
    }

    if(i !== pixels.length || j !== data.length)
      return callback(new Error("Copy error: extraneous or insufficient data."))

    return callback(null, new ImageData(width, height, pixels))
  })
}
