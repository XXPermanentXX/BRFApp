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
          name: cooperative.name,
          performance: cooperative.performance,
          actions: cooperative.actions,
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
          id: 'cooperative-points',
          type: 'symbol',
          source: 'cooperatives',
          filter: ['!has', 'point_count'],
          layout: {
            'icon-image': 'marker-{energyClass}',
            'icon-offset': [0, -20]
          }
        });

        map.addLayer({
          id: 'cooperative-clusters',
          type: 'circle',
          source: 'cooperatives',
          paint: {
            'circle-color': UNKNOWN_ENERGY_CLASS,
            'circle-radius': 18
          },
          filter: ['has', 'point_count'],
        });

        map.addLayer({
          id: 'cooperative-count',
          type: 'symbol',
          source: 'cooperatives',
          layout: {
            'text-field': '{point_count}',
            'text-font': [ 'Lato Bold' ],
            'text-size': 14
          }
        });

        map.fitBounds(markers.reduce((bounds, marker) => {
          return bounds.extend(marker.coordinates);
        }, new mapboxgl.LngLatBounds()), {
          padding: el.offsetWidth * 0.1,
          animate: false
        });

        map.on('mousemove', event => {
          const features = map.queryRenderedFeatures(event.point, {
            layers: ['cooperative-points']
          });

          map.getCanvas().style.cursor = features.length ? 'pointer' : '';
        });

        map.on('click', event => {
          const features = map.queryRenderedFeatures(event.point, {
            layers: ['cooperative-points']
          });

          if (!features.length) {
            return;
          }

          const feature = features[0];

          new mapboxgl.Popup({ closeButton: false })
            .setLngLat(feature.geometry.coordinates)
            .setDOMContent(html`
              <a href="/cooperatives/${ feature.properties.id }">${ feature.properties.name }</a>
            `)
            .addTo(map);
        });
      });
    },
    onunload() {
      // map.remove();
    }
  });

  return container;
};
