const $ = (s) => document.querySelector(s);
let categories = [], terms = [], diagrams = {};
let activeCategory = 'oral-structures', selectedId = null, globalQuery = '';
let dataReady = false;
const norm = (s) => (s || '').toLocaleLowerCase().normalize('NFKC');
async function loadData(){
  // Bundled data makes the app work even when index.html is opened directly from Finder.
  if (window.ORAL_EXPLORER_DATA) return window.ORAL_EXPLORER_DATA;
  const [c,t,d]=await Promise.all([fetch('data/categories.json'),fetch('data/terminology.json'),fetch('data/diagrams.json')]);
  if(!c.ok||!t.ok||!d.ok) throw new Error('JSON data could not load.');
  return {categories:await c.json(),terms:await t.json(),diagrams:await d.json()};
}
async function init(){
  const data=await loadData();
  categories=Array.isArray(data.categories)?data.categories:[];
  terms=Array.isArray(data.terms)?data.terms:[];
  diagrams=data.diagrams||{};
  if(!categories.length || !terms.length) throw new Error(`Invalid data: ${categories.length} categories, ${terms.length} terms`);
  // Validate category references before rendering. Missing links silently hide terms, so fail loudly instead.
  const ids=new Set(categories.map(c=>c.id));
  const orphaned=terms.filter(t=>!ids.has(t.category));
  if(orphaned.length) console.warn(`${orphaned.length} terms reference missing categories`, orphaned);
  $('#total-count').textContent=terms.length.toLocaleString(); $('#module-count').textContent=`${categories.length} modules`;
  dataReady=true;
  if(!categories.some(c=>c.id===activeCategory)) activeCategory=categories[0].id;
  renderCategories(); activateCategory(activeCategory,{resetSearch:true}); updateSearchHint();
}
function categoryTerms(id){return terms.filter(t=>String(t.category).trim()===String(id).trim())}
function renderCategories(){
  const nav=$('#category-nav'); nav.replaceChildren();
  categories.forEach(c=>{
    const b=document.createElement('button'); b.type='button'; b.className='category-button'+(c.id===activeCategory?' active':''); b.setAttribute('aria-pressed',String(c.id===activeCategory));
    const n=document.createElement('span');n.className='cat-number';n.textContent=c.number;
    const label=document.createElement('span');label.className='cat-label';label.textContent=c.label;
    const count=document.createElement('span');count.className='cat-count';count.textContent=categoryTerms(c.id).length;
    b.append(n,label,count);b.addEventListener('click',()=>activateCategory(c.id,{resetSearch:true}));nav.appendChild(b);
  });
}
function activateCategory(id, options={}){
  activeCategory=id; const c=categories.find(x=>x.id===id); if(!c)return;
  if(options.resetSearch){ globalQuery=''; $('#global-search').value=''; $('#module-search').value=''; }
  selectedId = categoryTerms(id).some(t=>t.id===selectedId) ? selectedId : null;
  $('#module-number').textContent='MODULE '+c.number;$('#module-title').textContent=c.label;$('#module-description').textContent=c.description;
  $('#term-count').textContent=categoryTerms(id).length;
  if(diagrams[id]){
    const d=diagrams[id]; $('#diagram-title').textContent=d.title;$('#diagram-description').textContent=d.description;$('#diagram-image').src=d.image;$('#diagram-image').alt=d.title+' 학습용 벡터 도식';
    renderKeyTerms(d.keyTerms||[]);
  } else { $('#diagram-title').textContent='이 파트의 도식'; $('#diagram-description').textContent='이 파트의 핵심 용어를 목록에서 선택해.'; $('#diagram-image').removeAttribute('src'); $('#diagram-image').alt=''; $('#diagram-key-terms').replaceChildren(); }
  renderCategories(); renderTermList();
  const list=categoryTerms(id);const next=list.find(t=>t.id===selectedId)||list[0];if(next)selectTerm(next.id);else clearDetail();
  updateSearchHint();
}
function renderKeyTerms(names){
 const root=$('#diagram-key-terms');root.className='key-terms';root.replaceChildren();
 names.forEach(name=>{const t=terms.find(x=>x.category===activeCategory&&x.english.toLocaleLowerCase()===name.toLocaleLowerCase())||terms.find(x=>x.english.toLocaleLowerCase()===name.toLocaleLowerCase());if(!t)return;const b=document.createElement('button');b.className='key-term';b.type='button';b.textContent=t.english+' · '+t.korean;b.addEventListener('click',()=>{if(t.category!==activeCategory)activateCategory(t.category);selectTerm(t.id)});root.appendChild(b)});
}
function renderTermList(){
 const root=$('#term-list');
 if(!root || !dataReady) return;
 const moduleInput=$('#module-search');
 const q=norm(moduleInput ? moduleInput.value : '').trim()||norm(globalQuery).trim();
 const list=terms.filter(t=>String(t.category).trim()===String(activeCategory).trim()&&(!q||norm([t.english,t.korean,t.pronunciation,t.ipa,t.features,t.location,t.labRelevance].join(' ')).includes(q)));
 root.replaceChildren();$('#visible-count').textContent=`${list.length}개 표시`;
 if(!list.length){const e=document.createElement('div');e.className='empty-state';e.textContent=q?'검색 결과가 없어. 검색어를 지우면 이 파트의 전체 용어가 보여.':'이 파트에 등록된 용어가 없어.';root.appendChild(e);return}
 list.forEach(t=>{const b=document.createElement('button');b.type='button';b.className='term-chip'+(t.id===selectedId?' active':'');b.setAttribute('aria-pressed',String(t.id===selectedId));const en=document.createElement('strong');en.textContent=t.english;const ko=document.createElement('span');ko.textContent=t.korean;b.append(en,ko);b.addEventListener('click',()=>selectTerm(t.id));root.appendChild(b)});
}
function escapeXml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function termVisualSvg(t,c){
 // Every vocabulary item has its own SVG study plate in data/term-images/.
 // The plate includes the term label and a highlighted conceptual anchor.
 return `data/term-images/${encodeURIComponent(t.id)}.svg`;
}

