
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs"); // Required for reading files
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 5000;

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Initialize Gemini API
const genAI = new GoogleGenerativeAI("A*******************************"); 

// ✅ Configure Multer for File Uploads
const storage = multer.diskStorage({
    destination: "uploads/", // Save uploaded files in 'uploads' folder
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
    },
});

const upload = multer({ storage });

// ✅ Route: Handle Image Upload & Caption Generation..............................................

app.post("/generate-caption", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        const imagePath = req.file.path;

        // ✅ Convert Image to Base64 (Required for Gemini API)
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString("base64"); 

        console.log("Processing Image for Caption...");

        // ✅ Gemini API Request
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: req.file.mimetype, // Example: image/jpeg
                                data: base64Image, // Image content in Base64 format
                            },
                        },
                        {
                            text: "Generate a 10 instagram captions for this image and do not add any pro tip  at the end.", // 💡 Explicit instruction!
                        },
                    ],
                },
            ],
        });
        

        console.log("Gemini API Response:", result);

        // ✅ Extract Caption from API Response
        const caption = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No caption generated";

        res.json({ caption });

    } catch (error) {
        console.error("Error generating caption:", error);
        res.status(500).json({ error: "Failed to generate caption", details: error.message });
    }
});

// END OF DESCRIPTION GENERATION.*********************************************************************************

// ✅ Serve Uploaded Files
app.use("/uploads", express.static("uploads"));

// ✅ Start Server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
