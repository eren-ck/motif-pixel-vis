# -*- coding: utf-8 -*-
"""
model - the multiscale temporal aggregation implementation with the hierarchy
"""

# Author: Eren Cakmak <eren.cakmak@uni-konstanz.de>
#
# License: MIT

import pickle
import networkx as nx
import numpy as np
import hdbscan
import orca
from sklearn.metrics.pairwise import pairwise_distances
from scipy.spatial.distance import pdist, squareform
from fa2 import ForceAtlas2
from networkx.algorithms.community import greedy_modularity_communities

graphs = None
motif_sp = None
motifs = None


def load_data(file_path):
    """Load the graph data and motif significance profiles.

        Keyword arguments:
        file_path -- path to the file
    """
    global graphs
    global motif_sp
    global motifs

    file_path = 'data/' + file_path

    with open(file_path, 'rb') as f:
        data = pickle.load(f)

    graphs = data['graphs']
    motif_sp = data['motif_sp']
    motifs = data['motifs']

    print('Data loading done.')


def get_motifs(x, y, cluster_bool):
    """ Returns the motifs SP with ordering and motifs etc.

        Keyword arguments:
        x -- string sorting for the x-axis
        y -- string sorting for the y-axis
        cluster_bool -- boolean if the axis are clustered
    """
    ordering = list(range(len(motif_sp)))
    sp_arr = np.array(motif_sp)
    cluster_idx = []  # required for the grey bounding boxes

    # reorder the y-axis
    y_ordering = list(range(len(motifs)))

    if y == 'mean':
        # motif_sp_tmp = a[:, np.mean(a, axis=0).argsort()].tolist()
        y_ordering = np.mean(sp_arr, axis=0).argsort()
    elif y == 'median':
        y_ordering = np.median(sp_arr, axis=0).argsort()
    elif y == 'min':
        y_ordering = np.min(sp_arr, axis=0).argsort()
    elif y == 'max':
        y_ordering = np.max(sp_arr, axis=0).argsort()
    elif y == 'std':
        y_ordering = np.std(sp_arr, axis=0).argsort()
    elif y == 'var':
        y_ordering = np.var(sp_arr, axis=0).argsort()

    sp_arr = sp_arr[:, y_ordering].tolist()
    res_motif = np.array(motifs)[y_ordering].tolist()

    if cluster_bool:
        # distance matrix with the inclusion of time
        time_dist = pairwise_distances(np.arange(len(sp_arr)).reshape(-1, 1),
                                       metric='cosine')
        cos_dist = pdist(np.array(sp_arr)[:, 1:], metric='cosine')

        # filter the euc_dist matrix using the time_dist
        distance_matrix = np.where(cos_dist <= 7, cos_dist, 7)
        distance_matrix = squareform(distance_matrix)

        clusterer = hdbscan.HDBSCAN(metric='precomputed', min_cluster_size=3)
        clusterer.fit(distance_matrix)
        # mapping positions and cluster
        mapping = {
            i: np.where(clusterer.labels_ == i)[0]
            for i in np.unique(clusterer.labels_)
        }

        # Cluster indices reuqired for grey bounding boxes
        tmp_idx = 0
        # iterate the mapping and store the results
        tmp_motifs = []
        tmp_ordering = []
        for key, value in mapping.items():
            for idx in value.tolist():
                tmp_motifs.append(sp_arr[idx])
                tmp_ordering.append(idx)

            cluster_idx.append([tmp_idx, len(tmp_motifs)])
            tmp_idx = len(tmp_motifs)

        sp_arr = tmp_motifs
        ordering = tmp_ordering
    elif x == 'clustering':
        distance_matrix = pairwise_distances(sp_arr, metric='cosine')
        clusterer = hdbscan.HDBSCAN(metric='precomputed', min_cluster_size=3)
        clusterer.fit(distance_matrix)
        # mapping positions and cluster
        mapping = {
            i: np.where(clusterer.labels_ == i)[0]
            for i in np.unique(clusterer.labels_)
        }

        # Cluster indices reuqired for grey bounding boxes
        tmp_idx = 0
        # iterate the mapping and store the results
        tmp_motifs = []
        tmp_ordering = []
        for key, value in mapping.items():
            for idx in value.tolist():
                tmp_motifs.append(sp_arr[idx])
                tmp_ordering.append(idx)

            cluster_idx.append([tmp_idx, len(tmp_motifs)])
            tmp_idx = len(tmp_motifs)

        sp_arr = tmp_motifs
        ordering = tmp_ordering

    elif x == 'density':
        graph_metrics = []
        for G in graphs:
            graph_metrics.append(nx.density(G))
        ordering = np.argsort(graph_metrics).tolist()
        sp_arr = np.array(sp_arr)[ordering].tolist()
    elif x == 'transitivity':
        graph_metrics = []
        for G in graphs:
            graph_metrics.append(nx.transitivity(G))
        ordering = np.argsort(graph_metrics).tolist()
        sp_arr = np.array(sp_arr)[ordering].tolist()
    elif x == 'average_clustering':
        graph_metrics = []
        for G in graphs:
            graph_metrics.append(nx.average_clustering(G))
        ordering = np.argsort(graph_metrics).tolist()
        sp_arr = np.array(sp_arr)[ordering].tolist()
    elif x == 'number_of_nodes':
        graph_metrics = []
        for G in graphs:
            graph_metrics.append(nx.number_of_nodes(G))
        ordering = np.argsort(graph_metrics).tolist()
        sp_arr = np.array(sp_arr)[ordering].tolist()
    elif x == 'number_of_edges':
        graph_metrics = []
        for G in graphs:
            graph_metrics.append(nx.number_of_edges(G))
        ordering = np.argsort(graph_metrics).tolist()
        sp_arr = np.array(sp_arr)[ordering].tolist()
    elif x == 'number_connected_components':
        graph_metrics = []
        for G in graphs:
            graph_metrics.append(nx.number_connected_components(G))
        ordering = np.argsort(graph_metrics).tolist()
        sp_arr = np.array(sp_arr)[ordering].tolist()

    return {
        'motifs': res_motif,
        'motif_sp': sp_arr,
        'ordering': ordering,
        'cluster_idx': cluster_idx
    }


