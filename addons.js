/* addons.js — 복습 파일 공통 기능
   메모 · 형광펜 · 단어장(키워드) · 별표 · 애매 · 문제 직접 추가 · 틀린 횟수 · 복습 주기 · 겹치는 문제 연동
   허브(index.html)도 이 파일의 공용 함수(window.AD)를 씀.
   기능을 고치거나 추가할 땐 이 파일 하나만 바꿔 올리면 전체 적용됨. */
(()=>{
const H=location.hostname, SEG=location.pathname.split("/").filter(Boolean);
const REPO=/\.github\.io$/.test(H)&&SEG.length?H.split(".")[0]+"/"+SEG[0]:"mujang0423-alt/mu";
const BR="main", RAW="https://raw.githubusercontent.com/"+REPO+"/"+BR+"/", API="https://api.github.com/repos/"+REPO+"/contents/";
const DIR=location.pathname.replace(/[^/]*$/,"");
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
const KWN="_kw";                        // 단어장(키워드) 데이터: memo/_kw.json

/* ── 파일별 데이터(memo/<이름>.json): 메모·형광펜·별표·애매·추가문제·틀린횟수·복습일정 ── */
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

/* ── 형광펜·키워드: 저장된 구절을 찾아 <mark>로 감쌈 ── */
function wrap(box,ps,cls){
  const tw=document.createTreeWalker(box,NodeFilter.SHOW_TEXT),ns=[];let full="";
  while(tw.nextNode()){ns.push([tw.currentNode,full.length]);full+=tw.currentNode.data}
  const iv=[];
  ps.forEach(p=>{if(!p)return;let k=0;while((k=full.indexOf(p,k))>=0){iv.push([k,k+p.length,p]);k+=p.length}});
  iv.sort((a,b)=>a[0]-b[0]||b[1]-a[1]);
  const mg=[];
  iv.forEach(v=>{const l=mg[mg.length-1];if(l&&v[0]<l[1]){l[1]=Math.max(l[1],v[1]);if(!l[2].includes(v[2]))l[2].push(v[2])}else mg.push([v[0],v[1],[v[2]]])});
  for(let j=ns.length-1;j>=0;j--){
    const[n,s]=ns[j],e=s+n.data.length;
    const ov=mg.map((v,k)=>[Math.max(v[0],s)-s,Math.min(v[1],e)-s,k]).filter(x=>x[0]<x[1]);
    for(let q=ov.length-1;q>=0;q--){
      const[a,b,k]=ov[q],mid=n.splitText(a);mid.splitText(b-a);
      const m=el("mark",cls);m.dataset.g=k;mid.replaceWith(m);m.append(mid);
    }
  }
  return mg;
}
const kwList=()=>Object.keys(get(KWN,["w"])||{});
function paint(box,ps){
  if(!box)return;
  box.querySelectorAll("mark.ad-hl,mark.ad-kw").forEach(m=>m.replaceWith(...m.childNodes));box.normalize();
  box._mg=(ps&&ps.length)?wrap(box,ps,"ad-hl"):[];
  const kw=kwList();box._kg=kw.length?wrap(box,kw,"ad-kw"):[];
}
function memoHTML(m){
  if(!m||!((m.t&&m.t.trim())||(m.img&&m.img.length)))return "";
  return esc(m.t||"")+(m.img||[]).map(p=>'<img loading="lazy" src="'+esc(RAW+enc(p))+'">').join("");
}

/* ── 메모 편집기(파일·허브 공용): host 안에 입력칸을 띄움 ── */
function thumb(src,rm){const w=el("span","ad-th"),im=el("img"),x=el("b",null,"×");im.src=src;x.onclick=rm;w.append(im,x);return w}
function editMemo(N,k,host,done){
  const m=get(N,[k])||{},imgs=(m.img||[]).slice(),adds=[];
  const ta=el("textarea");ta.value=m.t||"";ta.placeholder="모르는 단어 뜻, 보충 설명…";
  const th=el("div"),fi=el("input"),st=el("span","ad-msg");
  fi.type="file";fi.accept="image/*";fi.multiple=true;fi.style.display="none";
  const draw=()=>{th.innerHTML="";
    imgs.forEach((p,j)=>th.append(thumb(RAW+enc(p),()=>{imgs.splice(j,1);draw()})));
    adds.forEach((a,j)=>th.append(thumb(a.url,()=>{adds.splice(j,1);draw()})))};
  fi.onchange=async()=>{for(const f of fi.files){try{adds.push(await shrink(f))}catch(e){st.textContent=e.message}}fi.value="";draw()};
  const close=()=>{host.innerHTML="";host.style.display="none";done&&done()};
  const ok=btn("저장",async()=>{
    ok.disabled=true;
    try{
      const ps=[];
      for(let j=0;j<adds.length;j++){st.textContent="사진 올리는 중 "+(j+1)+"/"+adds.length;ps.push(await upImg(N,k,adds[j].b64))}
      const t=ta.value.replace(/\s+$/,""),all=imgs.concat(ps);
      op(N,[k],(t||all.length)?{t:t,img:all}:null);close();
    }catch(e){st.textContent="저장 실패: "+e.message;ok.disabled=false}
  });
  host.innerHTML="";host.classList.add("ad-ed");host.append(ta,th,fi,btn("사진 추가",()=>fi.click()),ok,btn("취소",close),st);
  host.style.display="";draw();ta.focus();
}

/* ── 문항 인식(답이 .a 든 <p> 든 다 됨) ── */
const NOTQ="label,input,.mm,.ad-x,.ad-bd,script,style,button";
function ansOf(d){return d.querySelector(".a")||[...d.children].find(c=>c.tagName!=="SUMMARY"&&!c.matches(NOTQ))||null}
function qOf(d){const s=d.querySelector("summary");if(!s)return "";const c=s.cloneNode(true);c.querySelectorAll(".ad-bd,.ad-tag").forEach(x=>x.remove());return c.textContent.replace(/^\s*\d+\s*[.)]\s*/,"").replace(/\s+/g," ").trim()}
function aOf(d){const a=ansOf(d);if(!a)return "";const c=a.cloneNode(true);c.querySelectorAll(".ad-x,.mm").forEach(x=>x.remove());return c.textContent.trim()}
const qDets=root=>[...root.querySelectorAll("details")].filter(d=>!d.closest(".ad-q"));
const qaOfDoc=root=>qDets(root).map(d=>[qOf(d),aOf(d)]);
/* 같은 문제 판별용: 번호·띄어쓰기·문장부호 무시 */
const qn=q=>String(q||"").replace(/^\s*(\d+\s*[.)]?|Q\s*[.:)])\s*/i,"").toLowerCase().replace(/[^0-9a-z가-힣ㄱ-ㅎ一-鿿]/g,"");
const qh=q=>{const n=qn(q);return n.length>=8?n:""};

