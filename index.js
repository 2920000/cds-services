var express = require("express");
var app = express();
var cors = require("cors");
var bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());

const services = [
  {
    hook: "patient-view",
    name: "Static CDS Service Example",
    description:
      "An example of a CDS Service that returns a card with SMART app recommendations.",
    id: "static-patient-view",
    prefetch: {
      patientToGreet: "Patient/{{context.patientId}}",
    },
  },
];

app.get("/cds-services", function (req, res) {
  res.json({
    services,
  });
});

app.post("/cds-services/patient-greeter", function (req, res) {
  const body = req.body;
  const patient = body?.prefetch?.patientToGreet;
  const name = patient?.name?.[0]?.given?.[0];

  res.json({
    cards: [
      {
        summary: `Hello ${name}`,
        indicator: "success",
        detail: `Hello ${name}`,
        source: {
          label: "Static CDS Service Example",
          url: "https://example.com",
        },
        links: [
          {
            label: "SMART Example App",
            url: "https://smart.example.com/launch",
            type: "smart",
          },
        ],
      },
    ],
  });
});

app.listen(3000, function () {
  console.log("Example app listening on port 3000!");
});
