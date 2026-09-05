const form = document.querySelector('#roadmap-form');
const topicSelect = document.querySelector('#topic');
const roadmapSection = document.querySelector('#roadmap');
const nodeList = document.querySelector('#node-list');
const toast = document.querySelector('#toast');
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const chatMessages = document.querySelector('#chat-messages');
const lessonDialog = document.querySelector('#lesson-dialog');
const lessonDialogTitle = document.querySelector('#lesson-dialog-title');
const lessonDialogContent = document.querySelector('#lesson-dialog-content');
const lessonList = document.querySelector('#lesson-list');

async function loadTopics() {
  const { topics } = await fetch('/api/topics').then(r => r.json());
  for (const topic of topics.filter(t => ['functions','quadratics','triangles','exponentials','derivatives','integrals'].includes(t.id))) {
    const option = document.createElement('option'); option.value = topic.id; option.textContent = `${topic.title} · ${topic.level}`; topicSelect.append(option);
  }
  topicSelect.value = 'derivatives';
}
function showToast(message) { toast.textContent = message; toast.classList.add('visible'); setTimeout(() => toast.classList.remove('visible'), 2800); }
async function readJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new Error('The running server is outdated. Stop it, restart with npm start, and refresh this page.');
  return response.json();
}
function cleanMathText(text) {
  return text
  .replace(/\$\$?/g, '')
  .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
  .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1) / ($2)')
  .replace(/\\text\{([^{}]*)\}/g, '$1')
  .replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
  .replace(/\\sin/g, 'sin')
  .replace(/\\cos/g, 'cos')
  .replace(/\\tan/g, 'tan')
  .replace(/\\log/g, 'log')
  .replace(/\\left|\\right/g, '')
  .replace(/\\theta/g, 'theta')
  .replace(/\\pi/g, 'pi')
  .replace(/\\circ/g, ' degrees')
  .replace(/\\cdot/g, ' * ')
  .replace(/\\times/g, ' * ')
  .replace(/\\,/g, ' ')
  .replace(/\\quad/g, ' ')
  .replace(/[{}]/g, '')
  .replace(/\s{2,}/g, ' ')
  .trim();
}
function renderAnswer(text, container) {
  container.replaceChildren();
  text.split(/\n\s*\n/).forEach(block => {
    const trimmed = block.trim(); if (!trimmed) return;
    const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (heading) { const element = document.createElement('h4'); element.textContent = cleanMathText(heading[1].replace(/[*_]/g, '')); container.append(element); return; }
    const paragraph = document.createElement('p');
    const lines = trimmed.split('\n');
    lines.forEach((line, index) => {
      if (index) paragraph.append(document.createElement('br'));
      const cleanLine = cleanMathText(line.replace(/^[-*]\s+/, '• ').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1'));
      paragraph.append(document.createTextNode(cleanLine));
    });
    container.append(paragraph);
  });
}
async function generateTwin(message, question, references, button) {
  button.disabled = true; button.textContent = 'Generating twin problem…';
  try {
    const response = await fetch('/api/twin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, references, grade: document.querySelector('#grade').value }) });
    const twin = await readJson(response); if (!response.ok) throw new Error(twin.error || 'Twin problem could not be generated.');
    button.remove();
    const card = document.createElement('section'); card.className = 'twin-problem';
    const label = document.createElement('span'); label.className = 'message-label'; label.textContent = 'TWIN PROBLEM';
    const title = document.createElement('h4'); title.textContent = twin.concept;
    const problem = document.createElement('p'); problem.textContent = twin.problem;
    const hint = document.createElement('small'); hint.textContent = `Hint: ${twin.hint}`;
    const reference = document.createElement('a'); reference.href = `#lesson-${references[0].sectionId}`; reference.textContent = `Review ${twin.sectionTitle}`; reference.addEventListener('click', event => { event.preventDefault(); openLesson(references[0]); });
    card.append(label, title, problem, hint, reference); message.append(card); chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (error) { button.disabled = false; button.textContent = 'Mark as resolved'; showToast(error.message || 'Twin problem could not be generated.'); }
}
async function openLesson(reference) {
  lessonDialogTitle.textContent = reference.sectionTitle;
  lessonDialogContent.replaceChildren();
  const loading = document.createElement('p'); loading.textContent = 'Loading this lesson section…'; lessonDialogContent.append(loading);
  lessonDialog.showModal();
  try {
    const response = await fetch(`/api/lesson?module=${encodeURIComponent(reference.moduleId)}&section=${encodeURIComponent(reference.sectionId)}`);
    const lesson = await readJson(response); if (!response.ok) throw new Error(lesson.error || 'Lesson section could not load.');
    lessonDialogTitle.textContent = lesson.sectionTitle; lessonDialogContent.replaceChildren();
    lesson.content.forEach(item => { const paragraph = document.createElement(item.type === 'heading' ? 'h3' : 'p'); paragraph.textContent = cleanMathText(item.text || ''); lessonDialogContent.append(paragraph); });
  } catch (error) { loading.textContent = error.message || 'Lesson section could not load.'; }
}
async function loadModule() {
  const response = await fetch('/api/module?module=trigonometric-ratios');
  const module = await readJson(response); if (!response.ok) throw new Error(module.error || 'Module could not load.');
  document.querySelector('#module-title').textContent = module.title;
  document.querySelector('#module-description').textContent = 'Build a clear understanding of right triangles, sine, cosine, tangent, and how ratios become functions.';
  document.querySelector('#section-count').textContent = module.sections.length;
  document.querySelector('#formula-count').textContent = module.formulas.length;
  document.querySelector('#example-count').textContent = module.examples.length;
  document.querySelector('#lesson-browser-status').textContent = `${module.sections.length} sections`;
  const ideas = document.querySelector('#key-ideas'); module.keyIdeas.slice(0, 4).forEach(idea => { const item = document.createElement('li'); item.textContent = idea; ideas.append(item); });
  const formulas = document.querySelector('#formula-list'); module.formulas.slice(0, 4).forEach(formula => { const item = document.createElement('div'); item.className = 'formula-item'; item.innerHTML = `<strong>${formula.name}</strong><span>${formula.expression}</span>`; formulas.append(item); });
  module.sections.forEach((section, index) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'lesson-card'; button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><strong>${section.title}</strong><b>→</b>`; button.addEventListener('click', () => openLesson({ moduleId: module.id, moduleTitle: module.title, sectionId: section.id, sectionTitle: section.title })); lessonList.append(button); });
}
document.querySelector('#lesson-dialog-close').addEventListener('click', () => lessonDialog.close());
function addChatMessage(role, text, references = [], warning = '', externalSources = []) {
  const message = document.createElement('article'); message.className = `chat-message ${role}`;
  const label = document.createElement('span'); label.className = 'message-label'; label.textContent = role === 'assistant' ? 'LUMINA' : 'YOU';
  const content = document.createElement('div'); content.className = 'message-content'; renderAnswer(text, content);
  message.append(label, content);
  if (role === 'assistant' && references.length) {
    const resolved = document.createElement('button'); resolved.type = 'button'; resolved.className = 'resolve-button'; resolved.textContent = 'Mark as resolved'; resolved.addEventListener('click', () => generateTwin(message, message.dataset.question, references, resolved)); message.append(resolved); message.dataset.question = window.__luminaLastQuestion || '';
  }
  if (warning) { const note = document.createElement('small'); note.className = 'chat-warning'; note.textContent = warning; message.append(note); }
  if (references.length) {
    const sourceList = document.createElement('div'); sourceList.className = 'module-references';
    references.forEach(reference => {
      const link = document.createElement('a'); link.href = `#lesson-${reference.sectionId}`; link.textContent = `${reference.moduleTitle} · ${reference.sectionTitle}`; link.title = 'Open Lumina lesson section'; link.addEventListener('click', event => { event.preventDefault(); openLesson(reference); }); sourceList.append(link);
    });
    message.append(sourceList);
  }
  if (externalSources.length) {
    const sourceList = document.createElement('div'); sourceList.className = 'external-sources';
    const label = document.createElement('span'); label.textContent = 'WEB CONTEXT'; sourceList.append(label);
    externalSources.forEach(source => { const link = document.createElement('a'); link.href = source.url; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = source.title; sourceList.append(link); });
    message.append(sourceList);
  }
  chatMessages.append(message); chatMessages.scrollTop = chatMessages.scrollHeight; return message;
}
chatForm.addEventListener('submit', async event => {
  event.preventDefault(); const question = chatInput.value.trim(); if (!question) return;
  addChatMessage('user', question); chatInput.value = ''; chatInput.disabled = true; chatForm.querySelector('button').disabled = true;
  const loading = addChatMessage('assistant', 'I’m checking your Lumina lessons…');
  try {
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, grade: document.querySelector('#grade').value }) });
    const data = await readJson(response); if (!response.ok) throw new Error(data.error || 'The tutor could not answer.');
    loading.remove(); window.__luminaLastQuestion = question; addChatMessage('assistant', data.answer, data.references, data.warning, data.externalSources);
  } catch (error) { loading.remove(); addChatMessage('assistant', error.message || 'The tutor is unavailable right now. Please try again.'); }
  finally { chatInput.disabled = false; chatForm.querySelector('button').disabled = false; chatInput.focus(); }
});
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => { chatInput.value = button.dataset.question; chatInput.focus(); }));
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
document.querySelector('#begin-button').addEventListener('click', () => { document.querySelector('#lessons').scrollIntoView({ behavior: 'smooth' }); });
Promise.all([loadTopics(), loadModule()]).catch(error => showToast(error.message || 'Learning content could not load.'));
