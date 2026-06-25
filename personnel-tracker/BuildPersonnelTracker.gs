/**
 * Personnel Tracking System — one-run auto-builder for Google Sheets + Forms.
 *
 * WHAT IT DOES
 *   Run buildPersonnelTracker() once from a blank Google Sheet and it provisions the
 *   entire system described in the spec:
 *     - a Leave Input Form (linked to this sheet -> "Form Responses 1" ledger)
 *     - Skills Database tab
 *     - Tactical Timeline Tracker tab (present/OL matrix + today highlight)
 *     - Command Dashboard tab (live skill-availability counter)
 *     - Appointment Board tab (double-booking + overseas guardrails)
 *
 * HOW TO RUN
 *   1. Create a new, blank Google Sheet.
 *   2. Extensions -> Apps Script. Delete any boilerplate, paste this whole file.
 *   3. Pick "buildPersonnelTracker" in the function dropdown, click Run, approve the
 *      OAuth prompt (it needs Sheets + Forms access).
 *   4. Open the new Form's link (logged in the execution log, and printed on the
 *      Command Dashboard) to collect leave entries.
 *
 * EDIT ONE PLACE ONLY: the CONFIG block below — swap the placeholder roster, skills,
 * and roles for your real data, then run.
 *
 * RE-RUNNING: tabs are rebuilt cleanly each run. A NEW Form is created each run, so
 * delete the previous Form manually (Drive) if you re-run, to avoid orphans.
 */

// ============================== CONFIG (edit me) ==============================

// Your roster. These names feed the Form dropdown, the Timeline rows, and the
// Appointment Board dropdowns. Swap the placeholders for real names.
var ROSTER = [
  'Person 01', 'Person 02', 'Person 03', 'Person 04', 'Person 05',
  'Person 06', 'Person 07', 'Person 08', 'Person 09', 'Person 10',
  'Person 11', 'Person 12', 'Person 13', 'Person 14', 'Person 15',
  'Person 16', 'Person 17', 'Person 18', 'Person 19', 'Person 20'
];

// Skills Database seed: one [Name, Skillset] pair per row. A person with several
// skills gets several rows. Placeholder data — replace with your real skill matrix.
var SKILLS_SEED = [
  ['Person 01', 'Medic'],      ['Person 01', 'Driver'],
  ['Person 02', 'Medic'],
  ['Person 03', 'Driver'],     ['Person 03', 'Signaller'],
  ['Person 04', 'Signaller'],
  ['Person 05', 'Medic'],      ['Person 05', 'Signaller'],
  ['Person 06', 'Driver'],
  ['Person 07', 'Medic'],
  ['Person 08', 'Driver'],     ['Person 08', 'Marksman'],
  ['Person 09', 'Signaller'],
  ['Person 10', 'Medic'],      ['Person 10', 'Driver'],
  ['Person 11', 'Marksman'],
  ['Person 12', 'Driver'],
  ['Person 13', 'Medic'],
  ['Person 14', 'Signaller'],  ['Person 14', 'Marksman'],
  ['Person 15', 'Driver'],
  ['Person 16', 'Medic'],
  ['Person 17', 'Driver'],     ['Person 17', 'Signaller'],
  ['Person 18', 'Marksman'],
  ['Person 19', 'Medic'],      ['Person 19', 'Driver'],
  ['Person 20', 'Signaller']
];

// Daily roles down Column A of the Appointment Board.
var ROLES = [
  'Platoon Sergeant',
  'Duty Medic',
  'Standby Driver',
  'Signaller',
  'Guard Commander',
  'Standby Marksman'
];

// Date axis. The Timeline (Row 13) and Appointment Board (Row 2) share this range.
// START_DATE: 'today' for the current day, or a 'YYYY-MM-DD' string for a fixed start.
var START_DATE = 'today';
var NUM_DAYS = 30;            // number of date columns to generate

// ============================ END CONFIG ============================

