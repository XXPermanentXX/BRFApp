const moment = require('moment');
const { capitalize, format } = require('../utils');
const { __ } = require('../../locale');

module.exports = {
  chart: {
    type: 'spline',
    backgroundColor: 'transparent',
    style: {
      fontFamily: 'inherit',
      fontSize: '14px'
    }
  },
  credits: {
    enabled: false
  },
  title: { text: null },
  legend: {
    title: {
      style: { color: 'currentColor' },
      text: `${ __('Energy use') } (kWh/m<sup>2</sup>)`
    },
    useHTML: true,
    floating: true,
    align: 'left',
    verticalAlign: 'top',
    layout: 'vertical',
    margin: 0,
    itemStyle: {
      color: 'currentColor',
      textDecoration: 'none',
      fontStyle: 'italic'
    },
    itemHiddenStyle: {
      color: '#C5CCD3',
      textDecoration: 'none'
    },
    itemHoverStyle: {
      color: 'currentColor',
      textDecoration: 'underline'
    }
  },
  tooltip: {
    padding: 0,
    borderWidth: 0,
    borderRadius: 3,
    backgroundColor: 'transparent',
    useHTML: true,
    shadow: false,
    shared: true,
    formatter() {
      return `
        <span class="Chart-tooltip js-tooltip">
          <strong>${ capitalize(moment(this.x).format('MMMM')) }</strong>
          ${ this.points.reduce((str, point) => `
            ${ str }
            <br />
            <strong>${ point.series.name }</strong> ${ format(point.y) } kWh/m<sup>2</sup>
          `, '') }
        </span>
      `;
    },
    style: {
      fontSize: 'inherit',
      color: 'inherit',
      lineHeight: '21px'
    }
  },
  xAxis: {
    categories: [],
    lineWidth: 0,
    tickWidth: 0,
    crosshair: {
      width: 1,
      color: 'currentColor'
    },
    labels: {
      step: 3,
      formatter() {
        return moment(this.value).format('MMM YYYY ');
      },
      style: {
        color: 'currentColor'
      }
    }
  },
  yAxis: {
    title: { text: null },
    labels: { enabled: false },
    gridLineWidth: 0
  },
  plotOptions: {
    spline: {
      dataLabels: {
        enabled: true,
        verticalAlign: 'bottom',
        formatter() {
          return format(this.y);
        },
        y: -8,
        style: {
          color: 'currentColor',
          textOutline: 'none',
          fontWeight: 'normal'
        }
      },
      lineWidth: 2,
      states: {
        hover: {
          lineWidth: 2
        }
      },
      events: {
        mouseOver() {
          this.dataLabelsGroup.hide();
        },
        mouseOut() {
          setTimeout(() => this.dataLabelsGroup.show(), 500);
        }
      }
    }
  },
  series: [

    /**
     * Primary data serie
     */

    {
      color: 'currentColor',
      marker: {
        fillColor: '#388EE8',
        lineWidth: 2,
        states: {
          hover: {
            enabled: false
          }
        }
      },
      data: []
    },

    /**
     * Comparative data serie
     */

    {
      color: '#19DDC0',
      marker: {
        fillColor: '#19DDC0',
        lineColor: '#19DDC0',
        symbol: 'circle',
        states: {
          hover: {
            enabled: false
          }
        }
      },
      data: []
    }
  ]
};
