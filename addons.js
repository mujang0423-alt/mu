/* addons.js — 복습 파일 공통 기능
   메모 · 형광펜 · 별표 · 문제 직접 추가 · 틀린 횟수 · 복습 주기
   허브(index.html)도 이 파일의 공용 함수(window.AD)를 씀.
   기능을 고치거나 추가할 땐 이 파일 하나만 바꿔 올리면 전체 적용됨. */
(()=>{
const H=location.hostname, SEG=location.pathname.split("/").filter(Boolean);
const REPO=/\.github\.io$/.test(H)&&SEG.length?H.split(".")[0]+"/"+SEG[0]:"mujang0423-alt/mu";
const BR="main", RAW="https://raw.githubusercontent.com/"+REPO+"/"+BR+"/", API="https://api.github.com/repos/"+REPO+"/contents/";
const enc=p=>p.split("/").map(encodeURIComponent).join("/");
const LSg=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const LSs=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const J=(k,d)=>{try{const v=JSON.parse(LSg(k));return v==null?d:v}catch(e){return d}};
const tok=()=>LSg("hub-token");
const b64=s=>{const u=new TextEncoder().encode(s);let r="";for(let i=0;i<u.length;i+=8192)r+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(r)};
const ub64=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,"")),c=>c.charCodeAt(0)));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today=()=>ymd(new Date());
const plus=n=>{const d=new Date();d.setDate(d.getDate()+n);return ymd(d)};
const nameOf=s=>String(s).replace(/[\\\/:*?"<>|#%]/g,"_");
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const btn=(x,f,c)=>{const b=el("button",c||"",x);b.type="button";b.onclick=e=>{e.preventDefault();e.stopPropagation();f(b)};return b};
const IV=[1,2,4,8,16,30];               // 복습 간격(일): 기억남 누를 때마다 한 칸씩 늘어남

/* ── 파일별 데이터(memo/<이름>.json): 메모·형광펜·별표·추가문제·틀린횟수·복습일정 ── */
const DOCS={};
function doc(N){return DOCS[N]||(DOCS[N]={d:J("ad|"+N,{}),q:J("adq|"+N,[]),t:0,busy:0})}
function setPath(o,p,v){
  const st=[];let x=o;
  for(let k=0;k<p.length-1;k++){const s=String(p[k]);if(!x[s]||typeof x[s]!=="object"||Array.isArray(x[s]))x[s]={};st.push([x,s]);x=x[s]}
  const s=String(p[p.length-1]);
  if(v==null){delete x[s];for(let k=st.length-1;k>=0;k--){const[a,b]=st[k];if(Object.keys(a[b]).length)break;delete a[b]}}
  else x[s]=v;
}
function get(N,p){let x=doc(N).d;for(const k of p){if(x==null||typeof x!=="object")return;x=x[String(k)]}return x}
const saveLocal=N=>{const D=doc(N);LSs("ad|"+N,JSON.stringify(D.d));LSs("adq|"+N,JSON.stringify(D.q))};
function op(N,p,v){const D=doc(N);setPath(D.d,p,v);D.q.push([p,v]);saveLocal(N);clearTimeout(D.t);D.t=setTimeout(()=>push(N),1200)}
async function fetchDoc(N){
  const p="memo/"+N+".json";
  if(tok()){
    const r=await fetch(API+enc(p)+"?ref="+BR+"&t="+Date.now(),{headers:{Authorization:"Bearer "+tok()},cache:"no-store"});
    if(r.status===404)return{d:{},sha:null};
    if(!r.ok)throw Object.assign(new Error("읽기 실패 "+r.status),{status:r.status});
    const j=await r.json();let d={};try{d=JSON.parse(ub64(j.content))||{}}catch(e){}
    return{d:d,sha:j.sha};
  }
  const r=await fetch(RAW+enc(p)+"?t="+Date.now(),{cache:"no-store"});
  if(r.status===404)return{d:{},sha:null};
  if(!r.ok)throw new Error("읽기 실패 "+r.status);
  return{d:await r.json(),sha:null};
}
async function put(path,content,msg,sha){
  const b={message:msg,content:content,branch:BR};if(sha)b.sha=sha;
  const r=await fetch(API+enc(path),{method:"PUT",headers:{Authorization:"Bearer "+tok(),"Content-Type":"application/json"},body:JSON.stringify(b)});
  if(!r.ok){let m=r.status;try{m=(await r.json()).message||m}catch(e){}throw Object.assign(new Error(m),{status:r.status})}
}
async function load(N){
  const D=doc(N);
  try{const g=await fetchDoc(N);D.q.forEach(([p,v])=>setPath(g.d,p,v));D.d=g.d;saveLocal(N);if(D.q.length)push(N)}catch(e){}
  return D.d;
}
async function push(N){
  const D=doc(N);if(!D.q.length)return;
  if(!tok()){AD.status("토큰이 없어서 이 기기에만 저장됐어요. 허브에서 '토큰'을 저장하면 올라가요.");return}
  if(D.busy){D.again=1;return}
  D.busy=1;D.again=0;
  try{
    for(let n=0;;n++){
      const ops=D.q.slice(),g=await fetchDoc(N);
      ops.forEach(([p,v])=>setPath(g.d,p,v));
      try{
        await put("memo/"+N+".json",b64(JSON.stringify(g.d,null,1)),"메모: "+N,g.sha);
        const rest=D.q.slice(ops.length);rest.forEach(([p,v])=>setPath(g.d,p,v));
        D.q=rest;D.d=g.d;saveLocal(N);AD.status("");break;
      }catch(e){if(n>=2||(e.status!==409&&e.status!==422))throw e}
    }
  }catch(e){AD.status("저장 실패: "+e.message+" — 다음에 다시 올라가요")}
  D.busy=0;
  if(D.again&&D.q.length){clearTimeout(D.t);D.t=setTimeout(()=>push(N),1500)}
}
async function upImg(N,k,b){
  if(!tok())throw new Error("사진은 토큰이 있어야 올릴 수 있어요");
  const p="memo/img/"+N+"-"+k+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5)+".jpg";
  await put(p,b,"메모 사진: "+N);return p;
}
function shrink(f){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{
  const s=Math.min(1,1400/Math.max(im.width,im.height)),c=el("canvas");c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);
  const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
  const d=c.toDataURL("image/jpeg",.82);URL.revokeObjectURL(im.src);res({url:d,b64:d.split(",")[1]})};
  im.onerror=()=>rej(new Error("이미지를 읽지 못했어요"));im.src=URL.createObjectURL(f)})}

