/* global d3, $ */

/**
 * The graph view as a JS class
 * @author Eren Cakmak eren.cakmak@uni-konstanz.de
 */

const margin = { top: 0, right: 40, bottom: 0, left: 0 };

/**
 * Class for the graph based visualization. Show graph structure
 */
export class GraphVis {
  /**
   * Constructor for the level class
   * @param {svg} g svg group to add the network vis
   * @param {Array} data array of embeddings
   */
  constructor(g, data) {
    this._svg = g;
    this._data = data;

    // get width and height of svg
    const floatValues = /[+-]?([0-9]*[.])?[0-9]+/;
    this._height =
      +this._svg.style('height').match(floatValues)[0] * 0.9 -
      margin['bottom'] -
      margin['top'];
    this._width =
      +this._svg.style('width').match(floatValues)[0] -
      margin['left'] -
      margin['right'];

    // init stuff like legend and stuff
    this._clip = this._svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'clip-graph')
      .append('rect')
      .attr('x', margin['left'])
      .attr('y', margin['top'])
      .attr('width', this._width)
      .attr('height', this._height);

    const filter = this._svg
      .append('defs')
      .append('filter')
      .attr('id', 'svg-text-background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 1)
      .attr('height', 1);
    filter.append('feFlood').attr('flood-color', 'white');
    filter.append('feComposite').attr('in', 'SourceGraphic');

    this._g = this._svg
      .append('g')
      .attr('class', 'zoom-group')
      .attr('clip-path', 'url(#clip-graph)');

    this._g
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this._width)
      .attr('height', this._height)
      .attr('id', 'graph-background');

