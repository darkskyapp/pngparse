pngparse
========

This is a little pure-JavaScript module for Node.JS that I made because I
wanted to be able to read PNG images in Node, and I can't get various other
modules to compile on all the different operating systems that I use.

It's reasonably immature, but surprisingly complete, covering mode PNG color
type, depth, and filter combinations; a notable omission is that 16-bit depth
and interlacing are not currently supported. I will gladly accept push requests
that contribute meaningfully. Please make sure anything you write is tested,
though.
