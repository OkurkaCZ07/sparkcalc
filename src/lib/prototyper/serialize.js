// Serialize circuit state to a URL-safe base64 string
export function stateToQueryParam(state) {
  try {
    const json = JSON.stringify({
      c: (state?.components || []).map((c) => ({
        t: c.type,
        a: c.anchor,
        r: c.rot || 0,
        v: c.value,
        p: c.props || {},
      })),
      w: (state?.wires || []).map((w) => ({
        a: w.a,
        b: w.b,
        c: w.color,
      })),
    });
    return btoa(encodeURIComponent(json));
  } catch (e) {
    return '';
  }
}

// Deserialize circuit state from a URL query param
export function queryParamToState(param) {
  try {
    const json = JSON.parse(decodeURIComponent(atob(param)));
    let idCounter = 0;
    const mkId = () => `imp_${idCounter++}_${Date.now().toString(36)}`;
    return {
      components: (json.c || []).map((c) => ({
        id: mkId(),
        type: c.t,
        anchor: c.a,
        rot: c.r || 0,
        value: c.v || '',
        props: c.p || {},
      })),
      wires: (json.w || []).map((w) => ({
        id: mkId(),
        a: w.a,
        b: w.b,
        color: w.c,
      })),
    };
  } catch (e) {
    return null;
  }
}

