<h1>jQuery.NC SVG Map</h1>
<p>
    SVG display map for North Carolina and the ability to display alternate content for unsupported browsers.
</p>

<h2>How it works</h2>
<p>
    Makes use of the jQuery.SimpleSVG plugin as its core engine, and the jQuery.NC SVG Map acts as a wrapper specific to pulling in the map/SVG/XML resource.
</p>
<p>
    Multiple callbacks and delegated events are provided for interaction. I've gone ahead and provided basic inline annotations within demo.html.
</p>



<h2>Browser compatibility</h2>
<p>
    Works in Firefox, Chrome, Opera, and Safari. IE-9 is fine as well. Older IE has the fallback/unsupported callback fire instead. Another side-note, older computers. While older machines may have access to a modern browser some may experience a bit of lag because of the SVG manipulation. I haven't determined if this is a memory leak on the part of the jQuery.SimpleSVG plugin, something else I'm doing wrong, or simply older machines.
</p>

<h2>License</h2>
<p>
    The jQuery.NC SVG Map and jQuery.SimpleSVG plugins are released under the <a href="http://opensource.org/licenses/mit-license.php">MIT License</a>. If you think I've missed any kudos please feel free to help me update the copyright.
</p>
<p>
    I'd like to give credit to <a href="https://github.com/jpstreich">JPStreich</a> as he kept this project going behind the scenes and contributed heavily to the overall design of the mapping mechanics and SVG display file.
</p>
<p>
    Aspects of the jQuery.Simple SVG methods were influenced by Keith Wood's work on his <a href="http://keith-wood.name/svg.html">SVG for jQuery v1.4.5 plugin</a> for what class methods to return/allow. His plugin was dual licensed under the GPL and <a href="http://opensource.org/licenses/mit-license.php">MIT License</a>.
</p>
<p>
    I did include <a href="http://necolas.github.com/normalize.css">Normalize.css</a> and the box model tweak from
    <a href="http://www.paulirish.com/2012/box-sizing-border-box-ftw/">Paul Irish</a> for general formatting purposes.
</p>

