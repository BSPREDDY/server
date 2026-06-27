// const mongoose = require("mongoose");

// const AdminSchema = new mongoose.Schema(
//     {
//         email: {
//             type: String,
//             required: true,
//             unique: true,
//         },
//         password: {
//             type: String,
//             required: true,
//         },
//         name: {
//             type: String,
//             required: true,
//         },
//         role: {
//             type: String,
//             enum: ["admin", "manager"],
//             default: "admin",
//         },
//         isActive: {
//             type: Boolean,
//             default: true,
//         },
//     },
//     {
//         timestamps: true,
//     }
// );

// module.exports = mongoose.model("Admin", AdminSchema);


const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["admin", "manager", "super-admin"],
            default: "admin",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        refreshToken: {
            type: String,
            default: null,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        loginAttempts: {
            type: Number,
            default: 0,
        },
        lockedUntil: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Admin", AdminSchema);
