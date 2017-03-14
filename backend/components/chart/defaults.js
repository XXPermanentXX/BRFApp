const moment = require('moment');
const { format } = require('../utils');
const { __ } = require('../../locale');

module.exports = {
  chart: {
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
    padding: 0,
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
    shared: false,
    style: {
      fontSize: 'inherit',
      color: 'inherit',
      lineHeight: '21px'
    }
  },
  xAxis: {
    type: 'datetime',
    lineWidth: 0,
    tickWidth: 0,
    crosshair: {
      width: 1,
      color: 'rgba(255, 255, 255, 0.26)'
    },
    labels: {
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
        formatter() {
          return format(this.y);
        },
        y: -8,
        style: {
          color: 'currentColor',
          textOutline: 'none',
          fontWeight: 'bold'
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
          this.chart.series.slice(0, 2).forEach(serie => serie.dataLabelsGroup.hide());
        },
        mouseOut() {
          setTimeout(() => {
            this.chart.series.slice(0, 2).forEach(serie => {
              if (serie.visible) {
                serie.dataLabelsGroup.show();
              }
            });
          }, 500);
        }
      }
    }
  },
  series: [

    /**
     * Primary data serie
     */

    {
      type: 'spline',
      color: 'currentColor',
      zIndex: 1,
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
      type: 'spline',
      color: '#19DDC0',
      dataLabels: {
        style: {
          color: '#19DDC0'
        }
      },
      tooltip: {
        enabled: false
      },
      enableMouseTracking: false,
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
    },

    /**
     * Actions
     */

    {
      type: 'scatter',
      showInLegend: false,
      tooltip: {
        enabled: false
      },
      marker: {
        enabled: false
      },
      dataLabels: {
        enabled: true,
        align: 'right',
        color: 'currentColor',
        useHTML: true,
        formatter() {
          return `
            <span class="Chart-action">
              ${ this.point.name }
            </span>
          `;
        }
      },
      enableMouseTracking: false,
      data: []
    }
  ]
};