/* 틀린 횟수 +1 (같은 날 두 번은 안 셈) → 복습 일정도 내일로 리셋 */
function bump(N,k,was){          // was: 이미 틀림 상태였는지(또 틀림/헷갈림)
  const c=get(N,["cnt",k])||{n:0};
  if(c.d===today())return false;
  op(N,["cnt",k],{n:(was?Math.max(c.n||0,1):(c.n||0))+1,d:today()});
  op(N,["srs",k],{b:0,due:plus(1)});
  return true;
}
const cntOf=(N,k,wrong)=>{const c=get(N,["cnt",k]);return Math.max(c?c.n:0,wrong?1:0)};

/* ── 형광펜: 저장된 구절을 찾아 <mark>로 감쌈 ── */
function paint(box,ps){
  if(!box)return;
  box.querySelectorAll("mark.ad-hl").forEach(m=>m.replaceWith(...m.childNodes));box.normalize();box._mg=[];
  if(!ps||!ps.length)return;
  const tw=document.createTreeWalker(box,NodeFilter.SHOW_TEXT),ns=[];let full="";
  while(tw.nextNode()){ns.push([tw.currentNode,full.length]);full+=tw.currentNode.data}
  const iv=[];
  ps.forEach(p=>{if(!p)return;let k=0;while((k=full.indexOf(p,k))>=0){iv.push([k,k+p.length,p]);k+=p.length}});
  iv.sort((a,b)=>a[0]-b[0]);
  const mg=[];
  iv.forEach(v=>{const l=mg[mg.length-1];if(l&&v[0]<=l[1]){l[1]=Math.max(l[1],v[1]);if(!l[2].includes(v[2]))l[2].push(v[2])}else mg.push([v[0],v[1],[v[2]]])});
  for(let j=ns.length-1;j>=0;j--){
    const[n,s]=ns[j],e=s+n.data.length;
    const ov=mg.map((v,k)=>[Math.max(v[0],s)-s,Math.min(v[1],e)-s,k]).filter(x=>x[0]<x[1]);
    for(let q=ov.length-1;q>=0;q--){
      const[a,b,k]=ov[q],mid=n.splitText(a);mid.splitText(b-a);
      const m=el("mark","ad-hl");m.dataset.g=k;mid.replaceWith(m);m.append(mid);
    }
  }
  box._mg=mg;
}
function memoHTML(m){
  if(!m||!((m.t&&m.t.trim())||(m.img&&m.img.length)))return "";
  return esc(m.t||"")+(m.img||[]).map(p=>'<img loading="lazy" src="'+esc(RAW+enc(p))+'">').join("");
}

