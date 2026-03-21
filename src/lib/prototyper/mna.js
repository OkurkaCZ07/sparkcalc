// Minimal DC MNA solver for resistors + independent voltage sources.

function gaussianSolve(A, b) {
  const n = A.length;
  // Augmented matrix
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Pivot
    let pivot = col;
    let max = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > max) {
        max = v;
        pivot = r;
      }
    }
    if (max < 1e-12) continue; // singular/near-singular; leave as-is
    if (pivot !== col) {
      const tmp = M[col];
      M[col] = M[pivot];
      M[pivot] = tmp;
    }

    // Normalize pivot row
    const pv = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= pv;

    // Eliminate
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (Math.abs(f) < 1e-12) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = 0; i < n; i++) x[i] = M[i][n];
  return x;
}

function idxOf(node, nodeIndex, ground) {
  if (node === ground) return -1;
  return nodeIndex.get(node);
}

export function solveDC({ nodes, ground, resistors, vSources }) {
  // Unknowns: voltages of non-ground nodes (N) + currents of voltage sources (M)
  const nodeList = nodes.filter((n) => n !== ground);
  const N = nodeList.length;
  const M = vSources.length;
  const size = N + M;

  const nodeIndex = new Map(nodeList.map((n, i) => [n, i]));

  const A = Array.from({ length: size }, () => new Array(size).fill(0));
  const z = new Array(size).fill(0);

  // Stamp resistors
  for (const r of resistors) {
    const a = idxOf(r.a, nodeIndex, ground);
    const b = idxOf(r.b, nodeIndex, ground);
    const g = r.r > 0 ? 1 / r.r : 1e9;
    if (a >= 0) A[a][a] += g;
    if (b >= 0) A[b][b] += g;
    if (a >= 0 && b >= 0) {
      A[a][b] -= g;
      A[b][a] -= g;
    }
  }

  // Stamp voltage sources
  // For each source k, add row/col constraints:
  // Va - Vb = V
  for (let k = 0; k < M; k++) {
    const vs = vSources[k];
    const a = idxOf(vs.a, nodeIndex, ground);
    const b = idxOf(vs.b, nodeIndex, ground);
    const row = N + k;

    if (a >= 0) {
      A[a][row] += 1;
      A[row][a] += 1;
    }
    if (b >= 0) {
      A[b][row] -= 1;
      A[row][b] -= 1;
    }
    z[row] = vs.v;
  }

  const x = gaussianSolve(A, z);

  const nodeV = new Map();
  nodeV.set(ground, 0);
  for (let i = 0; i < N; i++) nodeV.set(nodeList[i], x[i]);

  const vSourceI = new Map();
  for (let k = 0; k < M; k++) vSourceI.set(vSources[k].id, x[N + k]);

  const resistorI = new Map();
  for (const r of resistors) {
    const va = nodeV.get(r.a) ?? 0;
    const vb = nodeV.get(r.b) ?? 0;
    resistorI.set(r.id, r.r > 0 ? (va - vb) / r.r : 0);
  }

  return { nodeV, vSourceI, resistorI, singular: false };
}

