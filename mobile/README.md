# BPSL Admin - Mobile App

This is the React Native (Expo) version of the BPSL Admin dashboard.

## Setup

1.  Navigate to the mobile directory:
    ```bash
    cd mobile
    ```

2.  Install dependencies (if not already installed):
    ```bash
    npm install
    ```

## Running the App

1.  Start the development server:
    ```bash
    npx expo start
    ```

2.  Scan the QR code with the **Expo Go** app on your Android or iOS device.

## Features

*   **Dashboard**: View stats and upcoming birthdays.
*   **Members**: Browse, search, and filter members.
*   **Timeline**: Infinite scroll birthday timeline.
*   **Birthday Card Generator**: Generate and share birthday wishes (saved as images).
*   **Google Sheets Integration**: Fetches data from the same Google Apps Script backend as the web app.

## Notes

*   The app uses `nativewind` for styling (Tailwind CSS).
*   It uses `lucide-react-native` for icons.
*   It uses `react-native-view-shot` for generating images.
