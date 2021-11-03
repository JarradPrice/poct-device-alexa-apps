function openBetaPrompt() {
  let ui = SpreadsheetApp.getUi();

  let result = ui.prompt(
      'Add email to send Beta invite to.',
      'Tester email:',
      ui.ButtonSet.OK_CANCEL);

  let button = result.getSelectedButton();
  let text = result.getResponseText();

  if (button == ui.Button.OK) {
    if (validateEmail(text)) {
      let testerEmail = text;
      let feedbackEmail = getFeedbackEmail();
      let payloadJson;
      if (feedbackEmail === "") {
        payloadJson = {
          "ref" : "main",
          "inputs": { "EMAIL" : testerEmail}
        }
      }
      else {
        payloadJson = {
          "ref" : "main",
          "inputs": { "EMAIL" : testerEmail, "FEEDBACK_EMAIL" : feedbackEmail}
        }
      }

      let response = doGhWorkflowApiRequest(payloadJson);
      if (response.hasOwnProperty("badRequest")) {
        showAlert(response["badRequest"]);
        Logger.log(response["badRequest"]);
      }
      else {
        showAlert(response["okRequest"]);
        Logger.log(response["okRequest"]);
      }
    }
    else {
      ui.alert("Invalid email - " + text);
    }
  }
}

function getFeedbackEmail() {
  let ui = SpreadsheetApp.getUi();

  let result = ui.prompt(
        'Do you want to add a feedback email?',
        'Feedback email:',
        ui.ButtonSet.YES_NO);

  let button = result.getSelectedButton();
  let text = result.getResponseText();

  if (button == ui.Button.YES) {
    if (validateEmail(text)) {
      return text;
    }
    else {
      ui.alert("Invalid email - " + text);
      return "";
    }
  }
  else {
    return "";
  }
}

function validateEmail(email) {
  const re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return re.test(String(email).toLowerCase());
}

function doGhWorkflowApiRequest(payloadJson) {
  getGlobals();
  if (VERBOSE) Logger.log("starting github api start workflow request");
  // construct request url
  let requestUrl = "https://api.github.com/repos/"
      + GITHUB_CONFIG.owner + "/"
      + GITHUB_CONFIG.repo
      + "/actions/workflows/alexa-beta.yml/dispatches";
      
  let options = {
      "method" : "POST",
      "headers" : {
          "accept" : "application/vnd.github.v3+json",
          "Authorization": "token " + GITHUB_CONFIG.token
      },
      "payload" : JSON.stringify(payloadJson)
  };

  if (VERBOSE) Logger.log("url output:\n" + JSON.stringify(options));

  let response = UrlFetchApp.fetch(requestUrl, options);
  if (VERBOSE) Logger.log("response code: " + response.getResponseCode());

  // check to ensure OK request
  if (response.getResponseCode() == 204) {
      let okRequestObject = {
      "okRequest" : "Successfully started workflow. Email with link should arrive shortly."
      }
      return okRequestObject;
  }
  else {
      if (VERBOSE) Logger.log("bad request:\n" + response.getContentText());
      let badRequestObject = {
      "badRequest" : response.getContentText()
      };
      return badRequestObject;
  }
}

function doMergeRequest() {
let response = doGhMergeApiRequest();
if (response.hasOwnProperty("badRequest")) {
  showAlert(response["badRequest"]);
  Logger.log(response["badRequest"]);
}
else {
  showAlert(response["okRequest"]);
  Logger.log(response["okRequest"]);
}
}

function doGhMergeApiRequest() {
getGlobals();
  if (VERBOSE) Logger.log("starting github api merge request");
  // construct request url
  let requestUrl = "https://api.github.com/repos/"
      + GITHUB_CONFIG.owner + "/"
      + GITHUB_CONFIG.repo
      + "/pulls";

  let payloadJson = {
    "head" : "dev",
    "base" : "main",
    "title" : "Pull request from Google Sheet"
  }
      
  let options = {
      "method" : "POST",
      "headers" : {
          "accept" : "application/vnd.github.v3+json",
          "Authorization": "token " + GITHUB_CONFIG.token
      },
      "payload" : JSON.stringify(payloadJson)
  };

  if (VERBOSE) Logger.log("url output:\n" + JSON.stringify(options));

  let response = UrlFetchApp.fetch(requestUrl, options);
  if (VERBOSE) Logger.log("response code: " + response.getResponseCode());

  // check to ensure OK request
  if (response.getResponseCode() == 201) {
      let okRequestObject = {
      "okRequest" : "Successfully created merge request."
      }
      return okRequestObject;
  }
  else {
      if (VERBOSE) Logger.log("bad request:\n" + response.getContentText());
      let badRequestObject = {
      "badRequest" : response.getContentText()
      };
      return badRequestObject;
  }
}