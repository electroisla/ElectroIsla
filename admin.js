const defaultProducts=[
{id:"a1",name:"Carne de cerdo",category:"Alimentos",price:12.5,currency:"USD",discountPrice:null,unit:"kg",image:"",description:"Carne de cerdo.",available:true},
{id:"a2",name:"Aceite",category:"Alimentos",price:8,currency:"USD",discountPrice:null,unit:"botella",image:"",description:"Aceite para cocina.",available:true},
{id:"a3",name:"Pescado",category:"Alimentos",price:10,currency:"USD",discountPrice:null,unit:"kg",image:"",description:"Pescado.",available:true},
{id:"a4",name:"Combo de alimentos",category:"Alimentos",price:35,currency:"USD",discountPrice:null,unit:"combo",image:"",description:"Combo promocional.",available:true},
{id:"e1",name:"Split",category:"Electrodomésticos",price:270,currency:"USD",discountPrice:null,unit:"unidad",image:"",description:"Aire acondicionado Split.",available:true},
{id:"e2",name:"Ventilador recargable",category:"Electrodomésticos",price:65,currency:"USD",discountPrice:null,unit:"unidad",image:"",description:"Ventilador recargable.",available:true},
{id:"e3",name:"Lavadora",category:"Electrodomésticos",price:320,currency:"USD",discountPrice:null,unit:"unidad",image:"",description:"Lavadora.",available:true},
{id:"e4",name:"Cocina",category:"Electrodomésticos",price:180,currency:"USD",discountPrice:null,unit:"unidad",image:"",description:"Cocina doméstica.",available:true}
];
let products=JSON.parse(localStorage.getItem("electroisla_products")||"null")||defaultProducts;
let storeSettings={usd_to_cup:700,transfer_markup_percent:0};
let categories=[];
const saveLocal=()=>localStorage.setItem("electroisla_products",JSON.stringify(products));
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const currencySymbols={USD:"$",CUP:"$",EUR:"€"};
const currencyLabel=c=>c||"USD";
const effectivePrice=p=>Number.isFinite(Number(p.discountPrice))&&Number(p.discountPrice)>=0&&Number(p.discountPrice)<Number(p.price)?Number(p.discountPrice):Number(p.price);
function priceHtml(p){
 const cur=currencyLabel(p.currency),sym=currencySymbols[cur]||"";
 const discounted=Number.isFinite(Number(p.discountPrice))&&Number(p.discountPrice)>=0&&Number(p.discountPrice)<Number(p.price);
 return discounted?`<span class="old-price">${sym}${Number(p.price).toFixed(2)} ${cur}</span> <span class="discount-price">${sym}${Number(p.discountPrice).toFixed(2)} ${cur}</span>`:`${sym}${Number(p.price).toFixed(2)} ${cur}`;
}
function toRow(p){
 return {id:String(p.id),name:p.name||"",category:p.category||"Alimentos",price:Number(p.price)||0,discount_price:p.discountPrice===null||p.discountPrice===undefined||p.discountPrice===""||Number(p.discountPrice)<=0?null:Number(p.discountPrice),currency:p.currency||"USD",unit:p.unit||"",image:p.image||"",description:p.description||"",available:p.available!==false};
}
function fromRow(r){
 return {id:String(r.id),name:r.name||"",category:r.category||"Alimentos",price:Number(r.price)||0,currency:r.currency||"USD",discountPrice:r.discount_price===null||r.discount_price===undefined?null:Number(r.discount_price),unit:r.unit||"",image:r.image||"",description:r.description||"",available:r.available!==false};
}

async function loadCategories(){
  const {data,error}=await supabaseClient.from("categories").select("*").order("sort_order",{ascending:true}).order("name",{ascending:true});
  if(error) throw error;
  categories=data||[];
  populateCategorySelect();
  renderCategories();
}

function populateCategorySelect(){
  const select=document.getElementById("pCategory");
  if(!select)return;
  const current=select.value;
  const list=categories.filter(c=>c.available!==false);
  select.innerHTML=list.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("");
  if(current && [...select.options].some(o=>o.value===current)) select.value=current;
  else if(select.options.length) select.selectedIndex=0;
  initCategoryPicker();
  syncCategoryPicker();
}


