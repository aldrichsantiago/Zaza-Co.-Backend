import express, { Application } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv"
dotenv.config({ path: __dirname+'/.env' });
import { addToUserCart, addUserWishlistByUsername, createUser, deleteUser, editUser, getAllUsers, getUserById, getUserByUsername, getUserWishlistByUsername, logInUser, logOut, refreshToken, testAccessProtectedRoute, uploadAvatar } from "./src/controllers/Users";
import passport from "passport";
import cookieParser from 'cookie-parser'
import cors from "cors";
import { createProduct, deleteProduct, editProduct, editProductImages, getAllProducts, getDealsProducts, getFeauturedProducts, getNewProducts, getProductById, getProductSearch, getProductSearchSuggestions, getWishlistProducts, upload, uploadProductPhotos } from "./src/controllers/Products";
import { countOrdersProductsUsers, countReviewers, createOrder, editOrderStatus, getAllDistinctOrders, getAllOrders, getAllOrdersByUser, getAllProductsByOrderId, rateProduct } from "./src/controllers/Orders";

const app: Application = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(cookieParser())
app.use(cors({ credentials:true, origin:'http://localhost:5173' }));
// Serve uploaded files from the 'uploads' directory
app.use('/uploads', express.static('./src/uploads'));

import('./src/middlewares/passport')

app.get('/token', refreshToken);
app.get("/protected", passport.authenticate("jwt",{session: false}), testAccessProtectedRoute);

app.post("/register", createUser);
app.post("/login", logInUser);
app.delete("/logout", logOut);
app.get("/users", getAllUsers);
app.get("/user/:id", getUserById);
app.get("/user/username/:username", getUserByUsername);
app.patch("/edit/user/:id", editUser);
app.patch("/delete/user/:id", deleteUser);

app.post("/upload/avatar", upload.single("avatar"), uploadAvatar);
app.patch("/wishlist/user/:username/:productId", addUserWishlistByUsername);
app.get("/products/wishlist/user/:username", getUserWishlistByUsername);

app.post("/upload", upload.array("images", 3), createProduct);
app.get("/products", getAllProducts);
app.get("/product/:id", getProductById);
app.patch("/edit/product/:id", editProduct);
app.patch("/edit/images/:id", upload.array("images", 3), editProductImages);
app.patch("/delete/product/:id", deleteProduct);
app.get("/search/suggestions", getProductSearchSuggestions);
app.get("/search", getProductSearch);
app.post("/wishlist/products", getWishlistProducts);
app.get("/featured/products", getFeauturedProducts);
app.get("/new/products", getNewProducts);
app.get("/deals/products", getDealsProducts);
app.patch("/ratings/orders/:orderId/products/:productId", rateProduct);
app.get("/ratings/products/:productId", countReviewers);

app.post("/username/:username/cart", addToUserCart);


app.post("/create/order", createOrder);
app.get("/orders/username/:username", getAllOrdersByUser);
app.get("/orders/id/:orderId", getAllProductsByOrderId);
app.get("/orders/all", getAllOrders);
app.get("/orders/unique", getAllDistinctOrders);
app.patch("/order/edit/status/:id", editOrderStatus);

app.get("/all", countOrdersProductsUsers)


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
