import csv
H=["id","title","start","end","precision","month_hint","type","groups","eligibility","venue","status","tags","description","link","needs_review","review_note"]
HOL="https://docs.google.com/spreadsheets/d/1PnEukw-c0GVkrEFhYK4A-sXXShC2Vg6AnqlF0ztQx6Y/edit?usp=sharing"
B="Breakers;Surge;Senior"; W="Splash;Tidepool;Riptide"
def r(id,title,start="",end="",type="meet",groups="All",elig="",venue="",tags="",desc="",link="",rev="",note="",prec=None,month=""):
    prec=prec or ("day" if start else "month")
    return dict(id=id,title=title,start=start,end=end or start,precision=prec,month_hint=month,type=type,groups=groups,eligibility=elig,venue=venue,status="Tentative",tags=tags,description=desc,link=link,needs_review="yes" if rev else "",review_note=note)
R=[
r("senior-surge-start","Senior Surge Begins Practice","2026-08-24",type="schedule",groups="Senior",venue="EJP",tags="home"),
r("new-family-orientation","New Family Orientation","2026-08-25","2026-08-26",type="team-event",venue="EJP",tags="home;new-families",desc="Listed as separate Aug 25 and Aug 26 sessions."),
r("welcome-picnic","Welcome Picnic","2026-08-31",type="team-event",venue="EJP",tags="home;social"),
r("bac-kickoff-classic","NSEA v BAC Kick Off Classic","2026-09-18","2026-09-19",venue="EJP",tags="dual;home",rev=1,note="Events page lists 9/18 only; meet calendar lists 9/18-9/19."),
r("intersquad-oct","Team Intersquad","2026-10-09",venue="EJP",tags="intersquad;home"),
r("bac-halloween-bash","BAC Halloween Bash","2026-10-30","2026-11-01",venue="BCC",tags="invitational;travel",rev=1,note="Events page says @ BAC; meet-pools page lists BAC as Dinah E. Gore Fitness & Aquatics Center, Bolivia."),
r("game-turkey-invitational","GAME Turkey Invitational","2026-11-13","2026-11-15",groups=B,venue="USC",tags="invitational;travel;overnight"),
r("thanksgiving-practice","Thanksgiving Practice Schedule","2026-11-24","2026-11-29",type="schedule",link=HOL,tags="holiday",desc="See the holiday practice schedule sheet.",rev=1,note="Source says 'Monday 11/24', but 11/24/2026 is a Tuesday. Confirm start date (11/23?)."),
r("us-open","US Open","2026-12-02","2026-12-05",elig="Qualified swimmers",venue="UT-Austin",tags="national;travel;overnight;qualifier"),
r("winter-juniors-east","Winter Junior Nationals - East","2026-12-09","2026-12-12",elig="Qualified swimmers",venue="Indy",tags="national;travel;overnight;qualifier"),
r("star-triad-tropic","STAR Triad Tropic","2026-12-11","2026-12-13",venue="GAC",tags="invitational;travel;overnight"),
r("winter-break","Christmas / New Year's Practice Schedule & Break","2026-12-18","2027-01-03",type="schedule",link=HOL,tags="holiday",desc="See the holiday practice schedule sheet."),
r("practice-resumes","Regular Practice Schedule Resumes","2027-01-04",type="schedule",tags="holiday"),
r("intersquad-jan","Team Intersquad","2027-01-08",venue="EJP",tags="intersquad;home"),
r("nchsaa-regionals","NCHSAA Regionals","2027-01-29","2027-01-30",tags="high-school"),
r("nchsaa-state","NCHSAA State Championships","2027-02-04","2027-02-06",tags="high-school;championship",desc="Weather permitting."),
r("bac-cupid-qualifier","BAC Cupid Qualifier","2027-02-05","2027-02-07",elig="All non-championship swimmers",venue="BCC",tags="qualifier;travel;overnight"),
r("nc-ag-champs-scy","NC Age Group Championships","2027-02-18","2027-02-21",elig="14 & Under qualifying swimmers",venue="TAC",tags="championship;qualifier;travel;overnight"),
r("nc-senior-champs-scy","NC Senior Championships","2027-02-25","2027-02-28",elig="15 & Over qualifying swimmers",venue="TAC",tags="championship;qualifier;travel;overnight"),
r("spring-optout","Spring Opt-Out Deadline","2027-03-01",type="deadline",tags="deadline"),
r("wow-tri-county","WOW Tri-County Classic","2027-03-06","2027-03-07",groups=W,venue="UNCW",tags="invitational;local",desc="Meet calendar lists this as 'WOW March'."),
r("star-tar-heel-states","STAR Tar Heel States","2027-03-12","2027-03-14",groups=B,venue="GAC",tags="invitational;travel;overnight"),
r("spring-banquet","Team Spring Banquet & Senior Recognition","2027-03-22",type="team-event",tags="social"),
r("last-day-scy","Last Day - Short Course Session","2027-03-24",type="schedule"),
r("spring-break","Spring Break","2027-03-25","2027-04-04",type="schedule",tags="holiday"),
r("spring-session-begins","Spring Session Begins","2027-04-05",type="schedule"),
r("ncs-select-camp","NCS Select Camp","2027-04-10",type="camp",elig="Top 5 at NC Age Group Championships",tags="selection"),
r("carolina-crown","NC / SC Carolina Crown","2027-04-11",elig="Invited 15 & Over swimmers",tags="selection;travel",desc="Selection process.",rev=1,note="No location listed."),
r("sz-open-water","Southern Zone Open Water Championships","2027-04-23","2027-04-25",type="camp",elig="11 & Older selected swimmers",tags="open-water;selection;travel",desc="Selection process.",rev=1,note="Events page: 4/23-4/25. Meet calendar: 4/17-4/18. Used events page dates. No location listed."),
r("wave-lcm","WAVE Sprint into LCM","2027-04-24","2027-04-25",venue="TAC",tags="lcm;travel"),
r("spring-showers-wow","Spring Showers WOW Dual Meet","2027-04-30",groups=W,venue="EJP",tags="dual;home;wow"),
r("summer-optout","Summer Opt-Out Deadline","2027-05-01",type="deadline",tags="deadline"),
r("team-lcm-may","Team LCM Meet","",venue="TBD",tags="lcm",prec="month",month="2027-05",rev=1,note="Month only. Assumed same as 'May LCM Meet' on the meet calendar page (venue TBD)."),
r("charlotte-open","Martha McKee Charlotte Open","",elig="Qualified swimmers",venue="MCAC",tags="lcm;qualifier;travel",prec="month",month="2027-05",rev=1,note="No dates on either page. Assumed this is the 'Qualifier Meet LCM' (May) from the events page."),
r("may-flowers-wow","May Flowers WOW Dual Meet","2027-05-20",groups=W,venue="EJP",tags="dual;home;wow"),
r("summer-session-begins","Summer Session Begins","2027-05-31",type="schedule"),
r("intent-deadline","2027-28 Season Intent Deadline","2027-06-01",type="deadline",tags="deadline"),
r("summer-practice-begins","Summer Practice Schedule Begins","2027-06-07",type="schedule"),
r("summer-nationals","USA Swimming Summer Nationals","2027-06-08","2027-06-12",elig="Qualified swimmers",venue="Indy",tags="national;travel;overnight;qualifier"),
r("game-summer-invitational","GAME Summer Invitational","2027-06-11","2027-06-13",groups=B,venue="USC",tags="invitational;travel;overnight"),
r("nc-senior-lcm","NC Senior LCM Championships","2027-07-08","2027-07-11",elig="Qualified swimmers",venue="TAC",tags="championship;lcm;qualifier;travel;overnight"),
r("nc-ag-lcm","NC Age Group LCM Championships","2027-07-15","2027-07-18",elig="14 & Under qualified swimmers",venue="GAC",tags="championship;lcm;qualifier;travel;overnight",rev=1,note="Events page says 'qualified swimmers'; meet calendar says 14 & Under. Used 14 & Under."),
r("optout-2728","2027-28 Season Opt-Out Deadline","",type="deadline",tags="deadline",prec="month",month="2027-07",rev=1,note="No day given."),
r("wow-summer-spectacular","WOW Summer Spectacular","",elig="All swimmers not going to Futures or Junior Nationals",venue="UNCW",tags="wow;lcm;local",desc="Events page calls this 'WOW Summer Sizzler'.",prec="month",month="2027-07",rev=1,note="No dates. Two names across the pages; confirm which is correct."),
r("last-day-season","Last Day of the 2026-27 Season","2027-07-27",type="schedule"),
r("tyr-futures","TYR Futures Championships","2027-07-28","2027-07-31",elig="Qualified swimmers",venue="FAST",tags="national;travel;overnight;qualifier"),
r("junior-nationals","Speedo Summer Juniors (USA Swimming Junior Nationals)","2027-08-02","2027-08-08",elig="Qualified swimmers",venue="Huntsville",tags="national;travel;overnight;qualifier",rev=1,note="Events page: 8/2-8/8. Meet calendar: 8/2-8/6. Used events page."),
]
with open("data/events.csv","w",newline="") as f:
    w=csv.DictWriter(f,H);w.writeheader()
    for x in R: w.writerow(x)
