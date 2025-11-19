// Utilidades de armazenamento
const store = {
  read(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def }catch{ return def } },
  write(key, val){ localStorage.setItem(key, JSON.stringify(val)); },
  remove(key){ localStorage.removeItem(key); }
};
const DB_KEYS = {
  itens: 'tc_itens',
  desejos: 'tc_desejos',
  chat: 'tc_chat',
  prefs: 'tc_prefs'
};

// Estado
let itens = store.read(DB_KEYS.itens, []);
let desejos = store.read(DB_KEYS.desejos, []);
let chat = store.read(DB_KEYS.chat, []);
let prefs = store.read(DB_KEYS.prefs, {goldMode:false, compact:false});

// Navegação por abas
const tabs = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.panel');
tabs.forEach(btn=>{
  btn.addEventListener('click', ()=>activateTab(btn.dataset.tab));
});
document.querySelectorAll('[data-tab-jump]').forEach(el=>{
  el.addEventListener('click', ()=>activateTab(el.dataset.tabJump));
});
function activateTab(id){
  tabs.forEach(b=>b.classList.toggle('active', b.dataset.tab===id));
  panels.forEach(p=>p.classList.toggle('active', p.id===id));
}

// Renderização
const elListaItens = document.getElementById('listaItens');
const elCountPill = document.getElementById('countPill');
const elSearch = document.getElementById('search');
const elListaDesejos = document.getElementById('listaDesejos');
const elCountWish = document.getElementById('countWish');
const elListaFavoritos = document.getElementById('listaFavoritos');

function fmtValor(v){ return (v??'')==='' ? '—' : `R$ ${Number(v).toFixed(2)}`; }

function renderItens(filter=''){
  elListaItens.innerHTML = '';
  const q = filter.trim().toLowerCase();
  let list = itens.slice().reverse();
  if(q){
    list = list.filter(i=>
      (i.nome||'').toLowerCase().includes(q) ||
      (i.categoria||'').toLowerCase().includes(q) ||
      (i.codigo||'').toLowerCase().includes(q)
    );
  }
  if(prefs.compact){
    elListaItens.style.gridTemplateColumns = '1fr';
  }else{
    elListaItens.style.gridTemplateColumns = '';
  }
  list.forEach(i=>{
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.id = i.id;

    const thumb = document.createElement('div');
    thumb.className = 'item-thumb';
    if(i.imagem){
      const img = document.createElement('img');
      img.src = i.imagem;
      img.alt = i.nome || 'Imagem do item';
      thumb.appendChild(img);
    }else{
      thumb.innerHTML = '<span>📦</span>';
    }

    const mid = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = i.nome || 'Sem nome';
    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.innerHTML = `
      <strong>${i.categoria||'—'}</strong> • Código: ${i.codigo||'—'} • ${fmtValor(i.valor)}<br>
      Uso: ${i.uso||'—'} • Horário: ${i.hora||'—'} • Tags: ${i.tags||'—'}
      ${i.fav ? ' • <span class="fav">★ Favorito</span>' : ''}
    `;
    const notes = document.createElement('div');
    notes.style.fontSize = '13px';
    notes.style.color = '#b8932d'; // Cor das notas
    notes.textContent = i.notas || '';
    mid.append(title, meta, notes);

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    const btnFav = document.createElement('button');
    btnFav.className = 'btn';
    btnFav.textContent = i.fav ? 'Desfavoritar' : 'Favoritar';
    btnFav.addEventListener('click', ()=>{
      i.fav = !i.fav;
      saveItens();
      renderAll();
    });

    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn secondary';
    btnEdit.textContent = 'Editar';
    btnEdit.addEventListener('click', ()=>editItem(i));

    const btnDel = document.createElement('button');
    btnDel.className = 'btn danger';
    btnDel.textContent = 'Excluir';
    btnDel.addEventListener('click', ()=>{
      if(confirm('Excluir este item?')){
        itens = itens.filter(x=>x.id!==i.id);
        saveItens();
        renderAll();
        showToast('Item excluído.');
      }
    });
    actions.append(btnFav, btnEdit, btnDel);

    div.append(thumb, mid, actions);
    elListaItens.appendChild(div);
  });
  elCountPill.textContent = `${itens.length} item${itens.length===1?'':'s'}`;
}