def get_graph_meta(idx):
    """Return meta information about one graph for the tooltip

        Keyword arguments:
        indx -- integer to the graph
    """
    if idx > len(graphs):
        return {}

    G = graphs[idx]

    time_str = G.graph['time'][0]

    return {
        'date': time_str,
        'number_of_nodes': nx.number_of_nodes(G),
        'number_of_edges': nx.number_of_edges(G),
        'density': round(nx.density(G), 4),
        'average_clustering': round(nx.average_clustering(G), 4),
        'transitivity': round(nx.transitivity(G), 4)
    }


def get_gdv(idx, x, y, cluster_bool):
    """Return graphlet degree vector for one graph

        Keyword arguments:
        indx -- integer to the graph
        x -- string sorting for the x-axis
        y -- string sorting for the y-axis
        cluster_bool -- boolean if the axis are clustered
    """
    G = graphs[idx].to_undirected()
    ordering = list(G)
    node_names = dict(G.nodes(data='name', default='NaN'))

    # required relabeling to 0 to n-1 nodes
    G = nx.convert_node_labels_to_integers(G)
    counts = np.array(orca.orbit_counts('node', 5, G))

    # remove empty rows
    # counts = counts[~np.all(counts == 0, axis=1)].tolist()

    cluster_idx = []  # required for the grey bounding boxes
    # reorder the y-axis
    y_ordering = np.array(list(range(73)))

    if y == 'mean':
        # motif_sp_tmp = a[:, np.mean(a, axis=0).argsort()].tolist()
        y_ordering = np.mean(counts, axis=0).argsort()
    elif y == 'median':
        y_ordering = np.median(counts, axis=0).argsort()
    elif y == 'min':
        y_ordering = np.min(counts, axis=0).argsort()
    elif y == 'max':
        y_ordering = np.max(counts, axis=0).argsort()
    elif y == 'std':
        y_ordering = np.std(counts, axis=0).argsort()
    elif y == 'var':
        y_ordering = np.var(counts, axis=0).argsort()

    y_ordering = y_ordering.tolist()
    counts = counts[:, y_ordering].tolist()

    if cluster_bool or x == 'clustering':
        distance_matrix = pairwise_distances(counts, metric='cosine')
        clusterer = hdbscan.HDBSCAN(metric='precomputed', min_cluster_size=3)
        clusterer.fit(distance_matrix)
        # mapping positions and cluster
        mapping = {
            i: np.where(clusterer.labels_ == i)[0]
            for i in np.unique(clusterer.labels_)
        }

        # Cluster indices reuqired for grey bounding boxes
        tmp_idx = 0
        # iterate the mapping and store the results
        tmp = []
        tmp_ordering = []
        for key, value in mapping.items():
            for idx in value.tolist():
                tmp.append(counts[idx])
                tmp_ordering.append(ordering[idx])

            cluster_idx.append([tmp_idx, len(tmp)])
            tmp_idx = len(tmp)

        counts = tmp
        ordering = tmp_ordering
    elif x == 'degree':
        node_metrics = [val for (node, val) in G.degree()]
        tmp_ordering = np.argsort(node_metrics).tolist()
        ordering = np.array(ordering)[tmp_ordering].tolist()
        counts = np.array(counts)[tmp_ordering].tolist()
    elif x == 'pagerank':
        node_metrics = list(nx.pagerank(G).values())
        tmp_ordering = np.argsort(node_metrics).tolist()
        ordering = np.array(ordering)[tmp_ordering].tolist()
        counts = np.array(counts)[tmp_ordering].tolist()
    elif x == 'degree_centrality':
        node_metrics = list(nx.degree_centrality(G).values())
        tmp_ordering = np.argsort(node_metrics).tolist()
        ordering = np.array(ordering)[tmp_ordering].tolist()
        counts = np.array(counts)[tmp_ordering].tolist()
    elif x == 'closeness_centrality':
        node_metrics = list(nx.closeness_centrality(G).values())
        tmp_ordering = np.argsort(node_metrics).tolist()
        ordering = np.array(ordering)[tmp_ordering].tolist()
        counts = np.array(counts)[tmp_ordering].tolist()

    return {
        'gdv': counts,
        'ordering': ordering,
        'y_ordering': y_ordering,
        'cluster_idx': cluster_idx,
        'date': G.graph['time'][0],
        'number_of_nodes': nx.number_of_nodes(G),
        'number_of_edges': nx.number_of_edges(G),
        'node_names': node_names
    }


