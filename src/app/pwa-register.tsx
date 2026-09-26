"use client";

import { useEffect, useRef, useState } from "react";

type InstallPromptEvent = Event & { prompt:()=>Promise<void>; userChoice:Promise<{outcome:"accepted"|"dismissed";platform:string}> };

export default function PwaRegister() {
  const [offline,setOffline]=useState(false),[reconnecting,setReconnecting]=useState(false),[installPrompt,setInstallPrompt]=useState<InstallPromptEvent|null>(null),[updateReady,setUpdateReady]=useState<ServiceWorker|null>(null);
  const reloadForUpdate=useRef(false);

  useEffect(()=>{
    setOffline(!navigator.onLine);
    const online=()=>{setOffline(false);setReconnecting(true);window.setTimeout(()=>setReconnecting(false),2200)};
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
    const controllerChange=()=>{if(reloadForUpdate.current)window.location.reload()};
    navigator.serviceWorker?.addEventListener("controllerchange",controllerChange);
    return()=>{window.removeEventListener("online",online);window.removeEventListener("offline",off);window.removeEventListener("beforeinstallprompt",install);navigator.serviceWorker?.removeEventListener("controllerchange",controllerChange)};
  },[]);

  async function install(){if(!installPrompt)return;await installPrompt.prompt();await installPrompt.userChoice;setInstallPrompt(null)}
  function applyUpdate(){if(!updateReady)return;reloadForUpdate.current=true;updateReady.postMessage({type:"SKIP_WAITING"})}

  return <>{offline&&<div className="offlineBanner" role="status" aria-live="polite"><span aria-hidden="true">⚡</span> Offline · BOEMO is available on this device. New orders may wait for reconnection.</div>}{!offline&&reconnecting&&<div className="offlineBanner reconnectingBanner" role="status" aria-live="polite"><span aria-hidden="true">↻</span> Reconnected · BOEMO is syncing and checking for the latest information.</div>}{installPrompt&&<button className="pwaInstall" type="button" onClick={()=>void install()}><span aria-hidden="true">✦</span> Install BOEMO</button>}{updateReady&&<div className="pwaUpdate" role="status" aria-live="polite"><div><strong>BOEMO update ready</strong><span>Refresh when you're ready.</span></div><button type="button" className="button buttonPrimary" onClick={applyUpdate}>Refresh</button></div>}</>;
}