// Tab names (kept consistent with the spec / cross-references).
var TAB = {
  skills:   'Skills Database',
  timeline: 'Tactical Timeline Tracker',
  dashboard:'Command Dashboard',
  board:    'Appointment Board'
};
var RESP_SHEET = 'Form Responses 1'; // default name Google gives the linked tab

// Soft fills used by conditional formatting.
var COLOR = {
  green:  '#d9ead3',  // PRESENT
  red:    '#f4cccc',  // OL
  orange: '#fce5cd',  // today column
  dbRed:  '#ea4335',  // double-booked
  purple: '#674ea7'   // overseas / OL when rostered
};

/** Entry point — run this. */
function buildPersonnelTracker() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    ss = SpreadsheetApp.create('Personnel Tracker');
  }

  var dates = buildDates_();                 // array of Date objects, length NUM_DAYS

  var formUrl = createLeaveForm_(ss);        // creates Form + Form Responses 1
  buildSkillsDatabase_(ss);
  buildTimeline_(ss, dates);
  buildDashboard_(ss, formUrl);
  buildAppointmentBoard_(ss, dates);

  // Tidy: drop the default empty "Sheet1" if it is still around and unused.
  var sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(sheet1); } catch (e) { /* leave it if it is the only sheet */ }
  }

  Logger.log('Personnel Tracker built. Form: ' + formUrl);
  Logger.log('Spreadsheet: ' + ss.getUrl());
}

// ----------------------------------------------------------------------------

/** Build the shared list of Date objects for both date axes. */
function buildDates_() {
  var start;
  if (START_DATE === 'today') {
    start = new Date();
  } else {
    var p = START_DATE.split('-');
    start = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  start.setHours(0, 0, 0, 0);

  var out = [];
  for (var i = 0; i < NUM_DAYS; i++) {
    var d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d);
  }
  return out;
}

/** Remove a tab if it exists, then create a fresh one with the given name. */
function freshSheet_(ss, name) {
  var existing = ss.getSheetByName(name);
  if (existing) ss.deleteSheet(existing);
  return ss.insertSheet(name);
}

/** Convert a 1-based column index to an A1 letter (1 -> A, 27 -> AA). */
function colLetter_(n) {
  var s = '';
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// ----------------------------------------------------------------------------

/**
 * Create the Leave Input Form and link it to this spreadsheet. Item order matters —
 * it fixes the ledger columns to: A=Timestamp, B=Full Name, C=Destination,
 * D=Start Date, E=End Date.
 */
function createLeaveForm_(ss) {
  var form = FormApp.create('Personnel Leave Input');

  form.setDescription('Log overseas leave (OL). Pick your name, where you are going, '
    + 'and the start/end dates.');

  form.addListItem()
    .setTitle('Full Name')
    .setRequired(true)
    .setChoiceValues(ROSTER);

  form.addTextItem()
    .setTitle('Destination')
    .setRequired(true);

  form.addDateItem()
    .setTitle('Start Date')
    .setRequired(true);

  form.addDateItem()
    .setTitle('End Date')
    .setRequired(true);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // The linked tab arrives asynchronously named by Google; normalise it to RESP_SHEET
  // so every formula can reference a stable name.
  SpreadsheetApp.flush();
  normaliseResponsesTabName_(ss);

  return form.getPublishedUrl();
}

/** Ensure the freshly-linked responses tab is called exactly RESP_SHEET. */
function normaliseResponsesTabName_(ss) {
  if (ss.getSheetByName(RESP_SHEET)) return;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name.indexOf('Form Responses') === 0) {
      sheets[i].setName(RESP_SHEET);
      return;
    }
  }
}

// ----------------------------------------------------------------------------

/** Skills Database: flat [Name, Skillset] ledger. */
function buildSkillsDatabase_(ss) {
  var sh = freshSheet_(ss, TAB.skills);
  sh.getRange('A1:B1').setValues([['Name', 'Skillset']]).setFontWeight('bold');
  if (SKILLS_SEED.length) {
    sh.getRange(2, 1, SKILLS_SEED.length, 2).setValues(SKILLS_SEED);
  }
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, 2);
}

// ----------------------------------------------------------------------------

