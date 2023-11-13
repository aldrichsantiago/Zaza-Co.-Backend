"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: __dirname + '/.env' });
const Users_1 = require("./src/controllers/Users");
const passport_1 = __importDefault(require("passport"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const Products_1 = require("./src/controllers/Products");
const Orders_1 = require("./src/controllers/Orders");
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(passport_1.default.initialize());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({ credentials: true, origin: 'http://localhost:5173' }));
// Serve uploaded files from the 'uploads' directory
app.use('/uploads', express_1.default.static('./src/uploads'));
Promise.resolve().then(() => __importStar(require('./src/middlewares/passport')));
app.get('/token', Users_1.refreshToken);
app.get("/protected", passport_1.default.authenticate("jwt", { session: false }), Users_1.testAccessProtectedRoute);
app.post("/register", Users_1.createUser);
app.post("/login", Users_1.logInUser);
app.delete("/logout", Users_1.logOut);
app.get("/users", Users_1.getAllUsers);
app.get("/user/:id", Users_1.getUserById);
app.get("/user/username/:username", Users_1.getUserByUsername);
app.patch("/edit/user/:id", Users_1.editUser);
app.patch("/delete/user/:id", Users_1.deleteUser);
app.post("/upload/avatar", Products_1.upload.single("avatar"), Users_1.uploadAvatar);
app.patch("/wishlist/user/:username/:productId", Users_1.addUserWishlistByUsername);
app.get("/products/wishlist/user/:username", Users_1.getUserWishlistByUsername);
app.post("/upload", Products_1.upload.array("images", 3), Products_1.createProduct);
app.get("/products", Products_1.getAllProducts);
app.get("/product/:id", Products_1.getProductById);
app.patch("/edit/product/:id", Products_1.editProduct);
app.patch("/edit/images/:id", Products_1.upload.array("images", 3), Products_1.editProductImages);
app.patch("/delete/product/:id", Products_1.deleteProduct);
app.get("/search/suggestions", Products_1.getProductSearchSuggestions);
app.get("/search", Products_1.getProductSearch);
app.post("/wishlist/products", Products_1.getWishlistProducts);
app.get("/featured/products", Products_1.getFeauturedProducts);
app.get("/new/products", Products_1.getNewProducts);
app.get("/deals/products", Products_1.getDealsProducts);
app.patch("/ratings/orders/:orderId/products/:productId", Orders_1.rateProduct);
app.get("/ratings/products/:productId", Orders_1.countReviewers);
app.post("/username/:username/cart", Users_1.addToUserCart);
app.post("/create/order", Orders_1.createOrder);
app.get("/orders/username/:username", Orders_1.getAllOrdersByUser);
app.get("/orders/id/:orderId", Orders_1.getAllProductsByOrderId);
app.get("/orders/all", Orders_1.getAllOrders);
app.get("/orders/unique", Orders_1.getAllDistinctOrders);
app.patch("/order/edit/status/:id", Orders_1.editOrderStatus);
app.get("/all", Orders_1.countOrdersProductsUsers);
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
