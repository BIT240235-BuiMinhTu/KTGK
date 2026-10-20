
import type { Dish, DishCategory } from "./models";

const API_URL =
  "https://6ad7420a95e98f36aef224bf.mockapi.io";

const DISH_URL = `${API_URL}/BIT240235_Dish`;
const CATEGORY_URL = `${API_URL}/BIT240235_DishCategory`;

type ApiRecord = Record<string, unknown> & {
  id?: string | number;
};

async function requestError(response: Response): Promise<never> {
  const detail = await response.text();
  throw new Error(
    `MockAPI error (${response.status}): ${detail}`
  );
}

export async function getDishes(): Promise<Dish[]> {
  const response = await fetch(DISH_URL);

  if (!response.ok) {
    return requestError(response);
  }

  const records: ApiRecord[] = await response.json();

  return records.map((item) => ({
    BIT240235_Id: String(item.id ?? item.BIT240235_Id ?? ""),
    BIT240235_Name: String(item.BIT240235_Name ?? ""),
    BIT240235_Price: Number(item.BIT240235_Price ?? 0),
    BIT240235_PreparationTime: Number(
      item.BIT240235_PreparationTime ?? 0
    ),
    BIT240235_IsAvailable: Boolean(
      item.BIT240235_IsAvailable
    ),
    BIT240235_Description: String(
      item.BIT240235_Description ?? ""
    ),
    BIT240235_DishCategoryId: String(
      item.BIT240235_DishCategoryId ?? ""
    ),
    BIT240235_DishImage: Array.isArray(
      item.BIT240235_DishImage
    )
      ? (item.BIT240235_DishImage as Dish["BIT240235_DishImage"])
      : [],
  }));
}

export async function getCategories(): Promise<DishCategory[]> {
  const response = await fetch(CATEGORY_URL);

  if (!response.ok) {
    return requestError(response);
  }

  const records: ApiRecord[] = await response.json();

  return records.map((item) => ({
    BIT240235_Id: String(item.id ?? item.BIT240235_Id ?? ""),
    BIT240235_Name: String(item.BIT240235_Name ?? ""),
    BIT240235_Description: String(
      item.BIT240235_Description ?? ""
    ),
  }));
}

export async function createDish(dish: Dish): Promise<void> {
  const { BIT240235_Id, ...fields } = dish;
  const response = await fetch(DISH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });

  if (!response.ok) {
    return requestError(response);
  }
}

export async function updateDish(
  id: string,
  dish: Dish
): Promise<void> {
  const { BIT240235_Id, ...fields } = dish;
  const response = await fetch(
    `${DISH_URL}/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    }
  );

  if (!response.ok) {
    return requestError(response);
  }
}

export async function deleteDishFromAPI(
  id: string
): Promise<void> {
  const response = await fetch(
    `${DISH_URL}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    return requestError(response);
  }
}
