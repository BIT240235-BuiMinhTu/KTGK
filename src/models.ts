
export type DishCategory = {
  BIT240235_Id: string;
  BIT240235_Name: string;
  BIT240235_Description: string;
};

export type DishImage = {
  BIT240235_ImageUrl: string;
  BIT240235_IsThumbnail: boolean;
};

export type Dish = {
  BIT240235_Id: string;
  BIT240235_Name: string;
  BIT240235_Price: number;
  BIT240235_PreparationTime: number;
  BIT240235_IsAvailable: boolean;
  BIT240235_Description: string;
  BIT240235_DishCategoryId: string;
  BIT240235_DishImage: DishImage[];
};
