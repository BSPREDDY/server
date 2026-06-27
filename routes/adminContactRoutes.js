// const express = require("express");
// const router = express.Router();
// const authMiddleware = require("../middleware/auth");
// const {
//     getAllContacts,
//     getContactById,
//     updateContactStatus,
//     markAsSpam,
//     deleteContact,
//     getStats,
// } = require("../controllers/adminContactController");

// router.get("/", authMiddleware, getAllContacts);
// router.get("/stats", authMiddleware, getStats);
// router.get("/:id", authMiddleware, getContactById);
// router.put("/:id/status", authMiddleware, updateContactStatus);
// router.put("/:id/spam", authMiddleware, markAsSpam);
// router.delete("/:id", authMiddleware, deleteContact);

// module.exports = router;

const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/auth");

const {
    getAllContacts,
    getContactById,
    updateContactStatus,
    markAsSpam,
    deleteContact,
    getStats,
} = require("../controllers/adminContactController");

router.get("/", authMiddleware, getAllContacts);
router.get("/stats", authMiddleware, getStats);
router.get("/:id", authMiddleware, getContactById);
router.put("/:id/status", authMiddleware, updateContactStatus);
router.put("/:id/spam", authMiddleware, markAsSpam);
router.delete("/:id", authMiddleware, deleteContact);

module.exports = router;