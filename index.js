var express = require("express");
var app = express();
var cors = require("cors");
var bodyParser = require("body-parser");
var axios = require("axios");

app.use(cors());
app.use(bodyParser.json());

const services = [
  {
    hook: "patient-view",
    name: "Static CDS Service Example",
    description:
      "An example of a CDS Service that returns a card with SMART app recommendations.",
    id: "patient-greeter",
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

function isDataAvailable(patient) {
  return (
    patient.name &&
    patient.name[0] &&
    patient.name[0].given &&
    patient.name[0].given[0]
  );
}

function isValidPrefetch(request) {
  const data = request.body;
  if (!(data && data.prefetch && data.prefetch.patient)) {
    return false;
  }
  return isDataAvailable(data.prefetch.patient);
}

function retrievePatientResource(fhirServer, patientId, accessToken) {
  const headers = { Accept: "application/json+fhir" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return axios({
    method: "get",
    url: `${fhirServer}/Patient/${patientId}`,
    headers,
  })
    .then((result) => {
      console.log("result", result.data);
      if (result.data && isDataAvailable(result.data)) {
        return result.data;
      }
      throw new Error();
    })
    .catch((err) => {
      // console.log(err);
    });
}

function buildCard(patient) {
  const name = patient.name[0].given[0];
  return {
    cards: [
      {
        uuid: "123",
        summary: `Now seeing: ${name}`,
        source: {
          label: "Patient greeting service",
        },
        indicator: "info",
      },
    ],
  };
}

app.post("/cds-services/patient-greeter", function (request, response) {
  if (!isValidPrefetch(request)) {
    const { fhirServer, fhirAuthorization } = request.body;

    let patient;
    if (request.body.context) {
      patient = request.body.context.patientId;
    }
    if (fhirServer && patient) {
      let accessToken;
      if (fhirAuthorization && fhirAuthorization.access_token) {
        accessToken = fhirAuthorization.access_token;
      }
      retrievePatientResource(fhirServer, patient, accessToken)
        .then((result) => {
          response.json(buildCard(result));
        })
        .catch(() => {
          response.sendStatus(412);
        });
      return;
    }
    response.sendStatus(412);
    return;
  }
  const resource = request.body.prefetch.patient;
  response.json(buildCard(resource));
});

app.listen(3000, function () {
  console.log("Example app listening on port 3000!");
});
