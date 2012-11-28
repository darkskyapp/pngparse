var fs   = require("fs"),
    zlib = require("zlib")

function ImageData(width, height, data, trailer) {
  this.width   = width
  this.height  = height
  this.data    = data
  this.trailer = trailer
}

ImageData.prototype.getPixel = function(x, y) {
  x = Math.round(x)
  y = Math.round(y)

  if(x < 0 || y < 0 || x >= this.width || y >= this.height)
    return 0

  return this.data.readUInt32BE((y * this.width + x) * 4)
}

function paeth(a, b, c) {
  var p  = a + b - c,
      pa = Math.abs(p - a),
      pb = Math.abs(p - b),
      pc = Math.abs(p - c)

  if((pa <= pb) && (pa <= pc))
    return a

  if(pb <= pc)
    return b

  return c
}

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

  var width  = buf.readUInt32BE(16),
      height = buf.readUInt32BE(20),
      depth  = buf.readUInt8(24),
      mode   = buf.readUInt8(25),
      samples, bpp, i, chunk, off, len

  switch(mode) {
    case 0:
      samples = 1
      bpp     = Math.ceil(depth * 0.125)
      break

    case 2:
      samples = 3
      bpp     = Math.ceil(depth * 0.375)
      break

    case 3:
      samples = 1
      bpp     = 1
      break

    case 4:
      samples = 2
      bpp     = Math.ceil(depth * 0.250)
      break

    case 6:
      samples = 4
      bpp     = Math.ceil(depth * 0.5)
      break

    default:
      return callback(new Error("Unsupported color type: " + mode))
  }

  if(debug)
    console.warn(
      "PNG is %dx%d, %d-bit, color type %d.",
      width,
      height,
      depth,
      mode
    )

  var toff = buf.length,
      poff = 0,
      plen = 0,
      aoff = 0,
      alen = 0

  i = 0

  /* Run through the PNG data blocks. We need to figure out how much data there
   * is (so we can allocate a buffer for it), and we need to locate any
   * palettes and the end of the PNG buffer (in case there's any trailing data
   * that we need). */
  outer: for(off = 33; off < buf.length; off += len + 12) {
    len   = buf.readUInt32BE(off)
    chunk = buf.readUInt32BE(off + 4)

    switch(chunk) {
      /* IDAT */
      case 0x49444154:
        i += len
        break

      /* PLTE */
      case 0x504C5445:
        poff = off + 8
        plen = Math.floor(len / 3)
        break

      /* tRNS */
      case 0x74524E53:
        aoff = off + 8
        alen = len
        break

      /* IEND */
      case 0x49454E44:
        toff = off + len + 12
        break outer
    }
  }

  /* If we're reading a paletted image, make sure we found a palette. */
  if(mode === 3) {
    if(poff === 0 || plen === 0)
      return callback(new Error("Unable to find PNG palette."))

    if(debug) {
      console.warn("PNG color palette has %d entries.", plen)

      if(alen)
        console.warn("PNG tranparency palette has %d entries.", alen)
    }
  }

  if(debug)
    console.warn("Compressed data length is %d bytes.", i)

  /* Read data into a buffer. */
  var data = new Buffer(i)

  i = 0
  for(off = 33; off < buf.length; off += len + 12) {
    len   = buf.readUInt32BE(off)
    chunk = buf.readUInt32BE(off + 4)

    /* IDAT */
    if(chunk === 0x49444154) {
      buf.copy(data, i, off + 8, off + 8 + len)
      i += len
    }

    /* IEND */
    else if(chunk === 0x49454E44)
      break
  }

  if(i !== data.length)
    return callback(new Error("Somehow missed copying " + (data.length - i) + " bytes."))

  return zlib.inflate(data, function(err, data) {
    if(err)
      return callback(err)

    if(debug)
      console.warn("Inflated data length is %d bytes.", data.length)

    var pixels = new Buffer(width * height * 4),
        skip   = Math.ceil(width * depth * samples / 8) + 1,
        samp   = new Array(samples),
        mul    = 255 / ((1 << depth) - 1),
        i = 0,
        x, y, j, filter, off, k

    for(y = 0; y !== height; ++y) {
      filter = data[y * skip]
      off    = 0

      /* Apply filter to scanline. */
      switch(filter) {
        case 0:
          break

        case 1:
          for(j = bpp + 1; j !== skip; ++j) {
            k = y * skip + j
            data[k] = (data[k] + data[k - bpp]) & 255
          }
          break

        case 2:
          if(y !== 0)
            for(j = 1; j !== skip; ++j) {
              k = y * skip + j
              data[k] = (data[k] + data[k - skip]) & 255
            }
          break

        case 3:
          for(j = 1; j !== skip; ++j) {
            k = y * skip + j
            data[k] = (data[k] + ((
              (j > bpp && data[k - bpp]) +
              (y && data[k - skip])
            ) >> 1)) & 255
          }
          break

        case 4:
          for(j = 1; j !== skip; ++j) {
            k = y * skip + j

            data[k] = (data[k] + paeth(
              j > bpp && data[k - bpp],
              y && data[k - skip],
              j > bpp && y && data[k - skip - bpp]
            )) & 255
          }
          break

        default:
          return callback(new Error("Unsupported scanline filter: " + filter))
      }

      /* Read scanline into output image. */
      for(x = 0; x !== width; ++x) {
        /* Read samples. */
        for(j = 0; j !== samples; ++off, ++j)
          switch(depth) {
            case 1:
              samp[j] = (data[y * skip + 1 + (off >> 3)] >> (7 - (off & 7))) & 1
              break

            case 2:
              samp[j] = (data[y * skip + 1 + (off >> 2)] >> ((3 - (off & 3)) << 1)) & 3
              break

            case 4:
              samp[j] = (data[y * skip + 1 + (off >> 1)] >> ((1 - (off & 1)) << 2)) & 15
              break

            case 8:
              samp[j] = data[y * skip + 1 + off]
              break

            default:
              return callback(new Error("Unsupported bit depth: " + depth))
          }

        /* Apply samples to the image data. */
        switch(mode) {
          case 0:
            pixels[i++] =
            pixels[i++] =
            pixels[i++] = samp[0] * mul
            pixels[i++] = 255
            break

          case 2:
            pixels[i++] = samp[0] * mul
            pixels[i++] = samp[1] * mul
            pixels[i++] = samp[2] * mul
            pixels[i++] = 255
            break

          case 3:
            if(samp[0] >= plen)
              return callback(new Error("Invalid palette index recorded."))

            pixels[i++] = buf[poff + samp[0] * 3 + 0]
            pixels[i++] = buf[poff + samp[0] * 3 + 1]
            pixels[i++] = buf[poff + samp[0] * 3 + 2]
            pixels[i++] = samp[0] < alen ? buf[aoff + samp[0]] : 255
            break

          case 4:
            pixels[i++] =
            pixels[i++] =
            pixels[i++] = samp[0] * mul
            pixels[i++] = samp[1] * mul
            break

          case 6:
            pixels[i++] = samp[0] * mul
            pixels[i++] = samp[1] * mul
            pixels[i++] = samp[2] * mul
            pixels[i++] = samp[3] * mul
            break
        }
      }
    }

    if(i !== pixels.length)
      return callback(new Error("Copy error: extraneous or insufficient data."))

    return callback(null, new ImageData(width, height, pixels, buf.slice(toff)))
  })
}

exports.parseFile = function(pathname, callback) {
  return fs.readFile(pathname, function(err, data) {
    if(err)
      return callback(err)

    return exports.parse(data, callback)
  })
}