/* ── 틀림 저장 형식(파일마다 다름) 읽고 쓰기: idx=[3,5] / bool=[0,0,0,1] / obj={"3":1} ── */
const rawOf=k=>{try{return JSON.parse(LSg(k))}catch(e){return null}};
function guess(v){
  if(!Array.isArray(v))return "obj";
  if(v.some(x=>typeof x==="boolean"||x===null))return "bool";
  if(v.length>=3&&v.every(x=>x===0||x===1))return "bool";
  return "idx";
}
function setOf(k,fmt){
  const v=rawOf(k);if(!v||typeof v!=="object")return new Set();
  if(Array.isArray(v)){
    const f=(fmt==="idx"||fmt==="bool")?fmt:(fmt==="obj"?"bool":guess(v));
    if(f==="idx")return new Set(v.filter(x=>typeof x==="number").map(String));
    const s=new Set();v.forEach((x,i)=>{if(x)s.add(String(i))});return s;
  }
  return new Set(Object.keys(v).filter(i=>v[i]));
}
function setPut(k,fmt,set){
  const v=rawOf(k),ids=[...set].map(Number).filter(x=>!isNaN(x)&&x>=0).sort((a,b)=>a-b);
  let f=fmt;
  if(f!=="idx"&&f!=="bool")f=Array.isArray(v)?(f==="obj"?"bool":guess(v)):"obj";
  if(f==="idx"){LSs(k,JSON.stringify(ids));return}
  if(f==="bool"){
    const old=Array.isArray(v)?v:[],num=old.some(x=>x===1||x===0);
    const len=Math.max(old.length,ids.length?ids[ids.length-1]+1:0),o=[];
    for(let i=0;i<len;i++)o.push(set.has(String(i))?(num?1:true):(num?0:false));
    LSs(k,JSON.stringify(o));return;
  }
  const one=(v&&typeof v==="object"&&!Array.isArray(v)&&Object.values(v).some(x=>x===1))?1:true,o={};
  ids.forEach(i=>o[i]=one);LSs(k,JSON.stringify(o));
}

