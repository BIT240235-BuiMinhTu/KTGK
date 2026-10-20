
import type { Dish, DishCategory } from "./models";

export const initialCategories: DishCategory[] = [
  {
    BIT240235_Id: "cat1",
    BIT240235_Name: "Main Courses",
    BIT240235_Description: "Main dishes",
  },
  {
    BIT240235_Id: "cat2",
    BIT240235_Name: "Drinks",
    BIT240235_Description: "Beverages",
  },
  {
    BIT240235_Id: "cat3",
    BIT240235_Name: "Desserts",
    BIT240235_Description: "Sweet dishes",
  },
];

export const initialDishes: Dish[] = [
  {
    BIT240235_Id: "dish1",
    BIT240235_Name: "Fried Rice",
    BIT240235_Price: 45000,
    BIT240235_PreparationTime: 10,
    BIT240235_IsAvailable: true,
    BIT240235_Description: "Fried rice with vegetables",
    BIT240235_DishCategoryId: "cat1",
    BIT240235_DishImage: [],
  },
  {
    BIT240235_Id: "dish2",
    BIT240235_Name: "Chicken Noodles",
    BIT240235_Price: 55000,
    BIT240235_PreparationTime: 20,
    BIT240235_IsAvailable: true,
    BIT240235_Description: "Noodles with chicken",
    BIT240235_DishCategoryId: "cat1",
    BIT240235_DishImage: [],
  },
  {
    BIT240235_Id: "dish3",
    BIT240235_Name: "Beef Burger",
    BIT240235_Price: 65000,
    BIT240235_PreparationTime: 15,
    BIT240235_IsAvailable: true,
    BIT240235_Description: "Beef burger",
    BIT240235_DishCategoryId: "cat1",
    BIT240235_DishImage: [],
  },
  {
    BIT240235_Id: "dish4",
    BIT240235_Name: "Milk Tea",
    BIT240235_Price: 30000,
    BIT240235_PreparationTime: 5,
    BIT240235_IsAvailable: true,
    BIT240235_Description: "Milk tea with pearls",
    BIT240235_DishCategoryId: "cat2",
    BIT240235_DishImage: [],
  },
  {
    BIT240235_Id: "dish5",
    BIT240235_Name: "Orange Juice",
    BIT240235_Price: 25000,
    BIT240235_PreparationTime: 5,
    BIT240235_IsAvailable: true,
    BIT240235_Description: "Fresh orange juice",
    BIT240235_DishCategoryId: "cat2",
    BIT240235_DishImage: [],
  },
  {
    BIT240235_Id: "dish6",
    BIT240235_Name: "Chocolate Cake",
    BIT240235_Price: 40000,
    BIT240235_PreparationTime: 25,
    BIT240235_IsAvailable: true,
    BIT240235_Description: "Chocolate cake",
    BIT240235_DishCategoryId: "cat3",
    BIT240235_DishImage: [],
  },
];
