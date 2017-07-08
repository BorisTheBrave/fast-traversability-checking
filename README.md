Fast Traversability Checking
============================

This code checks to see whether a tile grid of solid/empty squares would still be traversable after changing
extra squares to solid. It is optimized for making several queries of this sort onto the same setup.

For example, you can use it in a tile editor to highlight all locations it is ok to place an entity at, as the 
included demo demonstrates.

A demo and explanation of how it works can be found at:

http://www.boristhebrave.com/2017/07/08/fast-traversal-queries-of-procedurally-generated-rooms

Usage
-----

Construct a `WouldBlockTraversalCalculator` with a 2d boolean array where `true` means a tile is walkable (i.e. empty)
and `false` means it is not walkable (i.e. filled).

Then, for each possible placement, call `wouldBlockTraversal` with the list of exits, i.e. points that must remain
traversable from each other, and a 2d boolean array solid where `true` means that the tile will be marked not walkable.

The function returns true if it is not possible to get between all the exits after placing the solid in the indicated location.

For best performance, `solid` should be much smaller than `walkable`.

Copyright
---------
Code is covered by the MIT license.

The images are provided by fictionaldogs on the ZFGC forums.
http://zfgc.com/forum/index.php?topic=41500.0
"If anybody wants to use anything, feel free to do so (with credit given if it is made outside of zfgc.com of course)."