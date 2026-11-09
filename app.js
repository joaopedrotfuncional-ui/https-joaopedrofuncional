(() => {
  const cfg = window.JP_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("COLE_AQUI") && !cfg.SUPABASE_ANON_KEY.includes("COLE_AQUI");
  const supabase = configured && window.supabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;
  const $ = (id) => document.getElementById(id);
  const money = (n) => Number(n || 0).toLocaleString("pt-BR", {style:"currency",currency:"BRL"});
  const isAdmin = new URLSearchParams(location.search).get("admin") === "1" || /access_token=|refresh_token=|type=recovery/.test(location.hash);
  $("public-view").classList.toggle("hidden", isAdmin);
  $("admin-view").classList.toggle("hidden", !isAdmin);
  let activeEvent = null, settings = {pix_key:"52.244.653/0001-10",whatsapp:"(81) 99951-0223",card_checkout_url:""};

  function message(id, text, good=false){ const el=$(id); if(el){el.textContent=text;el.style.color=good?"#087a57":"#b04444";} }
  function needConfig(){ if(!supabase){ if($("event-card")) $("event-card").innerHTML=""; if($("registration-form")) $("registration-form").classList.add("hidden"); return true;} return false; }
  function setPrice(){ if(!activeEvent)return; const pack=$("package").value; $("shirt-size-wrap").classList.toggle("hidden",pack!=="with_shirt"); $("shirt_size").required=pack==="with_shirt"; const value=pack==="no_shirt"?activeEvent.price_no_shirt:pack==="with_shirt"?activeEvent.price_with_shirt:null; $("total").textContent=value==null?"Selecione seu pacote":money(value); }
  async function loadPublic(){
    if(needConfig())return;
    const [ev,st]=await Promise.all([
      supabase.from("events").select("*").eq("status","active").order("created_at",{ascending:false}).limit(1).maybeSingle(),
      supabase.from("site_settings").select("pix_key,whatsapp,card_checkout_url").eq("id",1).maybeSingle()
    ]);
    if(st.data) settings=st.data;
    if(ev.error||!ev.data){$("event-card").innerHTML="<div class='loading'>No momento não há inscrições abertas. Acompanhe os canais da JP Sports.</div>";$("registration-form").classList.add("hidden");return;}
    activeEvent=ev.data;
    $("event-card").innerHTML=`<div class="event-tag">INSCRIÇÕES ABERTAS</div><h2>${esc(activeEvent.name)}</h2><div class="event-meta"><span>📅 <b>${fmtDate(activeEvent.event_date)}</b></span><span>📍 <b>${esc(activeEvent.location)}</b></span><span>⏰ Concentração <b>${esc(activeEvent.gathering||"")}</b></span><span>🏁 Largada <b>${esc(activeEvent.start_time||"")}</b></span></div>`;
    if(settings.card_checkout_url){$("card-option").querySelector("input").disabled=false;$("card-note").textContent="Checkout seguro em ambiente externo.";}
    $("package").addEventListener("change",setPrice);setPrice();
  }
  function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function fmtDate(d){if(!d)return "";const [y,m,day]=d.split("-");return `${day}/${m}/${y}`;}
  $("registration-form")?.addEventListener("submit",async e=>{
    e.preventDefault(); if(!supabase||!activeEvent)return;
    const f=new FormData(e.currentTarget), btn=$("submit-btn"); btn.disabled=true;btn.textContent="Enviando…";message("form-message","");
    const method=f.get("payment_method");
    const payload={p_full_name:f.get("full_name"),p_phone:f.get("phone"),p_email:f.get("email"),p_distance:f.get("distance"),p_package:f.get("package"),p_shirt_size:f.get("shirt_size")||null,p_payment_method:method,p_consent:f.get("consent")==="on"};
    const {data,error}=await supabase.rpc("register_participant",payload);
    btn.disabled=false;btn.textContent="Confirmar inscrição";
    if(error){message("form-message","Não foi possível concluir. "+error.message);return;}
    const r=Array.isArray(data)?data[0]:data;
    $("confirmation").classList.remove("hidden");
    const payment=method==="pix"?`<p><b>Pagamento via Pix:</b> ${esc(r.pix_key||settings.pix_key)}<br>Envie o comprovante para ${esc(settings.whatsapp)}. Sua inscrição ficará pendente até a confirmação.</p>`:`<p>Finalize o pagamento pelo link seguro do cartão. A inscrição ficará pendente até a confirmação.</p><p><a class="btn primary" href="${esc(r.checkout_url||settings.card_checkout_url)}" target="_blank" rel="noopener">Abrir pagamento</a></p>`;
    $("confirmation").innerHTML=`<h2>Inscrição recebida!</h2><p>Seu protocolo é <b>${esc(r.registration_code)}</b>.</p><p>Valor: <b>${money(r.amount)}</b></p>${payment}<p>Guarde seu protocolo para consultar com a organização.</p>`;
    $("confirmation").scrollIntoView({behavior:"smooth"});
    e.currentTarget.reset();setPrice();
  });
  async function loadAdmin(){
    if(needConfig())return;
    const {data:{session}}=await supabase.auth.getSession();
    if(session) await showDashboard(session.user);
    const adminEmail="joaopedrotfuncional@gmail.com";
    $("show-create-account").addEventListener("click",()=>$("create-account-form").classList.toggle("hidden"));
    $("show-reset-password").addEventListener("click",()=>$("reset-password-form").classList.toggle("hidden"));
    $("create-account-form").addEventListener("submit",async e=>{
      e.preventDefault();const f=new FormData(e.currentTarget);
      if(f.get("password")!==f.get("confirm_password")){message("create-account-message","As senhas não coincidem.");return;}
      const {error}=await supabase.auth.signUp({email:adminEmail,password:f.get("password"),options:{emailRedirectTo:location.origin+location.pathname+"?admin=1"}});
      message("create-account-message",error?error.message:"Solicitação recebida. Confira seu e-mail para confirmar o acesso. Se a conta já existir, use Esqueci minha senha.",!error);
    });
    $("reset-password-form").addEventListener("submit",async e=>{
      e.preventDefault();const {error}=await supabase.auth.resetPasswordForEmail(adminEmail,{redirectTo:location.origin+location.pathname+"?admin=1"});
      message("reset-password-message",error?error.message:"Se a conta estiver cadastrada, você receberá um link de recuperação por e-mail.",!error);
    });
    $("update-password-form").addEventListener("submit",async e=>{
      e.preventDefault();const f=new FormData(e.currentTarget);
      const {error}=await supabase.auth.updateUser({password:f.get("password")});
      message("update-password-message",error?error.message:"Senha atualizada. Você já pode acessar o painel.",!error);
      if(!error)$("update-password-form").classList.add("hidden");
    });
    supabase.auth.onAuthStateChange((event)=>{if(event==="PASSWORD_RECOVERY")$("update-password-form").classList.remove("hidden");});
    $("login-form").addEventListener("submit",async e=>{
      e.preventDefault();const f=new FormData(e.currentTarget);
      const {data,error}=await supabase.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});
      if(error){message("login-message",error.message);return;}
      if(data.user.email?.toLowerCase()!=="joaopedrotfuncional@gmail.com"){await supabase.auth.signOut();message("login-message","Esta conta não está autorizada.");return;}
      await showDashboard(data.user);
    });
    $("logout-btn").addEventListener("click",async()=>{await supabase.auth.signOut();$("dashboard").classList.add("hidden");$("login-card").classList.remove("hidden");});
    $("event-form").addEventListener("submit",saveEvent);
    $("settings-form").addEventListener("submit",saveSettings);
    $("csv-btn").addEventListener("click",exportCsv);
  }
  async function showDashboard(user){
    if(user.email?.toLowerCase()!=="joaopedrotfuncional@gmail.com"){await supabase.auth.signOut();return;}
    $("login-card").classList.add("hidden");$("dashboard").classList.remove("hidden");$("admin-email").textContent=user.email;
    await Promise.all([loadAdminData(),loadSettings()]);
  }
  async function loadAdminData(){
    const [ev,regs]=await Promise.all([supabase.from("events").select("*").order("created_at",{ascending:false}),supabase.from("registrations").select("*").order("created_at",{ascending:false})]);
    if(ev.error){$("admin-event").textContent=ev.error.message;return;}
    const active=ev.data.find(x=>x.status==="active");
    $("admin-event").innerHTML=active?`<b>${esc(active.name)}</b><p class="muted">${fmtDate(active.event_date)} • ${esc(active.location)} • ${active.status}</p>`:"Nenhum evento ativo.";
    const rows=regs.data||[];
    const paid=rows.filter(x=>x.payment_status==="confirmed");
    $("stats").innerHTML=[["Inscritos",rows.length],["Pagamentos confirmados",paid.length],["Pendentes",rows.filter(x=>x.payment_status==="pending").length],["Receita confirmada",money(paid.reduce((s,x)=>s+Number(x.amount),0))]].map(([l,v])=>`<div class="stat"><span>${l}</span><b>${v}</b></div>`).join("");
    $("registrations-body").innerHTML=rows.length?rows.map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.phone)}<br>${esc(x.email)}</td><td>${esc(x.distance)}</td><td>${x.package_type==="with_shirt"?"Com camisa":"Sem camisa"} ${x.shirt_size?"/ "+esc(x.shirt_size):""}</td><td>${esc(x.payment_method)}</td><td>${esc(x.payment_status)}</td><td><select data-id="${x.id}" class="status-select"><option value="pending" ${x.payment_status==="pending"?"selected":""}>Pendente</option><option value="confirmed" ${x.payment_status==="confirmed"?"selected":""}>Confirmado</option><option value="cancelled" ${x.payment_status==="cancelled"?"selected":""}>Cancelado</option></select></td></tr>`).join(""):"<tr><td colspan='7'>Nenhuma inscrição cadastrada.</td></tr>";
    document.querySelectorAll(".status-select").forEach(sel=>sel.addEventListener("change",async()=>{const {error}=await supabase.from("registrations").update({payment_status:sel.value}).eq("id",sel.dataset.id);if(error){alert("Não foi possível atualizar: "+error.message);}else await loadAdminData();}));
    window.__jpRows=rows;
  }
  async function loadSettings(){
    const {data,error}=await supabase.from("site_settings").select("*").eq("id",1).maybeSingle();
    if(error)return;
    if(data){for(const k of ["pix_key","whatsapp","card_checkout_url"])$("settings-form").elements[k].value=data[k]||"";}
  }
  async function saveSettings(e){e.preventDefault();const f=new FormData(e.currentTarget);const obj={id:1,pix_key:f.get("pix_key"),whatsapp:f.get("whatsapp"),card_checkout_url:f.get("card_checkout_url")||null};const {error}=await supabase.from("site_settings").upsert(obj);message("settings-message",error?error.message:"Configurações salvas.",!error);}
  async function saveEvent(e){
    e.preventDefault();const f=new FormData(e.currentTarget);
    const {error:deact}=await supabase.from("events").update({status:"paused"}).eq("status","active");
    if(deact){message("event-message",deact.message);return;}
    const obj={name:f.get("name"),event_date:f.get("event_date"),location:f.get("location"),gathering:f.get("gathering"),start_time:f.get("start_time"),price_no_shirt:Number(f.get("price_no_shirt")),price_with_shirt:Number(f.get("price_with_shirt")),status:"active"};
    const {error}=await supabase.from("events").insert(obj);message("event-message",error?error.message:"Evento criado e ativado.",!error);if(!error){e.currentTarget.reset();await loadAdminData();}
  }
  function exportCsv(){
    const rows=window.__jpRows||[];const cols=["full_name","phone","email","distance","package_type","shirt_size","payment_method","payment_status","amount","created_at"];
    const csv=[cols.join(";"),...rows.map(r=>cols.map(c=>`"${String(r[c]??"").replace(/"/g,'""')}"`).join(";"))].join("\r\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="inscricoes-jp-sports.csv";a.click();URL.revokeObjectURL(a.href);
  }
  if(isAdmin)loadAdmin();else loadPublic();
})();
