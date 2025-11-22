function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
  var range = sheet.getDataRange();
  var values = range.getValues();
  var backgrounds = range.getBackgrounds();
  
  var result = [];
  
  // i=1 skips header row
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var bgColors = backgrounds[i];
    var cellColor = bgColors[4]; // Column E (Birthday) background
    
    var derivedStatus = getStatusFromColor(cellColor);

    result.push({
      id: i,
      name: row[4],
      phone: row[6],
      status: derivedStatus,
      dateAdded: row[0],
      birthday: row[5],
      bias: row[9] // Column J is index 9
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    data: result
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
    var data = JSON.parse(e.postData.contents);
    
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