"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToUserCart = exports.uploadAvatar = exports.addUserWishlistByUsername = exports.getUserWishlistByUsername = exports.testAccessProtectedRoute = exports.getUserByUsername = exports.getUserById = exports.getAllUsers = exports.refreshToken = exports.logOut = exports.logInUser = exports.deleteUser = exports.editUser = exports.createUser = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createUser = async (req, res) => {
    const { firstName, lastName, email, username, password, confirmPassword } = req.body;
    const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username)).limit(1);
    //VAlIDATE
    if (!firstName) {
        return res.status(400).json({ message: "First name doesn't exist" });
    }
    if (!lastName) {
        return res.status(400).json({ message: "Last name doesn't exist" });
    }
    if (!username) {
        return res.status(400).json({ message: "Username is needed" });
    }
    if (user[0]?.username === username) {
        return res.status(400).json({ message: "Username already exists" });
    }
    if (!email) {
        return res.status(400).json({ message: "Email doesn't exist" });
    }
    if (!password) {
        return res.status(400).json({ message: "Password doesn't exist" });
    }
    if (!confirmPassword) {
        return res.status(400).json({ message: "Confirm Password doesn't exist" });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Password does not match" });
    }
    const salt = bcrypt_1.default.genSaltSync(10);
    const hashedPassword = await bcrypt_1.default.hash(password, salt);
    await db_1.db.insert(schema_1.users).values({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        role: "client",
        refreshToken: null,
        isActivated: false,
        isDeleted: false
    }).catch(error => console.log(error));
    return res.json({ status: 200 });
};
exports.createUser = createUser;
const editUser = async (req, res) => {
    const { username, firstName, lastName, email, role } = req.body;
    const id = Number(req.params.id);
    const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).limit(1);
    console.log(user[0]);
    //Finding user with the id
    if (user[0] === undefined) {
        return res.status(400).json({ message: "No user with that id" });
    }
    await db_1.db.update(schema_1.users).set({
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: role
    }).where((0, drizzle_orm_1.eq)(schema_1.users.id, user[0].id));
    console.log(id, user[0].id);
    res.status(201).json({ success: true, message: "User details updated" });
};
exports.editUser = editUser;
const deleteUser = async (req, res) => {
    const id = Number(req.params.id);
    const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).limit(1);
    console.log(user[0]);
    if (!user[0])
        return res.sendStatus(204);
    await db_1.db.update(schema_1.users).set({ isDeleted: true }).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    return res.sendStatus(201);
};
exports.deleteUser = deleteUser;
const logInUser = async (req, res) => {
    const { username, password } = req.body;
    const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username)).limit(1);
    console.log(user[0]);
    //Finding user with the username
    if (user[0] === undefined) {
        return res.status(400).json({ message: "No user with that username" });
    }
    //Password Matching
    const isValid = await bcrypt_1.default.compare(password, user[0].password ? user[0].password : "");
    if (!isValid) {
        return res.status(400).json({ message: "Wrong Password" });
    }
    const payload = {
        id: user[0].id,
        user: user[0].username,
        role: user[0].role
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15s" });
    const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });
    //UPDATE THE REFRESH TOKEN COLUMN ON DATABASE
    await db_1.db.update(schema_1.users).set({ refreshToken: refreshToken }).where((0, drizzle_orm_1.eq)(schema_1.users.id, user[0].id));
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.status(200).json({
        token: "Bearer " + accessToken,
        role: user[0].role,
        username: user[0].username,
        cart: user[0].cart,
        wishlist: user[0].wishlist
    });
};
exports.logInUser = logInUser;
const logOut = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
        return res.sendStatus(204);
    const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.refreshToken, refreshToken)).limit(1);
    console.log(user[0]);
    if (!user[0])
        return res.sendStatus(204);
    await db_1.db.update(schema_1.users).set({ refreshToken: null }).where((0, drizzle_orm_1.eq)(schema_1.users.id, user[0].id));
    res.clearCookie('refreshToken');
    console.log(user[0].username + " logged out");
    return res.sendStatus(200);
};
exports.logOut = logOut;
const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return res.sendStatus(401);
        const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.refreshToken, refreshToken)).limit(1);
        if (!user[0])
            return res.sendStatus(403);
        jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error)
                return res.sendStatus(403);
            const payload = {
                id: user[0].id,
                username: user[0].username,
                role: user[0].role
            };
            const accessToken = jsonwebtoken_1.default.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
            res.json({ accessToken,
                role: user[0].role,
                username: user[0].username,
                cart: user[0].cart,
                wishlist: user[0].wishlist
            });
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.refreshToken = refreshToken;
const getAllUsers = async (req, res) => {
    const result = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.isDeleted, false));
    return res.json(result);
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        let id = Number(req.params.id);
        const result = await db_1.db.select({
            firstName: schema_1.users.firstName,
            lastName: schema_1.users.lastName,
            username: schema_1.users.username,
            email: schema_1.users.email,
        }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return res.json(result);
    }
    catch (error) {
        console.log(error + "  <---- THIS IS THE ERROR");
        return;
    }
};
exports.getUserById = getUserById;
const getUserByUsername = async (req, res) => {
    let username = req.params.username;
    try {
        const result = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        return res.json(result);
    }
    catch (error) {
        console.log(error + "  <---- THIS IS THE ERROR");
        return;
    }
};
exports.getUserByUsername = getUserByUsername;
const testAccessProtectedRoute = async (req, res) => {
    return res.status(200).send({
        success: true,
        user: req.user
    });
};
exports.testAccessProtectedRoute = testAccessProtectedRoute;
const getUserWishlistByUsername = async (req, res) => {
    try {
        let username = req.params.username;
        const usersWishlist = await db_1.db.select({ wishlist: schema_1.users.wishlist }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        try {
            const wishlist = usersWishlist[0].wishlist;
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
            console.log(error + " getUserWishlistByUsername");
            return;
        }
    }
    catch (error) {
        console.log(error);
        return;
    }
};
exports.getUserWishlistByUsername = getUserWishlistByUsername;
const addUserWishlistByUsername = async (req, res) => {
    try {
        let username = req.params.username;
        let productId = Number(req.params.productId);
        const user = await db_1.db.select({
            wishlist: schema_1.users.wishlist,
            id: schema_1.users.id,
            username: schema_1.users.username
        }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username)).limit(1);
        if (!user[0]) {
            return res.status(400).json({
                success: "false",
                message: "No user with that username"
            });
        }
        console.log("wishlist: " + user[0].wishlist);
        let wishlist = user[0].wishlist;
        if (wishlist === null) {
            wishlist = [];
            wishlist.push(productId);
        }
        else {
            let prodID = [...wishlist].find(w => w === productId);
            if (prodID === undefined) {
                wishlist.push(productId);
            }
            else {
                wishlist = wishlist.filter((currVal) => { return currVal !== productId; });
                console.log(wishlist + " left");
                await db_1.db.update(schema_1.users).set({ wishlist }).where((0, drizzle_orm_1.eq)(schema_1.users.id, user[0].id));
                return res.status(201).json({
                    success: true,
                    message: "Product is removed from wishlist"
                });
            }
        }
        await db_1.db.update(schema_1.users).set({ wishlist }).where((0, drizzle_orm_1.eq)(schema_1.users.id, user[0].id));
        return res.status(201).json({
            success: true,
            message: "Product has been scuccesfully added to wishlist"
        });
    }
    catch (error) {
        console.log(error + "  <---- THIS IS THE ERROR");
        return;
    }
};
exports.addUserWishlistByUsername = addUserWishlistByUsername;
const uploadAvatar = async (req, res) => {
    try {
        const uploadedFile = req.file;
        const { username, firstName, lastName, email } = JSON.parse(req.body.data);
        console.log(req.body.data);
        console.log(uploadedFile);
        console.log(username);
        console.log(firstName);
        console.log(lastName);
        console.log(email);
        if (uploadedFile) {
            await db_1.db.update(schema_1.users).set({
                avatarImage: uploadedFile.filename,
            }).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        }
        if (firstName) {
            await db_1.db.update(schema_1.users).set({
                firstName: firstName,
            }).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        }
        if (lastName) {
            await db_1.db.update(schema_1.users).set({
                lastName: lastName,
            }).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        }
        if (email) {
            await db_1.db.update(schema_1.users).set({
                email: email,
            }).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        }
        return res.status(200).json({ success: true, message: "Profile Updated" });
    }
    catch (error) {
        console.log(error);
    }
    // .json({success: true, name, description, price, stocks, category,})
};
exports.uploadAvatar = uploadAvatar;
const addToUserCart = async (req, res) => {
    const username = req.params.username;
    const { cart } = req.body;
    const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username)).limit(1);
    if (!user[0]) {
        return res.status(400).json({ message: "Username doesn't exist" });
    }
    await db_1.db.update(schema_1.users).set({
        cart: cart,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.users.username, username))
        .catch(error => console.log(error));
    return res.status(200).json({ message: "Success" });
};
exports.addToUserCart = addToUserCart;
