const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },
        action: {
            type: String,
            required: true,
            enum: [
                "LOGIN",
                "LOGOUT",
                "LOGIN_FAILED",
                "REGISTER",
                "CREATE_CONTACT",
                "UPDATE_CONTACT",
                "DELETE_CONTACT",
                "VIEW_CONTACT",
                "UPDATE_SETTINGS",
                "EXPORT_DATA",
                "IMPORT_DATA",
            ],
        },
        resource: {
            type: String,
            required: true,
            enum: ["admin", "contact", "settings", "system"],
        },
        details: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["success", "failure"],
            default: "success",
        },
        ipAddress: {
            type: String,
            default: "unknown",
        },
        userAgent: {
            type: String,
            default: null,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        collection: "auditlogs",
        timestamps: false,
    }
);

// Index for efficient querying
AuditLogSchema.index({ adminId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
