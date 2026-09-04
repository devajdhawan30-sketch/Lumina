const form = document.querySelector('#roadmap-form');
const topicSelect = document.querySelector('#topic');
const roadmapSection = document.querySelector('#roadmap');
const nodeList = document.querySelector('#node-list');
const toast = document.querySelector('#toast');

async function loadTopics() {
  const { topics } = await fetch('/api/topics').then(r => r.json());
  for (const topic of topics.filter(t => ['functions','quadratics','triangles','exponentials','derivatives','integrals'].includes(t.id))) {
    const option = document.createElement('option'); option.value = topic.id; option.textContent = `${topic.title} · ${topic.level}`; topicSelect.append(option);
  }
  topicSelect.value = 'derivatives';
}
function showToast(message) { toast.textContent = message; toast.classList.add('visible'); setTimeout(() => toast.classList.remove('visible'), 2800); }
function render(data) {
  const target = data.nodes.at(-1);
  document.querySelector('#roadmap-title').textContent = `Your route to ${target.title}`;
  document.querySelector('#roadmap-message').textContent = data.message;
  document.querySelector('#estimate').textContent = `${Math.ceil(data.estimate / 60)}h ${data.estimate % 60}m`;
  document.querySelector('#next-title').textContent = data.nodes[0].title;
  document.querySelector('#next-desc').textContent = data.nodes[0].desc;
  nodeList.replaceChildren();
  data.nodes.forEach((node, i) => {
    const el = document.createElement('article'); el.className = `path-node ${node.status}`;
    el.style.setProperty('--delay', `${i * 80}ms`);
    el.innerHTML = `<div class="node-marker"><span>${String(node.order).padStart(2, '0')}</span></div><div class="node-content"><div class="node-meta"><span>${node.level}</span><i>•</i><span>${node.mins} min</span></div><h3>${node.title}</h3><p>${node.desc}</p><div class="tags">${node.tags.map(t => `<small>${t}</small>`).join('')}</div></div>${node.status === 'target' ? '<div class="destination-mark">✦</div>' : ''}`;
    nodeList.append(el);
  });
  roadmapSection.hidden = false;
  roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
form.addEventListener('submit', async e => {
  e.preventDefault(); const button = form.querySelector('button[type=submit]');
  button.disabled = true; button.querySelector('span').textContent = 'Mapping your path…';
  try { const values = Object.fromEntries(new FormData(form)); const data = await fetch('/api/roadmap', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(values) }).then(r => r.json()); render(data); }
  catch { showToast('We could not build your path. Please try again.'); }
  finally { button.disabled = false; button.querySelector('span').textContent = 'Reveal my learning path'; }
});
document.querySelector('#begin-button').addEventListener('click', () => showToast('Lesson experience is the next module — your roadmap is saved for this demo.'));
loadTopics().catch(() => showToast('Topics could not load. Refresh to try again.'));
