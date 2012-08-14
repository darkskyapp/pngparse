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

          var i = 16 * 16 * 4,
              y = 16,
              x

          assert.equal(id.data.length, i)

          while(y--) {
            x = 16
            while(x--) {
              assert.equal(id.data[--i], 255)
              assert.equal(id.data[--i], (x ^ y) * 17)
              assert.equal(id.data[--i], (x ^ y) * 17)
              assert.equal(id.data[--i], (x ^ y) * 17)
            }
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

          var i = 16 * 16 * 4,
              y = 16,
              x

          assert.equal(id.data.length, i)

          while(y--) {
            x = 16
            while(x--) {
              assert.equal(id.data[--i], 255)
              assert.equal(id.data[--i], (x ^ y) * 17)
              assert.equal(id.data[--i], y * 17)
              assert.equal(id.data[--i], x * 17)
            }
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

          var i = 16 * 16 * 4,
              y = 16,
              x

          assert.equal(id.data.length, i)

          while(y--) {
            x = 16
            while(x--) {
              assert.equal(id.data[--i], (x ^ y) * 17)
              assert.equal(id.data[--i], 0)
              assert.equal(id.data[--i], y * 17)
              assert.equal(id.data[--i], x * 17)
            }
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

          assert.equal(id.data[0], 255, "0,0 should have 255 red")
          assert.equal(id.data[1],   0, "0,0 should have 0 green")
          assert.equal(id.data[2],   0, "0,0 should have 0 blue")
          assert.equal(id.data[3], 255, "0,0 should have 255 alpha")

          assert.equal(id.data[4], 255, "1,0 should have 255 red")
          assert.equal(id.data[5],   0, "1,0 should have 0 green")
          assert.equal(id.data[6],   0, "1,0 should have 0 blue")
          assert.equal(id.data[7], 255, "1,0 should have 255 alpha")

          assert.equal(id.data[1263248], 255, "420,308 should have 255 red")
          assert.equal(id.data[1263249],   0, "420,308 should have 0 green")
          assert.equal(id.data[1263250],  41, "420,308 should have 41 blue")
          assert.equal(id.data[1263251], 255, "420,308 should have 255 alpha")

          assert.equal(id.data[1263300],  10, "433,308 should have 10 red")
          assert.equal(id.data[1263301],  41, "433,308 should have 41 green")
          assert.equal(id.data[1263302], 157, "433,308 should have 157 blue")
          assert.equal(id.data[1263303], 255, "433,308 should have 255 alpha")

          assert.equal(id.data[1263620],   0, "513,308 should have 0 red")
          assert.equal(id.data[1263621], 102, "513,308 should have 102 green")
          assert.equal(id.data[1263622], 255, "513,308 should have 255 blue")
          assert.equal(id.data[1263623], 255, "513,308 should have 255 alpha")

          assert.equal(id.data[2263904], 255, "728,552 should have 255 red")
          assert.equal(id.data[2263905],   0, "728,552 should have 0 green")
          assert.equal(id.data[2263906],  71, "728,552 should have 71 blue")
          assert.equal(id.data[2263907], 255, "728,552 should have 255 alpha")

          done()
        })
      })
    })
  })
})
