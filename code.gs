// HISAB KHATA - Backend (Google Apps Script)
// Sheet me: Extensions > Apps Script > ye code paste karein > setup() run karein > Deploy as Web App
const ADMIN = {username:'admin', name:'Master Admin', password:'OMAC@2026', role:'admin'};
const U_HEAD = ['username','name','password','role','created'];
const E_HEAD = ['id','username','date','type','amount','category','note','created'];

function setup(){ usersSh(); entriesSh(); }

function sh_(name, head){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if(!s){ s = ss.insertSheet(name); s.appendRow(head); s.setFrozenRows(1); s.getRange(1,1,1,head.length).setFontWeight('bold'); s.getRange('A:H').setNumberFormat('@'); }
  return s;
}
function usersSh(){
  const fresh = !SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const s = sh_('Users', U_HEAD);
  if(fresh){
    const now = new Date().toISOString();
    s.appendRow([ADMIN.username, ADMIN.name, ADMIN.password, 'admin', now]);
    s.appendRow(['syed', 'Syed', '', 'user', now]); // password khali = bina password
  }
  return s;
}
function entriesSh(){ return sh_('Entries', E_HEAD); }

function rows_(s){
  const v = s.getDataRange().getValues(); const h = v.shift();
  return v.map(r => { const o = {}; h.forEach((k,i)=>{ let x = r[i]; if(x instanceof Date) x = Utilities.formatDate(x, Session.getScriptTimeZone(), 'yyyy-MM-dd'); o[k] = String(x); }); return o; });
}
function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function pub_(u){ return {username:u.username, name:u.name, role:u.role, hasPass: u.password !== ''}; }

function doGet(){ return out_({ok:true, msg:'Hisab Khata API chal rahi hai'}); }

function doPost(e){
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try{
    const b = JSON.parse(e.postData.contents);
    const us = usersSh(); entriesSh();
    const users = rows_(us);
    const uname = String(b.username||'').trim().toLowerCase();

    if(b.action === 'register'){
      if(!/^[a-z0-9_]{3,20}$/.test(uname)) return out_({ok:false, error:'Username 3-20 chars: a-z, 0-9, _'});
      if(users.some(u=>u.username===uname)) return out_({ok:false, error:'Ye username pehle se maujood hai'});
      const nu = {username:uname, name:String(b.name||uname).trim(), password:String(b.password||''), role:'user'};
      us.appendRow([nu.username, nu.name, nu.password, 'user', new Date().toISOString()]);
      return out_({ok:true, user:pub_(nu)});
    }

    const me = users.find(u=>u.username===uname);
    if(!me) return out_({ok:false, error:'Account nahi mila'});
    if(me.password !== '' && me.password !== String(b.password||'')) return out_({ok:false, error:'Password ghalat hai'});
    const isAdmin = me.role === 'admin';
    const es = entriesSh();

    switch(b.action){
      case 'login': return out_({ok:true, user:pub_(me)});

      case 'list': {
        let list = rows_(es);
        const t = b.target || me.username;
        if(!isAdmin || t !== 'all') list = list.filter(x => x.username === (isAdmin ? t : me.username));
        const res = {ok:true, entries:list};
        if(isAdmin) res.users = users.map(u=>({username:u.username, name:u.name, password:u.password, role:u.role, created:u.created}));
        return out_(res);
      }

      case 'add': {
        const amt = Number(b.amount);
        if(!(amt > 0)) return out_({ok:false, error:'Amount sahi likhein'});
        if(['kharcha','cash','jama'].indexOf(b.type) < 0) return out_({ok:false, error:'Type ghalat'});
        const owner = (isAdmin && b.owner) ? String(b.owner).toLowerCase() : me.username;
        const id = Utilities.getUuid().slice(0,8);
        es.appendRow([id, owner, b.date, b.type, amt, b.category||'', b.note||'', new Date().toISOString()]);
        return out_({ok:true, id:id});
      }

      case 'delete': {
        const v = es.getDataRange().getValues();
        for(let i=1;i<v.length;i++){
          if(String(v[i][0]) === b.id && (isAdmin || String(v[i][1]) === me.username)){ es.deleteRow(i+1); return out_({ok:true}); }
        }
        return out_({ok:false, error:'Entry nahi mili'});
      }

      case 'setpass': {
        const v = us.getDataRange().getValues();
        for(let i=1;i<v.length;i++) if(String(v[i][0]) === me.username){ us.getRange(i+1,3).setValue(String(b.newPassword||'')); return out_({ok:true, hasPass: !!b.newPassword}); }
        return out_({ok:false, error:'Account nahi mila'});
      }

      case 'deleteUser': {
        if(!isAdmin) return out_({ok:false, error:'Sirf admin'});
        const t = String(b.target||'').toLowerCase();
        if(t === 'admin') return out_({ok:false, error:'Admin delete nahi ho sakta'});
        let v = us.getDataRange().getValues();
        for(let i=v.length-1;i>=1;i--) if(String(v[i][0]) === t) us.deleteRow(i+1);
        v = es.getDataRange().getValues();
        for(let i=v.length-1;i>=1;i--) if(String(v[i][1]) === t) es.deleteRow(i+1);
        return out_({ok:true});
      }
    }
    return out_({ok:false, error:'Unknown action'});
  }catch(err){ return out_({ok:false, error:String(err)}); }
  finally{ lock.releaseLock(); }
}
