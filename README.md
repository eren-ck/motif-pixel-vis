# Motif-Based Visual Analysis of Dynamic Networks

<p align="justify">
Many data analysis problems rely on dynamic networks, such as social or communication network analyses. Providing a scalable overview of long sequences of such dynamic networks remains challenging due to the underlying large-scale data containing elusive topological changes. We propose two complementary pixel-based visualizations, which reflect occurrences of selected sub-networks (motifs) and provide a time-scalable overview of dynamic networks: a network-level census (motif significance profiles) linked with a node-level sub-network metric (graphlet degree vectors) views to reveal structural changes, trends, states, and outliers. The network census captures significantly occurring motifs compared to their expected occurrences in random networks and exposes structural changes in a dynamic network. The sub-network metrics display the local topological neighborhood of a node in a single network belonging to the dynamic network. The linked pixel-based visualizations allow exploring motifs in different-sized networks to analyze the changing structures within and across dynamic networks, for instance, to visually analyze the shape and rate of changes in the network topology. We describe the identification of visual patterns, also considering different reordering strategies to emphasize visual patterns. We demonstrate the approach's usefulness by a use case analysis based on real-world large-scale dynamic networks, such as the evolving social networks of Reddit or Facebook.
</p>


_This repository provides a Python/Javascript implementation of prototype as described in the paper:_

```bibtex
@inproceedings{Cakmak2022Motif,
  author = {Cakmak, Eren and Fuchs, Johannes and Jäckle, Dominik and Schreck, Tobias and Brandes, Ulrik and Keim, Daniel A.},
  booktitle = {Visualization in Data Science (VDS) (to appear)},
  month = {10},
  publisher = {IEEE},
  title = {Motif-Based Visual Analysis of Dynamic Networks},
  year = {2022}
}
```

---

### How to locally run the prototype

1. Install Python requirements

```bash
pip install -r requirements.txt
```

2. Run ```app.py``` with Pyhton e.g.,

```bash
python3 app.py
```

3. Access the prototype implementation in the web browser

```url
http://127.0.0.1:8000/
```

---

### How to locally develop the prototype

First, install the `node.js` modules and run wepack. Move the to the `/frontend` directory and run the following commands while working on the frontend:

```bash
npm install
npm run watch
```

---

### Datasets and dependencies

The following real-world dataset is currently used in the prototype [Reddit Hyperlink Network](https://snap.stanford.edu/data/soc-RedditHyperlinks.html). The prototype utilizes the following wrapper to compute the graphlet degree vectors [PyORCA](https://github.com/qema/orca-py) library.

---

## License
Released under GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
