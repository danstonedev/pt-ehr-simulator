// URL Adapter: centralizes query/hash manipulation for shareable deep links

function getHash() {
  return (window.location.hash || '#/').replace(/\/$/, '');
}

export const url = {
  getHash,
  getPathAndQuery() {
    const hash = getHash();
    const [path, q] = hash.split('?');
    return { path, query: new URLSearchParams(q || '') };
  },
  readParam(name) {
    const { query } = this.getPathAndQuery();
    return query.get(name);
  },
  setParams(update) {
    const { path, query } = this.getPathAndQuery();
    Object.entries(update || {}).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') query.delete(k);
      else query.set(k, String(v));
    });
    const next = `${path}?${query.toString()}`.replace(/\?$/, '');
    if (next !== getHash()) window.location.hash = next;
  },
};

export default url;
