import type {Metadata,Viewport} from "next";
import {Analytics} from "@vercel/analytics/next";
import {SpeedInsights} from "@vercel/speed-insights/next";
import PwaRegister from "@/app/pwa-register";
import "./globals.css"; import "./pwa.css";
const siteUrl=process.env.NEXT_PUBLIC_BASE_URL||"https://boemo-joos-food-deals.vercel.app";
export const metadata:Metadata={metadataBase:new URL(siteUrl),title:{default:"BOEMO Joos Food Deals",template:"%s | BOEMO"},description:"BOEMO Joos Dealer — Good Food. Great Taste. Every Day!",applicationName:"BOEMO Joos Food Deals",keywords:["BOEMO","Joos Dealer","food deals","BAC","Gaborone","Botswana"],alternates:{canonical:"/"},openGraph:{type:"website",url:siteUrl,siteName:"BOEMO Joos Food Deals",title:"BOEMO Joos Food Deals",description:"Good Food. Great Taste. Every Day!"},twitter:{card:"summary",title:"BOEMO Joos Food Deals",description:"Good Food. Great Taste. Every Day!"},icons:{icon:"/icon.svg",apple:"/icon.svg"},manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"BOEMO",statusBarStyle:"default"}};
export const viewport:Viewport={themeColor:"#f0442f",colorScheme:"light"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><PwaRegister/>{children}<Analytics/><SpeedInsights/></body></html>}