Create a **Dashboard UI for the Rumi platform** that appears **after the user completes profile setup**.

The dashboard must follow a **modern SaaS layout** similar to the provided dashboard reference, with **multiple containers/cards arranged in a structured grid layout**.

Keep the **existing Rumi color palette and typography exactly the same** as used in the landing page, signup flow, and onboarding screens. Do not modify any styles outside the dashboard.

The UI must feel **minimal, professional, and clean**, like a modern SaaS product.

---

### Layout Structure

Create a **three-part layout**:

1. **Left Sidebar Navigation**
2. **Top Navbar**
3. **Main Dashboard Grid**

Use **soft shadows, rounded containers, and card layouts** similar to the dashboard reference image.

---

# Sidebar Navigation

Place a **minimal vertical sidebar on the left**.

Top section:
Rumi logo

Navigation items:

• Dashboard (active)
• Discover Matches
• Requests
• Messages
• Profile
• Settings

Icons should be minimal outline icons.

Active state uses **Rumi navy highlight**.

Bottom section:
Logout button

---

# Top Navbar

Add a **top navbar similar to a SaaS dashboard**.

Left side:
Page title: **Dashboard**

Center:
Search bar
Placeholder: *Search users, localities, preferences*

Right side:

• Notification bell
• Settings icon
• Profile avatar dropdown

Keep navbar minimal with **soft glass-style container**.

---

# Main Dashboard Layout

Use a **grid layout with multiple containers** similar to the dashboard reference.

Grid structure:

Left side (primary focus area):
Swipe matching interface

Right side:
Information cards

---

# Main Container — Discover Matches

Title:

Discover Matches
Subtitle: Swipe right to connect, left to pass

Inside the container:

Create a **stacked swipe card interface** (like Tinder/Bumble).

Cards must appear **stacked with depth**.

Top card contains:

Profile image
Compatibility badge (top-left corner)

Example badge:
**95% Match**

Profile info:

Name + age
Short bio
Lifestyle tags

Example tags:

Clean & Tidy
Early Riser
Non-Smoker

Budget display:
Budget: ₹800/month

Below the card:

Two circular buttons

Reject button (red outline X)

Like button (green heart)

Interaction logic:

Reject → card animates left and disappears
Like → card animates right and disappears

Next card moves to the top of the stack.

---

# Container — Matches & Requests

Create a container on the right side.

Title:
Matches

Sections inside the container:

REQUESTS SENT

If empty:
Display text
"No requests sent yet"

REQUESTS RECEIVED

Show user cards with:

Profile avatar
Name and age
Compatibility percentage

Example:

Oliver Davis, 26
87% Match

Button:
Accept & Chat

When accepted:
Move user to matches and open chat access.

---

# Container — Quick Actions

Another container below the matches section.

Title:
Quick Actions

Cards inside:

View Messages
Subtitle: 3 unread

Edit Preferences
Subtitle: Update your match criteria

Complete Profile
Subtitle: 20% remaining

Use soft colored icons and rounded mini cards.

---

# Matching Logic Representation (UI Simulation)

For UI prototype purposes simulate this logic:

Compatibility score calculated using:

• Budget compatibility
• Location proximity
• Lifestyle similarity
• Work schedule compatibility

Swipe actions:

Like → sends connection request
Reject → removes candidate

Connection states:

Pending request
Accepted match
Rejected request

When both users like each other:
Move to **Matches** and enable chat.

---

# Design Style

Follow these design principles:

• Minimal SaaS dashboard style
• Soft shadows
• Rounded containers
• Balanced spacing
• Clean typography
• Card-based layout

The swipe interface must be the **main visual focus of the dashboard**.

---

# Important Constraint

Do not change:

Landing page
Signup UI
Profile setup flow
Color palette
Typography

Only create the **dashboard layout and components**.
