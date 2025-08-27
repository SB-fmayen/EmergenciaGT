# **App Name**: EmergenciaGT

## Core Features:

- Authentication: Provides login and registration using Firebase Authentication.
- Medical Information Form: Allows users to input and store medical information, including blood type, conditions, allergies, and medications. The information will be saved into Firestore.
- Panic Button: A prominent, long-press activated panic button that sends the user's location, event type, and timestamp to Firebase. Supports high accuracy geolocation and handles offline scenarios using local queueing.
- Alert Status Screen: Displays the status of an alert, including its ID, assigned station, estimated time of arrival (ETA), and communication channel details. Updates in real-time via push notifications.
- Generative AI Assistant: Utilizes a generative AI tool to provide dynamic suggestions to first responders and station operators, using available data about the emergency, and the patient medical history (when available)

## Style Guidelines:

- Primary color: Deep red (#B91C1C), evoking a sense of urgency and emergency.
- Background color: Dark gray (#1E293B), provides contrast and a modern feel.
- Accent color: Light red (#EF4444), used for highlights and calls to action.
- Font: 'Inter', a versatile sans-serif for both headings and body text.
- Use clear, recognizable icons from a library like Material Icons for alerts, medical information, and other UI elements.
- Employ a responsive layout using `ResponsiveLayout` to adapt seamlessly to different screen sizes.
- Incorporate subtle animations, such as fade-in effects and transitions, to enhance user experience.