var assert = require("chai").assert,
    fs     = require("fs"),
    path   = require("path"),
    png    = require("./index")

describe("PNG", function() {
  describe("parse", function() {
    it("should correctly parse an 8-bit grayscale png", function(done) {
      fs.readFile(path.join(__dirname, "grayscale.png"), function(err, data) {
        if(err)
          return done(err)

        png.parse(data, function(err, id) {
          assert.isNull(err)
          assert.equal(id.width, 16)
          assert.equal(id.height, 16)
          assert.equal(id.data.length, 16 * 16 * 4)

          var y = 16,
              x

          while(y--) {
            x = 16
            while(x--)
              assert.equal(id.getPixel(x, y), (x ^ y) * 286331136 + 255)
          }

          done()
        })
      })
    })

    it("should correctly parse an 8-bit truecolor png", function(done) {
      fs.readFile(path.join(__dirname, "truecolor.png"), function(err, data) {
        if(err)
          return done(err)

        png.parse(data, function(err, id) {
          assert.isNull(err)
          assert.equal(id.width, 16)
          assert.equal(id.height, 16)
          assert.equal(id.data.length, 16 * 16 * 4)

          var y = 16,
              x

          while(y--) {
            x = 16
            while(x--)
              assert.equal(
                id.getPixel(x, y),
                x * 285212672 + y * 1114112 + (x ^ y) * 4352 + 255
              )
          }

          done()
        })
      })
    })

    it("should correctly parse an 8-bit truecolor png with alpha", function(done) {
      fs.readFile(path.join(__dirname, "truecoloralpha.png"), function(err, data) {
        if(err)
          return done(err)

        png.parse(data, function(err, id) {
          assert.isNull(err)
          assert.equal(id.width, 16)
          assert.equal(id.height, 16)
          assert.equal(id.data.length, 16 * 16 * 4)

          var y = 16,
              x

          while(y--) {
            x = 16
            while(x--)
              assert.equal(
                id.getPixel(x, y),
                x * 285212672 + y * 1114112 + (x ^ y) * 17
              )
          }

          done()
        })
      })
    })

    it("should correctly read image with scanline filter", function(done) {
      fs.readFile(path.join(__dirname, "accum.png"), function(err, data) {
        if(err)
          return done(err)

        png.parse(data, function(err, id) {
          assert.isNull(err)
          assert.equal(id.width, 1024)
          assert.equal(id.height, 1024)
          assert.equal(id.data.length, 1024 * 1024 * 4)

          assert.equal(id.getPixel(  0,   0), 0xFF0000FF)
          assert.equal(id.getPixel(  1,   0), 0xFF0000FF)
          assert.equal(id.getPixel(420, 308), 0xFF0029FF)
          assert.equal(id.getPixel(433, 308), 0x0A299DFF)
          assert.equal(id.getPixel(513, 308), 0x0066FFFF)
          assert.equal(id.getPixel(728, 552), 0xFF0047FF)

          done()
        })
      })
    })

    it("should correctly read an indexed color image", function(done) {
      fs.readFile(path.join(__dirname, "indexed.png"), function(err, data) {
        if(err)
          return done(err)

        png.parse(data, function(err, id) {
          assert.isNull(err)
          assert.equal(id.width, 16)
          assert.equal(id.height, 16)
          assert.equal(id.data.length, 16 * 16 * 4)

          var y = 16,
              x

          while(y--) {
            x = 16
            while(x--)
              if(x + y < 8)
                assert.equal(id.getPixel(x, y), 0xFF0000FF)

              else if(x + y < 16)
                assert.equal(id.getPixel(x, y), 0x00FF00FF)

              else if(x + y < 24)
                assert.equal(id.getPixel(x, y), 0x0000FFFF)

              else
                assert.equal(id.getPixel(x, y), 0x000000FF)
          }

          done()
        })
      })
    })
  })
})
