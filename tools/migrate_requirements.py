"""One-off migration: add sign-up / selection / standards columns and the standards catalog.
Safe to re-run: existing values are kept."""
import csv, json, os
NEW = ["signup_deadline","signup_link","has_selection","selection_link","selection_notes","has_standards","standards","standards_link"]
rows = list(csv.DictReader(open("data/events.csv", newline="", encoding="utf-8")))
head = list(rows[0].keys())
for c in NEW:
    if c not in head: head.append(c)
STD_FOR = {
 "us-open": "us-open;us-open-18u",
 "winter-juniors-east": "winter-jrs;winter-jrs-bonus",
 "nc-ag-champs-scy": "nc-ag",
 "nc-senior-champs-scy": "nc-senior",
 "summer-nationals": "nationals-19o;nationals-18u",
 "tyr-futures": "futures-19o;futures-18u",
 "junior-nationals": "jr-nats;jr-nats-bonus",
}
SELECTION = {"carolina-crown","sz-open-water","ncs-select-camp"}
for r in rows:
    for c in NEW: r.setdefault(c, "")
    if r["id"] in STD_FOR and not r["standards"]:
        r["has_standards"] = "yes"; r["standards"] = STD_FOR[r["id"]]
    if r["id"] in SELECTION and not r["has_selection"]:
        r["has_selection"] = "yes"
with open("data/events.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, head, lineterminator="\n"); w.writeheader(); w.writerows(rows)
STD = [
 ("nationals-19o","Nationals 19&O","National","",""),
 ("nationals-18u","Nationals 18&U","National","",""),
 ("us-open","US Open","National","",""),
 ("us-open-18u","US Open 18&U","National","",""),
 ("jr-nats","Jr Nats 18&U","Junior / Futures","",""),
 ("jr-nats-bonus","Jr Nats Bonus 18&U","Junior / Futures","",""),
 ("winter-jrs","Winter Jrs 18&U","Junior / Futures","",""),
 ("winter-jrs-bonus","Winter Jrs Bonus 18&U","Junior / Futures","",""),
 ("futures-19o","Futures 19&O","Junior / Futures","",""),
 ("futures-18u","Futures 18&U","Junior / Futures","",""),
 ("sectionals","Sectionals (max)","Zone / Sectional","",""),
 ("essz-sr-summer","ESSZ Sr Summer","Zone / Sectional","",""),
 ("essz-sr-spring","ESSZ Sr Spring","Zone / Sectional","",""),
 ("essz-ag","ESSZ AG","Zone / Sectional","",""),
 ("nc-senior","NC Senior","State (NC)","",""),
 ("nc-ag","NC AG","State (NC)","",""),
 ("motivational","Motivational (B - AAAA)","Motivational","",""),
]
if not os.path.exists("data/standards.csv"):
    with open("data/standards.csv","w",newline="",encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n"); w.writerow(["key","name","group","link","notes"]); w.writerows(STD)
if not os.path.exists("data/settings.json"):
    json.dump({"standards_tool_url": ""}, open("data/settings.json","w"), indent=1); open("data/settings.json","a").write("\n")
print("ok", len(rows))
