function parseCSV(text){
  const rows=[]; let row=[], cur='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"' && q && n==='"'){cur+='"'; i++; continue;}
    if(c==='"'){q=!q; continue;}
    if(c===',' && !q){row.push(cur); cur=''; continue;}
    if((c==='\n'||c==='\r') && !q){ if(cur!==''||row.length){row.push(cur); rows.push(row); row=[]; cur='';} if(c==='\r'&&n==='\n') i++; continue;}
    cur+=c;
  }
  if(cur!==''||row.length){row.push(cur); rows.push(row);}
  const headers=rows.shift().map(h=>h.trim().toLowerCase());
  return rows.filter(r=>r.some(x=>String(x).trim()!=='')).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}
const num=v=>Number(String(v||'').replace(/[£,]/g,''))||0;
function byTeam(a,b){return num(b.points)-num(a.points)||num(b.gd)-num(a.gd)||num(a.discipline)-num(b.discipline)||String(a.country).localeCompare(b.country)}
function render(data){
  const teams=[...data].sort(byTeam);
  const last=[...data].sort((a,b)=>num(a.points)-num(b.points)||num(a.gd)-num(b.gd)||num(b.discipline)-num(a.discipline))[0];
  const bad=[...data].sort((a,b)=>num(b.discipline)-num(a.discipline))[0];
  document.getElementById('topTeam').textContent=teams[0]?.country||'—';
  document.getElementById('topTeamMeta').textContent=`${teams[0]?.person||''} · ${num(teams[0]?.points)} pts · GD ${num(teams[0]?.gd)}`;
  document.getElementById('lastPlace').textContent=last?.country||'—';
  document.getElementById('lastPlaceMeta').textContent=`${last?.person||''} · ${num(last?.points)} pts · GD ${num(last?.gd)}`;
  document.getElementById('badTeam').textContent=bad?.country||'—';
  document.getElementById('badTeamMeta').textContent=`${bad?.person||''} · ${num(bad?.discipline)} discipline pts`;
  const people={};
  data.forEach(t=>{const p=t.person||'Unknown'; people[p]??={person:p,teams:0,points:0,gd:0}; people[p].teams++; people[p].points+=num(t.points); people[p].gd+=num(t.gd);});
  const persons=Object.values(people).sort((a,b)=>b.points-a.points||b.gd-a.gd);
  document.getElementById('leader').textContent=persons[0]?.person||'—';
  document.getElementById('leaderMeta').textContent=`${persons[0]?.points||0} pts · GD ${persons[0]?.gd||0}`;
  document.getElementById('peopleBody').innerHTML=persons.map(p=>`<tr><td>${p.person}</td><td class="num">${p.teams}</td><td class="num">${p.points}</td><td class="num">${p.gd}</td></tr>`).join('');
  document.getElementById('teamsBody').innerHTML=teams.map((t,i)=>`<tr><td>${i+1}</td><td>${t.country||''}</td><td>${t.code||''}</td><td>${t.group||''}</td><td>${t.person||''}</td><td class="num">${num(t.points)}</td><td class="num">${num(t.gd)}</td><td class="num">${num(t.discipline)}</td><td class="num">${num(t.yellow)}</td><td class="num">${num(t.red)}</td></tr>`).join('');
  document.getElementById('lastUpdated').textContent=`Last refreshed: ${new Date().toLocaleString('en-GB')}`;
}
async function load(){
  document.getElementById('lastUpdated').textContent='Loading latest Google Sheet data…';
  const res=await fetch(CONFIG.teamsCsvUrl + '&cacheBust=' + Date.now());
  if(!res.ok) throw new Error('Could not load Google Sheet CSV. Check sharing is set to Anyone with the link: Viewer.');
  render(parseCSV(await res.text()));
}
document.getElementById('refreshBtn').addEventListener('click',()=>load().catch(e=>alert(e.message)));
load().catch(e=>{document.getElementById('lastUpdated').textContent=e.message;});
setInterval(()=>load().catch(()=>{}), 5*60*1000);
