/* global mapboxgl */

const html = require('choo/html');
const { getEnergyClass, id } = require('../utils');
const popup = require('./popup');

const CLUSTER_THRESHOLD = 12;

module.exports = function createMap() {
  let _args, container, map;
  const uid = `map_${ id() }`;

  return function (...args) {
    if (!container) {
      container = html`<div class="Map u-sizeFill" id=${ uid } onload=${ onload } />`;
      container.isSameNode = target => target.id === uid;
    } else if (shouldUpdate(args, _args)) {
      const [ cooperatives  ] = args;
      onupdate(cooperatives);
    }

    _args = args;

    return container;

    function onupdate(cooperatives) {
      const features = getFeatures(cooperatives);

      if (map) {
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
          padding: container.offsetWidth * 0.1,
          animate: false
        });
      }
    }

    function onload(el) {
      if (map) { return; }

      const [ cooperatives  ] = args;
      const features = getFeatures(cooperatives);

      mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;
      map = new mapboxgl.Map({
        container: el,
        style: process.env.MAPBOX_STYLE,
        maxZoom: 17
      });

      map.on('load', () => {
        map.addSource('cooperatives', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: features
          },
          cluster: true,
          clusterMaxZoom: CLUSTER_THRESHOLD
        });

        map.addLayer({
          id: 'cooperative-markers',
          type: 'symbol',
          source: 'cooperatives',
          filter: ['!has', 'point_count'],
          layout: {
            'icon-allow-overlap': true,
            'icon-image': 'marker-{energyClass}',
            'icon-offset': [0, -21]
          }
        });

        map.addLayer({
          id: 'cooperative-clusters',
          type: 'symbol',
          source: 'cooperatives',
          filter: ['has', 'point_count'],
          layout: {
            'icon-allow-overlap': true,
            'icon-image': 'marker-cluster',
            'text-field': '{point_count}',
            'text-font': [ 'Lato Bold' ],
            'text-size': 14,
            'text-offset': [ 0, 0.85 ]
          },
          paint: {
            'text-color': '#fff'
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
            layers: ['cooperative-markers', 'cooperative-clusters']
          });

          map.getCanvas().style.cursor = features.length ? 'pointer' : '';
        });

        map.on('click', event => {
          const features = map.queryRenderedFeatures(event.point, {
            layers: ['cooperative-markers', 'cooperative-clusters']
          });

          if (!features.length) {
            return;
          }

          const feature = features[0];

          if (feature.properties.cluster) {
            map.flyTo({
              center: feature.geometry.coordinates,
              zoom: CLUSTER_THRESHOLD + 1
            });
          } else {
            const offset = {
              'top': [0, -15],
              'top-left': [0, -15],
              'top-right': [0, -15],
              'bottom': [0, -36],
              'bottom-left': [0, -36],
              'bottom-right': [0, -36],
              'left': [6, -26],
              'right': [-6, -26]
            };

            new mapboxgl.Popup({ closeButton: false, offset })
              .setLngLat(feature.geometry.coordinates)
              .setDOMContent(popup(feature))
              .addTo(map);
          }
        });
      });
    }
  };
};

function shouldUpdate(args, prev) {
  if (args.length !== prev.length) {
    return true;
  }

  return args.reduce((diff, cooperative, index) => {
    return diff || cooperative._id !== prev[index]._id;
  }, false);
}

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
      actions: cooperative.actions.length,
      energyClass: (getEnergyClass(cooperative.performance) || 'unknown').toLowerCase()
    }
  }));
}
