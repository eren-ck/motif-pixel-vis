# The following code was written by Andrew Wang
# Copied from the following repository
# PyORCA: ORCA orbit Counting Python Wrapper
# https://github.com/qema/orca-py
# Copyright 2020 Andrew Wang, Rex Ying
#
# The repo is python wrapper for the following lib:
# https://github.com/thocevar/orca
# GPL-3.0 License

import orcastr
import networkx as nx


def orbit_counts(task, size, graph):
    graph = nx.convert_node_labels_to_integers(graph)
    s = "{} {}\n".format(len(graph), len(graph.edges))
    for u, v in graph.edges:
        if u == v:
            continue
        s += "{} {}\n".format(u, v)
    out = orcastr.motif_counts_str(task, size, s)
    out = [[int(c) for c in s.split(" ")] for s in out.split("\n") if s]
    return out
