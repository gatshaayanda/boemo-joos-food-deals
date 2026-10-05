import {NextResponse} from "next/server";
import {cert,getApp,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";

export const runtime="nodejs";

function getAdminApp(){
  if(getApps().length)return getApp();
  const raw=process.env.FIREBASE_ADMIN_KEY;
  if(!raw)throw new Error("Firebase Admin is not configured.");
  let serviceAccount:Record<string,unknown>;
  try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}
  catch{throw new Error("FIREBASE_ADMIN_KEY is not valid JSON.")}
  return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])});
}

async function requireUid(request:Request){
  const header=request.headers.get("authorization")||"";
  const match=header.match(/^Bearer\s+(.+)$/i);
  if(!match)throw new Error("Missing Firebase authentication token.");
  const decoded=await getAuth(getAdminApp()).verifyIdToken(match[1]);
  return decoded.uid;
}

export async function POST(request:Request){
  try{
    const uid=await requireUid(request);
    const {sendTestNotification}=require("@/lib/server/pickup-reminder-runner.js") as {
      sendTestNotification:(uid:string)=>Promise<{successCount:number;failureCount:number}>
    };
    const result=await sendTestNotification(uid);
    return NextResponse.json({sent:true,...result});
  }catch(error){
    console.error("BOEMO test notification failed:",error);
    return NextResponse.json(
      {sent:false,error:error instanceof Error?error.message:"BOEMO could not send a test notification."},
      {status:400}
    );
  }
}
