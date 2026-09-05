const loading = document.querySelector('#loading');
const error = document.querySelector('#error');
const article = document.querySelector('#concept');

const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const paragraphs = content => content.map(item => item.type === 'paragraph' ? `<p>${esc(item.text)}</p>` : '').join('');

function render(data) {
  document.title = `Lumina — ${data.title}`;
  document.querySelector('#subject').textContent = data.subject;
  document.querySelector('#topic').textContent = data.topic;
  document.querySelector('#difficulty').textContent = `Level ${data.difficulty}`;
  document.querySelector('#title').textContent = data.title;
  document.querySelector('#introduction').textContent = data.theory.introduction;

  const theory = document.querySelector('#theory-content');
  const toc = document.querySelector('#toc');
  theory.innerHTML = data.theory.sections.map((section, i) => `
    <section class="theory-block" id="${esc(section.id)}">
      <div class="theory-number">${String(i + 1).padStart(2, '0')}</div>
      <h3>${esc(section.title)}</h3>
      ${paragraphs(section.content)}
    </section>`).join('');
  toc.innerHTML = data.theory.sections.map((section, i) => `<a href="#${esc(section.id)}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(section.title)}</a>`).join('');

  document.querySelector('#formula-grid').innerHTML = data.formulas.map(formula => `
    <article class="formula-card"><span>${esc(formula.name)}</span><strong>${esc(formula.expression)}</strong><p>${esc(formula.explanation)}</p></article>`).join('');

  document.querySelector('#examples-list').innerHTML = data.examples.map((example, i) => `
    <article class="example-card"><div class="example-label">EXAMPLE ${String(i + 1).padStart(2, '0')}</div><h3>${esc(example.question)}</h3><div class="solution"><span>Solution</span><p>${esc(example.solution)}</p></div></article>`).join('');

  document.querySelector('#key-ideas').innerHTML = data.key_ideas.map(item => `<li>${esc(item)}</li>`).join('');
  document.querySelector('#misconceptions').innerHTML = data.misconceptions.map(item => `<li>${esc(item)}</li>`).join('');

  const labels = { why: 'Why?', visualization: 'Visualize', experiment: 'Experiment', 'go-deeper': 'Go deeper' };
  document.querySelector('#explorations-list').innerHTML = data.explorations.map(item => `<div class="exploration-card"><span>✦</span><strong>${esc(labels[item.type] || item.type)}</strong><small>${esc(item.id)}</small></div>`).join('');

  loading.hidden = true;
  article.hidden = false;
}

async function load() {
  try {
    const response = await fetch('/api/concepts/trigonometric-ratios');
    if (!response.ok) throw new Error('Concept could not be loaded.');
    render(await response.json());
  } catch (err) {
    loading.hidden = true;
    error.hidden = false;
    error.textContent = err.message;
  }
}
load();
