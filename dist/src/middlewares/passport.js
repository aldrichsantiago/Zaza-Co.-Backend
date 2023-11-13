"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_jwt_1 = __importDefault(require("passport-jwt"));
const schema_1 = require("../db/schema");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const ExtractJwt = passport_jwt_1.default.ExtractJwt;
const JwtStrategy = passport_jwt_1.default.Strategy;
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCESS_TOKEN_SECRET
};
passport_1.default.use(new JwtStrategy(opts, async function (jwt_payload, done) {
    console.log(jwt_payload);
    const user = await db_1.db.select({ id: schema_1.users.id, username: schema_1.users.username }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, jwt_payload.id)).limit(1)
        .then((user) => {
        console.log(user);
        return done(null, user);
    })
        .catch((error) => {
        console.log(error);
        return done(error, false);
    }).finally(() => {
        console.log("Promise Completed");
    });
}));
