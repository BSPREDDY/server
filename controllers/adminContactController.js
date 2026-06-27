const Contact = require("../models/Contact");

const getAllContacts = async (req, res) => {
    try {
        const { status, isSpam, page = 1, limit = 10, search } = req.query;

        let query = {};

        if (status) query.status = status;
        if (isSpam !== undefined) query.isSpam = isSpam === "true";

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Contact.countDocuments(query);
        const contacts = await Contact.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.status(200).json({
            success: true,
            contacts,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

const getContactById = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findById(id);
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found",
            });
        }

        res.status(200).json({
            success: true,
            contact,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["new", "read", "replied"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        const contact = await Contact.findByIdAndUpdate(
            id,
            { status },
            { returnDocument: 'after' }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Contact updated successfully",
            contact,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

const markAsSpam = async (req, res) => {
    try {
        const { id } = req.params;
        const { isSpam } = req.body;

        const contact = await Contact.findByIdAndUpdate(
            id,
            { isSpam },
            { returnDocument: 'after' }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Contact updated successfully",
            contact,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findByIdAndDelete(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Contact deleted successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

const getStats = async (req, res) => {
    try {
        const total = await Contact.countDocuments();
        const newCount = await Contact.countDocuments({ status: "new" });
        const readCount = await Contact.countDocuments({ status: "read" });
        const repliedCount = await Contact.countDocuments({ status: "replied" });
        const spamCount = await Contact.countDocuments({ isSpam: true });

        res.status(200).json({
            success: true,
            stats: {
                total,
                new: newCount,
                read: readCount,
                replied: repliedCount,
                spam: spamCount,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

module.exports = {
    getAllContacts,
    getContactById,
    updateContactStatus,
    markAsSpam,
    deleteContact,
    getStats,
};
