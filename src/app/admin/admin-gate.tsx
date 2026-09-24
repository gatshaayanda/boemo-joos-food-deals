"use client";
import {GoogleAuthProvider,onAuthStateChanged,signInWithEmailAndPassword,signInWithPopup,signOut,type User} from "firebase/auth";
import {doc,onSnapshot} from "firebase/firestore";
import {useEffect,useState} from "react";
import {auth,db} from "@/lib/firebase/client";

function hasAdminRole(data:Record<string,unknown>|undefined){
 return ["owner","staff"].includes(String(data?.role??"").toLowerCase());
}

function friendlyAuthError(err:unknown){
 const code=typeof err==="object"&&err!==null&&"code" in err?String((err as {code?:unknown}).code):"";
 if(["auth/invalid-credential","auth/wrong-password","auth/user-not-found","auth/invalid-login-credentials"].includes(code)){
  return "Sign-in failed. Check your email and password and try again.";
 }
 if(code==="auth/too-many-requests") return "Too many sign-in attempts. Wait a moment and try again.";
 if(code==="auth/network-request-failed") return "We could not reach Firebase. Check your internet connection and try again.";
 return err instanceof Error?err.message:"We could not sign you in. Check your details.";
}

export default function AdminGate({children}:{children:React.ReactNode}){
 const[user,setUser]=useState<User|null>(null),[checking,setChecking]=useState(true),[authorized,setAuthorized]=useState(false),[offline,setOffline]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);

 useEffect(()=>{
  let stopAdmin:undefined|(()=>void);
  const stopAuth=onAuthStateChanged(auth,next=>{
   if(stopAdmin){stopAdmin();stopAdmin=undefined}
   setUser(next);
   setChecking(true);
   setOffline(false);
   if(!next){setAuthorized(false);setChecking(false);return}
   stopAdmin=onSnapshot(doc(db,"admins",next.uid),snapshot=>{
    const allowed=snapshot.exists()&&hasAdminRole(snapshot.data());
    setAuthorized(allowed);
    setOffline(false);
    setChecking(false);
    if(!allowed)void signOut(auth);
   },()=>{
    setOffline(true);
    setChecking(false);
   });
  });
  return ()=>{if(stopAdmin)stopAdmin();stopAuth()};
 },[]);

 async function finishSignIn(action:()=>Promise<User>){
  setBusy(true);setError("");
  try{
   const next=await action();
   const adminSnapshot=await new Promise<{exists:boolean;data:()=>Record<string,unknown>}|null>(resolve=>{
    const stop=onSnapshot(doc(db,"admins",next.uid),snapshot=>{stop();resolve({exists:snapshot.exists(),data:()=>snapshot.data()??{}})},()=>{stop();resolve(null)});
   });
   if(!adminSnapshot||!adminSnapshot.exists||!hasAdminRole(adminSnapshot.data())){
    setError("This account is not enabled for BOEMO Kitchen. Add this user's UID to the admins collection with role owner or staff.");
    await signOut(auth);
   }else{
    setAuthorized(true);
    setOffline(false);
   }
  }catch(err){setError(friendlyAuthError(err))}
  finally{setBusy(false)}
 }

 async function signIn(e:React.FormEvent){e.preventDefault();await finishSignIn(async()=> (await signInWithEmailAndPassword(auth,email.trim(),password)).user)}
 async function google(){await finishSignIn(async()=> (await signInWithPopup(auth,new GoogleAuthProvider())).user)}

 if(checking)return <main className="adminPage"><div className="adminShell"><div className="emptyState"><div>🔐</div><h1>Opening BOEMO Kitchen</h1><p>Checking access…</p></div></div></main>;
 if(user&&authorized)return <div className="adminAuthorized">{offline&&<div className="adminAccountBar"><span>BOEMO Kitchen · Offline mode · cached admin access</span><span>Changes will sync when connection returns.</span></div>}<div className="adminAccountBar"><span>BOEMO Kitchen · {user.email??"authorized staff"}</span><button className="button buttonLight" type="button" onClick={()=>void signOut(auth)}>Sign out</button></div>{children}</div>;
 return <main className="adminPage"><div className="adminShell"><section className="adminPanel" style={{maxWidth:520,margin:"80px auto"}}><span className="kicker">BOEMO · Kitchen</span><h1>Kitchen sign in</h1><p>Use an authorized owner or staff account to manage food orders.</p><button className="button buttonPrimary" type="button" onClick={()=>void google()} disabled={busy}>{busy?"Signing in…":"Continue with Google"}</button><div className="adminDivider">or</div><form className="adminForm" onSubmit={signIn}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label><button className="button buttonLight" type="submit" disabled={busy}>{busy?"Signing in…":"Sign in with email"}</button></form>{error&&<p role="alert" className="notice">{error}{user&&<><br/><small>Firebase UID: {user.uid}</small></>}</p>}</section></div></main>
}