function syncCategoryPicker(){
  const select=document.getElementById("pCategory");
  const picker=document.getElementById("categoryPicker");
  const trigger=document.getElementById("categoryPickerTrigger");
  const valueBox=document.getElementById("categoryPickerValue");
  const optionsBox=document.getElementById("categoryPickerOptions");
  if(!select||!picker||!trigger||!valueBox||!optionsBox)return;

  const selected=select.value||"";
  const selectedText=select.options[select.selectedIndex]?.textContent||"Selecciona una categoría";
  valueBox.textContent=selectedText;

  optionsBox.innerHTML=[...select.options].map(o=>`
    <button type="button" class="ei-category-option ${o.value===selected?"selected":""}" role="option" aria-selected="${o.value===selected}" data-value="${esc(o.value)}">
      <span>${esc(o.textContent)}</span>${o.value===selected?'<span class="ei-category-check">✓</span>':""}
    </button>`).join("");

  optionsBox.querySelectorAll(".ei-category-option").forEach(btn=>{
    btn.addEventListener("click",()=>{
      select.value=btn.dataset.value;
      valueBox.textContent=select.options[select.selectedIndex]?.textContent||btn.dataset.value;
      picker.classList.remove("open");
      trigger.setAttribute("aria-expanded","false");
      syncCategoryPicker();
      select.dispatchEvent(new Event("change",{bubbles:true}));
    });
  });
}
function initCategoryPicker(){
  const picker=document.getElementById("categoryPicker");
  const trigger=document.getElementById("categoryPickerTrigger");
  if(!picker||!trigger||trigger.dataset.ready)return;
  trigger.dataset.ready="1";
  trigger.addEventListener("click",()=>{
    const open=!picker.classList.contains("open");
    picker.classList.toggle("open",open);
    trigger.setAttribute("aria-expanded",String(open));
  });
  document.addEventListener("click",(e)=>{
    if(!picker.contains(e.target)){
      picker.classList.remove("open");
      trigger.setAttribute("aria-expanded","false");
    }
  });
  syncCategoryPicker();
}

function initFancySelect(selectId,pickerId,triggerId,valueId,optionsId){
  const select=document.getElementById(selectId), picker=document.getElementById(pickerId), trigger=document.getElementById(triggerId), valueBox=document.getElementById(valueId), box=document.getElementById(optionsId);
  if(!select||!picker||!trigger||!valueBox||!box||picker.dataset.ready)return;
  picker.dataset.ready="1";
  function sync(){
    const opt=select.options[select.selectedIndex];
    valueBox.textContent=opt?.textContent||"Selecciona una opción";
    box.querySelectorAll(".ei-fancy-option").forEach(b=>{const on=b.dataset.value===select.value;b.classList.toggle("selected",on);b.setAttribute("aria-selected",String(on));b.innerHTML=`<span>${esc(b.dataset.label||b.textContent)}</span>${on?'<span class="ei-fancy-check">✓</span>':""}`;});
  }
  function build(){
    box.innerHTML="";
    [...select.children].forEach(node=>{
      if(node.tagName==="OPTGROUP"){
        const h=document.createElement("div");h.className="ei-fancy-group";h.textContent=node.label;box.appendChild(h);
        [...node.children].forEach(addOption);
      }else if(node.tagName==="OPTION") addOption(node);
    });
    sync();
  }
  function addOption(opt){
    const b=document.createElement("button");b.type="button";b.className="ei-fancy-option";b.dataset.value=opt.value;b.dataset.label=opt.textContent;b.setAttribute("role","option");
    b.addEventListener("click",()=>{select.value=opt.value;select.dispatchEvent(new Event("change",{bubbles:true}));picker.classList.remove("open");trigger.setAttribute("aria-expanded","false");sync();});
    box.appendChild(b);
  }
  trigger.addEventListener("click",()=>{const open=!picker.classList.contains("open");document.querySelectorAll(".ei-fancy-picker.open,.ei-category-picker.open").forEach(x=>x.classList.remove("open"));picker.classList.toggle("open",open);trigger.setAttribute("aria-expanded",String(open));});
  select.addEventListener("change",sync);
  build();
}
function syncFancySelects(){
  ["pCurrency","pUnit"].forEach(id=>{
    const select=document.getElementById(id);
    if(select)select.dispatchEvent(new Event("change",{bubbles:true}));
  });
  if(typeof syncCategoryPicker==="function")syncCategoryPicker();
}
function initAllFancySelects(){
  initFancySelect("pCurrency","currencyPicker","currencyPickerTrigger","currencyPickerValue","currencyPickerOptions");
  initFancySelect("pUnit","unitPicker","unitPickerTrigger","unitPickerValue","unitPickerOptions");
}

