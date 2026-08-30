"use client";

import { useEffect, useMemo, useState } from "react";

type Result = "pass" | "attention" | "unsure" | "na";
type Answer = { result?: Result; note?: string; value?: string; selections?: string[]; questionTitle?: string };
type Source = { label: string; sections: string; href?: string };
type ResponseType = "status" | "yesno" | "text" | "number" | "time" | "multi";
type Check = { id: string; title: string; prompt?: string; measure?: string; why?: string; critical?: boolean; source: Source; responseType?: ResponseType; options?: string[] };
type Section = { id: string; name: string; short: string; intro: string; checks: Check[] };
type ModuleId = "physical" | "event" | "digital" | "voting";
type CheckupModule = {
  id: ModuleId; version: string; name: string; description: string; meta: string; eyebrow: string; title: string; lede: string;
  notice: string; subjectLabel: string; subjectPlaceholder: string; locationLabel: string; locationPlaceholder: string;
  prep: string[]; sourceNote: string; sections: Section[];
};
type CheckupRef = { id: string; token: string };
type SaveState = "idle" | "saving" | "saved" | "error";

const physicalSections: Section[] = [
  {
    id: "parking", name: "Parking", short: "Park",
    intro: "Begin at the parking space or passenger drop-off most likely to be used by a disabled visitor.",
    checks: [
      { id: "p1", title: "Accessible space is provided", prompt: "Is at least one marked accessible parking space available near the accessible entrance?", why: "People need a safe place to transfer from a vehicle and begin the accessible route.", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 208.2, 208.3.1", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#208-parking-spaces" } },
      { id: "p2", title: "Van space is identified", prompt: "Is at least one accessible space marked “Van Accessible”?", measure: "Look for a mounted accessibility sign plus a van designation.", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 208.2.4, 502.6", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#502-parking-spaces" } },
      { id: "p3", title: "Space and aisle are wide enough", prompt: "Does the space have a clearly marked access aisle beside it? An access aisle is usually painted with hatching to deter parking.", measure: "Quick check: the aisle should be at least 5 ft wide; a van aisle is typically 8 ft, or 5 ft beside an 11 ft van space.", source: { label: "2010 ADA Standards", sections: "§§ 502.2, 502.3", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#502-parking-spaces" } },
      { id: "p4", title: "Surface is firm and level", prompt: "Are the parking space and access aisle stable (preferably paved), slip-resistant, and nearly level?", measure: "A 2% level bubble or digital reading is the quick maximum-slope check.", source: { label: "2010 ADA Standards", sections: "§§ 302.1, 502.4", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#502-parking-spaces" } },
      { id: "p5", title: "Aisle joins the route", prompt: "Can someone leave the access aisle without entering traffic and immediately reach the accessible route? How difficult is it to get from the parking space to the route?", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 208.3.1, 502.3.3", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#502-parking-spaces" } },
    ],
  },
  {
    id: "arrival", name: "Arrival route", short: "Route", 
    intro: "Follow the actual path from parking or drop-off to the entrance. Look at the whole trip, not an isolated sidewalk segment.",
    checks: [
      { id: "a1", title: "Continuous step-free route", prompt: "Is there a continuous route to the entrance with no stairs, curbs, or abrupt level changes?", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 206.2.1, 402.2, 303", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#chapter-4-accessible-routes" } },
      { id: "a2", title: "Route is wide enough", prompt: "Is the clear walking surface generally at least 36 inches wide?", measure: "Measure the narrowest point, allowing only short, limited pinch points.", source: { label: "2010 ADA Standards", sections: "§ 403.5.1", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#403-walking-surfaces" } },
      { id: "a3", title: "Surface is usable", prompt: "Is the route firm, stable, slip-resistant, and free of broken pavement, loose gravel, or large gaps?", source: { label: "2010 ADA Standards", sections: "§§ 302.1, 302.3, 403.2", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#302-floor-or-ground-surfaces" } },
      { id: "a4", title: "Slope is manageable", prompt: "Is the route gentle, or properly built as a ramp where it is steeper?", measure: "Walking route: 1:20 (5%) max. Ramp: 1:12 (8.33%) max, with landings and handrails where required.", source: { label: "2010 ADA Standards", sections: "§§ 403.3, 405.2", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#405-ramps" } },
      { id: "a5", title: "Head and cane clearance", prompt: "Is the route free of low branches, signs, and wall-mounted objects that could be head or cane hazards?", measure: "Overhead clearance: 80 in minimum. Objects with leading edges 27–80 in high should not project more than 4 in.", source: { label: "2010 ADA Standards", sections: "§§ 307.2–307.4", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#307-protruding-objects" } },
    ],
  },
  {
    id: "entrance", name: "Entrance", short: "Entry",
    intro: "Check the entrance a visitor is expected to use, including the doorway, hardware (the door handle), threshold, and space on both sides.",
    checks: [
      { id: "e1", title: "Accessible entrance is obvious", prompt: "Is the main entrance accessible, or do clear signs direct people to an equally usable accessible entrance?", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 206.4, 216.6", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#206-accessible-routes" } },
      { id: "e2", title: "Door opening is clear", prompt: "Does at least one door provide a clear opening of 32 inches or more?", measure: "Open the door 90°. Measure from the door face to the stop—not jamb to jamb.", critical: true, source: { label: "2010 ADA Standards", sections: "§ 404.2.3", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#404-doors-doorways-and-gates" } },
      { id: "e3", title: "Threshold is low", prompt: "Is the threshold 1/2 inch high or less, with no abrupt edge over 1/4 inch?", measure: "Use a small tape measure at the highest point.", source: { label: "2010 ADA Standards", sections: "§§ 303.2, 303.3, 404.2.5", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#404-doors-doorways-and-gates" } },
      { id: "e4", title: "Hardware is easy to use", prompt: "Can the latch or handle be operated with one hand without tight grasping, pinching, or twisting?", source: { label: "2010 ADA Standards", sections: "§§ 309.4, 404.2.7", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#404-doors-doorways-and-gates" } },
      { id: "e5", title: "Door can be opened", prompt: "Can a visitor approach, open, and pass through the door without excessive force or the door closing too quickly?", why: "A compliant-width door can still be unusable when maneuvering space or opening force is poor.", source: { label: "2010 ADA Standards", sections: "§§ 404.2.4, 404.2.8, 404.2.9", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#404-doors-doorways-and-gates" } },
    ],
  },
  {
    id: "restrooms", name: "Restrooms", short: "Toilet", 
    intro: "Check one public restroom intended to be accessible. If several serve the same area, note which one you reviewed.",
    checks: [
      { id: "r1", title: "Accessible restroom is available", prompt: "Is at least one accessible public restroom available, with direction signs if needed?", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 213.2, 216.8", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#213-toilet-facilities-and-bathing-facilities" } },
      { id: "r2", title: "Doorway and route work", prompt: "Is there a step-free route and at least 32 inches of clear door opening into the restroom?", measure: "Check mats, trash cans, and stored items as well as the permanent doorway.", source: { label: "2010 ADA Standards", sections: "§§ 213.2, 404.2.3", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#213-toilet-facilities-and-bathing-facilities" } },
      { id: "r3", title: "Room has turning space", prompt: "Is there enough clear floor area for a wheelchair to turn and approach the fixtures?", measure: "Quick check: look for a 60 in turning circle or a usable T-shaped turning space.", source: { label: "2010 ADA Standards", sections: "§§ 304.3, 603.2.1", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#603-toilet-and-bathing-rooms" } },
      { id: "r4", title: "Toilet transfer space is clear", prompt: "Is there clear space beside the toilet, with no trash can or fixture blocking a side transfer?", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 604.3.1, 604.3.2", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#604-water-closets-and-toilet-compartments" } },
      { id: "r5", title: "Grab bars are present", prompt: "Are secure grab bars installed behind and beside the toilet, and free of obstructions?", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 604.5, 609", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#604-water-closets-and-toilet-compartments" } },
      { id: "r6", title: "Sink and controls are reachable", prompt: "Can a wheelchair user approach the sink, use the faucet, soap, and hand-drying equipment?", measure: "Quick reach check: operable parts should generally be no higher than 48 in; pipes below the sink should be protected.", source: { label: "2010 ADA Standards", sections: "§§ 308, 309.4, 606.2–606.5", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#606-lavatories-and-sinks" } },
    ],
  },
  {
    id: "services", name: "Access to services", short: "Service", 
    intro: "Travel from the entrance to the primary service, transaction, meeting, dining, or waiting area a visitor uses.",
    checks: [
      { id: "s1", title: "Services are on an accessible route", prompt: "Can a visitor reach the primary goods, services, and public spaces without stairs or blocked aisles?", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 206.2.4, 206.3, 402", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#206-accessible-routes" } },
      { id: "s2", title: "Interior route stays clear", prompt: "Are aisles generally at least 36 inches wide and free of furniture, displays, cords, or stored items?", source: { label: "2010 ADA Standards", sections: "§§ 302.1, 403.5.1", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#403-walking-surfaces" } },
      { id: "s3", title: "A usable service surface exists", prompt: "Is there a lowered counter, table, or equivalent way for a seated visitor to complete the main transaction?", measure: "A common quick check is a counter segment no higher than 36 in, or an accessible table with knee space.", source: { label: "2010 ADA Standards", sections: "§§ 226.1, 227.3, 902, 904.4", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#904-check-out-aisles-and-sales-and-service-counters" } },
      { id: "s4", title: "Seating choices are inclusive", prompt: "Where seating is offered, are wheelchair spaces integrated with companion seating and tables usable by seated visitors?", source: { label: "2010 ADA Standards", sections: "§§ 226.1, 226.2, 902", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#226-dining-surfaces-and-work-surfaces" } },
      { id: "s5", title: "Controls and information are reachable", prompt: "Are check-in devices, dispensers, buttons, forms, and other essentials within reach and usable without tight grasping?", measure: "Quick reach check: highest operable part generally 48 in maximum when the approach is clear.", source: { label: "2010 ADA Standards", sections: "§§ 205.1, 308, 309.4", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#309-operable-parts" } },
    ],
  },
];

const eventSections: Section[] = [
  {
    id: "event-planning", name: "Planning and requests", short: "Plan",
    intro: "Start with the information people receive before the event and how your team will respond when access needs arise.",
    checks: [
      { id: "v1", title: "An accessibility contact is easy to find", prompt: "Do invitations and registration materials name a person or method for requesting disability-related accommodations?", critical: true, why: "Give people a direct, private way to describe what they need, and allow reasonable lead time without making advance notice an absolute condition of access.", source: { label: "ADA Effective Communication", sections: "Notice and requests", href: "https://www.ada.gov/resources/effective-communication/" } },
      { id: "v2", title: "Access information is shared in advance", prompt: "Do event details explain accessible arrival, entrance, seating, restroom, and communication options?", why: "Specific information helps attendees plan independently and avoids forcing people to disclose a disability just to learn whether the event is usable.", source: { label: "ADA Web Guidance", sections: "Equal access to online services", href: "https://www.ada.gov/resources/web-guidance/" } },
      { id: "v3", title: "Staff know how to respond", prompt: "Have event staff been told who handles access requests, where accessible features are, and how to get help without delaying the attendee?", critical: true, source: { label: "ADA Effective Communication", sections: "Choosing aids and services", href: "https://www.ada.gov/resources/effective-communication/" } },
      { id: "v4", title: "Service animals are included", prompt: "Do event rules and staff practices allow service animals in areas open to attendees, without requiring certification or special identification?", source: { label: "ADA Service Animals", sections: "General rules", href: "https://www.ada.gov/topics/service-animals/" } },
    ],
  },
  {
    id: "event-arrival", name: "Arrival and venue", short: "Arrive",
    intro: "Follow the attendee journey from the arrival point to registration, seating, activities, refreshments, and restrooms.",
    checks: [
      { id: "v5", title: "The event has a step-free route", prompt: "Can attendees travel from accessible parking or drop-off to every public event area without stairs, blocked paths, or abrupt level changes?", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 206.2.1, 206.2.4, 402", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#206-accessible-routes" } },
      { id: "v6", title: "Doors and aisles stay clear", prompt: "Are entrances and circulation paths wide enough and kept free of tables, cords, displays, and stored items?", measure: "Quick check: walking routes are generally 36 in minimum; door clear openings are generally 32 in minimum.", source: { label: "2010 ADA Standards", sections: "§§ 403.5.1, 404.2.3", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#403-walking-surfaces" } },
      { id: "v7", title: "Seating offers real choices", prompt: "Are wheelchair spaces integrated with companion seating and available at more than one useful location or price level when applicable?", critical: true, source: { label: "2010 ADA Standards", sections: "§§ 221, 802", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#221-assembly-areas" } },
      { id: "v8", title: "An accessible restroom is available", prompt: "Can attendees reach and use an accessible restroom without leaving the event area or taking an unreasonable route?", source: { label: "2010 ADA Standards", sections: "§§ 213, 603–606", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#213-toilet-facilities-and-bathing-facilities" } },
    ],
  },
  {
    id: "event-participation", name: "Participation", short: "Join",
    intro: "Check whether people can take part in the event itself—not merely enter the room.",
    checks: [
      { id: "v9", title: "Registration and check-in are usable", prompt: "Can a seated attendee reach the check-in surface, complete required steps, and receive the same information as everyone else?", source: { label: "2010 ADA Standards", sections: "§§ 308, 309.4, 904.4", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#904-check-out-aisles-and-sales-and-service-counters" } },
      { id: "v10", title: "Activities have an accessible option", prompt: "Can disabled attendees participate in the main activities, demonstrations, networking, and audience interaction without being separated or offered a lesser experience?", critical: true, source: { label: "ADA Title III Regulations", sections: "§ 36.302 Reasonable modifications", href: "https://www.ada.gov/law-and-regs/regulations/title-iii-regulations/#subpart-c" } },
      { id: "v11", title: "Stages and presentation areas are reachable", prompt: "If attendees or presenters may use a stage or performance area, is there an accessible route to it?", source: { label: "2010 ADA Standards", sections: "§ 206.2.6", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#206-accessible-routes" } },
      { id: "v12", title: "Food and service areas are usable", prompt: "Can attendees reach refreshments, dining surfaces, information tables, and service counters, with assistance available where self-service is not usable?", source: { label: "2010 ADA Standards", sections: "§§ 226, 902, 904", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#226-dining-surfaces-and-work-surfaces" } },
    ],
  },
  {
    id: "event-communication", name: "Communication", short: "Comms",
    intro: "Review spoken, visual, printed, and emergency information. The right aid depends on the person and the communication involved.",
    checks: [
      { id: "v13", title: "Requested communication aids are arranged", prompt: "When needed, can the event provide appropriate aids such as qualified interpreters, real-time captions, large print, accessible electronic materials, or a reader?", critical: true, source: { label: "ADA Effective Communication", sections: "Auxiliary aids and services", href: "https://www.ada.gov/resources/effective-communication/" } },
      { id: "v14", title: "Assistive listening is available", prompt: "Where amplified audible communication is integral to an assembly area, is an assistive listening system available and clearly identified?", source: { label: "2010 ADA Standards", sections: "§§ 216.10, 219, 706", href: "https://www.ada.gov/law-and-regs/design-standards/2010-stds/#219-assistive-listening-systems" } },
      { id: "v15", title: "Presenters make information perceivable", prompt: "Are microphones used, important visuals described aloud, and essential spoken information also available visually when needed?", why: "One format rarely works for everyone. Match the aid or service to the nature and complexity of the communication and the attendee's usual method.", source: { label: "ADA Effective Communication", sections: "Effective communication provisions", href: "https://www.ada.gov/resources/effective-communication/" } },
      { id: "v16", title: "Emergency messages reach everyone", prompt: "Can urgent instructions be communicated both audibly and visually, and do staff know how to assist attendees without separating them unnecessarily?", critical: true, source: { label: "ADA Effective Communication", sections: "Communication aids and services", href: "https://www.ada.gov/resources/effective-communication/" } },
    ],
  },
];

const digitalSections: Section[] = [
  {
    id: "digital-structure", name: "Structure and meaning", short: "Structure",
    intro: "Review one important page or task. Start with whether its purpose and organization still make sense without relying on visual layout alone.",
    checks: [
      { id: "d1", title: "The page has a useful title", prompt: "Does the browser or document title identify the page's topic or purpose?", source: { label: "WCAG 2.2", sections: "SC 2.4.2 Page Titled", href: "https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html" } },
      { id: "d2", title: "Headings describe the content", prompt: "Do headings and labels clearly describe each section, and are heading levels used in a sensible order?", critical: true, source: { label: "WCAG 2.2", sections: "SC 1.3.1 and 2.4.6", href: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html" } },
      { id: "d3", title: "Images have useful text alternatives", prompt: "Do meaningful images have concise alternative text, while decorative images are ignored by assistive technology?", critical: true, source: { label: "WCAG 2.2", sections: "SC 1.1.1 Non-text Content", href: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html" } },
      { id: "d4", title: "Links make sense in context", prompt: "Can someone understand where each link goes from its link text and surrounding context, without vague labels such as “click here”?", source: { label: "WCAG 2.2", sections: "SC 2.4.4 Link Purpose", href: "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html" } },
    ],
  },
  {
    id: "digital-visual", name: "Visual access", short: "Visual",
    intro: "Check whether content remains readable for people with low vision, color-vision differences, or a need to magnify the interface.",
    checks: [
      { id: "d5", title: "Text contrast is strong enough", prompt: "Does regular text have sufficient contrast against its background, including text inside buttons and form controls?", measure: "Quick target: 4.5:1 for normal text and 3:1 for large text under WCAG AA.", critical: true, source: { label: "WCAG 2.2", sections: "SC 1.4.3 Contrast (Minimum)", href: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" } },
      { id: "d6", title: "Meaning does not depend on color alone", prompt: "When color signals an error, status, required field, or selected item, is there also text, an icon, a pattern, or another cue?", source: { label: "WCAG 2.2", sections: "SC 1.4.1 Use of Color", href: "https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html" } },
      { id: "d7", title: "Text can be enlarged", prompt: "Can text be zoomed to 200% without losing content or essential functionality?", source: { label: "WCAG 2.2", sections: "SC 1.4.4 Resize Text", href: "https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html" } },
      { id: "d8", title: "The layout reflows when zoomed", prompt: "At a narrow mobile width or high zoom, can people read and operate the content without two-dimensional scrolling, clipping, or overlap?", critical: true, source: { label: "WCAG 2.2", sections: "SC 1.4.10 Reflow", href: "https://www.w3.org/WAI/WCAG22/Understanding/reflow.html" } },
    ],
  },
  {
    id: "digital-interaction", name: "Keyboard and interaction", short: "Interact",
    intro: "Put the mouse or touchscreen aside and try the page using Tab, Shift+Tab, Enter, Space, and arrow keys where appropriate.",
    checks: [
      { id: "d9", title: "Everything works with a keyboard", prompt: "Can every interactive element and task be reached and operated without a mouse or touchscreen?", critical: true, source: { label: "WCAG 2.2", sections: "SC 2.1.1 Keyboard", href: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html" } },
      { id: "d10", title: "Keyboard focus is easy to see", prompt: "As focus moves, is there a clear visible indicator showing which link, button, field, or control is active?", critical: true, source: { label: "WCAG 2.2", sections: "SC 2.4.7 Focus Visible", href: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html" } },
      { id: "d11", title: "Focus is not hidden", prompt: "When a control receives keyboard focus, is it at least partly visible rather than covered by a sticky header, cookie banner, or modal?", source: { label: "WCAG 2.2", sections: "SC 2.4.11 Focus Not Obscured", href: "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html" } },
      { id: "d12", title: "Touch targets are large enough", prompt: "Are buttons, links, and other pointer targets reasonably sized and spaced so they are not easy to activate by mistake?", measure: "WCAG 2.2 AA generally calls for a 24 by 24 CSS pixel target or sufficient spacing, with specific exceptions.", source: { label: "WCAG 2.2", sections: "SC 2.5.8 Target Size (Minimum)", href: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html" } },
    ],
  },
  {
    id: "digital-forms", name: "Forms, media, and feedback", short: "Complete",
    intro: "Try the most important form or transaction and sample any audio or video that people need to understand.",
    checks: [
      { id: "d13", title: "Fields have persistent labels and instructions", prompt: "Does every form control have a clear label, with required formats or instructions provided before they are needed?", critical: true, source: { label: "WCAG 2.2", sections: "SC 1.3.1 and 3.3.2", href: "https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html" } },
      { id: "d14", title: "Errors are identified and explained", prompt: "When a submission fails, does the interface identify the affected field and explain in text what needs to be corrected?", source: { label: "WCAG 2.2", sections: "SC 3.3.1 and 3.3.3", href: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html" } },
      { id: "d15", title: "Status changes are announced", prompt: "Do success messages, errors, loading updates, and changed results reach screen-reader users without unexpectedly moving focus?", source: { label: "WCAG 2.2", sections: "SC 4.1.3 Status Messages", href: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html" } },
      { id: "d16", title: "Prerecorded video has captions", prompt: "Does prerecorded video with meaningful speech provide accurate synchronized captions, and is essential visual information described or otherwise available?", critical: true, source: { label: "WCAG 2.2", sections: "SC 1.2.2 and 1.2.5", href: "https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html" } },
    ],
  },
];

const riSurveySource = (sections: string): Source => ({ label: "2026 Volunteer On-Site Polling Place Survey", sections });

const votingSections: Section[] = [
  {
    id: "voting-outside", name: "Section Two - Outside the Polling Place", short: "Outside",
    intro: "Complete every item while approaching and entering the polling place.",
    checks: [
      { id: "ri1", title: "Are there “Vote Here” signs visible from the street?", responseType: "yesno", source: riSurveySource("Section Two, Question 1") },
      { id: "ri2", title: "Does this polling place have at least one accessible van parking space and one standard car parking space on a surface that is stable, firm, and slip resistant?", responseType: "yesno", source: riSurveySource("Section Two, Question 2") },
      { id: "ri3", title: "If no Specify", responseType: "text", source: riSurveySource("Section Two, Question 3") },
      { id: "ri4", title: "Is there vertical signage for all accessible spaces, including “van identification”?", responseType: "yesno", source: riSurveySource("Section Two, Question 4") },
      { id: "ri5", title: "Is there a shared access aisle or access aisle for each accessible space?", responseType: "yesno", source: riSurveySource("Section Two, Question 5") },
      { id: "ri6", title: "Is the polling place entrance clearly marked?", responseType: "yesno", source: riSurveySource("Section Two, Question 6") },
      { id: "ri7", title: "Is the accessible entrance sign displayed at the voter entrance?", responseType: "yesno", source: riSurveySource("Section Two, Question 7") },
      { id: "ri8", title: "Is the accessible voter entrance at the same address provided by the Board of Elections?", responseType: "yesno", source: riSurveySource("Section Two, Question 8") },
      { id: "ri9", title: "Is the accessible entrance the only entrance being used at this polling place?", responseType: "yesno", source: riSurveySource("Section Two, Question 9") },
      { id: "ri10", title: "Is there an accessible route (no steps and at least 36 inches wide) from the accessible parking area to the accessible voter entrance?", responseType: "yesno", source: riSurveySource("Section Two, Question 10") },
      { id: "ri11", title: "If not, please place a check mark for any issue you see:", responseType: "multi", options: [
        "Path is not 36 inches wide",
        "There is no curb cut where one is needed from the accessible parking to the entrance",
        "Walkway is cracked so that a person using a wheelchair would not be able to travel",
        "There is a door that does not have hardware that is useable with one hand without the need for tight grasping, pinching, or twisting of the wrist",
        "Other",
      ], source: riSurveySource("Section Two, Question 11") },
      { id: "ri12", title: "Does the accessible voter entrance have a clear width of at least 32 inches minimum when measured from the face of the door to the door jamb?", responseType: "yesno", source: riSurveySource("Section Two, Question 12") },
    ],
  },
  {
    id: "voting-inside", name: "Section Three - Inside the Polling Place", short: "Inside",
    intro: "Complete every item after entering the polling place.",
    checks: [
      { id: "ri13", title: "Is there an accessible route from the voter entrance to the voting area (no steps and at least 36’ wide)?", responseType: "yesno", source: riSurveySource("Section Three, Question 13") },
      { id: "ri14", title: "Do the doors to the voting area have a clear width of at least 32 inches minimum when measured from the face of the door to the door jamb?", responseType: "yesno", source: riSurveySource("Section Three, Question 14") },
      { id: "ri15", title: "Is there an accessible voting booth? (a voting booth at wheelchair height.)", responseType: "yesno", source: riSurveySource("Section Three, Question 15") },
      { id: "ri16", title: "Is the ExpressVote terminal present and operational?", responseType: "yesno", source: riSurveySource("Section Three, Question 16") },
      { id: "ri17", title: "Is the ExpressVote positioned for privacy (so other people can't look at the screen)?", responseType: "yesno", source: riSurveySource("Section Three, Question 17") },
      { id: "ri18", title: "Are voters without disabilities encouraged to use the ExpressVote?", responseType: "yesno", source: riSurveySource("Section Three, Question 18") },
      { id: "ri19", title: "How many voters have used the ExpressVote during the election so far?", responseType: "number", source: riSurveySource("Section Three, Question 19") },
      { id: "ri20", title: "At what time did you ask for the number of voters who used the ExpressVote?", responseType: "time", source: riSurveySource("Section Three, Question 20") },
    ],
  },
];

const modules: Record<ModuleId, CheckupModule> = {
  physical: {
    id: "physical", version: "2026.1", name: "Likely physical barriers", description: "Walk through parking, arrival, entrances, restrooms, and access to services.", meta: "About 20 minutes · 26 checks",
    eyebrow: "QUICK 20-MINUTE SITE CHECK-UP", title: "Likely physical barriers to access.", lede: "A quick, guided check for common physical barriers to accessibility—no experience required.",
    notice: "It helps identify likely physical barriers to access. It is not a full ADA compliance determination or legal opinion.", subjectLabel: "Site name", subjectPlaceholder: "Community Center", locationLabel: "Address or location", locationPlaceholder: "123 Main Street", prep: ["Tape measure", "Phone level", "Camera"],
    sourceNote: "Adapted as a preliminary screening aid from the 2010 ADA Standards-based ADA Checklist for Existing Facilities and U.S. Department of Justice polling place guidance. Consult the full standards and a qualified accessibility professional for compliance decisions.", sections: physicalSections,
  },
  event: {
    id: "event", version: "2026.1", name: "Event accessibility", description: "Review how people arrive, participate, communicate, and request accommodations.", meta: "About 15 minutes · 16 checks",
    eyebrow: "QUICK EVENT ACCESSIBILITY CHECK-UP", title: "Plan for participation—not workarounds.", lede: "A guided check-up of the information, venue, activities, and communication that shape an accessible event.",
    notice: "It flags common access gaps in event planning and delivery, but is not a comprehensive event accessibility checklist. Applicable duties and the right solution depend on the organizer, venue, event, and needs of attendees.", subjectLabel: "Event name", subjectPlaceholder: "Community Open House", locationLabel: "Venue or location", locationPlaceholder: "Civic Hall or online", prep: ["Event details", "Venue map", "Staff contact"],
    sourceNote: "This preliminary screen draws from U.S. Department of Justice ADA guidance on effective communication, service animals, reasonable modifications, and the 2010 ADA Standards. It does not determine legal compliance or replace an individualized accommodation process.", sections: eventSections,
  },
  digital: {
    id: "digital", version: "2026.1", name: "Digital accessibility", description: "Check common barriers in websites, forms, documents, media, and interactions.", meta: "About 15 minutes · 16 checks",
    eyebrow: "QUICK DIGITAL ACCESSIBILITY CHECK-UP", title: "Make your ideas accessible to everyone.", lede: "A guided check-up for common accessibility barriers of digital content and experiences.",
    notice: "It references high-impact WCAG 2.2 Level A and AA criteria. It is not a conformance audit and cannot replace testing with assistive technology and disabled users.", subjectLabel: "Website or product", subjectPlaceholder: "Registration website", locationLabel: "Page or URL", locationPlaceholder: "https://example.org/register", prep: ["Desktop browser", "Mobile device", "Keyboard"],
    sourceNote: "This preliminary screen references WCAG 2.2 success criteria and U.S. Department of Justice web accessibility guidance. A complete evaluation requires broader automated and manual testing, assistive technology, and representative user testing.", sections: digitalSections,
  },
  voting: {
    id: "voting", version: "2026-GCD-final", name: "Voting accessibility", description: "Survey accessibility at Rhode Island polling places using the complete 2026 GCD volunteer survey.", meta: "About 20 minutes · 20 questions",
    eyebrow: "RHODE ISLAND POLLING PLACE SURVEY", title: "2026 Volunteer On-Site Polling Place Survey", lede: "Record polling place accessibility observations using every item in the Rhode Island survey.",
    notice: "This module preserves the survey wording and is intended for volunteer observations. Record problems, issues, or barriers for follow-up by the appropriate election and accessibility officials.", subjectLabel: "Polling Place Name", subjectPlaceholder: "Polling place name", locationLabel: "Polling Place Address", locationPlaceholder: "Street address", prep: ["Survey instructions", "Tape measure", "Phone or watch"],
    sourceNote: "Questions and checklist items are reproduced from the 2026 Volunteer On-Site Polling Place Survey prepared for Rhode Island polling place access reviews.", sections: votingSections,
  },
};

const modulePreviews = Object.values(modules);

const labels: Record<Result, string> = { pass: "Looks good", attention: "Needs attention", unsure: "Not sure", na: "Not applicable" };
const yesNoLabels: Record<Result, string> = { pass: "Yes", attention: "No", unsure: "Not sure", na: "Not applicable" };

function blankSite(checkupType: ModuleId) {
  return { name: "", address: "", reviewer: "", email: "", volunteerHours: false, municipality: "", precinct: "", time: "", date: new Date().toISOString().slice(0, 10), checkupType, checklistVersion: modules[checkupType].version };
}

function hasAnswer(question: Check, answer?: Answer) {
  if (!answer) return false;
  if (question.responseType === "text" || question.responseType === "number" || question.responseType === "time") return Boolean(answer.value?.trim());
  if (question.responseType === "multi") return Boolean(answer.selections?.length || answer.note?.trim());
  return Boolean(answer.result);
}

export default function Home() {
  const [screen, setScreen] = useState<"landing" | "welcome" | "assessment" | "summary">("landing");
  const [moduleId, setModuleId] = useState<ModuleId>("physical");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [site, setSite] = useState(() => blankSite("physical"));
  const [hydrated, setHydrated] = useState(false);
  const [checkup, setCheckup] = useState<CheckupRef | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitted, setSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");
  const activeModule = modules[moduleId];
  const sections = activeModule.sections;
  const allChecks = useMemo(() => sections.flatMap((s) => s.checks), [sections]);
  const completed = allChecks.filter((q) => hasAnswer(q, answers[q.id])).length;
  const current = sections[sectionIndex];

  useEffect(() => {
    async function restore() {
      try {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const id = hash.get("checkup");
        const token = hash.get("token");
        if (id && token) {
          const response = await fetch(`/api/checkups/${encodeURIComponent(id)}`, { headers: { "X-Edit-Token": token } });
          if (!response.ok) throw new Error("That private checkup link is invalid or has expired.");
          const saved = await response.json();
          const restoredModule = saved.site?.checkupType && saved.site.checkupType in modules ? saved.site.checkupType as ModuleId : "physical";
          setModuleId(restoredModule);
          setCheckup({ id, token });
          setSite((currentSite) => ({ ...currentSite, ...(saved.site || {}), checkupType: restoredModule }));
          setAnswers(saved.answers || {});
          setSectionIndex(saved.section_index || 0);
          setSubmitted(saved.status === "submitted");
          setScreen(saved.status === "submitted" ? "summary" : "assessment");
          setSaveState("saved");
          setLastSaved(saved.updated_at || "");
          return;
        }

      } catch (error) {
        setSaveState("error");
        alert(error instanceof Error ? error.message : "The saved checkup could not be loaded.");
      } finally {
        setHydrated(true);
      }
    }
    restore();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!checkup || submitted) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch(`/api/checkups/${encodeURIComponent(checkup.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Edit-Token": checkup.token },
          body: JSON.stringify({ site, answers, sectionIndex }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const saved = await response.json();
        setSaveState("saved");
        setLastSaved(saved.updated_at || new Date().toISOString());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSaveState("error");
      }
    }, 900);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [answers, site, sectionIndex, checkup, submitted, hydrated, moduleId]);

  function setResult(question: Check, result: Result) {
    setAnswers((old) => ({ ...old, [question.id]: { ...old[question.id], result, questionTitle: question.title } }));
  }

  function reset() {
    if (!confirm("Start a new checkup? Your current checkup will remain available from its private resume link.")) return;
    setAnswers({});
    setSite(blankSite("physical"));
    setModuleId("physical");
    setSectionIndex(0);
    setCheckup(null);
    setSubmitted(false);
    setSaveState("idle");
    setLastSaved("");
    setScreen("landing");
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  function chooseModule(nextModule: ModuleId) {
    setModuleId(nextModule);
    setAnswers({});
    setSectionIndex(0);
    setCheckup(null);
    setSubmitted(false);
    setSaveState("idle");
    setLastSaved("");
    setSite(blankSite(nextModule));
    setScreen("welcome");
    scrollTo(0, 0);
  }

  async function startCheckup() {
    setSaveState("saving");
    try {
      const response = await fetch("/api/checkups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site, answers, sectionIndex: 0 }),
      });
      if (!response.ok) throw new Error();
      const created = await response.json();
      const next = { id: created.id as string, token: created.editToken as string };
      setCheckup(next);
      setSectionIndex(0);
      setScreen("assessment");
      setSaveState("saved");
      setLastSaved(created.updated_at || new Date().toISOString());
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}#checkup=${encodeURIComponent(next.id)}&token=${encodeURIComponent(next.token)}`);
      scrollTo(0, 0);
    } catch {
      setSaveState("error");
      alert("We could not create a saved checkup. Please check your connection and try again.");
    }
  }

  async function submitCheckup() {
    if (!checkup || submitted) return;
    if (!confirm("Submit this checkup? You will still be able to view it, but it can no longer be edited.")) return;
    setSaveState("saving");
    try {
      const response = await fetch(`/api/checkups/${encodeURIComponent(checkup.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Edit-Token": checkup.token },
        body: JSON.stringify({ site, answers, sectionIndex, submit: true }),
      });
      if (!response.ok) throw new Error();
      setSubmitted(true);
      setSaveState("saved");
      setLastSaved(new Date().toISOString());
    } catch {
      setSaveState("error");
      alert("The checkup could not be submitted. Please try again.");
    }
  }

  async function copyResumeLink() {
    await navigator.clipboard.writeText(window.location.href);
    alert(submitted ? "Private results link copied." : "Private resume link copied.");
  }

  function exportAssessment() {
    const rows = allChecks.map((q) => ({ item: q.title, result: answers[q.id]?.result ? (q.responseType === "yesno" ? yesNoLabels[answers[q.id]!.result!] : labels[answers[q.id]!.result!]) : "", response: answers[q.id]?.value || "", selections: answers[q.id]?.selections || [], note: answers[q.id]?.note || "", source: `${q.source.label} ${q.source.sections}`, sourceUrl: q.source.href || "" }));
    const file = new Blob([JSON.stringify({ checkup: activeModule.name, site, completedAt: new Date().toISOString(), results: rows }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `${site.name || "accessibility-assessment"}-${site.date}.json`.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase();
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (!hydrated) return <main className="loading">Preparing your field check…</main>;

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("landing")} aria-label="AccessCheckUp home"><img src="/accesscheck-mark.svg" alt="" /><span>Access<span>CheckUp</span></span></button>
        {screen !== "landing" && screen !== "welcome" && <button className="textButton" onClick={reset}>New check</button>}
      </header>

      {screen === "landing" && (
        <section className="landingPage">
          <div className="landingHero">
            <div className="eyebrow">QUICK ACCESSIBILITY CHECK-UPS</div>
            <h1>Notice barriers. Improve access.</h1>
            <p className="lede">Accessibility helps more people participate independently and with dignity. A quick check can reveal barriers before they exclude someone.</p>
          </div>
          {checkup && <div className="currentCheckup"><div><span>{submitted ? "SAVED RESULTS" : "CHECK-UP IN PROGRESS"}</span><strong>{site.name || activeModule.name}</strong><p>{activeModule.name}</p></div><button onClick={() => setScreen(submitted ? "summary" : "assessment")}>{submitted ? "View results" : "Continue check-up"} →</button></div>}
          <div className="whyGrid" aria-label="Why accessibility matters">
            <div><strong>More participation</strong><p>Accessible places, events, and digital services welcome more people.</p></div>
            <div><strong>More independence</strong><p>Good access lets people take part without unnecessary workarounds.</p></div>
            <div><strong>Better experiences</strong><p>Clearer, more flexible experiences tend to work better for everyone.</p></div>
          </div>
          <div className="moduleHeading"><div><div className="eyebrow">CHOOSE A CHECK-UP</div><h2>What would you like to review?</h2></div><p>Each module is a guided preliminary screen—not a full compliance determination.</p></div>
          <div className="moduleGrid">
            {modulePreviews.map((module) => <article className="moduleCard" key={module.id}>
              <h3>{module.name}</h3><p>{module.description}</p><div className="moduleMeta">{module.meta}</div>
              <button className="moduleAction" onClick={() => chooseModule(module.id)}>Start this check-up<span>→</span></button>
            </article>)}
          </div>
        </section>
      )}

      {screen === "welcome" && (
        <section className="welcome">
          <button className="backToModules" onClick={() => setScreen("landing")}>← All check-ups</button>
          <div className="eyebrow">{activeModule.eyebrow}</div>
          <h1>{activeModule.title}</h1>
          <p className="lede">{activeModule.lede}</p>
          <div className="notice"><strong>This is a preliminary screening tool.</strong><span>{activeModule.notice}</span></div>
          {moduleId === "voting" && <h2 className="formSectionTitle">Section One</h2>}
          <div className="siteForm">
            <label>{activeModule.subjectLabel}<input value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })} placeholder={activeModule.subjectPlaceholder} /></label>
            <label>{activeModule.locationLabel}<input value={site.address} onChange={(e) => setSite({ ...site, address: e.target.value })} placeholder={activeModule.locationPlaceholder} /></label>
            {moduleId === "voting" && <div className="fieldRow">
              <label>City/ Municipality<input value={site.municipality} onChange={(e) => setSite({ ...site, municipality: e.target.value })} /></label>
              <label>Precinct #<input value={site.precinct} onChange={(e) => setSite({ ...site, precinct: e.target.value })} /></label>
            </div>}
            <div className="fieldRow">
              <label>{moduleId === "voting" ? "Surveyor Name" : "Your name"}<small>Optional</small><input value={site.reviewer} onChange={(e) => setSite({ ...site, reviewer: e.target.value })} placeholder="Your name" /></label>
              <label>Email address<small>Optional</small><input type="email" value={site.email} onChange={(e) => setSite({ ...site, email: e.target.value })} placeholder="you@example.org" /></label>
            </div>
            <div className="fieldRow">
              <label>Date<input type="date" value={site.date} onChange={(e) => setSite({ ...site, date: e.target.value })} /></label>
              {moduleId === "voting" && <label>Time of Survey<input type="time" value={site.time} onChange={(e) => setSite({ ...site, time: e.target.value })} /></label>}
            </div>
            <label className="volunteerChoice"><input type="checkbox" checked={site.volunteerHours} onChange={(e) => setSite({ ...site, volunteerHours: e.target.checked })} /><span>I’m completing this checkup for volunteer or service hours.</span></label>
            <p className="privacyHint">Your name and email are optional. If provided, they may be used for follow-up questions and to connect you with this checkup for volunteer-hour verification. Contact details are kept out of public summaries.</p>
          </div>
          <button className="primary" disabled={saveState === "saving"} onClick={startCheckup}>{saveState === "saving" ? "Creating saved checkup…" : completed ? "Save and continue draft" : "Start the check-up"}<span>→</span></button>
          <div className="bring"><span>Helpful</span>{activeModule.prep.map((item) => <b key={item}>{item}</b>)}</div>
        </section>
      )}

      {screen === "assessment" && (
        <section className="assessment">
          <div className={`saveBar ${saveState}`}><span>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved — check your connection" : `Saved${lastSaved ? ` ${new Date(lastSaved).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`}</span><button onClick={copyResumeLink}>Copy private resume link</button></div>
          <div className="progressMeta"><span>{completed} of {allChecks.length} checked</span><span>{Math.round((completed / allChecks.length) * 100)}%</span></div>
          <div className="progress"><i style={{ width: `${(completed / allChecks.length) * 100}%` }} /></div>
          <nav className="steps" aria-label="Assessment sections">
            {sections.map((s, i) => <button key={s.id} className={i === sectionIndex ? "active" : i < sectionIndex ? "done" : ""} onClick={() => setSectionIndex(i)}><span>{i < sectionIndex ? "✓" : i + 1}</span>{s.short}</button>)}
          </nav>
          <div className="moduleContext"><span>{activeModule.name}</span></div>
          <div className="sectionHead"><div><div className="eyebrow">SECTION {sectionIndex + 1} OF {sections.length}</div><h2>{current.name}</h2></div><div className="sectionNumber">0{sectionIndex + 1}</div></div>
          <p className="intro">{current.intro}</p>
          <div className="checks">
            {current.checks.map((q, index) => {
              const answer = answers[q.id] || {};
              return <article className={`checkCard ${answer.result || ""}`} key={q.id}>
                <div className="questionTop"><span className="questionNumber">{moduleId === "voting" ? q.id.replace("ri", "") : `${sectionIndex + 1}.${index + 1}`}</span>{q.critical && <span className="priority">Priority check</span>}</div>
                <h3>{q.title}</h3>{q.prompt && <p>{q.prompt}</p>}
                {q.source.href ? <a className="citation" href={q.source.href} target="_blank" rel="noreferrer" aria-label={`Source: ${q.source.label} ${q.source.sections}`}><span>Source</span> {q.source.label} {q.source.sections} ↗</a> : <div className="citation"><span>Source</span> {q.source.label} {q.source.sections}</div>}
                {(q.measure || q.why) && <details><summary>Quick guidance</summary><div>{q.measure || q.why}</div></details>}
                {(q.responseType === "text" || q.responseType === "number" || q.responseType === "time") ? <label className="directAnswer">Response<input type={q.responseType === "text" ? "text" : q.responseType} min={q.responseType === "number" ? "0" : undefined} value={answer.value || ""} onChange={(e) => setAnswers((old) => ({ ...old, [q.id]: { ...old[q.id], value: e.target.value, questionTitle: q.title } }))} /></label> : q.responseType === "multi" ? <fieldset className="checklistAnswers"><legend>Select all that apply</legend>
                  {q.options?.map((option) => <label key={option}><input type="checkbox" checked={answer.selections?.includes(option) || false} onChange={(e) => setAnswers((old) => { const selected = new Set(old[q.id]?.selections || []); if (e.target.checked) selected.add(option); else selected.delete(option); return { ...old, [q.id]: { ...old[q.id], selections: [...selected], questionTitle: q.title } }; })} /><span>{option}</span></label>)}
                </fieldset> : <fieldset><legend>Choose a result for {q.title}</legend>
                  {(["pass", "attention", "unsure", "na"] as Result[]).map((r) => <button type="button" key={r} className={answer.result === r ? "selected" : ""} onClick={() => setResult(q, r)}><span>{r === "pass" ? "✓" : r === "attention" ? "!" : r === "unsure" ? "?" : "–"}</span>{q.responseType === "yesno" ? yesNoLabels[r] : labels[r]}</button>)}
                </fieldset>}
                <label className="noteLabel">Note or observation (optional)<textarea value={answer.note || ""} onChange={(e) => setAnswers((old) => ({ ...old, [q.id]: { ...old[q.id], note: e.target.value, questionTitle: q.title } }))} placeholder={moduleId === "physical" ? "e.g., doorway measured 29 in" : "Add what you observed"} /></label>
              </article>;
            })}
          </div>
          <div className="sectionNav">
            <button className="secondary" disabled={sectionIndex === 0} onClick={() => { setSectionIndex(sectionIndex - 1); scrollTo(0, 0); }}>← Back</button>
            <button className="primary" onClick={() => { if (sectionIndex < sections.length - 1) { setSectionIndex(sectionIndex + 1); scrollTo(0, 0); } else { setScreen("summary"); scrollTo(0, 0); } }}>{sectionIndex === sections.length - 1 ? "View summary" : "Next section"}<span>→</span></button>
          </div>
        </section>
      )}

      {screen === "summary" && (() => {
        const issues = allChecks.filter((q) => answers[q.id]?.result === "attention");
        const unsure = allChecks.filter((q) => answers[q.id]?.result === "unsure" || !hasAnswer(q, answers[q.id]));
        const passes = allChecks.filter((q) => answers[q.id]?.result === "pass");
        return <section className="summaryPage">
          <div className="eyebrow">{activeModule.name.toUpperCase()} SUMMARY</div><h1>{site.name || `${activeModule.name} assessment`}</h1><p className="summaryMeta">{site.address || "No location entered"} · {site.date}</p>
          <div className="scoreGrid"><div className="issueScore"><strong>{issues.length}</strong><span>need attention</span></div><div><strong>{unsure.length}</strong><span>not sure / incomplete</span></div><div><strong>{passes.length}</strong><span>look good</span></div></div>
          <div className="summaryNotice"><strong>What this means</strong><p>Items marked “needs attention” are good candidates for closer review and barrier-removal planning. “Looks good” means no obvious barrier was found during this quick check—not that full compliance was verified.</p></div>
          <h2>Items to follow up</h2>
          {issues.length === 0 ? <div className="empty">No items are marked “needs attention.” Review the uncertain or unanswered checks before closing the assessment.</div> : <div className="issueList">{issues.map((q) => <article key={q.id}><span>!</span><div><h3>{q.title}</h3><p>{answers[q.id]?.note || q.prompt || "No note entered."}</p>{q.source.href ? <a className="citation" href={q.source.href} target="_blank" rel="noreferrer">{q.source.label} {q.source.sections} ↗</a> : <div className="citation">{q.source.label} {q.source.sections}</div>}</div></article>)}</div>}
          {unsure.length > 0 && <details className="uncertain"><summary>{unsure.length} uncertain or incomplete checks</summary><ul>{unsure.map((q) => <li key={q.id}>{q.title}</li>)}</ul></details>}
          <div className={`submissionNotice ${submitted ? "submitted" : ""}`}><strong>{submitted ? "Checkup submitted" : "Ready to submit?"}</strong><p>{submitted ? "This saved checkup is now read-only. Keep the private link to return to these results." : "Submitting locks this checkup so the saved results cannot be accidentally changed."}</p><button className="secondary" onClick={copyResumeLink}>{submitted ? "Copy private results link" : "Copy private resume link"}</button></div>
          <div className="summaryActions">{!submitted && <button className="primary" disabled={saveState === "saving"} onClick={submitCheckup}>Submit checkup <span>✓</span></button>}<button className="secondary" onClick={exportAssessment}>Export results</button><button className="secondary" onClick={() => window.print()}>Print / save PDF</button>{!submitted && <button className="textButton" onClick={() => setScreen("assessment")}>Return to assessment</button>}</div>
          <p className="sourceNote">{activeModule.sourceNote}</p>
        </section>;
      })()}
      <footer><span>AccessCheckUp</span><p>Quick screening tools for more welcoming experiences.</p></footer>
    </main>
  );
}
