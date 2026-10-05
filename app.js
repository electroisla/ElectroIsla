// ElectroIsla 9.8.1
const WHATSAPP="5352017110";
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
let cart=JSON.parse(localStorage.getItem("electroisla_cart")||"[]");
let storeSettings={usd_to_cup:700,transfer_markup_percent:0};
const currencySymbols={USD:"$",CUP:"$",EUR:"€"};
const money=(n,currency="USD")=>(currencySymbols[currency]||"")+Number(n).toFixed(2)+" "+currency;
const effectivePrice=p=>Number.isFinite(Number(p.discountPrice))&&Number(p.discountPrice)>0&&Number(p.discountPrice)<Number(p.price)?Number(p.discountPrice):Number(p.price);
const cashCup=p=>{const base=effectivePrice(p);if((p.currency||"USD")==="USD")return base*Number(storeSettings.usd_to_cup||0);if((p.currency||"USD")==="CUP")return base;return null};
const transferCup=p=>{const cash=cashCup(p);return cash===null?null:cash*(1+Number(storeSettings.transfer_markup_percent||0)/100)};
const DELIVERY_FEES={
 "Nueva Gerona":0,
 "Micro 70":0,
 "Micro 2":0,
 "Abel Santa María":0,
 "Pueblo Nuevo":0,
 "Francoi":0,
 "Sierra Caballos":0,
 "Nazareno":0,
 "Chacón":5,
 "Patria":5,
 "Los Colonos":5,
 "Los Bejeranos":5,
 "La Fe":10,
 "Demajagua":10,
 "La Victoria":10,
 "Atanagildo":10,
 "Mella":10,
 "Ciro Redondo":10,
 "Otro":10
};
function getDeliveryZone(){
 const zone=document.getElementById("municipality")?.value||"";
 const other=document.getElementById("otherZone")?.value.trim()||"";
 return zone==="Otro"?(other?`Otro: ${other}`:"Otro"):zone;
}
function getDeliveryFeeUSD(){
 const zoneSelect=document.getElementById("municipality");
 const zone=zoneSelect?.value||"";
 if(!zone)return 0;
 const selectedOption=zoneSelect?.selectedOptions?.[0];
 const optionFee=selectedOption?.dataset?.fee;
 if(optionFee!==undefined && optionFee!=="") return Number(optionFee)||0;
 return Number(DELIVERY_FEES[zone]||0);
}
function updateDeliveryFields(){
 const zone=document.getElementById("municipality")?.value||"";
 const wrap=document.getElementById("otherZoneWrap");
 const input=document.getElementById("otherZone");
 if(wrap)wrap.classList.toggle("hidden",zone!=="Otro");
 if(input){
  input.required=zone==="Otro";
  if(zone!=="Otro")input.value="";
 }
 updatePaymentSummary();
}
function setupDeliveryPicker(){
 const select=document.getElementById("municipality");
 const picker=document.getElementById("deliveryPicker");
 const trigger=document.getElementById("deliveryTrigger");
 const menu=document.getElementById("deliveryMenu");
 const textBox=document.getElementById("deliverySelectedText");
 const feeBox=document.getElementById("deliverySelectedFee");
 if(!select||!picker||!trigger||!menu)return;
 const options=[...select.options];
 menu.innerHTML=options.map((o,index)=>{
   const fee=o.dataset.fee;
   const feeText=o.value===""?"":(Number(fee||0)>0?`${fee} USD`:"Gratis");
   return `<button type="button" class="delivery-option${o.value===""?" placeholder-option":""}" data-value="${esc(o.value)}" role="option" aria-selected="${o.selected}"><span>${esc(o.value?o.value:o.textContent)}</span>${feeText?`<b>${feeText}</b>`:""}</button>`;
 }).join("");
 function sync(){
   const o=select.options[select.selectedIndex];
   const value=select.value;
   textBox.textContent=value?o.textContent.split(" — ")[0]:"Selecciona tu zona";
   feeBox.textContent=value?(Number(o.dataset.fee||0)>0?`${o.dataset.fee} USD`:"Gratis"):"—";
   menu.querySelectorAll(".delivery-option").forEach(btn=>{
     const active=btn.dataset.value===value;
     btn.classList.toggle("active",active);
     btn.setAttribute("aria-selected",String(active));
   });
 }
 function close(){picker.classList.remove("open");trigger.setAttribute("aria-expanded","false");}
 trigger.addEventListener("click",()=>{const open=!picker.classList.contains("open");picker.classList.toggle("open",open);trigger.setAttribute("aria-expanded",String(open));});
 menu.addEventListener("click",e=>{
   const btn=e.target.closest(".delivery-option");
   if(!btn)return;
   select.value=btn.dataset.value;
   select.dispatchEvent(new Event("change",{bubbles:true}));
   sync();
   close();
 });
 select.addEventListener("change",sync);
 document.addEventListener("click",e=>{if(!picker.contains(e.target))close();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
 sync();
}

function priceMarkup(p){const cur=p.currency||"USD",sym=currencySymbols[cur]||"";const discounted=effectivePrice(p)<Number(p.price);const original=discounted?`<span class="old-price">${sym}${Number(p.price).toFixed(2)} ${cur}</span> `:"";return `${original}<span class="discount-price">${sym}${effectivePrice(p).toFixed(2)} ${cur}</span>`;}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
async function loadStoreSettings(){const {data,error}=await supabaseClient.from("store_settings").select("usd_to_cup,transfer_markup_percent").eq("id",1).maybeSingle();if(error)throw error;if(data){storeSettings={usd_to_cup:Number(data.usd_to_cup)||0,transfer_markup_percent:Number(data.transfer_markup_percent)||0}}}
function save(){localStorage.setItem("electroisla_products",JSON.stringify(products));localStorage.setItem("electroisla_cart",JSON.stringify(cart))}
function fromRow(r){return{id:String(r.id),name:r.name||"",category:r.category||"Alimentos",price:Number(r.price)||0,currency:r.currency||"USD",discountPrice:r.discount_price===null||r.discount_price===undefined||Number(r.discount_price)<=0?null:Number(r.discount_price),unit:r.unit||"",image:r.image||"",description:r.description||"",available:r.available!==false}}
async function loadCloudProducts(){const {data,error}=await supabaseClient.from("products").select("*").order("created_at",{ascending:true});if(error)throw error;if(data&&data.length){products=data.map(fromRow);save();return true}return false}
async function startCloud(){try{await loadStoreSettings();await loadCloudProducts();render();renderCart()}catch(err){console.warn("Supabase no disponible; usando catálogo local.",err);render();renderCart()}}
let currentFilter="Todos";
function updateStickyOrder(){const bar=document.getElementById("stickyOrder");if(!bar)return;const count=cart.reduce((s,i)=>s+i.qty,0);let total=0;cart.forEach(i=>{const p=products.find(x=>x.id===i.id);if(p)total+=effectivePrice(p)*i.qty});bar.classList.toggle("visible",count>0);const c=bar.querySelector("[data-sticky-count]");const t=bar.querySelector("[data-sticky-total]");if(c)c.textContent=`${count} producto${count===1?"":"s"}`;if(t)t.textContent=money(total,"USD")}
function render(filter="Todos"){const box=document.getElementById("products");if(!box)return;const q=(document.getElementById("productSearch")?.value||"").trim().toLowerCase();const list=products.filter(p=>p.available&&(filter==="Todos"||p.category===filter)&&(!q||`${p.name} ${p.description||""}`.toLowerCase().includes(q)));const count=document.getElementById("resultCount");if(count)count.textContent=`${list.length} producto${list.length===1?"":"s"}`;box.innerHTML=list.map(p=>{const qty=cart.find(i=>i.id===p.id)?.qty||0;return `<article class="product shop-product"><div class="product-info"><span class="tag">${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p><div class="price">${priceMarkup(p)} <small>${esc(p.unit||"")}</small></div></div><div class="product-media"><div class="product-img">${p.image?`<img src="${p.image}" alt="${esc(p.name)}">`:(p.category==="Alimentos"?"🥩":"🏠")}</div><button class="add-circle" onclick="add('${esc(p.id)}')" aria-label="Agregar ${esc(p.name)}">${qty>0?qty:"+"}</button></div></article>`}).join("")||'<p class="empty-products">No hay productos disponibles.</p>';updateStickyOrder()}
function add(id){const x=cart.find(i=>i.id===id);x?x.qty++:cart.push({id,qty:1});save();renderCart();render(currentFilter)}
function change(id,d){const x=cart.find(i=>i.id===id);if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(i=>i.id!==id);save();renderCart();render(currentFilter)}
function getOrderTotals(){
 const canPayCupTransfer=cart.length>0&&cart.every(i=>{const p=products.find(x=>x.id===i.id);return p&&p.category==="Electrodomésticos";});
 let usdTotal=0,cashTotal=0,transferTotal=0,usdAvailable=true,cupAvailable=canPayCupTransfer;
 cart.forEach(i=>{
  const p=products.find(x=>x.id===i.id); if(!p)return;
  const cur=p.currency||"USD", unitPrice=effectivePrice(p), qty=i.qty;
  if(cur==="USD") usdTotal+=unitPrice*qty; else usdAvailable=false;
  const cash=cashCup(p), transfer=transferCup(p);
  if(cash===null||transfer===null){cupAvailable=false;return}
  cashTotal+=cash*qty; transferTotal+=transfer*qty;
 });
 const deliveryFeeUSD=getDeliveryFeeUSD();
 const deliveryFeeCUP=deliveryFeeUSD*Number(storeSettings.usd_to_cup||0);
 const deliveryFeeTransfer=deliveryFeeCUP*(1+Number(storeSettings.transfer_markup_percent||0)/100);
 usdTotal+=deliveryFeeUSD;
 cashTotal+=deliveryFeeCUP;
 transferTotal+=deliveryFeeTransfer;
 return {usdTotal,cashTotal,transferTotal,deliveryFeeUSD,deliveryFeeCUP,deliveryFeeTransfer,usdAvailable,cupAvailable,canPayCupTransfer};
}
function updatePaymentSummary(){
 const box=document.getElementById("paymentSummary"); if(!box)return;
 const totals=getOrderTotals();
 const usdRadio=document.querySelector('input[name="paymentMethod"][value="USD"]');
 const zelleRadio=document.querySelector('input[name="paymentMethod"][value="ZELLE"]');
 const cupRadio=document.querySelector('input[name="paymentMethod"][value="CUP"]');
 const transferRadio=document.querySelector('input[name="paymentMethod"][value="TRANSFERENCIA"]');
 if(usdRadio)usdRadio.disabled=!totals.usdAvailable;
 if(zelleRadio)zelleRadio.disabled=!totals.usdAvailable;
 if(cupRadio)cupRadio.disabled=!totals.cupAvailable;
 if(transferRadio)transferRadio.disabled=!totals.cupAvailable;
 const cupLabel=cupRadio?.closest(".payment-option");
 const transferLabel=transferRadio?.closest(".payment-option");
 if(cupLabel)cupLabel.style.display=totals.canPayCupTransfer?"":"none";
 if(transferLabel)transferLabel.style.display=totals.canPayCupTransfer?"":"none";
 const selected=document.querySelector('input[name="paymentMethod"]:checked');
 if(selected&&selected.disabled){
  const fallback=document.querySelector('input[name="paymentMethod"]:not(:disabled)');
  if(fallback)fallback.checked=true;
 }
 const method=document.querySelector('input[name="paymentMethod"]:checked')?.value||"USD";
 const amount=(method==="USD"||method==="ZELLE")?money(totals.usdTotal,"USD"):method==="CUP"?money(totals.cashTotal,"CUP"):money(totals.transferTotal,"CUP");
 const label=method==="USD"?"USD":method==="ZELLE"?"Zelle":method==="CUP"?"CUP (efectivo)":"Transferencia";
 const fee=totals.deliveryFeeUSD;
 const feeSelected=(method==="USD"||method==="ZELLE")?money(totals.deliveryFeeUSD,"USD"):method==="CUP"?money(totals.deliveryFeeCUP,"CUP"):money(totals.deliveryFeeTransfer,"CUP");
 const feeText=fee>0?`Domicilio: ${feeSelected}`:"Domicilio: Gratis";
 const zoneName=getDeliveryZone();
 box.innerHTML=`<strong>Total a pagar: ${amount}</strong><span>${zoneName?`Zona: ${esc(zoneName)}`:"Selecciona una zona"}</span><span>${feeText}</span><span>Método seleccionado: ${label}</span>`;
}
function renderCart(){
 const box=document.getElementById("cartItems"),count=cart.reduce((s,i)=>s+i.qty,0);
 document.getElementById("cartCount").textContent=count;
 let usdTotal=0;
 box.innerHTML=cart.length?cart.map(i=>{
   const p=products.find(x=>x.id===i.id); if(!p)return"";
   const cur=p.currency||"USD",unitPrice=effectivePrice(p),lineTotal=unitPrice*i.qty;
   if(cur==="USD")usdTotal+=lineTotal;
   const img=p.image?`<img class="cart-thumb" src="${esc(p.image)}" alt="${esc(p.name)}">`:`<div class="cart-thumb placeholder">🛍️</div>`;
   return `<div class="cart-item">
     <div class="cart-thumb-wrap">${img}</div>
     <div class="cart-item-main">
       <div class="cart-item-top"><strong>${esc(p.name)}</strong><button class="cart-remove" onclick="removeFromCart('${esc(p.id)}')" aria-label="Eliminar ${esc(p.name)}">🗑️</button></div>
       <small>${money(unitPrice,cur)} c/u</small>
       <div class="cart-line-total">Total: ${money(lineTotal,cur)}</div>
       <div class="cart-item-bottom">
         <div class="qty"><button onclick="change('${esc(p.id)}',-1)" aria-label="Disminuir">−</button><b>${i.qty}</b><button onclick="change('${esc(p.id)}',1)" aria-label="Aumentar">+</button></div>
       </div>
     </div>
   </div>`;
 }).join(""):`<div class="cart-empty"><div>🛍️</div><strong>Tu pedido está vacío</strong><span>Agrega productos para comenzar.</span></div>`;
 const cartTotal=document.getElementById("cartTotal");
 if(cartTotal)cartTotal.innerHTML=cart.length?(usdTotal>0?money(usdTotal,"USD"):"USD 0.00"):"USD 0.00";
 const topTotal=document.getElementById("cartTopTotal");
 if(topTotal)topTotal.textContent=`USD ${usdTotal.toFixed(2)}`;
 updateStickyOrder();
 updatePaymentSummary();
}
function renderCartRecommendations(){
 const box=document.getElementById("cartRecommendations");
 if(!box)return;
 const cartIds=new Set(cart.map(i=>i.id));
 const list=products.filter(p=>p.available&&!cartIds.has(p.id)).slice(0,6);
 box.innerHTML=list.map(p=>{
   const img=p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:`<div class="recommendation-placeholder">${p.category==="Alimentos"?"🥫":"🏠"}</div>`;
   return `<article class="recommendation-card">
     <div class="recommendation-image">${img}<button class="recommendation-add" onclick="add('${esc(p.id)}')" aria-label="Agregar ${esc(p.name)}">+</button></div>
     <div class="recommendation-name">${esc(p.name)}</div>
     <strong class="recommendation-price">${money(effectivePrice(p),p.currency||"USD")}</strong>
   </article>`;
 }).join("")||`<div class="recommendation-empty">No hay productos adicionales para mostrar.</div>`;
}
function removeFromCart(id){cart=cart.filter(i=>i.id!==String(id));save();renderCart();render();}

function openCart(){document.getElementById("cart").classList.add("open");document.getElementById("cartOverlay").classList.remove("hidden")}function closeCart(){document.getElementById("cart").classList.remove("open");document.getElementById("cartOverlay").classList.add("hidden")}function openCheckout(){if(!cart.length){alert("Agrega al menos un producto.");return}updatePaymentSummary();document.getElementById("checkoutModal").classList.remove("hidden")}
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{const f=b.dataset.filter;currentFilter=f;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===f));b.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});render(f)}));
document.getElementById("shopSearchBtn")?.addEventListener("click",()=>{const w=document.getElementById("searchWrap");w.classList.toggle("hidden");if(!w.classList.contains("hidden"))document.getElementById("productSearch")?.focus()});
document.getElementById("shopMenuBtn")?.addEventListener("click",()=>document.getElementById("categoryTabs")?.scrollIntoView({behavior:"smooth",inline:"center"}));
document.getElementById("productSearch")?.addEventListener("input",()=>render(currentFilter));
document.getElementById("cartBtn").onclick=openCart;document.getElementById("closeCart").onclick=closeCart;document.getElementById("cartOverlay").onclick=closeCart;document.getElementById("checkoutBtn").onclick=openCheckout;document.getElementById("closeModal").onclick=()=>document.getElementById("checkoutModal").classList.add("hidden");
function showThankYou(){
 const modal=document.getElementById("thankYouModal");
 if(!modal)return;
 modal.classList.remove("hidden");
 modal.setAttribute("aria-hidden","false");
}
function finishPurchase(){
 cart=[];
 save();
 const form=document.getElementById("orderForm");
 if(form)form.reset();
 const select=document.getElementById("municipality");
 if(select){
   select.value="";
   select.dispatchEvent(new Event("change",{bubbles:true}));
 }
 const modal=document.getElementById("thankYouModal");
 if(modal){modal.classList.add("hidden");modal.setAttribute("aria-hidden","true");}
 document.getElementById("checkoutModal")?.classList.add("hidden");
 closeCart();
 currentFilter="Todos";
 document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter==="Todos"));
 render("Todos");
 renderCart();
 window.scrollTo({top:0,behavior:"smooth"});
}
let waitingForWhatsAppReturn=false;
function markWhatsAppPending(){
 waitingForWhatsAppReturn=true;
 sessionStorage.setItem("electroisla_whatsapp_pending","1");
}
function checkWhatsAppReturn(){
 if(!waitingForWhatsAppReturn && sessionStorage.getItem("electroisla_whatsapp_pending")!=="1")return;
 if(document.visibilityState==="hidden")return;
 waitingForWhatsAppReturn=false;
 sessionStorage.removeItem("electroisla_whatsapp_pending");
 showThankYou();
}
document.getElementById("orderForm").addEventListener("submit",e=>{e.preventDefault();const totals=getOrderTotals();const method=document.querySelector('input[name="paymentMethod"]:checked')?.value;if(!method){alert("Selecciona un método de pago.");return}if((method==="USD"||method==="ZELLE")&&!totals.usdAvailable){alert("El pago en USD/Zelle no está disponible para este pedido.");return}if((method==="CUP"||method==="TRANSFERENCIA")&&!totals.cupAvailable){alert("CUP y Transferencia solo están disponibles para pedidos de electrodomésticos.");return}const zone=document.getElementById("municipality").value,other=document.getElementById("otherZone").value.trim();if(!zone){alert("Selecciona la zona de entrega.");return}if(zone==="Otro"&&!other){alert("Escribe cuál es tu zona de entrega.");return}const lines=cart.map(i=>{const p=products.find(x=>x.id===i.id);if(!p)return"";const cur=p.currency||"USD",unitPrice=effectivePrice(p),lineTotal=unitPrice*i.qty,cash=cashCup(p),transfer=transferCup(p);let selectedLine="";if(method==="USD"||method==="ZELLE")selectedLine=money(lineTotal,"USD");else if(method==="CUP")selectedLine=money(cash*i.qty,"CUP");else selectedLine=money(transfer*i.qty,"CUP");return `• ${p.name} — ${i.qty} ${p.unit||"unidad"} — ${selectedLine}`}).join("\n");const name=document.getElementById("customerName").value.trim(),phone=document.getElementById("customerPhone").value.trim(),zoneName=zone==="Otro"?other:zone,note=document.getElementById("note").value.trim();const paymentLabel=method==="USD"?"USD":method==="ZELLE"?"ZELLE":method==="CUP"?"CUP (efectivo)":"TRANSFERENCIA";const subtotalSelected=(method==="USD"||method==="ZELLE")?money(totals.usdTotal-totals.deliveryFeeUSD,"USD"):method==="CUP"?money(totals.cashTotal-totals.deliveryFeeCUP,"CUP"):money(totals.transferTotal-totals.deliveryFeeTransfer,"CUP");const paymentTotal=(method==="USD"||method==="ZELLE")?money(totals.usdTotal,"USD"):method==="CUP"?money(totals.cashTotal,"CUP"):money(totals.transferTotal,"CUP");const deliverySelected=(method==="USD"||method==="ZELLE")?money(totals.deliveryFeeUSD,"USD"):method==="CUP"?money(totals.deliveryFeeCUP,"CUP"):money(totals.deliveryFeeTransfer,"CUP");const deliveryText=totals.deliveryFeeUSD>0?deliverySelected:"Gratis";const msg=`🛒 NUEVO PEDIDO\n\n👤 Cliente: ${name}\n📱 Teléfono: ${phone}\n\n🛍️ PRODUCTOS:\n${lines}\n\n📍 Zona de entrega: ${zoneName}\n\n💳 MÉTODO DE PAGO: ${paymentLabel}\n🧾 Subtotal: ${subtotalSelected}\n🚚 Domicilio: ${deliveryText}\n💰 TOTAL A PAGAR: ${paymentTotal}${note?`\n📝 Nota: ${note}`:""}`;markWhatsAppPending();window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,"_blank")});

document.getElementById("thankYouAccept")?.addEventListener("click",finishPurchase);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(checkWhatsAppReturn,250)});
window.addEventListener("focus",()=>setTimeout(checkWhatsAppReturn,250));
window.addEventListener("pageshow",()=>setTimeout(checkWhatsAppReturn,250));
document.querySelectorAll('input[name="paymentMethod"]').forEach(r=>r.addEventListener("change",updatePaymentSummary));
document.getElementById("municipality")?.addEventListener("change",updateDeliveryFields);
document.getElementById("otherZone")?.addEventListener("input",updatePaymentSummary);

setupDeliveryPicker();render();renderCart();startCloud();
supabaseClient.channel("settings-store").on("postgres_changes",{event:"*",schema:"public",table:"store_settings"},async()=>{try{await loadStoreSettings();render();renderCart()}catch(e){console.warn(e)}}).subscribe();
supabaseClient.channel("products-store").on("postgres_changes",{event:"*",schema:"public",table:"products"},async()=>{try{await loadCloudProducts();render();renderCart()}catch(e){console.warn(e)}}).subscribe();
