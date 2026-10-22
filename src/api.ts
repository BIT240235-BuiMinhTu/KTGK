
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Dish, DishCategory } from "./models";

const API_URL =
  "https://6ad7420a95e98f36aef224bf.mockapi.io";

const DISH_URL = `${API_URL}/BIT240235_Dish`;
const CATEGORY_URL = `${API_URL}/BIT240235_DishCategory`;

const DISH_CACHE = "BIT240235_Dish_Cache";
const CATEGORY_CACHE = "BIT240235_Category_Cache";
const PENDING_QUEUE = "BIT240235_Pending_Queue";

type ApiRecord = Record<string, unknown> & {
  id?: string | number;
};

type PendingOperation = {
  type: "create" | "update" | "delete";
  localId: string;
  payload?: Dish;
  remoteId?: string;
};

function mapDish(item: ApiRecord): Dish {
  return {
    BIT240235_Id: String(item.id ?? item.BIT240235_Id ?? ""),
    BIT240235_Name: String(item.BIT240235_Name ?? ""),
    BIT240235_Price: Number(item.BIT240235_Price ?? 0),
    BIT240235_PreparationTime: Number(
      item.BIT240235_PreparationTime ?? 0
    ),
    BIT240235_IsAvailable:
      item.BIT240235_IsAvailable === true ||
      item.BIT240235_IsAvailable === "true",
    BIT240235_Description: String(
      item.BIT240235_Description ?? ""
    ),
    BIT240235_DishCategoryId: String(
      item.BIT240235_DishCategoryId ?? ""
    ),
    BIT240235_DishImage: Array.isArray(item.BIT240235_DishImage)
      ? (item.BIT240235_DishImage as Dish["BIT240235_DishImage"])
      : [],
  };
}

function mapCategory(item: ApiRecord): DishCategory {
  return {
    BIT240235_Id: String(item.id ?? item.BIT240235_Id ?? ""),
    BIT240235_Name: String(item.BIT240235_Name ?? ""),
    BIT240235_Description: String(
      item.BIT240235_Description ?? ""
    ),
  };
}

async function readCache<T>(key: string): Promise<T[]> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T[]) : [];
  } catch {
    return [];
  }
}

async function saveCache<T>(
  key: string,
  data: T[]
): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

