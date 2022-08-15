# Motif Pixel Visualization

__TODO: Update Readme with link to paper, abstract, paper figures.__ 

_This repository provides a Python/Javascript implementation of prototype as described in the paper:_

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