/* ── 틀림 저장 형식(파일마다 다름) 읽고 쓰기 ── */
function setOf(k,fmt){
  const v=J(k,null);if(!v||typeof v!=="object")return new Set();
  if(Array.isArray(v)){
    if(fmt==="idx")return new Set(v.filter(x=>typeof x==="number").map(String));
    const s=new Set();v.forEach((x,i)=>{if(x)s.add(String(i))});return s;
  }
  return new Set(Object.keys(v).filter(i=>v[i]));
}
function setPut(k,fmt,set){
  if(fmt==="idx")LSs(k,JSON.stringify([...set].map(Number).filter(x=>!isNaN(x)).sort((a,b)=>a-b)));
  else{const o={};set.forEach(i=>o[i]=true);LSs(k,JSON.stringify(o))}
}

const CSS=`
.ad-bd b{font-size:.72em;font-weight:700;margin-left:6px;padding:0 5px;border-radius:5px;vertical-align:1px}
.ad-bd .ad-st{color:#d9a300;padding:0;font-size:.9em}
.ad-bd .ad-n{background:#e5485a;color:#fff}
.ad-x{margin-top:6px}
.ad-mm{margin-top:8px;padding:8px 10px;border-left:3px solid #e9a23b;background:rgba(233,162,59,.12);border-radius:0 6px 6px 0;white-space:pre-wrap;line-height:1.6}
.ad-mm img{display:block;max-width:100%;border-radius:6px;margin-top:6px}
.ad-bar button,.ad-ed button,.ad-sec button{font:inherit;font-size:.8em;padding:3px 9px;margin:6px 6px 0 0;border:1px solid rgba(128,128,128,.5);border-radius:6px;background:transparent;color:inherit;cursor:pointer}
.ad-bar button:disabled{opacity:.45}
.ad-ed textarea,.ad-sec textarea{display:block;width:100%;box-sizing:border-box;min-height:70px;margin-top:8px;font:inherit;font-size:.95em;padding:7px;border:1px solid rgba(128,128,128,.5);border-radius:6px;background:transparent;color:inherit}
.ad-th{display:inline-block;position:relative;margin:8px 8px 0 0}
.ad-th img{height:72px;border-radius:4px;display:block}
.ad-th b{position:absolute;top:-7px;right:-7px;background:#e5485a;color:#fff;border-radius:50%;width:22px;height:22px;line-height:22px;text-align:center;font-size:14px;cursor:pointer}
.ad-msg{font-size:.8em;opacity:.7}
mark.ad-hl{background:linear-gradient(transparent 38%,rgba(255,214,0,.75) 38%);color:inherit;padding:0 1px;border-radius:2px}
.ad-fab{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;font:600 15px/1 system-ui,sans-serif;padding:12px 18px;border-radius:24px;border:0;background:#ffd600;color:#222;box-shadow:0 3px 12px rgba(0,0,0,.25)}
.ad-fab.del{background:#444;color:#fff}
.ad-toast{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:99999;font:13px/1.4 system-ui,sans-serif;padding:7px 12px;border-radius:8px;background:#333;color:#fff;max-width:90%;text-align:center}
.ad-sec{margin:22px 0 10px;padding-top:12px;border-top:2px solid rgba(128,128,128,.35)}
.ad-sec h3{font-size:1em;margin:0 0 6px}
.ad-q{border:1px solid rgba(128,128,128,.35);border-radius:8px;padding:9px 11px;margin:8px 0}
.ad-q summary{cursor:pointer;font-weight:600}
.ad-q .a{margin-top:6px;white-space:pre-wrap}
.ad-q .ad-ctl{font-size:.85em;margin-top:6px;display:flex;gap:14px}
.ad-tag{font-size:.7em;font-weight:600;color:#3a7bd5;border:1px solid #3a7bd5;border-radius:4px;padding:0 4px;margin-right:6px;vertical-align:1px}
.ad-hide{display:none!important}
.ad-top{display:inline-block;margin:0 10px 6px 0;font-size:.9em}
`;
function addCSS(){if(document.getElementById("ad-css"))return;const s=el("style");s.id="ad-css";s.textContent=CSS;document.head.append(s)}

