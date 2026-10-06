"use client";

import { useEffect, useRef, useState } from "react";
import { getIdToken, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

type InstallPromptEvent = Event & { prompt:()=>Promise<void>; userChoice:Promise<{outcome:"accepted"|"dismissed";platform:string}> };

export default function PwaRegister() {
  const [offline,setOffline]=useState(false),[reconnecting,setReconnecting]=useState(false),[installPrompt,setInstallPrompt]=useState<InstallPromptEvent|null>(null),[updateReady,setUpdateReady]=useState<ServiceWorker|null>(null);
  const reloadForUpdate=useRef(false);

  useEffect(()=>{
    setOffline(!navigator.onLine);
    const retryPendingOrderNotifications=async()=>{
      const user=auth.currentUser;if(!user)return;
      const idToken=await getIdToken(user).catch(()=>null);if(!idToken)return;
      const pendingKeys=Object.keys(localStorage).filter(key=>key.startsWith("boemo-pending-order-notification-"));
      for(const key of pendingKeys){
        const orderId=key.replace("boemo-pending-order-notification-","");
        try{
          const response=await fetch("/api/notifications/order-created",{method:"POST",headers:{Authorization:"Bearer "+idToken,"Content-Type":"application/json"},body:JSON.stringify({orderId})});
          if(response.ok)localStorage.removeItem(key);
        }catch{}
      }
    };
    const online=()=>{setOffline(false);setReconnecting(true);window.setTimeout(()=>{setReconnecting(false);void retryPendingOrderNotifications()},1200)};
    const off=()=>{setReconnecting(false);setOffline(true)};
    const install=(event:Event)=>{event.preventDefault();setInstallPrompt(event as InstallPromptEvent)};
    window.addEventListener("online",online);window.addEventListener("offline",off);window.addEventListener("beforeinstallprompt",install);

    let registration:ServiceWorkerRegistration|null=null;
    const inspect=()=>{if(registration?.waiting&&navigator.serviceWorker.controller)setUpdateReady(registration.waiting)};
    const register=async()=>{
      if(!("serviceWorker" in navigator))return;
      try{
        registration=await navigator.serviceWorker.register("/sw.js");
        inspect();
        registration.addEventListener("updatefound",()=>{const worker=registration?.installing;if(!worker)return;worker.addEventListener("statechange",inspect)});
        await registration.update();inspect();
      }catch{}
    };
    void register();
    void retryPendingOrderNotifications();
    const stopPendingAuth=onAuthStateChanged(auth,()=>{void retryPendingOrderNotifications()});
    const controllerChange=()=>{if(reloadForUpdate.current)window.location.reload()};
    navigator.serviceWorker?.addEventListener("controllerchange",controllerChange);
    return()=>{window.removeEventListener("online",online);window.removeEventListener("offline",off);window.removeEventListener("beforeinstallprompt",install);navigator.serviceWorker?.removeEventListener("controllerchange",controllerChange);stopPendingAuth()};
  },[]);

  async function install(){if(!installPrompt)return;await installPrompt.prompt();await installPrompt.userChoice;setInstallPrompt(null)}
  function applyUpdate(){if(!updateReady)return;reloadForUpdate.current=true;updateReady.postMessage({type:"SKIP_WAITING"})}

  return <>{offline&&<div className="offlineBanner" role="status" aria-live="polite"><span aria-hidden="true">⚡</span> Offline · BOEMO is available on this device. New orders may wait for reconnection.</div>}{!offline&&reconnecting&&<div className="offlineBanner reconnectingBanner" role="status" aria-live="polite"><span aria-hidden="true">↻</span> Reconnected · BOEMO is syncing and checking for the latest information.</div>}{installPrompt&&<button className="pwaInstall" type="button" onClick={()=>void install()}><span aria-hidden="true">✦</span> Install BOEMO</button>}{updateReady&&<div className="pwaUpdate" role="status" aria-live="polite"><div><strong>BOEMO update ready</strong><span>Refresh when you are ready.</span></div><button type="button" className="button buttonPrimary" onClick={applyUpdate}>Refresh</button></div>}</>;
}