function renderCategories(){
  const box=document.getElementById("categoryList");
  if(!box)return;
  if(!categories.length){
    box.innerHTML='<div class="category-empty">No hay categorías creadas todavía.</div>';
    return;
  }
  box.innerHTML=categories.map(c=>`
    <div class="category-item ${c.available?"":"is-hidden"}">
      <div class="category-info">
        <div class="category-name">${esc(c.name)}</div>
        <span class="category-state">${c.available?"● Visible en la tienda":"○ Oculta en la tienda"}</span>
      </div>
      <div class="category-actions">
        <button type="button" class="btn secondary" onclick="editCategory(${Number(c.id)})">✏️ Editar</button>
        <button type="button" class="btn secondary" onclick="toggleCategory(${Number(c.id)})">${c.available?"👁️ Ocultar":"👁️ Mostrar"}</button>
        <button type="button" class="btn secondary" onclick="removeCategory(${Number(c.id)})">🗑️</button>
      </div>
    </div>`).join("");
}

function resetCategoryForm(){
  const form=document.getElementById("categoryForm");
  if(form)form.reset();
  const id=document.getElementById("categoryEditId");
  if(id)id.value="";
  const available=document.getElementById("categoryAvailable");
  if(available)available.checked=true;
  const btn=document.getElementById("saveCategory");
  if(btn)btn.textContent="➕ Agregar categoría";
  const cancel=document.getElementById("cancelCategoryEdit");
  if(cancel)cancel.style.display="none";
  const status=document.getElementById("categoryEditingStatus");
  if(status){status.style.display="none";status.textContent="";}
}

function editCategory(id){
  const c=categories.find(x=>Number(x.id)===Number(id));
  if(!c)return;
  document.getElementById("categoryEditId").value=c.id;
  document.getElementById("categoryName").value=c.name||"";
  document.getElementById("categoryAvailable").checked=c.available!==false;
  document.getElementById("saveCategory").textContent="💾 Guardar categoría";
  document.getElementById("cancelCategoryEdit").style.display="inline-flex";
  const status=document.getElementById("categoryEditingStatus");
  if(status){status.style.display="block";status.textContent=`Editando «${c.name}»`;}
  document.getElementById("categoryName").focus();
  document.getElementById("categoryForm").scrollIntoView({behavior:"smooth",block:"center"});
}

async function saveCategoryRecord(e){
  e.preventDefault();
  const name=document.getElementById("categoryName").value.trim();
  const available=document.getElementById("categoryAvailable").checked;
  const editId=document.getElementById("categoryEditId").value;
  if(!name){alert("Escribe el nombre de la categoría.");return}

  const duplicate=categories.find(c=>c.name.trim().toLowerCase()===name.toLowerCase() && String(c.id)!==String(editId));
  if(duplicate){alert("Ya existe una categoría con ese nombre.");return}

  const btn=document.getElementById("saveCategory");
  if(btn)btn.disabled=true;

  try{
    if(editId){
      const old=categories.find(c=>String(c.id)===String(editId));
      if(!old)throw new Error("No se encontró la categoría que estás editando.");

      if(old.name!==name){
        // Primero actualizamos los productos para que no queden apuntando al nombre anterior.
        const {error:prodErr}=await supabaseClient.from("products").update({category:name}).eq("category",old.name);
        if(prodErr)throw prodErr;
      }

      const {error}=await supabaseClient.from("categories").update({
        name,available,updated_at:new Date().toISOString()
      }).eq("id",editId);
      if(error){
        if(old.name!==name) await supabaseClient.from("products").update({category:old.name}).eq("category",name);
        throw error;
      }
      alert("✅ Categoría actualizada.");
    }else{
      const maxOrder=categories.reduce((m,c)=>Math.max(m,Number(c.sort_order)||0),0);
      const {error}=await supabaseClient.from("categories").insert({
        name,available,sort_order:maxOrder+1
      });
      if(error)throw error;
      alert("✅ Categoría creada.");
    }

    resetCategoryForm();
    await loadCategories();
    await loadCloud();
    render();
    const status=document.getElementById("cloudStatus");
    if(status)status.textContent=`☁️ Sincronizado con Supabase · ${products.length} productos`;
  }catch(err){
    alert("No se pudo guardar la categoría en Supabase.\n\n"+(err.message||err));
  }finally{
    if(btn)btn.disabled=false;
  }
}

