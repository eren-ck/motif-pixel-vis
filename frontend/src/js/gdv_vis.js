/* global d3, $ */

/**
 * Pixel visualization for Graphlet Degree Vector profiles as a JS class
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

import { removeGDV, addGraphVis } from './app.js';

const margin = { top: 10, right: 30, bottom: 10, left: 20 };

/**
 * Class for the pixel based visualization
 */
export class GDVVis {
  /**
   * Constructor for the level class
   * @param {svg} g svg group to add the pixel vis
   * @param {Number} width width of the group element
   * @param {Number} height height of the group element
   * @param {Array} data graphlet degree vector data
   * @param {Number} idx index position of the gdv in the motif pixel vis
   */
  constructor(g, width, height, data, idx) {
    this._svg = g;
    this._width = width - margin['right'] - margin['left'];
    this._height = height - margin['top'] - margin['bottom'];

    this._data = data['gdv'];
    this._order_x = data['ordering'];
    this._order_y = data['y_ordering'];
    this._node_names = data['node_names'];
    this._clusterIdx = data['cluster_idx'];
    this._meta_data = {
      date: data['date'],
      number_of_edges: data['number_of_edges'],
      number_of_nodes: data['number_of_nodes']
    };
    this._idx = idx;

    // add a a clipping path around the group
    this._clip = this._svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'clip-pixel')
      .append('rect')
      .attr('x', margin['left'])
      .attr('y', margin['top'])
      .attr('width', this._width)
      .attr('height', this._height);

    this._zoom = this._svg
      .append('g')
      .attr('class', 'zoom-group')
      .attr('clip-path', 'url(#clip-pixel)');

    // append zoom rectangle to the zoom group
    // a rectangle to active the zoom every where in the group
    this._selectionRect = this._zoom
      .append('rect')
      .attr('class', 'selection-group-rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this._width)
      .attr('height', this._height);

    // append the g for the group
    this._g = this._zoom
      .append('g')
      .attr('class', 'gdv-vis')
      .attr(
        'transform',
        'translate(' + margin['left'] + ', ' + margin['top'] + ')'
      );

    this._gCluster = this._g.append('g').attr('class', 'gdv-pixel-cluster');

    this.addButtons();
  }

