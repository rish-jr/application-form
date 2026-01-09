const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const Application = require("./models/Application");

const app = express();

/* ================= UPLOAD FOLDER ================= */
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ================= MIDDLEWARE ================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static(uploadDir));

/* ================= MONGODB ================= */
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/applicationDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

/* ================= MULTER ================= */
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* ================= PDF SECTION TITLE ================= */
function sectionTitle(doc, title) {
  doc
    .moveDown()
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(title)
    .moveDown(0.5)
    .font("Helvetica");
}

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  res.send("Application Form Server Running 🚀");
});

/* ================= FORM SUBMIT ================= */
app.post(
  "/submit",
  upload.fields([{ name: "photo" }, { name: "resume" }]),
  async (req, res) => {
    try {
      /* -------- SAVE DB -------- */
      await Application.create({
        ...req.body,
        photo: req.files?.photo?.[0]?.filename || "",
        resume: req.files?.resume?.[0]?.filename || ""
      });

      /* -------- PDF -------- */
      const doc = new PDFDocument({ size: "A4", margin: 40 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=ApplicationForm.pdf"
      );

      doc.pipe(res);

      /* -------- LOGO -------- */
      const logoPath = path.join(__dirname, "public", "logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 30, { width: 80 });
      }

      /* -------- PHOTO -------- */
      if (req.files?.photo?.[0]) {
        const photoPath = path.join(uploadDir, req.files.photo[0].filename);
        doc.rect(450, 30, 100, 120).stroke();
        doc.image(photoPath, 455, 35, { width: 90, height: 110 });
      }

      /* -------- TITLE -------- */
      doc.moveDown(4);
      doc.fontSize(16).text("7S IQ PRIVATE LIMITED", { align: "center" });
      doc.fontSize(14).text("Application Form", { align: "center" });

      /* ================= PAGE 1 ================= */
      sectionTitle(doc, "Personal Information");

      doc
        .text(`Full Name: ${req.body.fullname || ""}`)
        .text(`Email: ${req.body.email || ""}`)
        .text(`Phone: ${req.body.phone || ""}`)
        .text(`DOB: ${req.body.dob || ""}`)
        .text(`Aadhar No: ${req.body.aadhar || ""}`)
        .text(`Blood Group: ${req.body.bloodGroup || ""}`)
        .text(`Marital Status: ${req.body.maritalStatus || ""}`)
        .text(`Years of Work: ${req.body.yearsOfWork || ""}`)
        .text(`Employment Type: ${req.body.employmentType || ""}`)
        .text(`Position: ${req.body.position || ""}`)
        .text(`Application Date: ${req.body.applicationDate || ""}`);

      sectionTitle(doc, "Educational Background");
      sectionTitle(doc, "Employment History");
      sectionTitle(doc, "Skills & Training");

      /* ================= PAGE 2 ================= */
      doc.addPage();

      sectionTitle(doc, "Family Details");
      sectionTitle(doc, "Emergency Contact");

      sectionTitle(doc, "Joining Details");

      doc
        .text(`Joining Date: ${req.body.joiningDate || ""}`)
        .text(`Fees: ${req.body.fees || ""}`)
        .text(`Installment 1: ${req.body.installment1 || ""}`)
        .text(`Installment 2: ${req.body.installment2 || ""}`)
        .text(`Installment 3: ${req.body.installment3 || ""}`);

      sectionTitle(doc, "Office Use");
      doc
        .text(`Company Name: ${req.body.companyName || ""}`)
        .text(`Receiving Person: ${req.body.receivingPerson || ""}`);

      doc.end();
    } catch (err) {
      console.error("❌ Submit Error:", err);
      res.status(500).send("Something went wrong");
    }
  }
);

/* ================= SERVER ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
