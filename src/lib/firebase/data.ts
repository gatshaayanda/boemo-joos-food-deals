"use client";
import {collection,doc,getDoc,getDocs,onSnapshot,query,setDoc,updateDoc,deleteDoc,where} from "firebase/firestore";
import type {Unsubscribe} from "firebase/firestore";
import {db} from "@/lib/firebase/client";

export const ORDER_STATUSES=["New","Accepted","Preparing","Ready","Delivering","Collected","Delivered","Cancelled"] as const;
export type OrderStatus=typeof ORDER_STATUSES[number];
export type PaymentMethod="unpaid"|"cash"|"etransfer"|"other";
export type PaymentStatus="unpaid"|"paid"|"partial";
export type OrderItem={name:string;price:number;quantity:number};
export type CustomerProfile={uid:string;name:string;email:string;phone:string;preferredDeliveryLocation:string;notes:string;createdAt:string;updatedAt:string};
export type FoodOrder={id:string;customerId?:string;createdAt:string;customerName:string;phone:string;mode:"pickup"|"delivery";scheduledFor:string;deliveryLocation:string;instructions:string;items:OrderItem[];total:number;status:OrderStatus;paymentStatus?:PaymentStatus;paymentMethod?:PaymentMethod;amountPaid?:number};
export type MenuItem={id:string;name:string;price:number;friendPrice?:number;category:string;description:string;available:boolean;preparationMinutes:number;sortOrder:number;imageUrl?:string;section?:"daily"|"deal";days?:string[]};
export type BusinessSettings={id:string;location:string;hours:string;locationNote:string;updatedAt:string};
export type DailyReconciliation={date:string;actualCash:number;actualETransfer:number;actualOther:number;notes:string;updatedAt:string};

const ordersCollection=collection(db,"orders");
const customersCollection=collection(db,"customers");
const menuCollection=collection(db,"menu");
const settingsCollection=collection(db,"businessSettings");
const reconciliationCollection=collection(db,"dailyReconciliations");

export function createFoodOrder(data:Omit<FoodOrder,"id">){const reference=doc(ordersCollection);return{id:reference.id,writePromise:setDoc(reference,data)}}
export async function getFoodOrder(id:string):Promise<FoodOrder|null>{const snapshot=await getDoc(doc(db,"orders",id));return snapshot.exists()?{id:snapshot.id,...snapshot.data() as Omit<FoodOrder,"id">}:null}
export async function getCustomerOrders(uid:string):Promise<FoodOrder[]>{const snapshot=await getDocs(query(ordersCollection,where("customerId","==",uid)));return snapshot.docs.map(item=>({id:item.id,...item.data() as Omit<FoodOrder,"id">})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}
export function subscribeToFoodOrder(id:string,onChange:(order:FoodOrder|null)=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(doc(db,"orders",id),snapshot=>onChange(snapshot.exists()?{id:snapshot.id,...snapshot.data() as Omit<FoodOrder,"id">}:null),error=>onError(error instanceof Error?error:new Error("Order updates unavailable.")))}
export async function getFoodOrders():Promise<FoodOrder[]>{const snapshot=await getDocs(ordersCollection);return snapshot.docs.map(item=>({id:item.id,...item.data() as Omit<FoodOrder,"id">})).sort((a,b)=>b.scheduledFor.localeCompare(a.scheduledFor))}
export function subscribeToFoodOrders(onChange:(orders:FoodOrder[])=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(ordersCollection,snapshot=>onChange(snapshot.docs.map(item=>({id:item.id,...item.data() as Omit<FoodOrder,"id">})).sort((a,b)=>b.scheduledFor.localeCompare(a.scheduledFor))),error=>onError(error instanceof Error?error:new Error("Order queue updates unavailable.")))}
export function subscribeToMenuItems(onChange:(items:MenuItem[])=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(menuCollection,snapshot=>onChange(snapshot.docs.map(item=>({id:item.id,...item.data() as Omit<MenuItem,"id">})).sort((a,b)=>a.sortOrder-b.sortOrder||a.name.localeCompare(b.name))),error=>onError(error instanceof Error?error:new Error("Menu updates unavailable.")))}
export function subscribeToBusinessSettings(onChange:(settings:BusinessSettings|null)=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(doc(settingsCollection,"main"),snapshot=>onChange(snapshot.exists()?{id:snapshot.id,...snapshot.data() as Omit<BusinessSettings,"id">}:null),error=>onError(error instanceof Error?error:new Error("Business settings updates unavailable.")))}
export async function updateFoodOrderStatus(id:string,status:OrderStatus){await updateDoc(doc(db,"orders",id),{status})}
export async function updateFoodOrderPayment(id:string,paymentStatus:PaymentStatus,paymentMethod:PaymentMethod,amountPaid:number){await updateDoc(doc(db,"orders",id),{paymentStatus,paymentMethod,amountPaid:Math.max(0,amountPaid)})}
export async function isAdminUser(uid:string):Promise<boolean>{const snapshot=await getDoc(doc(db,"admins",uid));return snapshot.exists() && ["owner","staff"].includes(String(snapshot.data().role??"").toLowerCase())}
export async function getCustomerProfile(uid:string):Promise<CustomerProfile|null>{const snapshot=await getDoc(doc(customersCollection,uid));return snapshot.exists()?{uid:snapshot.id,...snapshot.data() as Omit<CustomerProfile,"uid">}:null}
export async function saveCustomerProfile(profile:CustomerProfile){await setDoc(doc(customersCollection,profile.uid),profile,{merge:true})}
export async function getMenuItems():Promise<MenuItem[]>{const snapshot=await getDocs(menuCollection);return snapshot.docs.map(item=>({id:item.id,...item.data() as Omit<MenuItem,"id">})).sort((a,b)=>a.sortOrder-b.sortOrder||a.name.localeCompare(b.name))}
export async function saveMenuItem(item:MenuItem){await setDoc(doc(menuCollection,item.id),item)}
export async function deleteMenuItem(id:string){await deleteDoc(doc(db,"menu",id))}
export async function getBusinessSettings():Promise<BusinessSettings|null>{const snapshot=await getDoc(doc(settingsCollection,"main"));return snapshot.exists()?{id:snapshot.id,...snapshot.data() as Omit<BusinessSettings,"id">}:null}
export async function saveBusinessSettings(settings:BusinessSettings){await setDoc(doc(settingsCollection,"main"),settings)}
export async function getDailyReconciliation(date:string):Promise<DailyReconciliation|null>{const snapshot=await getDoc(doc(reconciliationCollection,date));return snapshot.exists()?{date:snapshot.id,...snapshot.data() as Omit<DailyReconciliation,"date">}:null}
export async function saveDailyReconciliation(record:DailyReconciliation){await setDoc(doc(reconciliationCollection,record.date),record)}
