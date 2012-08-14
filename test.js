var assert = require("chai").assert,
    fs     = require("fs"),
    path   = require("path"),
    png    = require("./index")

describe("PNG", function() {
  describe("parse", function() {
    it("should correctly parse a buffered png", function(done) {
      fs.readFile(path.join(__dirname, "test.png"), function(err, data) {
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
  })
})
