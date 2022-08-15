/* global d3, $*/

/**
 * Main controller for motif vis paper
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/style.css';
import 'bootstrap';
import 'bootstrap-select/js/bootstrap-select';
import 'bootstrap-select/dist/css/bootstrap-select.css';
import '../../../static/materialdesignicons.min.css';

import { initSVG } from './init.js';

import { getMotifSP, loadDataset, getGDV, getGraphData } from './data.js';

import { PixelMotifVis } from './pixel_motif_vis.js';
import { GDVVis } from './gdv_vis.js';
import { GraphVis } from './graph_vis.js';

// DOM Selector
const selectorMotif = '#motif-vis svg';
const selectorGDV = '#graphlet-vis';
const selectorGraph = '#graph-vis svg';
const selClusterGraphVis = '#button-cluster-graph-vis';

const margin = { top: 0, right: 10, bottom: 10, left: 10 };

let svg, g;
let height, width;

let graphVisIdx, graphVisClusterIdx;

export let motifVis;
export let gdvVis = {};
export let pixelClusterBool = false;

/**
 * Document ready functionality
 */
$(function() {
  initSVG();
  initViews();
});

/**
 * Initilaize the views
 */
function initViews() {
  // get the svg data
  svg = d3.select(selectorMotif);

  // regex for floats
  const floatValues = /[+-]?([0-9]*[.])?[0-9]+/;
  height =
    +svg.style('height').match(floatValues)[0] -
    margin['bottom'] -
    margin['top'];
  width =
    +svg.style('width').match(floatValues)[0] -
    margin['left'] -
    margin['right'];

  g = svg
    .append('g')
    .attr('class', 'pixel-group')
    .attr(
      'transform',
      'translate(' + margin['left'] + ', ' + margin['top'] + ')'
    );

  // load initial data
  const promise = getMotifSP(pixelClusterBool);
  promise.then(function(data) {
    // console.log(data);
    // init the pixel based visualization and redraw it
    motifVis = new PixelMotifVis(g, width, height, data);
    motifVis.draw();
  });
}

/**
 * Update the visualization
 */
export function updateMotifVis() {
  // show the spinner
  $('#spinner').show();

  // get the updated motif pixel vis
  const promise = getMotifSP(pixelClusterBool);
  promise.then(function(data) {
    motifVis.data = data;
    motifVis.draw();
  });
}

/**
 * Change the dataset
 */
export function updateDataset() {
  // show the spinner
  $('#spinner').show();

  const newPath = $('#dataset-option')
    .find('option:selected')
    .attr('data');

  loadDataset(newPath).then(function() {
    updateMotifVis();
  });
}

/**
 * Add another GDV plot to the graphlet vis plot
 * @param {integer} idx index position of network
 */
export function addGDV(idx) {
  // if not already in the array
  if (!(idx in gdvVis)) {
    // add another GDV plot
    const promise = getGDV(idx, pixelClusterBool);
    promise.then(function(data) {
      // console.log(data);

      const svgGDV = d3
        .select(selectorGDV)
        .append('p')
        .attr('id', 'p-gdv-' + idx)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      // init the pixel based visualization and redraw it
      const tmpGDV = new GDVVis(svgGDV, width, height, data, idx);
      tmpGDV.draw();
      gdvVis[idx] = tmpGDV;
    });
  }
}

/**
 * Update GDV visualization
 */
export function updateGDVVis() {
  // show the spinner
  $('#spinner').show();
  // console.log(gdvVis);

  // update all gdv plots
  for (let [idx, tmpGDV] of Object.entries(gdvVis)) {
    const promise = getGDV(idx, pixelClusterBool);
    promise.then(function(data) {
      tmpGDV.data = data;
      tmpGDV.draw();
    });
  }
}

/**
 * Remoive GDV data to the graphlet vis plot
 * @param {integer} idx index position of network
 */
export function removeGDV(idx) {
  d3.select('#p-gdv-' + idx).remove();
  delete gdvVis[idx];
  // remove selection
  d3.select('#col-g-motif-' + idx).classed('selected', false);
}

/**
 * Add graph visualization to the modal view
 * @param {integer} idx index position of network
 * @param {integer} nodeId highlight the node with the id
 * @param {integer} clusterIdx cluster indices
 */
export function addGraphVis(idx, nodeId = -1, clusterIdx = 0) {
  $('#spinner-graph-vis').show();

  if (graphVisIdx != idx) {
    graphVisIdx = idx;
    graphVisClusterIdx = clusterIdx;
  }

  // delete old graph vis
  const graphSvg = d3.select(selectorGraph);
  graphSvg.selectAll('*').remove();

  const clusterBool = $(selClusterGraphVis).hasClass('active');
  clusterIdx = clusterBool ? clusterIdx : -1;

  const promise = getGraphData(idx, nodeId, clusterIdx);
  promise.then(function(data) {
    new GraphVis(graphSvg, data);
  });
}

/**
 * Next cluster in the graphVis view
 * @param {Boolean} bool if true move one cluster to right
 */
export function nextClusterGraphVis(bool) {
  $('#spinner-graph-vis').show();

  // delete old graph vis
  const graphSvg = d3.select(selectorGraph);
  graphSvg.selectAll('*').remove();

  if (bool === true) {
    graphVisClusterIdx = graphVisClusterIdx + 1;
  } else {
    graphVisClusterIdx =
      graphVisClusterIdx - 1 < 0 ? 0 : graphVisClusterIdx - 1;
  }

  addGraphVis(graphVisIdx, -1, graphVisClusterIdx);
}

/**
 * Remove graphVis view content - only called if aggregation button is clicked
 */
export function removeGraphVis() {
  const graphSvg = d3.select(selectorGraph);
  graphSvg.selectAll('*').remove();
}

/**
 * Set the graph cluster boolean variable
 * @param {Boolean} bool if true move one cluster to right
 */
export function setPixelBoolean(bool) {
  pixelClusterBool = bool;
}
