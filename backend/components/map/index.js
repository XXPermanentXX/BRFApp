/* global mapboxgl */

const html = require('choo/html');
const widget = require('cache-element/widget');
const { getEnergyClass } = require('../utils');
const { __, __n } = require('../../locale');
const {
  energyRepresentative,
  energyMap,
  target,
  lightChallenge,
  electricCar
} = require('../icons');

const CLUSTER_THRESHOLD = 12;

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
  });

  return container;
};

function popup(feature) {
  const { properties } = feature;

  return html`
    <div class="Map-popup">
      <div class="u-nbfc">
        <a class="u-textBold" href="/cooperatives/${ properties.id }">
          ${ properties.name }
        </a>
        <br />
        <span class="u-textBold">${ Math.round(properties.performance) }</span> kWh/m<sup>2</sup>
        <br />
        ${ properties.actions ? html`
          <span>
            <span class="u-textBold">${ properties.actions }</span>
            ${ __n('Energy action', 'Energy actions', properties.actions) }
          </span>
        ` : __('No energy actions') }
        <br />
        <div class="u-nbfc u-marginTb">
          <div class="u-floatLeft u-marginRb" style="color: ${ Math.random() > 0.5 ? '#bbbbbb' : 'currentColor' };" title=${ __('Designated Energyrepresentative') }>${ energyRepresentative(22) }</div>
          <div class="u-floatLeft u-marginRb" style="color: ${ Math.random() > 0.5 ? '#bbbbbb' : 'currentColor' };" title=${ __('Energy mapping') }>${ energyMap(22) }</div>
          <div class="u-floatLeft u-marginRb" style="color: ${ Math.random() > 0.5 ? '#bbbbbb' : 'currentColor' };" title=${ __('Contract for goal oriented energy management') }>${ target(22) }</div>
          <div class="u-floatLeft u-marginRb" style="color: ${ Math.random() > 0.5 ? '#bbbbbb' : 'currentColor' };" title=${ __('Participating in belysningsutmaningen') }>${ lightChallenge(22)  }</div>
          <div class="u-floatLeft u-marginRb" style="color: ${ Math.random() > 0.5 ? '#bbbbbb' : 'currentColor' };" title=${ __('Charger for electric cars') }>${ electricCar(22)  }</div>
        </div>
      </div>
    </div>
  `;
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
