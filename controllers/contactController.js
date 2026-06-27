const Contact =
    require("../models/Contact");

const nodemailer =
    require("nodemailer");

const sendMessage = async (
    req,
    res
) => {
    try {

        const {
            name,
            email,
            message,
        } = req.body;

        if (
            !name ||
            !email ||
            !message
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "All fields are required",
            });
        }

        const lead =
            await Contact.create({
                name,
                email,
                message,
            });

        // Only send emails if configuration is available
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter =
                    nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user:
                                process.env.EMAIL_USER,
                            pass:
                                process.env.EMAIL_PASS,
                        },
                    });

                // Send email to admin
                await transporter.sendMail({
                    from:
                        process.env.EMAIL_USER,

                    to:
                        "surya@bhavanatss.com",

                    subject:
                        "New Website Inquiry",

                    html: `
            <h2>New Lead Received</h2>

            <p><b>Name:</b> ${name}</p>

            <p><b>Email:</b> ${email}</p>

            <p><b>Message:</b> ${message}</p>
          `,
                });

                // Send confirmation email to user
                await transporter.sendMail({
                    from:
                        process.env.EMAIL_USER,

                    to: email,

                    subject:
                        "Thank You For Contacting Bhavana Technology and software solutions",

                    html: `
          <div style="font-family:Arial; padding:20px;">
            <h2>Thank You</h2>
            <p>We have received your message.</p>
            <p>Our team will contact you shortly.</p>
            <br>
            <b>Bhavana Technology and software solutions</b>
          </div>
          `,
                });

                console.log('[v0] Emails sent successfully');
            } catch (emailError) {
                console.error('[v0] Email sending failed:', emailError.message);
                // Don't fail the request if email fails - contact was still saved
            }
        } else {
            console.log('[v0] Email credentials not configured - skipping email sending');
        }

        res.status(201).json({
            success: true,
            message:
                "Message Sent Successfully",
            lead,
        });

    } catch (error) {
        console.error('[v0] Email Error:', error.message);
        console.error('[v0] Email Config - USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
        console.error('[v0] Email Config - PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');

        res.status(500).json({
            success: false,
            message: error.message || "Server Error",
        });
    }
};

module.exports = {
    sendMessage,
};
