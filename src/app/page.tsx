"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {menuByDay,lateNightDeals} from "@/lib/boemo/menu";
import {getBusinessSettings,getMenuItems,type MenuItem,type BusinessSettings} from "@/lib/firebase/data";
const heroImage="/boemo-assets/WhatsApp Image 2026-09-23 at 14.12.46.jpeg";
const serviceImage="/boemo-assets/WhatsApp Image 2026-09-23 at 14.16.14.jpeg";

export default function Home(){
 const today=new Intl.DateTimeFormat("en-US",{weekday:"long"}).format(new Date());
 const fallbackToday=menuByDay[today]??menuByDay.Monday;
 const[firebaseMenu,setFirebaseMenu]=useState<MenuItem[]>([]),[settings,setSettings]=useState<BusinessSettings|null>(null);
 useEffect(()=>{void Promise.all([getMenuItems(),getBusinessSettings()]).then(([items,currentSettings])=>{setFirebaseMenu(items);setSettings(currentSettings)}).catch(()=>undefined)},[]);
 const dynamicToday=firebaseMenu.filter(item=>item.available&&item.section==="daily"&&(item.days??[]).includes(today));
 const todayMenu=dynamicToday.length?dynamicToday:[];
 const publicDeals=firebaseMenu.filter(item=>item.available&&(item.section==="deal"||(!item.section&&item.category.toLowerCase()==="deal")));
 const fallbackDeals=lateNightDeals.map((deal,index)=>({id:String(index),name:deal.name,price:deal.price,...("friend" in deal?{friendPrice:deal.friend}:{}),category:"Deal",description:"",available:true,preparationMinutes:0,sortOrder:index,section:"deal" as const}));
 const deals=publicDeals.length?publicDeals:fallbackDeals;

 return <main className="boemoSite">
  <div className="topbar"><div className="container topbarInner"><span>BOEMO JOOS DEALER</span><strong>Good Food. Great Taste. Every Day!</strong><span>76425849 · 76769834</span></div></div>
  <nav className="nav"><div className="container navInner"><Link href="/" className="logo"><span className="logoMark">B</span><span className="logoWord">BOEMO</span></Link><div className="navLinks"><a href="#today">Today</a><a href="#deals">Deals</a><a href="#where">Where we are</a></div><Link href="/order" className="button buttonPrimary">Order ahead</Link></div></nav>
  <section className="hero"><div className="container heroGrid"><div className="heroCopy"><span className="eyebrow">BOEMO JOOS DEALER</span><h1>Good food.<br/><em>Big flavour.</em></h1><p>Fresh local comfort food, street-food favourites and student-friendly deals. See what&apos;s cooking and order ahead before you leave class.</p><div className="actions"><Link href="/order" className="button buttonPrimary">Order food</Link><a href="#today" className="button buttonLight">See today&apos;s food</a></div><div className="heroPill"><span>📍</span><div><strong>Mobile kitchen</strong><small>Serving around BAC and nearby student areas</small></div></div></div><div className="heroVisual"><Image src={heroImage} alt="BOEMO food being prepared and served" fill priority sizes="(max-width: 800px) 100vw, 48vw"/></div></div></section>

  <section id="today" className="section"><div className="container"><div className="sectionHead"><div><span className="kicker">Today&apos;s food · {today}</span><h2>What&apos;s cooking?</h2></div><Link href="/order" className="textLink">Order ahead →</Link></div>
   {todayMenu.length?<div className={"menuStrip day-"+today.toLowerCase()}>{todayMenu.map(item=><article className="menuCard" key={item.id}>{item.imageUrl?<Image src={item.imageUrl} alt="" width={500} height={300} className="menuCardImage"/>:<span>🍽️</span>}<div><strong>{item.name}</strong><small>{item.description}</small><b>P{item.price.toFixed(item.price%1?2:0)}</b></div></article>)}</div>:<div className={"menuStrip day-"+today.toLowerCase()}>{fallbackToday.map(item=><article className="menuCard" key={item}><span>🍽️</span><strong>{item}</strong></article>)}</div>}
   <p className="truthNote">{todayMenu.length?"Today&apos;s Food is published and priced from the BOEMO kitchen admin.":"BOEMO&apos;s supplied weekly menu is shown until Today&apos;s Food is published from the kitchen admin."} Availability can change during service.</p>
  </div></section>

  <section id="deals" className="section dealsSection"><div className="container"><div className="sectionHead"><div><span className="kicker">Deals · prices</span><h2>Bring a friend. Save.</h2></div><Link href="/order" className="textLink">Start an order →</Link></div><div className="dealGrid">{deals.map(deal=><article className="dealCard" key={deal.id}>{deal.imageUrl&&<Image src={deal.imageUrl} alt="" width={180} height={120} className="dealImage" />}<div><strong>{deal.name}</strong>{deal.description&&<small>{deal.description}</small>}{deal.friendPrice!==undefined&&<small>Bring a Friend: P{deal.friendPrice.toFixed(deal.friendPrice%1?2:0)}</small>}</div><b>P{deal.price.toFixed(deal.price%1?2:0)}</b></article>)}</div><p className="truthNote">Prices and availability are controlled from the BOEMO kitchen admin.</p></div></section>

  <section className="section storySection"><div className="container storyGrid"><div className="storyImage"><Image src={serviceImage} alt="BOEMO takeaway meal with burger and chips" width={1000} height={1000} sizes="(max-width: 800px) 100vw, 45vw"/></div><div><span className="kicker">Between classes?</span><h2>Can&apos;t leave class?</h2><p>Choose your food, tell us when you want it and choose pickup or delivery. We&apos;ll have your order details ready for the kitchen.</p><Link href="/order" className="button buttonPrimary">Plan my order</Link></div></div></section>

  <section id="where" className="section locationSection"><div className="container locationGrid"><div><span className="kicker">Mobile kitchen</span><h2>Find BOEMO today.</h2><p>BOEMO is a mobile kitchen, so the operating location can change.</p><div className="contactRow"><a className="button buttonDark" href="tel:76425849">Call 76425849</a><a className="button buttonLight" href="tel:76769834">Call 76769834</a></div></div><div className="locationCard"><span>📍</span><strong>Today&apos;s location</strong><p>{settings?.location||"Location not published yet."}</p>{settings?.hours&&<small>Serving hours: {settings.hours}</small>}{settings?.locationNote&&<small>{settings.locationNote}</small>}{!settings?.location&&<small>No fixed restaurant address is assumed.</small>}</div></div></section>
  <footer className="footer"><div className="container footerInner"><div><strong>BOEMO Joos Dealer</strong><span>We Cook. You Enjoy!</span></div><Link href="/order" className="button buttonPrimary">Order ahead</Link></div></footer>
 </main>;
}
