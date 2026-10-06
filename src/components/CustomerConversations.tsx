"use client";
import {useEffect,useState} from "react";
import {auth} from "@/lib/firebase/client";
import {createCustomerConversation,subscribeToCustomerConversations,type Conversation} from "@/lib/firebase/data";
import ConversationPanel from "@/components/ConversationPanel";

const REQUESTS=[["Question","Ask BOEMO a question"],["Food request","Ask about food or availability"],["Catering","Plan food for a group or event"],["Advance order","Ask about a future order"]];

export default function CustomerConversations(){
 const[user,setUser]=useState(auth.currentUser),[conversations,setConversations]=useState<Conversation[]>([]),[selected,setSelected]=useState<string>(),[notice,setNotice]=useState("");
 useEffect(()=>auth.onAuthStateChanged(next=>setUser(next)),[]);
 useEffect(()=>{if(!user){setConversations([]);setNotice("");return}return subscribeToCustomerConversations(user.uid,setConversations,error=>{const code=(error as {code?:unknown}).code;setNotice(code==="permission-denied"?"Customer messages are temporarily unavailable. Your BOEMO account and orders are still safe.":"We could not load your BOEMO messages right now.")})},[user]);
 async function start(title:string){if(!user)return;try{const id=await createCustomerConversation(user.uid,title);setSelected(id)}catch(error){const code=(error as {code?:unknown}).code;setNotice(code==="permission-denied"?"Customer messages are temporarily unavailable. Your BOEMO account and orders are still safe.":"BOEMO could not start the request. Please try again.")}}
 if(!user)return null;
 if(selected)return <ConversationPanel conversationId={selected} onBack={()=>setSelected(undefined)}/>;
 return <section className="conversationHub">
  <div className="panelHeading"><div><span className="kicker">Talk to BOEMO</span><h2>Need something?</h2><p className="orderTruth">You don't need to know which form to use. Start a message and explain it in your own words.</p></div><span className="orderTruth">{conversations.filter(x=>x.unreadForCustomer).length?conversations.filter(x=>x.unreadForCustomer).length+" new":"Private"}</span></div>
  <div className="requestChoices">{REQUESTS.map(([title,copy])=><button key={title} className="requestChoice" onClick={()=>void start(title)}><strong>{title}</strong><span>{copy}</span><b>→</b></button>)}</div>
  <div className="conversationList">{conversations.map(item=><button className="conversationRow" key={item.id} onClick={()=>setSelected(item.id)}><span className="conversationDot" data-unread={item.unreadForCustomer?"true":"false"}/><span><strong>{item.title}</strong><small>{item.lastMessagePreview||"No messages yet."}</small></span><time>{new Date(item.updatedAt).toLocaleDateString()}</time></button>)}{!conversations.length&&<div className="conversationEmpty"><strong>Your BOEMO conversations will appear here.</strong><p>Ask about food, send event details, or make an advance request. You can attach an image or PDF when useful.</p></div>}</div>
  {notice&&<p className="notice" role="status">{notice}</p>}
 </section>
}