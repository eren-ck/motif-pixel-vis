/* global $ */

/**
 * Load the data from the backend with ajax queries
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

const url = 'http://127.0.0.1:8000/';
const JSONAPI_MIMETYPE = 'application/vnd.api+json';

// DOM Selector
const selXMotifReorder = '#motif-sp-x-axis';
const selYMotifReorder = '#motif-sp-y-axis';
const selXGDVReorder = '#graphlet-x-axis';
const selYGDVReorder = '#graphlet-y-axis';

/**
 * Return the motif SP
 * @param {Boolean} bool cluster and group bool
 * @return {Promise} Return promise
 *
 */
export function getMotifSP(bool) {
  const xAxis = $(selXMotifReorder).find('option:selected').attr('metric');
  const yAxis = $(selYMotifReorder).find('option:selected').attr('metric');

  return $.ajax({
    url: url + 'get_motif_sp',
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: { x: xAxis, y: yAxis, cluster: bool },
    headers: {
      Accept: JSONAPI_MIMETYPE,
    },
  });
}

/**
 * Load the dataset with the path
 * @param {String} path path to the file
 * @return {Promise} Return promise
 */
export function loadDataset(path) {
  return $.ajax({
    url: url + 'load_dataset/' + path,
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    headers: {
      Accept: JSONAPI_MIMETYPE,
    },
  });
}

/**
 * Get the graph metadata for the position
 * @param {integer} idx index position
 * @return {Promise} Return promise
 */
export function getGraphMeta(idx) {
  return $.ajax({
    url: url + 'get_graph_meta/' + idx,
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    headers: {
      Accept: JSONAPI_MIMETYPE,
    },
  });
}

/**
 * Return the GDV of a particular index position
 * @param {integer} idx index position
 * @param {Boolean} bool cluster and group bool
 * @return {Promise} Return promise
 */
export function getGDV(idx, bool) {
  const xAxis = $(selXGDVReorder).find('option:selected').attr('metric');
  const yAxis = $(selYGDVReorder).find('option:selected').attr('metric');

  return $.ajax({
    url: url + 'get_gdv',
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: { idx: idx, x: xAxis, y: yAxis, cluster: bool },
    headers: {
      Accept: JSONAPI_MIMETYPE,
    },
  });
}

/**
 * Get the graph at the positon idx
 * @param {Number} idx positions network
 * @param {integer} nodeId highlight the node with the id
 * @param {integer} clusterIdx cluster indices
 */
export function getGraphData(idx, nodeId, clusterIdx) {
  return $.ajax({
    url: url + 'get_graph_data',
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: { idx: idx, nodeId: nodeId, clusterIdx: clusterIdx },
    headers: {
      Accept: JSONAPI_MIMETYPE,
    },
  });
}
