SHANAL · 21 — CINEMATIC BIRTHDAY EXPERIENCE

FILES
- index.html: page structure and controls
- style.css: visual design, elevator, camera and transitions
- script.js: timeline, audio, image loading and restart logic
- assets/images/penthouse-interior.png: selected high-resolution penthouse photograph
- assets/audio/: optional audio files (see below)

HOW TO RUN
1. Extract the entire shanal-birthday folder.
2. Keep the folder structure intact.
3. Double-click index.html to preview, or use VS Code with the Live Server extension.
4. Click Enter. Browsers require a click before audio can start.

VISUAL NOTE
The selected penthouse image already contains the golden fireworks and the words HAPPY BIRTHDAY SHANAL. The code therefore does not draw a second set of fireworks or duplicate the lettering over the photograph. The elevator opens to reveal the photographic celebration scene. The camera movement and subtle light pulse are CSS effects; this is a cinematic 2D web experience, not a real 3D scene.

OPTIONAL AUDIO
Place your own licensed audio files in assets/audio/ with these exact names:
- elevator-ambience.mp3
- elevator-bell.mp3
- background-music.mp3
- firework.mp3

The experience still works without audio files. If an audio file is missing or unsupported, the visual experience continues.

CUSTOMIZATION
To use a different penthouse image, replace assets/images/penthouse-interior.png with another image using the same filename. The birthday wording is baked into the selected photograph, so changing the name requires replacing that image too.

NOTES
- The image is a generated high-resolution photograph-style scene, not a live 3D environment.
- Google Fonts requires an internet connection; Georgia is used as a fallback.


DISPLAY FIX:
The penthouse image now uses contain so the full birthday lettering remains visible on wide screens. A softly blurred copy fills the unused side areas. The camera zoom has also been reduced to avoid cropping the top text.

LATEST FIX:
- Removed the oval/circular wall cutout around the elevator. The elevator surround is now built from four straight rectangular wall panels.
- The wall panels fade away as the camera moves into the penthouse.
- Removed the small "Begin the experience" subtitle. The opening button now displays only ENTER.

LATEST TRANSITION FIX:
- The elevator side walls now slide outward at the same time as the two elevator doors.
- The ceiling and floor surround slide vertically out of frame at the same time.
- Removed the mobile-only whole-wall scaling that could leave large black areas.
- Removed the oversized doorway zoom; the penthouse camera now provides the forward movement.
- The elevator frame fades away only after the surround has cleared.

LATEST VISUAL UPDATE:
- Consolidated the elevator into one continuous wall with one central doorway (no second outer opening).
- The two elevator door leaves slide apart inside that single doorway.
- Added a canvas fireworks system: rockets launch upward from the skyline, leave glowing trails, burst into gold/champagne sparks, and fade naturally.
- Fireworks begin after the penthouse reveal and stop cleanly on restart.
