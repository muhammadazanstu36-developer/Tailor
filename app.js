(function(){
var $=function(i){return document.getElementById(i)};
var data={resume:"",letter:"",fit:"",score:"",score:""},cur="resume",tone="warm and professional",sample=null,busy=false;
var MARK={resume:"===RESUME===",letter:"===COVER LETTER===",fit:"===FIT NOTES===",score:"===SCORE==="};
function getSample(){if(sample)return Promise.resolve(sample);try{if(!window.claude)return Promise.resolve(null);return claude.use("sample").then(function(s){sample=s;return s}).catch(function(){return null})}catch(e){return Promise.resolve(null)}}
getSample();
try{window.claude&&claude.use("downloads").then(function(d){window._dl=d;if(d&&hasData())$("dl").hidden=false}).catch(function(){})}catch(e){}
function hasData(){return !!(data.resume||data.letter||data.fit)}
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
var shownScore=-1,RC=276.46,raf=window.requestAnimationFrame?function(f){window.requestAnimationFrame(f)}:function(f){setTimeout(f,16)};
var still=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
function chips(el,arr){el.textContent="";(Array.isArray(arr)?arr:[]).slice(0,6).forEach(function(t){var c=document.createElement("span");c.textContent=String(t).slice(0,60);el.appendChild(c)})}
function countTo(el,from,to){if(still||from===to){el.textContent=to;return}var t0=null;function st(ts){if(t0===null)t0=ts;var k=Math.min(1,(ts-t0)/1000),e=1-Math.pow(1-k,3);el.textContent=Math.round(from+(to-from)*e);if(k<1)raf(st)}raf(st)}
function renderScore(){
var box=$("score"),raw=data.score;
if(!raw){box.hidden=true;shownScore=-1;return}
var j;try{j=JSON.parse(raw.replace(/```json|```/g,"").trim())}catch(e){return}
var sc=Math.round(Number(j.score));if(isNaN(sc))return;sc=Math.max(0,Math.min(100,sc));
var ring=$("ring"),first=shownScore<0;
box.hidden=false;
if(first){ring.style.strokeDashoffset=RC;void ring.getBoundingClientRect()}
if(sc!==shownScore){ring.style.strokeDashoffset=RC*(1-sc/100);countTo($("num"),first?0:shownScore,sc);shownScore=sc}
$("slabel").textContent=sc>=75?"Strong match":sc>=55?"Good match, room to grow":"A stretch role";
chips($("matched"),j.matched);chips($("gaps"),j.gaps);
}
window._tdata=function(){return data};
var SKEL='<div class="skel"><i style="width:52%"></i><i></i><i style="width:93%"></i><i style="width:80%"></i><i></i><i style="width:66%"></i><i style="width:88%"></i></div>';
var EMPTY='<svg viewBox="0 0 120 90" width="140" role="img" aria-label="Empty page waiting for results"><rect x="30" y="8" width="60" height="76" rx="8" style="fill:var(--soft);stroke:var(--line)"/><rect x="40" y="22" width="40" height="5" rx="2.5" style="fill:var(--line)"/><rect x="40" y="34" width="30" height="5" rx="2.5" style="fill:var(--hl)"/><rect x="40" y="46" width="40" height="5" rx="2.5" style="fill:var(--line)"/><rect x="40" y="58" width="24" height="5" rx="2.5" style="fill:var(--line)"/><path d="M96 14l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" style="fill:var(--accent)"/><path d="M18 52l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" style="fill:var(--accent);opacity:.6"/></svg>';
function render(){
var isIv=cur==="interview";$("iv").hidden=!isIv;$("out").hidden=isIv;$("bar").hidden=isIv;if(isIv)return;
var o=$("out"),t=data[cur];
if(!t){o.className="out empty";o.innerHTML=busy?SKEL+"<div>Writing your application…</div>":EMPTY+"<div>Your tailored resume, cover letter and fit notes will appear here.</div>";return}
o.className="out";
o.innerHTML=esc(t).replace(/\[\[(.+?)\]\]/g,'<span class="hl">$1</span>');
}
function parse(txt){
var keys=["resume","letter","fit","score"],pos=keys.map(function(k){return txt.indexOf(MARK[k])});
keys.forEach(function(k,i){
if(pos[i]<0){data[k]="";return}
var start=pos[i]+MARK[k].length,end=txt.length;
pos.forEach(function(p){if(p>pos[i]&&p<end)end=p});
data[k]=txt.slice(start,end).trim();
});
}
document.querySelectorAll("#tabs button").forEach(function(b){b.onclick=function(){
cur=b.dataset.k;document.querySelectorAll("#tabs button").forEach(function(x){x.setAttribute("aria-selected",x===b)});render()}});
document.querySelectorAll("#tone button").forEach(function(b){b.onclick=function(){
tone=b.dataset.v;document.querySelectorAll("#tone button").forEach(function(x){x.setAttribute("aria-pressed",x===b)})}});
function plain(s){return s.replace(/\[\[(.+?)\]\]/g,"$1")}
function say(m){$("msg").textContent=m;setTimeout(function(){$("msg").textContent=""},2500)}
$("copy").onclick=function(){
var t=plain(data[cur]||"");if(!t){say("Nothing to copy yet.");return}
try{navigator.clipboard.writeText(t).then(function(){say("Copied.")},function(){say("Copy blocked. Select the text and copy it.")})}catch(e){say("Copy blocked. Select the text and copy it.")}};
$("dl").onclick=function(){
if(!window._dl)return;
var body="TAILORED RESUME\n\n"+plain(data.resume)+"\n\n----------\n\nCOVER LETTER\n\n"+plain(data.letter)+"\n\n----------\n\nFIT NOTES\n\n"+plain(data.fit)+"\n";
window._dl.save({filename:"tailored-application.txt",data:body}).then(function(){say("Saved.")},function(){say("Download cancelled.")})};
var iv={msgs:[],busy:false,done:false};
function ivErr(m){var e=$("iverr");e.textContent=m||"";e.hidden=!m}
function setIv(){var s=iv.msgs.length>0;$("ivimg").hidden=s;$("ivstart").hidden=s;$("ivstart").disabled=iv.busy;$("ivform").hidden=!s||iv.done;$("ivsend").disabled=iv.busy;$("ivans").disabled=iv.busy;$("ivreset").hidden=false;$("ivreset2").hidden=!iv.done}
function mk(parent,cls,text){var d=document.createElement("div");d.className=cls;d.textContent=text;parent.appendChild(d);return d}
function showReply(box,t){
box.textContent="";
var k=t.search(/NEXT QUESTION:|SUMMARY:/),f=t.indexOf("FEEDBACK:");
if(f>=0){mk(box,"fb",t.slice(f+9,k>=0?k:t.length).trim());
if(k>=0){var sum=t.slice(k,k+8)==="SUMMARY:";mk(box,sum?"fb":"q",sum?"Summary\n"+t.slice(k+8).trim():t.slice(k+14).trim())}}
else mk(box,"q",t.trim());
}
async function ivCall(){
await getSample();if(!sample){ivErr("AI isn't available here. Open the published link on claude.ai while signed in (not a saved copy).");iv.msgs=[];setIv();return}
ivErr("");iv.busy=true;setIv();
var box=document.createElement("div");$("ivlog").appendChild(box);
try{
var r=await sample(iv.msgs,{modelTier:"default",cache:false,onText:function(x){showReply(box,x.text)}});
showReply(box,r.text);iv.msgs.push({role:"assistant",content:r.text});
if(/SUMMARY:/.test(r.text))iv.done=true;
}catch(e){
box.remove();
var last=iv.msgs.pop();
if(iv.msgs.length>0){$("ivans").value=last.content;var lg=$("ivlog").lastChild;if(lg&&lg.className==="a")lg.remove()}
ivErr(e&&e.code==="rate_limited"?"Too many requests. Wait a minute and try again.":e&&e.code==="not_granted"?"Permission to use AI was declined. Try again and allow it.":"Something went wrong. Try again.");
}
iv.busy=false;setIv();
}
$("ivstart").onclick=function(){
var job=$("job").value.trim(),res=$("resume").value.trim();
if(job.length<80||res.length<80){ivErr("Paste the full job post and your resume on the left first.");return}
iv.done=false;$("ivlog").textContent="";
iv.msgs=[{role:"user",content:"You are a hiring manager interviewing me for the job below. Ask a mix of behavioral and role-specific questions drawn from the job post and my resume, one at a time.\n\nRules: on this first turn reply with ONLY the first question, no preamble. After each answer I give, reply in exactly this format:\nFEEDBACK: 2-4 sentences covering what worked, what was missing, 'Score: n/5', and one stronger way to phrase it using only facts from my resume.\nNEXT QUESTION: the next question.\nAfter my 5th answer, write FEEDBACK as above, then instead of NEXT QUESTION write SUMMARY: followed by three short bullets of overall advice.\n\nJOB POST:\n"+job+"\n\nRESUME:\n"+res+"\n\nAsk the first question."}];
ivCall();
};
$("ivsend").onclick=function(){
var a=$("ivans").value.trim();if(!a||iv.busy)return;
mk($("ivlog"),"a",a);iv.msgs.push({role:"user",content:a});$("ivans").value="";ivCall();
};
function ivRestart(){if(iv.busy)return;iv={msgs:[],busy:false,done:false};$("ivlog").textContent="";$("ivans").value="";ivErr("");setIv()}
$("ivreset").onclick=ivRestart;$("ivreset2").onclick=ivRestart;
setIv();render();
$("go").onclick=async function(){
var job=$("job").value.trim(),res=$("resume").value.trim(),name=$("name").value.trim();
var err=$("err");err.hidden=true;
if(job.length<80||res.length<80){err.textContent="Paste the full job post and your full resume (at least a few lines each).";err.hidden=false;return}
await getSample();if(!sample){err.textContent="AI isn't available here. Open the published link on claude.ai while signed in (not a saved copy).";err.hidden=false;return}
busy=true;data={resume:"",letter:"",fit:"",score:""};render();renderScore();
$("go").disabled=true;$("status").textContent="Tailoring…";$("dl").hidden=true;
var prompt="You tailor job applications. Use ONLY facts present in the resume below. Never invent employers, titles, dates, degrees, metrics or skills. If the job wants something the resume lacks, do not claim it; list it under gaps.\n\n"+
"Output exactly four sections, each starting with its marker on its own line, in this order:\n"+MARK.score+"\nOne line of JSON only, no code fence: {\"score\":<0-100, an honest estimate of how well the ORIGINAL resume matches the job>,\"matched\":[up to 6 short skills or requirements the resume clearly meets],\"gaps\":[up to 4 short requirements the resume lacks or shows only weakly]}. Do not inflate the score.\n"+MARK.resume+"\nThe resume rewritten for this job: plain text, reorder and rephrase bullets so the most relevant experience leads, mirror the job's keywords where truthful, keep it to what fits one to two pages. Wrap each phrase you added or reworded to match the job in [[double square brackets]] (a few per section, not whole lines).\n"+
MARK.letter+"\nA cover letter of 250-330 words in a "+tone+" tone"+(name?", signed by "+name:"")+". Reference specific details from the job post and two or three concrete achievements from the resume. No clichés like 'I am writing to apply'.\n"+
MARK.fit+"\nShort plain-text notes: 1) Strong matches (3-5 lines), 2) Gaps or missing requirements and how to address them honestly, 3) Three things to double-check before sending.\n\nNo other text, no markdown headings.\n\nJOB POST:\n"+job+"\n\nRESUME:\n"+res;
try{
var r=await sample(prompt,{modelTier:"default",cache:false,onText:function(x){parse(x.text);render();renderScore()}});
parse(r.text);renderScore();
}catch(e){
err.textContent=(e&&e.code==="rate_limited")?"Too many requests. Wait a minute and try again.":(e&&e.code==="not_granted")?"Permission to use AI was declined. Try again and allow it.":"Something went wrong. Try again.";err.hidden=false;
}
busy=false;$("go").disabled=false;$("status").textContent="";render();
if(hasData()&&window._dl)$("dl").hidden=false;
};
})();
(function(){try{
var cv=document.getElementById("wall");if(!cv)return;
var cx=cv.getContext&&cv.getContext("2d");if(!cx)return;
var W=0,H=0,t=0,last=0,mx=0,my=0,tx=0,ty=0,f=600,dark=false,cols=[],P=[],B=[],small=false;
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
function rgb(h){h=(h||"").trim().replace("#","");if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];var n=parseInt(h,16);if(isNaN(n)||h.length!==6)return[79,70,229];return[n>>16&255,n>>8&255,n&255]}
function readCols(){var cs=getComputedStyle(document.documentElement),a=rgb(cs.getPropertyValue("--accent")),b=rgb(cs.getPropertyValue("--bg"));dark=(b[0]*.3+b[1]*.59+b[2]*.11)<110;cols=[a,[56,189,248],[192,132,252],[34,211,238]]}
function C(c,a){return"rgba("+c[0]+","+c[1]+","+c[2]+","+a+")"}
function rnd(a,b){return a+Math.random()*(b-a)}
function size(){var d=Math.min(window.devicePixelRatio||1,2);W=window.innerWidth;H=window.innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);
small=W<640;f=Math.min(W*1.1,H*1.3);
var np=small?36:70,nb=small?4:7,i;P=[];B=[];
for(i=0;i<np;i++)P.push({x:rnd(-1100,1100),y:rnd(-60,520),z:rnd(120,1500),p:rnd(0,6.28),c:i%4});
for(i=0;i<nb;i++)B.push({x:rnd(-800,800),y:rnd(90,420),z:rnd(380,1250),s:rnd(26,52),rx:rnd(0,6),ry:rnd(0,6),vx:rnd(.2,.6)*(i%2?1:-1),vy:rnd(.25,.7),c:i%4})}
var V=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],E=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
var cy=0,sy_=0,cp=0,sp_=0;
function pr(x,y,z){var x1=x*cy-z*sy_,z1=x*sy_+z*cy,y2=y*cp-z1*sp_,z2=y*sp_+z1*cp;if(z2<30)return null;var k=f/z2;return[W/2+x1*k,H*.46-y2*k,z2,k]}
function frame(dt){
t+=dt;mx+=(tx-mx)*.05;my+=(ty-my)*.05;
var yaw=mx*.24+Math.sin(t*.25)*.05,pit=-.2+my*.06;
cy=Math.cos(yaw);sy_=Math.sin(yaw);cp=Math.cos(pit);sp_=Math.sin(pit);
cx.clearRect(0,0,W,H);
var hz=pr(0,0,1600),hy=hz?hz[1]:H*.4;
var g=cx.createRadialGradient(W/2+mx*60,hy,0,W/2+mx*60,hy,Math.max(W,H)*.7);g.addColorStop(0,C(cols[0],dark?.26:.18));g.addColorStop(1,C(cols[0],0));cx.fillStyle=g;cx.fillRect(0,0,W,H);
var R=small?16:24,N=small?24:34,dz=small?95:68,span=1500,off=t*110,frac=off%dz,j,i,G=[],base=-130;
cx.lineWidth=1.2;
for(j=0;j<R;j++){var row=[],z=70+j*dz-frac,za=z+off;
for(i=0;i<N;i++){var x=(i/(N-1)-.5)*2000,h=36*Math.sin(x*.0075+za*.0042+t*.6)+22*Math.sin(x*.012-za*.0065+t*.4)+14*Math.sin(x*.02+za*.01);row.push(pr(x,base+h,z))}G.push(row)}
var A=dark?.6:.42;
for(j=0;j<R;j++){var rw=G[j],zz=rw[Math.floor(N/2)];if(!zz)continue;var fd=Math.pow(Math.max(0,1-zz[2]/span),1.3);
cx.strokeStyle=C(cols[j%2?1:0],A*fd);cx.beginPath();var st=false;
for(i=0;i<N;i++){var p=rw[i];if(!p){st=false;continue}if(!st){cx.moveTo(p[0],p[1]);st=true}else cx.lineTo(p[0],p[1])}cx.stroke()}
for(i=0;i<N;i++){for(j=0;j<R-1;j++){var a=G[j][i],b=G[j+1][i];if(!a||!b)continue;var fd2=Math.pow(Math.max(0,1-(a[2]+b[2])/2/span),1.3);
cx.strokeStyle=C(cols[(i%3===0)?2:0],A*.8*fd2);cx.beginPath();cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.stroke()}}
for(i=0;i<P.length;i++){var q=P[i];if(!reduce){q.z-=45*dt;if(q.z<60){q.z=1500;q.x=rnd(-1100,1100);q.y=rnd(-60,520)}}
var pp=pr(q.x+Math.sin(t*.5+q.p)*20,q.y+Math.sin(t*.7+q.p)*14,q.z);if(!pp)continue;
var al=(dark?.8:.5)*Math.min(1,pp[2]<200?(pp[2]-60)/140:1)*Math.max(0,1-pp[2]/1700)*(.55+.45*Math.sin(t*2+q.p)),r=Math.max(.7,3.6*pp[3]);
cx.fillStyle=C(cols[q.c],al*.28);cx.beginPath();cx.arc(pp[0],pp[1],r*3,0,6.283);cx.fill();
cx.fillStyle=C(cols[q.c],al);cx.beginPath();cx.arc(pp[0],pp[1],r,0,6.283);cx.fill()}
cx.lineWidth=1.4;
for(var b2=0;b2<B.length;b2++){var o=B[b2];if(!reduce){o.rx+=o.vx*dt;o.ry+=o.vy*dt}
var cX=Math.cos(o.rx),sX=Math.sin(o.rx),cY=Math.cos(o.ry),sY=Math.sin(o.ry),oy=o.y+Math.sin(t*.6+b2)*26,PV=[],ok=true;
for(i=0;i<8;i++){var v=V[i],vx=v[0]*o.s,vy=v[1]*o.s,vz=v[2]*o.s;
var y1=vy*cX-vz*sX,z1=vy*sX+vz*cX,x2=vx*cY+z1*sY,z2=-vx*sY+z1*cY;
var q2=pr(o.x+x2,oy+y1,o.z+z2);if(!q2){ok=false;break}PV.push(q2)}
if(!ok)continue;
var fd3=Math.max(0,1-o.z/1500);cx.strokeStyle=C(cols[o.c],(dark?.85:.6)*(.35+.65*fd3));cx.beginPath();
for(i=0;i<12;i++){cx.moveTo(PV[E[i][0]][0],PV[E[i][0]][1]);cx.lineTo(PV[E[i][1]][0],PV[E[i][1]][1])}cx.stroke()}
}
function loop(ts){var dt=Math.min((ts-last)/1000,.06);last=ts;frame(dt);requestAnimationFrame(loop)}
readCols();size();
if(reduce){t=2;frame(0)}else requestAnimationFrame(function(ts){last=ts;requestAnimationFrame(loop)});
window.addEventListener("resize",function(){size();if(reduce)frame(0)});
window.addEventListener("pointermove",function(e){tx=(e.clientX/W-.5)*2;ty=(e.clientY/H-.5)*2},{passive:true});
window.addEventListener("themechange",function(){readCols();if(reduce)frame(0)});
if(window.matchMedia){var mq=matchMedia("(prefers-color-scheme:dark)");var cb=function(){readCols();if(reduce)frame(0)};if(mq.addEventListener)mq.addEventListener("change",cb)}
}catch(e){}})();
(function(){try{
var $=function(i){return document.getElementById(i)};
var menu=$("menu"),burger=$("burger"),root=document.documentElement,th=$("theme");
function closeM(){menu.classList.remove("open");burger.setAttribute("aria-expanded","false")}
burger.onclick=function(e){e.stopPropagation();var o=menu.classList.toggle("open");burger.setAttribute("aria-expanded",String(o))};
$("brand").onclick=function(e){e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});closeM()};
menu.addEventListener("click",function(e){var b=e.target.closest("button[data-go]");if(!b)return;var g=b.dataset.go;
menu.querySelectorAll("button").forEach(function(x){x.classList.toggle("on",x===b)});
if(g==="tailor"){document.querySelector(".grid .card").scrollIntoView({behavior:"smooth",block:"start"})}
else if(g==="help"){var h=$("help");h.hidden=!h.hidden;if(!h.hidden)window.scrollTo({top:0,behavior:"smooth"})}
else{var t=document.querySelector('#tabs button[data-k="'+g+'"]');if(t){t.click();t.closest(".card").scrollIntoView({behavior:"smooth",block:"start"})}}
closeM()});
function isDark(){var a=root.getAttribute("data-theme");return a==="dark"||(a!=="light"&&window.matchMedia&&matchMedia("(prefers-color-scheme:dark)").matches)}
function lab(){var dk=isDark(),t=dk?"Switch to light mode":"Switch to dark mode";th.setAttribute("data-mode",dk?"dark":"light");th.setAttribute("aria-label",t);th.title=t}
th.onclick=function(){root.setAttribute("data-theme",isDark()?"light":"dark");lab();window.dispatchEvent(new Event("themechange"))};
lab();
document.addEventListener("keydown",function(e){if(e.key==="Escape")closeM()});
document.addEventListener("click",function(e){if(!e.target.closest(".nav"))closeM()});
}catch(e){}})();
(function(){try{
var b=document.getElementById("ex");if(!b)return;
b.onclick=function(){
document.getElementById("job").value="Marketing Manager, Brightleaf Foods\n\nWe are looking for a Marketing Manager to lead our email and social campaigns for a growing snack brand. You will plan the content calendar, manage a small team and a monthly budget, and report on campaign results. We want someone with 3+ years in consumer marketing, strong writing, and experience with email tools and analytics.";
document.getElementById("resume").value="Alex Morgan\nMarketing Specialist, Hearth & Home, 2021 to present\n- Wrote and sent weekly email newsletters to 40,000 subscribers; grew open rate from 21% to 29%\n- Ran Instagram and TikTok content for a home goods brand; grew followers from 8,000 to 26,000 in a year\n- Tracked campaign results in Google Analytics and shared monthly reports with the owner\n\nMarketing Assistant, Corner Market, 2019 to 2021\n- Helped plan seasonal promotions and managed a small ad budget\n- Wrote product descriptions and in-store signs\n\nEducation: BA in Communications, 2019";
document.getElementById("name").value="Alex Morgan";
var st=document.getElementById("status");st.textContent="Example loaded. Press Tailor my application.";
};
}catch(e){}})();
(function(){try{
var $=function(i){return document.getElementById(i)};
var fab=$("chatfab"),box=$("chat"),log=$("chlog"),txt=$("chtxt"),send=$("chsend"),err=$("cherr");
var hist=[],busy=false,sp=null;
function getS(){if(sp)return Promise.resolve(sp);try{if(!window.claude)return Promise.resolve(null);return claude.use("sample").then(function(x){sp=x;return x}).catch(function(){return null})}catch(e){return Promise.resolve(null)}}
function bub(cls,t){var d=document.createElement("div");d.className="m "+cls;d.textContent=t;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function setOpen(o){box.hidden=!o;fab.setAttribute("aria-expanded",String(o));if(o&&window.innerWidth>560)txt.focus()}
bub("bot","Hi! I'm your career coach. I can see your job post, resume and results. Ask me anything, or tap a question below.");
fab.onclick=function(){setOpen(box.hidden)};
$("chatx").onclick=function(){setOpen(false);fab.focus()};
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!box.hidden){setOpen(false);fab.focus()}});
function sys(){var d=(window._tdata&&window._tdata())||{},c=function(v){return(v||"(not available yet)").slice(0,6000)};
return"You are a friendly, practical career coach inside a job application tool. Use the job post, resume and generated materials below to give specific, honest advice. Never invent experience the resume does not show; when asked to draft an answer, use only facts from the resume. Keep replies under 150 words unless asked for more. Use plain text with no markdown headers; short hyphen lists are fine. If the job post or resume is empty, say so, give general advice, and suggest pasting them in the form.\n\nJOB POST:\n"+c($("job").value.trim())+"\n\nRESUME:\n"+c($("resume").value.trim())+"\n\nTAILORED RESUME:\n"+c(d.resume)+"\n\nCOVER LETTER:\n"+c(d.letter)+"\n\nFIT NOTES:\n"+c(d.fit)}
function msgs(){var m=hist.map(function(h){return{role:h.role,content:h.content}});m[0]={role:"user",content:sys()+"\n\nMy first message:\n"+m[0].content};return m}
async function ask(q){
q=(q||"").trim();if(!q||busy)return;
err.hidden=true;$("sug").hidden=true;
bub("me",q);hist.push({role:"user",content:q});txt.value="";
busy=true;send.disabled=true;
var b=bub("bot","…");
var s=await getS();
if(!s){b.remove();hist.pop();txt.value=q;err.textContent="AI isn't available here. Open the published link on claude.ai while signed in.";err.hidden=false;busy=false;send.disabled=false;return}
try{
var r=await s(msgs(),{modelTier:"default",cache:false,onText:function(x){b.textContent=x.text;log.scrollTop=log.scrollHeight}});
b.textContent=r.text;hist.push({role:"assistant",content:r.text});
}catch(e){
b.remove();hist.pop();txt.value=q;
err.textContent=(e&&e.code==="rate_limited")?"Too many requests. Wait a minute and try again.":(e&&e.code==="not_granted")?"Permission to use AI was declined. Try again and allow it.":"Something went wrong. Try again.";err.hidden=false;
}
busy=false;send.disabled=false;log.scrollTop=log.scrollHeight;
}
send.onclick=function(){ask(txt.value)};
txt.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask(txt.value)}});
$("sug").addEventListener("click",function(e){var b=e.target.closest("button");if(b)ask(b.textContent)});
}catch(e){}})();
(function(){try{
var $=function(i){return document.getElementById(i)};
var TO="notsrxazan7@gmail.com";
var dlg=$("auth"),db=null,user=null,uid=null,canW=null,inited=false,mine=null,listOK=false;
function err(m){var e=$("autherr");e.textContent=m||"";e.hidden=!m}
async function init(){if(inited)return;inited=true;
try{if(!window.claude)return;user=await claude.use("user");if(user){uid=await user.id();canW=await user.can("data.write")}db=await claude.use("db")}catch(e){}}
function show(form,done){$("authform").hidden=!form;$("authdone").hidden=!done}
function setMail(){var nm=(mine&&mine.name)||"",em=(mine&&mine.email)||"",su="New sign-up: "+nm,bd="Hi, I'm "+nm+" ("+em+") and I just joined the Job Application Tailor sign-up list.";
$("mailown").href="mailto:"+TO+"?subject="+encodeURIComponent(su)+"&body="+encodeURIComponent(bd);
$("mailgm").href="https://mail.google.com/mail/?view=cm&fs=1&to="+encodeURIComponent(TO)+"&su="+encodeURIComponent(su)+"&body="+encodeURIComponent(bd);
$("mailtxt").value="To: "+TO+"\nSubject: "+su+"\n\n"+bd}
function finish(saved){show(false,true);$("who").textContent=(mine&&mine.name)||"friend";setMail();
$("authsub").textContent=saved?"You're on the list. You can also email the owner:":"Last step: send your sign-up to the owner by email.";$("mailfb").hidden=saved}
async function view(){
err("");$("authown").hidden=true;
listOK=!!(db&&uid&&canW!==false);
if(listOK){try{var s=await db.doc("signups/"+uid).get();mine=s.exists?s.data():null}catch(e){mine=null}}
if(listOK&&mine){finish(true)}
else{show(true,false);$("authsub").textContent=listOK?"Add your name and email to join the list.":"Add your name and email, then send them to the owner by email."}
try{if(user&&await user.isOwner()&&db)loadOwner()}catch(e){}
}
async function loadOwner(){
try{var q=await db.collection("signups").get(),rows=(q.docs||[]).map(function(d){return d.data()||{}});
rows.sort(function(a,b){return String(b.at||"").localeCompare(String(a.at||""))});
$("owncount").textContent="("+rows.length+")";
var box=$("ownlist");box.textContent="";
rows.forEach(function(r){var d=document.createElement("div");d.textContent=String(r.name||"")+" ";var sm=document.createElement("small");sm.textContent=String(r.email||"")+" · "+String(r.at||"").slice(0,10);d.appendChild(sm);box.appendChild(d)});
if(!rows.length){box.textContent="No sign-ups yet."}
window._signups=rows;$("authown").hidden=false;
}catch(e){}}
async function openDlg(){
if(!dlg.showModal)return;
if(!dlg.open)dlg.showModal();
$("authsub").textContent="One moment…";show(false,false);
await init();await view();
}
$("navsign").onclick=openDlg;
$("menu").addEventListener("click",function(e){if(e.target.closest('button[data-go="signup"]'))openDlg()});
$("authx").onclick=function(){dlg.close()};
dlg.addEventListener("click",function(e){if(e.target===dlg)dlg.close()});
$("ssave").onclick=async function(){
err("");var n=$("sname").value.trim(),m=$("semail").value.trim();
if(n.length<2){err("Enter your name.");return}
if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)){err("Enter a valid email address.");return}
if(!$("sconsent").checked){err("Tick the box to agree to be contacted.");return}
var b=$("ssave");b.disabled=true;mine={name:n,email:m};var saved=false;
if(listOK){try{await db.doc("signups/"+uid).set({name:n,email:m,consent:true,at:new Date().toISOString()});saved=true}catch(e){saved=false}}
finish(saved);b.disabled=false};
$("mailown").addEventListener("click",function(){setMail();setTimeout(function(){$("mailfb").hidden=false},500)});
$("mailcopy").onclick=function(){var t=$("mailtxt");try{navigator.clipboard.writeText(t.value).then(function(){$("mailcopy").textContent="Copied"},function(){t.select()})}catch(e){t.select()}};
$("sedit").onclick=function(){$("sname").value=(mine&&mine.name)||"";$("semail").value=(mine&&mine.email)||"";$("sconsent").checked=false;show(true,false);$("authsub").textContent="Update your details."};
$("sleave").onclick=async function(){err("");try{if(listOK)await db.doc("signups/"+uid).delete();mine=null;$("mailfb").hidden=true;await view()}catch(e){err("Couldn't remove you. Try again.")}};
$("owncsv").onclick=async function(){
try{var d=await claude.use("downloads");if(!d)return;
var q=function(v){return'"'+String(v==null?"":v).replace(/"/g,'""')+'"'};
var rows=(window._signups||[]).map(function(r){return[q(r.name),q(r.email),q(r.at)].join(",")});
await d.save({filename:"signups.csv",data:"name,email,signed_up_at\n"+rows.join("\n")+"\n"})}catch(e){}};
}catch(e){}})();
(function(){try{
var $=function(i){return document.getElementById(i)},E=encodeURIComponent;
var INDEED={"Pakistan":"pk.indeed.com","United States":"www.indeed.com","United Kingdom":"uk.indeed.com","United Arab Emirates":"ae.indeed.com","Saudi Arabia":"sa.indeed.com","India":"in.indeed.com","Canada":"ca.indeed.com","Australia":"au.indeed.com"};
var sel=$("jcountry");Object.keys(INDEED).forEach(function(k){var o=document.createElement("option");o.value=k;o.textContent=k;sel.appendChild(o)});
function kw(){var t=$("jtitle").value.trim();return t?t+($("jremote").checked?" remote":""):""}
function sites(){var k=kw(),loc=$("jloc").value.trim(),rem=$("jremote").checked,dom=INDEED[sel.value]||"www.indeed.com";return[
{n:"LinkedIn",d:"Professional network. Many roles have a quick apply button.",u:"https://www.linkedin.com/jobs/search/?keywords="+E(k)+"&location="+E(loc)+(rem?"&f_WT=2":"")},
{n:"Indeed",d:"Large job board. Uses the country you picked.",u:"https://"+dom+"/jobs?q="+E(k)+"&l="+E(loc)},
{n:"Google Jobs",d:"Gathers listings from many sites in one place.",u:"https://www.google.com/search?q="+E(k+" jobs"+(loc?" in "+loc:""))+"&ibp=htl;jobs"},
{n:"Glassdoor",d:"Jobs with company reviews and salary estimates.",u:"https://www.glassdoor.com/Job/jobs.htm?sc.keyword="+E(k)+(loc?"&locKeyword="+E(loc):"")},
{n:"Rozee.pk",d:"Pakistan job board. Searches by keyword only.",u:"https://www.rozee.pk/job/jsearch/q/"+E(k)},
{n:"We Work Remotely",d:"Remote jobs from companies hiring worldwide.",u:"https://weworkremotely.com/remote-jobs/search?term="+E(k)}]}
function draw(){var box=$("jsites");box.textContent="";var k=kw();
sites().forEach(function(s){var a=document.createElement("a");a.className="site";
var b=document.createElement("b");b.textContent=s.n;var p=document.createElement("span");p.textContent=s.d;var i=document.createElement("i");i.textContent=k?"Open search \u2192":"Enter a title first";
a.appendChild(b);a.appendChild(p);a.appendChild(i);
if(k){a.href=s.u;a.target="_blank";a.rel="noopener noreferrer"}else a.setAttribute("aria-disabled","true");
box.appendChild(a)})}
$("jtitle").addEventListener("input",draw);$("jloc").addEventListener("input",draw);sel.onchange=draw;$("jremote").onchange=draw;
draw();window._jobSites=sites;
var sp=null;
function getS(){if(sp)return Promise.resolve(sp);try{if(!window.claude)return Promise.resolve(null);return claude.use("sample").then(function(x){sp=x;return x}).catch(function(){return null})}catch(e){return Promise.resolve(null)}}
$("jsuggest").onclick=async function(){
var res=$("resume").value.trim(),st=$("jstatus"),btn=$("jsuggest");
if(res.length<80){st.textContent="Paste your resume in the form above first.";return}
var s=await getS();if(!s){st.textContent="AI isn't available here.";return}
st.textContent="Thinking\u2026";btn.disabled=true;
try{
var r=await s("Read this resume and suggest 6 realistic job titles this person could apply for now, best fit first. Reply with ONLY a JSON array of short strings, no code fence.\n\nRESUME:\n"+res.slice(0,8000),{modelTier:"default",cache:false});
var m=r.text.match(/\[[\s\S]*\]/),arr=JSON.parse(m?m[0]:"[]").filter(function(x){return typeof x==="string"&&x.trim()}).slice(0,6);
var box=$("jchips");box.textContent="";
arr.forEach(function(t){var c=document.createElement("button");c.type="button";c.className="chipbtn";c.textContent=t.slice(0,60);c.onclick=function(){$("jtitle").value=t;draw()};box.appendChild(c)});
if(arr.length&&!$("jtitle").value.trim()){$("jtitle").value=arr[0];draw()}
st.textContent=arr.length?"Tap a title to search for it.":"No suggestions. Try again.";
}catch(e){st.textContent=(e&&e.code==="rate_limited")?"Too many requests. Try again in a minute.":(e&&e.code==="not_granted")?"Permission to use AI was declined.":"Something went wrong. Try again."}
btn.disabled=false};
$("menu").addEventListener("click",function(ev){if(ev.target.closest('button[data-go="jobs"]'))$("jobs").scrollIntoView({behavior:"smooth",block:"start"})});
}catch(e){}})();
(function(){try{
var $=function(i){return document.getElementById(i)},E=encodeURIComponent,cache={};
function st(m){$("jlstatus").textContent=m}
function title(){return $("jtitle").value.trim()}
$("jopenall").onclick=function(){
if(!title()){st("Enter a job title first.");return}
var list=window._jobSites?window._jobSites():[],blocked=0;
list.forEach(function(x){var w=window.open(x.u,"_blank");if(w){try{w.opener=null}catch(e){}}else blocked++});
st(blocked?("Your browser blocked "+blocked+" tab(s). Allow pop-ups for this page and try again, or use the cards above."):("Opened "+list.length+" tabs."))};
function safe(u){return /^https?:\/\//i.test(String(u||""))?String(u):""}
function words(t){return t.toLowerCase().split(/[^a-z0-9+#.]+/).filter(function(w){return w.length>1})}
function get(url){return fetch(url).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})}
async function load(k,remote,loc){
var w=words(k),out=[],fails=0;
var res=await Promise.allSettled([get("https://remotive.com/api/remote-jobs?limit=50&search="+E(k)),get("https://www.arbeitnow.com/api/job-board-api")]);
if(res[0].status==="fulfilled"){(res[0].value.jobs||[]).forEach(function(x){out.push({t:x.title,c:x.company_name,l:x.candidate_required_location||"Remote",d:x.publication_date||"",u:safe(x.url),s:"Remotive",y:(x.job_type||"").replace(/_/g," ")})})}else fails++;
if(res[1].status==="fulfilled"){
var arr=(res[1].value.data||[]).filter(function(x){return !remote||x.remote});
function hay(x){return((x.title||"")+" "+(x.tags||[]).join(" ")).toLowerCase()}
var all=arr.filter(function(x){return w.every(function(q){return hay(x).indexOf(q)>=0})});
if(!all.length)all=arr.filter(function(x){return w.some(function(q){return hay(x).indexOf(q)>=0})});
all.forEach(function(x){out.push({t:x.title,c:x.company_name,l:(x.location||"")+(x.remote?" (remote)":""),d:x.created_at?new Date(x.created_at*1000).toISOString():"",u:safe(x.url),s:"Arbeitnow",y:(x.job_types||[]).join(", ")})})
}else fails++;
if(fails===2)throw new Error("blocked");
if(loc&&!remote){var l=loc.toLowerCase();var near=out.filter(function(x){return(x.l||"").toLowerCase().indexOf(l)>=0});if(near.length)out=near}
out=out.filter(function(x){return x.u&&x.t});
out.sort(function(a,b){return String(b.d).localeCompare(String(a.d))});
return out.slice(0,30)}
function show(list){
var box=$("jlist");box.textContent="";
list.forEach(function(x){
var row=document.createElement("div");row.className="job";
var l=document.createElement("div"),b=document.createElement("b"),sm=document.createElement("small");
b.textContent=x.t;sm.textContent=[x.c,x.l,x.y,String(x.d).slice(0,10),"via "+x.s].filter(Boolean).join(" · ");
l.appendChild(b);l.appendChild(sm);
var a=document.createElement("a");a.className="go";a.textContent="Apply";a.href=x.u;a.target="_blank";a.rel="noopener noreferrer";
row.appendChild(l);row.appendChild(a);box.appendChild(row)})}
$("jlive").onclick=async function(){
var k=title();if(!k){st("Enter a job title first.");return}
var remote=$("jremote").checked,loc=$("jloc").value.trim(),key=[k,remote,loc].join("|"),btn=$("jlive");
btn.disabled=true;st("Loading listings\u2026");$("jlist").textContent="";
try{
var list=cache[key]||(cache[key]=await load(k,remote,loc));
show(list);
st(list.length?("Showing "+list.length+" listing(s). Apply opens the listing page in a new tab."):"No matching listings from these two sources. Try other keywords, or use the site cards above.")
}catch(e){delete cache[key];st("Listings can't load here. This works in the downloaded app, not inside claude.ai. Use the site cards above instead.")}
btn.disabled=false};
}catch(e){}})();
