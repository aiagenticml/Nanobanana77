---
name: daily-report
description: Generate the daily activity report .docx from Google Calendar and email it. Use when the user asks for their daily report, the calendar report, or when the daily report Routine fires.
---

# Daily calendar report

Produces `calendarreport/output/report_<date>.docx` from the day's Google Calendar
events and emails it to the user.

## Steps

1. **Fetch events.** Call `mcp__Google_Calendar__list_events` with:
   - `calendarId`: `ai.agenticml@gmail.com`
   - `startTime` / `endTime`: the report day, 00:00 to 23:59:59 in `+08:00`
   - `timeZone`: `Asia/Singapore`
   - `orderBy`: `startTime`

2. **Save them.** Write the raw `events` array to
   `calendarreport/samples/events_<date>.json`. The build script accepts the
   connector's shape directly — no reshaping needed.

3. **Check the derived names.** Run:
   ```bash
   cd calendarreport && python3 src/build_report.py \
     --events samples/events_<date>.json --date <date> --dump-context
   ```
   Report the `names` list to the user and ask them to confirm or correct it.
   In an unattended run (a Routine firing with nobody present), skip the question,
   use the derived names, and say clearly in the email body that the names were
   auto-derived and need checking.

4. **Build the document.**
   ```bash
   cd calendarreport && python3 src/build_report.py \
     --events samples/events_<date>.json --date <date> \
     --out output/report_<date>.docx
   ```
   Add `--names "A,B,C"` when the user has corrected them.

5. **Email it.** Base64-encode the .docx and call `mcp__Gmail__send_message`:
   - `to`: `ai.agenticml@gmail.com`
   - `subject`: `Daily Report — <day_of_week>, <report_date>`
   - `body`: the event count, the names used, whether they were confirmed or
     auto-derived, and any flags raised
   - `attachments`: one entry with `filename` `report_<date>.docx` and `mimeType`
     `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

   ```bash
   base64 -w0 calendarreport/output/report_<date>.docx
   ```

## Notes

- The rules that turn event titles into categories, table rows and wording live in
  `calendarreport/config/mapping.yaml`. Edit that file, not the script, when the
  user wants different behaviour.
- If an event title matches no rule it falls through to `default:` and is
  categorised `General`. Mention it if several events land there — it usually
  means a rule is missing.
- Do not commit `output/*.docx`; it is gitignored.
