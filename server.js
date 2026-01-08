const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

/* ================= ROOT ROUTE (IMPORTANT) ================= */
app.get("/", (req, res) => {
  res.send("Application Form Server is Running 🚀");
});

/* ================= MONGODB ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const Application = mongoose.model(
  "applications",
  new mongoose.Schema({}, { strict: false })
);

/* ================= MULTER ================= */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, PDF allowed"), false);
};

const upload = multer({ storage, fileFilter });

/* ================= PDF HELPER ================= */
function sectionTitle(doc, title) {
  doc
    .moveDown()
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(title)
    .moveDown(0.5)
    .font("Helvetica");
}

/* ================= SUBMIT FORM ================= */
app.post(
  "/submit",
  upload.fields([{ name: "photo" }, { name: "resume" }]),
  async (req, res) => {
    try {
      /* -------- SAVE TO DB -------- */
      await Application.create({
        ...req.body,
        photo: req.files.photo?.[0]?.filename,
        resume: req.files.resume?.[0]?.filename
      });

      /* -------- CREATE PDF -------- */
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
      if (req.files.photo?.[0]) {
        const photoPath = path.join(
          __dirname,
          "uploads",
          req.files.photo[0].filename
        );
        doc.rect(450, 30, 100, 120).stroke();
        doc.image(photoPath, 455, 35, {
          width: 90,
          height: 110
        });
      }

      /* -------- TITLE -------- */
      doc.moveDown(4);
      doc.fontSize(16).text("7S IQ PRIVATE LIMITED", { align: "center" });
      doc.fontSize(14).text("Application Form", { align: "center" });

      /* ================= PAGE 1 ================= */
      sectionTitle(doc, "Personal Information");

      doc
        .fontSize(11)
        .text(`Full Name: ${req.body.fullname}`)
        .text(`Email: ${req.body.email}`)
        .text(`Phone: ${req.body.phone}`)
        .text(`Address: ${req.body.address}`)
        .text(`DOB: ${req.body.dob}`)
        .text(`Aadhar No: ${req.body.aadhar}`)
        .text(`Position: ${req.body.position}`)
        .text(`Employment Type: ${req.body.employmentType}`)
        .text(`Application Date: ${req.body.applicationDate}`);

      sectionTitle(doc, "Educational Background");

      doc
        .text(`Degree: ${req.body.degree}`)
        .text(`Institute: ${req.body.institute}`)
        .text(`Year: ${req.body.year}`)
        .text(`Grade: ${req.body.grade}`)
        .text(`City: ${req.body.city}`);

      sectionTitle(doc, "Employment History");

      doc
        .text(`Company: ${req.body.company}`)
        .text(`Position: ${req.body.positionHistory}`)
        .text(`Year: ${req.body.yearHistory}`)
        .text(`Reason: ${req.body.reason}`);

      sectionTitle(doc, "Skills & Training");

      doc
        .text(`Achievement: ${req.body.achievement}`)
        .text(`Level: ${req.body.level}`)
        .text(`Year: ${req.body.yearSkill}`)
        .text(`Institute: ${req.body.skillInstitute}`);

      /* ================= PAGE 2 ================= */
      doc.addPage();

      sectionTitle(doc, "Family Details");

      doc
        .text(`Name: ${req.body.familyName}`)
        .text(`Relationship: ${req.body.familyRelation}`)
        .text(`Occupation: ${req.body.familyOccupation}`);

      sectionTitle(doc, "Emergency Contact");

      doc
        .text(`Name: ${req.body.emergencyName}`)
        .text(`Relationship: ${req.body.emergencyRelation}`)
        .text(`Occupation: ${req.body.emergencyOccupation}`)
        .text(`Qualification: ${req.body.emergencyQualification}`)
        .text(`City: ${req.body.emergencyCity}`);

      sectionTitle(doc, "Joining Details");

      doc
        .text(`Joining Date: ${req.body.joiningDate}`)
        .text(`Fees: ${req.body.fees}`)
        .text(`1st Installment: ${req.body.installment1}`)
        .text(`2nd Installment: ${req.body.installment2}`)
        .text(`3rd Installment: ${req.body.installment3}`);

      sectionTitle(doc, "Office Use");

      doc
        .text(`Company Name: ${req.body.companyName}`)
        .text(`Receiving Person: ${req.body.receivingPerson}`);

      doc.end();
    } catch (err) {
      console.error(err);
      res.status(500).send("Something went wrong");
    }
  }
);

/* ================= SERVER (RENDER FIX) ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