async function getQueue(): Promise<PendingOperation[]> {
  try {
    const value = await AsyncStorage.getItem(PENDING_QUEUE);
    return value ? (JSON.parse(value) as PendingOperation[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(
  queue: PendingOperation[]
): Promise<void> {
  await AsyncStorage.setItem(PENDING_QUEUE, JSON.stringify(queue));
}

async function requestError(response: Response): Promise<never> {
  const detail = await response.text();
  throw new Error(
    `MockAPI error (${response.status}): ${detail}`
  );
}

async function sendDish(
  method: "POST" | "PUT",
  dish: Dish,
  id?: string
): Promise<Dish> {
  const { BIT240235_Id, ...fields } = dish;

  const response = await fetch(
    method === "POST"
      ? DISH_URL
      : `${DISH_URL}/${encodeURIComponent(id ?? "")}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    }
  );

  if (!response.ok) {
    return requestError(response);
  }

  const result = (await response.json()) as ApiRecord;
  return mapDish(result);
}

export async function getDishes(): Promise<Dish[]> {
  let dishes: Dish[];

  try {
    const response = await fetch(DISH_URL);

    if (!response.ok) {
      return requestError(response);
    }

    const records = (await response.json()) as ApiRecord[];
    dishes = records.map(mapDish);

    await saveCache(DISH_CACHE, dishes);
  } catch {
    dishes = await readCache<Dish>(DISH_CACHE);
  }

  const queue = await getQueue();

  for (const operation of queue) {
    if (operation.type === "create" && operation.payload) {
      const exists = dishes.some(
        (dish) => dish.BIT240235_Id === operation.localId
      );

      if (!exists) {
        dishes.push(operation.payload);
      }
    }

    if (operation.type === "update" && operation.payload) {
      dishes = dishes.map((dish) =>
        dish.BIT240235_Id === operation.localId
          ? operation.payload!
          : dish
      );
    }

    if (operation.type === "delete") {
      dishes = dishes.filter(
        (dish) => dish.BIT240235_Id !== operation.localId
      );
    }
  }

  await saveCache(DISH_CACHE, dishes);
  return dishes;
}

export async function getCategories(): Promise<DishCategory[]> {
  try {
    const response = await fetch(CATEGORY_URL);

    if (!response.ok) {
      return requestError(response);
    }

    const records = (await response.json()) as ApiRecord[];
    const categories = records.map(mapCategory);

    await saveCache(CATEGORY_CACHE, categories);
    return categories;
  } catch {
    const cached = await readCache<DishCategory>(CATEGORY_CACHE);

    if (cached.length > 0) {
      return cached;
    }

    throw new Error(
      "Cannot load categories. Please check your connection."
    );
  }
}

export async function createDish(dish: Dish): Promise<Dish> {
  try {
    const saved = await sendDish("POST", dish);
    const dishes = await readCache<Dish>(DISH_CACHE);

    await saveCache(
      DISH_CACHE,
      [
        ...dishes.filter(
          (item) => item.BIT240235_Id !== dish.BIT240235_Id
        ),
        saved,
      ]
    );

    return saved;
  } catch {
    const queue = await getQueue();

    const localDish: Dish = {
      ...dish,
      BIT240235_Id:
        dish.BIT240235_Id || `local_${Date.now()}`,
    };

    queue.push({
      type: "create",
      localId: localDish.BIT240235_Id,
      payload: localDish,
    });

    await saveQueue(queue);

    const dishes = await readCache<Dish>(DISH_CACHE);

    await saveCache(
      DISH_CACHE,
      [
        ...dishes.filter(
          (item) => item.BIT240235_Id !== localDish.BIT240235_Id
        ),
        localDish,
      ]
    );

    return localDish;
  }
}

export async function updateDish(
  id: string,
  dish: Dish
): Promise<Dish> {
  const queue = await getQueue();

  const pendingCreate = queue.find(
    (item) =>
      item.type === "create" && item.localId === id
  );

  if (pendingCreate) {
    pendingCreate.payload = dish;
    await saveQueue(queue);
    await replaceCachedDish(id, dish);
    return dish;
  }

  try {
    const saved = await sendDish("PUT", dish, id);
    await replaceCachedDish(id, saved);
    return saved;
  } catch {
    const existingUpdate = queue.find(
      (item) =>
        item.type === "update" && item.localId === id
    );

    if (existingUpdate) {
      existingUpdate.payload = dish;
    } else {
      queue.push({
        type: "update",
        localId: id,
        remoteId: id,
        payload: dish,
      });
    }

    await saveQueue(queue);
    await replaceCachedDish(id, dish);
    return dish;
  }
}

export async function deleteDishFromAPI(
  id: string
): Promise<void> {
  const queue = await getQueue();

  const pendingCreate = queue.some(
    (item) =>
      item.type === "create" && item.localId === id
  );

  if (pendingCreate) {
    await saveQueue(
      queue.filter((item) => item.localId !== id)
    );

    const dishes = await readCache<Dish>(DISH_CACHE);

    await saveCache(
      DISH_CACHE,
      dishes.filter((item) => item.BIT240235_Id !== id)
    );

    return;
  }

  try {
    const response = await fetch(
      `${DISH_URL}/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    if (!response.ok && response.status !== 404) {
      await requestError(response);
    }
  } catch {
    const existingDelete = queue.some(
      (item) =>
        item.type === "delete" && item.localId === id
    );

    if (!existingDelete) {
      queue.push({
        type: "delete",
        localId: id,
        remoteId: id,
      });

      await saveQueue(queue);
    }
  }

  const dishes = await readCache<Dish>(DISH_CACHE);

  await saveCache(
    DISH_CACHE,
    dishes.filter((item) => item.BIT240235_Id !== id)
  );
}

async function replaceCachedDish(
  id: string,
  dish: Dish
): Promise<void> {
  const dishes = await readCache<Dish>(DISH_CACHE);
  const exists = dishes.some(
    (item) => item.BIT240235_Id === id
  );

  await saveCache(
    DISH_CACHE,
    exists
      ? dishes.map((item) =>
          item.BIT240235_Id === id ? dish : item
        )
      : [...dishes, dish]
  );
}

export async function syncPendingOperations(): Promise<void> {
  const queue = await getQueue();
  const remaining: PendingOperation[] = [];

  for (const operation of queue) {
    try {
      if (operation.type === "create" && operation.payload) {
        const saved = await sendDish("POST", operation.payload);

        const dishes = await readCache<Dish>(DISH_CACHE);

        await saveCache(
          DISH_CACHE,
          [
            ...dishes.filter(
              (item) => item.BIT240235_Id !== operation.localId
            ),
            saved,
          ]
        );
      } else if (
        operation.type === "update" &&
        operation.payload
      ) {
        const saved = await sendDish(
          "PUT",
          operation.payload,
          operation.remoteId ?? operation.localId
        );

        await replaceCachedDish(operation.localId, saved);
      } else if (operation.type === "delete") {
        const response = await fetch(
          `${DISH_URL}/${encodeURIComponent(
            operation.remoteId ?? operation.localId
          )}`,
          { method: "DELETE" }
        );

        if (!response.ok && response.status !== 404) {
          await requestError(response);
        }
      }
    } catch {
      remaining.push(operation);
    }
  }

  await saveQueue(remaining);
}
