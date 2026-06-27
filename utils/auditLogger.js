const AuditLog = require("../models/AuditLog");

/**
 * Create an audit log entry for tracking admin actions
 * @param {Object} data - Audit log data
 * @param {string} data.adminId - Admin performing the action
 * @param {string} data.action - Action performed (LOGIN, REGISTER, UPDATE_CONTACT, etc.)
 * @param {string} data.resource - Resource affected (admin, contact, etc.)
 * @param {string} data.details - Detailed description of the action
 * @param {string} data.status - Status of the action (success, failure)
 * @param {string} [data.ipAddress] - IP address of the request
 */
const createAuditLog = async (data) => {
    try {
        await AuditLog.create({
            adminId: data.adminId,
            action: data.action,
            resource: data.resource,
            details: data.details,
            status: data.status || "success",
            ipAddress: data.ipAddress || "unknown",
            timestamp: new Date(),
        });
    } catch (error) {
        console.log("Failed to create audit log:", error);
        // Don't throw error to avoid disrupting main operations
    }
};

/**
 * Retrieve audit logs with pagination and filters
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Records per page (default: 20)
 */
const getAuditLogs = async (filters = {}, page = 1, limit = 20) => {
    try {
        const skip = (page - 1) * limit;

        const query = {};
        if (filters.adminId) query.adminId = filters.adminId;
        if (filters.action) query.action = filters.action;
        if (filters.status) query.status = filters.status;

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate("adminId", "name email");

        const total = await AuditLog.countDocuments(query);

        return {
            logs,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
        };
    } catch (error) {
        console.log("Failed to fetch audit logs:", error);
        return { logs: [], total: 0, pages: 0, currentPage: page };
    }
};

module.exports = {
    createAuditLog,
    getAuditLogs,
};
