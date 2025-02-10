// this file expects that hopscotch is included in the project.
// <link href="node_modules/hopscotch/dist/css/hopscotch.min.css" rel="stylesheet">
// <script src="node_modules/hopscotch/dist/js/hopscotch.min.js"></script>
//
// for deployment, also copy "node_modules/hopscotch/dist/img/sprite-*.png" to "build/img/"

// DOCUMENTATION: https://linkedinattic.github.io/hopscotch/

import { translate as t } from './i18n.js';

export function startTour(step = 0) {
  const tour = {
    id: "hello-hopscotch",
    i18n: {
      nextBtn: `${t('Next')}`,
      prevBtn: `${t('Previous')}`,
      doneBtn: `${t('Done')}`,
      skipBtn: `${t('Skip')}`,
      closeTooltip: `${t('Close')}`,
      stepNums : ["1/6", "2/6", "3/6", "4/6", "5/6", "6/6"]
    },
    steps: [
        {
            title: `${t('Map')}`,
            content: `${t('Hopscotch map explain')}`,
            target: document.querySelector("map-app").shadowRoot.querySelector('web-map').shadowRoot.querySelector('map-spinner'),
            placement: "top"
        },
        {
            title: `${t('Tools')}`,
            content: `${t('Hopscotch tools explain')}`,
            target: document.querySelector("map-app").shadowRoot.querySelector('web-map').shadowRoot.querySelector('#tool-menu-container'),
            placement: "right",
            yOffset: "center",
            showPrevButton: true
        },
        {
            title: `${t('Legend')}`,
            content: `${t('Hopscotch legend explain')}`,
            target: document.querySelector("map-app").shadowRoot.querySelector('web-map').shadowRoot.querySelector('#legend-container-container > map-layer-container'),
            placement: "left",
            yOffset: "center",
            showPrevButton: true
        },
        {
            title: `${t('Hopscotch zoom title')}`,
            content: `${t('Hopscotch zoom explain')}`,
            target: document.querySelector("map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector(".maplibregl-ctrl-bottom-left"),
            placement: "right",
            showPrevButton: true,
            yOffset: -100,
            arrowOffset: 125
        },
        {
            title: `${t('Hopscotch coordinates title')}`,
            content: `${t('Hopscotch coordinates explain')}`,
            target: document.querySelector("map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("map-coordinates"),
            placement: "top",
            xOffset: "center",
            arrowOffset: "center",
            yOffset: -10,
            showPrevButton: true
        },
        {
            title: `${t('Hopscotch scale and attribution title')}`,
            content: `${t('Hopscotch scale and attribution explain')}`,
            target: document.querySelector("map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector(".maplibregl-ctrl-bottom-right > div.maplibregl-ctrl-scale"),
            placement: "top",
            xOffset: -265,
            arrowOffset: 250,
            showPrevButton: true
        }
    ]
  };
  // create custom border style for hopscotch bubbles
  const style = document.createElement('style');
  style.textContent = `
  div.hopscotch-bubble {
      border-color: var(--theme-background-color, #2e7dba);
      border-radius: 3px !important;
  }
  div.hopscotch-bubble .hopscotch-bubble-arrow-container.up .hopscotch-bubble-arrow-border {
    border-bottom: 17px solid var(--theme-background-color, #2e7dba);
  }
  div.hopscotch-bubble .hopscotch-bubble-arrow-container.down .hopscotch-bubble-arrow-border {
    border-top: 17px solid var(--theme-background-color, #2e7dba);
  }
  div.hopscotch-bubble .hopscotch-bubble-arrow-container.left .hopscotch-bubble-arrow-border {
    border-right: 17px solid var(--theme-background-color, #2e7dba);
  }
  div.hopscotch-bubble .hopscotch-bubble-arrow-container.right .hopscotch-bubble-arrow-border {
    border-left: 17px solid var(--theme-background-color, #2e7dba);
  }`;

  document.head.appendChild(style);
  // Start the tour!
  hopscotch.startTour(tour, step);
}