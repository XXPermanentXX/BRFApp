/* global mapboxgl */

const html = require('choo/html');
const widget = require('cache-element/widget');
const { getEnergyClass } = require('../utils');

const UNKNOWN_ENERGY_CLASS = '#bbbbbb';
const ENERGY_CLASSES = {
  A: '#009036',
  B: '#55AB26',
  C: '#C8D200',
  D: '#FFED00',
  E: '#FBBA00',
  F: '#EB6909',
  G: '#E2001A'
};

module.exports = function createMap() {
  let map, markers;

  const container = widget({
    onchange(cooperatives, state, next) {

    },
    render(cooperatives, state, send) {
      markers = cooperatives.map(cooperative => ({
        coordinates: [ cooperative.lng, cooperative.lat ],
        properties: {
          performance: cooperative.performance,
          energyClass: getEnergyClass(cooperative.performance).toLowerCase(),
          id: cooperative._id
        }
      }));

      return html`<div class="Map u-sizeFill" />`;
    },
    onload(el) {
      mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;
      map = new mapboxgl.Map({
        container: el,
        style: process.env.MAPBOX_STYLE
      });

      map.on('load', () => {
        map.addSource('cooperatives', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: markers.map(marker => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: marker.coordinates
              },
              properties: marker.properties
            }))
          },
          cluster: true,
          clusterMaxZoom: 15
        });

        map.addLayer({
          id: 'unclustered-points',
          type: 'symbol',
          source: 'cooperatives',
          filter: ['!has', 'point_count'],
          layout: {
            // 'text-field': '{performance}',
            'icon-image': 'marker-{energyClass}'
          }
        });

        map.addLayer({
          id: 'cluster-points',
          type: 'circle',
          source: 'cooperatives',
          paint: {
            'circle-color': UNKNOWN_ENERGY_CLASS,
            'circle-radius': 18
          },
          filter: ['has', 'point_count'],
        });

        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'cooperatives',
          layout: {
            'text-field': '{point_count}',
            'text-font': [ 'Lato Bold' ],
            'text-size': 14
          }
        });

        map.fitBounds(getBounds(markers.map(marker => marker.coordinates)), {
          padding: el.offsetWidth * 0.1,
          duration: 0
        });
      });
    },
    onunload() {
      // map.remove();
    }
  });

  return container;
};

function getBounds(points) {
  const ne = [];
  const sw = [];

  for (let [ lng, lat ] of points) {
    if (!ne[0] || lng > ne[0]) {
      ne[0] = lng;
    }

    if (!ne[1] || lat > ne[1]) {
      ne[1] = lat;
    }

    if (!sw[0] || lng < sw[0]) {
      sw[0] = lng;
    }

    if (!sw[1] || lat < sw[1]) {
      sw[1] = lat;
    }
  }

  return [ sw, ne ];
}
