(function(){
"use strict";
var CODE="2330", NAME="台積電", TIMEOUT=8000;
var running=false,cancelled=false,controller=null;
var $=function(id){return document.getElementById(id);};

function monthList(){
  var d=new Date(),a=[],i,x;
  for(i=17;i>=0;i--){
    x=new Date(d.getFullYear(),d.getMonth()-i,1);
    a.push(String(x.getFullYear())+String(x.getMonth()+1).padStart(2,"0")+"01");
  }
  return a;
}
var MONTHS=monthList();

function key(m){return "ssa24m_"+CODE+"_"+m;}
function statusKey(m){return "ssa24s_"+CODE+"_"+m;}
function getStatus(m){
  try{return JSON.parse(localStorage.getItem(statusKey(m))||'{"status":"等待","msg":""}');}
  catch(e){return {status:"等待",msg:""};}
}
function setStatus(m,status,msg){
  localStorage.setItem(statusKey(m),JSON.stringify({status:status,msg:msg||""}));
}
function render(){
  var done=0,ok=0,fail=0,html="",i,m,s;
  for(i=0;i<MONTHS.length;i++){
    m=MONTHS[i]; s=getStatus(m);
    if(s.status==="成功"){done++;ok++;}
    if(s.status==="失敗"){done++;fail++;}
    html+='<div class="row '+s.status+'"><b>'+m.slice(0,4)+' / '+m.slice(4,6)+'</b><span>'+s.status+(s.msg?'｜'+s.msg:'')+'</span></div>';
  }
  $("count").textContent="進度 "+done+" / 18｜成功 "+ok+"｜失敗 "+fail;
  $("bar").style.width=(done/18*100)+"%";
  $("months").innerHTML=html;
}
function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function fetchOne(m){
  var cached=localStorage.getItem(key(m));
  if(cached){
    setStatus(m,"成功","已保存");
    return;
  }
  controller=new AbortController();
  var timer=setTimeout(function(){controller.abort();},TIMEOUT);
  try{
    var url="https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date="+m+"&stockNo="+CODE+"&response=json&_="+Date.now();
    var r=await fetch(url,{cache:"no-store",signal:controller.signal});
    if(!r.ok) throw new Error("HTTP "+r.status);
    var j=await r.json();
    if(j.stat!=="OK") throw new Error("TWSE "+(j.stat||"回應異常"));
    var rows=j.data||[];
    if(!rows.length) throw new Error("無交易資料");
    localStorage.setItem(key(m),JSON.stringify(rows));
    setStatus(m,"成功",rows.length+" 筆");
  }catch(e){
    var msg=(e&&e.name==="AbortError")?"逾時":((e&&e.message)||"失敗");
    if(cancelled && msg==="逾時") msg="已取消";
    setStatus(m,cancelled?"等待":"失敗",msg);
  }finally{
    clearTimeout(timer);
    controller=null;
  }
}
async function run(mode){
  if(running)return;
  running=true;cancelled=false;
  $("start").disabled=true;$("retry").disabled=true;$("cancel").disabled=false;
  $("work").textContent="已收到指令，準備逐月測試…";
  var i,m,s,should;
  for(i=0;i<MONTHS.length;i++){
    if(cancelled)break;
    m=MONTHS[i];s=getStatus(m);
    should=(mode==="retry")?(s.status==="失敗"):(s.status!=="成功");
    if(!should)continue;
    setStatus(m,"處理中","連線 TWSE");
    render();
    $("work").innerHTML="正在處理 <b>"+NAME+" "+CODE+"</b><br>"+m.slice(0,4)+" / "+m.slice(4,6)+"｜第 "+(i+1)+" / 18 月";
    await fetchOne(m);
    render();
    await wait(300);
  }
  running=false;
  $("start").disabled=false;$("retry").disabled=false;$("cancel").disabled=true;
  $("work").textContent=cancelled?"已取消。已完成月份均已保存，可稍後繼續。":"本輪完成。請查看成功／失敗月份。";
}
$("start").onclick=function(){run("normal");};
$("retry").onclick=function(){run("retry");};
$("cancel").onclick=function(){
  cancelled=true;
  if(controller)controller.abort();
  $("work").textContent="正在取消目前測試…";
};
$("reset").onclick=function(){
  if(!confirm("確定清除 v2.4 的台積電 18 個月測試進度？"))return;
  var i,m;
  for(i=0;i<MONTHS.length;i++){
    m=MONTHS[i];
    localStorage.removeItem(key(m));
    localStorage.removeItem(statusKey(m));
  }
  render();
  $("work").textContent="已清除，可重新測試。";
};
render();
})();