async function toggleCategory(id){
  const c=categories.find(x=>Number(x.id)===Number(id));
  if(!c)return;
  const next=!c.available;
  try{
    const {error}=await supabaseClient.from("categories").update({available:next,updated_at:new Date().toISOString()}).eq("id",id);
    if(error)throw error;
    await loadCategories();
  }catch(err){
    alert("No se pudo cambiar la visibilidad de la categoría.\n\n"+(err.message||err));
  }
}

async function removeCategory(id){
  const c=categories.find(x=>Number(x.id)===Number(id));
  if(!c)return;
  const {count,error:countErr}=await supabaseClient.from("products").select("id",{count:"exact",head:true}).eq("category",c.name);
  if(countErr){alert("No se pudo comprobar si la categoría tiene productos.\n\n"+(countErr.message||countErr));return}
  if(Number(count)>0){
    alert(`No se puede eliminar «${c.name}» porque tiene ${count} producto(s) asociado(s).\n\nPuedes ocultarla o mover esos productos a otra categoría.`);
    return;
  }
  if(!confirm(`¿Eliminar la categoría «${c.name}»?`))return;
  try{
    const {error}=await supabaseClient.from("categories").delete().eq("id",id);
    if(error)throw error;
    resetCategoryForm();
    await loadCategories();
    alert("✅ Categoría eliminada.");
  }catch(err){
    alert("No se pudo eliminar la categoría.\n\n"+(err.message||err));
  }
}