function renderDesejos(){
  elListaDesejos.innerHTML = '';
  desejos.slice().reverse().forEach(d=>{
    const div = document.createElement('div');
    div.className = 'item';
    const thumb = document.createElement('div');
    thumb.className = 'item-thumb';
    thumb.innerHTML = '📝';

    const mid = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = d.nome;
    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.textContent = `Categoria: ${d.categoria||'—'} • Código: ${d.codigo||'—'} • Prioridade: ${d.prioridade}`;
    mid.append(title, meta);

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    const btnMove = document.createElement('button');
    btnMove.className = 'btn success';
    btnMove.textContent = 'Adicionar à coleção';
    btnMove.addEventListener('click', ()=>{
      const novo = {
        id: crypto.randomUUID(),
        nome: d.nome, categoria: d.categoria, codigo: d.codigo,
        valor: '', uso: '', hora: '', tags: '', fav:false, notas:''
      };
      itens.push(novo); saveItens(); renderAll(); activateTab('colecao');
      showToast('Item movido para a coleção!');
    });
    const btnDel = document.createElement('button');
    btnDel.className = 'btn danger';
    btnDel.textContent = 'Remover';
    btnDel.addEventListener('click', ()=>{
      desejos = desejos.filter(x=>x.id!==d.id);
      saveDesejos(); renderAll();
      showToast('Desejo removido.');
    });
    actions.append(btnMove, btnDel);
    div.append(thumb, mid, actions);
    elListaDesejos.appendChild(div);
  });
  elCountWish.textContent = `${desejos.length} desejo${desejos.length===1?'':'s'}`;
}

function renderFavoritos(){
  elListaFavoritos.innerHTML = '';
  const favs = itens.filter(i=>i.fav).slice().reverse();
  favs.forEach(i=>{
    const div = document.createElement('div');
    div.className = 'item';
    const thumb = document.createElement('div');
    thumb.className = 'item-thumb';
    if(i.imagem){ const img=document.createElement('img'); img.src=i.imagem; img.alt=i.nome; thumb.appendChild(img); }
    else{ thumb.textContent = '★'; }
    const mid = document.createElement('div');
    const title = document.createElement('div'); title.className='item-title'; title.textContent = i.nome;
    const meta = document.createElement('div'); meta.className='item-meta'; meta.textContent = `${i.categoria||'—'} • Código ${i.codigo||'—'} • ${fmtValor(i.valor)}`;
    mid.append(title, meta);
    const actions = document.createElement('div'); actions.className='item-actions';
    const btnOpen = document.createElement('button'); btnOpen.className='btn secondary'; btnOpen.textContent='Ver na coleção';
    btnOpen.addEventListener('click', ()=>{ activateTab('colecao'); document.getElementById('search').value = i.nome; renderItens(i.nome); });
    const btnUnfav = document.createElement('button'); btnUnfav.className='btn danger'; btnUnfav.textContent='Desfavoritar';
    btnUnfav.addEventListener('click', ()=>{ i.fav=false; saveItens(); renderAll(); showToast('Removido dos favoritos.'); });
    actions.append(btnOpen, btnUnfav);
    div.append(thumb, mid, actions);
    elListaFavoritos.appendChild(div);
  });
  if(favs.length===0){
    const empty=document.createElement('div'); empty.className='card'; empty.textContent='Sem favoritos no momento.';
    elListaFavoritos.appendChild(empty);
  }
}

