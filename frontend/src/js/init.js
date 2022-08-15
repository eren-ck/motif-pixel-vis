/* global $, d3*/
'use strict';

/**
 * Initilaize svg and listerners for buttons etc.
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

import {
  updateDataset,
  updateMotifVis,
  updateGDVVis,
  nextClusterGraphVis,
  removeGraphVis,
  setPixelBoolean,
} from './app.js';

// DOM Selector
const selector = '#motif-vis';
const selectorGraph = '#graph-vis';

/**
 * Initilaize the responsive SVGs in the overview and details div
 */
export function initSVG() {
  _appendResponsiveSVG(selector);
  _appendResponsiveSVG(selectorGraph);
  _initToolbar();
}

/**
 * Append responsive SVGs to the selector div
 * @param {selector} selector of the div to which the svg should be added
 */
function _appendResponsiveSVG(selector) {
  const elm = $(selector);
  const width = parseInt(elm.width());
  const height = parseInt(elm.height()) * 0.9;

  d3.select(selector)
    .append('div')
    .classed('svg-container', true)
    .append('svg')
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('viewBox', '0 0 ' + width + ' ' + height + '')
    .classed('svg-content-responsive', true);

  /* depends on svg ratio, for 1240/1900 = 0.65 so padding-bottom = 65% */
  const percentage = Math.ceil((height / width) * 100);
  $(selector).append(
    $(
      '<style>' +
        selector +
        '::after {padding-top: ' +
        percentage +
        '%;display: block;content: "";}</style> '
    )
  );
}

/**
 * Initilaize the toolbar
 */
function _initToolbar() {
  $('#dataset-option').on('change', function () {
    updateDataset();
  });

  $('#motif-sp-x-axis').on('change', function () {
    updateMotifVis();
  });

  $('#motif-sp-y-axis').on('change', function () {
    updateMotifVis();
  });

  $('#graphlet-x-axis').on('change', function () {
    updateGDVVis();
  });

  $('#graphlet-y-axis').on('change', function () {
    updateGDVVis();
  });

  $('#button-cluster-graph-vis').on('click', function () {
    const bool = !$(this).hasClass('active');
    if (bool) {
      $('#bagde-graph-vis-cluster').show();
    } else {
      $('#bagde-graph-vis-cluster').hide();
    }
    removeGraphVis();
  });

  $('#button-cluster-left').on('click', function () {
    nextClusterGraphVis(false);
  });
  $('#button-cluster-right').on('click', function () {
    nextClusterGraphVis(true);
  });

  $('#button-cluster-pixel-vis').on('click', function () {
    const bool = !$(this).hasClass('active');
    setPixelBoolean(bool);

    updateMotifVis();
    updateGDVVis();
  });
}

// init bootstrap tooltips
$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});
