
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
  var range = sheet.getDataRange();
  var values = range.getValues();
  var backgrounds = range.getBackgrounds();
  
  // OPTIMIZATION: Fetch all contacts once to avoid N+1 API calls
  var myContactsPhoneNumbers = getAllContactPhoneNumbers();
  
  var result = [];
  
  // i=1 skips header row
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var bgColors = backgrounds[i];
    var cellColor = bgColors[4]; // Column E (Birthday) background
    
    var derivedStatus = getStatusFromColor(cellColor);
    var phone = row[6];
    var isSaved = false;

    // Check if contact exists using our pre-fetched set
    if (phone) {
      // Normalize phone for comparison (remove spaces, dashes)
      var cleanPhone = phone.toString().replace(/\D/g, '');
      if (myContactsPhoneNumbers.has(cleanPhone)) {
        isSaved = true;
      }
    }

    result.push({
      id: i,
      name: row[4],
      phone: phone,
      status: derivedStatus,
      dateAdded: row[0],
      birthday: row[5],
      bias: row[9], // Column J is index 9
      score: row[2], // Column C is index 2
      comments: row[3], // Column D is index 3
      isSaved: isSaved
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: result,
    whatsappConfig: getWhatsappConfig()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // ACTION: SAVE CONTACT
    if (data.action === 'saveContact') {
      var name = data.name || 'Unknown';
      var phone = data.phone;
      
      if (!phone) {
        throw new Error("Phone number is required");
      }
      
      // Create contact using People API
      var nameParts = name.split(' ');
      var firstName = nameParts[0];
      var lastName = nameParts.slice(1).join(' ') || '';
      
      var contactResource = {
        names: [{ givenName: firstName, familyName: lastName }],
        phoneNumbers: [{ value: phone }]
      };
      
      People.People.createContact(contactResource);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Contact Saved'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ACTION: UPDATE MEMBER DETAILS
    if (data.action === 'updateMemberDetails') {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
      var rowNumber = data.id + 1; // id is 0-based index from values array, so +1 for 1-based row index
      
      // Update Name (Column E -> 5)
      if (data.name !== undefined) {
        sheet.getRange(rowNumber, 5).setValue(data.name);
      }
      
      // Update Comments (Column D -> 4)
      if (data.comments !== undefined) {
        sheet.getRange(rowNumber, 4).setValue(data.comments);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Member Details Updated'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ACTION: UPDATE WHATSAPP CONFIG
    if (data.action === 'updateWhatsappConfig') {
      var props = PropertiesService.getScriptProperties();
      props.setProperty('WHATSAPP_CONFIG', JSON.stringify(data.config));
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Config Saved'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ACTION: UPDATE STATUS (Default)
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
    var rowNumber = data.id + 1; // We sent the row number from React
    var newStatus = data.status;
    var color = getColorFromStatus(newStatus);
    
    // Update Column E (5th column) background color
    sheet.getRange(rowNumber, 5).setBackground(color);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Updated'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// --- HELPERS ---

function getAllContactPhoneNumbers() {
  var phoneSet = new Set();
  var pageToken = null;
  
  try {
    do {
      // List 'personFields' must be specified. We need phoneNumbers.
      var response = People.People.Connections.list('people/me', {
        personFields: 'phoneNumbers',
        pageSize: 1000,
        pageToken: pageToken
      });
      
      var connections = response.connections;
      if (connections) {
        for (var i = 0; i < connections.length; i++) {
          var person = connections[i];
          if (person.phoneNumbers) {
            for (var j = 0; j < person.phoneNumbers.length; j++) {
              var p = person.phoneNumbers[j].value;
              if (p) {
                // Normalize: remove non-digits
                phoneSet.add(p.replace(/^\+94/, "0").replace(/\D/g, ''));
              }
            }
          }
        }
      }
      pageToken = response.nextPageToken;
    } while (pageToken);
  } catch (e) {
    // If People API is not enabled or fails, we just return empty set so app doesn't crash
    console.error("Failed to fetch contacts: " + e.toString());
  }
  
  return phoneSet;
}

function getStatusFromColor(hex) {
  if (!hex) return "Not Contacted";
  hex = hex.toLowerCase();
  
  // Colors must match the getColorFromStatus function
  if (hex === "#00ff00") return "In Group";
  if (hex === "#ff0000") return "Removed";
  if (hex === "#ffff00") return "No Response";
  return "Not Contacted";
}

function getColorFromStatus(status) {
  switch (status) {
    case "In Group": return "#00ff00"; // Green
    case "Removed": return "#ff0000"; // Red
    case "No Response": return "#ffff00"; // Yellow
    default: return null; // No Color (White/Reset)
  }
}

function getWhatsappConfig() {
  var props = PropertiesService.getScriptProperties();
  var config = props.getProperty('WHATSAPP_CONFIG');
  if (!config) {
    // Default Config
    return {
      initialMessages: [
        "Hi, I'm {{Name}} one of the admins of BPSL Community. Did you fill the form to be added to the community?"
      ],
      categories: [
        { name: "Blackpink", questions: ["What is your favorite song?"] },
        { name: "Jisoo", questions: [] },
        { name: "Jennie", questions: [] },
        { name: "Lisa", questions: [] },
        { name: "Rosé", questions: [] }
      ]
    };
  }
  return JSON.parse(config);
}