-- Seed content for Neighbors & Nations Christian Church
-- Copied from the live Wix site (neighborsandnations.org) during the rebuild.
-- Apply after sql/schema.sql. Safe to re-run (upsert).
-- Do NOT add private data (staff emails, passwords, sensitive contacts).

-- ----------------------------------------------------------------
-- Site settings
-- ----------------------------------------------------------------
insert into public.nn_settings (key, value) values
  ('church_name',              'Neighbors & Nations Christian Church'),
  ('tagline',                  'Loving our neighbors and the nations'),
  ('vision',                   'Unleashing the priesthood to make disciples who make disciples and plant churches that plant churches — to our neighbors and to the nations.'),
  ('address',                  '6575 Crescent Ave., Buena Park, CA 90620'),
  ('service_times',            'Sundays at 9:30 AM'),
  ('kids_blurb',               'n2 Kids classes available every Sunday; Awana on Wednesdays'),
  ('youtube_url',              'https://www.youtube.com/@NeighborsAndNations'),
  ('instagram_url',            'https://www.instagram.com/neighborsandnations'),
  ('text_to_give_number',      '84321')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ----------------------------------------------------------------
-- Pages
-- ----------------------------------------------------------------

-- Home
insert into public.nn_pages (slug, title, body, is_public, show_in_nav, sort) values (
  'home', 'Home',
$$
Join us as we gather — **Sundays at 9:30 AM**

6575 Crescent Ave., Buena Park, CA 90620

n2 Kids classes available · [YouTube Livestream](https://www.youtube.com/@NeighborsAndNations)

---

**House Churches** meet Monday–Friday in various locations. [Connect with us](#/contact) to find one near you.
$$,
  true, false, 0
) on conflict (slug) do update
  set title = excluded.title, body = excluded.body, updated_at = now();

-- About
insert into public.nn_pages (slug, title, body, is_public, show_in_nav, sort) values (
  'about', 'About',
$$
## About Us

Neighbors and Nations Christian Church was established in May of 2021 with the heart to pursue and be obedient to the Great Commission. Our desire is to unleash the priesthood to make disciples who make disciples and plant churches that plant churches — both to our neighbors (where we live, work, and play) and to the nations. We seek obedience through the Word and through God's Spirit as we desire to become more like Him.

---

## Beliefs & Values

See how we view God, Jesus, the Bible, man, and other foundations of faith. Firmly rooted in Scripture, our beliefs guide our church. [Read our full statement of faith.](#/beliefs)

---

## Church Leadership

Meet the team who set the vision for Neighbors and Nations. [Learn more.](#/leadership)

---

## Messages

Sunday mornings are full of Scripture-rich teaching and worship. Watch our current series or dive into the archives on [YouTube](https://www.youtube.com/@NeighborsAndNations).
$$,
  true, true, 10
) on conflict (slug) do update
  set title = excluded.title, body = excluded.body, updated_at = now();

-- Beliefs
insert into public.nn_pages (slug, title, body, is_public, show_in_nav, sort) values (
  'beliefs', 'Beliefs',
$$
## Our Beliefs

See how we view God, Jesus, the Bible, man, and many significant aspects of our faith.

---

### The Godhead

We believe in one God who eternally exists as the Godhead, or Trinity, consisting of three Persons: the Father, the Son, and the Holy Spirit (Deuteronomy 6:4; Matthew 28:19). We believe God the Father, the Son, and the Holy Spirit are fully divine and are distinct Persons. The three Persons of the Trinity are co-equal, co-eternal, one in essence and power and united in action (John 10:29–30; Hebrews 1:1–3).

---

### God's Word

We believe that the Bible is the complete written Word of God, sixty-six books in the Old and New Testaments, that each and every word in the original manuscripts was inspired by God, and therefore completely without error. It is authoritative, living, active, relevant, and unchanging (2 Timothy 3:16–17; 2 Peter 1:19–21; Romans 15:4; Hebrews 4:12).

---

### Spiritual Forces

We believe that there is a spiritual battle taking place, and that Christians are involved in this battle (Ephesians 6:12). We believe that angels were originally created as holy creatures, but now exist as fallen angels called demons and un-fallen angels (Psalm 148:2–5; Jude 1:6). Satan is a fallen angel who, with other demonic forces, opposes the One True God (Job 1:6; Luke 10:8). Satan and his demons have already been defeated and will be punished by being cast into the lake of fire (Revelation 20:14–15).

---

### Sin

We believe that sin is the breaking of any part of God's revealed standard. Since Adam's rebellion, sin nature continues to be passed down (Genesis 2:16–17; 3:1–10; Romans 5:12). Every human is thus born a sinner, causing any intimate relationship with God to be severed, leading to separation from Him (Romans 3:23; 6:23; Galatians 6:7–8; Revelation 21:8).

---

### Salvation

We believe that salvation is the free gift of God brought to us by His grace and received by personal faith in Christ alone (John 3:16; Ephesians 2:8–9). Christ died as a sinless substitute for the forgiveness of sins, rising again from the dead for people of all ages and times (1 Peter 1:17–21; 1 Corinthians 15:1–4; Ephesians 1:7). Salvation is apart from any sacraments, good works, or human merit (Romans 3:20; Ephesians 2:8–9). All who receive this salvation are freed from the ultimate result of sin and are spiritually born into permanent membership in the family of God (2 Corinthians 5:17; Romans 8:38–39).

---

### Christian Life

We believe that every believer is to pursue a life of righteousness and good works, to exhibit the fruit and fullness of the Spirit (Romans 12:1–2; Galatians 5:16–23; Ephesians 2:8–10), and to fulfill the Great Commission in making disciples of every nation (Matthew 28:19–20; Acts 1:8).

---

### The Church

We believe that all believers are members of the Body of Christ, the Church, which Christ is building (Matthew 16:18). This Body is present on earth in local churches where believers should assemble for teaching, fellowship, prayer, and ministry where each believer is practicing their spiritual gift(s) (Acts 2:42; Hebrews 10:24–25; Colossians 3:16). This local church observes the symbolical practices of believer baptism and communion (Matthew 28:19–20; John 13:1–17). Our body of believers is led by a team of God-appointed elders, shepherds, and deacons who, in submission to Christ, seek to lead and shepherd the Body in accordance with God's Word (Acts 20:28; 1 Peter 5:2–3).

---

### Governing Authorities

We believe that along with the institution of the Church, God has established the institution of government and the family (1 Peter 2:13–17). We believe that Christians are to be subject to the rulers and authorities that God has placed over them and are to obey those authorities in all things unless it requires direct disobedience to God (Romans 13:1–7; Mark 12:13–17).

---

### Humanity

We believe that all people are created in God's own image (Genesis 1:26–28), but from the time of Adam's rebellion (Genesis 3:1–24) all human beings are now born with a sinful nature, resulting in spiritual and physical death (Romans 5:12; 6:23), unable to save themselves (Romans 3:9–25).

---

### Family

We believe that God has established the family and has given equal value, but specific roles, to husbands, wives, and children (Ephesians 5:21–33; 6:4; Exodus 20:12).

---

### Future Life

We believe in the blessed hope of the imminent return of Christ for His Church. We believe the Biblical description of an eternal state of punishment for the unsaved in hell and an eternal state of blessing for the saved in heaven (Matthew 25:31–46; John 14:1–3; Revelation 20:11–15; 1 Thessalonians 4:17; Titus 2:13).
$$,
  true, false, 15
) on conflict (slug) do update
  set title = excluded.title, body = excluded.body, updated_at = now();

-- Ministries
insert into public.nn_pages (slug, title, body, is_public, show_in_nav, sort) values (
  'ministries', 'Ministries',
$$
## Ministries

We are a Jesus-worshipping community that equips and unleashes Christ followers to make disciples and plant churches to impact our neighbors and the nations. Each of our ministries works to accomplish that vision.

---

### Outreach

Whether it's to our neighbors or the nations, we seek and serve Jesus where we're at. [Learn more about our local and global partners.](#/outreach)

---

### Middle & High School — The Pier Youth

The Pier Youth creates a space for your students to learn how to love God and love others while being poured into by staff who love them.

---

### Children's Ministry — n2 Kids

n2 Kids is our Children's Ministry. There are a number of different opportunities to get your kids involved — classes are available every Sunday morning.

---

### Start a Ministry

We realize Neighbors & Nations may not have a specific ministry you're looking for. We want to come alongside and support what God puts on your heart. If you feel led to start a ministry, [contact us](#/contact) and our leadership team will get in touch with you.
$$,
  true, true, 30
) on conflict (slug) do update
  set title = excluded.title, body = excluded.body, updated_at = now();

-- Outreach
insert into public.nn_pages (slug, title, body, is_public, show_in_nav, sort) values (
  'outreach', 'Outreach',
$$
## Outreach

Our heart beats for what God's does. We know that when Jesus returns every knee will bow and every tongue will confess He is Lord. We get to play a part in bringing His Kingdom to earth, around the world. These ministries have local and global impact.

---

### Local Partners

There are many organizations and ministries locally that have the same heart as Neighbors & Nations. We partner with and support them in their Kingdom work right here in our community.

---

### Global Outreach

Why should we care about reaching the nations? It's God's heart! Learn more about how Neighbors & Nations participates in Kingdom work throughout the nations.

---

### Supported Missionaries

We have people who are a part of our church family scattered throughout the world working as missionaries. It's an honor to have sent them and continue to support them.

---

### Missions Opportunities

Whether short term or long term, we love being able to send people out to be obedient to God's call to take the Good News to the corners of the Earth. We create opportunities to GO with the Gospel into the nations.

**Ethiopia** — We have a rich history of working with our long-term partners in Ethiopia to preach the Gospel and raise up the Church.
$$,
  true, false, 35
) on conflict (slug) do update
  set title = excluded.title, body = excluded.body, updated_at = now();

-- Sundays
insert into public.nn_pages (slug, title, body, is_public, show_in_nav, sort) values (
  'sundays', 'Sundays',
$$
## Plan Your Sunday

We meet every Sunday at **9:30 AM** at 6575 Crescent Ave., Buena Park, CA 90620.

**n2 Kids** classes are available during the service for children.

Can't make it in person? Join us on the [YouTube Livestream](https://www.youtube.com/@NeighborsAndNations).

---

## What to Expect

Sunday mornings are full of Scripture-rich teaching and worship. We gather as a family to learn from God's Word, sing together, pray, and encourage one another.

---

## Messages

Missed a Sunday? All our messages are on [YouTube](https://www.youtube.com/@NeighborsAndNations). Dive into our current series or browse the archives.
$$,
  true, true, 20
) on conflict (slug) do update
  set title = excluded.title, body = excluded.body, updated_at = now();

-- Give
insert into public.nn_pages (slug, title, body, is_public, show_in_nav, sort) values (
  'give', 'Give',
$$
## Give

We are completely humbled at what God is working in and through His church! By giving to the mission God is working through Neighbors and Nations, you are investing in the eternity of lives in our community and around the world. Thank you for joyfully partnering with us in making a difference in people's lives!

---

### Online

Give securely online — set up a one-time gift, schedule recurring donations, or view your giving history. You can give directly from your bank account or with a debit or credit card.

### Text-to-Give

Text your giving amount to **84321**. First-time donors will be prompted to enter billing info. A confirmation text is sent before every gift is processed.

*Example: text "$25" to give $25 to the General Offering fund.*

### On Campus

Giving boxes are available in the lobby during services. Envelopes are provided for cash or check. You may also drop off a donation at the church (Monday–Thursday) or mail a check to 6575 Crescent Ave., Buena Park, CA 90620.
$$,
  true, true, 60
) on conflict (slug) do update
  set title = excluded.title, body = excluded.body, updated_at = now();

-- Prayer
insert into public.nn_pages (slug, title, body, is_public, show_in_nav, sort) values (
  'prayer', 'Prayer',
$$
## Prayer

We believe in the power of prayer and would love to pray with you. Use the form below to share how we can be praying for you. Requests go only to our staff and prayer team.
$$,
  true, true, 50
) on conflict (slug) do update
  set title = excluded.title, body = excluded.body, updated_at = now();

-- Contact
insert into public.nn_pages (slug, title, body, is_public, show_in_nav, sort) values (
  'contact', 'Contact',
$$
## Contact Us

We'd love to hear from you! Reach out using the information below.

**Address:** 6575 Crescent Ave., Buena Park, CA 90620

Office hours: Monday–Thursday
$$,
  true, true, 70
) on conflict (slug) do update
  set title = excluded.title, body = excluded.body, updated_at = now();