/**
 * Tactical Timeline Tracker — dates across Row 13 (from B13), names down Col A
 * (from A15). Each grid cell reports PRESENT / OL by cross-referencing the live
 * leave ledger.
 */
function buildTimeline_(ss, dates) {
  var sh = freshSheet_(ss, TAB.timeline);

  sh.getRange('A11').setValue('TACTICAL TIMELINE TRACKER')
    .setFontWeight('bold').setFontSize(12);
  sh.getRange('A13').setValue('Name / Date').setFontWeight('bold');

  // Row 13: dates starting at B13.
  var dateRow = [dates.map(function (d) { return d; })];
  sh.getRange(13, 2, 1, dates.length).setValues(dateRow)
    .setNumberFormat('ddd\nd MMM').setFontWeight('bold')
    .setHorizontalAlignment('center');

  // Column A: names starting at A15.
  var nameCol = ROSTER.map(function (n) { return [n]; });
  sh.getRange(15, 1, ROSTER.length, 1).setValues(nameCol).setFontWeight('bold');

  // Matrix formulas across B15 down/right. setFormulasR1C1 keeps the relative date
  // (B$13) and name ($A15) references correct as Sheets fills the block.
  var nRows = ROSTER.length;
  var nCols = dates.length;
  var formulas = [];
  for (var r = 0; r < nRows; r++) {
    var row = [];
    for (var c = 0; c < nCols; c++) {
      var col = colLetter_(2 + c);          // B, C, D, ...
      var nameRow = 15 + r;
      row.push(
        "=IF(COUNTIFS('" + RESP_SHEET + "'!$B$2:$B,$A" + nameRow +
        ",'" + RESP_SHEET + "'!$D$2:$D,\"<=\"&" + col + "$13" +
        ",'" + RESP_SHEET + "'!$E$2:$E,\">=\"&" + col + "$13)>0,\"OL\",\"PRESENT\")"
      );
    }
    formulas.push(row);
  }
  sh.getRange(15, 2, nRows, nCols).setFormulas(formulas)
    .setHorizontalAlignment('center');

  applyTimelineFormatting_(sh, nRows, nCols);

  sh.setFrozenRows(13);
  sh.setFrozenColumns(1);
}

/** Conditional formatting for the timeline grid: PRESENT/OL/today. */
function applyTimelineFormatting_(sh, nRows, nCols) {
  var grid = sh.getRange(15, 2, nRows, nCols);
  var topLeft = 'B15';

  var rules = [];

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('PRESENT')
    .setBackground(COLOR.green)
    .setRanges([grid])
    .build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('OL')
    .setBackground(COLOR.red)
    .setFontColor('#990000')
    .setRanges([grid])
    .build());

  // Today highlight evaluated against the date in row 13 of each column.
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=' + topLeft.charAt(0) + '$13=TODAY()')
    .setBackground(COLOR.orange)
    .setRanges([grid])
    .build());

  sh.setConditionalFormatRules(rules);
}

// ----------------------------------------------------------------------------

/**
 * Command Dashboard — live availability counter per skill, adjusted for who is on
 * leave on the target date (B2).
 */
