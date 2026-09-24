"use client";
import {collection,doc,getDoc,getDocs,setDoc,updateDoc} from "firebase/firestore";
import {db} from "@/lib/firebase/client";
export const ORDER_STATUSES=["New","Accepted","Preparing","Ready","Delivering","Collected","Delivered","Cancelled"] as const;
export type OrderStatus=typeof ORDER_STATUSES[number];
export type OrderItem={name:string;price:number;quantity:number};
export type CustomerProfile={uid:string;name:string;email:string;phone:string;preferredDeliveryLocation:string;notes:string;createdAt:string;updatedAt:string};
export type FoodOrder={id:string;customerId?:string;createdAt:string;customerName:string;phone:string;mode:"pickup"|"delivery";scheduledFor:string;deliveryLocation:string;instructions:string;items:OrderItem[];total:number;status:OrderStatus};
const ordersCollection=collection(db,"orders");
const customersCollection=collection(db,"customers");
export function createFoodOrder(data:Omit<FoodOrder,"id">){const reference=doc(ordersCollection);return{id:reference.id,writePromise:setDoc(reference,data)}}
export async function getFoodOrders():Promise<FoodOrder[]>{const snapshot=await getDocs(ordersCollection);return snapshot.docs.map(item=>({id:item.id,...item.data() as Omit<FoodOrder,"id">})).sort((a,b)=>b.scheduledFor.localeCompare(a.scheduledFor))}
export async function updateFoodOrderStatus(id:string,status:OrderStatus){await updateDoc(doc(db,"orders",id),{status})}
export async function getCustomerProfile(uid:string):Promise<CustomerProfile|null>{const snapshot=await getDoc(doc(customersCollection,uid));return snapshot.exists()?{uid:snapshot.id,...snapshot.data() as Omit<CustomerProfile,"uid">}:null}
export async function saveCustomerProfile(profile:CustomerProfile){await setDoc(doc(customersCollection,profile.uid),profile,{merge:true})}