def get_graph_data(idx, node_id, cluster_id):
    """Return graph of the position idx

        Keyword arguments:
        indx -- integer to the graph
        node_id -- node id of the node which should be highlighted
        cluster_id -- indices of cluster
    """
    G = graphs[idx].to_undirected()
    G.graph['time'] = G.graph['time'][0]

    # color selected node differently
    if node_id >= 0:
        G.nodes[node_id]['center'] = 1

        hops = nx.single_source_shortest_path_length(G, node_id, cutoff=5)
        H = G.subgraph(hops.keys())

        nx.set_node_attributes(H, 1, 'highlight')
        nx.set_edge_attributes(H, 1, 'highlight')
        G.add_nodes_from(H)
        G.add_edges_from(H.edges)

    if cluster_id >= 0 and len(G.nodes) > 100:
        # check if in len
        if cluster_id >= len(G.nodes):
            cluster_id = len(G.nodes) - 1

        # H will be the new graph with meta nodes
        H = nx.Graph()
        H.graph = G.graph
        # coompute
        partition = greedy_modularity_communities(G)
        partition = sorted(map(sorted, partition), key=len, reverse=True)

        # search for the cluster that contains the node
        if node_id >= 0:
            cluster_id = [
                partition.index(row) for row in partition if node_id in row
            ][0]
            # print('cluster_id ', cluster_id)

        G = G.subgraph(partition[cluster_id])

    return G