/* ── 파일 목록 정보(ad-index.json): 파일별 KEY·틀림형식·번호차이 + 겹치는 문제 묶음 ── */
let IDX={files:{},dup:[]},DUP={};
function useIndex(x){
  if(!x||!x.files)return;IDX=x;DUP={};
  (x.dup||[]).forEach(g=>g.forEach(([f,k])=>{DUP[f+"\n"+k]=g}));
}
useIndex(J("ad-index",null));
async function loadIndex(){
  try{const r=await fetch(DIR+"ad-index.json?t="+Date.now(),{cache:"no-store"});if(r.ok){const x=await r.json();useIndex(x);LSs("ad-index",JSON.stringify(x))}}catch(e){}
  return IDX;
}
const learned=()=>J("ad-reg",{});
function regOf(f){const r=IDX.files[f]||{},l=learned()[f]||{};return{k:r.k!==undefined?r.k:l.k,f:l.f||r.f,o:(l.o!=null?l.o:r.o)||0,n:r.n}}
const docOf=f=>{const r=regOf(f);return nameOf(r.k||String(f).replace(/\.html?$/i,""))};
const sukKey=f=>{const r=regOf(f);return (r.k?r.k:DIR+encodeURIComponent(f))+"-d"};
const dupOf=(f,k)=>DUP[f+"\n"+k]||null;

/* 한 문항의 표시 하나를 직접 저장(다른 파일 것도 가능) — kind: w 틀림 / s 숙지 / amb 애매 / star 별표 */
function flag(f,k,kind,v){
  if(kind==="w"){const r=regOf(f);if(!r.k)return;const s=setOf(r.k,r.f),id=String(+k+(r.o||0));v?s.add(id):s.delete(id);setPut(r.k,r.f,s);return}
  if(kind==="s"){const K=sukKey(f),s=setOf(K,"obj");v?s.add(String(k)):s.delete(String(k));setPut(K,"obj",s);return}
  op(docOf(f),[kind,k],v?1:null);
}
function isFlag(f,k,kind){
  if(kind==="w"){const r=regOf(f);return !!r.k&&setOf(r.k,r.f).has(String(+k+(r.o||0)))}
  if(kind==="s")return setOf(sukKey(f),"obj").has(String(k));
  return !!get(docOf(f),[kind,k]);
}
/* 겹치는 문제에도 같이 적용. self 파일의 문항은 local(k,kind,v)로 처리 */
function link(f,k,kind,v,self,local){
  const g=dupOf(f,k);if(!g)return 0;let n=0;
  g.forEach(([f2,k2])=>{
    if(f2===f&&String(k2)===String(k))return;
    if(isFlag(f2,k2,kind)===!!v)return;
    if(self&&f2===self&&local)local(String(k2),kind,v);else flag(f2,String(k2),kind,v);
    n++;
  });
  return n;
}