V=[
("EJP","Earl Jackson Pool","Wilmington","NC","750 Bess St, Wilmington, NC 28401","Earl Jackson Pool, 750 Bess St, Wilmington, NC 28401","yes","yes"),
("BCC","Dinah E. Gore Fitness & Aquatics Center (Brunswick CC)","Bolivia","NC","210 College Rd NE, Bolivia, NC 28422","Dinah E. Gore Fitness & Aquatics Center, 210 College Rd NE, Bolivia, NC 28422","no","yes"),
("USC","Carolina Natatorium (Univ. of South Carolina)","Columbia","SC","1300 Wheat St, Columbia, SC 29208","Carolina Natatorium, 1300 Wheat St, Columbia, SC 29208","no","yes"),
("TAC","Triangle Aquatic Center","Cary","NC","275 Convention Dr, Cary, NC 27511","Triangle Aquatic Center, 275 Convention Dr, Cary, NC 27511","no","yes"),
("GAC","Greensboro Aquatic Center","Greensboro","NC","1921 W Gate City Blvd, Greensboro, NC 27403","Greensboro Aquatic Center, 1921 W Gate City Blvd, Greensboro, NC 27403","no","yes"),
("MCAC","Mecklenburg County Aquatic Center","Charlotte","NC","800 E Martin Luther King Jr Blvd, Charlotte, NC 28202","Mecklenburg County Aquatic Center, 800 E Martin Luther King Jr Blvd, Charlotte, NC 28202","no","yes"),
("UNCW","David B. Allen Natatorium (UNCW)","Wilmington","NC","690 Hamilton Dr, Wilmington, NC 28403","David B. Allen Natatorium, 690 Hamilton Dr, Wilmington, NC 28403","no","yes"),
("Indy","IU Natatorium","Indianapolis","IN","901 W New York St, Indianapolis, IN 46202","IU Natatorium, 901 W New York St, Indianapolis, IN 46202","no","yes"),
("UT-Austin","Lee and Joe Jamail Texas Swimming Center","Austin","TX","1900 Red River St, Austin, TX 78712","Lee and Joe Jamail Texas Swimming Center, 1900 Red River St, Austin, TX 78712","no","yes"),
("FAST","FAST (Florida Aquatic Swimming Training)","Ocala","FL","4635 SW 67th Ave Rd, Ocala, FL 34474","4635 SW 67th Ave Rd, Ocala, FL 34474","no","yes"),
("Huntsville","Huntsville Aquatics Center","Huntsville","AL","2213 Drake Ave SW, Huntsville, AL 35805","Huntsville Aquatics Center, 2213 Drake Ave SW, Huntsville, AL 35805","no","yes"),
("TBD","Location TBD","","","","","no","no"),
]
with open("data/venues.csv","w",newline="") as f:
    w=csv.writer(f);w.writerow(["key","name","city","state","address","map_query","home","verified"])
    w.writerows(V)
print(len(R),"events")
