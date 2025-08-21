
export function el(tag, attrs={}, children=[]){
  const e=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==='class') e.className=v;
    else if(k.startsWith('on') && typeof v==='function') {
      // Convert onClick to click, onMouseOver to mouseover, etc.
      const eventName = k.slice(2).toLowerCase();
      e.addEventListener(eventName, v);
    }
    else e.setAttribute(k,v);
  });
  if(!Array.isArray(children)) children=[children];
  children.forEach(c=>{
    if (typeof c === 'string') {
      e.appendChild(document.createTextNode(c));
    } else if (c instanceof Node) {
      e.appendChild(c);
    }
  });
  return e;
}
export function download(filename,text){ const a=document.createElement('a'); a.href='data:text/json;charset=utf-8,'+encodeURIComponent(text); a.download=filename; a.click(); }
export function textareaAutoResize(t){
  const computeBaseHeight = () => {
    const cs = window.getComputedStyle(t);
    let lineHeight = parseFloat(cs.lineHeight);
    if (Number.isNaN(lineHeight)) {
      const fontSize = parseFloat(cs.fontSize) || 16;
      lineHeight = 1.2 * fontSize; // fallback if lineHeight returns 'normal'
    }
    const paddingTop = parseFloat(cs.paddingTop) || 0;
    const paddingBottom = parseFloat(cs.paddingBottom) || 0;
    const borderTop = parseFloat(cs.borderTopWidth) || 0;
    const borderBottom = parseFloat(cs.borderBottomWidth) || 0;
    const rows = parseInt(t.getAttribute('rows') || '2', 10);
    return Math.ceil(lineHeight * rows + paddingTop + paddingBottom + borderTop + borderBottom);
  };
  const fit = () => {
    const base = computeBaseHeight();
    t.style.height = 'auto';
    const desired = Math.max(base, t.scrollHeight + 0);
    t.style.height = desired + 'px';
  };
  t.addEventListener('input', fit);
  // Defer first fit to ensure styles/placeholders applied
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fit); else setTimeout(fit, 0);
}
export function printPage(){ window.print(); }
