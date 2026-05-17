# Community Beacon App
[**Website Link**]([https://urban-lamp-9qjr69xg9qrc9xw-5173.app.github.dev/](https://urban-lamp-9qjr69xg9qrc9xw-5173.app.github.dev/)

[**Code Link**](https://vscode.dev/editor/liveshare/A928943E1B388836E43A6F34093E0FEF08C8)
### *Disaster Response & Resilience Track -- Hackathon 2026*
A text- and call- based two-way communication system designed to keep communitites connected during natural disasters, even in low-signal environments.

### Overview
Community Beacon is a mobile-first disaster communication platform that empowers residents to receive alerts, report emergencies, and request help through SMS, calls, or app-based interaction. It is designed to be inclusive, supporting smartphone users, dumbphone users, and landline users alike.

By relying on text and voice, the system remains functional even when WiFi and data networks fail.

### Core Problem 
During natural disasters, communication networks fail, leaving vulnerable populations without access to help. Existing systems often rely on:
- Internet connectivity
- Smartphone ownership
- Centralized reporting
Community Beacon solves this by enabling distributed, low-bandwidth, two-way communication that feeds into a shared community map.

### Key Features
- **Two-Way Communication**
  Users can reply to alerts with their status. Their response becomes a ticket on the community map.

- **SMS + Call Support**
  Ensuring accessibility in low-signal areas.

- **Advance Notice Alerts**
  Integrates NOAA data to push early warnings.

- **Community Map**
  Displays active emergenies, volunteer responses, and resolved cases.

- **Emergency Guidance Page**
  Offline-friendly instructions for what to do in various disaster scenarios.

- **Opt-in / Opt-out System**
  Users control their participation.

### Ticket System
Each user report becomes a ticket with:
- **Location**
    - Smartphone users: GPS
    - Dumbphone users: text-based location
    - Landline users: call-based AI agent
      
- **Status**
    - Active
    - Pending (volunteer en route)
    - Resolved

- **Emergency Classification**
    - Medical
    - Hazards/Obstructions
    - Food/Water
    - Transportation
    - Other

### How It Works
1. Disaster alert arrives from NOAA
2. Users receive SMS or call with the alert
3. Users may post their status which becomes a ticket
4. Ticket appears on the community map
5. Volunteers can mark tickets as pending and provide help
6. Users confirm when the issue is resolved
