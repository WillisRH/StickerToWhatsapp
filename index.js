const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const { Client, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// WhatsApp Bot Setup
const bot = new Client();

bot.on("qr", (qr) => {
  qrcode.generate(qr, { small: true }); // Display QR code in the console
});

bot.on("ready", () => {
  console.log("WhatsApp Bot is ready!");
});

bot.on("message_create", async (message) => {
  if (message.body === "!stickercreate") {
    if (message.hasMedia) {
      const media = await message.downloadMedia();

      if (media.mimetype.startsWith("image/")) {
        const sticker = new MessageMedia(media.mimetype, media.data.toString("base64"));
        if(message.fromMe) {
          console.log('p, from me!')
          await bot.sendMessage(message.to, sticker, { sendMediaAsSticker: true });
          await bot.sendMessage(message.to, "Enjoy your sticker!");
          return;
        }

        console.log("p")
        await bot.sendMessage(message.from, sticker, { sendMediaAsSticker: true });
        await bot.sendMessage(message.from, "Enjoy your sticker!");
      } else {
        await message.reply("Please send an image file.");
      }
    } else {
      await message.reply("Please send an image file.");
    }

  }
});

// bot.on("message_create", async (message) => {
//   if (message.body === "!stickercreate") {
//     if (message.hasMedia) {
//       const media = await message.downloadMedia();

//       if (media.mimetype.startsWith("image/")) {
//         const sticker = new MessageMedia(media.mimetype, media.data.toString("base64"));

//         await message.reply(sticker, { sendMediaAsSticker: true });
//       } else {
//         await message.reply("Please send an image file.");
//       }
//     } else {
//       await message.reply("Please send an image file.");
//     }
//     console.log("p")
//   }
// });

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/sendSticker", upload.single("file"), async (req, res) => {
  try {
    // Get the file and number from the form
    const file = req.file;
    const number = req.body.number;

    // Check if the file is an image
    if (!file || !file.mimetype.startsWith("image/")) {
      res.send("Please upload an image file.");
      return;
    }

    // Check if the message contains the specified command
    // Create a MessageMedia object from the file path
    const sticker = MessageMedia.fromFilePath(file.path);

    // Send the sticker to the user via WhatsApp
    const chatId = `${number}@c.us`;
    await bot.sendMessage(chatId, sticker, { sendMediaAsSticker: true });

    // Remove the file after sending the sticker
    fs.unlinkSync(file.path);

    // Success!
    res.send("Sticker sent successfully.");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred.");
  }
});

// Start the WhatsApp bot
bot.initialize();

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