function renderChat(){
  const chatList = document.getElementById('chatList');
  chatList.innerHTML = '';
  chat.slice().reverse().forEach(m=>{
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<strong>${m.autor}</strong> — <em>${new Date(m.ts).toLocaleString()}</em><br>${m.texto}`;
    chatList.appendChild(div);
  });
}

function renderAll(){
  renderItens(elSearch.value);
  renderDesejos();
  renderFavoritos();
  renderChat();
  applyPrefs();
}

// Persistência
function saveItens(){ store.write(DB_KEYS.itens, itens); }
function saveDesejos(){ store.write(DB_KEYS.desejos, desejos); }
function saveChat(){ store.write(DB_KEYS.chat, chat); }
function savePrefs(){ store.write(DB_KEYS.prefs, prefs); }

// Formulários
document.getElementById('formItem').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.currentTarget;
  const data = Object.fromEntries(new FormData(f));
  let imgData = '';
  if(f.imagem.files && f.imagem.files[0]){
    imgData = await fileToDataURL(f.imagem.files[0]);
  }
  const obj = {
    id: crypto.randomUUID(),
    nome: data.nome?.trim() || '',
    categoria: data.categoria?.trim() || '',
    codigo: data.codigo?.trim() || '',
    valor: data.valor || '',
    uso: data.uso || '',
    hora: data.hora || '',
    tags: data.tags?.trim() || '',
    notas: data.notas?.trim() || '',
    imagem: imgData,
    fav: document.getElementById('chkFavTemp').checked
  };
  itens.push(obj); saveItens(); f.reset(); document.getElementById('chkFavTemp').checked=false;
  renderAll();
  showToast('Tesouro salvo na coleção!');
});

document.getElementById('formDesejo').addEventListener('submit', (e)=>{
  e.preventDefault();
  const f = e.currentTarget;
  const data = Object.fromEntries(new FormData(f));
  desejos.push({ id: crypto.randomUUID(), ...data });
  saveDesejos(); f.reset(); renderAll();
  showToast('Adicionado à lista de desejos!');
});

document.getElementById('formChat').addEventListener('submit', (e)=>{
e.preventDefault();
  const f = e.currentTarget;
  const data = Object.fromEntries(new FormData(f));
  chat.push({ autor: data.autor || 'Anônimo', texto: data.texto || '', ts: Date.now() });
  saveChat(); f.reset(); renderAll();
});

// Editar item (agora abre o Modal)
const elEditModal = document.getElementById('editModal');
const elFormEdit = document.getElementById('formEdit');

function editItem(item){
  // Preenche o formulário do modal com os dados do item
  elFormEdit.id.value = item.id;
  elFormEdit.nome.value = item.nome || '';
  elFormEdit.categoria.value = item.categoria || '';
  elFormEdit.codigo.value = item.codigo || '';
  elFormEdit.valor.value = item.valor || '';
  elFormEdit.uso.value = item.uso || '';
  elFormEdit.hora.value = item.hora || '';
  elFormEdit.tags.value = item.tags || '';
  elFormEdit.notas.value = item.notas || '';
  
  elEditModal.showModal(); // Abre o modal
}

// Listener para salvar o formulário de edição
elFormEdit.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(elFormEdit));
  const itemId = data.id;
  
  // Encontra o item no array e atualiza
  const itemIndex = itens.findIndex(i => i.id === itemId);
  if(itemIndex > -1){
  	// Atualiza o item original, mantendo a imagem e o status 'fav'
    const originalItem = itens[itemIndex];
    Object.assign(originalItem, {
      nome: data.nome?.trim() || '',
    	  categoria: data.categoria?.trim() || '',
    	  codigo: data.codigo?.trim() || '',
    	  valor: data.valor || '',
    	  uso: data.uso || '',
    	  hora: data.hora || '',
    	  tags: data.tags?.trim() || '',
    	  notas: data.notas?.trim() || '',
    });
  }
  
  saveItens();
  renderAll();
  elEditModal.close();
  showToast('Item atualizado!');
});

// Listener para fechar o modal de edição
document.getElementById('btnCancelEdit').addEventListener('click', ()=>{
e.target.closest('dialog').close();
});

// Busca
elSearch.addEventListener('input', ()=>renderItens(elSearch.value));

// Import/Export
document.getElementById('export').addEventListener('click', ()=>{
  const data = {itens, desejos, chat, prefs};
  downloadJSON('tesouro-colecionador.json', data);
});
document.getElementById('importFile').addEventListener('change', async (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  try{
    const txt = await file.text();
    const data = JSON.parse(txt);
    if(data.itens) itens = data.itens;
    if(data.desejos) desejos = data.desejos;
    if(data.chat) chat = data.chat;
    if(data.prefs) prefs = data.prefs;
    saveItens(); saveDesejos(); saveChat(); savePrefs();
    showToast('Importação concluída!'); renderAll();
  }catch(err){
    alert('Falha ao importar arquivo JSON.');
  }finally{
    e.target.value = '';
  }
});

// Preferências
const formPrefs = document.getElementById('formPrefs');
formPrefs.goldMode.checked = !!prefs.goldMode;
formPrefs.compact.checked = !!prefs.compact;
formPrefs.addEventListener('submit', (e)=>{
  e.preventDefault();
  prefs.goldMode = formPrefs.goldMode.checked;
  prefs.compact = formPrefs.compact.checked;
  savePrefs(); applyPrefs();
  showToast('Preferências salvas!');
});

function applyPrefs(){
  document.documentElement.style.setProperty('--gold', prefs.goldMode ? '#e1bf52' : '#d4af37');
  document.documentElement.style.setProperty('--gold-light', prefs.goldMode ? '#ffe38a' : '#f5d76e');
  document.documentElement.style.setProperty('--gold-deep', prefs.goldMode ? '#a87f21' : '#b8932d');
  // Re-renderiza os itens para aplicar o modo compacto
  renderItens(elSearch.value);
}

// Backup e wipe
document.getElementById('backupAll').addEventListener('click', ()=>{
  const data = {itens, desejos, chat, prefs};
  downloadJSON('backup-tesouro.json', data);
});
document.getElementById('wipeAll').addEventListener('click', ()=>{
  if(confirm('Tem certeza que deseja apagar TODOS os dados locais?')){
    itens=[]; desejos=[]; chat=[]; prefs={goldMode:false, compact:false};
    store.remove(DB_KEYS.itens);
    store.remove(DB_KEYS.desejos);
    store.remove(DB_KEYS.chat);
    store.remove(DB_KEYS.prefs);
    renderAll();
    showToast('Todos os dados locais foram apagados.');
  }
});

// Helpers
function fileToDataURL(file){
  return new Promise((resolve, reject)=>{
    const fr = new FileReader();
    fr.onload = ()=>resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
function downloadJSON(filename, data){
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

// Helper de Notificação (Toast)
function showToast(message){
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Inicialização
renderAll();