async function loadSettings(){
 const {data,error}=await supabaseClient.from("store_settings").select("usd_to_cup,transfer_markup_percent").eq("id",1).maybeSingle();
 if(error) throw error;
 if(data){
   storeSettings={usd_to_cup:Number(data.usd_to_cup)||0,transfer_markup_percent:Number(data.transfer_markup_percent)||0};
 }
 const rate=document.getElementById("usdToCup"),markup=document.getElementById("transferMarkup");
 if(rate) rate.value=storeSettings.usd_to_cup;
 if(markup) markup.value=storeSettings.transfer_markup_percent;
 const status=document.getElementById("settingsStatus");
 if(status) status.textContent=`☁️ Tasa: ${storeSettings.usd_to_cup} CUP/USD · Transferencia: ${storeSettings.transfer_markup_percent}%`;
}
async function saveSettings(){
 const rate=Number(document.getElementById("usdToCup").value);
 const markup=Number(document.getElementById("transferMarkup").value);
 if(!Number.isFinite(rate)||rate<=0){alert("La tasa USD → CUP debe ser mayor que 0.");return}
 if(!Number.isFinite(markup)||markup<0){alert("El recargo de transferencia no puede ser negativo.");return}
 const btn=document.getElementById("saveSettings"),status=document.getElementById("settingsStatus");
 if(btn) btn.disabled=true;
 if(status) status.textContent="☁️ Guardando…";
 try{
   const {error}=await supabaseClient.from("store_settings").upsert({id:1,usd_to_cup:rate,transfer_markup_percent:markup,updated_at:new Date().toISOString()},{onConflict:"id"});
   if(error) throw error;
   storeSettings={usd_to_cup:rate,transfer_markup_percent:markup};
   if(status) status.textContent=`✅ Guardado · ${rate} CUP/USD · Transferencia: ${markup}%`;
   alert("✅ Configuración de precios guardada y sincronizada.");
 }catch(err){
   if(status) status.textContent="⚠️ No se pudo guardar la configuración.";
   alert("No se pudo guardar la configuración en Supabase.\n\n"+(err.message||err));
 }finally{if(btn) btn.disabled=false}
}
async function loadCloud(){
 const {data,error}=await supabaseClient.from("products").select("*").order("created_at",{ascending:true});
 if(error) throw error;
 if(data && data.length){
   products=data.map(fromRow);
   saveLocal();
   return "cloud";
 }
 // Solo migra el catálogo local si la nube está realmente vacía.
 const local=products.length?products:defaultProducts;
 if(!local.length) return "empty";
 const {error:upErr}=await supabaseClient.from("products").upsert(local.map(toRow),{onConflict:"id"});
 if(upErr) throw upErr;
 products=local;
 saveLocal();
 return "migrated";
}
async function cloudUpsert(p){
 const {error}=await supabaseClient.from("products").upsert(toRow(p),{onConflict:"id"});
 if(error) throw error;
}
async function cloudDelete(id){
 const {error}=await supabaseClient.from("products").delete().eq("id",String(id));
 if(error) throw error;
}
function loginBoxMessage(msg){
 const p=document.querySelector("#loginBox .login-status"); if(p)p.textContent=msg||"";
}
async function login(){
 const email=document.getElementById("adminEmail").value.trim();
 const password=document.getElementById("adminPass").value;
 if(!email||!password){alert("Escribe el correo y la contraseña de tu usuario de Supabase.");return}
 loginBoxMessage("Conectando…");
 const {error}=await supabaseClient.auth.signInWithPassword({email,password});
 if(error){loginBoxMessage("");alert("No se pudo iniciar sesión: "+error.message);return}
 await show();
}
async function show(){
 document.getElementById("loginBox").classList.add("hidden");
 document.getElementById("dashboard").classList.remove("hidden");
 loginBoxMessage("");
 const status=document.getElementById("cloudStatus");
 if(status) status.textContent="☁️ Conectando con Supabase…";
 try{
   await loadSettings();
   await loadCategories();
   const source=await loadCloud();
   render();
   if(status) status.textContent=source==="cloud"?`☁️ Sincronizado con Supabase · ${products.length} productos`:source==="migrated"?`☁️ Catálogo local enviado a Supabase · ${products.length} productos`:"☁️ Supabase conectado · catálogo vacío";
 }catch(err){
   console.error(err);
   render();
   if(status) status.textContent="⚠️ No se pudo leer Supabase: "+(err.message||err);
   alert("No se pudo cargar el catálogo de Supabase.\n\n"+(err.message||err));
 }
}
function render(){
 const box=document.getElementById("adminProducts");
 box.innerHTML=products.length?products.map(p=>`<div class="admin-product ${p.available?"":"disabled"}"><div>${p.image?`<img src="${esc(p.image)}" alt="">`:"📦"}</div><div><h4>${esc(p.name)}</h4><small>${esc(p.category)} · ${priceHtml(p)} · ${esc(p.unit||"")} · ${p.available?"Disponible":"Oculto"}</small></div><div class="admin-actions"><button onclick="edit('${esc(p.id)}')">✏️</button><button onclick="toggle('${esc(p.id)}')">👁️</button><button onclick="removeP('${esc(p.id)}')">🗑️</button></div></div>`).join(""):"<p>No hay productos. Agrega el primero.</p>";
}
function edit(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 document.getElementById("editId").value=p.id;document.getElementById("pName").value=p.name;
 document.getElementById("pCategory").value=p.category;document.getElementById("pPrice").value=p.price;document.getElementById("pCurrency").value=p.currency||"USD";document.getElementById("pDiscountPrice").value=p.discountPrice??"";
 const unitOptions=[...document.getElementById("pUnit").options].map(o=>o.value);
 if(unitOptions.includes(p.unit||"")){document.getElementById("pUnit").value=p.unit||"";document.getElementById("pUnitCustom").value="";document.getElementById("pUnitCustom").style.display="none";}
 else{document.getElementById("pUnit").value="__otra__";document.getElementById("pUnitCustom").value=p.unit||"";document.getElementById("pUnitCustom").style.display="block";}
 document.getElementById("pImage").value=p.image||"";document.getElementById("pDescription").value=p.description||"";document.getElementById("pAvailable").checked=p.available!==false;
 document.getElementById("formTitle").textContent="✏️ Editar producto";syncFancySelects();showPreview(p.image||"");scrollTo(0,0)
}
async function toggle(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 const old=p.available;p.available=!p.available;saveLocal();render();
 try{await cloudUpsert(p);const status=document.getElementById("cloudStatus");if(status)status.textContent=`☁️ Sincronizado con Supabase · ${products.length} productos`;}catch(err){p.available=old;saveLocal();render();alert("No se pudo sincronizar el cambio con Supabase.\n\n"+(err.message||err));}
}
async function removeP(id){
 if(!confirm("¿Eliminar este producto?"))return;
 const old=[...products];products=products.filter(x=>x.id!==id);saveLocal();render();
 try{await cloudDelete(id);const status=document.getElementById("cloudStatus");if(status)status.textContent=`☁️ Sincronizado con Supabase · ${products.length} productos`;}catch(err){products=old;saveLocal();render();alert("No se pudo eliminar el producto de Supabase.\n\n"+(err.message||err));}
}
function showPreview(src){
 const box=document.getElementById("imagePreview"),status=document.getElementById("photoStatus");
 box.innerHTML=src?`<img src="${esc(src)}" alt="Vista previa">`:"";
 if(status)status.textContent=src?"Foto seleccionada correctamente.":"Toca el botón y selecciona una imagen de tu Android.";
}
function compressImage(file){
 return new Promise((resolve,reject)=>{
   if(!file || !file.type.startsWith("image/")){reject(new Error("El archivo seleccionado no es una imagen compatible."));return}
   const url=URL.createObjectURL(file);
   const finish=(img)=>{try{const max=1000,scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const ctx=c.getContext("2d");ctx.drawImage(img,0,0,c.width,c.height);const data=c.toDataURL("image/jpeg",.82);URL.revokeObjectURL(url);if(!data||data.length<100){reject(new Error("No se pudo convertir la foto."));return}resolve(data)}catch(err){URL.revokeObjectURL(url);reject(err)}};
   if("createImageBitmap" in window){createImageBitmap(file).then(finish).catch(()=>{const img=new Image();img.onload=()=>finish(img);img.onerror=()=>reject(new Error("Tu navegador no puede leer esta imagen. Prueba con JPG o PNG."));img.src=url})}else{const img=new Image();img.onload=()=>finish(img);img.onerror=()=>reject(new Error("Tu navegador no puede leer esta imagen. Prueba con JPG o PNG."));img.src=url}
 });
}
const picker=document.getElementById("pImageFile");
picker.addEventListener("change",async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;const status=document.getElementById("photoStatus");status.textContent="Leyendo la foto…";try{const data=await compressImage(file);document.getElementById("pImage").value=data;showPreview(data);status.textContent="✅ Foto cargada. Ahora pulsa «Guardar producto»."}catch(err){document.getElementById("pImage").value="";document.getElementById("imagePreview").innerHTML="";status.textContent="❌ No se pudo cargar la foto.";alert(err.message||"No se pudo cargar la foto.")}finally{picker.value=""}});