  /**
   * Draw the pixel based visualization
   */
  draw() {
    const that = this;

    var timer; // needed for mouseover time out

    const color = d3
      .scaleLinear()
      .domain([0, 10, 100, 1000, 10000])
      .range(['#ffffff', '#bdbdbd', '#525252', '#252525', '#000000']);
    // zoom for the group

    let rectWidth =
      Math.floor(this._width / this._data.length) > 0
        ? Math.floor(this._width / this._data.length)
        : 1;
    let rectHeight =
      Math.floor(this._height / this._data[0].length) > 0
        ? Math.floor(this._height / this._data[0].length)
        : 1;

    const xScale = d3
      .scaleLinear()
      .domain([0, this._data.length])
      .range([0, this._width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, this._data[0].length])
      .range([0, this._height]);

    const zoom = d3
      .zoom()
      .scaleExtent([1, 10])
      .translateExtent([
        [0, 0],
        [this._width, this._height]
      ])
      .extent([
        [0, 0],
        [this._width, this._height]
      ])
      .on('zoom', function(event) {
        // zoom the x-Axis
        const zoomScale = event.transform.rescaleX(xScale);
        that._colGroupsEnter.attr('transform', function(d, i) {
          return 'translate(' + zoomScale(i) + ',0)';
        });
        // rescale the rectangles
        that._cellsEnter.attr('width', rectWidth * event.transform.k);

        that._clusterRectEnter
          .attr('x', function(d) {
            return zoomScale(d[0]);
          })
          .attr('width', function(d) {
            return Math.abs(zoomScale(Math.abs(d[1] - d[0])));
          });
      });

    this._svg.call(zoom);

    // append the bounding boxes for the cluster rectangles
    const clusterRect = this._gCluster
      .selectAll('.cluster-rect')
      .data(this._clusterIdx);

    this._clusterRectEnter = clusterRect
      .enter()
      .append('rect')
      .merge(clusterRect)
      .attr('class', 'cluster-rect')
      .attr('x', function(d) {
        return xScale(d[0]);
      })
      .attr('width', function(d) {
        return Math.abs(xScale(Math.abs(d[1] - d[0])));
      })
      .attr('height', this._height);

    // EXIT cells
    clusterRect.exit().remove();

    // JOIN the svg groups
    const colGroups = this._g.selectAll('.col-g').data(this._data);

    this._colGroupsEnter = colGroups
      .enter()
      .append('g')
      .merge(colGroups)
      .attr('class', function(d, i) {
        return 'col-g col-g-gdv-' + that._order_x[i];
      })
      .on('mouseover', function(event, d) {
        // show tooltip
        const i = that._colGroupsEnter.nodes().indexOf(this);
        const nodeId = that._order_x[i];
        const nodeName =
          nodeId in that._node_names ? that._node_names[nodeId] : 'NaN';
        // tooltip text stuff
        let tooltipText = 'Node ' + nodeId + ': ' + nodeName;

        let xPosition =
          event.pageX + 250 < that._width
            ? event.pageX + 20
            : event.pageX - 300;
        let yPosition = event.pageY - 20;

        const tooltip = d3
          .select('#tooltip')
          .style('left', xPosition + 'px')
          .style('top', yPosition + 'px')
          .classed('hide', false);
        tooltip.select('#meta').classed('hide', true);

        tooltip.select('#meta-date').html(tooltipText);

        // tooltip gdv
        tooltip
          .select('#table-motifs')
          .selectAll('*')
          .remove(); // remove old table

        // get the row data for the tooltips
        let firstRowData = ['Orbit'];
        let secondRowData = ['GDV'];

        // display only orbits with values
        d.forEach(function(dd, index) {
          if (dd !== 0) {
            firstRowData.push(index);
            secondRowData.push(dd);
          }
        });

        tooltip
          .select('#table-motifs')
          .append('tr')
          .selectAll('th')
          .data(firstRowData)
          .enter()
          .append('th')
          .attr('class', 'table-text')
          .html(function(dd) {
            return dd;
          });

        tooltip
          .select('#table-motifs')
          .append('tr')
          .selectAll('th')
          .data(secondRowData)
          .enter()
          .append('th')
          .attr('class', 'table-text')
          .html(function(dd) {
            return dd;
          });

        $('#spinner-graph-vis').show();
        timer = setTimeout(function() {
          // on click highlight all nodes with that
          addGraphVis(that._idx, nodeId);
        }, 1000);
      })
      .on('mouseout', function() {
        // hide tooltip
        const tooltip = d3.select('#tooltip').classed('hide', true);
        tooltip.select('#meta').classed('hide', false);
        clearTimeout(timer);
        $('#spinner-graph-vis').hide();
      })
      .on('click', function() {
        // on click highlight all nodes with that
        const i = that._colGroupsEnter.nodes().indexOf(this);
        const nodeId = that._order_x[i];
        // if (d3.select(this).classed('selected')) {
        //   d3.selectAll('.col-g-gdv-' + nodeId).classed('selected', false);
        // } else {
        //   d3.selectAll('.col-g-gdv-' + nodeId).classed('selected', true);
        // }
        addGraphVis(that._idx, nodeId);
      });

    this._colGroupsEnter
      .transition()
      .delay(function(d, i) {
        return i * 10;
      })
      .attr('transform', function(d, i) {
        return 'translate(' + xScale(i) + ',0)';
      });

    // EXIT the groups
    colGroups.exit().remove();

    const cells = this._colGroupsEnter.selectAll('.cell').data(function(d) {
      return d;
    });
    // ENTER add rects
    this._cellsEnter = cells
      .enter()
      .append('rect')
      .merge(cells)
      .attr('class', 'cell')
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .style('fill', function(d) {
        return color(d);
      });

    this._cellsEnter
      .transition()
      .delay(function(d, i) {
        return i * 10;
      })
      .attr('x', 0)
      .attr('y', function(d, i) {
        return yScale(i);
      });

    // EXIT cells
    cells.exit().remove();

    // hide the spinner
    $('#spinner').hide();
  }

