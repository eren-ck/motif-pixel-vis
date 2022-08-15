# -*- coding: utf-8 -*-
"""
API - for querying the data 
"""

# Author: Eren Cakmak <eren.cakmak@uni-konstanz.de>
#
# License: MIT

import logging

from flask import Blueprint, jsonify, request
import networkx as nx
from networkx.readwrite import json_graph
import json
import numpy as np

import data

backend_api = Blueprint('api', __name__)

logger = logging.getLogger(__name__)


@backend_api.route("/load_dataset/<path>", methods=['POST'])
def load_dataset(path=None):
    """Load and return the embeddings of the new dataset
    """
    if not path:
        return jsonify({})

    data.load_data(path)

    return jsonify({})


@backend_api.route("/get_motif_sp")
def get_motif_sp():
    """Load the motifs sp of the loaded data
    """
    xAxis = request.args.get('x')
    yAxis = request.args.get('y')
    cluster_bool = request.args.get('cluster') == 'true'

    # if empty return null
    if not data.motif_sp:
        return jsonify({})

    result = data.get_motifs(xAxis, yAxis, cluster_bool)

    return jsonify(result)


@backend_api.route("/get_graph_meta/<int:id>")
def get_graph_meta(id=None):
    """Return the metadata of one graph for the tooltip
    """
    if not id:
        return jsonify({})

    result = data.get_graph_meta(id)

    return jsonify(result)


@backend_api.route("/get_gdv")
def get_gdv():
    """ Get the graphlet degree vector for a certain network
    """
    idx = int(request.args.get('idx'))
    xAxis = request.args.get('x')
    yAxis = request.args.get('y')
    cluster_bool = request.args.get('cluster') == 'true'

    if not idx:
        return jsonify({})

    result = data.get_gdv(idx, xAxis, yAxis, cluster_bool)

    return jsonify(result)


@backend_api.route("/get_graph_data")
def get_graph_data():
    """Return graph data for the graph vis 
    """
    idx = int(request.args.get('idx'))
    if not idx:
        return jsonify({})

    node_id = int(request.args.get('nodeId'))
    cluster_id = int(request.args.get('clusterIdx'))

    G = data.get_graph_data(idx, node_id, cluster_id)

    if (G):
        return json_graph.node_link_data(G)
    return {}