initAllFancySelects();
document.getElementById("categoryForm").addEventListener("submit",saveCategoryRecord);
document.getElementById("cancelCategoryEdit").onclick=resetCategoryForm;

document.getElementById("pUnit").addEventListener("change",()=>{const other=document.getElementById("pUnit").value==="__otra__";document.getElementById("pUnitCustom").style.display=other?"block":"none";if(!other)document.getElementById("pUnitCustom").value=""});

document.getElementById("productForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const discountRaw=document.getElementById("pDiscountPrice").value.trim();const regularPrice=Number(document.getElementById("pPrice").value);let discountPrice=discountRaw===""?null:Number(discountRaw);
 if(discountPrice!==null&&discountPrice<=0){discountPrice=null}
 if(discountPrice!==null&&discountPrice>=regularPrice){alert("El precio en descuento debe ser mayor que 0 y menor que el precio normal.");return}
 const unitSelect=document.getElementById("pUnit").value;const unit=unitSelect==="__otra__"?document.getElementById("pUnitCustom").value.trim():unitSelect;
 if(!unit){alert("Selecciona una unidad o escribe una presentación personalizada.");return}
 const p={id:document.getElementById("editId").value||Date.now().toString(),name:document.getElementById("pName").value.trim(),category:document.getElementById("pCategory").value,price:regularPrice,currency:document.getElementById("pCurrency").value,discountPrice:discountPrice,unit:unit,image:document.getElementById("pImage").value,description:document.getElementById("pDescription").value.trim(),available:document.getElementById("pAvailable").checked};
 if(!p.name){alert("Escribe el nombre del producto.");return}
 const id=document.getElementById("editId").value;const old=[...products];if(id)products=products.map(x=>x.id===id?p:x);else products.push(p);saveLocal();render();
 try{await cloudUpsert(p);reset();render();const status=document.getElementById("cloudStatus");if(status)status.textContent=`☁️ Sincronizado con Supabase · ${products.length} productos`;alert("✅ Producto guardado y sincronizado en la nube.")}catch(err){products=old;saveLocal();render();alert("No se pudo guardar en Supabase. El cambio local fue revertido.\n\n"+(err.message||err))}
});
function reset(){document.getElementById("productForm").reset();document.getElementById("editId").value="";document.getElementById("pImage").value="";document.getElementById("formTitle").textContent="➕ Agregar producto";document.getElementById("pAvailable").checked=true;document.getElementById("pCurrency").value="USD";document.getElementById("pDiscountPrice").value="";document.getElementById("pUnitCustom").value="";document.getElementById("pUnitCustom").style.display="none";syncFancySelects();showPreview("")}
document.getElementById("cancelEdit").onclick=reset;
document.getElementById("saveSettings").onclick=saveSettings;
document.getElementById("loginBtn").onclick=login;
document.getElementById("refreshCloud").onclick=async()=>{
 const status=document.getElementById("cloudStatus");
 if(status)status.textContent="☁️ Actualizando…";
 try{await loadSettings();await loadCategories();const source=await loadCloud();render();if(status)status.textContent=`☁️ ${source==="cloud"?"Sincronizado con Supabase":"Catálogo actualizado"} · ${products.length} productos`;}
 catch(err){if(status)status.textContent="⚠️ "+(err.message||err);alert("No se pudo actualizar el catálogo.\n\n"+(err.message||err));}
};
document.getElementById("logoutBtn").onclick=async()=>{await supabaseClient.auth.signOut();location.reload()};
(async()=>{const {data:{session}}=await supabaseClient.auth.getSession();if(session)await show()})();
supabaseClient.channel("products-admin").on("postgres_changes",{event:"*",schema:"public",table:"products"},async()=>{try{const {data,error}=await supabaseClient.from("products").select("*").order("created_at",{ascending:true});if(!error&&data){products=data.map(fromRow);saveLocal();render()}}catch(e){console.warn(e)}}).subscribe();
supabaseClient.channel("settings-admin").on("postgres_changes",{event:"*",schema:"public",table:"store_settings"},async()=>{try{await loadSettings()}catch(e){console.warn(e)}}).subscribe();

