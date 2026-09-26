const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync(require('path').join(__dirname,'..','lib','xiaoke-widget.js'),'utf8');
function mkEl(tag){
  const e={tagName:(tag||'div').toUpperCase(),style:{},dataset:{},children:[],
    classList:{add(){},remove(){},contains(){return false},toggle(){}}};
  e.setAttribute=(k,v)=>{e['attr_'+k]=v};
  e.getAttribute=(k)=>e['attr_'+k];
  e.appendChild=(c)=>{e.children.push(c);return c};
  e.removeChild=()=>{}; e.insertBefore=(c)=>{e.children.push(c);return c};
  e.addEventListener=()=>{}; e.removeEventListener=()=>{};
  e.querySelector=()=>null; e.querySelectorAll=()=>[];
  e.getBoundingClientRect=()=>({top:0,left:0,right:0,bottom:0,width:100,height:100});
  e.focus=()=>{}; e.blur=()=>{}; e.click=()=>{}; e.remove=()=>{};
  e.getContext=()=>null; e.cloneNode=()=>mkEl(tag);
  Object.defineProperty(e,'innerHTML',{get(){return e._h||''},set(v){e._h=v}});
  Object.defineProperty(e,'textContent',{get(){return e._t||''},set(v){e._t=v}});
  return e;
}
const head=mkEl('head'), body=mkEl('body'), root=mkEl('div');
root.id='root'; body.appendChild(root);
const doc={head,body,documentElement:mkEl('html'),createElement:mkEl,createElementNS:(n,t)=>mkEl(t),
  createTextNode:(t)=>({nodeType:3,textContent:t}),getElementById:(id)=>id==='root'?root:null,
  querySelectorAll:()=>[],addEventListener:()=>{},removeEventListener:()=>{},
  readyState:'complete',fonts:{check:()=>true,ready:Promise.resolve()},styleSheets:[],adoptedStyleSheets:[]};
doc.querySelector=(s)=>(s==='textarea'||s.indexOf('composer')>=0||s.indexOf('textbox')>=0)?mkEl('textarea'):null;
const win={document:doc,devicePixelRatio:1,innerWidth:1440,innerHeight:900,
  location:{href:'http://localhost/',origin:'http://localhost',pathname:'/'},
  navigator:{userAgent:'node',maxTouchPoints:0,language:'zh-CN'},
  localStorage:{_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}},
  addEventListener:()=>{},removeEventListener:()=>{},dispatchEvent:()=>true,
  matchMedia:()=>({matches:false,addEventListener:()=>{},addListener:()=>{},media:''}),
  getComputedStyle:()=>({getPropertyValue:()=>'0px'}),
  requestAnimationFrame:(cb)=>setTimeout(cb,16),cancelAnimationFrame:()=>{},
  setTimeout,clearTimeout,setInterval:()=>0,clearInterval:()=>{},
  MutationObserver:function(){return{observe(){},disconnect(){},takeRecords(){return[]}}},
  fetch:()=>Promise.resolve({ok:true,status:200,headers:{get:()=>null},json:()=>Promise.resolve({ok:true}),text:()=>Promise.resolve('')}),
  AudioContext:function(){return{state:'suspended',resume:()=>Promise.resolve(),close:()=>Promise.resolve(),
    destination:{},createGain:()=>({connect:()=>{},gain:{value:0}}),
    createBufferSource:()=>({connect:()=>{},start:()=>{},stop:()=>{},buffer:null}),
    decodeAudioData:()=>Promise.resolve({}),currentTime:0}},
  Image:function(){return mkEl('img')},console};
win.window=win;win.self=win;win.globalThis=win;win.top=win;win.parent=win;win.frameElement=null;
const ctx={...win,window:win,globalThis:win,console,Math,Date,JSON,Promise,Object,Array,String,Number,
  Boolean,RegExp,Error,Map,Set,Symbol,Intl,parseFloat,parseInt,isNaN,isFinite,
  encodeURIComponent,decodeURIComponent,URL,URLSearchParams,TextEncoder,TextDecoder,
  fetch:win.fetch,setTimeout,clearTimeout,queueMicrotask,
  btoa:(s)=>Buffer.from(s,'binary').toString('base64'),
  atob:(s)=>Buffer.from(s,'base64').toString('binary')};
ctx.self=ctx;ctx.global=ctx;
try{
  vm.createContext(ctx);
  vm.runInContext(src,ctx,{filename:'xiaoke-widget.js'});
  console.log('  ✓ widget 顶层执行成功（无未定义引用）');
}catch(e){ console.error('  ✗ 执行失败:',e.message); process.exit(1) }
