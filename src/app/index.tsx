
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createDish,
  deleteDishFromAPI,
  getCategories,
  getDishes,
  updateDish,
} from "../api";
import type { Dish, DishCategory } from "../models";

export default function HomeScreen() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("none");

  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [dishData, categoryData] = await Promise.all([
        getDishes(),
        getCategories(),
      ]);

      setDishes(dishData);
      setCategories(categoryData);

      if (categoryData.length > 0 && !categoryId) {
        setCategoryId(categoryData[0].BIT240235_Id);
      }
    } catch (error) {
      Alert.alert(
        "Connection Error",
        error instanceof Error
          ? error.message
          : "Cannot load data from MockAPI."
      );
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingId(null);
    setName("");
    setPrice("");
    setTime("");
    setDescription("");
    setCategoryId(categories[0]?.BIT240235_Id ?? "");
    setAvailable(true);
    setVisible(true);
  }

  function openEdit(dish: Dish) {
    setEditingId(dish.BIT240235_Id);
    setName(dish.BIT240235_Name);
    setPrice(String(dish.BIT240235_Price));
    setTime(String(dish.BIT240235_PreparationTime));
    setDescription(dish.BIT240235_Description);
    setCategoryId(dish.BIT240235_DishCategoryId);
    setAvailable(dish.BIT240235_IsAvailable);
    setVisible(true);
  }

  async function saveDish() {
    const cleanName = name.trim();
    const numericPrice = Number(price);
    const numericTime = Number(time);

    if (!cleanName) {
      Alert.alert("Validation", "Please enter the dish name.");
      return;
    }

    if (
      !price.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      Alert.alert("Validation", "Price must be greater than 0.");
      return;
    }

    if (
      !time.trim() ||
      !Number.isFinite(numericTime) ||
      numericTime <= 0
    ) {
      Alert.alert(
        "Validation",
        "Preparation time must be greater than 0."
      );
      return;
    }

    if (!categories.some((c) => c.BIT240235_Id === categoryId)) {
      Alert.alert("Validation", "Please select a valid category.");
      return;
    }

    const duplicate = dishes.some(
      (dish) =>
        dish.BIT240235_Id !== editingId &&
        dish.BIT240235_DishCategoryId === categoryId &&
        dish.BIT240235_Name.trim().toLowerCase() ===
          cleanName.toLowerCase()
    );

    if (duplicate) {
      Alert.alert(
        "Validation",
        "This dish already exists in this category."
      );
      return;
    }

    const oldDish = dishes.find(
      (dish) => dish.BIT240235_Id === editingId
    );

    const newDish: Dish = {
      BIT240235_Id: editingId ?? String(Date.now()),
      BIT240235_Name: cleanName,
      BIT240235_Price: numericPrice,
      BIT240235_PreparationTime: numericTime,
      BIT240235_IsAvailable: available,
      BIT240235_Description: description.trim(),
      BIT240235_DishCategoryId: categoryId,
      BIT240235_DishImage: oldDish?.BIT240235_DishImage ?? [],
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateDish(editingId, newDish);
      } else {
        await createDish(newDish);
      }

      setVisible(false);
      await loadData();

      Alert.alert("Success", "Dish saved to MockAPI.");
    } catch (error) {
      Alert.alert(
        "Save Error",
        error instanceof Error
          ? error.message
          : "Cannot save dish."
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(dish: Dish) {
    Alert.alert(
      "Delete Dish",
      `Do you want to delete "${dish.BIT240235_Name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteDishFromAPI(dish.BIT240235_Id);
                await loadData();
              } catch (error) {
                Alert.alert(
                  "Delete Error",
                  error instanceof Error
                    ? error.message
                    : "Cannot delete dish."
                );
              }
            })();
          },
        },
      ]
    );
  }

  const invalidPriceRange =
    minPrice.trim() !== "" &&
    maxPrice.trim() !== "" &&
    Number(minPrice) > Number(maxPrice);

  const filteredDishes = dishes
    .filter((dish) =>
      dish.BIT240235_Name
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
    .filter(
      (dish) =>
        selectedCategory === "all" ||
        dish.BIT240235_DishCategoryId === selectedCategory
    )
    .filter((dish) => {
      if (availabilityFilter === "available") {
        return dish.BIT240235_IsAvailable;
      }

      if (availabilityFilter === "unavailable") {
        return !dish.BIT240235_IsAvailable;
      }

      return true;
    })
    .filter((dish) => {
      if (minPrice.trim() !== "" && dish.BIT240235_Price < Number(minPrice)) {
        return false;
      }

      if (maxPrice.trim() !== "" && dish.BIT240235_Price > Number(maxPrice)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "priceAsc") {
        return a.BIT240235_Price - b.BIT240235_Price;
      }

      if (sortBy === "priceDesc") {
        return b.BIT240235_Price - a.BIT240235_Price;
      }

      if (sortBy === "timeAsc") {
        return (
          a.BIT240235_PreparationTime -
          b.BIT240235_PreparationTime
        );
      }

      return 0;
    });

  function getCategoryName(id: string) {
    return (
      categories.find((category) => category.BIT240235_Id === id)
        ?.BIT240235_Name ?? "Unknown Category"
    );
  }

  function resetFilters() {
    setSearch("");
    setSelectedCategory("all");
    setAvailabilityFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("none");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Food Manager</Text>
      <Text style={styles.subtitle}>
        Manage your dishes · {filteredDishes.length} dishes
      </Text>

      <TextInput
        style={styles.search}
        placeholder="Search dishes..."
        value={search}
        onChangeText={setSearch}
      />

      <Text style={styles.label}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalList}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === "all" && styles.selectedCategory,
          ]}
          onPress={() => setSelectedCategory("all")}
        >
          <Text>All</Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.BIT240235_Id}
            style={[
              styles.categoryButton,
              selectedCategory === category.BIT240235_Id &&
                styles.selectedCategory,
            ]}
            onPress={() =>
              setSelectedCategory(category.BIT240235_Id)
            }
          >
            <Text>{category.BIT240235_Name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Availability</Text>
      <View style={styles.actions}>
        {[
          { label: "All", value: "all" },
          { label: "Available", value: "available" },
          { label: "Unavailable", value: "unavailable" },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.categoryButton,
              styles.flexButton,
              availabilityFilter === option.value &&
                styles.selectedCategory,
            ]}
            onPress={() => setAvailabilityFilter(option.value)}
          >
            <Text style={styles.smallButtonText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Price Range (VND)</Text>
      <View style={styles.actions}>
        <TextInput
          style={[styles.input, styles.flexInput]}
          placeholder="Minimum"
          keyboardType="numeric"
          value={minPrice}
          onChangeText={setMinPrice}
        />
        <TextInput
          style={[styles.input, styles.flexInput]}
          placeholder="Maximum"
          keyboardType="numeric"
          value={maxPrice}
          onChangeText={setMaxPrice}
        />
      </View>

      {invalidPriceRange && (
        <Text style={styles.errorText}>
          Minimum price must not exceed maximum price.
        </Text>
      )}

      <Text style={styles.label}>Sort By</Text>
      <View style={styles.actions}>
        {[
          { label: "Default", value: "none" },
          { label: "Price ↑", value: "priceAsc" },
          { label: "Price ↓", value: "priceDesc" },
          { label: "Time ↑", value: "timeAsc" },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.categoryButton,
              styles.flexButton,
              sortBy === option.value && styles.selectedCategory,
            ]}
            onPress={() => setSortBy(option.value)}
          >
            <Text style={styles.smallButtonText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.addButton, styles.flexButton]}
          onPress={openAdd}
        >
          <Text style={styles.whiteButtonText}>+ Add Dish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resetButton, styles.flexButton]}
          onPress={resetFilters}
        >
          <Text>Reset Filters</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={invalidPriceRange ? [] : filteredDishes}
          keyExtractor={(item) => item.BIT240235_Id}
          contentContainerStyle={styles.listContent}
          onRefresh={() => void loadData()}
          refreshing={loading}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No dishes found. Pull down to refresh.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.dishName}>
                {item.BIT240235_Name}
              </Text>

              <Text style={styles.info}>
                {getCategoryName(item.BIT240235_DishCategoryId)}
              </Text>

              <Text style={styles.price}>
                {item.BIT240235_Price.toLocaleString("en-US")} VND
              </Text>

              <Text style={styles.info}>
                Preparation: {item.BIT240235_PreparationTime} minutes
              </Text>

              <Text style={styles.info}>
                {item.BIT240235_PreparationTime <= 15
                  ? "Quick"
                  : "Regular"}
                {" · "}
                {item.BIT240235_IsAvailable
                  ? "Available"
                  : "Unavailable"}
              </Text>

              {item.BIT240235_Description !== "" && (
                <Text style={styles.info}>
                  {item.BIT240235_Description}
                </Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.editButton, styles.flexButton]}
                  onPress={() => openEdit(item)}
                >
                  <Text style={styles.whiteButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteButton, styles.flexButton]}
                  onPress={() => confirmDelete(item)}
                >
                  <Text style={styles.whiteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={visible} animationType="slide">
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.title}>
            {editingId ? "Edit Dish" : "Add Dish"}
          </Text>

          <Text style={styles.label}>Dish Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter dish name"
          />

          <Text style={styles.label}>Price (VND) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Enter price"
          />

          <Text style={styles.label}>Preparation Time (minutes) *</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            keyboardType="numeric"
            placeholder="Enter preparation time"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Enter description"
          />

          <Text style={styles.label}>Category *</Text>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.BIT240235_Id}
              style={[
                styles.categoryButton,
                categoryId === category.BIT240235_Id &&
                  styles.selectedCategory,
              ]}
              onPress={() => setCategoryId(category.BIT240235_Id)}
            >
              <Text>
                {categoryId === category.BIT240235_Id ? "✓ " : ""}
                {category.BIT240235_Name}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.categoryButton,
              available && styles.selectedCategory,
            ]}
            onPress={() => setAvailable(!available)}
          >
            <Text>
              {available ? "✓ Available" : "Mark as Available"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, saving && styles.disabledButton]}
            disabled={saving}
            onPress={() => void saveDish()}
          >
            <Text style={styles.whiteButtonText}>
              {saving ? "Saving..." : "Save Dish"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setVisible(false)}
          >
            <Text>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 16,
    paddingTop: 55,
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#172554",
  },
  subtitle: {
    color: "#64748B",
    marginTop: 5,
    marginBottom: 15,
  },
  label: {
    fontWeight: "600",
    color: "#334155",
    marginTop: 10,
    marginBottom: 7,
  },
  search: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  horizontalList: {
    flexGrow: 0,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  selectedCategory: {
    borderColor: "#2563EB",
    backgroundColor: "#DBEAFE",
  },
  flexButton: {
    flex: 1,
  },
  flexInput: {
    flex: 1,
  },
  smallButtonText: {
    fontSize: 12,
    textAlign: "center",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    padding: 12,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: "top",
  },
  addButton: {
    backgroundColor: "#2563EB",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: "#E2E8F0",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  whiteButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dishName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#172554",
    marginBottom: 6,
  },
  info: {
    color: "#64748B",
    marginTop: 4,
  },
  price: {
    color: "#2563EB",
    fontWeight: "bold",
    fontSize: 17,
    marginTop: 7,
  },
  editButton: {
    backgroundColor: "#0F766E",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  empty: {
    textAlign: "center",
    marginTop: 30,
    marginBottom: 30,
    color: "#64748B",
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 30,
  },
  form: {
    padding: 20,
    paddingTop: 55,
    backgroundColor: "#F8FAFC",
  },
  cancelButton: {
    alignItems: "center",
    padding: 14,
    marginBottom: 25,
  },
  errorText: {
    color: "#DC2626",
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
