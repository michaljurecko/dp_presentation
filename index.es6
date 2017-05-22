/* global Reveal */
import 'reveal.js/lib/js/head.min'
import 'reveal.js/js/reveal'

Reveal.initialize({
  controls: false,
  progress: true,
  history: true,
  center: true,
  // default/cube/page/concave/zoom/linear/fade/none
  transition: 'fade'
});

let timeout = null;
document.addEventListener("mousemove", e => {
  document.body.style.cursor = 'default';

  if (timeout) {
    clearTimeout(timeout)
  }

  timeout = setTimeout(() => {
    document.body.style.cursor = 'hide';
  }, 5000);
});