/* ── 단어장(키워드) ── */
const kwAdd=(w,f,k)=>{w=w.trim();if(!w)return;if(get(KWN,["w",w]))return;op(KWN,["w",w],{c:Date.now(),f:f||"",k:k==null?"":String(k)})};
const kwDel=w=>op(KWN,["w",w],null);

const CSS=`
.ad-bd b{font-size:.72em;font-weight:700;margin-left:6px;padding:0 5px;border-radius:5px;vertical-align:1px}
.ad-bd .ad-st{color:#d9a300;padding:0;font-size:.9em}
.ad-bd .ad-n{background:#e5485a;color:#fff}
.ad-bd .ad-am{background:#8a63d2;color:#fff}
.ad-x{margin-top:6px}
.ad-mm{margin-top:8px;padding:8px 10px;border-left:3px solid #e9a23b;background:rgba(233,162,59,.12);border-radius:0 6px 6px 0;white-space:pre-wrap;line-height:1.6}
.ad-mm img{display:block;max-width:100%;border-radius:6px;margin-top:6px}
.ad-bar button,.ad-ed button,.ad-sec button{font:inherit;font-size:.8em;padding:3px 9px;margin:6px 6px 0 0;border:1px solid rgba(128,128,128,.5);border-radius:6px;background:transparent;color:inherit;cursor:pointer}
.ad-bar button:disabled{opacity:.45}
.ad-bar label{font-size:.8em;margin:6px 8px 0 0;display:inline-block;cursor:pointer;color:#8a63d2!important}
.ad-lk{font-size:.75em;opacity:.6;margin-left:4px}
.ad-ed textarea,.ad-sec textarea{display:block;width:100%;box-sizing:border-box;min-height:70px;margin-top:8px;font:inherit;font-size:.95em;padding:7px;border:1px solid rgba(128,128,128,.5);border-radius:6px;background:transparent;color:inherit}
.ad-th{display:inline-block;position:relative;margin:8px 8px 0 0}
.ad-th img{height:72px;border-radius:4px;display:block}
.ad-th b{position:absolute;top:-7px;right:-7px;background:#e5485a;color:#fff;border-radius:50%;width:22px;height:22px;line-height:22px;text-align:center;font-size:14px;cursor:pointer}
.ad-msg{font-size:.8em;opacity:.7}
mark.ad-hl{background:linear-gradient(transparent 38%,rgba(255,214,0,.75) 38%);color:inherit;padding:0 1px;border-radius:2px}
mark.ad-kw{background:none;color:inherit;border-bottom:2px solid #3a7bd5;box-shadow:inset 0 -.35em rgba(58,123,213,.18);padding:0 1px;font-weight:600}
.ad-fab{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;display:flex;gap:8px}
.ad-fab button{font:600 15px/1 system-ui,sans-serif;padding:12px 16px;border-radius:24px;border:0;background:#ffd600;color:#222;box-shadow:0 3px 12px rgba(0,0,0,.25);white-space:nowrap}
.ad-fab button.kw{background:#3a7bd5;color:#fff}
.ad-fab button.del{background:#444;color:#fff}
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

/* ── 글자 드래그 → 🖍 형광펜 / 📌 단어장 버튼 (파일·허브 공용)
   대상: data-hl(a|m|q) · data-k(문항) · data-n(문서이름) · data-f(파일명) 이 붙은 요소 ── */
function fab(defN,defF,repaint){
  const box=el("div","ad-fab");box.style.display="none";document.body.append(box);
  let cur=null,hideT;
  const hide=()=>{box.style.display="none";box.innerHTML="";cur=null};
  const tgt=c=>({c,n:c.dataset.n||defN,f:c.dataset.f||defF,k:c.dataset.k,part:c.dataset.hl});
  const show=bs=>{clearTimeout(hideT);box.innerHTML="";bs.forEach(([t,cls,f])=>{const b=el("button",cls,t);b.type="button";
    const go=e=>{e.preventDefault();e.stopPropagation();f();hide()};b.addEventListener("touchstart",go,{passive:false});b.addEventListener("mousedown",go);box.append(b)});
    box.style.display=""};
  const clr=()=>{try{getSelection().removeAllRanges()}catch(x){}};
  document.addEventListener("selectionchange",()=>{
    const s=getSelection();
    if(!s.rangeCount||s.isCollapsed){if(cur&&cur.t==="add"){clearTimeout(hideT);hideT=setTimeout(hide,400)}return}
    const r=s.getRangeAt(0),n=r.commonAncestorContainer,c=(n.nodeType===1?n:n.parentElement).closest("[data-hl]");
    const raw=s.toString().trim(),t=raw.replace(/\s+/g," ");
    if(!c||!t||t.length>400||!c.textContent.includes(raw)){if(cur&&cur.t==="add")hide();return}
    const g=tgt(c);cur={t:"add"};
    const bs=[["🖍 형광펜","",()=>{const p=["hl",g.k,g.part],l=(get(g.n,p)||[]).slice();if(!l.includes(raw))l.push(raw);op(g.n,p,l);clr();repaint(g)}]];
    if(t.length<=40)bs.push(["📌 단어장","kw",()=>{if(get(KWN,["w",t]))AD.status("이미 단어장에 있어요");else{kwAdd(t,g.f,g.k);AD.status("단어장에 넣었어요: "+t)}clr();repaint(null)}]);
    show(bs);
  });
  document.addEventListener("click",e=>{
    if(box.contains(e.target))return;
    const t=e.target.closest&&e.target,mh=t&&t.closest("mark.ad-hl"),mk=t&&t.closest("mark.ad-kw");
    if((mh||mk)&&getSelection().isCollapsed){
      const c=(mh||mk).closest("[data-hl]");if(!c)return;const g=tgt(c),bs=[];
      if(mh)bs.push(["형광펜 지우기","del",()=>{const p=["hl",g.k,g.part],m=(c._mg||[])[+mh.dataset.g];let l=(get(g.n,p)||[]).slice();if(m)l=l.filter(x=>!m[2].includes(x));op(g.n,p,l.length?l:null);repaint(g)}]);
      if(mk){const m=(c._kg||[])[+mk.dataset.g],ws=m?m[2]:[];
        if(AD.openKw)bs.push(["📖 단어장 보기","kw",()=>AD.openKw(ws[0])]);
        bs.push(["단어장에서 빼기","del",()=>{if(confirm("'"+ws.join(", ")+"' 를 단어장에서 뺄까요? (단어 메모도 지워져요)")){ws.forEach(kwDel);repaint(null)}}])}
      show(bs);e.preventDefault();return;
    }
    if(cur&&cur.t!=="add")hide();
  },true);
}

let toastT;
const AD=window.AD={REPO,RAW,API,DIR,KWN,enc,J,LSg,LSs,tok,b64,ub64,esc,today,plus,ymd,nameOf,IV,
  doc,get,op,load,push,put,paint,memoHTML,editMemo,bump,cntOf,setOf,setPut,rawOf,addCSS,el,btn,
  ansOf,qOf,aOf,qaOfDoc,qn,qh,loadIndex,useIndex,regOf,docOf,sukKey,dupOf,flag,isFlag,link,kwList,kwAdd,kwDel,fab,
  idx:()=>IDX,
  status(t){if(!document.body)return;let b=document.querySelector(".ad-toast");
    if(!t){if(b)b.remove();return}
    if(!b){b=el("div","ad-toast");document.body.append(b)}b.textContent=t;clearTimeout(toastT);toastT=setTimeout(()=>b.remove(),5000)}};

if(window.HUB)return;

/* ════════════ 복습 파일 화면 ════════════ */
addEventListener("load",()=>{
if(location.hash==="#hubscan")return;                         // 허브가 문제 목록만 읽어갈 때
const all0=qDets(document);
if(!all0.some(d=>!d.closest("nav,.toc")&&ansOf(d)))return;   // Q&A 형식이 아닌 파일은 건드리지 않음
addCSS();
document.querySelectorAll(".mm").forEach(x=>x.remove());   // 예전 메모 기능 UI는 이걸로 대체
const K0=typeof KEY!="undefined"?KEY:null;
const FN=decodeURIComponent(SEG[SEG.length-1]||"x");
const N=nameOf(K0||FN.replace(/\.html?$/i,""));
const U={},N0=all0.length,QI={};
all0.forEach((d,i)=>{const h=qn(qOf(d));(QI[h]=QI[h]||[]).push(i)});
let FW=false,FS=false,FST=false,FAM=false,LOCK=0;

const tx=(l,re)=>re.test(l.textContent);
function near(d,re,bare){        // 이 문항 옆의 체크박스(틀림/숙지) 찾기
  let l=[...d.querySelectorAll("label")].find(x=>tx(x,re)&&!x.closest(".ad-x"));if(l)return l.querySelector("input");
  const c=d.parentElement;
  if(c&&c!==document.body&&qDets(c).length===1){
    l=[...c.querySelectorAll("label")].find(x=>!d.contains(x)&&tx(x,re));if(l)return l.querySelector("input");
    if(bare){const b=[...c.children].find(x=>x.matches("input[type=checkbox]"));if(b)return b}
  }
  for(let n=d.nextElementSibling;n&&n.tagName!=="DETAILS";n=n.nextElementSibling)if(n.tagName==="LABEL"&&tx(n,re))return n.querySelector("input");
  for(let n=d.previousElementSibling;n&&n.tagName!=="DETAILS";n=n.previousElementSibling){if(n.tagName==="LABEL"&&tx(n,re))return n.querySelector("input");if(bare&&n.matches("input[type=checkbox]"))return n}
  return null;
}
const wcb=d=>near(d,/틀림/,1), scb=d=>near(d,/숙지(?!\s*숨)/,0);
function detOf(t){
  const d0=t.closest("details");if(d0&&!d0.closest(".ad-q"))return d0;
  const lb=t.closest("label")||t,c=lb.parentElement;
  if(c&&c!==document.body){const ds=qDets(c);if(ds.length===1)return ds[0]}
  for(let n=lb.previousElementSibling;n;n=n.previousElementSibling)if(n.tagName==="DETAILS")return n;
  for(let n=lb.nextElementSibling;n;n=n.nextElementSibling)if(n.tagName==="DETAILS")return n;
  return null;
}
function cont(d){const p=d.parentElement;return qDets(p).length>1||p===document.body?d:p}

function deco(d,k,added){
  d._k=k;d._ad=1;
  const s=d.querySelector("summary"),bd=el("span","ad-bd");if(s){s.append(bd);s.dataset.hl="q";s.dataset.k=k}
  const ans=ansOf(d);if(ans){ans.dataset.hl="a";ans.dataset.k=k}
  const x=el("div","ad-x"),box=el("div","ad-mm"),bar=el("div","ad-bar"),ed=el("div","ad-ed");
  box.dataset.hl="m";box.dataset.k=k;ed.style.display="none";
  const bs=btn("☆ 별표",()=>{const v=!get(N,["star",k]);op(N,["star",k],v?1:null);lk("star",k,v);upd(k);filt()});
  const bm=btn("＋ 메모",()=>{bar.style.display="none";editMemo(N,k,ed,()=>{bar.style.display="";upd(k)})});
  const bw=btn("✗ 또 틀림",()=>{if(bump(N,k,true)){upd(k);AD.status("틀린 횟수 +1")}});
  const al=el("label"),ac=el("input");ac.type="checkbox";al.append(ac," 애매");
  ac.onchange=()=>{op(N,["amb",k],ac.checked?1:null);lk("amb",k,ac.checked);upd(k);filt()};
  const li=el("span","ad-lk");
  bar.append(bs,bm,bw);
  if(added)bar.append(btn("문제 수정",()=>addForm(k)),btn("삭제",()=>delAdded(k)));
  else bar.append(al,li);
  x.append(box,bar,ed);d.append(x);
  U[k]={d,bd,ans,s,box,bar,ed,bs,bm,bw,ac,li,added};upd(k);
}
function isWrong(k){const u=U[k];if(!u)return false;if(u.added)return!!get(N,["aw",k]);const c=wcb(u.d);return!!(c&&c.checked)}
function upd(k){
  const u=U[k];if(!u)return;
  const st=get(N,["star",k]),am=get(N,["amb",k]),w=isWrong(k),n=cntOf(N,k,w),m=get(N,[k]);
  u.bd.innerHTML=(st?'<b class="ad-st">★</b>':"")+(am?'<b class="ad-am">애매</b>':"")+(n>=2?'<b class="ad-n">'+(n>=3?"3회+":n+"회")+"</b>":"");
  u.bs.textContent=st?"★ 별표 해제":"☆ 별표";
  if(u.ac)u.ac.checked=!!am;
  const h=memoHTML(m);u.box.innerHTML=h;u.box.style.display=h?"":"none";u.bm.textContent=h?"메모 수정":"＋ 메모";
  const c=get(N,["cnt",k]);u.bw.style.display=(w&&!(c&&c.d===today()))?"":"none";   // 오늘 이미 센 건 숨김
  if(u.li){const g=dupOf(FN,k);u.li.textContent=g?"🔗 겹치는 문제 "+(g.length-1)+"곳 같이 체크":""}
  paint(u.ans,get(N,["hl",k,"a"]));paint(u.box,get(N,["hl",k,"m"]));
  if(u.s){u.bd.remove();paint(u.s,get(N,["hl",k,"q"]));u.s.append(u.bd)}
}
const updAll=()=>Object.keys(U).forEach(upd);

/* 겹치는 문제 같이 체크: 같은 파일 안이면 그 체크박스를 직접 눌러줌 */
function local(k2,kind,v){
  const u=U[k2];if(!u)return;
  if(kind==="w"||kind==="s"){const c=kind==="w"?wcb(u.d):scb(u.d);if(c&&c.checked!==!!v){LOCK++;try{c.click()}finally{LOCK--}}}
  else op(N,[kind,k2],v?1:null);
  upd(k2);
}
function lk(kind,k,v){const n=link(FN,k,kind,v,FN,local);if(n)AD.status("겹치는 문제 "+n+"곳에도 같이 표시했어요")}

/* 이 파일의 틀림 저장 형식을 실제 저장값으로 알아냄 → 허브·연동에 씀 */
function learn(k,before){
  if(!K0)return;
  setTimeout(()=>{
    const aft=LSg(K0);if(aft===before)return;
    let a,b;try{a=JSON.parse(aft);b=JSON.parse(before)}catch(e){return}
    const sets=(v,f)=>{if(!v||typeof v!=="object")return new Set();if(!Array.isArray(v))return new Set(Object.keys(v).filter(i=>v[i]));
      if(f==="idx")return new Set(v.filter(x=>typeof x==="number").map(String));const s=new Set();v.forEach((x,i)=>{if(x)s.add(String(i))});return s};
    const fs=Array.isArray(a)?["idx","bool"]:["obj"];
    for(const f of fs){const A1=sets(a,f),B1=sets(b,f),df=[...A1].filter(x=>!B1.has(x)).concat([...B1].filter(x=>!A1.has(x)));
      if(df.length===1){const o=+df[0]-(+k),L=learned(),r=IDX.files[FN]||{};
        if(r.f!==f||(r.o||0)!==o||r.k!==K0){L[FN]={k:K0,f:f,o:o};LSs("ad-reg",JSON.stringify(L))}return}}
  },60);
}

/* ── 직접 추가한 문제 ── */
const sec=el("div","ad-sec"),list=el("div"),form=el("div","ad-ed");
sec.append(el("h3",null,"직접 추가한 문제"),list,btn("＋ 문제 추가",()=>addForm(null)),form);
(()=>{const c=cont(all0[all0.length-1]),p=c.parentElement;(p===document.body?c:p).after(sec)})();
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
  ["add","aw","as","star","amb","cnt","srs"].forEach(s=>{if(get(N,[s,id])!=null)op(N,[s,id],null)});
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
    ctl.append(mk("틀림","aw"),mk("숙지","as"),mk("애매","amb"));w.append(d,ctl);list.append(w);deco(d,id,true);
  });
  filt();
}

/* ── 필터: 페이지의 '틀린 것만'·'숙지 숨기기'를 추가 문제에도 적용 + 별표만·애매만 보기 ── */
function filt(){
  Object.keys(U).forEach(k=>{
    const u=U[k],st=!!get(N,["star",k]),am=!!get(N,["amb",k]),hd=(FST&&!st)||(FAM&&!am);
    if(u.added){const box=u.d.closest(".ad-q");if(!box)return;
      box.classList.toggle("ad-hide",(FW&&!get(N,["aw",k]))||(FS&&!!get(N,["as",k]))||hd);return}
    if(!u.d.isConnected)return;
    const c=cont(u.d);c.classList.toggle("ad-hide",hd);
    const nx=u.d.nextElementSibling;if(c===u.d&&nx&&nx.tagName==="LABEL"&&/숙지/.test(nx.textContent))nx.classList.toggle("ad-hide",hd);
  });
}
const top=(t,f)=>{const l=el("label","ad-top"),c=el("input");c.type="checkbox";c.onchange=()=>f(c.checked);l.append(c," "+t);return[l,c]};
const [tl,tc]=top("★ 별표만",v=>{FST=v;filt()}),[al,ac]=top("애매만",v=>{FAM=v;filt()});
document.body.prepend(tl,al);

document.addEventListener("change",e=>{
  const t=e.target;if(t.type!=="checkbox"||t===tc||t===ac||t.closest(".ad-q")||t.closest(".ad-x"))return;
  const lb=t.closest("label"),txt=lb?lb.textContent:"";
  if(/틀린 것만/.test(txt)){FW=t.checked;filt();return}
  if(/숙지 숨기기/.test(txt)){FS=t.checked;filt();return}
  const d=detOf(t);if(!d||d._k==null)return;const k=d._k;
  let kind=null;
  if(t===wcb(d))kind="w";else if(t===scb(d))kind="s";
  if(!kind)return;
  if(kind==="w"){learn(k,LSg(K0));if(t.checked&&!LOCK)bump(N,k,false)}
  if(!LOCK)lk(kind,k,t.checked);
  setTimeout(()=>{if(U[k])upd(k)},0);
},true);

/* 체크할 때 화면을 통째로 다시 그리는 파일: 새로 생긴 문항에 기능을 다시 붙임 */
let mt;
new MutationObserver(()=>{clearTimeout(mt);mt=setTimeout(()=>{
  const cur=qDets(document),used={},nw=cur.filter(d=>!d._ad);if(!nw.length)return;
  nw.forEach(d=>{
    let k=null;
    if(cur.length===N0)k=String(cur.indexOf(d));
    else{const l=QI[qn(qOf(d))]||[];const h=qn(qOf(d));used[h]=used[h]||0;k=l[used[h]++];k=k==null?null:String(k)}
    if(k!=null&&!(U[k]&&U[k].added))deco(d,k);
  });
  filt();
},30)}).observe(document.body,{childList:true,subtree:true});

/* ── 형광펜·단어장 버튼 ── */
fab(N,FN,g=>{if(g&&U[g.k])upd(g.k);else updAll()});

all0.forEach((d,i)=>deco(d,String(i)));
renderAdded();
const busy=()=>Object.values(U).some(u=>u.ed.style.display!=="none");
load(N).then(()=>{Object.keys(U).forEach(k=>{if(!U[k].added&&U[k].ed.style.display==="none")upd(k)});
  if(!Object.values(U).some(u=>u.added&&u.ed.style.display!=="none")&&!form.innerHTML)renderAdded()});
load(KWN).then(()=>{if(!busy())updAll()});
loadIndex().then(()=>{if(!busy())updAll()});
});
})();
