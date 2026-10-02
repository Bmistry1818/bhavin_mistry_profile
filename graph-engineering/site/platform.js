(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('.graph-install [role="tab"]')];
  function select(tab) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let destination;
      if (event.key === 'ArrowRight') destination = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') destination = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') destination = 0;
      if (event.key === 'End') destination = tabs.length - 1;
      if (destination !== undefined) {
        event.preventDefault(); select(tabs[destination]); tabs[destination].focus();
      }
    });
  });
  if (tabs.length) select(tabs[0]);

  const data = document.getElementById('graph-demo-data');
  const output = document.getElementById('graph-demo-output');
  if (!data || !output) return;
  const graph = JSON.parse(data.textContent);
  const buttons = [...document.querySelectorAll('[data-seed]')];
  function retrieve(seed) {
    const distance = new Map([[seed,0]]);
    const pending = [seed];
    for (let index = 0; index < pending.length; index++) {
      const current = pending[index];
      if (distance.get(current) >= 2) continue;
      graph.edges.forEach(([from,to]) => {
        const neighbor = from === current ? to : to === current ? from : null;
        if (neighbor && !distance.has(neighbor)) { distance.set(neighbor,distance.get(current)+1); pending.push(neighbor); }
      });
    }
    const nodes = graph.nodes.filter(node => distance.has(node.id)).sort((a,b) => distance.get(a.id)-distance.get(b.id) || a.label.localeCompare(b.label));
    const title = document.createElement('h3');
    title.textContent = graph.nodes.find(node => node.id === seed).label;
    const list = document.createElement('ul');
    nodes.forEach(node => { const item = document.createElement('li'); const label = document.createElement('strong'); label.textContent = node.label + ' · '; item.append(label,document.createTextNode(node.body)); list.append(item); });
    const metrics = document.createElement('div');
    metrics.className = 'graph-demo-metrics';
    metrics.textContent = `${nodes.length} / ${graph.nodes.length} nodes included · ${graph.nodes.length-nodes.length} omitted · two-hop boundary`;
    output.replaceChildren(title,list,metrics);
    buttons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.seed === seed)));
    document.querySelectorAll('[data-graph-id]').forEach(node => { node.classList.toggle('is-included',distance.has(node.dataset.graphId)); node.classList.toggle('is-seed',node.dataset.graphId === seed); });
  }
  buttons.forEach(button => button.addEventListener('click',() => retrieve(button.dataset.seed)));
  retrieve('gateway');
})();