    this.draw();
  }

  /**
   * Draw the graph
   */
  draw() {
    let that = this;

    // required for link positioning
    // as the links do not have the coordinates of ndoes
    let positions = {};
    this._data['nodes'].forEach(function (d) {
      positions[d['id']] = d['coord'];
    });

    const marginZoom = 10;
    // define the zoom function for the static graph
    // define the zoom for the group
    const zoom = d3
      .zoom()
      .scaleExtent([1, 20])
      .translateExtent([
        [0, 0],
        [this._width, this._height],
      ])
      .extent([
        [0, 0],
        [this._width, this._height],
      ])
      .on('zoom', function (event) {
        zoomXScale = event.transform.rescaleX(xScale);
        zoomYScale = event.transform.rescaleY(yScale);

        nodesEnter
          .attr('cx', function (d) {
            return zoomXScale(d['coord'][0]);
          })
          .attr('cy', function (d) {
            return zoomYScale(d['coord'][1]);
          });
        linksEnter
          .attr('x1', function (d) {
            return zoomXScale(positions[d['source']][0]);
          })
          .attr('y1', function (d) {
            return zoomYScale(positions[d['source']][1]);
          })
          .attr('x2', function (d) {
            return zoomXScale(positions[d['target']][0]);
          })
          .attr('y2', function (d) {
            return zoomYScale(positions[d['target']][1]);
          });
      });

    this._g.select('#graph-background').call(zoom);

    // get min max of the positions
    // define the scales
    const xScale = d3
      .scaleLinear()
      .domain(
        d3.extent(this._data['nodes'], function (d) {
          return d['coord'][0];
        })
      )
      .range([marginZoom, this._width - marginZoom]);

    const yScale = d3
      .scaleLinear()
      .domain(
        d3.extent(this._data['nodes'], function (d) {
          return d['coord'][1];
        })
      )
      .range([marginZoom, this._height - marginZoom]);

    let zoomXScale = xScale;
    let zoomYScale = yScale;

    // append the links
    // JOIN - group for the links
    const linksGroup = this._g.selectAll('.links').data([this._data['links']]);
    // ENTER MERGE the links group
    const linksGroupEnter = linksGroup
      .enter()
      .append('g')
      .merge(linksGroup)
      .attr('class', 'links');
    // EXIT the links group
    linksGroup.exit().remove();

    // append the nodes
    const nodesGroup = this._g.selectAll('.nodes').data([this._data['nodes']]);
    // ENTER MERGE the nodes group
    const nodesGroupEnter = nodesGroup
      .enter()
      .append('g')
      .merge(nodesGroup)
      .attr('class', 'nodes');
    // EXIT the nodes group
    nodesGroup.exit().remove();

    // JOIN the nodes with the data
    const nodes = nodesGroupEnter.selectAll('circle').data(function (d) {
      return d;
    });

    // ENTER MERGE the nodes
    const nodesEnter = nodes
      .enter()
      .append('circle')
      .merge(nodes)
      .attr('class', function (d) {
        let tmpClass = 'highlight' in d ? 'highlight' : '';
        tmpClass = 'center' in d ? tmpClass + ' center' : tmpClass;
        return 'node ' + tmpClass + ' node-' + d['id'];
      })
      .attr('r', 5)
      .attr('stroke', '#202020')
      .attr('stroke-width', '2px')
      .attr('cx', function (d) {
        return zoomXScale(d['coord'][0]);
      })
      .attr('cy', function (d) {
        return zoomYScale(d['coord'][1]);
      })
      .on('mouseover', nodeMouseOver)
      .on('mouseout', nodeMouseOut)
      .call(
        d3
          .drag()
          .on('start', function () {
            d3.select(this).classed('fixed', true);
          })
          .on('drag', function (event, d) {
            d3.select(this).attr('cx', event.x).attr('cy', event.y);

            linksGroupEnter
              .selectAll('.link.link-' + d['id'])
              .each(function (l) {
                if (l['source'] === d['id']) {
                  d3.select(this).attr('x1', event.x).attr('y1', event.y);
                } else {
                  d3.select(this).attr('x2', event.x).attr('y2', event.y);
                }
              });
          })
          .on('end', function (event, d) {
            d3.select(this).classed('fixed', false);
            // update node positions and links mapping
            d['coord'] = [
              zoomXScale.invert(event.x),
              zoomYScale.invert(event.y),
            ];
            positions[d['id']] = d['coord'];
          })
      );

    // EXIT nodes
    nodes.exit().remove();

    // JOIN the links with the data
    const links = linksGroupEnter.selectAll('line').data(function (d) {
      return d;
    });

    // ENTER MERGE the links
    const linksEnter = links
      .enter()
      .append('line')
      .merge(links)
      .attr('class', function (d) {
        let tmpClass = 'highlight' in d ? 'highlight' : '';
        return (
          'link ' + tmpClass + ' link-' + d['source'] + ' link-' + d['target']
        );
      })
      .attr('x1', function (d) {
        return zoomXScale(positions[d['source']][0]);
      })
      .attr('y1', function (d) {
        return zoomYScale(positions[d['source']][1]);
      })
      .attr('x2', function (d) {
        return zoomXScale(positions[d['target']][0]);
      })
      .attr('y2', function (d) {
        return zoomYScale(positions[d['target']][1]);
      })
      .on('mouseover', edgeMouseOver)
      .on('mouseout', edgeMouseOut);
    // EXIT links
    links.exit().remove();

    /**
     * Mouse over a node in the graph
     * @param {Object} d node
     */
    function nodeMouseOver(event, d) {
      const tooltipShift = 25;
      // fade all other nodes and links
      d3.selectAll('.node').classed('faded', true);
      d3.selectAll('.link').classed('faded', true);

      // highlight and add label
      d3.selectAll('.node.node-' + d['id'])
        .classed('hovered', true)
        .classed('faded', false)
        .transition()
        .duration(500)
        .attr('r', 10);

      // get links and highlight links and nodes
      d3.selectAll('.link.link-' + d['id']).each(function (l) {
        // for each link highlight the link and source and target node
        d3.select(this).classed('highlighted', true);
        if (l['source'] === d['id']) {
          d3.selectAll('.node.node-' + l['target']).classed(
            'highlighted',
            true
          );
          // add text boxes to the linked nodes
          const node = that._g.select('.node.node-' + l['target']);
          node
            .select(function () {
              return this.parentNode;
            })
            .append('text')
            .text(function (d2) {
              return 'name' in d2 ? d2['name'] : d2['id'];
            })
            .style('font-size', '1em')
            .attr('x', function (d2) {
              return xScale(d2['coord'][0]) + -tooltipShift;
            })
            .attr('y', function (d2) {
              return zoomYScale(d2['coord'][1]) + -tooltipShift;
            });
        } else {
          d3.selectAll('.node.node-' + l['source']).classed(
            'highlighted',
            true
          );
          // add text boxes to the linked nodes
          const node = that._g.select('.node.node-' + l['source']);
          node
            .select(function () {
              return this.parentNode;
            })
            .append('text')
            .style('font-size', '1em')
            .text(function (d2) {
              return 'name' in d2 ? d2['name'] : d2['id'];
            })
            .attr('x', function (d2) {
              return zoomXScale(d2['coord'][0]) + tooltipShift;
            })
            .attr('y', function (d2) {
              return yScale(d2['coord'][1]) + tooltipShift;
            });
        }
      });

      // add text tooltip
      d3.select(this.parentNode)
        .append('text')
        .attr('dy', '.35em')
        .text('name' in d ? d['name'] : d['id'])
        .attr('x', zoomXScale(d['coord'][0]) + tooltipShift / 2)
        .attr('y', zoomYScale(d['coord'][1]) + tooltipShift / 2);
    }

    /**
     * Mouse out over a node in the graph
     * @param {Object} d node
     */
    function nodeMouseOut(event, d) {
      // fade in all other nodes and links
      d3.selectAll('.node')
        .classed('faded', false)
        .classed('highlighted', false);
      d3.selectAll('.link')
        .classed('faded', false)
        .classed('highlighted', false);

      // remove highlight and remove label
      d3.selectAll('.node.node-' + d['id'])
        .classed('hovered', false)
        .transition()
        .duration(500)
        .attr('r', 5);

      // remove text tooltip
      d3.select(this.parentNode).selectAll('text').remove();
    }

    /**
     * Mouse over a edge in the graph
     * @param {Object} d edge
     */
    function edgeMouseOver(event, d) {
      const tooltipShift = 25;
      // fade all other nodes and links
      d3.selectAll('.node').classed('faded', true);
      d3.selectAll('.link').classed('faded', true);

      // highlight and add label to all links between the two labels
      d3.selectAll(
        '.link.link-' + d['source'] + '.link-' + d['target']
      ).classed('faded', false);

      // add text tooltip
      const tpX = zoomXScale(
        (positions[d['source']][0] + positions[d['target']][0]) / 2
      );
      const tpY = zoomYScale(
        (positions[d['source']][1] + positions[d['target']][1]) / 2
      );
      const text =
        'sentiment' in d
          ? d['sentiment'] == 1
            ? d['time'] + '- Positive'
            : d['time'] + '- Negative'
          : d['time'];
      d3.select(this.parentNode)
        .append('text')
        .attr('dy', '.35em')
        .text(text)
        .attr('x', tpX + tooltipShift)
        .attr('y', tpY + tooltipShift);

      // highlight nodes
      d3.selectAll('.node.node-' + d['source'])
        .classed('hovered', true)
        .classed('faded', false)
        .transition()
        .duration(300)
        .attr('r', 10);
      d3.selectAll('.node.node-' + d['target'])
        .classed('hovered', true)
        .classed('faded', false)
        .transition()
        .duration(300)
        .attr('r', 10);
      // append two texts
      let node = that._g.select('.node.node-' + d['source']);
      node
        .select(function () {
          return this.parentNode;
        })
        .append('text')
        .style('font-size', '1em')
        .text(function (d2) {
          return 'name' in d2 ? d2['name'] : d2['id'];
        })
        .attr('x', function (d2) {
          return zoomXScale(d2['coord'][0]) - tooltipShift;
        })
        .attr('y', function (d2) {
          return zoomYScale(d2['coord'][1]) - tooltipShift;
        });
      node = that._g.select('.node.node-' + d['target']);
      node
        .select(function () {
          return this.parentNode;
        })
        .append('text')
        .style('font-size', '1em')
        .text(function (d2) {
          return 'name' in d2 ? d2['name'] : d2['id'];
        })
        .attr('x', function (d2) {
          return zoomXScale(d2['coord'][0]) + tooltipShift;
        })
        .attr('y', function (d2) {
          return zoomYScale(d2['coord'][1]) + tooltipShift;
        });
    }
    /**
     * Mouse out over a edge in the graph
     * @param {Object} d edge
     */
    function edgeMouseOut(event, d) {
      d3.selectAll('.node')
        .classed('faded', false)
        .classed('highlighted', false);
      d3.selectAll('.link')
        .classed('faded', false)
        .classed('highlighted', false);

      d3.selectAll('.node.node-' + d['source'])
        .classed('hovered', false)
        .transition()
        .duration(300)
        .attr('r', 5);

      d3.selectAll('.node.node-' + d['target'])
        .classed('hovered', false)
        .transition()
        .duration(300)
        .attr('r', 5);

      // remove text tooltip
      d3.select(this.parentNode).selectAll('text').remove();
      // remove text tooltip
      d3.select('.nodes').selectAll('text').remove();
    }
    $('#spinner-graph-vis').hide();
  }
}
