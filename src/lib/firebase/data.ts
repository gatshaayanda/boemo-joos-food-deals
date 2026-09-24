"use client";
import {collection,doc,getDocs,setDoc,updateDoc} from "firebase/firestore";
import {db} from "@/lib/firebase/client";
export const ORDER_STATUSES=["New","Accepted","Preparing","Ready","Delivering","Collected","Delivered","Cancelled"] as const;
export type OrderStatus=typeof ORDER_STATUSES[number];
export type OrderItem={name:string;price:number;quantity:number};
export type FoodOrder={id:string;createdAt:string;customerName:string;phone:string;mode:"pickup"|"delivery";scheduledFor:string;deliveryLocation:string;instructions:string;items:OrderItem[];total:number;status:OrderStatus};
const ordersCollection=collection(db,"orders");
export function createFoodOrder(data:Omit<FoodOrder,"id">){const reference=doc(ordersCollection);return{id:reference.id,writePromise:setDoc(reference,data)}}
export async function getFoodOrders():Promise<FoodOrder[]>{const snapshot=await getDocs(ordersCollection);return snapshot.docs.map(item=>({id:item.id,...item.data() as Omit<FoodOrder,"id">})).sort((a,b)=>b.scheduledFor.localeCompare(a.scheduledFor))}
export async function updateFoodOrderStatus(id:string,status:OrderStatus){await updateDoc(doc(db,"orders",id),{status})}