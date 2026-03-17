export class DisjointSet {
  constructor() {
    this.parent = new Map();
    this.rank = new Map();
  }

  makeSet(x) {
    if (this.parent.has(x)) return;
    this.parent.set(x, x);
    this.rank.set(x, 0);
  }

  find(x) {
    const p = this.parent.get(x);
    if (p === undefined) {
      this.makeSet(x);
      return x;
    }
    if (p !== x) {
      const root = this.find(p);
      this.parent.set(x, root);
      return root;
    }
    return x;
  }

  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return ra;
    const rka = this.rank.get(ra) || 0;
    const rkb = this.rank.get(rb) || 0;
    if (rka < rkb) {
      this.parent.set(ra, rb);
      return rb;
    }
    if (rka > rkb) {
      this.parent.set(rb, ra);
      return ra;
    }
    this.parent.set(rb, ra);
    this.rank.set(ra, rka + 1);
    return ra;
  }
}

