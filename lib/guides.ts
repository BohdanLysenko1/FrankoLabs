export type GuideSection = {
  heading: string;
  body?: string;
  bullets?: string[];
};

export type Guide = {
  /** URL segment under /resources/guides/. */
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  sections: GuideSection[];
};

/** Playbooks & how-tos. Order = display order on /resources/guides. */
export const guides: Guide[] = [
  {
    slug: "pre-launch-checklist",
    title: "The pre-launch website checklist",
    description:
      "Everything to verify before a site goes live — content, technical, SEO and measurement — so launch day is boring in the best way.",
    category: "launch",
    readTime: "6 min",
    sections: [
      {
        heading: "Content and pages",
        body: "Most launch-day embarrassments are content problems, not code problems. Walk every page like a first-time visitor before anyone else does.",
        bullets: [
          "Every page has final copy — no lorem ipsum, no [TODO] brackets, no placeholder images.",
          "Contact details, opening hours and prices are current and consistent across all pages.",
          "Every form has been submitted as a test, and the submission actually arrived somewhere.",
          "Legal pages exist where required: privacy policy, terms, imprint.",
          "Every link has been clicked once. Broken links on day one erode trust fast.",
        ],
      },
      {
        heading: "Technical foundations",
        body: "These take minutes to check and days to live down if you skip them.",
        bullets: [
          "HTTPS works and HTTP redirects to it. No mixed-content warnings in the browser console.",
          "The www and non-www versions of the domain resolve to one canonical address.",
          "A custom 404 page exists and links back to the main site.",
          "Favicons and social share images render correctly — paste a link into a chat app and look.",
          "The site is readable on a phone. Not \"technically responsive\" — actually pleasant.",
        ],
      },
      {
        heading: "SEO basics",
        body: "You don't need an SEO campaign at launch, but you do need to avoid launching invisible.",
        bullets: [
          "Every page has a unique title and meta description that a human would click.",
          "A sitemap.xml exists and robots.txt points to it.",
          "The site is submitted to Google Search Console and the sitemap is registered there.",
          "If this replaces an old site, every old URL 301-redirects to its new equivalent.",
          "Headings follow a sane structure — one h1 per page, sections in order.",
        ],
      },
      {
        heading: "Measurement",
        body: "If you can't see what happens after launch, you can't improve it. Set up measurement before the traffic arrives, not after.",
        bullets: [
          "Analytics is installed and verified with a real visit from your own phone.",
          "Form submissions and key clicks (calls, emails, bookings) are tracked as events.",
          "Uptime monitoring is pointed at the production URL with alerts going somewhere you actually read.",
        ],
      },
      {
        heading: "After launch",
        body: "Launch is the start of the site's life, not the end of the project. The first week tells you more than any review meeting.",
        bullets: [
          "Backups are running on a schedule and you've verified one restore.",
          "Watch analytics and search console for the first week — crawl errors and dead ends show up quickly.",
          "Schedule a 30-day review: what are visitors doing, and what did you get wrong?",
        ],
      },
    ],
  },
  {
    slug: "waas-vs-custom",
    title: "Website as a Service vs. custom project: which fits you",
    description:
      "Two ways to pay for a website — a monthly subscription or an upfront project. How each works, and a simple way to decide.",
    category: "strategy",
    readTime: "5 min",
    sections: [
      {
        heading: "The two models",
        body: "A custom project is the classic model: you pay a larger amount once, and the site is yours to run. Website as a Service (WaaS) flips it: design, build, hosting, maintenance and updates are bundled into one monthly subscription, and the site is kept current for as long as you subscribe.",
      },
      {
        heading: "When the subscription fits",
        bullets: [
          "You want a professional site without a large upfront invoice.",
          "You don't have (and don't want) anyone in-house to handle updates, backups and fixes.",
          "Your site is primarily a storefront: services, proof, contact — and it needs to stay current.",
          "You'd rather have a predictable monthly cost than surprise maintenance bills.",
        ],
      },
      {
        heading: "When a custom project fits",
        bullets: [
          "You need functionality beyond a marketing site — portals, integrations, custom tools.",
          "You have in-house people who will own and evolve the site after handover.",
          "Your brand requires fully bespoke design where a refined system would constrain it.",
          "You have capital budget now and want to minimize recurring costs.",
        ],
      },
      {
        heading: "The honest cost comparison",
        body: "Compare total cost over three years, not sticker prices. A custom site's real cost is the build plus hosting, maintenance, security updates and the redesign you'll eventually need. A subscription looks more expensive per month than \"free after launch\" — until you price what \"free\" actually costs when something breaks. Neither model is universally cheaper; they distribute the same work differently.",
      },
      {
        heading: "A simple decision shortcut",
        body: "Ask one question: who will take care of the site in month 13? If the answer is \"nobody, really,\" a subscription is almost always the right call — an unmaintained site decays into a liability. If the answer is a person or team with time and skills, a custom project gives you the most control. And if you're genuinely unsure, start with a consultation — it's what the first call is for.",
      },
    ],
  },
  {
    slug: "local-seo-afternoon",
    title: "Local SEO in one afternoon",
    description:
      "The 20% of local search work that produces 80% of the results — doable in a single sitting, no agency required.",
    category: "growth",
    readTime: "7 min",
    sections: [
      {
        heading: "Why local is different",
        body: "For a local business, you're not competing with the whole internet — you're competing with a handful of nearby businesses for a map pack and a page of results. That's winnable in an afternoon of focused work, because most of your competitors haven't done even the basics.",
      },
      {
        heading: "Hour one: Google Business Profile",
        body: "Your Business Profile often matters more than your website for local queries. Claim it, then fill in every field like it's your storefront window.",
        bullets: [
          "Verify ownership and choose the most specific category available — \"family law attorney\" beats \"lawyer\".",
          "Add real photos: the storefront, the team, the work. Stock photos are worse than none.",
          "Set accurate hours, including holidays. Wrong hours generate angry one-star reviews.",
          "Write the description around what customers search for, not your mission statement.",
        ],
      },
      {
        heading: "Hour two: consistency check",
        body: "Search engines cross-reference your name, address and phone number (NAP) everywhere they appear. Inconsistencies quietly erode trust in your listing.",
        bullets: [
          "Write down your canonical NAP — exact spelling, suite numbers, phone format.",
          "Fix it on your website footer and contact page first.",
          "Then fix the big directories: Google, Apple Maps, Bing Places, Yelp, Facebook and the main directories for your industry.",
        ],
      },
      {
        heading: "Hour three: your website's local signals",
        bullets: [
          "Put city and service in your homepage title: \"Plumber in Springfield — Same-Day Repairs\" outranks \"Home | Smith & Sons\".",
          "Create or sharpen one page per core service. One page that answers everything beats ten thin ones.",
          "Embed a map and your NAP on the contact page.",
          "Add LocalBusiness structured data if your platform makes it easy — it's a nice-to-have, not a must.",
        ],
      },
      {
        heading: "The ongoing 15 minutes a week: reviews",
        body: "Reviews are the strongest local ranking signal you can influence, and the one customers actually read. Build one tiny habit: after every happy customer interaction, send the direct review link (your Business Profile provides one). Reply to every review, good or bad, in a sentence or two. Steady beats viral — four new reviews a month compounds into dominance in a year.",
      },
      {
        heading: "How to know it worked",
        body: "Check three numbers monthly: your Business Profile's views and calls (built into the profile dashboard), your ranking for \"your service + your city\" searched in an incognito window, and the phone calls or form fills your site tracks. Expect movement in weeks, not days — local SEO is a flywheel, and this afternoon is the first push.",
      },
    ],
  },
  {
    slug: "how-to-brief-a-web-project",
    title: "How to brief a web project",
    description:
      "What to prepare before kicking off a website project — so the result matches what you imagined, on the first try.",
    category: "process",
    readTime: "5 min",
    sections: [
      {
        heading: "Why the brief decides the outcome",
        body: "Most disappointing websites weren't built badly — they were briefed vaguely. \"Modern, clean, like Apple but warmer\" means something different to every person who reads it. A good brief isn't long; it's specific. An hour of preparation here saves weeks of revision rounds later.",
      },
      {
        heading: "Start with the business goal",
        body: "Not \"we need a new website\" — that's the medium. What should the site cause? Pick the single action that matters most; everything else is designed around it.",
        bullets: [
          "\"Generate qualified quote requests from commercial clients.\"",
          "\"Get diners to book a table without calling.\"",
          "\"Make us credible enough to shortlist for enterprise contracts.\"",
        ],
      },
      {
        heading: "Describe the visitor, not yourself",
        body: "Write three sentences about your most valuable visitor: who they are, what situation sends them to your site, and what would make them act. A site for facility managers comparing contractors reads completely differently from one for homeowners in an emergency — even for the same plumbing company.",
      },
      {
        heading: "Inventory your content honestly",
        body: "Content is the most common project delay — not design, not code. Before kickoff, know what exists and what must be created.",
        bullets: [
          "What you have: logo files, photos, service descriptions, testimonials, case studies.",
          "What's missing and who will produce it — writing it yourself always takes longer than planned.",
          "What must carry over from the old site, and what should finally be killed.",
        ],
      },
      {
        heading: "Show taste with examples",
        body: "Collect three to five sites you like and — this is the useful part — note what specifically you like about each: the tone of voice, the way services are presented, the restraint. One \"I like how simple their pricing page is\" is worth more than a mood board. Add one site you dislike, with the reason. Negative examples prevent entire categories of misunderstanding.",
      },
      {
        heading: "State the constraints upfront",
        bullets: [
          "Budget range — a real one. It determines scope more than any other input.",
          "Deadline, and whether it's real (a trade show) or aspirational (\"soon would be nice\").",
          "Brand rules that can't move: colors, fonts, legal wording, compliance requirements.",
          "Who has final sign-off. One decision-maker keeps projects fast; committees need a process.",
        ],
      },
      {
        heading: "Define what success looks like",
        body: "Finish the brief with one line: \"Six months after launch, this project succeeded if …\". If you can't finish that sentence, the project isn't ready to start — and finding that out now is the cheapest discovery you'll ever make.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
