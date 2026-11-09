// JP Sports - Google Apps Script backend. Vincule este script a uma planilha Google.
const SHEET_NAME = 'Inscritos';
function doGet(){return ContentService.createTextOutput('JP Sports API ativa.');}
function doPost(e){
  let req={};try{req=JSON.parse(e.parameter.payload||'{}');}catch(_){return respond(req.jpRequest,false,null,'Requisição inválida.');}
  const lock=LockService.getScriptLock();
  try{
    const props=PropertiesService.getScriptProperties();
    const action=req.action;
    if(action==='setup'){
      if(props.getProperty('ADMIN_HASH'))return respond(req.jpRequest,false,null,'A senha administrativa já foi criada.');
      const setupCode=props.getProperty('ADMIN_SETUP_CODE');
      if(!setupCode||String(req.setup_code||'')!==setupCode)return respond(req.jpRequest,false,null,'Código inicial inválido. Configure ADMIN_SETUP_CODE nas propriedades do Apps Script.');
      if(!req.password||String(req.password).length<10)return respond(req.jpRequest,false,null,'A senha precisa ter pelo menos 10 caracteres.');
      props.setProperty('ADMIN_HASH',hash_(req.password));props.deleteProperty('ADMIN_SETUP_CODE');return respond(req.jpRequest,true,{token:issueToken_()},'');
    }
    if(action==='login'){
      if(!props.getProperty('ADMIN_HASH'))return respond(req.jpRequest,false,null,'Crie a senha administrativa primeiro.');
      if(hash_(req.password||'')!==props.getProperty('ADMIN_HASH'))return respond(req.jpRequest,false,null,'Senha incorreta.');
      return respond(req.jpRequest,true,{token:issueToken_()},'');
    }
    if(action==='register'){
      const r=req.registration||{};const required=['full_name','phone','email','distance','package','amount'];
      if(required.some(k=>!r[k]))return respond(req.jpRequest,false,null,'Preencha todos os campos obrigatórios.');
      if(r.package==='with_shirt'&&!r.shirt_size)return respond(req.jpRequest,false,null,'Informe o tamanho da camisa.');
      lock.waitLock(15000);const sheet=getSheet_();sheet.appendRow([new Date(),r.full_name,r.phone,r.email,r.distance,r.package==='with_shirt'?'Com camisa azul':'Sem camisa',r.shirt_size||'',Number(r.amount),'Pendente']);lock.releaseLock();
      return respond(req.jpRequest,true,{saved:true},'');
    }
    if(action==='list'){
      if(!validToken_(req.token))return respond(req.jpRequest,false,null,'Sessão expirada. Entre novamente.');
      const s=getSheet_(),values=s.getDataRange().getValues();const rows=values.slice(1).filter(r=>r[1]).map(r=>({created_at:r[0] instanceof Date?Utilities.formatDate(r[0],Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm'):r[0],full_name:r[1],phone:r[2],email:r[3],distance:r[4],package_label:r[5],shirt_size:r[6],amount:r[7]}));
      return respond(req.jpRequest,true,{rows:rows.reverse()},'');
    }
    return respond(req.jpRequest,false,null,'Ação desconhecida.');
  }catch(err){try{lock.releaseLock();}catch(_){}return respond(req.jpRequest,false,null,String(err));}
}
function getSheet_(){const ss=SpreadsheetApp.getActiveSpreadsheet();let s=ss.getSheetByName(SHEET_NAME);if(!s){s=ss.insertSheet(SHEET_NAME);s.appendRow(['Data','Nome','WhatsApp','E-mail','Distância','Pacote','Tamanho','Valor','Pagamento']);s.setFrozenRows(1);}return s;}
function hash_(v){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(v),Utilities.Charset.UTF_8).map(b=>(b+256).toString(16).slice(-2)).join('');}
function issueToken_(){const t=Utilities.getUuid()+Utilities.getUuid();CacheService.getScriptCache().put('adm_'+t,'1',21600);return t;}
function validToken_(t){return !!t&&CacheService.getScriptCache().get('adm_'+t)==='1';}
function respond(id,ok,data,error){const safe=JSON.stringify({jpRequest:id,ok:ok,data:data,error:error}).replace(/</g,'\\u003c');const html='<script>window.parent.postMessage('+safe+', "*");</script>';return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}
