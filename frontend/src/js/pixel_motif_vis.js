/* global d3, $ */

/**
 * Pixel visualization for motif significance profiles as a JS class
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

import { getGraphMeta } from './data.js';
import { addGDV, addGraphVis, pixelClusterBool } from './app.js';

const margin = { top: 0, right: 30, bottom: 10, left: 30 };

const unfoldMore =
  'M18.17,12L15,8.83L16.41,7.41L21,12L16.41,16.58L15,15.17L18.17,12M5.83,12L9,15.17L7.59,16.59L3,12L7.59,7.42L9,8.83L5.83,12Z'; // 24 x 24

/**
 * Class for the pixel based visualization
 */
export class PixelMotifVis {
  /**
   * Constructor for the level class
   * @param {svg} g svg group to add the pixel vis
   * @param {Number} width width of the group element
   * @param {Number} height height of the group element
   * @param {Array} data motif sp and motifs
   */
  constructor(g, width, height, data) {
    this._svg = g;
    this._width = width - margin['right'] - margin['left'];
    this._height = height - margin['top'] - margin['bottom'];
    this._data = data['motif_sp'];
    this._motifs = data['motifs'];
    this._order = data['ordering'];
    this._clusterIdx = data['cluster_idx'];
    this._clusterIdxAbstracted = {};

    // add a group for the motifs pics on the y-axis
    this._gYAxis = this._svg.append('g').attr('class', 'motifs-y-axis');

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
      .attr('class', 'pixel-vis')
      .attr(
        'transform',
        'translate(' + margin['left'] + ', ' + margin['top'] + ')'
      );

    this._gCluster = this._g.append('g').attr('class', 'motif-pixel-cluster');
  }

