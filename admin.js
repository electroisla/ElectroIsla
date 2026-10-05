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
let categoryOrder=[];
async function loadCategoryOrder(){
 const box=document.getElementById("categoryOrderList"),status=document.getElementById("categoryOrderStatus");
 try{
  const {data,error}=await supabaseClient.from("categories").select("id,name,sort_order,available").order("sort_order",{ascending:true}).order("name",{ascending:true});
  if(error)throw error;
  categoryOrder=(data||[]).filter(c=>String(c.name||"").trim()).map(c=>({id:c.id,name:String(c.name).trim(),sort_order:Number(c.sort_order)||0,available:c.available!==false}));
  renderCategoryOrder();
  if(status)status.textContent=`☁️ ${categoryOrder.length} categorías cargadas`;
 }catch(err){
  if(box)box.innerHTML="<p>⚠️ No se pudieron cargar las categorías.</p>";
  if(status)status.textContent="⚠️ Error al cargar";
  console.error(err);
 }
}
function renderCategoryOrder(){
 const box=document.getElementById("categoryOrderList"); if(!box)return;
 if(!categoryOrder.length){box.innerHTML="<p>No hay categorías creadas.</p>";return;}
 box.innerHTML=categoryOrder.map((c,i)=>`<div class="category-order-item ${c.available?"":"disabled"}" data-index="${i}"><span class="category-order-position">${i+1}</span><strong>${esc(c.name)}</strong><div class="category-order-actions"><button type="button" class="category-move" data-dir="up" data-index="${i}" ${i===0?"disabled":""} aria-label="Subir ${esc(c.name)}">↑</button><button type="button" class="category-move" data-dir="down" data-index="${i}" ${i===categoryOrder.length-1?"disabled":""} aria-label="Bajar ${esc(c.name)}">↓</button></div></div>`).join("");
 box.querySelectorAll(".category-move").forEach(btn=>btn.addEventListener("click",()=>{
  const i=Number(btn.dataset.index),j=btn.dataset.dir==="up"?i-1:i+1;
  if(j<0||j>=categoryOrder.length)return;
  [categoryOrder[i],categoryOrder[j]]=[categoryOrder[j],categoryOrder[i]];
  renderCategoryOrder();
  const status=document.getElementById("categoryOrderStatus");if(status)status.textContent="✏️ Orden modificado · pulsa Guardar orden";
 }));
}
async function saveCategoryOrder(){
 const btn=document.getElementById("saveCategoryOrder"),status=document.getElementById("categoryOrderStatus");
 if(!categoryOrder.length)return;
 if(btn)btn.disabled=true;if(status)status.textContent="☁️ Guardando orden…";
 const old=categoryOrder.map(c=>({...c}));
 try{
  for(let i=0;i<categoryOrder.length;i++){
   const {error}=await supabaseClient.from("categories").update({sort_order:i+1}).eq("id",categoryOrder[i].id);
   if(error)throw error;
   categoryOrder[i].sort_order=i+1;
  }
  if(status)status.textContent="✅ Orden guardado y sincronizado con la tienda";
 }catch(err){
  categoryOrder=old;renderCategoryOrder();
  if(status)status.textContent="⚠️ No se pudo guardar el orden";
  alert("No se pudo guardar el orden de las categorías en Supabase.\n\n"+(err.message||err));
 }finally{if(btn)btn.disabled=false}
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
   await loadCategoryOrder();
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
 document.getElementById("formTitle").textContent="✏️ Editar producto";showPreview(p.image||"");scrollTo(0,0)
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
function reset(){document.getElementById("productForm").reset();document.getElementById("editId").value="";document.getElementById("pImage").value="";document.getElementById("formTitle").textContent="➕ Agregar producto";document.getElementById("pAvailable").checked=true;document.getElementById("pCurrency").value="USD";document.getElementById("pDiscountPrice").value="";document.getElementById("pUnitCustom").value="";document.getElementById("pUnitCustom").style.display="none";showPreview("")}
document.getElementById("cancelEdit").onclick=reset;
document.getElementById("saveSettings").onclick=saveSettings;
document.getElementById("saveCategoryOrder").onclick=saveCategoryOrder;
document.getElementById("loginBtn").onclick=login;
document.getElementById("refreshCloud").onclick=async()=>{
 const status=document.getElementById("cloudStatus");
 if(status)status.textContent="☁️ Actualizando…";
 try{await loadSettings();await loadCategoryOrder();const source=await loadCloud();render();if(status)status.textContent=`☁️ ${source==="cloud"?"Sincronizado con Supabase":"Catálogo actualizado"} · ${products.length} productos`;}
 catch(err){if(status)status.textContent="⚠️ "+(err.message||err);alert("No se pudo actualizar el catálogo.\n\n"+(err.message||err));}
};
document.getElementById("logoutBtn").onclick=async()=>{await supabaseClient.auth.signOut();location.reload()};
(async()=>{const {data:{session}}=await supabaseClient.auth.getSession();if(session)await show()})();
supabaseClient.channel("products-admin").on("postgres_changes",{event:"*",schema:"public",table:"products"},async()=>{try{const {data,error}=await supabaseClient.from("products").select("*").order("created_at",{ascending:true});if(!error&&data){products=data.map(fromRow);saveLocal();render()}}catch(e){console.warn(e)}}).subscribe();
supabaseClient.channel("categories-admin").on("postgres_changes",{event:"*",schema:"public",table:"categories"},async()=>{try{await loadCategoryOrder()}catch(e){console.warn(e)}}).subscribe();
supabaseClient.channel("settings-admin").on("postgres_changes",{event:"*",schema:"public",table:"store_settings"},async()=>{try{await loadSettings()}catch(e){console.warn(e)}}).subscribe();
