/* global mapboxgl */

const html = require('choo/html');
const createPopup = require('./popup');
const { getEnergyClass, cache } = require('../utils');

const CLUSTER_THRESHOLD = 12;

module.exports = function createMap() {
  let map;

  return cache({
    shouldUpdate(args, prev) {
      // Check if number of cooperatives has changed
      if (args[0].length !== prev[0].length) {
        return true;
      }

      // Check if center has changed
      if (args[1].latitude !== prev[1].latitude || args[1].longitude !== prev[1].longitude) {
        return true;
      }

      return false;
    },

    update(element, cooperatives, center) {
      if (map) {
        setData();
      } else {
        map.on('load', setData);
      }

      function setData() {
        map.getSource('cooperatives').setData({
          type: 'FeatureCollection',
          features: asFeatures(cooperatives)
        });

        map.fitBounds(getBounds(cooperatives, getCoordinates(center)), {
          padding: element.offsetWidth * 0.1,
        });
      }
    },

    render(cooperatives, center) {
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

      const popup = new mapboxgl.Popup({ closeButton: false, offset });

      return html`<div class="Map u-sizeFill" onload=${ onload } onunload=${ onunload }></div>`;

      function onunload() {
        if (popup.isOpen()) {
          popup.remove();
        }
      }

      function onload(el) {
        if (map) { return; }

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
              features: asFeatures(cooperatives)
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

          map.fitBounds(getBounds(cooperatives, getCoordinates(center)), {
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
              popup
                .setLngLat(feature.geometry.coordinates)
                .setDOMContent(createPopup(feature))
                .addTo(map);
            }
          });
        });
      }
    }
  });
};

/**
 * Extract coordinates as LngLatLike object from object
 * @param  {Object} props Object with some kind of lat/lng properties
 * @return {Array}        LatLngLike (Mapbox compatible)
 */

function getCoordinates(props) {
  return [
    props.longitude || props.lng,
    props.latitude || props.lat
  ];
}

/**
 * Calculate bounds for given coopeartives and center coordinates
 * @param  {Array}      cooperatives List of cooperatives
 * @param  {LatLngLike} center       Coordinates to base positioning on
 * @return {mapboxgl.LngLatBounds}
 */

function getBounds(cooperatives, center) {
  let include;
  const bounds = new mapboxgl.LngLatBounds();
  const closest = cooperatives.map(cooperative => {
    return getPositionDistance(center, getCoordinates(cooperative));
  }).sort()[0];

  if (closest > 30) {
    // Include center if it's way off to not confuse anyone
    bounds.extend(center);
  }

  if (closest < 200) {
    // Include the closest five cooperatives if within reasonable distance
    include = cooperatives.slice()
      .sort((a, b) => {
        const aDistance = getPositionDistance(center, getCoordinates(a));
        const bDistance = getPositionDistance(center, getCoordinates(b));
        return aDistance > bDistance ? 1 : -1;
      })
      .filter((item, index) => index < 5);
  } else {
    // Include all cooperatives if center is too far off
    include = cooperatives;
  }

  include.forEach(cooperative => bounds.extend(getCoordinates(cooperative)));

  return bounds;
}

/**
 * Convert degrees to radius
 */

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculate distance between two lat/lng points in km
 */

function getPositionDistance(posA, posB) {
  const [lng1, lat1] = posA;
  const [lng2, lat2] = posB;

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad above
  const dLon = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km

  return d;
}

function asFeatures(cooperatives) {
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
