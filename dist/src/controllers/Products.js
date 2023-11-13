"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDealsProducts = exports.getNewProducts = exports.getFeauturedProducts = exports.getWishlistProducts = exports.getProductSearch = exports.getProductSearchSuggestions = exports.getProductById = exports.getAllProducts = exports.deleteProduct = exports.editProductImages = exports.editProduct = exports.createProduct = exports.uploadProductPhotos = exports.upload = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const multer_1 = __importDefault(require("multer"));
function removeWhitespace(str) {
    return str?.split(' ').filter(Boolean).join('');
}
// Define storage configuration for Multer
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/'); // Set the directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.' + removeWhitespace(file.originalname)); // Rename the file to prevent conflicts
    },
});
exports.upload = (0, multer_1.default)({ storage: storage });
const uploadProductPhotos = async (req, res) => {
    const { firstName, lastName, email, username, password, confirmPassword } = req.body;
    console.log(req.body);
    if (!req.files) {
        return res.status(400).send('No file uploaded.');
    }
    res.status(200);
};
exports.uploadProductPhotos = uploadProductPhotos;
const createProduct = async (req, res) => {
    try {
        const body = JSON.parse(JSON.stringify(req.body));
        const { name, description, price, stocks, category } = JSON.parse(body.data);
        console.log(body.data);
        const uploadedFiles = req.files;
        let images = [];
        for (const file of [...uploadedFiles]) {
            images.push(file.filename);
            console.log(file.filename);
        }
        console.log(images);
        if (!req.files) {
            console.log(req.files);
            return res.status(400).send('No file uploaded.');
        }
        console.log(req.body);
        console.log(req.files);
        await db_1.db.insert(schema_1.products).values({
            name,
            description,
            price: price,
            stocks: stocks,
            category,
            quantitySold: 0,
            ratings: 0,
            images,
            isDeleted: false,
        }).catch((error) => console.log(error));
        return res.status(200).json({ success: true, name, description, price, stocks, category, });
    }
    catch (error) {
        console.log(error);
    }
};
exports.createProduct = createProduct;
const editProduct = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, description, price, stocks, category } = req.body;
        const product = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id)).limit(1);
        if (!product[0])
            return res.sendStatus(204);
        await db_1.db.update(schema_1.products).set({
            name: name,
            description: description,
            price: price,
            stocks: stocks,
            category: category
        }).where((0, drizzle_orm_1.eq)(schema_1.products.id, product[0].id));
    }
    catch (error) {
        console.log(error);
    }
    res.status(201).json({ success: true, message: "Product details updated" });
};
exports.editProduct = editProduct;
const editProductImages = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { images } = JSON.parse(req.body.data);
        const uploadedFiles = req.files;
        const newImageArr = [...images];
        console.log(req.files);
        for (const file of [...uploadedFiles]) {
            newImageArr.push(file.filename);
            console.log(file.filename);
        }
        if (images.length > 3) {
            return res.status(400).json({ message: 'Product Images cannot be more than three.' });
        }
        if (newImageArr.length > 3) {
            return res.status(400).json({ message: 'Product Images cannot be more than three.' });
        }
        if (!req.files) {
            console.log(req.files);
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        console.log(newImageArr);
        const product = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id)).limit(1);
        if (!product[0])
            return res.sendStatus(204);
        await db_1.db.update(schema_1.products).set({
            images: newImageArr
        }).where((0, drizzle_orm_1.eq)(schema_1.products.id, product[0].id));
        return res.status(201).json({ success: true, message: "Product Images updated" });
    }
    catch (error) {
        console.log(error);
        return res.status(300).json({ success: false, message: "Updating Product Images Error" });
    }
};
exports.editProductImages = editProductImages;
const deleteProduct = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const product = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id)).limit(1);
        if (!product[0])
            return res.sendStatus(204);
        await db_1.db.update(schema_1.products).set({ isDeleted: true }).where((0, drizzle_orm_1.eq)(schema_1.products.id, product[0].id));
        return res.sendStatus(200);
    }
    catch (error) {
        console.log(error);
        return res.sendStatus(400);
    }
};
exports.deleteProduct = deleteProduct;
const getAllProducts = async (req, res) => {
    const result = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.isDeleted, false));
    return res.json(result);
};
exports.getAllProducts = getAllProducts;
const getProductById = async (req, res) => {
    try {
        let id = Number(req.params.id);
        const result = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.id, id), (0, drizzle_orm_1.eq)(schema_1.products.isDeleted, false))).limit(1);
        return res.json(result);
    }
    catch (error) {
        console.log(error + "  <---- THIS IS THE ERROR");
        return;
    }
};
exports.getProductById = getProductById;
const getProductSearchSuggestions = async (req, res) => {
    try {
        let nameQuery = req.query.search?.toString();
        console.log(nameQuery);
        const queryStatement = drizzle_orm_1.sql.raw(`SELECT * FROM products WHERE products.name LIKE '%${nameQuery}%' AND products.is_deleted = '0' limit 4`);
        const result = await db_1.db.execute(queryStatement);
        return res.json(result);
    }
    catch (error) {
        console.log(error + " getProductSearchSuggestionsError");
        return;
    }
};
exports.getProductSearchSuggestions = getProductSearchSuggestions;
const getProductSearch = async (req, res) => {
    try {
        let nameQuery = req.query.search?.toString();
        console.log(nameQuery);
        const queryStatement = drizzle_orm_1.sql.raw(`select * from products where products.name LIKE '%${nameQuery}%'`);
        const result = await db_1.db.execute(queryStatement);
        return res.json(result);
    }
    catch (error) {
        console.log(error + " getProductSearchSuggestionsError");
        return;
    }
};
exports.getProductSearch = getProductSearch;
const getWishlistProducts = async (req, res) => {
    try {
        const { wishlist } = req.body;
        console.log(wishlist);
        if (!wishlist) {
            return res.status(400).json({ success: false, message: "There are no wishlist" });
        }
        const finalSql = (0, drizzle_orm_1.sql) `select * from products`;
        finalSql.append((0, drizzle_orm_1.sql) ` where `);
        for (let i = 0; i < wishlist.length; i++) {
            finalSql.append((0, drizzle_orm_1.sql) `id = ${wishlist[i]}`);
            if (i === wishlist.length - 1)
                continue;
            finalSql.append((0, drizzle_orm_1.sql) ` or `);
        }
        const result = await db_1.db.execute(finalSql);
        return res.json(result);
    }
    catch (error) {
        console.log(error + " getWishlistProductsByUsername");
        return;
    }
};
exports.getWishlistProducts = getWishlistProducts;
const getFeauturedProducts = async (req, res) => {
    try {
        const result = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.isDeleted, false)).orderBy((0, drizzle_orm_1.desc)(schema_1.products.quantitySold)).limit(16);
        return res.status(200).json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(400).json({ message: "There was a server error" });
    }
};
exports.getFeauturedProducts = getFeauturedProducts;
const getNewProducts = async (req, res) => {
    try {
        const result = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.isDeleted, false)).orderBy((0, drizzle_orm_1.desc)(schema_1.products.createdAt));
        return res.status(200).json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(400).json({ message: "There was a server error" });
    }
};
exports.getNewProducts = getNewProducts;
const getDealsProducts = async (req, res) => {
    try {
        const result = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.isDeleted, false)).orderBy((0, drizzle_orm_1.asc)(schema_1.products.price));
        return res.status(200).json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(400).json({ message: "There was a server error" });
    }
};
exports.getDealsProducts = getDealsProducts;
