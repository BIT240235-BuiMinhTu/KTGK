

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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
  syncPendingOperations,
  updateDish,
} from "../api";


import type { Dish, DishCategory, DishImage } from "../models";


type Language = "en" | "vi";
type AvailabilityFilter = "all" | "available" | "unavailable";
type SortOption = "none" | "priceAsc" | "priceDesc" | "timeAsc";


const COLORS = {
  primary: "#2563EB",
  background: "#F3F6FB",
  white: "#FFFFFF",
  text: "#172033",
  muted: "#64748B",
  border: "#DCE3ED",
  danger: "#DC2626",
  green: "#15803D",
};


export default function Index() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState<Language>("en");


  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [availability, setAvailability] =
    useState<AvailabilityFilter>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("none");


  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);


  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [preparationTime, setPreparationTime] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);


  const [imageUrl, setImageUrl] = useState("");
  const [dishImages, setDishImages] = useState<DishImage[]>([]);


  const t = (english: string, vietnamese: string) =>
    language === "en" ? english : vietnamese;


  // Hiển thị thông báo đúng trên cả trình duyệt web và điện thoại.
  function showMessage(title: string, message: string) {
    if (Platform.OS === "web") {
      window.alert(`${title}\\n\\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }


  async function loadData() {
    try {
      setLoading(true);


      // Try to synchronize offline changes before reloading data.
      try {
        await syncPendingOperations();
      } catch {
        // Continue loading cached data if synchronization fails.
      }


      const [dishData, categoryData] = await Promise.all([
        getDishes(),
        getCategories(),
      ]);


      setDishes(dishData);
      setCategories(categoryData);


      if (
        categoryData.length > 0 &&
        !categoryData.some(
          (category) =>
            category.BIT240235_Id === categoryId
        )
      ) {
        setCategoryId(categoryData[0].BIT240235_Id);
      }
    } catch (error) {
      Alert.alert(
        t("Loading error", "Lỗi tải dữ liệu"),
        error instanceof Error
          ? error.message
          : t("Cannot load data.", "Không thể tải dữ liệu.")
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    void loadData();
  }, []);


  function getCategoryName(id: string) {
    const category = categories.find(
      (item) => item.BIT240235_Id === id
    );


    return category
      ? category.BIT240235_Name
      : t("Unknown category", "Danh mục không xác định");
  }


  function resetForm() {
    setName("");
    setPrice("");
    setPreparationTime("");
    setDescription("");
    setIsAvailable(true);
    setImageUrl("");
    setDishImages([]);
    setEditingId(null);


    if (categories.length > 0) {
      setCategoryId(categories[0].BIT240235_Id);
    } else {
      setCategoryId("");
    }
  }


  function openAdd() {
    if (categories.length === 0) {
      Alert.alert(
        t("Notice", "Thông báo"),
        t(
          "Please create a category in MockAPI first.",
          "Vui lòng tạo danh mục trong MockAPI trước."
        )
      );
      return;
    }


    resetForm();
    setModalVisible(true);
  }


  function openEdit(dish: Dish) {
    setEditingId(dish.BIT240235_Id);
    setName(dish.BIT240235_Name);
    setPrice(String(dish.BIT240235_Price));
    setPreparationTime(
      String(dish.BIT240235_PreparationTime)
    );
    setDescription(dish.BIT240235_Description);
    setCategoryId(dish.BIT240235_DishCategoryId);
    setIsAvailable(dish.BIT240235_IsAvailable);
    setDishImages(
      Array.isArray(dish.BIT240235_DishImage)
        ? dish.BIT240235_DishImage.map((image) => ({
            ...image,
          }))
        : []
    );
    setImageUrl("");
    setModalVisible(true);
  }


  function addDishImage() {
    const url = imageUrl.trim();


    if (!/^https?:\/\/\S+$/i.test(url)) {
      Alert.alert(
        t("Invalid image URL", "Đường dẫn ảnh không hợp lệ"),
        t(
          "Enter an image URL starting with http:// or https://.",
          "Nhập URL ảnh bắt đầu bằng http:// hoặc https://."
        )
      );
      return;
    }


    if (
      dishImages.some(
        (image) => image.BIT240235_ImageUrl === url
      )
    ) {
      Alert.alert(
        t("Duplicate image", "Ảnh bị trùng"),
        t("This image already exists.", "Ảnh này đã được thêm.")
      );
      return;
    }


    setDishImages((previous) => [
      ...previous,
      {
        BIT240235_ImageUrl: url,
        BIT240235_IsThumbnail: previous.length === 0,
      },
    ]);


    setImageUrl("");
  }


  function removeDishImage(url: string) {
    setDishImages((previous) => {
      const remaining = previous.filter(
        (image) => image.BIT240235_ImageUrl !== url
      );


      if (
        remaining.length > 0 &&
        !remaining.some(
          (image) => image.BIT240235_IsThumbnail
        )
      ) {
        remaining[0] = {
          ...remaining[0],
          BIT240235_IsThumbnail: true,
        };
      }


      return remaining;
    });
  }


  function setThumbnail(url: string) {
    setDishImages((previous) =>
      previous.map((image) => ({
        ...image,
        BIT240235_IsThumbnail:
          image.BIT240235_ImageUrl === url,
      }))
    );
  }


  async function saveDish() {
    const cleanName = name.trim();
    const numericPrice = Number(price);
    const numericTime = Number(preparationTime);
    const cleanDescription = description.trim();


    if (!cleanName) {
      showMessage(
        t("Validation", "Kiểm tra dữ liệu"),
        t("Dish name is required.", "Vui lòng nhập tên món ăn.")
      );
      return;
    }


    if (
      price.trim() === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      showMessage(
        t("Validation", "Kiểm tra dữ liệu"),
        t("Price must be greater than 0.", "Giá phải lớn hơn 0.")
      );
      return;
    }


    if (
      preparationTime.trim() === "" ||
      !Number.isFinite(numericTime) ||
      numericTime <= 0
    ) {
      showMessage(
        t("Validation", "Kiểm tra dữ liệu"),
        t(
          "Preparation time must be greater than 0.",
          "Thời gian chuẩn bị phải lớn hơn 0."
        )
      );
      return;
    }


    const selectedCategory = categories.find(
      (category) => category.BIT240235_Id === categoryId
    );


    if (!selectedCategory) {
      showMessage(
        t("Validation", "Kiểm tra dữ liệu"),
        t("Please select a valid category.", "Vui lòng chọn danh mục hợp lệ.")
      );
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
      showMessage(
        t("Duplicate dish", "Món ăn bị trùng"),
        t(
          "This dish name already exists in this category.",
          "Tên món ăn đã tồn tại trong danh mục này."
        )
      );
      return;
    }


    const images = dishImages.map((image, index) => ({
      ...image,
      BIT240235_IsThumbnail:
        image.BIT240235_IsThumbnail ||
        (index === 0 &&
          !dishImages.some(
            (item) => item.BIT240235_IsThumbnail
          )),
    }));


    const newDish: Dish = {
      BIT240235_Id: editingId ?? "",
      BIT240235_Name: cleanName,
      BIT240235_Price: numericPrice,
      BIT240235_PreparationTime: numericTime,
      BIT240235_IsAvailable: isAvailable,
      BIT240235_Description: cleanDescription,
      BIT240235_DishCategoryId: categoryId,
      BIT240235_DishImage: images,
    };


    try {
      setSaving(true);


      if (editingId) {
        await updateDish(editingId, newDish);
      } else {
        await createDish(newDish);
      }


      setModalVisible(false);


      showMessage(
        t("Success", "Thành công"),
        t(
          "Dish saved successfully.",
          "Đã lưu món ăn thành công."
        )
      );


      await loadData();
    } catch (error) {
      showMessage(
        t("Save error", "Lỗi lưu dữ liệu"),
        error instanceof Error
          ? error.message
          : t("Could not save the dish.", "Không thể lưu món ăn.")
      );
    } finally {
      setSaving(false);
    }
  }


  async function deleteDishNow(dish: Dish) {
  try {
    await deleteDishFromAPI(dish.BIT240235_Id);
    await loadData();


    if (Platform.OS === "web") {
      window.alert(
        language === "en"
          ? "Dish deleted successfully."
          : "Đã xóa món ăn thành công."
      );
    } else {
      Alert.alert(
        t("Success", "Thành công"),
        t(
          "Dish deleted successfully.",
          "Đã xóa món ăn thành công."
        )
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : t(
            "Could not delete the dish.",
            "Không thể xóa món ăn."
          );


    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert(t("Delete error", "Lỗi xóa"), message);
    }
  }
}


function confirmDelete(dish: Dish) {
  const message = t(
    `Are you sure you want to delete "${dish.BIT240235_Name}"?`,
    `Bạn có chắc muốn xóa "${dish.BIT240235_Name}" không?`
  );


  if (Platform.OS === "web") {
    if (window.confirm(message)) {
      void deleteDishNow(dish);
    }
    return;
  }


  Alert.alert(
    t("Delete dish", "Xóa món ăn"),
    message,
    [
      {
        text: t("Cancel", "Hủy"),
        style: "cancel",
      },
      {
        text: t("Delete", "Xóa"),
        style: "destructive",
        onPress: () => {
          void deleteDishNow(dish);
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
        filterCategory === "all" ||
        dish.BIT240235_DishCategoryId === filterCategory
    )
    .filter((dish) => {
      if (availability === "available") {
        return dish.BIT240235_IsAvailable;
      }


      if (availability === "unavailable") {
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
      if (sortOption === "priceAsc") {
        return a.BIT240235_Price - b.BIT240235_Price;
      }


      if (sortOption === "priceDesc") {
        return b.BIT240235_Price - a.BIT240235_Price;
      }


      if (sortOption === "timeAsc") {
        return (
          a.BIT240235_PreparationTime -
          b.BIT240235_PreparationTime
        );
      }


      return 0;
    });


  const formatPrice = (value: number) =>
    `${value.toLocaleString("en-US")} VND`;


  function chip(
    label: string,
    selected: boolean,
    onPress: () => void
  ) {
    return (
      <TouchableOpacity
        key={label}
        style={[styles.chip, selected && styles.chipSelected]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.chipText,
            selected && styles.chipTextSelected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }


  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Food Manager</Text>
          <Text style={styles.headerSubtitle}>
            {t("Manage your dishes", "Quản lý món ăn")}
          </Text>
        </View>


        <TouchableOpacity
          style={styles.languageButton}
          onPress={() =>
            setLanguage((current) =>
              current === "en" ? "vi" : "en"
            )
          }
        >
          <Text style={styles.languageText}>
            {language === "en" ? "VI" : "EN"}
          </Text>
        </TouchableOpacity>
      </View>


      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>
          {t("Search dishes", "Tìm món ăn")}
        </Text>


        <TextInput
          style={styles.input}
          placeholder={t("Enter dish name...", "Nhập tên món ăn...")}
          value={search}
          onChangeText={setSearch}
        />


        <Text style={styles.label}>
          {t("Category", "Danh mục")}
        </Text>


        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {chip(
            t("All categories", "Tất cả"),
            filterCategory === "all",
            () => setFilterCategory("all")
          )}


          {categories.map((category) =>
            chip(
              category.BIT240235_Name,
              filterCategory === category.BIT240235_Id,
              () => setFilterCategory(category.BIT240235_Id)
            )
          )}
        </ScrollView>


        <Text style={styles.label}>
          {t("Availability", "Trạng thái")}
        </Text>


        <View style={styles.chipRow}>
          {chip(
            t("All", "Tất cả"),
            availability === "all",
            () => setAvailability("all")
          )}
          {chip(
            t("Available", "Còn bán"),
            availability === "available",
            () => setAvailability("available")
          )}
          {chip(
            t("Unavailable", "Ngừng bán"),
            availability === "unavailable",
            () => setAvailability("unavailable")
          )}
        </View>


        <Text style={styles.label}>
          {t("Price range (VND)", "Khoảng giá (VND)")}
        </Text>


        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder={t("Minimum", "Giá thấp nhất")}
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder={t("Maximum", "Giá cao nhất")}
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
          />
        </View>


        {invalidPriceRange && (
          <Text style={styles.errorText}>
            {t(
              "Minimum price cannot exceed maximum price.",
              "Giá thấp nhất không được lớn hơn giá cao nhất."
            )}
          </Text>
        )}


        <Text style={styles.label}>
          {t("Sort by", "Sắp xếp")}
        </Text>


        <View style={styles.chipRow}>
          {chip(
            t("Default", "Mặc định"),
            sortOption === "none",
            () => setSortOption("none")
          )}
          {chip(
            t("Price ↑", "Giá ↑"),
            sortOption === "priceAsc",
            () => setSortOption("priceAsc")
          )}
          {chip(
            t("Price ↓", "Giá ↓"),
            sortOption === "priceDesc",
            () => setSortOption("priceDesc")
          )}
          {chip(
            t("Time ↑", "Thời gian ↑"),
            sortOption === "timeAsc",
            () => setSortOption("timeAsc")
          )}
        </View>


        <TouchableOpacity
          style={styles.addButton}
          onPress={openAdd}
        >
          <Text style={styles.addButtonText}>
            + {t("Add Dish", "Thêm món ăn")}
          </Text>
        </TouchableOpacity>


        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>
            {t("Dish List", "Danh sách món ăn")}
          </Text>
          <Text style={styles.countText}>
            {filteredDishes.length} {t("dishes", "món")}
          </Text>
        </View>


        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : invalidPriceRange ? (
          <Text style={styles.emptyText}>
            {t("Please correct the price range.", "Vui lòng sửa khoảng giá.")}
          </Text>
        ) : filteredDishes.length === 0 ? (
          <Text style={styles.emptyText}>
            {t("No dishes found.", "Không tìm thấy món ăn.")}
          </Text>
        ) : (
          filteredDishes.map((dish) => {
            const thumbnail = Array.isArray(dish.BIT240235_DishImage)
              ? dish.BIT240235_DishImage.find(
                  (image) => image.BIT240235_IsThumbnail
                ) ?? dish.BIT240235_DishImage[0]
              : undefined;


            return (
              <View
                key={dish.BIT240235_Id}
                style={styles.dishCard}
              >
                {thumbnail?.BIT240235_ImageUrl ? (
                  <Image
                    source={{ uri: thumbnail.BIT240235_ImageUrl }}
                    style={styles.dishImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.dishImage, styles.imagePlaceholder]}>
                    <Text style={styles.placeholderText}>
                      {t("No image", "Chưa có ảnh")}
                    </Text>
                  </View>
                )}


                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>
                    {dish.BIT240235_Name}
                  </Text>


                  <Text style={styles.categoryText}>
                    {getCategoryName(dish.BIT240235_DishCategoryId)}
                  </Text>


                  <Text style={styles.priceText}>
                    {formatPrice(dish.BIT240235_Price)}
                  </Text>


                  <Text style={styles.detailText}>
                    {dish.BIT240235_PreparationTime}{" "}
                    {t("minutes", "phút")} ·{" "}
                    {dish.BIT240235_PreparationTime <= 15
                      ? t("Quick", "Nhanh")
                      : t("Regular", "Thông thường")}
                  </Text>


                  <Text
                    style={[
                      styles.status,
                      dish.BIT240235_IsAvailable
                        ? styles.available
                        : styles.unavailable,
                    ]}
                  >
                    {dish.BIT240235_IsAvailable
                      ? t("Available", "Còn bán")
                      : t("Unavailable", "Ngừng bán")}
                  </Text>


                  {!!dish.BIT240235_Description && (
                    <Text style={styles.description}>
                      {dish.BIT240235_Description}
                    </Text>
                  )}


                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEdit(dish)}
                    >
                      <Text style={styles.actionText}>
                        {t("Edit", "Sửa")}
                      </Text>
                    </TouchableOpacity>


                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => confirmDelete(dish)}
                    >
                      <Text style={styles.actionText}>
                        {t("Delete", "Xóa")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}


        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => void loadData()}
          disabled={loading}
        >
          <Text style={styles.refreshText}>
            {t("Reload and Sync", "Tải lại và đồng bộ")}
          </Text>
        </TouchableOpacity>
      </ScrollView>


      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingId
                ? t("Edit Dish", "Sửa món ăn")
                : t("Add Dish", "Thêm món ăn")}
            </Text>


            <TouchableOpacity
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>


          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>
              {t("Dish name *", "Tên món ăn *")}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t("Enter dish name", "Nhập tên món ăn")}
              value={name}
              onChangeText={setName}
            />


            <Text style={styles.label}>
              {t("Price (VND) *", "Giá (VND) *")}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="50000"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />


            <Text style={styles.label}>
              {t("Preparation time (minutes) *", "Thời gian chuẩn bị (phút) *")}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="15"
              value={preparationTime}
              onChangeText={setPreparationTime}
              keyboardType="numeric"
            />


            <Text style={styles.label}>
              {t("Description", "Mô tả")}
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder={t("Describe the dish...", "Mô tả món ăn...")}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />


            <Text style={styles.label}>
              {t("Select category *", "Chọn danh mục *")}
            </Text>
            <View style={styles.chipRow}>
              {categories.map((category) =>
                chip(
                  category.BIT240235_Name,
                  categoryId === category.BIT240235_Id,
                  () => setCategoryId(category.BIT240235_Id)
                )
              )}
            </View>


            <View style={styles.switchRow}>
              <Text style={styles.label}>
                {t("Available for sale", "Đang bán")}
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ true: COLORS.primary }}
              />
            </View>


            <Text style={styles.sectionTitle}>
              {t("Dish Images", "Ảnh món ăn")}
            </Text>


            <Text style={styles.hint}>
              {t(
                "Add image URLs. The first image is the default thumbnail.",
                "Thêm URL ảnh. Ảnh đầu tiên mặc định là ảnh đại diện."
              )}
            </Text>


            <TextInput
              style={styles.input}
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              keyboardType="url"
            />


            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={addDishImage}
            >
              <Text style={styles.secondaryButtonText}>
                + {t("Add Image URL", "Thêm URL ảnh")}
              </Text>
            </TouchableOpacity>


            {dishImages.map((image) => (
              <View
                key={image.BIT240235_ImageUrl}
                style={styles.imageRow}
              >
                <Image
                  source={{ uri: image.BIT240235_ImageUrl }}
                  style={styles.previewImage}
                  onError={() =>
                    Alert.alert(
                      t("Image error", "Lỗi ảnh"),
                      t(
                        "This image could not be loaded.",
                        "Không thể tải ảnh này."
                      )
                    )
                  }
                />


                <View style={styles.imageDetails}>
                  <Text style={styles.imageUrlText} numberOfLines={2}>
                    {image.BIT240235_ImageUrl}
                  </Text>


                  <TouchableOpacity
                    onPress={() =>
                      setThumbnail(image.BIT240235_ImageUrl)
                    }
                  >
                    <Text
                      style={
                        image.BIT240235_IsThumbnail
                          ? styles.thumbnailSelected
                          : styles.thumbnailButton
                      }
                    >
                      {image.BIT240235_IsThumbnail
                        ? "★ " + t("Thumbnail", "Ảnh đại diện")
                        : t("Set as thumbnail", "Chọn làm ảnh đại diện")}
                    </Text>
                  </TouchableOpacity>


                  <TouchableOpacity
                    onPress={() =>
                      removeDishImage(image.BIT240235_ImageUrl)
                    }
                  >
                    <Text style={styles.removeImageText}>
                      {t("Remove image", "Xóa ảnh")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}


            <TouchableOpacity
              style={[
                styles.addButton,
                saving && styles.disabledButton,
              ]}
              onPress={() => void saveDish()}
              disabled={saving}
            >
              <Text style={styles.addButtonText}>
                {saving
                  ? t("Saving...", "Đang lưu...")
                  : t("Save Dish", "Lưu món ăn")}
              </Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
              disabled={saving}
            >
              <Text style={styles.cancelText}>
                {t("Cancel", "Hủy")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#DBEAFE",
    fontSize: 14,
    marginTop: 5,
  },
  languageButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    marginLeft: 12,
  },
  languageText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 90,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 6,
    marginBottom: 6,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 20,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  listHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  countText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  loader: {
    marginTop: 35,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.muted,
    padding: 28,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
  },
  dishCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    marginBottom: 14,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E6EBF2",
  },
  dishImage: {
    width: 100,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  placeholderText: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: "center",
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
  priceText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "800",
    marginTop: 7,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
  },
  status: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 7,
  },
  available: {
    backgroundColor: "#DCFCE7",
    color: COLORS.green,
  },
  unavailable: {
    backgroundColor: "#FEE2E2",
    color: COLORS.danger,
  },
  description: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 7,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 12,
  },
  refreshButton: {
    padding: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    marginTop: 8,
  },
  refreshText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginBottom: 8,
  },
  modalScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 52,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
  },
  closeText: {
    color: COLORS.white,
    fontSize: 24,
    paddingHorizontal: 8,
  },
  formContent: {
    padding: 18,
    paddingBottom: 40,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 20,
  },
  hint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 10,
    lineHeight: 18,
  },
  secondaryButton: {
    backgroundColor: "#DBEAFE",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  imageRow: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImage: {
    width: 82,
    height: 82,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  imageDetails: {
    flex: 1,
    justifyContent: "center",
  },
  imageUrlText: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 7,
  },
  thumbnailSelected: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  thumbnailButton: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  removeImageText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  cancelButton: {
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  cancelText: {
    color: COLORS.muted,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
});



