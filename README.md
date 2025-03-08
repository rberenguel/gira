# Gira

Watch a Youtube playlist you provided (or just a single video) while you get stationary bike or similar machine resistance suggestions
and an automatically generated slope to train with.

Note that this gets no input from your bike. Yet, at least. I have some ideas but they require me to
fight with my cadence sensor and Bluetooth. And I [hate tinkering with Bluetooth](https://github.com/rberenguel/foowrite).

By default (if no new playlist is provided) you will get [Larry McEnerney's Effective Writing class](https://www.youtube.com/watch?v=vtIzMaLkCaM)
which is not a bad video to watch.

The graph overlay is draggable and resizable (`ctrl+wheel` on desktop, pinch on mobile).

## Screenshot

This is how it looks on a desktop, although I plan on using it on my iPad.

<img src="media/screenshot-desktop.png" width=800/>

## Acknowledgements

- Gemini helped with most of the code here, I just removed some of the stupid decisions it kept taking.
- Also did the icon. I'm not sure how well it works as an icon, but it is hilarious.
- [interact.js](https://interactjs.io/) for draggability
- [idb-keyval](https://github.com/jakearchibald/idb-keyval) so you don't need to know the playlist id I use for this
- [p5js](https://p5js.org/) for the graph
- my command palette / menu [metap](https://github.com/rberenguel/metap)
