/* global mapboxgl */

const html = require('choo/html');
const widget = require('cache-element/widget');
const { getEnergyClass } = require('../utils');

const UNKNOWN_ENERGY_CLASS = '#bbbbbb';

module.exports = function createMap() {
  let features, map;
  let isLoaded = false;

  const container = widget({
    onupdate(el, cooperatives, state, send) {
      const features = getFeatures(cooperatives);

      if (isLoaded) {
        setData();
      } else {
        map.on('load', setData);
      }

      function setData() {
        map.getSource('cooperatives').setData({
          type: 'FeatureCollection',
          features: features
        });

        map.fitBounds(features.reduce((bounds, feature) => {
          return bounds.extend(feature.geometry.coordinates);
        }, new mapboxgl.LngLatBounds()), {
          padding: el.offsetWidth * 0.1,
          animate: false
        });
      }
    },
    render(cooperatives, state, send) {
      features = getFeatures(cooperatives);

      return html`<div class="Map u-sizeFill" />`;
    },
    onload(el) {
      mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;
      map = new mapboxgl.Map({
        container: el,
        style: process.env.MAPBOX_STYLE,
        maxZoom: 17
      });

      map.on('load', () => {
        isLoaded = true;

        map.addSource('cooperatives', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: features
          },
          cluster: true,
          clusterMaxZoom: 12
        });

        map.addLayer({
          id: 'cooperative-points',
          type: 'symbol',
          source: 'cooperatives',
          filter: ['!has', 'point_count'],
          layout: {
            'icon-allow-overlap': true,
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

        map.fitBounds(features.reduce((bounds, feature) => {
          return bounds.extend(feature.geometry.coordinates);
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

function getFeatures(cooperatives) {
  return cooperatives.map(cooperative => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [ cooperative.lng, cooperative.lat ]
    },
    properties: {
      id: cooperative._id,
      name: cooperative.name,
      performance: cooperative.performance,
      actions: cooperative.actions,
      energyClass: (getEnergyClass(cooperative.performance) || 'unknown').toLowerCase()
    }
  }));
}