let toastT;
const AD=window.AD={REPO,RAW,API,enc,J,LSg,LSs,tok,b64,ub64,esc,today,plus,ymd,nameOf,IV,
  doc,get,op,load,push,paint,memoHTML,bump,cntOf,setOf,setPut,addCSS,el,btn,
  status(t){if(!document.body)return;let b=document.querySelector(".ad-toast");
    if(!t){if(b)b.remove();return}
    if(!b){b=el("div","ad-toast");document.body.append(b)}b.textContent=t;clearTimeout(toastT);toastT=setTimeout(()=>b.remove(),5000)}};

if(window.HUB)return;

/* ════════════ 복습 파일 화면 ════════════ */
addEventListener("load",()=>{
const all=[...document.querySelectorAll("details")];
if(!all.some(d=>d.querySelector(".a")))return;            // Q&A 형식이 아닌 파일은 건드리지 않음
addCSS();
document.querySelectorAll(".mm").forEach(x=>x.remove());   // 예전 메모 기능 UI는 이걸로 대체
const K0=typeof KEY!="undefined"?KEY:null;
const N=nameOf(K0||decodeURIComponent(SEG[SEG.length-1]||"x").replace(/\.html?$/i,""));
const ds=all, U={};
let FW=false,FS=false,FST=false;

function wcb(d){               // 이 문항의 '틀림' 체크박스 찾기
  const lab=[...d.querySelectorAll("label")].concat([...((d.closest(".q")||{}).children||[])].filter(x=>x.tagName==="LABEL"));
  const l=lab.find(x=>/틀림/.test(x.textContent));return l&&l.querySelector("input");
}
function cont(d){const p=d.parentElement;return p.querySelectorAll("details").length>1||p===document.body?d:p}

function deco(d,k,added){
  const s=d.querySelector("summary"),bd=el("span","ad-bd");if(s)s.append(bd);
  const ans=d.querySelector(".a");if(ans){ans.dataset.hl="a";ans.dataset.k=k}
  const x=el("div","ad-x"),box=el("div","ad-mm"),bar=el("div","ad-bar"),ed=el("div","ad-ed");
  box.dataset.hl="m";box.dataset.k=k;ed.style.display="none";
  const bs=btn("☆ 별표",()=>{op(N,["star",k],get(N,["star",k])?null:1);upd(k);filt()});
  const bm=btn("＋ 메모",()=>editMemo(k));
  const bw=btn("✗ 또 틀림",()=>{if(bump(N,k,true)){upd(k);AD.status("틀린 횟수 +1")}});
  bar.append(bs,bm,bw);
  if(added)bar.append(btn("문제 수정",()=>addForm(k)),btn("삭제",()=>delAdded(k)));
  x.append(box,bar,ed);d.append(x);
  U[k]={d,bd,ans,box,bar,ed,bs,bm,bw,added};upd(k);
}
function isWrong(k){const u=U[k];if(!u)return false;if(u.added)return!!get(N,["aw",k]);const c=wcb(u.d);return!!(c&&c.checked)}
function upd(k){
  const u=U[k];if(!u)return;
  const st=get(N,["star",k]),w=isWrong(k),n=cntOf(N,k,w),m=get(N,[k]);
  u.bd.innerHTML=(st?'<b class="ad-st">★</b>':"")+(n>=2?'<b class="ad-n">'+(n>=3?"3회+":n+"회")+"</b>":"");
  u.bs.textContent=st?"★ 별표 해제":"☆ 별표";
  const h=memoHTML(m);u.box.innerHTML=h;u.box.style.display=h?"":"none";u.bm.textContent=h?"메모 수정":"＋ 메모";
  const c=get(N,["cnt",k]);u.bw.style.display=(w&&!(c&&c.d===today()))?"":"none";   // 오늘 이미 센 건 숨김
  paint(u.ans,get(N,["hl",k,"a"]));paint(u.box,get(N,["hl",k,"m"]));
}
function thumb(src,rm){const w=el("span","ad-th"),im=el("img"),x=el("b",null,"×");im.src=src;x.onclick=rm;w.append(im,x);return w}
function editMemo(k){
  const u=U[k],m=get(N,[k])||{},imgs=(m.img||[]).slice(),adds=[];
  const ta=el("textarea");ta.value=m.t||"";ta.placeholder="모르는 단어 뜻, 보충 설명…";
  const th=el("div"),fi=el("input"),st=el("span","ad-msg");
  fi.type="file";fi.accept="image/*";fi.multiple=true;fi.style.display="none";
  const draw=()=>{th.innerHTML="";
    imgs.forEach((p,j)=>th.append(thumb(RAW+enc(p),()=>{imgs.splice(j,1);draw()})));
    adds.forEach((a,j)=>th.append(thumb(a.url,()=>{adds.splice(j,1);draw()})))};
  fi.onchange=async()=>{for(const f of fi.files){try{adds.push(await shrink(f))}catch(e){st.textContent=e.message}}fi.value="";draw()};
  const close=()=>{u.ed.innerHTML="";u.ed.style.display="none";u.bar.style.display="";upd(k)};
  const ok=btn("저장",async()=>{
    ok.disabled=true;
    try{
      const ps=[];
      for(let j=0;j<adds.length;j++){st.textContent="사진 올리는 중 "+(j+1)+"/"+adds.length;ps.push(await upImg(N,k,adds[j].b64))}
      const t=ta.value.replace(/\s+$/,""),all=imgs.concat(ps);
      op(N,[k],(t||all.length)?{t:t,img:all}:null);close();
    }catch(e){st.textContent="저장 실패: "+e.message;ok.disabled=false}
  });
  u.ed.innerHTML="";u.ed.append(ta,th,fi,btn("사진 추가",()=>fi.click()),ok,btn("취소",close),st);
  u.bar.style.display="none";u.ed.style.display="";draw();ta.focus();
}

/* ── 직접 추가한 문제 ── */
const sec=el("div","ad-sec"),list=el("div"),form=el("div","ad-ed");
sec.append(el("h3",null,"직접 추가한 문제"),list,btn("＋ 문제 추가",()=>addForm(null)),form);
(()=>{const c=cont(ds[ds.length-1]),p=c.parentElement;(p===document.body?c:p).after(sec)})();
function addForm(id){
  const a=id?get(N,["add",id])||{}:{};
  const q=el("textarea"),an=el("textarea");q.placeholder="문제";an.placeholder="답";q.value=a.q||"";an.value=a.a||"";q.style.minHeight="48px";
  const close=()=>{form.innerHTML=""};
  form.innerHTML="";
  form.append(q,an,btn(id?"수정 저장":"추가",()=>{
    const qq=q.value.trim(),aa=an.value.trim();if(!qq){q.focus();return}
    const k=id||"a"+Date.now().toString(36);
    op(N,["add",k],{q:qq,a:aa,c:a.c||Date.now()});close();renderAdded();
    if(!id)AD.status("문제를 추가했어요");
  }),btn("취소",close));
  (id?U[id].d.closest(".ad-q"):form).scrollIntoView({block:"center"});q.focus();
}
function delAdded(id){
  if(!confirm("이 문제를 삭제할까요?"))return;
  ["add","aw","as","star","cnt","srs"].forEach(s=>{if(get(N,[s,id])!=null)op(N,[s,id],null)});
  if(get(N,[id])!=null)op(N,[id],null);
  if(get(N,["hl",id])!=null)op(N,["hl",id],null);
  renderAdded();
}
function renderAdded(){
  Object.keys(U).forEach(k=>{if(U[k].added)delete U[k]});list.innerHTML="";
  const A=get(N,["add"])||{},ids=Object.keys(A).sort((x,y)=>(A[x].c||0)-(A[y].c||0));
  if(!ids.length)list.append(el("div","ad-msg","전화스터디 외에 필요한 문제를 여기에 직접 추가할 수 있어요."));
  ids.forEach(id=>{
    const w=el("div","ad-q"),d=el("details"),s=el("summary"),a=el("div","a",A[id].a||"");
    s.append(el("span","ad-tag","추가"),document.createTextNode(A[id].q));d.append(s,a);
    const ctl=el("div","ad-ctl");
    const mk=(txt,key)=>{const l=el("label"),c=el("input");c.type="checkbox";c.checked=!!get(N,[key,id]);
      c.onchange=()=>{op(N,[key,id],c.checked?1:null);if(key==="aw"&&c.checked)bump(N,id,false);upd(id);filt()};l.append(c," "+txt);return l};
    ctl.append(mk("틀림","aw"),mk("숙지","as"));w.append(d,ctl);list.append(w);deco(d,id,true);
  });
  filt();
}

/* ── 필터: 페이지의 '틀린 것만'·'숙지 숨기기'를 추가 문제에도 적용 + 별표만 보기 ── */
function filt(){
  Object.keys(U).forEach(k=>{
    const u=U[k],st=!!get(N,["star",k]);
    if(u.added){const box=u.d.closest(".ad-q");
      box.classList.toggle("ad-hide",(FW&&!get(N,["aw",k]))||(FS&&!!get(N,["as",k]))||(FST&&!st));return}
    const c=cont(u.d);c.classList.toggle("ad-hide",FST&&!st);
    const nx=u.d.nextElementSibling;if(c===u.d&&nx&&nx.tagName==="LABEL"&&/숙지/.test(nx.textContent))nx.classList.toggle("ad-hide",FST&&!st);
  });
}
const tl=el("label","ad-top"),tc=el("input");tc.type="checkbox";tc.onchange=()=>{FST=tc.checked;filt()};tl.append(tc," ★ 별표만");
document.body.prepend(tl);

document.addEventListener("change",e=>{
  const t=e.target;if(t.type!=="checkbox"||t===tc||t.closest(".ad-q"))return;
  const lb=t.closest("label"),tx=lb?lb.textContent:"";
  if(/틀린 것만/.test(tx)){FW=t.checked;filt();return}
  if(/숙지 숨기기/.test(tx)){FS=t.checked;filt();return}
  if(!/틀림/.test(tx))return;
  let d=t.closest("details");
  if(!d){const q=t.closest(".q")||(lb&&lb.parentElement);d=q&&q.querySelector("details")}
  const i=ds.indexOf(d);if(i<0)return;
  if(t.checked)bump(N,String(i),false);upd(String(i));
},true);

/* ── 형광펜: 글자를 드래그하면 아래에 버튼 ── */
const fab=el("button","ad-fab");fab.type="button";fab.style.display="none";document.body.append(fab);
let cur=null,hideT;
const show=(t,del)=>{clearTimeout(hideT);fab.textContent=t;fab.classList.toggle("del",!!del);fab.style.display=""};
const hide=()=>{fab.style.display="none";cur=null};
document.addEventListener("selectionchange",()=>{
  const s=getSelection();
  if(!s.rangeCount||s.isCollapsed){if(cur&&cur.t==="add"){clearTimeout(hideT);hideT=setTimeout(hide,400)}return}
  const r=s.getRangeAt(0),n=r.commonAncestorContainer,c=(n.nodeType===1?n:n.parentElement).closest("[data-hl]");
  const t=s.toString().trim();
  if(!c||!t||t.length>400||!c.textContent.includes(t)){if(cur&&cur.t==="add")hide();return}
  cur={t:"add",c:c,text:t};show("🖍 형광펜");
});
document.addEventListener("click",e=>{
  if(e.target===fab)return;
  const m=e.target.closest&&e.target.closest("mark.ad-hl");
  if(m&&getSelection().isCollapsed){cur={t:"del",c:m.closest("[data-hl]"),g:+m.dataset.g};show("형광펜 지우기",1);return}
  if(cur&&cur.t==="del")hide();
});
function act(e){
  e.preventDefault();e.stopPropagation();if(!cur)return;
  const c=cur.c,k=c.dataset.k,part=c.dataset.hl,p=["hl",k,part];let l=(get(N,p)||[]).slice();
  if(cur.t==="add"){if(!l.includes(cur.text))l.push(cur.text);try{getSelection().removeAllRanges()}catch(x){}}
  else{const g=(c._mg||[])[cur.g];if(g)l=l.filter(x=>!g[2].includes(x))}
  op(N,p,l.length?l:null);upd(k);hide();
}
fab.addEventListener("touchstart",act,{passive:false});
fab.addEventListener("mousedown",act);

ds.forEach((d,i)=>deco(d,String(i)));
renderAdded();
load(N).then(()=>{Object.keys(U).forEach(k=>{if(!U[k].added&&U[k].ed.style.display==="none")upd(k)});
  if(!Object.values(U).some(u=>u.added&&u.ed.style.display!=="none")&&!form.innerHTML)renderAdded()});
});
})();
