#!/usr/bin/env python
# train_mnist.py — train a small MLP digit classifier on MNIST and export the
# weights as base64 float32 to web/public/mnist.json, for the in-browser
# pure-JS recognizer (no runtime ML library, fully offline). ~98% test accuracy.
#
# Run: python tools/train_mnist.py
import os, gzip, struct, base64, json, urllib.request
import numpy as np

CACHE = os.path.join(os.environ.get("TEMP", "/tmp"), "mnist")
os.makedirs(CACHE, exist_ok=True)
BASE = "https://storage.googleapis.com/cvdf-datasets/mnist/"
FILES = {
    "train_x": "train-images-idx3-ubyte.gz",
    "train_y": "train-labels-idx1-ubyte.gz",
    "test_x":  "t10k-images-idx3-ubyte.gz",
    "test_y":  "t10k-labels-idx1-ubyte.gz",
}

def fetch(name):
    path = os.path.join(CACHE, FILES[name])
    if not os.path.exists(path):
        print("downloading", FILES[name])
        urllib.request.urlretrieve(BASE + FILES[name], path)
    return path

def load_images(name):
    with gzip.open(fetch(name), "rb") as f:
        magic, n, rows, cols = struct.unpack(">IIII", f.read(16))
        data = np.frombuffer(f.read(), dtype=np.uint8).reshape(n, rows * cols)
    return data.astype(np.float32) / 255.0

def load_labels(name):
    with gzip.open(fetch(name), "rb") as f:
        magic, n = struct.unpack(">II", f.read(8))
        return np.frombuffer(f.read(), dtype=np.uint8)

Xtr, ytr = load_images("train_x"), load_labels("train_y")
Xte, yte = load_images("test_x"), load_labels("test_y")
print("train", Xtr.shape, "test", Xte.shape)

rng = np.random.default_rng(7)
H = 128
W1 = (rng.standard_normal((784, H)) * np.sqrt(2.0 / 784)).astype(np.float32)
b1 = np.zeros(H, np.float32)
W2 = (rng.standard_normal((H, 10)) * np.sqrt(2.0 / H)).astype(np.float32)
b2 = np.zeros(10, np.float32)

def onehot(y):
    o = np.zeros((y.size, 10), np.float32); o[np.arange(y.size), y] = 1.0; return o

# light augmentation: random ±2px shifts make it robust to loose stylus placement
def shift_batch(imgs):
    out = imgs.reshape(-1, 28, 28).copy()
    for i in range(out.shape[0]):
        dx, dy = rng.integers(-2, 3), rng.integers(-2, 3)
        out[i] = np.roll(out[i], (dy, dx), axis=(0, 1))
        if dy > 0: out[i, :dy, :] = 0
        elif dy < 0: out[i, dy:, :] = 0
        if dx > 0: out[i, :, :dx] = 0
        elif dx < 0: out[i, :, dx:] = 0
    return out.reshape(-1, 784)

Ytr = onehot(ytr)
lr, mom, batch, epochs = 0.2, 0.9, 100, 22
vW1 = np.zeros_like(W1); vb1 = np.zeros_like(b1); vW2 = np.zeros_like(W2); vb2 = np.zeros_like(b2)
n = Xtr.shape[0]
for ep in range(epochs):
    idx = rng.permutation(n)
    for s in range(0, n, batch):
        bi = idx[s:s + batch]
        x = shift_batch(Xtr[bi]); y = Ytr[bi]
        z1 = x @ W1 + b1; a1 = np.maximum(z1, 0)
        z2 = a1 @ W2 + b2
        z2 -= z2.max(1, keepdims=True); ez = np.exp(z2); p = ez / ez.sum(1, keepdims=True)
        dz2 = (p - y) / x.shape[0]
        dW2 = a1.T @ dz2; db2 = dz2.sum(0)
        da1 = dz2 @ W2.T; dz1 = da1 * (z1 > 0)
        dW1 = x.T @ dz1; db1 = dz1.sum(0)
        vW1 = mom * vW1 - lr * dW1; W1 += vW1
        vb1 = mom * vb1 - lr * db1; b1 += vb1
        vW2 = mom * vW2 - lr * dW2; W2 += vW2
        vb2 = mom * vb2 - lr * db2; b2 += vb2
    lr *= 0.92
    # eval
    a1 = np.maximum(Xte @ W1 + b1, 0); pred = (a1 @ W2 + b2).argmax(1)
    acc = (pred == yte).mean()
    print(f"epoch {ep+1:2d}  test acc {acc:.4f}")

def b64(arr):
    return base64.b64encode(arr.astype("<f4").tobytes()).decode("ascii")

out = {
    "arch": [784, H, 10],
    "W1": b64(W1), "b1": b64(b1), "W2": b64(W2), "b2": b64(b2),
}
dst = os.path.join(os.path.dirname(__file__), "..", "public", "mnist.json")
with open(dst, "w") as f:
    json.dump(out, f)
print("wrote", os.path.abspath(dst), os.path.getsize(dst), "bytes")
