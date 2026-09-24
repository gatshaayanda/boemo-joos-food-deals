import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
 return {name:"BOEMO Joos Food Deals",short_name:"BOEMO",description:"Good Food. Great Taste. Every Day!",start_url:"/",display:"standalone",background_color:"#fff8ef",theme_color:"#f0442f",orientation:"portrait-primary",lang:"en",categories:["food","shopping","business"],icons:[{src:"/icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"},{src:"/icon.svg",sizes:"any",type:"image/svg+xml",purpose:"maskable"}]};
}