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

    it("should correctly read an indexed color image with alpha", function(done) {
      fs.readFile(path.join(__dirname, "indexedalpha.png"), function(err, data) {
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
              if(x >= 4 && x < 12)
                assert.equal(id.getPixel(x, y), 0x00000000)

              else if(x + y < 8)
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

    it("should correctly support crazily-filtered images", function(done) {
      fs.readFile(path.join(__dirname, "paeth.png"), function(err, data) {
        if(err)
          return done(err)

        png.parse(data, function(err, id) {
          assert.isNull(err)
          assert.equal(id.width, 512)
          assert.equal(id.height, 512)
          assert.equal(id.data.length, 512 * 512 * 4)

          assert.equal(id.getPixel(  0,   0), 0xFF000000)
          assert.equal(id.getPixel(  1,   0), 0xFF000000)
          assert.equal(id.getPixel(  0,   1), 0xFF000000)
          assert.equal(id.getPixel(  2,   2), 0xFF000000)
          assert.equal(id.getPixel(  0,  50), 0xFF000000)
          assert.equal(id.getPixel(263, 319), 0xFF002100)
          assert.equal(id.getPixel(145, 318), 0x05535A00)
          assert.equal(id.getPixel(395, 286), 0x0007FF00)
          assert.equal(id.getPixel(152, 167), 0x052C3500)
          assert.equal(id.getPixel(153, 167), 0x04303600)
          //assert.equal(id.getPixel(154, 167), 0x042F3700)
          //assert.equal(id.getPixel(100, 168), 0xFF000400)
          //assert.equal(id.getPixel(120, 168), 0xFF000900)
          //assert.equal(id.getPixel(140, 168), 0xFF001B00)
          //assert.equal(id.getPixel(150, 168), 0x05313600)
          assert.equal(id.getPixel(152, 168), 0x04343C00)
          assert.equal(id.getPixel(153, 168), 0x04343F00)
          //assert.equal(id.getPixel(154, 168), 0x04344100)
          //assert.equal(id.getPixel(155, 168), 0x00344300)
          //assert.equal(id.getPixel(156, 168), 0x00314400)
          //assert.equal(id.getPixel(157, 168), 0x00323F00)
          //assert.equal(id.getPixel(158, 168), 0x04313900)

          done()
        }, true)
      })
    })
  })
})