  /**
   * Draw the pixel based visualization
   */
  draw() {
    const that = this;

    var timer; // needed for mouseover time out

    // zoom for the group
    const color = d3
      .scaleLinear()
      .domain([-1, 0, 1])
      .range(['#67001f', '#f7f7f7', '#053061']);

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

    if (pixelClusterBool && this._clusterIdx.length) {
      // cluster the pixel blocks
      let abstractMotifSP = []; // tmp data storage for the motifs
      let abstractOrdering = []; // tmp data ordering with abstracted data
      let abstractClusterIdx = []; // needed for the cluster rects
      let tmpLength = 0;

      for (let i = 0; i < this._clusterIdx.length; i++) {
        let clusterBars = []; // result of all pixel bars in that cluster
        let clusterOrder = []; // result of all pixel bars in that cluster
        // get size of each cluster
        const idx0 = this._clusterIdx[i][0];
        const idx1 = this._clusterIdx[i][1];
        const clusterSize = idx1 - idx0;

        if (clusterSize > 9) {
          // check if not already abstracted
          if (
            this._clusterIdxAbstracted[i] === undefined ||
            this._clusterIdxAbstracted[i]
          ) {
            this._clusterIdxAbstracted[i] = true;
            // data of pixels
            clusterBars = clusterBars.concat(this._data.slice(idx0, idx0 + 3));
            clusterBars = clusterBars.concat(
              Array(3)
                .fill()
                .map(() => Array(0).fill(0))
            );
            clusterBars = clusterBars.concat(this._data.slice(idx1 - 3, idx1));

            // orderings
            clusterOrder = clusterOrder.concat(
              this._order.slice(idx0, idx0 + 3)
            );
            clusterOrder = clusterOrder.concat(Array(3).fill(-1));
            clusterOrder = clusterOrder.concat(
              this._order.slice(idx1 - 3, idx1)
            );

            // append indices for cluster rects
            abstractClusterIdx.push([tmpLength, tmpLength + 9]);
            tmpLength = tmpLength + 9;
          } else {
            clusterBars = clusterBars.concat(this._data.slice(idx0, idx1));
            clusterOrder = clusterOrder.concat(this._order.slice(idx0, idx1));

            // append indices for cluster rects
            abstractClusterIdx.push([tmpLength, tmpLength + clusterSize]);
            tmpLength = tmpLength + clusterSize;
          }
        } else {
          clusterBars = clusterBars.concat(this._data.slice(idx0, idx1));
          clusterOrder = clusterOrder.concat(this._order.slice(idx0, idx1));

          // append indices for cluster rects
          abstractClusterIdx.push([tmpLength, tmpLength + clusterSize]);
          tmpLength = tmpLength + clusterSize;
        }
        abstractMotifSP = abstractMotifSP.concat(clusterBars);
        abstractOrdering = abstractOrdering.concat(clusterOrder);
      }

      // adjust the scales required
      rectWidth =
        Math.floor(this._width / abstractMotifSP.length) > 0
          ? Math.floor(this._width / abstractMotifSP.length)
          : 1;
      xScale.domain([0, abstractMotifSP.length]);

      const clusterRect = this._gCluster
        .selectAll('.cluster-rect')
        .data(abstractClusterIdx);

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
      const colGroups = this._g.selectAll('.col-g').data(abstractMotifSP);

      this._colGroupsEnter = colGroups
        .enter()
        .append('g')
        .merge(colGroups)
        .attr('class', 'col-g')
        .attr('id', function(d, i) {
          return 'col-g-motif-' + abstractOrdering[i];
        })
        .on('mouseover', function(event, d) {
          // show tooltip
          const i = that._colGroupsEnter.nodes().indexOf(this);
          if (abstractOrdering[i] === -1) {
            return;
          }

          let xPosition =
            event.pageX + 300 < that._width
              ? event.pageX + 20
              : event.pageX - 500;
          let yPosition = event.pageY - 20;

          const tooltip = d3
            .select('#tooltip')
            .style('left', xPosition + 'px')
            .style('top', yPosition + 'px')
            .classed('hide', false);

          // const tooltipShift = 25;
          const promise = getGraphMeta(abstractOrdering[i]);
          promise.then(function(graphData) {
            // get meta data from backend and display
            // first date header
            tooltip.select('#meta-date').html(graphData['date']);
            delete graphData['date'];

            // tooltip text stuff
            let tooltipText = '';
            for (const [key, value] of Object.entries(graphData)) {
              tooltipText = tooltipText + key + ': ' + value + ' <br /> ';
            }

            tooltip.select('#meta').html(tooltipText);
          });

          // tooltip motifs images
          tooltip
            .select('#table-motifs')
            .selectAll('*')
            .remove(); // remove old table

          const header = tooltip.select('#table-motifs').append('tr');
          header
            .selectAll('th')
            .data(that._motifs)
            .enter()
            .append('th')
            .append('img')
            .attr('class', 'motif-img')
            .attr('width', 20)
            .attr('height', 20)
            .attr('src', function(d) {
              return '/static/motifs/' + d + '.png';
            });

          tooltip
            .select('#table-motifs')
            .append('tr')
            .selectAll('th')
            .data(d)
            .enter()
            .append('th')
            .attr('class', 'table-text')
            .html(function(d) {
              return d.toFixed(2);
            });

          $('#spinner-graph-vis').show();
          timer = setTimeout(function() {
            // on click highlight all nodes with that
            addGraphVis(abstractOrdering[i]);
          }, 1000);
        })
        .on('mouseout', function() {
          // hide tooltip
          d3.select('#tooltip').classed('hide', true);
          clearTimeout(timer);
          $('#spinner-graph-vis').hide();
        })
        .on('click', function() {
          const i = that._colGroupsEnter.nodes().indexOf(this);
          if (abstractOrdering[i] === -1) {
            return;
          }
          d3.select(this).classed('selected', true);
          addGDV(abstractOrdering[i]);
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

      // append unfold buttons
      let buttonData = abstractOrdering.reduce(
        (a, e, i) => (e === -1 ? a.concat(i) : a),
        []
      );
      buttonData.shift();
      buttonData = buttonData.filter(function(v, i) {
        return i % 3 == 0;
      });

      const unfoldButtonGroups = this._g
        .selectAll('.unfold-button-group')
        .data(buttonData);

      // ENTER add groups
      const unfoldButtonEnter = unfoldButtonGroups
        .enter()
        .append('g')
        .merge(unfoldButtonGroups)
        .attr('class', 'unfold-button-group')
        .on('click', function(event, d) {
          // get the cluster idx
          for (let i = 0; i < abstractClusterIdx.length; i++) {
            if (
              abstractClusterIdx[i][0] <= d &&
              d <= abstractClusterIdx[i][1]
            ) {
              that._clusterIdxAbstracted[i] = !that._clusterIdxAbstracted[i];
              that.draw();
            }
          }
        });

      unfoldButtonEnter
        .transition()
        .delay(function(d, i) {
          return i * 10;
        })
        .attr('transform', function(d) {
          const x = xScale(d) - xScale(1);
          return 'translate(' + x + ',0)';
        });

      // EXIT the groups
      unfoldButtonGroups.exit().remove();

      // SELECT
      const buttonRects = unfoldButtonEnter
        .selectAll('.unfold-button-rect')
        .data(function(d) {
          return [d];
        });

      buttonRects
        .enter()
        .append('rect')
        .merge(buttonRects)
        .attr('class', 'unfold-button-rect')
        .attr('width', 3 * rectWidth)
        .attr('height', rectHeight * this._motifs.length + 5);

      // EXIT buttons rect
      buttonRects.exit().remove();

      // SELECT
      const buttonIcon = unfoldButtonEnter
        .selectAll('.unfold-button-icon')
        .data(function(d) {
          return [d];
        });

      buttonIcon
        .enter()
        .append('path')
        .merge(buttonIcon)
        .attr('class', 'unfold-button-icon')
        .attr('transform', function() {
          const s = (3 * rectWidth) / 24;
          return 'translate(0,' + that._height / 2 + ') scale(' + s + ')';
        })
        .attr('d', unfoldMore);

      // EXIT cells
      buttonIcon.exit().remove();
    } else {
      // remove buttons
      this._g.selectAll('.unfold-button-group').remove();
      // no clustering of the pixel blocks
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
        .attr('class', 'col-g')
        .attr('id', function(d, i) {
          return 'col-g-motif-' + that._order[i];
        })
        .on('mouseover', function(event, d) {
          // show tooltip
          const i = that._colGroupsEnter.nodes().indexOf(this);

          let xPosition =
            event.pageX + 300 < that._width
              ? event.pageX + 20
              : event.pageX - 500;
          let yPosition = event.pageY - 20;

          const tooltip = d3
            .select('#tooltip')
            .style('left', xPosition + 'px')
            .style('top', yPosition + 'px')
            .classed('hide', false);

          // const tooltipShift = 25;
          const promise = getGraphMeta(that._order[i]);
          promise.then(function(graphData) {
            // get meta data from backend and display
            // first date header
            tooltip.select('#meta-date').html(graphData['date']);
            delete graphData['date'];

            // tooltip text stuff
            let tooltipText = '';
            for (const [key, value] of Object.entries(graphData)) {
              tooltipText = tooltipText + key + ': ' + value + ' <br /> ';
            }

            tooltip.select('#meta').html(tooltipText);
          });

          // tooltip motifs images
          tooltip
            .select('#table-motifs')
            .selectAll('*')
            .remove(); // remove old table

          const header = tooltip.select('#table-motifs').append('tr');
          header
            .selectAll('th')
            .data(that._motifs)
            .enter()
            .append('th')
            .append('img')
            .attr('class', 'motif-img')
            .attr('width', 20)
            .attr('height', 20)
            .attr('src', function(d) {
              return '/static/motifs/' + d + '.png';
            });

          tooltip
            .select('#table-motifs')
            .append('tr')
            .selectAll('th')
            .data(d)
            .enter()
            .append('th')
            .attr('class', 'table-text')
            .html(function(d) {
              return d.toFixed(2);
            });

          $('#spinner-graph-vis').show();
          timer = setTimeout(function() {
            // on click highlight all nodes with that
            addGraphVis(that._order[i]);
          }, 1000);
        })
        .on('mouseout', function() {
          // hide tooltip
          d3.select('#tooltip').classed('hide', true);
          clearTimeout(timer);
          $('#spinner-graph-vis').hide();
        })
        .on('click', function() {
          const i = that._colGroupsEnter.nodes().indexOf(this);
          d3.select(this).classed('selected', true);
          addGDV(that._order[i]);
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
    }

    this.updateAxis();

    // hide the spinner
    $('#spinner').hide();
  }

  /**
   * Update the y and x axis labels
   */
  updateAxis() {
    let imageHeight =
      Math.floor(this._height / this._motifs.length) > 0
        ? Math.floor(this._height / this._motifs.length)
        : 1;

    const yScale = d3
      .scaleLinear()
      .domain([0, this._motifs.length])
      .range([0, this._height]);

    const moitfs = this._gYAxis.selectAll('.motif-img').data(this._motifs);

    // ENTER add rects
    const motifsEnter = moitfs
      .enter()
      .append('svg:image')
      .merge(moitfs)
      .attr('class', 'motif-img')
      .attr('x', 5)
      .attr('y', 0)
      .attr('width', imageHeight)
      .attr('height', imageHeight)
      .attr('xlink:href', function(d) {
        return '/static/motifs/' + d + '.png';
      });

    motifsEnter
      .transition()
      .delay(function(d, i) {
        return i * 10;
      })
      .attr('x', 0)
      .attr('y', function(d, i) {
        return yScale(i);
      });

    // EXIT motifs
    moitfs.exit().remove();
  }

  /**
   * SETTER AND GETTER
   */

  /**
   * Set the data
   */
  set data(data) {
    this._data = data['motif_sp'];
    this._motifs = data['motifs'];
    this._order = data['ordering'];
    this._clusterIdx = data['cluster_idx'];
    this._clusterIdxAbstracted = {};
  }
}
