/* 모의고사 공용 스크립트: 데이터 파일(KEY·QA·NOTE) 뒤에 <script src="mo.js" defer></script> */
(()=>{const go=()=>{
const d=document,$=s=>d.querySelector(s),E=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
d.title=KEY;
d.head.insertAdjacentHTML('beforeend',`<meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{--b:#fff;--t:#222;--m:#f2f2f5;--a:#d6336c;color-scheme:light dark}
@media(prefers-color-scheme:dark){:root{--b:#17171a;--t:#e8e8ea;--m:#26262b;--a:#f783ac}}
body{margin:0;background:var(--b);color:var(--t);font:16px/1.8 system-ui,sans-serif}
header{position:sticky;top:0;z-index:1;background:var(--m);padding:8px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
header b{flex:1 1 100%;font-size:15px}
button{font:inherit;font-size:14px;padding:3px 10px;border:1px solid var(--a);border-radius:6px;background:none;color:var(--t)}
#app{max-width:720px;margin:auto;padding:12px 14px 60px}
.q{border-bottom:1px solid var(--m);padding:10px 0;display:flex;flex-wrap:wrap;align-items:center;gap:2px 14px}
.q>b{flex:1}.q>:not(b):not(details){font-size:14px;float:none;margin:0;position:static}.q>details{order:9;flex:1 1 100%}
h2{scroll-margin-top:120px}
summary{cursor:pointer;margin-top:4px}
.a{margin:6px 0 0;padding:8px 10px;background:var(--m);border-radius:6px}
h2{color:var(--a);margin-top:28px}h3{font-size:16px;margin:20px 0 4px}ul{margin:0;padding-left:20px}
</style>`);
d.body.innerHTML='<header><b></b><label><input type="checkbox" id="f"> 틀린 것만</label><button id="x">오답 내보내기</button><button id="c">번호 복사</button><button id="n">노트 내보내기</button></header><main id="app"></main>';
$('header b').textContent=KEY;
let S={};try{S=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
if(Array.isArray(S))S=Object.fromEntries(S.map(i=>[i,true]));
const W=()=>Object.keys(S).filter(k=>S[k]).map(Number).sort((a,b)=>a-b);
$('#app').innerHTML='<h2>1부 QnA</h2>'+QA.map((q,i)=>`<div class="q" data-i="${i}"><b>${i+1}.</b><label><input type="checkbox"${S[i]?' checked':''}> 틀림</label><details><summary>${E(q[0])}</summary><div class="a">${E(q[1])}</div></details></div>`).join('')
+(NOTE.length?'<h2>2부 개념노트</h2>'+NOTE.map(n=>`<section><h3>${E(n[0])} [${E(n[1])}] ${E(n[2])}</h3><ul>${n[3].map(l=>`<li>${E(l)}</li>`).join('')}</ul></section>`).join(''):'');
const flt=()=>{const on=$('#f').checked;d.querySelectorAll('.q').forEach(e=>e.hidden=on&&!e.querySelector('input').checked)};
$('#app').onchange=e=>{const i=e.target.closest('.q').dataset.i;if(e.target.checked)S[i]=true;else delete S[i];try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}flt()};
$('#f').onchange=flt;
$('#c').onclick=async()=>{const t=W().map(i=>i+1).join(',');try{await navigator.clipboard.writeText(t)}catch(e){const a=d.createElement('textarea');a.value=t;d.body.append(a);a.select();try{d.execCommand('copy')}catch(e){}a.remove()}};
$('#x').onclick=async()=>{
let js=(d.getElementById('mo')||{}).textContent||'';
if(!js)try{const r=await fetch('mo.js');if(r.ok)js=await r.text()}catch(e){}
const j=v=>JSON.stringify(v).replace(/</g,'\\u003c'),T='<'+'/script>';
const data='const KEY='+j(KEY+'-wrong')+';\nconst QA=[\n'+W().map(i=>j(QA[i])).join(',\n')+'\n];\nconst NOTE=[];';
const html='<!DOCTYPE html>\n<meta charset="utf-8">\n<script>\n'+data+'\n'+T+'\n'+(js?'<script id="mo">\n'+js+'\n'+T:'<script src="mo.js" defer>'+T)+'\n';
const a=d.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));a.download=KEY+'-wrong.html';a.click()};
const dl=(s,n,ty)=>{const a=d.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:ty+';charset=utf-8'}));a.download=n;a.click()};
if(!NOTE.length)$('#n').hidden=true;
$('#n').onclick=()=>dl(KEY+' 개념노트\n\n'+NOTE.map(n=>'## '+n[0]+' ['+n[1]+'] '+n[2]+'\n'+n[3].map(l=>'- '+l).join('\n')).join('\n\n')+'\n',KEY+'-노트.txt','text/plain');
};document.body?go():document.addEventListener('DOMContentLoaded',go)})();
