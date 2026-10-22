/* RealTalent · tema oficial compartilhado. Sem armazenamento de dados sensíveis. */
(function(){'use strict';
 const key='rt_theme';const attr='data-rt-theme';
 function read(){try{return localStorage.getItem(key)==='light'?'light':'dark'}catch(e){return 'dark'}}
 function set(theme){document.documentElement.setAttribute(attr,theme);for(const el of document.querySelectorAll('[data-rt-theme-toggle]')){el.textContent=theme==='light'?'☾ Escuro':'☀ Claro';el.setAttribute('aria-label',theme==='light'?'Ativar tema escuro':'Ativar tema claro');el.setAttribute('aria-pressed',String(theme==='light'))}}
 set(read());
 document.addEventListener('DOMContentLoaded',()=>{set(read());document.querySelectorAll('[data-rt-theme-toggle]').forEach(el=>el.addEventListener('click',()=>{const next=document.documentElement.getAttribute(attr)==='light'?'dark':'light';try{localStorage.setItem(key,next)}catch(e){}set(next)}))});
 window.addEventListener('storage',e=>{if(e.key===key)set(read())});
})();