function buildDashboard_(ss, formUrl) {
  var sh = freshSheet_(ss, TAB.dashboard);

  sh.getRange('A1').setValue('COMMAND DASHBOARD').setFontWeight('bold').setFontSize(12);
  sh.getRange('A2').setValue('Check date:').setFontWeight('bold');
  sh.getRange('B2').setFormula('=TODAY()').setNumberFormat('ddd, d MMM yyyy');

  if (formUrl) {
    sh.getRange('A3').setValue('Leave form:');
    sh.getRange('B3').setFormula('=HYPERLINK("' + formUrl + '","Open Leave Input form")');
  }

  // Skill / availability table.
  sh.getRange('A5:B5').setValues([['Skillset', 'Available']]).setFontWeight('bold');

  // Absent-today helper block (Col F). Header at F3, FILTER spills from F4.
  sh.getRange('F3').setValue('Absent on check date').setFontWeight('bold');
  sh.getRange('F4').setFormula(
    "=IFERROR(FILTER('" + RESP_SHEET + "'!$B$2:$B," +
    "('" + RESP_SHEET + "'!$D$2:$D<=$B$2)*('" + RESP_SHEET + "'!$E$2:$E>=$B$2)),\"\")"
  );

  // Unique skill list down Col A from A6, with the capability counter beside it.
  var skills = uniqueSkills_();
  for (var i = 0; i < skills.length; i++) {
    var row = 6 + i;
    sh.getRange(row, 1).setValue(skills[i]);
    sh.getRange(row, 2).setFormula(
      "=COUNTIF('" + TAB.skills + "'!$B$2:$B,$A" + row + ")" +
      "-SUMPRODUCT(('" + TAB.skills + "'!$B$2:$B=$A" + row + ")" +
      "*ISNUMBER(MATCH('" + TAB.skills + "'!$A$2:$A,$F$4:$F,0)))"
    );
  }

  sh.autoResizeColumns(1, 6);
}

/** Distinct skill names from SKILLS_SEED, sorted. */
function uniqueSkills_() {
  var seen = {};
  var out = [];
  for (var i = 0; i < SKILLS_SEED.length; i++) {
    var s = SKILLS_SEED[i][1];
    if (!seen[s]) { seen[s] = true; out.push(s); }
  }
  out.sort();
  return out;
}

// ----------------------------------------------------------------------------

/**
 * Appointment Board — assign people to daily roles with two guardrails:
 *   double-booking (red) and overseas-while-rostered (purple).
 */
function buildAppointmentBoard_(ss, dates) {
  var sh = freshSheet_(ss, TAB.board);

  sh.getRange('A1').setValue('APPOINTMENT BOARD').setFontWeight('bold').setFontSize(12);
  sh.getRange('A2').setValue('Role / Date').setFontWeight('bold');

  // Row 2: dates (same array as the timeline).
  sh.getRange(2, 2, 1, dates.length).setValues([dates])
    .setNumberFormat('ddd\nd MMM').setFontWeight('bold')
    .setHorizontalAlignment('center');

  // Column A: roles from A3.
  var roleCol = ROLES.map(function (r) { return [r]; });
  sh.getRange(3, 1, ROLES.length, 1).setValues(roleCol).setFontWeight('bold');

  var lastRow = 3 + ROLES.length - 1;   // last role row
  var nCols = dates.length;
  var grid = sh.getRange(3, 2, ROLES.length, nCols);

  // Dropdown of roster names on every booking cell.
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ROSTER, true)
    .setAllowInvalid(true)               // allow typing; guardrails catch mistakes
    .build();
  grid.setDataValidation(rule);

  applyBoardFormatting_(sh, ROLES.length, nCols, lastRow);

  sh.setFrozenRows(2);
  sh.setFrozenColumns(1);
}

/** Double-booking (red) + overseas (purple) conditional formatting. */
function applyBoardFormatting_(sh, nRoles, nCols, lastRow) {
  var grid = sh.getRange(3, 2, nRoles, nCols);
  var rules = [];

  // Double-booking: same name appears more than once in a single date column.
  // Guarded with B3<>"" so empty cells never flag.
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(B3<>"",COUNTIF(B$3:B$' + lastRow + ',B3)>1)')
    .setBackground(COLOR.dbRed)
    .setFontColor('#ffffff')
    .setRanges([grid])
    .build());

  // Overseas: the assigned person reads "OL" on the Timeline for that date.
  // IFERROR(...,FALSE) stops empty / unmatched cells from erroring.
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(
      "=IFERROR(INDEX('" + TAB.timeline + "'!$B$15:$AF$100," +
      "MATCH(B3,'" + TAB.timeline + "'!$A$15:$A$100,0)," +
      "MATCH(B$2,'" + TAB.timeline + "'!$B$13:$AF$13,0))=\"OL\",FALSE)"
    )
    .setBackground(COLOR.purple)
    .setFontColor('#ffffff')
    .setRanges([grid])
    .build());

  sh.setConditionalFormatRules(rules);
}
