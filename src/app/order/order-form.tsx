"use client";
import Link from "next/link";
import {FormEvent,useEffect,useMemo,useState} from "react";
import {signInAnonymously,onAuthStateChanged,type User} from "firebase/auth";
import {createFoodOrder,getCustomerProfile,saveCustomerProfile,type OrderItem} from "@/lib/firebase/data";
import {auth} from "@/lib/firebase/client";
import {lateNightDeals} from "@/lib/boemo/menu";
import {getMenuItems} from "@/lib/firebase/data";
const baseItems:OrderItem[]=lateNightDeals.map(deal=>({name:deal.name,price:deal.price,quantity:0}));
export default function OrderForm(){
 const[items,setItems]=useState(baseItems),[submitted,setSubmitted]=useState(false),[reference,setReference]=useState(""),[pendingSync,setPendingSync]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[user,setUser]=useState<User|null>(null),[saved,setSaved]=useState({name:"",phone:"",location:"",notes:""});
 useEffect(()=>{const unsub=onAuthStateChanged(auth,async next=>{setUser(next);if(next){try{const profile=await getCustomerProfile(next.uid);if(profile)setSaved({name:profile.name,phone:profile.phone,location:profile.preferredDeliveryLocation,notes:profile.notes})}catch(error){console.warn("BOEMO customer profile unavailable",error)}}});void getMenuItems().then(menu=>{const today=new Intl.DateTimeFormat("en-US",{weekday:"long"}).format(new Date());const daily=menu.filter(item=>item.available&&item.section==="daily"&&(item.days??[]).includes(today));const deals=menu.filter(item=>item.available&&(item.section==="deal"||(!item.section&&item.category.toLowerCase()==="deal")));const visible=[...daily,...deals];if(visible.length)setItems(visible.map(item=>({name:item.name,price:item.price,quantity:0})))}).catch(()=>undefined);return unsub},[]);
 function change(name:string,delta:number){setItems(current=>current.map(item=>item.name===name?{...item,quantity:Math.max(0,item.quantity+delta)}:item))}
 const selected=useMemo(()=>items.filter(item=>item.quantity>0),[items]);const total=selected.reduce((sum,item)=>sum+item.price*item.quantity,0);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;if(!selected.length){setError("Choose at least one food item.");return}setBusy(true);setError("");
  const form=new FormData(event.currentTarget),name=String(form.get("customerName")??"").trim(),phone=String(form.get("phone")??"").trim(),mode=String(form.get("mode")??"pickup") as "pickup"|"delivery",scheduledFor=String(form.get("scheduledFor")??""),deliveryLocation=String(form.get("deliveryLocation")??"").trim(),instructions=String(form.get("instructions")??"").trim();
  if(!name||!phone||!scheduledFor){setError("Please add your name, phone and preferred time.");setBusy(false);return}
  if(mode==="delivery"&&!deliveryLocation){setError("Add your delivery location or landmark.");setBusy(false);return}
  try{
   let customer=user;
   if(!customer){try{customer=(await signInAnonymously(auth)).user}catch(authError){console.warn("BOEMO anonymous auth unavailable",authError);customer=null}}
   const order={...(customer?{customerId:customer.uid}:{}),createdAt:new Date().toISOString(),customerName:name,phone,mode,scheduledFor,deliveryLocation,instructions,items:selected.map(({name,price,quantity})=>({name,price,quantity})),total,status:"New" as const};
   const offline=!navigator.onLine;const{id,writePromise}=createFoodOrder(order);setReference(id);
   // Customer profile persistence is a convenience, never a reason to reject an order.
   // Firestore may deny/read-fail an empty profile while the order write itself is valid.
   if(offline){void writePromise.catch(console.error);setPendingSync(true)}else{await writePromise;setPendingSync(false)}
   if(customer){
    const now=new Date().toISOString();
    void getCustomerProfile(customer.uid)
      .catch(profileError=>{console.warn("BOEMO customer profile read unavailable",profileError);return null})
      .then(existing=>{
       const profile={uid:customer.uid,name,email:customer.email??existing?.email??"",phone,preferredDeliveryLocation:deliveryLocation||existing?.preferredDeliveryLocation||"",notes:instructions||existing?.notes||"",createdAt:existing?.createdAt??now,updatedAt:now};
       return saveCustomerProfile(profile);
      })
      .catch(profileError=>console.warn("BOEMO customer profile save unavailable",profileError));
   }
   setSubmitted(true);event.currentTarget.reset();
  }catch(error){console.error("BOEMO order submission failed",error);setError("The order could not be confirmed online. Please check the connection and try again, or call BOEMO on 76425849 / 76769834.")}finally{setBusy(false)}
 }
 if(submitted)return <main className="orderPage"><div className="orderWrap"><div className="orderCard confirm"><div className="confirmIcon">🍔</div><span className="kicker">{pendingSync?"Offline save":"Order submitted"}</span><h1>{pendingSync?"Saved on this phone.":"Order received."}</h1><p>{pendingSync?"Your order is waiting to synchronize. Reconnect this device so it can reach BOEMO. Until then, the kitchen has not received it.":"Your order was written to the BOEMO order queue. The kitchen can review it and contact you if needed."}</p><strong>Reference #{reference.slice(0,8).toUpperCase()}</strong><div className="actions centered"><Link className="button buttonPrimary" href={"/orders/"+reference.toLowerCase()}>Track this order</Link><Link className="button buttonLight" href="/account">My BOEMO</Link><Link className="button buttonLight" href="/">Back to BOEMO</Link></div></div></div></main>;
 return <main className="orderPage"><div className="orderWrap"><div className="orderHeader"><Link href="/" className="logo"><span className="logoMark">B</span><span>BOEMO</span></Link><Link href="/account" className="button buttonLight">My BOEMO</Link></div><div className="sectionHead"><div><span className="kicker">Order ahead</span><h1>Choose your food.</h1><p>Order as a guest. Your name and contact details can be saved with BOEMO automatically for faster future orders.</p></div></div><form onSubmit={submit} className="orderGrid"><div className="orderCard"><h2>Menu & deals</h2><div className="orderItems">{items.map(item=><article className="orderItem" key={item.name}><div><strong>{item.name}</strong><small>P{item.price.toFixed(item.price%1?1:0)}</small></div><div className="qty"><button type="button" onClick={()=>change(item.name,-1)} aria-label={"Remove "+item.name}>−</button><strong>{item.quantity}</strong><button type="button" onClick={()=>change(item.name,1)} aria-label={"Add "+item.name}>+</button></div></article>)}</div><p className="orderTruth">Weekly food is shown on the BOEMO home screen. Deal prices here are the supplied current deal list.</p></div><div className="orderCard"><h2>Your details</h2><p className="orderTruth">No account is required. BOEMO can save these details to your customer profile when a guest session is available.</p><div className="fieldGrid"><label>Name<input name="customerName" autoComplete="name" defaultValue={saved.name} required/></label><label>Phone / WhatsApp<input name="phone" type="tel" autoComplete="tel" defaultValue={saved.phone} required/></label><label>When do you need it?<input name="scheduledFor" type="datetime-local" min={new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)} required/></label><label>Order type<select name="mode" defaultValue="pickup"><option value="pickup">Pickup</option><option value="delivery">Delivery</option></select></label><label className="fieldFull">Delivery location / landmark <span>(required for delivery)</span><input name="deliveryLocation" defaultValue={saved.location} placeholder="BAC Library, main entrance..."/></label><label className="fieldFull">Instructions <span>(optional)</span><textarea name="instructions" defaultValue={saved.notes} placeholder="Call when outside, no onions, etc."/></label></div><div className="total"><span>Total</span><strong>P{total.toFixed(2)}</strong></div>{error&&<p role="alert" className="notice">{error}</p>}<button className="button buttonPrimary" type="submit" disabled={busy||!selected.length}>{busy?"Saving order…":"Place order"}</button></div></form></div></main>;
}