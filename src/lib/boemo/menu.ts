export const menuByDay: Record<string,string[]> = {
  Monday:["Ke Starch","Beetroot","Pumpkin","Chicken + Stew","Soup","Drink of Choice"],
  Tuesday:["Samp & Stew"],
  Wednesday:["Pap","Braai","Chicken","Morogo"],
  Thursday:["Dumplings & Chicken"],
  Friday:["Hot Dog & Fries"],
};
export const lateNightDeals=[
  {name:"Beggar & Chips",price:30,friend:25},
  {name:"Hot Dog",price:25,friend:20},
  {name:"Potatoes",price:10},
  {name:"Cup Drink",price:8,friend:7.5},
  {name:"Still Water",price:7,friend:5},
  {name:"Sausage & Chips",price:30},
  {name:"Combo: Sausage + Chips + Drink",price:40},
  {name:"Beggar + Chips + Drink",price:40},
] as const;