supabaseClient.channel("categories-admin").on("postgres_changes",{event:"*",schema:"public",table:"categories"},async()=>{
  try{await loadCategories()}catch(e){console.warn(e)}
}).subscribe();



// ElectroIsla — reporte de ventas
let salesRows=[];
function salesMoney(value,currency){
  const n=Number(value)||0;
  return (currency==="USD"?"$":"$")+n.toFixed(2)+" "+currency;
}
function salesEscape(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function salesRangeStart(){
  const range=document.getElementById("salesRange")?.value||"7d";
  if(range==="all")return null;
  const d=new Date();
  d.setHours(0,0,0,0);
  if(range==="today")return d.toISOString();
  d.setDate(d.getDate()-(range==="30d"?29:6));
  return d.toISOString();
}
function renderSalesList(id,items,empty="Sin datos") {
  const box=document.getElementById(id); if(!box)return;
  box.innerHTML=items.length?items.map(x=>`<div class="sales-list-row"><span>${salesEscape(x.label)}</span><strong>${salesEscape(x.value)}</strong></div>`).join(""):`<div class="sales-empty">${empty}</div>`;
}
function renderSalesReport(rows){
  salesRows=rows||[];
  const count=document.getElementById("salesOrdersCount");
  const usd=document.getElementById("salesUsdTotal");
  const cup=document.getElementById("salesCupTotal");
  if(count)count.textContent=String(salesRows.length);
  let usdTotal=0,cupTotal=0;
  const productsMap={},paymentsMap={},categoriesMap={},dailyMap={};
  salesRows.forEach(o=>{
    const cur=String(o.currency||"USD").toUpperCase();
    const total=Number(o.total)||0;
    if(cur==="USD")usdTotal+=total;else cupTotal+=total;
    const pm=String(o.payment_method||"Sin especificar");
    paymentsMap[pm]=(paymentsMap[pm]||0)+total;
    const day=o.created_at?new Date(o.created_at).toLocaleDateString("es-ES"):"Sin fecha";
    dailyMap[day]=(dailyMap[day]||0)+total;
    const items=Array.isArray(o.items)?o.items:[];
    items.forEach(it=>{
      const name=String(it.name||"Producto");
      const qty=Number(it.qty)||0;
      productsMap[name]=(productsMap[name]||0)+qty;
      const cat=String(it.category||"Sin categoría");
      categoriesMap[cat]=(categoriesMap[cat]||0)+(Number(it.line_total)||0);
    });
  });
  if(usd)usd.textContent=salesMoney(usdTotal,"USD");
  if(cup)cup.textContent=salesMoney(cupTotal,"CUP");
  renderSalesList("salesTopProducts",Object.entries(productsMap).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>({label:k,value:`${v} uds.`})));
  renderSalesList("salesPayments",Object.entries(paymentsMap).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({label:k,value:salesMoney(v,(k==="USD"||k==="ZELLE")?"USD":"CUP")})));
  renderSalesList("salesCategories",Object.entries(categoriesMap).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({label:k,value:salesMoney(v,"USD")})));
  renderSalesList("salesDaily",Object.entries(dailyMap).sort((a,b)=>new Date(a[0])-new Date(b[0])).map(([k,v])=>({label:k,value:salesMoney(v,"USD")})));
  const table=document.getElementById("salesOrdersTable");
  if(table){
    table.innerHTML=salesRows.length?`<table class="sales-table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Pago</th><th>Total</th><th>Estado</th></tr></thead><tbody>${salesRows.map(o=>{const cur=String(o.currency||"USD").toUpperCase();return `<tr><td>${salesEscape(o.created_at?new Date(o.created_at).toLocaleString("es-ES"):"")}</td><td>${salesEscape(o.customer_name||"")}<small>${salesEscape(o.customer_phone||"")}</small></td><td>${salesEscape(o.payment_method||"")}</td><td>${salesMoney(o.total,cur)}</td><td>${salesEscape(o.status||"sent")}</td></tr>`}).join("")}</tbody></table>`:`<div class="sales-empty">No hay pedidos registrados en este período.</div>`;
  }
}
async function loadSalesReport(){
  const status=document.getElementById("salesStatus");
  if(status)status.textContent="☁️ Cargando ventas…";
  try{
    let query=supabaseClient.from("orders").select("id,created_at,customer_name,customer_phone,delivery_zone,payment_method,currency,subtotal,delivery_fee,total,items,note,status").order("created_at",{ascending:false});
    const start=salesRangeStart();
    if(start)query=query.gte("created_at",start);
    const {data,error}=await query;
    if(error)throw error;
    renderSalesReport(data||[]);
    if(status)status.textContent=`☁️ ${data?.length||0} pedido(s) encontrado(s)`;
  }catch(err){
    salesRows=[];renderSalesReport([]);
    if(status)status.textContent="⚠️ No se pudo cargar el reporte: "+(err.message||err);
  }
}
function exportSalesCsv(){
  if(!salesRows.length){alert("No hay ventas para exportar en el período seleccionado.");return}
  const headers=["Fecha","Cliente","Teléfono","Zona","Método de pago","Moneda","Subtotal","Domicilio","Total","Estado"];
  const rows=salesRows.map(o=>[o.created_at,o.customer_name,o.customer_phone,o.delivery_zone,o.payment_method,o.currency,o.subtotal,o.delivery_fee,o.total,o.status]);
  const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\
");
  const blob=new Blob(["\\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`electroisla-ventas-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);
}
document.getElementById("salesRange")?.addEventListener("change",loadSalesReport);
document.getElementById("salesRefresh")?.addEventListener("click",loadSalesReport);
document.getElementById("salesExport")?.addEventListener("click",exportSalesCsv);
supabaseClient.channel("orders-admin").on("postgres_changes",{event:"*",schema:"public",table:"orders"},()=>loadSalesReport()).subscribe();
const originalShow=show;
show=async function(){await originalShow();await loadSalesReport()};
