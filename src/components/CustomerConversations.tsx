"use client";
import {useEffect,useState} from "react";
import {auth} from "@/lib/firebase/client";
import {createCustomerConversation,subscribeToCustomerConversations,type Conversation} from "@/lib/firebase/data";
import ConversationPanel from "@/components/ConversationPanel";

const REQUESTS=[
 ["Question","Ask BOEMO anything about the service"],
 ["Food & availability","Ask what is available or request something"],
 ["Reserve / booking","Ask about availability or make a booking request"],
 ["Catering / events","Plan food for a group, meeting or event"],
 ["Advance order","Discuss a future meal or special request"],
 ["Payment / receipt","Ask about payment, receipts or an order charge"],
 ["Subscription","Ask about BOEMO's food subscription"],
 ["Something else","Tell BOEMO what you need in your own words"]
];

export default function CustomerConversations(){
 const[user,setUser]=useState(auth.currentUser),[conversations,setConversations]=useState<Conversation[]>([]),[selected,setSelected]=useState<string>(),[notice,setNotice]=useState("");
 useEffect(()=>auth.onAuthStateChanged(next=>setUser(next)),[]);
 useEffect(()=>{if(!user){setConversations([]);setNotice("");return}return subscribeToCustomerConversations(user.uid,setConversations,error=>{const code=(error as {code?:unknown}).code;setNotice(code==="permission-denied"?"Customer messages are temporarily unavailable. Your BOEMO account and orders are still safe.":"We could not load your BOEMO messages right now.")})},[user]);
 async function start(title:string){if(!user)return;setNotice("");try{const id=await createCustomerConversation(user.uid,title);setSelected(id)}catch(error){const code=(error as {code?:unknown}).code;setNotice(code==="permission-denied"?"Customer messages are temporarily unavailable. Your BOEMO account and orders are still safe.":"BOEMO could not start the request. Please try again.")}}
 if(!user)return null;
 if(selected)return <ConversationPanel conversationId={selected} onBack={()=>setSelected(undefined)}/>;
 return <section className="conversationHub">
  <div className="panelHeading"><div><span className="kicker">Talk to BOEMO</span><h2>Need something?</h2><p className="orderTruth">Ask, request, reserve, discuss payment or subscription details, or send supporting images and PDFs. A BOEMO team member can reply here.</p></div><span className="conversationPrivate">{conversations.filter(x=>x.unreadForCustomer).length?conversations.filter(x=>x.unreadForCustomer).length+" new":"Private"}</span></div>
  <div className="requestChoices">{REQUESTS.map(([title,copy])=><button key={title} className="requestChoice" onClick={()=>void start(title)}><strong>{title}</strong><span>{copy}</span><b>→</b></button>)}</div>
  <div className="conversationList">{conversations.map(item=><button className="conversationRow" key={item.id} onClick={()=>setSelected(item.id)}><span className="conversationDot" data-unread={item.unreadForCustomer?"true":"false"}/><span><strong>{item.title}</strong><small>{item.lastMessagePreview||"No messages yet."}</small></span><time>{new Date(item.updatedAt).toLocaleDateString()}</time></button>)}{!conversations.length&&<div className="conversationEmpty"><strong>Your BOEMO conversations will appear here.</strong><p>Use a request above, then explain what you need. Add a food photo, screenshot, receipt or PDF when it helps us understand the request.</p></div>}</div>
  {notice&&<p className="notice" role="status">{notice}</p>}
 </section>
}