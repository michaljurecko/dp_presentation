/* global Reveal */
import 'reveal.js/lib/js/head.min'
import 'reveal.js/js/reveal'
import './plugin/elapsed-time-bar'

Reveal.initialize({
  controls: false,
  progress: true,
  history: true,
  center: true,
  margin: 0,
  // default/cube/page/concave/zoom/linear/fade/none
  transition: 'fade',
  // elapsed bar
  allottedTime: 60 * 1000 * 14, // 14 minutes
  // - (optional) height of page/time progress bar
  progressBarHeight: 4,
  // - (optional) bar color
  barColor: 'rgb(0, 172, 200)',
});


document.body.style.cursor = 'none';

let timeout = null;
document.addEventListener("mousemove", e => {
  document.body.style.cursor = 'default';

  if (timeout) {
    clearTimeout(timeout)
  }

  timeout = setTimeout(() => {
    document.body.style.cursor = 'none';
  }, 500);
});