function selectTerm(id){
 const t=terms.find(x=>x.id===id);if(!t)return;
 if(t.category!==activeCategory){activateCategory(t.category);return;}
 selectedId=t.id;const c=categories.find(x=>x.id===t.category);
 $('#term-category').textContent=c?c.labelEn.toUpperCase():t.category.toUpperCase();$('#term-id').textContent=String(terms.indexOf(t)+1).padStart(3,'0');
 $('#term-en').textContent=t.english;$('#term-ko').textContent=t.korean;$('#term-pronunciation').textContent=t.pronunciation||'원문에 한국어 근사 발음 없음';$('#term-ipa').textContent=t.ipa?'/'+t.ipa+'/':'IPA 확인 필요 · 신뢰할 수 있는 발음 사전에서 검증 전';
 $('#term-features').textContent=t.features||'원문에 별도 특징 설명 없음';
 $('#term-location').textContent=t.location||'이 항목은 단일 해부학적 위치가 없는 개념일 수 있어. 특징과 적용 상황을 확인해.';
 $('#term-lab').textContent=t.labRelevance||'원문에 별도 기공 포인트 없음';$('#term-source').textContent='원문 구간: '+t.sourceSection;
 $('#diagram-title').textContent=`${t.english} · ${t.korean}`;
 $('#diagram-description').textContent=`원문 핵심: ${t.features||'별도 특징 설명 없음'}${t.labRelevance && t.labRelevance!==t.features?' | 기공 연결: '+t.labRelevance:''}`;
 $('#diagram-image').onerror=()=>{ $('#diagram-image').onerror=null; $('#diagram-image').removeAttribute('src'); $('#diagram-image').alt=`용어별 그림 파일을 찾을 수 없음: ${t.english}`; $('#diagram-description').textContent='이미지 연결을 확인해야 해. 다른 용어의 그림으로 대체하지 않았어.'; };$('#diagram-image').src=termVisualSvg(t,c);$('#diagram-image').alt=`${t.english} ${t.korean} 용어별 해부학 개념도`;
 const focus=$('#term-focus-note');if(focus){focus.replaceChildren();const h=document.createElement('strong');h.textContent=`선택한 용어: ${t.english} · ${t.korean}`;const p=document.createElement('p');p.textContent=`그림의 강조 표시는 학습용 개념 위치야. 아래에서 특징, 위치, 기공 포인트를 확인해. 원문 구간: ${t.sourceSection}.`;focus.append(h,p);}
 const related=terms.filter(x=>x.category===t.category&&x.id!==t.id).filter(x=>[x.english,x.korean,x.features].some(v=>v&&t.features&&v.split(/\s+/).some(w=>w.length>3&&t.features.includes(w)))).slice(0,6);
 renderKeyTerms(related.length?related.map(x=>x.english):[]);
 renderTermList();$('#status').textContent=`선택한 용어: ${t.english} · ${t.korean}. 선택 용어에 대응하는 개별 학습 도식을 불러왔어.`;
}
function clearDetail(){['term-en','term-ko','term-pronunciation','term-ipa','term-features','term-location','term-lab','term-source'].forEach(id=>$('#'+id).textContent='');}
function updateSearchHint(){const q=$('#global-search').value.trim();$('#search-hint').textContent=q?`전체 검색어 “${q}”가 현재 파트 목록에도 적용돼.`:'영어 또는 한국어를 입력하면 모든 파트에서 검색해.';}
$('#module-search').addEventListener('input',renderTermList);
$('#global-search').addEventListener('input',()=>{globalQuery=$('#global-search').value;updateSearchHint();if(globalQuery.trim()){const q=norm(globalQuery.trim());const first=terms.find(t=>norm([t.english,t.korean,t.pronunciation,t.ipa,t.features,t.location,t.labRelevance].join(' ')).includes(q));if(first&&first.category!==activeCategory){activeCategory=first.category;const c=categories.find(x=>x.id===activeCategory);if(c){$('#module-number').textContent='MODULE '+c.number;$('#module-title').textContent=c.label;$('#module-description').textContent=c.description;$('#term-count').textContent=categoryTerms(activeCategory).length;renderCategories();}}}renderTermList();});
function playEnglishPronunciation(){const t=terms.find(x=>x.id===selectedId);if(!t)return;if(!('speechSynthesis'in window)){ $('#status').textContent='이 브라우저는 음성 합성을 지원하지 않아.';return;}const synth=window.speechSynthesis;synth.cancel();const voices=synth.getVoices();const englishVoices=voices.filter(v=>/^en([_-]|$)/i.test(v.lang));if(!englishVoices.length){$('#status').textContent='이 기기에서 영어 음성을 찾지 못했어. 시스템 설정에서 English (New Zealand/United States/United Kingdom) 음성을 설치한 뒤 다시 시도해 줘. 한국어 음성으로 잘못 읽지 않도록 재생을 중단했어.';return;}const voice=englishVoices.find(v=>/new zealand/i.test(v.name+' '+v.lang))||englishVoices.find(v=>/united states|us english/i.test(v.name+' '+v.lang))||englishVoices.find(v=>/united kingdom|british/i.test(v.name+' '+v.lang))||englishVoices[0];const u=new SpeechSynthesisUtterance(t.english);u.voice=voice;u.lang=voice.lang;u.rate=.82;u.onstart=()=>$('#status').textContent=`영어 음성(${voice.name}, ${voice.lang})으로 ${t.english} 재생 중`;u.onerror=()=>$('#status').textContent='영어 음성 재생에 실패했어. 시스템의 영어 음성 설치를 확인해 줘.';synth.speak(u);}$('#speak-button').addEventListener('click',playEnglishPronunciation);
init().catch(err=>{console.error(err);$('#status').textContent='데이터를 불러오지 못했어. ZIP 압축이 제대로 풀렸는지 확인해 줘.';$('#term-list').innerHTML='<div class="empty-state">데이터 로딩 실패. 폴더 안의 index.html을 열거나 로컬 서버로 실행해.</div>';});
