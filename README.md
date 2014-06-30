# Fabulous.js

Lots and lots and lots of people select text while reading it on the web.
You're probably doing it right now. But blue background color is just too
boring for the modern web experience. Your readers want *rainbows*. And
that's where fabulous.js shines.

Button > Light it up!

Fabulous.js is a jquery plugin that turns selected text into a rainbow. It
is pretty silly. It only really works well on websites with darker
backgrounds. It's best used on the main content of the website, leaving
out headers, footers and sidebars. This lends your content a kind of
divinity.

Text selection behaviour in browsers is a non-standard feature. It has
been removed from the CSS3 specification and is unlikely to be a part of
CSS4. Despite that, it works in all major browsers except IE 7/8.

Because text selection is basically undefined behaviour at this point,
this plugin may have quirks that won't be fixable. Fabulous.js tries to
prettify as many elements as possible, but some are still left with the
default blue color.

By default, Fabulous.js disables the selection styles of all elements not
rainbowed by Fabulous.js, which could massively annoy some of your users.
Pass false to the DisableOtherSelectionStyles option to turn off this
behaviour.

## Usage

This is a jQuery plugin, so make sure you include it in your page before
jquery.fabulous.js.

If the main content of your page is wrapped in <section> tags, call
$("section").fabulous()

If you want to have all elements highlight in color, call
$("body").fabulous()

The plugin may be called multiple times on the same page with different
selections, as below in the options demonstrations.

## Options

### Styles

Fabulous.js currently has three different styles.

"rainbow": A standard cycling of hues. Very pretty, but the yellows
are harder to read.

"cubehelix-rainbow": The "Less-Angry Rainbow" color scale by Mike Bostock,
inpired by Matteo Niccoli's perceptual rainbow.

"pride": The LGBT movement flag. This forces the cycle option to 6, to
maintain the correct colors.

### Cycle

The wavelength of the rainbow, as measured in the number of elements. Use
a bigger number (~100) to have a smooth color transition, and a smaller
number to cycle through a few colors quickly.

Default, 20, 100

### Rotation

Rotate the rainbow by a given amount.

Default: 0, 5, 10

### Glow

Adds a glow to the highlighted text. WebKit browsers allow selection
text-shadow to extend beyond the bounds of the text, so the glow amount is
quite large. Firefox doesn't, so the glow amount is quite small.

Default: true, false

### DisableOtherSelectionStyles

Adds a blanket rule to all non-Fabulous'd elements that disables selection
highlight. It doesn't actually disable selection, but only makes it look
that way.

Default: true, false

## lettering.js

Lettering.js lets you split up text into many smaller elements. If you
want a sweet-as title like at the top of this page, include
jquery.lettering.js in your application, and call lettering() and then
fabulous() on your jquery selection.

$("h1").lettering().fabulous()