  /**
   * Add svg buttons to the cell
   * e.g. abstract button
   */
  addButtons() {
    let that = this;
    // add buttons
    const xPos = this._width + margin['left'] + margin['right'] - 28;
    const buttons = this._svg
      .append('g')
      .attr('class', 'gdv-buttons')
      .attr('transform', 'translate(' + xPos + ',0)');

    // unfold button - needed in order to make the cell abstract
    const infoButton =
      'M13.5,4A1.5,1.5 0 0,0 12,5.5A1.5,1.5 0 0,0 13.5,7A1.5,1.5 0 0,0 15,5.5A1.5,1.5 0 0,0 13.5,4M13.14,8.77C11.95,8.87 8.7,11.46 8.7,11.46C8.5,11.61 8.56,11.6 8.72,11.88C8.88,12.15 8.86,12.17 9.05,12.04C9.25,11.91 9.58,11.7 10.13,11.36C12.25,10 10.47,13.14 9.56,18.43C9.2,21.05 11.56,19.7 12.17,19.3C12.77,18.91 14.38,17.8 14.54,17.69C14.76,17.54 14.6,17.42 14.43,17.17C14.31,17 14.19,17.12 14.19,17.12C13.54,17.55 12.35,18.45 12.19,17.88C12,17.31 13.22,13.4 13.89,10.71C14,10.07 14.3,8.67 13.14,8.77Z';
    const infoGroup = buttons
      .append('g')
      .attr('class', 'gdv-button')
      .on('mouseover', function(event) {
        // show tooltip
        let xPosition = event.pageX - 300;
        let yPosition = event.pageY;

        const tooltip = d3
          .select('#tooltip')
          .style('left', xPosition + 'px')
          .style('top', yPosition + 'px')
          .classed('hide', false);

        tooltip.select('#meta-date').classed('hide', true);
        tooltip.select('#table-motifs').classed('hide', true);

        // tooltip text stuff
        let tooltipText = '';
        for (const [key, value] of Object.entries(that._meta_data)) {
          tooltipText = tooltipText + key + ': ' + value + ' <br /> ';
        }
        tooltip.select('#meta').html(tooltipText);
      })
      .on('mouseout', function() {
        // hide tooltip
        const tooltip = d3.select('#tooltip').classed('hide', true);
        tooltip.select('#meta-date').classed('hide', false);
        tooltip.select('#table-motifs').classed('hide', false);
      });

    infoGroup
      .append('rect')
      .attr('class', 'button-rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 24)
      .attr('height', 24);

    infoGroup
      .append('path')
      .attr('class', 'unfold-icon')
      .attr('d', infoButton);

    const removeButton =
      'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';

    const removeGroup = buttons
      .append('g')
      .attr('class', 'gdv-button')
      .attr('transform', 'translate(0,24)')
      .on('click', function() {
        removeGDV(that._idx);
      });

    removeGroup
      .append('rect')
      .attr('class', 'button-rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 24)
      .attr('height', 24);

    removeGroup
      .append('path')
      .attr('class', 'remove-icon')
      .attr('d', removeButton);
  }

  /**
   * SETTER AND GETTER
   */

  /**
   * Set the data
   */
  set data(data) {
    this._data = data['gdv'];
    this._order_x = data['ordering'];
    this._order_y = data['y_ordering'];
    this._clusterIdx = data['cluster_idx'];
    this._node_names = data['node_names'];
  }
}
