// const Admin = require("../models/Admin");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const register = async (req, res) => {
//     try {
//         const { email, password, name, role } = req.body;

//         if (!email || !password || !name) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required",
//             });
//         }

//         const existingAdmin = await Admin.findOne({ email });
//         if (existingAdmin) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Admin already exists",
//             });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const admin = await Admin.create({
//             email,
//             password: hashedPassword,
//             name,
//             role: role || "admin",
//         });

//         const token = jwt.sign(
//             { id: admin._id, email: admin.email, role: admin.role },
//             process.env.JWT_SECRET,
//             { expiresIn: "7d" }
//         );

//         res.status(201).json({
//             success: true,
//             message: "Admin registered successfully",
//             admin: {
//                 id: admin._id,
//                 email: admin.email,
//                 name: admin.name,
//                 role: admin.role,
//             },
//             token,
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             success: false,
//             message: "Server Error",
//         });
//     }
// };

// const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Email and password are required",
//             });
//         }

//         const admin = await Admin.findOne({ email });
//         if (!admin) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid credentials",
//             });
//         }

//         const isPasswordValid = await bcrypt.compare(password, admin.password);
//         if (!isPasswordValid) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid credentials",
//             });
//         }

//         if (!admin.isActive) {
//             return res.status(403).json({
//                 success: false,
//                 message: "Admin account is inactive",
//             });
//         }

//         const token = jwt.sign(
//             { id: admin._id, email: admin.email, role: admin.role },
//             process.env.JWT_SECRET,
//             { expiresIn: "7d" }
//         );

//         res.status(200).json({
//             success: true,
//             message: "Login successful",
//             admin: {
//                 id: admin._id,
//                 email: admin.email,
//                 name: admin.name,
//                 role: admin.role,
//             },
//             token,
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             success: false,
//             message: "Server Error",
//         });
//     }
// };

// const verifyToken = async (req, res) => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1];

//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: "No token provided",
//             });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const admin = await Admin.findById(decoded.id).select("-password");

//         res.status(200).json({
//             success: true,
//             admin,
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(401).json({
//             success: false,
//             message: "Invalid token",
//         });
//     }
// };

// module.exports = {
//     register,
//     login,
//     verifyToken,
// };




const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createAuditLog } = require("../utils/auditLogger");

// Helper function to generate tokens
const generateTokens = (adminId, email, role) => {
    const accessToken = jwt.sign(
        { id: adminId, email, role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
        { id: adminId, email, role },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
};

const register = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await Admin.create({
            email,
            password: hashedPassword,
            name,
            role: role || "admin",
            lastLogin: new Date(),
        });

        const { accessToken, refreshToken } = generateTokens(
            admin._id,
            admin.email,
            admin.role
        );

        // Store refresh token
        admin.refreshToken = refreshToken;
        await admin.save();

        // Audit log
        await createAuditLog({
            adminId: admin._id,
            action: "REGISTER",
            resource: "admin",
            details: `Admin registered: ${email}`,
            status: "success",
        });

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            await createAuditLog({
                adminId: null,
                action: "LOGIN_FAILED",
                resource: "admin",
                details: `Failed login attempt for email: ${email}`,
                status: "failure",
                ipAddress: req.ip,
            });

            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            await createAuditLog({
                adminId: admin._id,
                action: "LOGIN_FAILED",
                resource: "admin",
                details: `Failed login attempt for admin: ${admin.email}`,
                status: "failure",
                ipAddress: req.ip,
            });

            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: "Admin account is inactive",
            });
        }

        const { accessToken, refreshToken } = generateTokens(
            admin._id,
            admin.email,
            admin.role
        );

        // Update last login and store refresh token
        admin.lastLogin = new Date();
        admin.refreshToken = refreshToken;
        await admin.save();

        // Audit log
        await createAuditLog({
            adminId: admin._id,
            action: "LOGIN",
            resource: "admin",
            details: `Admin logged in: ${email}`,
            status: "success",
            ipAddress: req.ip,
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

const verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id).select("-password -refreshToken");

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin not found",
            });
        }

        res.status(200).json({
            success: true,
            admin,
        });
    } catch (error) {
        console.log(error);
        res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};

const refreshTokenEndpoint = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );

        const admin = await Admin.findById(decoded.id);

        if (!admin || admin.refreshToken !== refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            generateTokens(admin._id, admin.email, admin.role);

        admin.refreshToken = newRefreshToken;
        await admin.save();

        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.log(error);
        res.status(401).json({
            success: false,
            message: "Invalid refresh token",
        });
    }
};

const logout = async (req, res) => {
    try {
        const { id } = req.admin;

        await Admin.findByIdAndUpdate(id, { refreshToken: null });

        await createAuditLog({
            adminId: id,
            action: "LOGOUT",
            resource: "admin",
            details: `Admin logged out`,
            status: "success",
        });

        res.status(200).json({
            success: true,
            message: "Logout successful",
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
    register,
    login,
    verifyToken,
    refreshTokenEndpoint,
    logout,
};
